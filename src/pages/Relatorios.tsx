import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { diasRestantes, faixa } from "@/lib/storage";
import { STATUS_LABEL, StatusReposicao } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Download, FileBarChart, PackageX, TimerReset } from "lucide-react";

type Tipo = "proximos" | "vencidos" | "porSetor" | "historico" | "acoes";
type Linha = Record<string, string | number>;

const statusOptions: Array<StatusReposicao | "todos"> = ["todos", "ativo", "conferido", "retirado", "vendido", "descartado", "erro"];

export default function Relatorios() {
  const { reposicoes, produtos, locais, historico } = useData();
  const [tipo, setTipo] = useState<Tipo>("proximos");
  const [setor, setSetor] = useState("todos");
  const [status, setStatus] = useState<StatusReposicao | "todos">("todos");

  const setores = useMemo(() => [...new Set(locais.map((l) => l.setor).filter(Boolean))].sort(), [locais]);

  const reposicoesFiltradas = useMemo(() => {
    return reposicoes.filter((r) => {
      const local = locais.find((l) => l.id === r.localId);
      const setorOk = setor === "todos" || local?.setor === setor;
      const statusOk = status === "todos" || r.status === status;
      return setorOk && statusOk;
    });
  }, [reposicoes, locais, setor, status]);

  const kpis = useMemo(() => {
    return reposicoesFiltradas.reduce(
      (acc, r) => {
        const d = diasRestantes(r.dataValidade);
        if (r.status === "ativo") {
          if (d < 0) acc.vencidos += 1;
          else if (d <= 30) acc.proximos += 1;
        }
        if (r.status === "retirado" || r.status === "descartado") acc.perdas += r.quantidade;
        if (r.status !== "ativo") acc.tratados += 1;
        return acc;
      },
      { vencidos: 0, proximos: 0, perdas: 0, tratados: 0 }
    );
  }, [reposicoesFiltradas]);

  const linhas = useMemo<Linha[]>(() => {
    const enrich = (r: typeof reposicoes[number]) => {
      const p = produtos.find((x) => x.id === r.produtoId);
      const l = locais.find((x) => x.id === r.localId);
      const dias = diasRestantes(r.dataValidade);
      return {
        Produto: p?.nome ?? "—",
        CodigoBarras: p?.codigoBarras ?? "",
        Marca: p?.marca ?? "",
        Setor: l?.setor ?? "",
        Corredor: l?.corredor ?? "",
        Prateleira: l?.prateleira ?? "",
        Quantidade: r.quantidade,
        Lote: r.lote ?? "",
        DataReposicao: r.dataReposicao,
        DataValidade: r.dataValidade,
        DiasRestantes: dias,
        Responsavel: r.responsavel,
        Status: STATUS_LABEL[r.status],
      };
    };

    if (tipo === "acoes") {
      return historico.map((h) => {
        const r = h.reposicaoId ? reposicoes.find((x) => x.id === h.reposicaoId) : undefined;
        const p = r ? produtos.find((x) => x.id === r.produtoId) : undefined;
        const l = r ? locais.find((x) => x.id === r.localId) : undefined;
        return {
          DataHora: new Date(h.dataHora).toLocaleString("pt-BR"),
          Tipo: h.tipo ?? "status",
          Descricao: h.descricao ?? h.observacao ?? "—",
          Produto: p?.nome ?? "—",
          Lote: r?.lote ?? "",
          Setor: l?.setor ?? "",
          StatusAnterior: h.statusAnterior ? STATUS_LABEL[h.statusAnterior] : "",
          NovoStatus: h.novoStatus ? STATUS_LABEL[h.novoStatus] : "",
          Responsavel: h.responsavel ?? "",
        };
      });
    }

    if (tipo === "vencidos") {
      return reposicoesFiltradas.filter((r) => r.status === "ativo" && diasRestantes(r.dataValidade) < 0).map(enrich);
    }
    if (tipo === "proximos") {
      return reposicoesFiltradas
        .filter((r) => r.status === "ativo" && faixa(diasRestantes(r.dataValidade)) !== "ok")
        .sort((a, b) => diasRestantes(a.dataValidade) - diasRestantes(b.dataValidade))
        .map(enrich);
    }
    if (tipo === "historico") {
      return [...reposicoesFiltradas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map(enrich);
    }
    return [...reposicoesFiltradas]
      .sort((a, b) => {
        const la = locais.find((x) => x.id === a.localId)?.setor ?? "";
        const lb = locais.find((x) => x.id === b.localId)?.setor ?? "";
        return la.localeCompare(lb);
      })
      .map(enrich);
  }, [tipo, reposicoesFiltradas, reposicoes, produtos, locais, historico]);

  const totais = useMemo(() => {
    const porStatus = reposicoesFiltradas.reduce<Record<string, number>>((acc, r) => {
      const label = STATUS_LABEL[r.status];
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const porSetor = reposicoesFiltradas.reduce<Record<string, number>>((acc, r) => {
      const s = locais.find((l) => l.id === r.localId)?.setor || "Sem setor";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return { porStatus, porSetor };
  }, [reposicoesFiltradas, locais]);

  function exportarCSV() {
    if (linhas.length === 0) return;
    const headers = Object.keys(linhas[0]);
    const csv = [
      headers.join(";"),
      ...linhas.map((l) => headers.map((h) => `"${String(l[h] ?? "").replace(/"/g, '""')}"`).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Visão simples para gerente: vencimentos, perdas, ações e exportação.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4 shadow-card"><AlertTriangle className="mb-2 h-5 w-5 text-destructive" /><div className="text-2xl font-black">{kpis.vencidos}</div><div className="text-xs text-muted-foreground">Vencidos ativos</div></Card>
        <Card className="p-4 shadow-card"><TimerReset className="mb-2 h-5 w-5 text-warning" /><div className="text-2xl font-black">{kpis.proximos}</div><div className="text-xs text-muted-foreground">Vencem em 30 dias</div></Card>
        <Card className="p-4 shadow-card"><PackageX className="mb-2 h-5 w-5 text-destructive" /><div className="text-2xl font-black">{kpis.perdas}</div><div className="text-xs text-muted-foreground">Qtd. retirada/descartada</div></Card>
        <Card className="p-4 shadow-card"><CheckCircle2 className="mb-2 h-5 w-5 text-primary" /><div className="text-2xl font-black">{kpis.tratados}</div><div className="text-xs text-muted-foreground">Ações tratadas</div></Card>
      </div>

      <Card className="p-4 shadow-card grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="proximos">Produtos próximos do vencimento</SelectItem>
            <SelectItem value="vencidos">Produtos vencidos</SelectItem>
            <SelectItem value="porSetor">Produtos por setor</SelectItem>
            <SelectItem value="historico">Histórico de reposições</SelectItem>
            <SelectItem value="acoes">Histórico de ações/auditoria</SelectItem>
          </SelectContent>
        </Select>
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusReposicao | "todos")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos status" : STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={exportarCSV} className="bg-gradient-primary" disabled={linhas.length === 0}>
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </Card>

      {Object.keys(totais.porSetor).length > 0 && (
        <Card className="p-4 shadow-card">
          <h2 className="font-semibold mb-2">Totais por setor</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totais.porSetor).sort((a, b) => b[1] - a[1]).map(([s, total]) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{s}: {total}</span>
            ))}
          </div>
        </Card>
      )}

      <Card className="shadow-card overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{linhas.length} registros</h2>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>{linhas[0] ? Object.keys(linhas[0]).slice(0, 9).map((h) => <th key={h} className="p-3 font-medium">{h}</th>) : <th className="p-3 font-medium">Dados</th>}</tr>
            </thead>
            <tbody>
              {linhas.length === 0 && <tr><td className="p-8 text-center text-muted-foreground">Sem dados.</td></tr>}
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-border/60">
                  {Object.keys(l).slice(0, 9).map((h) => <td key={h} className="p-3 whitespace-nowrap">{l[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y">
          {linhas.length === 0 && <div className="p-8 text-center text-muted-foreground">Sem dados.</div>}
          {linhas.map((l, i) => (
            <div key={i} className="p-4 space-y-1 text-sm">
              {Object.entries(l).slice(0, 9).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
