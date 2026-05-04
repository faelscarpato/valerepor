import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Alertas from "./pages/Alertas";
import NovaReposicao from "./pages/NovaReposicao";
import Produtos from "./pages/Produtos";
import Locais from "./pages/Locais";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import { seedIfNeeded } from "./lib/storage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => { seedIfNeeded(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/nova" element={<NovaReposicao />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/locais" element={<Locais />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
