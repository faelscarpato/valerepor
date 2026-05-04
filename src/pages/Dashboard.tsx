import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  PlusCircle,
  CalendarClock,
  MapPin,
  Bell,
  ArrowRight,
  FileBarChart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/hooks/useData";
import { diasRestantes, faixa } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { reposicoes, produtos, locais } = useData();
  const ativos = reposicoes.filter((r) => r.status === "ativo");

  const counts = { vencido: 0, d7: 0, d15: 0, d30: 0 };
  ativos.forEach((r) => {
    const f = faixa(diasRestantes(r.dataValidade));
    if (f === "vencido") counts.vencido++;
    else if (f === "7") counts.d7++;
    else if (f === "15") counts.d15++;
    else if (f === "30") counts.d30++;
  });

  const cards = [
    { label: "Vencidos", helper: "Retirar agora", value: counts.vencido, icon: AlertTriangle, tone: "destructive" as const },
    { label: "Até 7 dias", helper: "Alta prioridade", value: counts.d7, icon: Clock, tone: "warning" as const },
    { label: "Até 15 dias", helper: "Acompanhar", value: counts.d15, icon: CalendarClock, tone: "caution" as const },
    { label: "Até 30 dias", helper: "Programar ação", value: counts.d30, icon: CheckCircle2, tone: "success" as const },
  ];

  const toneClasses = {
    destructive: "bg-destructive/10 text-destructive ring-destructive/15",
    warning: "bg-warning/10 text-warning ring-warning/15",
    caution: "bg-caution/20 text-caution-foreground ring-caution/20",
    success: "bg-success/10 text-success ring-success/15",
  };

  const badgeClasses = {
    vencido: "bg-destructive text-destructive-foreground",
    "7": "bg-destructive text-destructive-foreground",
    "15": "bg-warning text-warning-foreground",
    "30": "bg-caution text-caution-foreground",
    ok: "bg-success text-success-foreground",
  } as const;

  const proximos = [...ativos]
    .sort((a, b) => diasRestantes(a.dataValidade) - diasRestantes(b.dataValidade))
    .slice(0, 5);

  const totalAlertas = counts.vencido + counts.d7 + counts.d15 + counts.d30;

  return (
    <div className="space-y-5 md:space-y-7">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-primary p-5 text-primary-foreground shadow-elevated md:p-8">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 left-1/2 h-52 w-52 rounded-full bg-emerald-900/20 blur-2xl" />

        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
              Controle de validade e reposição
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              Acompanhe os vencimentos das prateleiras, priorize retiradas e registre novas reposições em poucos toques.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Button asChild size="lg" className="h-12 rounded-2xl bg-white text-primary shadow-lg hover:bg-white/90">
              <Link to="/nova">
                <PlusCircle className="h-5 w-5" /> Nova Reposição
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 rounded-2xl bg-white/12 text-white hover:bg-white/20 hover:text-white">
              <Link to="/alertas">
                <Bell className="h-5 w-5" /> Ver alertas
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="group overflow-hidden rounded-3xl border-border/70 bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-4xl font-black tracking-tight md:text-5xl">{c.value}</div>
                <div className="mt-2 text-sm font-bold leading-tight md:text-base">{c.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.helper}</div>
              </div>
              <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1", toneClasses[c.tone])}>
                <c.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <Link to="/alertas" className="block">
          <Card className="rounded-3xl border-border/70 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-6 w-6" /></div>
                <div><div className="text-2xl font-black">{totalAlertas}</div><div className="text-sm font-semibold text-muted-foreground">Alertas ativos</div></div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

        <Link to="/produtos" className="block">
          <Card className="rounded-3xl border-border/70 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Package className="h-6 w-6" /></div>
                <div><div className="text-2xl font-black">{produtos.length}</div><div className="text-sm font-semibold text-muted-foreground">Produtos cadastrados</div></div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

        <Link to="/locais" className="block">
          <Card className="rounded-3xl border-border/70 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><MapPin className="h-6 w-6" /></div>
                <div><div className="text-2xl font-black">{locais.length}</div><div className="text-sm font-semibold text-muted-foreground">Setores/Prateleiras</div></div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-card">
        <div className="flex items-center justify-between border-b border-border/70 bg-card px-5 py-4">
          <div><h2 className="text-lg font-black">Próximos vencimentos</h2><p className="text-xs text-muted-foreground">Ordenado por urgência</p></div>
          <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link to="/alertas">Ver todos</Link></Button>
        </div>

        <div className="divide-y divide-border/70">
          {proximos.length === 0 && <p className="p-5 text-sm text-muted-foreground">Nenhuma reposição ativa.</p>}
          {proximos.map((r) => {
            const p = produtos.find((x) => x.id === r.produtoId);
            const l = locais.find((x) => x.id === r.localId);
            const dias = diasRestantes(r.dataValidade);
            const f = faixa(dias);
            return (
              <Link key={r.id} to="/alertas" className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/45">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold md:text-base">{p?.nome ?? "Produto não encontrado"}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {l ? `${l.setor} · Corredor ${l.corredor} · ${l.prateleira}` : "Local não encontrado"}{r.lote ? ` · Lote ${r.lote}` : ""}
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-black", badgeClasses[f])}>
                  {dias < 0 ? `Vencido ${Math.abs(dias)}d` : `${dias} dias`}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-[28px] border-dashed border-primary/25 bg-primary/5 p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><FileBarChart className="h-5 w-5" /></div>
            <div><div className="font-black">Resumo pronto para conferência</div><div className="text-sm text-muted-foreground">Use relatórios para filtrar por setor, produto, status e responsável.</div></div>
          </div>
          <Button asChild className="rounded-2xl"><Link to="/relatorios">Abrir relatórios</Link></Button>
        </div>
      </Card>
    </div>
  );
}
