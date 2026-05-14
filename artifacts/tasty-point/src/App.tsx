import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import MenuPage from "@/pages/menu";
import CartPage from "@/pages/cart";
import OrderStatusPage from "@/pages/order-status";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminOrders from "@/pages/admin-orders";
import AdminMenu from "@/pages/admin-menu";
import AdminTables from "@/pages/admin-tables";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/order-status/:id" component={OrderStatusPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/menu" component={AdminMenu} />
      <Route path="/admin/tables" component={AdminTables} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
