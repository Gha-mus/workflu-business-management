import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";
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
import Settings from "@/pages/Settings";
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
  const { isAuthenticated, isLoading, session } = useAuth();
  const [location, setLocation] = useLocation();

  // Handle auth redirects properly
  useEffect(() => {
    // Skip if still loading or on auth pages
    if (isLoading || location.startsWith('/auth/')) {
      return;
    }

    // Only redirect to login if we've checked session and there's none
    if (!session && !isAuthenticated && location !== '/') {
      console.info('No session, redirecting to login');
      setLocation('/auth/login');
    }
  }, [isLoading, session, isAuthenticated, location, setLocation]);

  // If still loading auth state, show loading spinner
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
      
      {/* Landing/Dashboard based on auth */}
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      
      {/* Protected routes - only render if authenticated */}
      {isAuthenticated && (
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
          <Route path="/settings" component={Settings} />
          <Route path="/settings-management" component={SettingsManagement} />
        </>
      )}
      
      {/* Catch all - 404 or redirect */}
      <Route>
        {!isAuthenticated && !location.startsWith('/auth/') ? (
          () => {
            setLocation('/auth/login');
            return null;
          }
        ) : (
          <NotFound />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
