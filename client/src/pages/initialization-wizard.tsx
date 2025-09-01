import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  User, Database, Shield, CheckCircle, ArrowRight, ArrowLeft, Loader2, 
  AlertTriangle, CheckCircle2, Settings, Cloud, HardDrive, Zap, 
  Globe, Server, FileText, Copy, ExternalLink, Info
} from "lucide-react";
import { supportedDatabaseProviders, databaseProviderInfo } from "@shared/database-config";
import { 
  adminSetupSchema, 
  databaseSetupSchema, 
  AdminSetupData, 
  DatabaseSetupData,
  validateDatabaseConfig 
} from "@shared/initialization-config";

interface InitializationWizardProps {
  onComplete: () => void;
}

export default function InitializationWizard({ onComplete }: InitializationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [adminData, setAdminData] = useState<AdminSetupData | null>(null);
  const [deploymentContext, setDeploymentContext] = useState<any>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [hasTestedConnection, setHasTestedConnection] = useState(false);
  const [setupRecommendations, setSetupRecommendations] = useState<any>(null);

  const adminForm = useForm<AdminSetupData>({
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

  const databaseForm = useForm<DatabaseSetupData>({
    resolver: zodResolver(databaseSetupSchema),
    defaultValues: {
      provider: "sqlite",
      name: "Main Database",
      ssl: true,
      maxConnections: 10,
      generateEnvFile: true,
      useExistingEnv: false,
      supabaseUrl: "",
      supabaseAnonKey: "",
      supabaseServiceKey: "",
      connectionString: "",
      host: "",
      port: "",
      database: "",
      username: "",
      password: "",
      mysqlHost: "",
      mysqlPort: "",
      mysqlDatabase: "",
      mysqlUsername: "",
      mysqlPassword: "",
    },
  });

  const selectedProvider = databaseForm.watch("provider");
  const providerInfo = databaseProviderInfo[selectedProvider];

  // Fetch deployment context on component mount
  useState(() => {
    fetch('/api/initialization/deployment-context')
      .then(res => res.json())
      .then(data => {
        setDeploymentContext(data);
        if (data.recommendations) {
          setSetupRecommendations(data.recommendations);
        }
      })
      .catch(console.error);
  });

  // Test database connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: DatabaseSetupData) => {
      const response = await fetch("/api/initialization/test-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  // Initialize application mutation
  const initializationMutation = useMutation({
    mutationFn: async (data: { admin: AdminSetupData; database: DatabaseSetupData }) => {
      const response = await fetch("/api/initialization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Initialization failed');
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Initialization Complete",
        description: "Your finance tracker has been set up successfully!",
      });
      onComplete();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to initialize the application";
      toast({
        title: "Initialization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAdminSubmit = (data: AdminSetupData) => {
    setAdminData(data);
    setCurrentStep(2);
  };

  const handleTestConnection = async () => {
    const formData = databaseForm.getValues();
    
    // Validate form data
    const validation = validateDatabaseConfig(formData);
    if (!validation.isValid) {
      toast({
        title: "Configuration Invalid",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }
    
    setHasTestedConnection(false);
    setConnectionTestResult(null);
    
    try {
      const result = await testConnectionMutation.mutateAsync(formData);
      setConnectionTestResult(result);
      setHasTestedConnection(true);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected in ${result.latency}ms. ${result.details?.version || ''}`,
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

  const handleDatabaseSubmit = (data: DatabaseSetupData) => {
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

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'supabase': return <Cloud className="w-5 h-5" />;
      case 'neon': return <Zap className="w-5 h-5" />;
      case 'planetscale': return <Globe className="w-5 h-5" />;
      case 'postgresql': return <Database className="w-5 h-5" />;
      case 'mysql': return <Server className="w-5 h-5" />;
      case 'sqlite': return <HardDrive className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const renderProviderFields = () => {
    if (selectedProvider === "sqlite") return null;

    return (
      <div className="space-y-4">
        {selectedProvider === "supabase" ? (
          <>
            <FormField
              control={databaseForm.control}
              name="supabaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supabase Project URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="https://abcdefghijklmnop.supabase.co"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Supabase project URL from the dashboard
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={databaseForm.control}
              name="supabaseAnonKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supabase Anonymous Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Public API key from Settings → API → Project API keys
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={databaseForm.control}
              name="supabaseServiceKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supabase Service Role Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Service role key from Settings → API → Service Role Key (required for table creation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (selectedProvider === "neon" || selectedProvider === "planetscale") ? (
          <FormField
            control={databaseForm.control}
            name="connectionString"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection String</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={selectedProvider === "neon" 
                      ? "postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
                      : "mysql://username:password@aws.connect.psdb.cloud/database?ssl={\"rejectUnauthorized\":true}"
                    }
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Get this from your {providerInfo.name} dashboard → Connection Details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : selectedProvider === "postgresql" ? (
          <Tabs defaultValue="connection-string" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connection-string">Connection String</TabsTrigger>
              <TabsTrigger value="individual-fields">Individual Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection-string" className="space-y-4">
              <FormField
                control={databaseForm.control}
                name="connectionString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PostgreSQL Connection String</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="postgresql://username:password@hostname:5432/database?sslmode=require"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Complete PostgreSQL connection URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="individual-fields" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={databaseForm.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input placeholder="localhost" {...field} />
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
                        <Input placeholder="5432" {...field} />
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
                      <Input placeholder="finance_tracker" {...field} />
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
                        <Input placeholder="postgres" {...field} />
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
            </TabsContent>
          </Tabs>
        ) : selectedProvider === "mysql" ? (
          <Tabs defaultValue="connection-string" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connection-string">Connection String</TabsTrigger>
              <TabsTrigger value="individual-fields">Individual Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection-string" className="space-y-4">
              <FormField
                control={databaseForm.control}
                name="connectionString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MySQL Connection String</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="mysql://username:password@hostname:3306/database?ssl=true"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Complete MySQL connection URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="individual-fields" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={databaseForm.control}
                  name="mysqlHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input placeholder="localhost" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={databaseForm.control}
                  name="mysqlPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input placeholder="3306" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={databaseForm.control}
                name="mysqlDatabase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Name</FormLabel>
                    <FormControl>
                      <Input placeholder="finance_tracker" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={databaseForm.control}
                  name="mysqlUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="root" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={databaseForm.control}
                  name="mysqlPassword"
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
            </TabsContent>
          </Tabs>
        ) : null}
        
        {/* SSL and Advanced Options */}
        {selectedProvider !== "sqlite" && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Connection Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={databaseForm.control}
                name="ssl"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>SSL Connection</FormLabel>
                      <FormDescription className="text-xs">
                        Use SSL for secure connections
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
              <FormField
                control={databaseForm.control}
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
                    <FormDescription className="text-xs">
                      Connection pool size
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEnvironmentOptions = () => (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Environment Configuration
      </h4>
      
      {deploymentContext?.hasEnvFile && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Existing .env file detected. You can use existing configuration or generate a new one.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        <FormField
          control={databaseForm.control}
          name="generateEnvFile"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Generate .env File</FormLabel>
                <FormDescription className="text-xs">
                  Automatically create environment configuration
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
        
        {deploymentContext?.hasEnvFile && (
          <FormField
            control={databaseForm.control}
            name="useExistingEnv"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Use Existing .env</FormLabel>
                  <FormDescription className="text-xs">
                    Keep current environment variables
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
        )}
      </div>
      
      {deploymentContext?.isDocker && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Docker deployment detected. Docker Compose override will be generated automatically.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderDeploymentInfo = () => {
    if (!deploymentContext) return null;
    
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 dark:text-blue-400 mt-0.5">
            {deploymentContext.isDocker ? <Database className="w-5 h-5" /> : <Server className="w-5 h-5" />}
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              {deploymentContext.isDocker ? 'Docker Deployment Detected' : 'Standalone Deployment'}
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {setupRecommendations && (
                <>
                  <p><strong>Recommended:</strong> {setupRecommendations.recommendedProvider}</p>
                  {setupRecommendations.recommendations.map((rec: string, i: number) => (
                    <p key={i}>• {rec}</p>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProviderRecommendations = () => {
    if (!deploymentContext) return null;
    
    const recommendations = [
      {
        provider: 'supabase',
        icon: <Cloud className="w-6 h-6" />,
        title: 'Supabase',
        description: 'Recommended for production',
        pros: ['Automatic scaling', 'Built-in auth', 'Real-time features', 'Automatic backups'],
        badge: 'Recommended'
      },
      {
        provider: 'sqlite',
        icon: <HardDrive className="w-6 h-6" />,
        title: 'SQLite',
        description: 'Perfect for development',
        pros: ['No setup required', 'File-based', 'Fast for small datasets', 'Easy backup'],
        badge: deploymentContext.isDocker ? null : 'Development'
      },
      {
        provider: 'neon',
        icon: <Zap className="w-6 h-6" />,
        title: 'Neon',
        description: 'Serverless PostgreSQL',
        pros: ['Serverless', 'Branching', 'Auto-scaling', 'PostgreSQL compatible'],
        badge: null
      }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {recommendations.map((rec) => (
          <Card 
            key={rec.provider}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProvider === rec.provider ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
            }`}
            onClick={() => databaseForm.setValue('provider', rec.provider as any)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {rec.icon}
                  <h3 className="font-medium">{rec.title}</h3>
                </div>
                {rec.badge && (
                  <Badge variant={rec.badge === 'Recommended' ? 'default' : 'secondary'} className="text-xs">
                    {rec.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {rec.pros.map((pro, i) => (
                  <li key={i}>• {pro}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderConnectionTestResult = () => {
    if (!hasTestedConnection || !connectionTestResult) return null;
    
    return (
      <div className={`p-4 rounded-lg border ${
        connectionTestResult.success 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        <div className="flex items-start space-x-3">
          {connectionTestResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${
                connectionTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {connectionTestResult.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
              {connectionTestResult.latency && (
                <span className="text-xs text-muted-foreground">
                  {connectionTestResult.latency}ms
                </span>
              )}
            </div>
            
            {connectionTestResult.success && connectionTestResult.details && (
              <div className="text-sm space-y-1">
                <p><strong>Host:</strong> {connectionTestResult.details.host}</p>
                <p><strong>Database:</strong> {connectionTestResult.details.database}</p>
                <p><strong>Version:</strong> {connectionTestResult.details.version}</p>
                {connectionTestResult.details.missingTables && connectionTestResult.details.missingTables.length > 0 && (
                  <p className="text-yellow-600">
                    <strong>Note:</strong> {connectionTestResult.details.missingTables.length} tables will be created automatically
                  </p>
                )}
              </div>
            )}
            
            {connectionTestResult.error && (
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {connectionTestResult.error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Finance Tracker</CardTitle>
          <CardDescription>
            Professional-grade personal finance management system
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

        <CardContent className="space-y-6">
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
                        <FormDescription className="text-xs">
                          Minimum 8 characters
                        </FormDescription>
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
                  <h3 className="text-lg font-semibold">Database Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose and configure your database provider
                  </p>
                </div>

                {renderDeploymentInfo()}
                
                <FormField
                  control={databaseForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Production Database" {...field} />
                      </FormControl>
                      <FormDescription>
                        A friendly name for this database configuration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="text-base font-medium mb-4 block">Choose Database Provider</FormLabel>
                  {renderProviderRecommendations()}
                  
                  <FormField
                    control={databaseForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
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
                                  <div className="flex items-center gap-2">
                                    {getProviderIcon(provider)}
                                    <div>
                                      <div className="font-medium">{info.name}</div>
                                      <div className="text-xs text-muted-foreground">{info.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {renderProviderFields()}
                {renderEnvironmentOptions()}

                {/* Connection Test Section for external databases */}
                {selectedProvider !== 'sqlite' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Test Database Connection</h4>
                        <p className="text-sm text-muted-foreground">
                          Verify your database credentials before proceeding
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={testConnectionMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {testConnectionMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                    {renderConnectionTestResult()}
                  </div>
                )}

                {/* Provider-specific guidance */}
                {selectedProvider !== 'sqlite' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{providerInfo.name} Setup:</strong> {providerInfo.description}
                      {selectedProvider === 'supabase' && (
                        <div className="mt-2 text-xs space-y-1">
                          <p>• Get credentials from Supabase Dashboard → Settings → API</p>
                          <p>• Tables will be created automatically</p>
                          <p>• No manual SQL execution required</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

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
                    {initializationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="ml-2 w-4 h-4" />
                      </>
                    )}
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