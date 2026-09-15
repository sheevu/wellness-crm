import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AppLayout from "./components/layout/app-layout.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CustomersPage from "./pages/customers/page.tsx";
import CustomerDetailPage from "./pages/customers/detail/page.tsx";
import ServicesPage from "./pages/services/page.tsx";
import FunnelPage from "./pages/funnel/page.tsx";
import TasksPage from "./pages/tasks/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/funnel" element={<FunnelPage />} />
            <Route path="/tasks" element={<TasksPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
