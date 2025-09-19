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
import Settings from "@/pages/Settings";
import Sales from "@/pages/Sales";
import Users from "@/pages/Users";

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
          <Route path="/reports" component={Reports} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
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
