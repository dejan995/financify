import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Database, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DatabaseConfig, databaseProviderInfo } from "@shared/database-config";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

const migrationSchema = z.object({
  fromConfigId: z.string().optional(),
  toConfigId: z.string().min(1, "Target database is required"),
});

type MigrationData = z.infer<typeof migrationSchema>;

interface DataMigrationFormProps {
  databases: DatabaseConfig[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DataMigrationForm({ databases, onClose, onSuccess }: DataMigrationFormProps) {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  
  const form = useForm<MigrationData>({
    resolver: zodResolver(migrationSchema),
    defaultValues: {
      fromConfigId: "",
      toConfigId: "",
    },
  });

  const migrationMutation = useMutation({
    mutationFn: (data: MigrationData) => apiRequest("/api/admin/databases/migrate", "POST", data),
    onSuccess: (data: any) => {
      toast({
        title: "Migration Started",
        description: `Data migration has been initiated. Migration ID: ${data.migrationId}`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to start data migration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MigrationData) => {
    migrationMutation.mutate(data);
  };

  const connectedDatabases = databases.filter(db => db.isConnected);
  const sourceOptions = [
    { id: "", name: "Current Memory Storage", provider: "memory" },
    ...connectedDatabases.filter(db => db.id !== selectedTarget)
  ];
  const targetOptions = connectedDatabases.filter(db => db.id !== selectedSource);

  const getSourceInfo = () => {
    if (!selectedSource) {
      return {
        name: "Current Memory Storage",
        description: "Data currently stored in application memory"
      };
    }
    
    const db = databases.find(d => d.id === selectedSource);
    return {
      name: db?.name || "Unknown",
      description: db ? databaseProviderInfo[db.provider].description : ""
    };
  };

  const getTargetInfo = () => {
    if (!selectedTarget) return null;
    
    const db = databases.find(d => d.id === selectedTarget);
    return {
      name: db?.name || "Unknown",
      description: db ? databaseProviderInfo[db.provider].description : ""
    };
  };

  const sourceInfo = getSourceInfo();
  const targetInfo = getTargetInfo();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Migrate Data Between Databases</DialogTitle>
          <DialogDescription>
            Transfer all your financial data from one database to another. This process will copy users, 
            accounts, transactions, budgets, goals, bills, and other data.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This operation will copy data to the target database. 
            Existing data in the target database may be overwritten. Ensure you have backups before proceeding.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="fromConfigId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Database</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSource(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source database" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{option.name}</span>
                                {'provider' in option && option.provider !== 'memory' && (
                                  <span className="text-xs text-gray-500">
                                    {databaseProviderInfo[option.provider as keyof typeof databaseProviderInfo]?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the database to migrate data from, or leave empty to migrate from memory storage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>

              <FormField
                control={form.control}
                name="toConfigId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Database</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTarget(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target database" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {targetOptions.map((db) => (
                          <SelectItem key={db.id} value={db.id}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{db.name}</span>
                                <span className="text-xs text-gray-500">
                                  {databaseProviderInfo[db.provider].name}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the database where data should be migrated to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Migration Preview */}
            {(selectedSource !== "" || selectedTarget !== "") && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h4 className="font-medium mb-3">Migration Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">From:</span>
                    <span className="font-medium">{sourceInfo.name}</span>
                  </div>
                  {targetInfo && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">To:</span>
                      <span className="font-medium">{targetInfo.name}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      This will migrate all users, accounts, transactions, budgets, goals, bills, categories, and products.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={migrationMutation.isPending || !selectedTarget}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {migrationMutation.isPending ? "Starting Migration..." : "Start Migration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}