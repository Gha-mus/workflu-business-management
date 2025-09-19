import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  DollarSign, 
  ShoppingCart, 
  Warehouse, 
  Truck,
  Package,
  BarChart3,
  Users as UsersIcon,
  Settings,
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Working Capital', href: '/capital', icon: DollarSign },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Warehouse', href: '/warehouse', icon: Warehouse },
  { name: 'Shipping', href: '/shipping', icon: Truck },
  { name: 'Sales', href: '/sales', icon: UsersIcon },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Users & Roles', href: '/users', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.role === 'admin';
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm" data-testid="logo">W</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="app-name">WorkFlu</h1>
            <p className="text-xs text-muted-foreground">Business Management</p>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-medium" data-testid="user-initials">
                {userInitials}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" data-testid="user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'User'
                }
              </p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
                {user?.role || 'Worker'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <button 
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              </Link>
            );
          })}
        </div>
        
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            <div className="mt-2 space-y-1">
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <button 
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
