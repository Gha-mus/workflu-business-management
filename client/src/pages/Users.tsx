import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users as UsersIcon, UserCheck, AlertCircle, Check } from "lucide-react";

const roleLabels = {
  admin: "Administrator",
  finance: "Finance",
  purchasing: "Purchasing",
  warehouse: "Warehouse",
  sales: "Sales",
  worker: "Worker",
};

const roleDescriptions = {
  admin: "Full system access and user management",
  finance: "Financial operations and reporting",
  purchasing: "Supplier management and purchases",
  warehouse: "Inventory and stock management",
  sales: "Customer management and sales operations",
  worker: "Basic operations and data entry",
};

const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  finance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  purchasing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  warehouse: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  sales: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  worker: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

function Users() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Check if current user is admin
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <div className="h-full flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">
              Administrator privileges required to manage users.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: User['role'] }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onMutate: async ({ userId }) => {
      setUpdatingUserId(userId);
    },
    onSuccess: (data, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: `User role successfully changed to ${roleLabels[role]}.`,
      });
      setUpdatingUserId(null);
    },
    onError: (error) => {
      console.error("Failed to update user role:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
      setUpdatingUserId(null);
    },
  });

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="h-full flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  const stats = {
    total: users?.length || 0,
    admin: users?.filter(u => u.role === 'admin').length || 0,
    active: users?.filter(u => u.isActive).length || 0,
    sales: users?.filter(u => u.role === 'sales').length || 0,
  };

  return (
    <div className="h-full flex" data-testid="users">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4" data-testid="users-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Users Management</h2>
              <p className="text-sm text-muted-foreground">Manage user roles and access permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Admin Panel</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-users">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-active-users">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-admin-users">{stats.admin}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600" data-testid="stat-sales-users">{stats.sales}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user roles and permissions. Changes take effect immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`user-name-${user.id}`}>
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown User'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`user-email-${user.id}`}>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]} data-testid={`user-role-${user.id}`}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"} data-testid={`user-status-${user.id}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole: User['role']) => handleRoleChange(user.id, newRole)}
                            disabled={updatingUserId === user.id || user.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-[140px]" data-testid={`role-select-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([role, label]) => (
                                <SelectItem key={role} value={role} data-testid={`role-option-${role}-${user.id}`}>
                                  <div className="flex flex-col">
                                    <span>{label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {roleDescriptions[role as User['role']]}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updatingUserId === user.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          )}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-muted-foreground">(You)</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {!users?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Guide</CardTitle>
              <CardDescription>
                Understanding what each role can access in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(roleDescriptions).map(([role, description]) => (
                  <div key={role} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={roleColors[role as User['role']]}>
                        {roleLabels[role as User['role']]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <div className="text-xs space-y-1">
                      {role === 'admin' && (
                        <div className="text-red-600">• Full system access • User management</div>
                      )}
                      {role === 'sales' && (
                        <div className="text-purple-600">• Sales pipeline • Customer management • Order processing</div>
                      )}
                      {role === 'finance' && (
                        <div className="text-green-600">• Financial reports • Capital management • Revenue tracking</div>
                      )}
                      {role === 'purchasing' && (
                        <div className="text-blue-600">• Supplier management • Purchase orders • Procurement</div>
                      )}
                      {role === 'warehouse' && (
                        <div className="text-yellow-600">• Inventory management • Stock operations • Quality control</div>
                      )}
                      {role === 'worker' && (
                        <div className="text-gray-600">• Basic data entry • Limited operations</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default Users;