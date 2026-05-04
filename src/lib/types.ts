export type Produto = {
  id: string;
  nome: string;
  codigoBarras: string;
  categoria: string;
  marca: string;
  unidade: string;
};

export type Local = {
  id: string;
  setor: string;
  corredor: string;
  prateleira: string;
  observacao?: string;
};

export type StatusReposicao =
  | "ativo"
  | "conferido"
  | "retirado"
  | "vendido"
  | "descartado"
  | "erro";

export type Reposicao = {
  id: string;
  produtoId: string;
  localId: string;
  quantidade: number;
  dataReposicao: string; // ISO date
  dataValidade: string; // ISO date
  responsavel: string;
  observacao?: string;
  status: StatusReposicao;
  criadoEm: string;
};

export const STATUS_LABEL: Record<StatusReposicao, string> = {
  ativo: "Ativo",
  conferido: "Conferido",
  retirado: "Retirado da prateleira",
  vendido: "Vendido",
  descartado: "Descartado",
  erro: "Erro de cadastro",
};
