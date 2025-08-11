import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { DatabaseConfig, insertDatabaseConfigSchema, supportedDatabaseProviders, databaseProviderInfo } from "@shared/database-config";
import { z } from "zod";

const formSchema = insertDatabaseConfigSchema.extend({
  connectionString: z.string().min(1, "Connection string is required"),
});

type FormData = z.infer<typeof formSchema>;

interface DatabaseConfigFormProps {
  config?: DatabaseConfig | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DatabaseConfigForm({ config, onClose, onSuccess }: DatabaseConfigFormProps) {
  const [selectedProvider, setSelectedProvider] = useState(config?.provider || "neon");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: config?.name || "",
      provider: config?.provider || "neon",
      connectionString: config?.connectionString || "",
      isActive: config?.isActive || false,
      ssl: config?.ssl ?? true,
      maxConnections: config?.maxConnections || 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/admin/databases", data),
    onSuccess: () => {
      toast({
        title: "Database Added",
        description: "Database configuration created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Database",
        description: error.message || "Failed to create database configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PUT", `/api/admin/databases/${config?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Database Updated",
        description: "Database configuration updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Database",
        description: error.message || "Failed to update database configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (config) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getConnectionStringPlaceholder = (provider: string) => {
    const info = databaseProviderInfo[provider as keyof typeof databaseProviderInfo];
    return info?.connectionStringFormat || "Enter connection string";
  };

  const getConnectionStringHelp = (provider: string) => {
    switch (provider) {
      case 'neon':
        return 'Get from Neon Console → Database → Connection Details → Connection string';
      case 'planetscale':
        return 'Get from PlanetScale Console → Database → Connect → General → Connection strings';
      case 'supabase':
        return 'Get from Supabase Dashboard → Settings → Database → Connection string → URI';
      case 'postgresql':
        return 'Format: postgresql://username:password@hostname:port/database';
      case 'mysql':
        return 'Format: mysql://username:password@hostname:port/database';
      case 'sqlite':
        return 'Format: file:path/to/database.db (local file path)';
      default:
        return 'Refer to your provider\'s documentation for connection string format';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {config ? "Edit Database Configuration" : "Add Database Configuration"}
          </DialogTitle>
          <DialogDescription>
            Configure a new database connection. The connection will be tested before saving.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production DB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProvider(value as typeof selectedProvider);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedDatabaseProviders.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            <div className="flex flex-col">
                              <span>{databaseProviderInfo[provider].name}</span>
                              <span className="text-xs text-gray-500">
                                {databaseProviderInfo[provider].description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="connectionString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection String</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder={getConnectionStringPlaceholder(selectedProvider)}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {getConnectionStringHelp(selectedProvider)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxConnections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Connections</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormDescription>Maximum number of concurrent connections</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                {databaseProviderInfo[selectedProvider as keyof typeof databaseProviderInfo]?.supportsSsl && (
                  <FormField
                    control={form.control}
                    name="ssl"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>SSL Connection</FormLabel>
                          <FormDescription>Use SSL for secure connections</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Set as Active</FormLabel>
                        <FormDescription>
                          Make this the active database connection
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : config ? "Update" : "Add"} Database
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}