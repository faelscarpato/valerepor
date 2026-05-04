import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { diasRestantes, faixa } from "@/lib/storage";
import { STATUS_LABEL } from "@/lib/types";
import { Download, FileBarChart } from "lucide-react";

type Tipo = "proximos" | "vencidos" | "porSetor" | "historico" | "acoes";

type Linha = Record<string, string | number>;

export default function Relatorios() {
  const { reposicoes, produtos, locais, historico } = useData();
  const [tipo, setTipo] = useState<Tipo>("proximos");

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
        const r = reposicoes.find((x) => x.id === h.reposicaoId);
        const p = r ? produtos.find((x) => x.id === r.produtoId) : undefined;
        const l = r ? locais.find((x) => x.id === r.localId) : undefined;
        return {
          DataHora: new Date(h.dataHora).toLocaleString("pt-BR"),
          Produto: p?.nome ?? "—",
          Lote: r?.lote ?? "",
          Setor: l?.setor ?? "",
          Prateleira: l?.prateleira ?? "",
          StatusAnterior: STATUS_LABEL[h.statusAnterior],
          NovoStatus: STATUS_LABEL[h.novoStatus],
          Responsavel: h.responsavel ?? "",
        };
      });
    }

    if (tipo === "vencidos") {
      return reposicoes.filter((r) => r.status === "ativo" && diasRestantes(r.dataValidade) < 0).map(enrich);
    }
    if (tipo === "proximos") {
      return reposicoes
        .filter((r) => r.status === "ativo" && faixa(diasRestantes(r.dataValidade)) !== "ok")
        .sort((a, b) => diasRestantes(a.dataValidade) - diasRestantes(b.dataValidade))
        .map(enrich);
    }
    if (tipo === "historico") {
      return [...reposicoes]
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .map(enrich);
    }
    return [...reposicoes]
      .sort((a, b) => {
        const la = locais.find((x) => x.id === a.localId)?.setor ?? "";
        const lb = locais.find((x) => x.id === b.localId)?.setor ?? "";
        return la.localeCompare(lb);
      })
      .map(enrich);
  }, [tipo, reposicoes, produtos, locais, historico]);

  const totais = useMemo(() => {
    const porStatus = reposicoes.reduce<Record<string, number>>((acc, r) => {
      const label = STATUS_LABEL[r.status];
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const porSetor = reposicoes.reduce<Record<string, number>>((acc, r) => {
      const setor = locais.find((l) => l.id === r.localId)?.setor || "Sem setor";
      acc[setor] = (acc[setor] || 0) + 1;
      return acc;
    }, {});
    return { porStatus, porSetor };
  }, [reposicoes, locais]);

  function exportarCSV() {
    if (linhas.length === 0) return;
    const headers = Object.keys(linhas[0]);
    const csv = [
      headers.join(";"),
      ...linhas.map((l) =>
        headers.map((h) => `"${String(l[h] ?? "").replace(/"/g, '""')}"`).join(";")
      ),
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
        <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Análises e exportação de dados</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(totais.porStatus).map(([label, total]) => (
          <Card key={label} className="p-4 shadow-card">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 shadow-card flex flex-col sm:flex-row gap-3">
        <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
          <SelectTrigger className="sm:w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="proximos">Produtos próximos do vencimento</SelectItem>
            <SelectItem value="vencidos">Produtos vencidos</SelectItem>
            <SelectItem value="porSetor">Produtos por setor</SelectItem>
            <SelectItem value="historico">Histórico de reposições</SelectItem>
            <SelectItem value="acoes">Histórico de ações</SelectItem>
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
            {Object.entries(totais.porSetor).map(([setor, total]) => (
              <span key={setor} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {setor}: {total}
              </span>
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
              <tr>
                {linhas[0]
                  ? Object.keys(linhas[0]).slice(0, 8).map((h) => <th key={h} className="p-3 font-medium">{h}</th>)
                  : <th className="p-3 font-medium">Dados</th>}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr><td className="p-8 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-border/60">
                  {Object.keys(l).slice(0, 8).map((h) => <td key={h} className="p-3 whitespace-nowrap">{l[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y">
          {linhas.length === 0 && <div className="p-8 text-center text-muted-foreground">Sem dados.</div>}
          {linhas.map((l, i) => (
            <div key={i} className="p-4 space-y-1 text-sm">
              {Object.entries(l).slice(0, 8).map(([k, v]) => (
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
