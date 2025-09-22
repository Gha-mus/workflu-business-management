import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users as UsersIcon, UserCheck, AlertCircle, Check, Plus, UserX, RefreshCw, Edit, Trash2 } from "lucide-react";
import { BackButton } from '@/components/ui/back-button';

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
  const [, setLocation] = useLocation();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // New user creation state
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [newUserRole, setNewUserRole] = useState<User['role']>("worker");

  // Delete user confirmation state
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Check if current user is admin and super-admin
  const isAdmin = isAuthenticated && currentUser?.role === 'admin';
  const isSuperAdmin = isAuthenticated && currentUser?.isSuperAdmin === true;

  // Fetch all users - enabled for admin users or super-admins
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin || isSuperAdmin,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; role: User['role'] }) => {
      const nameParts = data.displayName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await apiRequest("POST", "/api/users", {
        email: data.email,
        temporaryPassword: data.password,
        firstName,
        lastName,
        role: data.role
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Display temporary password if returned
      if (data.temporaryPassword) {
        toast({
          title: "User Created Successfully",
          description: (
            <div className="space-y-2">
              <p>User has been created with email: {data.email}</p>
              <p className="font-mono bg-muted p-2 rounded">
                Temporary Password: {data.temporaryPassword}
              </p>
              <p className="text-sm text-muted-foreground">
                Please save this password securely and share it with the user.
              </p>
            </div>
          ) as any,
          duration: 30000, // Show for 30 seconds
        });
      } else {
        toast({
          title: "User Created",
          description: "New user created successfully with Supabase authentication.",
        });
      }
      
      setCreateUserOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserDisplayName("");
      setNewUserRole("worker");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
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

  // Toggle user active status mutation
  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      return await apiRequest("PUT", `/api/users/${userId}/status`, { isActive: activate });
    },
    onSuccess: (data, { activate }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: activate ? "User Activated" : "User Deactivated",
        description: `User has been ${activate ? "activated" : "deactivated"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return await apiRequest("POST", `/api/users/${userId}/reset-password`, {});
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Password reset email sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    },
  });

  // Update display name mutation
  const updateDisplayNameMutation = useMutation({
    mutationFn: async ({ userId, displayName }: { userId: string; displayName: string }) => {
      const nameParts = displayName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return await apiRequest("PUT", `/api/users/${userId}/display-name`, { firstName, lastName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Display Name Updated",
        description: "User display name updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update display name.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation (Super-Admin Only)
  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // Use apiRequest for consistency with other mutations
      const response = await apiRequest("POST", `/api/super-admin/users/${userId}/anonymize`, { confirm: true });
      return await response.json();
    },
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      const deletedUser = users?.find(u => u.id === userId);
      toast({
        title: "User Deleted Successfully",
        description: data.action === 'hard_delete' 
          ? `${deletedUser?.email} has been permanently deleted.`
          : `${deletedUser?.email} has been anonymized to preserve business data integrity.`,
        duration: 5000,
      });
      
      setDeleteUserOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteUserOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate({ userId: userToDelete.id });
    }
  };

  // Show access denied for non-admin users (allow super-admins)
  if (!isAdmin && !isSuperAdmin) {
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
            <div className="flex items-start gap-4">
              <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Users Management</h2>
                <p className="text-sm text-muted-foreground">Manage user roles and access permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-user">
                    <Plus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Create a new user with Supabase authentication. They will receive login credentials via email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        data-testid="input-new-user-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        data-testid="input-new-user-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="John Doe"
                        value={newUserDisplayName}
                        onChange={(e) => setNewUserDisplayName(e.target.value)}
                        data-testid="input-new-user-display-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUserRole} onValueChange={(value: User['role']) => setNewUserRole(value)}>
                        <SelectTrigger data-testid="select-new-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([role, label]) => (
                            <SelectItem key={role} value={role}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCreateUserOpen(false)}
                        data-testid="button-cancel-create-user"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (newUserEmail && newUserPassword && newUserDisplayName) {
                            createUserMutation.mutate({
                              email: newUserEmail,
                              password: newUserPassword,
                              displayName: newUserDisplayName,
                              role: newUserRole,
                            });
                          }
                        }}
                        disabled={!newUserEmail || !newUserPassword || !newUserDisplayName || createUserMutation.isPending}
                        data-testid="button-submit-create-user"
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete User Confirmation Dialog - Super-Admin Only */}
              <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Delete User Account
                    </DialogTitle>
                    <DialogDescription className="space-y-3">
                      <p>
                        You are about to delete the user account for{" "}
                        <span className="font-semibold">
                          {userToDelete?.firstName && userToDelete?.lastName 
                            ? `${userToDelete.firstName} ${userToDelete.lastName}` 
                            : userToDelete?.email}
                        </span>
                        .
                      </p>
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Deletion Process:</p>
                        <ul className="text-sm space-y-1">
                          <li>• If user has <strong>no business records</strong>: Account will be permanently deleted</li>
                          <li>• If user has <strong>linked business data</strong>: Account will be anonymized to preserve data integrity</li>
                          <li>• This action cannot be undone</li>
                          <li>• All operations are fully audited</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Only super-admins can perform this action. The system will automatically determine the safest deletion method.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteUserOpen(false);
                        setUserToDelete(null);
                      }}
                      data-testid="button-cancel-delete-user"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteUser}
                      disabled={deleteUserMutation.isPending}
                      data-testid="button-confirm-delete-user"
                    >
                      {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                          
                          {/* Admin Action Buttons */}
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserActiveMutation.mutate({ userId: user.id, activate: !user.isActive })}
                              disabled={user.id === currentUser?.id || toggleUserActiveMutation.isPending}
                              data-testid={`button-toggle-active-${user.id}`}
                            >
                              {user.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetPasswordMutation.mutate({ userId: user.id })}
                              disabled={resetPasswordMutation.isPending}
                              data-testid={`button-reset-password-${user.id}`}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            
                            {/* Delete button - Super-Admin Only */}
                            {isSuperAdmin && user.id !== currentUser?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleteUserMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          
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