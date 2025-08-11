import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, TestTube, Power, Database, ArrowLeftRight, Trash2, Settings, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { DatabaseConfig, MigrationLog, supportedDatabaseProviders, databaseProviderInfo } from "@shared/database-config";
import { DatabaseConfigForm } from "@/components/forms/database-config-form";
import { DataMigrationForm } from "@/components/forms/data-migration-form";

export default function DatabaseManagement() {
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showMigrationForm, setShowMigrationForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DatabaseConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<DatabaseConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);

  // Fetch database configurations
  const { data: databases = [], isLoading: loadingDatabases } = useQuery({
    queryKey: ["/api/admin/databases"],
  });

  // Fetch migration logs
  const { data: migrations = [], isLoading: loadingMigrations } = useQuery({
    queryKey: ["/api/admin/databases/migrations"],
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/admin/databases/${configId}/test`, "POST"),
    onMutate: (configId) => {
      setTestingConfig(configId);
    },
    onSuccess: (data, configId) => {
      setTestingConfig(null);
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected successfully in ${data.latency}ms`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setTestingConfig(null);
      toast({
        title: "Test Failed",
        description: "Failed to test database connection",
        variant: "destructive",
      });
    },
  });

  // Activate database mutation
  const activateMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/admin/databases/${configId}/activate`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/databases"] });
      toast({
        title: "Database Activated",
        description: "Successfully switched to the selected database",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate database",
        variant: "destructive",
      });
    },
  });

  // Delete database mutation
  const deleteMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/admin/databases/${configId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/databases"] });
      setDeletingConfig(null);
      toast({
        title: "Database Deleted",
        description: "Database configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete database configuration",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (config: DatabaseConfig) => {
    if (config.isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (config.isConnected) {
      return <Database className="h-4 w-4 text-blue-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (config: DatabaseConfig) => {
    if (config.isActive) return "Active";
    if (config.isConnected) return "Connected";
    return "Disconnected";
  };

  const getMigrationStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Database Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure multiple database providers and manage data migrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowMigrationForm(true)} className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Migrate Data
          </Button>
          <Button onClick={() => setShowConfigForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Database
          </Button>
        </div>
      </div>

      <Tabs defaultValue="databases" className="space-y-6">
        <TabsList>
          <TabsTrigger value="databases">Database Configurations</TabsTrigger>
          <TabsTrigger value="migrations">Migration History</TabsTrigger>
        </TabsList>

        <TabsContent value="databases">
          {loadingDatabases ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (databases as DatabaseConfig[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Databases Configured
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Add your first database configuration to get started with data management.
                </p>
                <Button onClick={() => setShowConfigForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Database
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(databases as DatabaseConfig[]).map((config: DatabaseConfig) => (
                <Card key={config.id} className={`relative ${config.isActive ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(config)}
                      <CardTitle className="text-base">{config.name}</CardTitle>
                    </div>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {getStatusText(config)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Provider: {databaseProviderInfo[config.provider].name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {databaseProviderInfo[config.provider].description}
                      </p>
                    </div>
                    
                    {config.lastConnectionTest && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Last tested: {new Date(config.lastConnectionTest).toLocaleString()}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnectionMutation.mutate(config.id)}
                        disabled={testingConfig === config.id}
                        className="flex items-center gap-1"
                      >
                        <TestTube className="h-3 w-3" />
                        {testingConfig === config.id ? "Testing..." : "Test"}
                      </Button>
                      
                      {!config.isActive && (
                        <Button
                          size="sm"
                          onClick={() => activateMutation.mutate(config.id)}
                          disabled={activateMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Power className="h-3 w-3" />
                          Activate
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingConfig(config)}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      {!config.isActive && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingConfig(config)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="migrations">
          {loadingMigrations ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (migrations as MigrationLog[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Migrations Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Start by migrating data between your configured databases.
                </p>
                <Button onClick={() => setShowMigrationForm(true)}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Start Migration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(migrations as MigrationLog[]).map((migration: MigrationLog) => (
                <Card key={migration.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      {getMigrationStatusIcon(migration.status)}
                      <div>
                        <CardTitle className="text-base">
                          Migration to {databaseProviderInfo[migration.toProvider].name}
                        </CardTitle>
                        <CardDescription>
                          {migration.fromProvider ? `From ${databaseProviderInfo[migration.fromProvider].name}` : 'From memory storage'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={migration.status === 'completed' ? 'default' : migration.status === 'failed' ? 'destructive' : 'secondary'}>
                      {migration.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Started</p>
                        <p className="font-medium">{new Date(migration.startedAt).toLocaleString()}</p>
                      </div>
                      {migration.completedAt && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="font-medium">{new Date(migration.completedAt).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Records Migrated</p>
                        <p className="font-medium">{migration.recordsMigrated.toLocaleString()}</p>
                      </div>
                      {migration.errorMessage && (
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-gray-600 dark:text-gray-400">Error</p>
                          <p className="font-medium text-red-600 dark:text-red-400 text-xs">
                            {migration.errorMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Database Configuration Form */}
      {(showConfigForm || editingConfig) && (
        <DatabaseConfigForm
          config={editingConfig}
          onClose={() => {
            setShowConfigForm(false);
            setEditingConfig(null);
          }}
          onSuccess={() => {
            setShowConfigForm(false);
            setEditingConfig(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/databases"] });
          }}
        />
      )}

      {/* Data Migration Form */}
      {showMigrationForm && (
        <DataMigrationForm
          databases={databases}
          onClose={() => setShowMigrationForm(false)}
          onSuccess={() => {
            setShowMigrationForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/databases/migrations"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingConfig} onOpenChange={() => setDeletingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the database configuration "{deletingConfig?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingConfig && deleteMutation.mutate(deletingConfig.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}