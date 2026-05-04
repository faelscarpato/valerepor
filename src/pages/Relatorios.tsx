import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { diasRestantes, faixa } from "@/lib/storage";
import { STATUS_LABEL } from "@/lib/types";
import { Download, FileBarChart } from "lucide-react";

type Tipo = "proximos" | "vencidos" | "porSetor" | "historico";

export default function Relatorios() {
  const { reposicoes, produtos, locais } = useData();
  const [tipo, setTipo] = useState<Tipo>("proximos");

  const linhas = useMemo(() => {
    const enrich = (r: typeof reposicoes[number]) => {
      const p = produtos.find((x) => x.id === r.produtoId);
      const l = locais.find((x) => x.id === r.localId);
      const dias = diasRestantes(r.dataValidade);
      return {
        Produto: p?.nome ?? "—",
        Marca: p?.marca ?? "",
        Setor: l?.setor ?? "",
        Corredor: l?.corredor ?? "",
        Prateleira: l?.prateleira ?? "",
        Quantidade: r.quantidade,
        DataReposicao: r.dataReposicao,
        DataValidade: r.dataValidade,
        DiasRestantes: dias,
        Responsavel: r.responsavel,
        Status: STATUS_LABEL[r.status],
      };
    };

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
    // porSetor
    return [...reposicoes]
      .sort((a, b) => {
        const la = locais.find((x) => x.id === a.localId)?.setor ?? "";
        const lb = locais.find((x) => x.id === b.localId)?.setor ?? "";
        return la.localeCompare(lb);
      })
      .map(enrich);
  }, [tipo, reposicoes, produtos, locais]);

  function exportarCSV() {
    if (linhas.length === 0) return;
    const headers = Object.keys(linhas[0]);
    const csv = [
      headers.join(";"),
      ...linhas.map((l) =>
        headers.map((h) => `"${String((l as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(";")
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

      <Card className="p-4 shadow-card flex flex-col sm:flex-row gap-3">
        <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
          <SelectTrigger className="sm:w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="proximos">Produtos próximos do vencimento</SelectItem>
            <SelectItem value="vencidos">Produtos vencidos</SelectItem>
            <SelectItem value="porSetor">Produtos por setor</SelectItem>
            <SelectItem value="historico">Histórico de reposições</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportarCSV} className="bg-gradient-primary">
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{linhas.length} registros</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Produto</th>
                <th className="p-3 font-medium">Setor</th>
                <th className="p-3 font-medium">Prateleira</th>
                <th className="p-3 font-medium">Validade</th>
                <th className="p-3 font-medium">Dias</th>
                <th className="p-3 font-medium">Qtd</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sem dados.</td></tr>
              )}
              {linhas.map((l, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="p-3">{l.Produto}</td>
                  <td className="p-3">{l.Setor}</td>
                  <td className="p-3">{l.Prateleira}</td>
                  <td className="p-3">{new Date(l.DataValidade + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">{l.DiasRestantes}</td>
                  <td className="p-3">{l.Quantidade}</td>
                  <td className="p-3">{l.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
