import { ChangeEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, CheckCircle2, Database, Download, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import {
  ensurePermission,
  getNotifyConfig,
  setNotifyConfig,
  verificarEnotificar,
} from "@/lib/notifications";
import { carregarDadosExemplo, gerarBackup, importarBackup, limparDados, setLastBackupAt, validarBackup } from "@/lib/storage";
import { toast } from "@/components/ui/sonner";
import { useData } from "@/hooks/useData";

export default function Configuracoes() {
  const { produtos, locais, reposicoes, historico, lastBackupAt } = useData();
  const [enabled, setEnabled] = useState(false);
  const [dias, setDias] = useState(30);
  const [perm, setPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  useEffect(() => {
    const cfg = getNotifyConfig();
    setEnabled(cfg.enabled);
    setDias(cfg.diasAntecedencia);
  }, []);

  async function toggle(v: boolean) {
    if (v) {
      const p = await ensurePermission();
      setPerm(p);
      if (p !== "granted") {
        toast.error("Permissão de notificações negada pelo navegador.");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const anyReg = reg as unknown as { periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } };
        if (anyReg?.periodicSync) {
          await anyReg.periodicSync.register("verifica-validades", {
            minInterval: 12 * 60 * 60 * 1000,
          });
        }
      } catch {
        // Periodic Sync não disponível. O app mantém verificação ao abrir/voltar para a aba.
      }
    }
    setEnabled(v);
    setNotifyConfig({ enabled: v, diasAntecedencia: dias });
  }

  function salvarDias(n: number) {
    const novoValor = Math.min(90, Math.max(1, n || 30));
    setDias(novoValor);
    setNotifyConfig({ enabled, diasAntecedencia: novoValor });
  }

  async function testar() {
    const p = await ensurePermission();
    setPerm(p);
    if (p !== "granted") return toast.error("Permita as notificações primeiro.");
    const n = await verificarEnotificar(true);
    toast.success("Verificação concluída", { description: `${n} notificação(ões) enviada(s).` });
  }

  function exportarBackup() {
    const backup = gerarBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valerepor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastBackupAt();
    toast.success("Backup exportado com segurança.", { description: `Checksum: ${backup.checksum}` });
  }

  async function importarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const texto = await file.text();
      const json = JSON.parse(texto);
      const preview = validarBackup(json);
      const confirmar = window.confirm(
        `Backup ValeRepor encontrado.\n\nProdutos: ${preview.produtos}\nSetores: ${preview.locais}\nReposições: ${preview.reposicoes}\nHistórico: ${preview.historico}\n\nA importação vai substituir os dados atuais deste dispositivo. Deseja continuar?`
      );
      if (!confirmar) return;
      importarBackup(json);
      toast.success("Backup importado com sucesso.", {
        description: `${preview.produtos} produtos, ${preview.locais} setores e ${preview.reposicoes} reposições restauradas.`,
      });
    } catch (error) {
      toast.error("Não foi possível importar o backup.", {
        description: error instanceof Error ? error.message : "Arquivo inválido.",
      });
    }
  }

  function carregarExemplos() {
    if (!window.confirm("Carregar dados de exemplo vai substituir os dados atuais. Continuar?")) return;
    carregarDadosExemplo();
    toast.success("Dados de exemplo carregados.");
  }

  function limpar() {
    if (!window.confirm("Isso vai apagar produtos, locais, reposições, histórico e configurações salvos neste dispositivo. Deseja continuar?")) return;
    limparDados();
    setEnabled(false);
    setDias(30);
    toast.success("Dados locais limpos.");
  }

  const lastBackupLabel = lastBackupAt ? new Date(lastBackupAt).toLocaleString("pt-BR") : "Nenhum backup exportado nesta instalação";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">Notificações, PWA, backup e governança dos dados locais.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4 shadow-card"><div className="text-2xl font-black">{produtos.length}</div><div className="text-xs text-muted-foreground">Produtos</div></Card>
        <Card className="p-4 shadow-card"><div className="text-2xl font-black">{locais.length}</div><div className="text-xs text-muted-foreground">Setores</div></Card>
        <Card className="p-4 shadow-card"><div className="text-2xl font-black">{reposicoes.length}</div><div className="text-xs text-muted-foreground">Reposições</div></Card>
        <Card className="p-4 shadow-card"><div className="text-2xl font-black">{historico.length}</div><div className="text-xs text-muted-foreground">Eventos</div></Card>
      </div>

      <Card className="p-5 shadow-card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Notificações de validade</div>
              <p className="text-sm text-muted-foreground">
                Receba alertas quando produtos estiverem próximos do vencimento. O padrão operacional é 30 dias.
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
          <div className="space-y-2">
            <Label>Avisar faltando</Label>
            <Input type="number" min={1} max={90} value={dias} onChange={(e) => salvarDias(Number(e.target.value))} />
          </div>
          <div className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
            Status da permissão: <strong>{perm}</strong>{perm === "denied" && " — habilite manualmente nas configurações do navegador."}
          </div>
        </div>

        <Button onClick={testar} variant="outline" className="rounded-2xl">
          <BellRing className="w-4 h-4" /> Verificar alertas agora
        </Button>
      </Card>

      <Card className="p-5 shadow-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">Backup e restauração segura</div>
            <p className="text-sm text-muted-foreground">
              Os dados ficam salvos neste dispositivo. O backup agora usa versão de schema, validação e checksum simples.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Último backup</div>
          <div className="mt-1 text-muted-foreground">{lastBackupLabel}</div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button onClick={exportarBackup} className="rounded-2xl bg-gradient-primary">
            <Download className="w-4 h-4" /> Exportar backup JSON
          </Button>
          <div>
            <Input id="backup" type="file" accept="application/json,.json" className="hidden" onChange={importarArquivo} />
            <Button asChild variant="outline" className="w-full rounded-2xl">
              <Label htmlFor="backup" className="cursor-pointer"><FileUp className="w-4 h-4" /> Importar backup validado</Label>
            </Button>
          </div>
          <Button onClick={carregarExemplos} variant="outline" className="rounded-2xl">
            Carregar dados de exemplo
          </Button>
          <Button onClick={limpar} variant="destructive" className="rounded-2xl">
            <Trash2 className="w-4 h-4" /> Limpar dados locais
          </Button>
        </div>
      </Card>

      <Card className="p-5 shadow-card text-sm text-muted-foreground space-y-2">
        <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /><span><strong className="text-foreground">Cloudflare Pages:</strong> build configurado para `npm ci` + `npm run build`, com `package-lock.json` sincronizado.</span></p>
        <p><strong className="text-foreground">Funciona offline:</strong> após o primeiro carregamento, o app salva dados no dispositivo e usa cache básico do PWA.</p>
        <p><strong className="text-foreground">Atenção:</strong> se limpar o navegador, trocar de aparelho ou desinstalar o app, os dados podem ser perdidos. Use backup JSON regularmente.</p>
        <p><strong className="text-foreground">Notificações em segundo plano:</strong> dependem do navegador, permissões e instalação como PWA. Com o app aberto, ele verifica ao iniciar, ao voltar para a aba e periodicamente.</p>
      </Card>
    </div>
  );
}
