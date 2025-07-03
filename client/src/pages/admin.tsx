import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";
import { 
  Users, Settings, Activity, BarChart3, Shield, 
  UserCheck, UserX, Crown, Edit, Trash2, Plus
} from "lucide-react";
import type { User, InsertUser } from "@shared/schema";

const createUserFormSchema = (isEdit: boolean = false) => z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: isEdit 
    ? z.string().optional()
    : z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user", "guest"]),
  isActive: z.boolean(),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean(),
});

type UserFormData = z.infer<ReturnType<typeof createUserFormSchema>>;

interface UserFormProps {
  onClose: () => void;
  user?: User;
}

function UserForm({ onClose, user }: UserFormProps) {
  const { toast } = useToast();
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(createUserFormSchema(!!user)),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      name: user?.name || "",
      password: "",
      role: user?.role as "admin" | "user" | "guest" || "user",
      isActive: user?.isActive ?? true,
      phoneNumber: user?.phoneNumber || "",
      timezone: user?.timezone || "UTC",
      currency: user?.currency || "USD",
      language: user?.language || "en",
      emailNotifications: user?.emailNotifications ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      return apiRequest("POST", `/api/admin/users`, { ...data, password: "defaultpassword123" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      return apiRequest("PUT", `/api/admin/users/${user!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!user && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Enter initial password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="UTC" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center space-x-6">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Active Account</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Email Notifications</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {user ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Admin() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const { toast } = useToast();

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: userStats } = useQuery<{ totalUsers: number; activeUsers: number; adminUsers: number }>({
    queryKey: ["/api/admin/users/stats"],
  });

  const { data: systemStats } = useQuery<{
    totalTransactions: number;
    totalAccounts: number;
    totalCategories: number;
    totalProducts: number;
    systemHealth: string;
  }>({
    queryKey: ["/api/admin/system/stats"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating user status", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "user": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "guest": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-3 w-3" />;
      case "user": return <Users className="h-3 w-3" />;
      case "guest": return <Shield className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system configuration</p>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userStats?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Total in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemStats?.systemHealth || "Unknown"}</div>
            <p className="text-xs text-muted-foreground">System status</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedUser ? "Edit User" : "Create New User"}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedUser 
                          ? "Update user information and permissions" 
                          : "Add a new user to the system"
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <UserForm 
                      user={selectedUser || undefined} 
                      onClose={() => {
                        setIsUserFormOpen(false);
                        setSelectedUser(null);
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.name}</p>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1">{user.role}</span>
                            </Badge>
                            {!user.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Last login: {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatusMutation.mutate({
                            userId: user.id,
                            isActive: !user.isActive
                          })}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure global system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System configuration features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Monitor system activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity logs feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}