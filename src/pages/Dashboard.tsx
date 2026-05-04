import { Link } from "react-router-dom";
import { AlertTriangle, Clock, CheckCircle2, Package, PlusCircle, CalendarClock } from "lucide-react";
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
    { label: "Produtos vencidos", value: counts.vencido, icon: AlertTriangle, tone: "destructive" as const },
    { label: "Vencem em 7 dias", value: counts.d7, icon: Clock, tone: "warning" as const },
    { label: "Vencem em 15 dias", value: counts.d15, icon: CalendarClock, tone: "caution" as const },
    { label: "Vencem em 30 dias", value: counts.d30, icon: CheckCircle2, tone: "success" as const },
  ];

  const toneClasses = {
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    caution: "bg-caution/15 text-caution-foreground",
    success: "bg-success/10 text-success",
  };

  const proximos = [...ativos]
    .sort((a, b) => diasRestantes(a.dataValidade) - diasRestantes(b.dataValidade))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral das validades nas prateleiras</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-primary shadow-elevated">
          <Link to="/nova">
            <PlusCircle className="w-5 h-5" /> Nova Reposição
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 md:p-5 shadow-card border-border/60">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl md:text-4xl font-bold">{c.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{c.label}</div>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", toneClasses[c.tone])}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold">{ativos.length}</div>
              <div className="text-xs text-muted-foreground">Reposições monitoradas</div>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold">{produtos.length}</div>
              <div className="text-xs text-muted-foreground">Produtos cadastrados</div>
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <div className="text-2xl font-bold">{locais.length}</div>
              <div className="text-xs text-muted-foreground">Setores/Prateleiras</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Próximos vencimentos</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/alertas">Ver todos</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {proximos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma reposição ativa.</p>
          )}
          {proximos.map((r) => {
            const p = produtos.find((x) => x.id === r.produtoId);
            const l = locais.find((x) => x.id === r.localId);
            const dias = diasRestantes(r.dataValidade);
            const f = faixa(dias);
            const color =
              f === "vencido" || f === "7"
                ? "bg-destructive text-destructive-foreground"
                : f === "15"
                ? "bg-warning text-warning-foreground"
                : f === "30"
                ? "bg-caution text-caution-foreground"
                : "bg-success text-success-foreground";
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p?.nome ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l?.setor} · Corredor {l?.corredor} · {l?.prateleira}
                  </div>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-3", color)}>
                  {dias < 0 ? `Vencido há ${Math.abs(dias)}d` : `${dias} dias`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
