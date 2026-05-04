import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import {
  ensurePermission,
  getNotifyConfig,
  setNotifyConfig,
  verificarEnotificar,
} from "@/lib/notifications";
import { toast } from "sonner";

export default function Configuracoes() {
  const [enabled, setEnabled] = useState(false);
  const [dias, setDias] = useState(7);
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
      // Tenta agendar Periodic Background Sync se disponível
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const anyReg = reg as unknown as { periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } };
        if (anyReg?.periodicSync) {
          await anyReg.periodicSync.register("verifica-validades", {
            minInterval: 12 * 60 * 60 * 1000,
          });
        }
      } catch {
        // periodic sync não disponível — fallback ao verificar quando a aba abrir
      }
    }
    setEnabled(v);
    setNotifyConfig({ enabled: v, diasAntecedencia: dias });
  }

  function salvarDias(n: number) {
    setDias(n);
    setNotifyConfig({ enabled, diasAntecedencia: n });
  }

  async function testar() {
    const p = await ensurePermission();
    if (p !== "granted") return toast.error("Permita as notificações primeiro.");
    const n = await verificarEnotificar(true);
    toast.success(`Verificação concluída`, { description: `${n} notificação(ões) enviadas.` });
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Notificações e preferências do app</p>
      </header>

      <Card className="p-5 shadow-card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Notificações de validade</div>
              <p className="text-sm text-muted-foreground">
                Receba alertas no dispositivo quando produtos estiverem próximos do vencimento.
              </p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>

        <div className="space-y-2">
          <Label>Avisar quando faltarem (dias)</Label>
          <Input
            type="number"
            min={1}
            max={90}
            value={dias}
            onChange={(e) => salvarDias(Math.max(1, Number(e.target.value) || 1))}
            className="max-w-[160px]"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Status da permissão: <strong>{perm}</strong>
          {perm === "denied" && " — habilite manualmente nas configurações do navegador."}
        </div>

        <Button onClick={testar} variant="outline">
          <BellRing className="w-4 h-4" /> Verificar agora e notificar
        </Button>
      </Card>

      <Card className="p-5 shadow-card text-sm text-muted-foreground space-y-2">
        <p><strong className="text-foreground">Funciona offline:</strong> as verificações usam dados salvos no dispositivo, sem precisar de internet.</p>
        <p><strong className="text-foreground">Notificações em segundo plano:</strong> em dispositivos compatíveis (Android/Chrome) instale o app na tela inicial para que as verificações periódicas continuem mesmo com o app fechado.</p>
        <p>iOS exige instalar como PWA (Compartilhar → Adicionar à Tela de Início) para liberar notificações.</p>
      </Card>
    </div>
  );
}
