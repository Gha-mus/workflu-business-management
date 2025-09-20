import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
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

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
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
