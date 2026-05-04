import { Local, Produto, Reposicao } from "./types";

const KEYS = {
  produtos: "ap_produtos",
  locais: "ap_locais",
  reposicoes: "ap_reposicoes",
  seeded: "ap_seeded_v1",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("ap:data"));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const getProdutos = () => read<Produto[]>(KEYS.produtos, []);
export const setProdutos = (v: Produto[]) => write(KEYS.produtos, v);

export const getLocais = () => read<Local[]>(KEYS.locais, []);
export const setLocais = (v: Local[]) => write(KEYS.locais, v);

export const getReposicoes = () => read<Reposicao[]>(KEYS.reposicoes, []);
export const setReposicoes = (v: Reposicao[]) => write(KEYS.reposicoes, v);

export function seedIfNeeded() {
  if (localStorage.getItem(KEYS.seeded)) return;

  const produtos: Produto[] = [
    { id: "p1", nome: "Leite Integral 1L", codigoBarras: "7891000100103", categoria: "Laticínios", marca: "Ninho", unidade: "L" },
    { id: "p2", nome: "Pão de Forma", codigoBarras: "7896005800012", categoria: "Padaria", marca: "Pullman", unidade: "un" },
    { id: "p3", nome: "Iogurte Natural 170g", codigoBarras: "7891025112341", categoria: "Laticínios", marca: "Danone", unidade: "un" },
    { id: "p4", nome: "Arroz Branco 5kg", codigoBarras: "7896006711002", categoria: "Mercearia", marca: "Tio João", unidade: "kg" },
    { id: "p5", nome: "Refrigerante Cola 2L", codigoBarras: "7894900011517", categoria: "Bebidas", marca: "Coca-Cola", unidade: "L" },
    { id: "p6", nome: "Presunto Fatiado 200g", codigoBarras: "7891234567890", categoria: "Frios", marca: "Sadia", unidade: "un" },
  ];

  const locais: Local[] = [
    { id: "l1", setor: "Laticínios", corredor: "1", prateleira: "A-01", observacao: "Geladeira frontal" },
    { id: "l2", setor: "Padaria", corredor: "2", prateleira: "B-03" },
    { id: "l3", setor: "Mercearia", corredor: "5", prateleira: "C-12" },
    { id: "l4", setor: "Bebidas", corredor: "7", prateleira: "D-04" },
    { id: "l5", setor: "Frios", corredor: "1", prateleira: "A-04", observacao: "Câmara fria" },
  ];

  const today = new Date();
  const addDays = (d: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  };

  const reposicoes: Reposicao[] = [
    { id: "r1", produtoId: "p1", localId: "l1", quantidade: 24, dataReposicao: addDays(-5), dataValidade: addDays(4), responsavel: "Carlos", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r2", produtoId: "p2", localId: "l2", quantidade: 18, dataReposicao: addDays(-2), dataValidade: addDays(-1), responsavel: "Ana", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r3", produtoId: "p3", localId: "l1", quantidade: 30, dataReposicao: addDays(-10), dataValidade: addDays(12), responsavel: "Carlos", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r4", produtoId: "p4", localId: "l3", quantidade: 40, dataReposicao: addDays(-1), dataValidade: addDays(120), responsavel: "Bruno", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r5", produtoId: "p5", localId: "l4", quantidade: 60, dataReposicao: addDays(-7), dataValidade: addDays(25), responsavel: "Ana", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r6", produtoId: "p6", localId: "l5", quantidade: 12, dataReposicao: addDays(-3), dataValidade: addDays(7), responsavel: "Bruno", status: "ativo", criadoEm: new Date().toISOString() },
  ];

  setProdutos(produtos);
  setLocais(locais);
  setReposicoes(reposicoes);
  localStorage.setItem(KEYS.seeded, "1");
}

export function diasRestantes(dataValidade: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(dataValidade + "T00:00:00");
  return Math.ceil((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export type Faixa = "vencido" | "7" | "15" | "30" | "ok";
export function faixa(dias: number): Faixa {
  if (dias < 0) return "vencido";
  if (dias <= 7) return "7";
  if (dias <= 15) return "15";
  if (dias <= 30) return "30";
  return "ok";
}
