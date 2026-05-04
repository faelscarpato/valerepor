import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Alertas from "./pages/Alertas";
import NovaReposicao from "./pages/NovaReposicao";
import Produtos from "./pages/Produtos";
import Locais from "./pages/Locais";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { seedIfNeeded } from "./lib/storage";
import { iniciarVerificacaoPeriodica, registrarServiceWorker } from "./lib/notifications";


const App = () => {
  useEffect(() => {
    seedIfNeeded();
    registrarServiceWorker().then(() => iniciarVerificacaoPeriodica());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "verifica-validades") {
          import("./lib/notifications").then((m) => m.verificarEnotificar(true));
        }
      });
    }
  }, []);
  return (
    <>
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
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </>
  );
};

export default App;
