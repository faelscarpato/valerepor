import { useEffect, useState } from "react";
import {
  getHistorico,
  getLastBackupAt,
  getLocais,
  getProdutos,
  getReposicoes,
} from "@/lib/storage";

export function useData() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    window.addEventListener("ap:data", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("ap:data", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);
  return {
    produtos: getProdutos(),
    locais: getLocais(),
    reposicoes: getReposicoes(),
    historico: getHistorico(),
    lastBackupAt: getLastBackupAt(),
    _tick: tick,
  };
}
