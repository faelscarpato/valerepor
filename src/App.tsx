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
import { iniciarVerificacaoPeriodica, registrarServiceWorker, verificarEnotificar } from "./lib/notifications";

const App = () => {
  useEffect(() => {
    seedIfNeeded();
    registrarServiceWorker().then(() => iniciarVerificacaoPeriodica());

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "verifica-validades") verificarEnotificar(true);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") verificarEnotificar(false);
    };

    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisible);
    verificarEnotificar(false);

    return () => {
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
    };
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
