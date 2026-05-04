import { getLocais, getProdutos, getReposicoes, diasRestantes, faixa } from "./storage";

const LAST_KEY = "ap_last_notify_check";
const NOTIFIED_KEY = "ap_notified_ids";

export type NotifyConfig = {
  enabled: boolean;
  diasAntecedencia: number; // dispara quando dias restantes <= este valor
};

const CONFIG_KEY = "ap_notify_config";

export function getNotifyConfig(): NotifyConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return { enabled: false, diasAntecedencia: 30 };
}

export function setNotifyConfig(cfg: NotifyConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export async function ensurePermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

function getNotifiedIds(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}");
  } catch {
    return {};
  }
}

function setNotifiedIds(map: Record<string, string>) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

export async function verificarEnotificar(force = false): Promise<number> {
  const cfg = getNotifyConfig();
  if (!cfg.enabled) return 0;
  if (!("Notification" in window) || Notification.permission !== "granted") return 0;

  const hoje = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(LAST_KEY);
  if (!force && last === hoje) return 0;

  const reposicoes = getReposicoes();
  const produtos = getProdutos();
  const locais = getLocais();
  const notified = getNotifiedIds();

  const itens = reposicoes.filter((r) => {
    if (r.status !== "ativo") return false;
    const dias = diasRestantes(r.dataValidade);
    return dias <= cfg.diasAntecedencia;
  });

  let enviadas = 0;
  // Prefer service worker notifications (work even when app is closed)
  const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;

  for (const r of itens) {
    const key = `${r.id}:${r.dataValidade}`;
    if (notified[key] === hoje && !force) continue;
    const p = produtos.find((x) => x.id === r.produtoId);
    const l = locais.find((x) => x.id === r.localId);
    const dias = diasRestantes(r.dataValidade);
    const f = faixa(dias);
    const titulo =
      f === "vencido"
        ? `⚠️ Produto vencido: ${p?.nome ?? ""}`
        : `⏰ Vence em ${dias}d: ${p?.nome ?? ""}`;
    const lote = r.lote ? ` · Lote ${r.lote}` : "";
    const corpo = `${l?.setor ?? ""} · ${l?.prateleira ?? ""} · Qtd ${r.quantidade}${lote}`;

    try {
      if (reg && "showNotification" in reg) {
        await reg.showNotification(titulo, {
          body: corpo,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `vencimento-${r.id}`,
          data: { url: "/alertas" },
        });
      } else {
        new Notification(titulo, { body: corpo, icon: "/icon-192.png", tag: `vencimento-${r.id}` });
      }
      notified[key] = hoje;
      enviadas++;
    } catch {
      // ignore individual notification failures
    }
  }

  setNotifiedIds(notified);
  localStorage.setItem(LAST_KEY, hoje);
  return enviadas;
}

export function iniciarVerificacaoPeriodica() {
  // Verifica imediatamente e depois a cada 6 horas enquanto a aba estiver aberta.
  // Notificação 100% garantida com o app fechado exige suporte do navegador/PWA.
  verificarEnotificar();
  setInterval(() => verificarEnotificar(), 6 * 60 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") verificarEnotificar();
  });
}

export async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // ignore registration errors
  }
}
