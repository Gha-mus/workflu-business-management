import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentTransactions } from "@/components/RecentTransactions";
import { QuickActions } from "@/components/QuickActions";
import { AiChatInterface, ContextualHelp } from "@/components/AiChatInterface";
import { DashboardAiInsights } from "@/components/AiInsightsPanels";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="dashboard">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4" data-testid="dashboard-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Overview of your business operations</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Currency Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Currency:</span>
                <Select defaultValue="USD">
                  <SelectTrigger className="w-20" data-testid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ETB">ETB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Notification Bell */}
              <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <DashboardStats />
          
          {/* AI Insights Section */}
          <div className="my-8">
            <DashboardAiInsights />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <RecentTransactions />
            <div className="space-y-6">
              <QuickActions />
              <ContextualHelp 
                currentPage="dashboard" 
                userRole="admin" 
                className="lg:block hidden"
              />
            </div>
          </div>
        </div>
      </main>
      
      {/* AI Chat Interface */}
      <AiChatInterface page="dashboard" />
    </div>
  );
}
