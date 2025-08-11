import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User, Database, Shield, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { supportedDatabaseProviders, databaseProviderInfo } from "@shared/database-config";

const adminSetupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const databaseSetupSchema = z.object({
  provider: z.enum(supportedDatabaseProviders),
  name: z.string().min(1, "Database name is required"),
  host: z.string().optional(),
  port: z.string().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
});

type AdminSetupForm = z.infer<typeof adminSetupSchema>;
type DatabaseSetupForm = z.infer<typeof databaseSetupSchema>;

interface InitializationWizardProps {
  onComplete: () => void;
}

export default function InitializationWizard({ onComplete }: InitializationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [adminData, setAdminData] = useState<AdminSetupForm | null>(null);

  const adminForm = useForm<AdminSetupForm>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const databaseForm = useForm<DatabaseSetupForm>({
    resolver: zodResolver(databaseSetupSchema),
    defaultValues: {
      provider: "sqlite",
      name: "Main Database",
    },
  });

  const selectedProvider = databaseForm.watch("provider");
  const providerInfo = databaseProviderInfo[selectedProvider];

  // Test database connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: DatabaseSetupForm) => {
      return apiRequest("/api/initialization/test-database", {
        method: "POST",
        body: data,
      });
    },
  });

  // Initialize application mutation
  const initializationMutation = useMutation({
    mutationFn: async (data: { admin: AdminSetupForm; database: DatabaseSetupForm }) => {
      const response = await apiRequest("POST", "/api/initialization", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Initialization Complete",
        description: "Your finance tracker has been set up successfully!",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize the application",
        variant: "destructive",
      });
    },
  });

  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [hasTestedConnection, setHasTestedConnection] = useState(false);

  const handleAdminSubmit = (data: AdminSetupForm) => {
    setAdminData(data);
    setCurrentStep(2);
  };

  const handleTestConnection = async () => {
    const data = databaseForm.getValues();
    setHasTestedConnection(false);
    setConnectionTestResult(null);
    
    try {
      const result = await testConnectionMutation.mutateAsync(data);
      setConnectionTestResult(result);
      setHasTestedConnection(true);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Database connection test passed!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to database",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorResult = { success: false, error: error.message || "Connection test failed" };
      setConnectionTestResult(errorResult);
      setHasTestedConnection(true);
      toast({
        title: "Connection Failed",
        description: errorResult.error,
        variant: "destructive",
      });
    }
  };

  const handleDatabaseSubmit = (data: DatabaseSetupForm) => {
    if (adminData) {
      // For non-SQLite providers, require successful connection test
      if (data.provider !== 'sqlite' && (!hasTestedConnection || !connectionTestResult?.success)) {
        toast({
          title: "Connection Test Required",
          description: "Please test your database connection before proceeding",
          variant: "destructive",
        });
        return;
      }

      initializationMutation.mutate({
        admin: adminData,
        database: data,
      });
    }
  };

  const renderProviderFields = () => {
    if (selectedProvider === "sqlite") return null;

    return (
      <div className="space-y-4">
        {selectedProvider === "neon" || selectedProvider === "planetscale" || selectedProvider === "supabase" ? (
          <FormField
            control={databaseForm.control}
            name="connectionString"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection String</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={`${selectedProvider === "neon" ? "postgresql" : selectedProvider === "planetscale" ? "mysql" : "postgresql"}://username:password@host/database`}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your {providerInfo.name} connection string from the dashboard
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={databaseForm.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="localhost" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={databaseForm.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder={providerInfo.defaultPort?.toString() || ""} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={databaseForm.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder={selectedProvider === "mysql" ? "mysql" : "postgres"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={databaseForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder={selectedProvider === "mysql" ? "root" : "postgres"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={databaseForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Finance Tracker</CardTitle>
          <CardDescription>
            Let's set up your personal finance management system
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium">Admin Setup</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                <Database className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Database Setup</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 1 && (
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Create Administrator Account</h3>
                  <p className="text-sm text-muted-foreground">
                    This account will have full access to manage the system
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={adminForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={adminForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be used to log into the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Continue to Database Setup
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </Form>
          )}

          {currentStep === 2 && (
            <Form {...databaseForm}>
              <form onSubmit={databaseForm.handleSubmit(handleDatabaseSubmit)} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Choose Database Provider</h3>
                  <p className="text-sm text-muted-foreground">
                    Select and configure your preferred database system
                  </p>
                </div>

                <FormField
                  control={databaseForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Database" {...field} />
                      </FormControl>
                      <FormDescription>
                        A friendly name for your database configuration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={databaseForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a database provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supportedDatabaseProviders.map((provider) => {
                            const info = databaseProviderInfo[provider];
                            return (
                              <SelectItem key={provider} value={provider}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{info.name}</span>
                                  {provider === "sqlite" && (
                                    <Badge variant="secondary" className="ml-2">Recommended</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {providerInfo.description}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {renderProviderFields()}

                <Separator />

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={initializationMutation.isPending}
                  >
                    {initializationMutation.isPending ? "Setting up..." : "Complete Setup"}
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}