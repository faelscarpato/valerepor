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
  lote?: string;
  dataReposicao: string; // ISO date
  dataValidade: string; // ISO date
  responsavel: string;
  observacao?: string;
  status: StatusReposicao;
  criadoEm: string;
  atualizadoEm?: string;
  statusAlteradoEm?: string;
  statusResponsavel?: string;
};

export type TipoHistorico =
  | "status"
  | "criacao"
  | "edicao"
  | "importacao"
  | "backup"
  | "limpeza"
  | "sistema";

export type HistoricoAcao = {
  id: string;
  reposicaoId?: string;
  statusAnterior?: StatusReposicao;
  novoStatus?: StatusReposicao;
  tipo?: TipoHistorico;
  entidade?: "produto" | "local" | "reposicao" | "backup" | "sistema";
  entidadeId?: string;
  responsavel?: string;
  dataHora: string;
  observacao?: string;
  descricao?: string;
};

export type BackupData = {
  app: "ValeRepor";
  versao: number;
  exportadoEm: string;
  checksum?: string;
  produtos: Produto[];
  locais: Local[];
  reposicoes: Reposicao[];
  historico: HistoricoAcao[];
  notificacoes?: {
    enabled: boolean;
    diasAntecedencia: number;
  };
};

export type BackupPreview = {
  app: string;
  versao: number;
  produtos: number;
  locais: number;
  reposicoes: number;
  historico: number;
  exportadoEm?: string;
};

export type ImportProdutosResultado = {
  criados: number;
  atualizados: number;
  ignorados: number;
  erros: string[];
};

export const STATUS_LABEL: Record<StatusReposicao, string> = {
  ativo: "Ativo",
  conferido: "Conferido hoje",
  retirado: "Retirado da prateleira",
  vendido: "Vendido",
  descartado: "Descartado",
  erro: "Erro de cadastro",
};
