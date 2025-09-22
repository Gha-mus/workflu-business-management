import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/auth/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background" data-testid="dashboard">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4 pt-16 md:pt-4" data-testid="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Overview of your business operations</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
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
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-background p-4 sm:p-6">
          <DashboardStats />
          
          {/* AI Insights Section */}
          <div className="my-6 sm:my-8">
            <DashboardAiInsights />
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="xl:col-span-2">
              <RecentTransactions />
            </div>
            <div className="space-y-4 sm:space-y-6">
              <QuickActions />
              <ContextualHelp 
                currentPage="dashboard" 
                userRole="admin" 
                className="block"
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
