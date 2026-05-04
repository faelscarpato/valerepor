import {
  BackupData,
  BackupPreview,
  HistoricoAcao,
  ImportProdutosResultado,
  Local,
  Produto,
  Reposicao,
  StatusReposicao,
} from "./types";

const KEYS = {
  produtos: "ap_produtos",
  locais: "ap_locais",
  reposicoes: "ap_reposicoes",
  historico: "ap_historico_acoes",
  seeded: "ap_seeded_v1",
  notifyConfig: "ap_notify_config",
  notifiedIds: "ap_notified_ids",
  lastNotifyCheck: "ap_last_notify_check",
  lastBackupAt: "ap_last_backup_at",
} as const;

const CURRENT_BACKUP_VERSION = 3;

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

const text = (value: unknown) => String(value ?? "").trim();
const date = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";
const statusValido = (value: unknown): value is StatusReposicao =>
  ["ativo", "conferido", "retirado", "vendido", "descartado", "erro"].includes(text(value));

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function normalizeProduto(p: Partial<Produto>, index = 0): Produto {
  return {
    id: text(p.id) || uid() + index,
    nome: text(p.nome),
    codigoBarras: text(p.codigoBarras),
    categoria: text(p.categoria),
    marca: text(p.marca),
    unidade: text(p.unidade) || "un",
  };
}

function normalizeLocal(l: Partial<Local>, index = 0): Local {
  return {
    id: text(l.id) || uid() + index,
    setor: text(l.setor),
    corredor: text(l.corredor),
    prateleira: text(l.prateleira),
    observacao: text(l.observacao),
  };
}

function normalizeReposicao(r: Partial<Reposicao>, index = 0): Reposicao {
  return {
    id: text(r.id) || uid() + index,
    produtoId: text(r.produtoId),
    localId: text(r.localId),
    quantidade: Number(r.quantidade) || 0,
    lote: text(r.lote),
    dataReposicao: date(r.dataReposicao) || new Date().toISOString().slice(0, 10),
    dataValidade: date(r.dataValidade),
    responsavel: text(r.responsavel),
    observacao: text(r.observacao),
    status: statusValido(r.status) ? r.status : "ativo",
    criadoEm: text(r.criadoEm) || new Date().toISOString(),
    atualizadoEm: text(r.atualizadoEm) || undefined,
    statusAlteradoEm: text(r.statusAlteradoEm) || undefined,
    statusResponsavel: text(r.statusResponsavel) || undefined,
  };
}

function normalizeHistorico(h: Partial<HistoricoAcao>, index = 0): HistoricoAcao {
  return {
    id: text(h.id) || uid() + index,
    reposicaoId: text(h.reposicaoId) || undefined,
    statusAnterior: statusValido(h.statusAnterior) ? h.statusAnterior : undefined,
    novoStatus: statusValido(h.novoStatus) ? h.novoStatus : undefined,
    tipo: h.tipo || (h.statusAnterior && h.novoStatus ? "status" : "sistema"),
    entidade: h.entidade,
    entidadeId: text(h.entidadeId) || undefined,
    responsavel: text(h.responsavel) || undefined,
    dataHora: text(h.dataHora) || new Date().toISOString(),
    observacao: text(h.observacao) || undefined,
    descricao: text(h.descricao) || undefined,
  };
}

function checksumPayload(data: Omit<BackupData, "checksum">) {
  const source = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  return hash.toString(16).padStart(8, "0");
}

export const getProdutos = () => read<Produto[]>(KEYS.produtos, []).map(normalizeProduto).filter((p) => p.nome);
export const setProdutos = (v: Produto[]) => write(KEYS.produtos, v.map(normalizeProduto));

export const getLocais = () => read<Local[]>(KEYS.locais, []).map(normalizeLocal).filter((l) => l.setor || l.prateleira);
export const setLocais = (v: Local[]) => write(KEYS.locais, v.map(normalizeLocal));

export const getReposicoes = () => read<Reposicao[]>(KEYS.reposicoes, []).map(normalizeReposicao);
export const setReposicoes = (v: Reposicao[]) => write(KEYS.reposicoes, v.map(normalizeReposicao));

export const getHistorico = () => read<HistoricoAcao[]>(KEYS.historico, []).map(normalizeHistorico);
export const setHistorico = (v: HistoricoAcao[]) => write(KEYS.historico, v.map(normalizeHistorico));

export const getLastBackupAt = () => localStorage.getItem(KEYS.lastBackupAt) || "";
export const setLastBackupAt = (iso = new Date().toISOString()) => {
  localStorage.setItem(KEYS.lastBackupAt, iso);
  window.dispatchEvent(new Event("ap:data"));
};

export function registrarEvento(evento: Omit<HistoricoAcao, "id" | "dataHora">) {
  const acao: HistoricoAcao = {
    id: uid(),
    dataHora: new Date().toISOString(),
    ...evento,
  };
  setHistorico([acao, ...getHistorico()]);
}

export function registrarAlteracaoStatus(
  reposicao: Reposicao,
  novoStatus: StatusReposicao,
  responsavel?: string,
  observacao?: string
) {
  registrarEvento({
    tipo: "status",
    entidade: "reposicao",
    entidadeId: reposicao.id,
    reposicaoId: reposicao.id,
    statusAnterior: reposicao.status,
    novoStatus,
    responsavel: responsavel || reposicao.responsavel,
    observacao,
    descricao: `Status alterado de ${reposicao.status} para ${novoStatus}`,
  });
}

export function carregarDadosExemplo() {
  const produtos: Produto[] = [
    { id: "p1", nome: "Leite Integral 1L", codigoBarras: "7891000100103", categoria: "Laticínios", marca: "Ninho", unidade: "un" },
    { id: "p2", nome: "Pão de Forma", codigoBarras: "7896005800012", categoria: "Padaria", marca: "Pullman", unidade: "un" },
    { id: "p3", nome: "Iogurte Natural 170g", codigoBarras: "7891025112341", categoria: "Laticínios", marca: "Danone", unidade: "un" },
    { id: "p4", nome: "Arroz Branco 5kg", codigoBarras: "7896006711002", categoria: "Mercearia", marca: "Tio João", unidade: "pct" },
    { id: "p5", nome: "Refrigerante Cola 2L", codigoBarras: "7894900011517", categoria: "Bebidas", marca: "Coca-Cola", unidade: "un" },
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
    { id: "r1", produtoId: "p1", localId: "l1", quantidade: 24, lote: "L-0426", dataReposicao: addDays(-5), dataValidade: addDays(4), responsavel: "Carlos", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r2", produtoId: "p2", localId: "l2", quantidade: 18, lote: "P-110", dataReposicao: addDays(-2), dataValidade: addDays(-1), responsavel: "Ana", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r3", produtoId: "p3", localId: "l1", quantidade: 30, lote: "DAN-77", dataReposicao: addDays(-10), dataValidade: addDays(12), responsavel: "Carlos", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r4", produtoId: "p4", localId: "l3", quantidade: 40, lote: "TJ-2026", dataReposicao: addDays(-1), dataValidade: addDays(120), responsavel: "Bruno", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r5", produtoId: "p5", localId: "l4", quantidade: 60, lote: "CC-0526", dataReposicao: addDays(-7), dataValidade: addDays(25), responsavel: "Ana", status: "ativo", criadoEm: new Date().toISOString() },
    { id: "r6", produtoId: "p6", localId: "l5", quantidade: 12, lote: "FR-901", dataReposicao: addDays(-3), dataValidade: addDays(7), responsavel: "Bruno", status: "ativo", criadoEm: new Date().toISOString() },
  ];

  setProdutos(produtos);
  setLocais(locais);
  setReposicoes(reposicoes);
  setHistorico([]);
  localStorage.setItem(KEYS.seeded, "manual");
  registrarEvento({ tipo: "sistema", entidade: "sistema", descricao: "Dados de exemplo carregados manualmente" });
  window.dispatchEvent(new Event("ap:data"));
}

export function seedIfNeeded() {
  // Mantido por compatibilidade com versões anteriores. Os dados de exemplo agora são carregados manualmente nas Configurações.
  return;
}

export function limparDados() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("ap:data"));
}

export function gerarBackup(): BackupData {
  const payload: Omit<BackupData, "checksum"> = {
    app: "ValeRepor",
    versao: CURRENT_BACKUP_VERSION,
    exportadoEm: new Date().toISOString(),
    produtos: getProdutos(),
    locais: getLocais(),
    reposicoes: getReposicoes(),
    historico: getHistorico(),
    notificacoes: read(KEYS.notifyConfig, { enabled: false, diasAntecedencia: 30 }),
  };
  return { ...payload, checksum: checksumPayload(payload) };
}

function assertBackupShape(data: unknown): BackupData {
  const backup = data as Partial<BackupData>;
  if (!backup || typeof backup !== "object") throw new Error("Arquivo de backup inválido.");
  if (backup.app !== "ValeRepor") throw new Error("Este arquivo não parece ser um backup do ValeRepor.");
  if (!Number.isFinite(Number(backup.versao))) throw new Error("Backup sem versão de schema.");
  if (!Array.isArray(backup.produtos)) throw new Error("Backup sem lista válida de produtos.");
  if (!Array.isArray(backup.locais)) throw new Error("Backup sem lista válida de setores/prateleiras.");
  if (!Array.isArray(backup.reposicoes)) throw new Error("Backup sem lista válida de reposições.");
  return backup as BackupData;
}

export function validarBackup(data: unknown): BackupPreview {
  const backup = assertBackupShape(data);
  return {
    app: backup.app,
    versao: Number(backup.versao),
    exportadoEm: text(backup.exportadoEm) || undefined,
    produtos: backup.produtos.length,
    locais: backup.locais.length,
    reposicoes: backup.reposicoes.length,
    historico: Array.isArray(backup.historico) ? backup.historico.length : 0,
  };
}

export function importarBackup(data: unknown) {
  const backup = assertBackupShape(data);
  const produtos = backup.produtos.map(normalizeProduto).filter((p) => p.nome);
  const locais = backup.locais.map(normalizeLocal).filter((l) => l.setor || l.prateleira);
  const produtoIds = new Set(produtos.map((p) => p.id));
  const localIds = new Set(locais.map((l) => l.id));
  const reposicoes = backup.reposicoes.map(normalizeReposicao).filter((r) => {
    if (!r.produtoId || !r.localId || !r.dataValidade || !r.responsavel || r.quantidade <= 0) return false;
    return produtoIds.has(r.produtoId) && localIds.has(r.localId);
  });
  const historico = Array.isArray(backup.historico) ? backup.historico.map(normalizeHistorico) : [];

  setProdutos(produtos);
  setLocais(locais);
  setReposicoes(reposicoes);
  setHistorico(historico);
  if (backup.notificacoes && typeof backup.notificacoes.enabled === "boolean") {
    localStorage.setItem(KEYS.notifyConfig, JSON.stringify({
      enabled: backup.notificacoes.enabled,
      diasAntecedencia: Math.min(90, Math.max(1, Number(backup.notificacoes.diasAntecedencia) || 30)),
    }));
  }
  registrarEvento({
    tipo: "importacao",
    entidade: "backup",
    descricao: `Backup importado: ${produtos.length} produtos, ${locais.length} locais, ${reposicoes.length} reposições`,
  });
  window.dispatchEvent(new Event("ap:data"));
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  out.push(current.trim());
  return out;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function importarProdutosCSV(csv: string): ImportProdutosResultado {
  const linhas = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) throw new Error("CSV sem linhas de produto.");
  const delimiter = (linhas[0].match(/;/g)?.length || 0) >= (linhas[0].match(/,/g)?.length || 0) ? ";" : ",";
  const headers = parseCsvLine(linhas[0], delimiter).map(semAcento);
  const idx = (names: string[]) => names.map(semAcento).map((n) => headers.indexOf(n)).find((i) => i >= 0) ?? -1;
  const iNome = idx(["nome", "produto", "descricao"]);
  if (iNome < 0) throw new Error("CSV precisa ter uma coluna 'nome' ou 'produto'.");
  const iCodigo = idx(["codigoBarras", "codigo_barras", "codigo", "ean", "gtin", "codigobarras"]);
  const iCategoria = idx(["categoria", "setor", "grupo"]);
  const iMarca = idx(["marca", "fabricante"]);
  const iUnidade = idx(["unidade", "un", "medida"]);

  const atuais = getProdutos();
  const novos = [...atuais];
  const resultado: ImportProdutosResultado = { criados: 0, atualizados: 0, ignorados: 0, erros: [] };

  linhas.slice(1).forEach((linha, offset) => {
    const cols = parseCsvLine(linha, delimiter);
    const nome = text(cols[iNome]);
    if (!nome) {
      resultado.ignorados++;
      resultado.erros.push(`Linha ${offset + 2}: produto sem nome.`);
      return;
    }
    const codigoBarras = iCodigo >= 0 ? text(cols[iCodigo]) : "";
    const payload = {
      nome,
      codigoBarras,
      categoria: iCategoria >= 0 ? text(cols[iCategoria]) : "",
      marca: iMarca >= 0 ? text(cols[iMarca]) : "",
      unidade: iUnidade >= 0 ? text(cols[iUnidade]) || "un" : "un",
    };
    const existenteIndex = novos.findIndex((p) =>
      (codigoBarras && p.codigoBarras === codigoBarras) || semAcento(p.nome) === semAcento(nome)
    );
    if (existenteIndex >= 0) {
      novos[existenteIndex] = { ...novos[existenteIndex], ...payload };
      resultado.atualizados++;
    } else {
      novos.push({ id: uid(), ...payload });
      resultado.criados++;
    }
  });

  setProdutos(novos);
  registrarEvento({
    tipo: "importacao",
    entidade: "produto",
    descricao: `CSV de produtos importado: ${resultado.criados} criados, ${resultado.atualizados} atualizados, ${resultado.ignorados} ignorados`,
  });
  return resultado;
}

export function modeloCSVProdutos() {
  return [
    ["nome", "codigoBarras", "categoria", "marca", "unidade"].join(";"),
    ["Leite Integral 1L", "7891000100103", "Laticínios", "Marca Exemplo", "un"].join(";"),
  ].join("\n");
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
