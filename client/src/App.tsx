import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import WorkingCapital from "@/pages/WorkingCapital";
import Purchases from "@/pages/Purchases";
import Warehouse from "@/pages/Warehouse";
import Shipping from "@/pages/Shipping";
import Orders from "@/pages/Orders";
import Reports from "@/pages/Reports";
import SettingsManagement from "@/pages/SettingsManagement";
import Sales from "@/pages/Sales";
import Users from "@/pages/Users";
import DocumentManagement from "@/pages/DocumentManagement";
import Compliance from "@/pages/Compliance";
import OperatingExpenses from "@/pages/OperatingExpenses";
import WarehouseOperations from "@/pages/WarehouseOperations";
import RevenueManagement from "@/pages/RevenueManagement";
import ReportsManagement from "@/pages/ReportsManagement";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes - always accessible */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      
      {/* Public landing page */}
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={Dashboard} />
      )}
      
      {/* Protected routes - redirect to login if not authenticated */}
      {isAuthenticated ? (
        <>
          <Route path="/capital" component={WorkingCapital} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/warehouse" component={Warehouse} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/sales" component={Sales} />
          <Route path="/orders" component={Orders} />
          <Route path="/operating-expenses" component={OperatingExpenses} />
          <Route path="/warehouse-operations" component={WarehouseOperations} />
          <Route path="/revenue-management" component={RevenueManagement} />
          <Route path="/reports" component={ReportsManagement} />
          <Route path="/documents" component={DocumentManagement} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={SettingsManagement} />
        </>
      ) : (
        // Redirect unauthorized access to login
        <Route>
          {() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return null;
          }}
        </Route>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
