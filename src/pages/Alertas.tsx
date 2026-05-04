import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { diasRestantes, faixa, getReposicoes, registrarAlteracaoStatus, setReposicoes } from "@/lib/storage";
import { Reposicao, StatusReposicao, STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Search } from "lucide-react";

type EditForm = {
  produtoId: string;
  localId: string;
  quantidade: string;
  lote: string;
  dataReposicao: string;
  dataValidade: string;
  responsavel: string;
  observacao: string;
};

export default function Alertas() {
  const { reposicoes, produtos, locais } = useData();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const [statusF, setStatusF] = useState<string>("ativo");
  const [editando, setEditando] = useState<Reposicao | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const lista = useMemo(() => {
    return reposicoes
      .filter((r) => (statusF === "todos" ? true : r.status === statusF))
      .map((r) => {
        const p = produtos.find((x) => x.id === r.produtoId);
        const l = locais.find((x) => x.id === r.localId);
        const dias = diasRestantes(r.dataValidade);
        return { r, p, l, dias, f: faixa(dias) };
      })
      .filter(({ f }) => {
        if (filtro === "todos") return true;
        return f === filtro;
      })
      .filter(({ p, l, r }) => {
        if (!busca) return true;
        const q = busca.toLowerCase();
        return (
          p?.nome.toLowerCase().includes(q) ||
          p?.codigoBarras.toLowerCase().includes(q) ||
          l?.setor.toLowerCase().includes(q) ||
          l?.prateleira.toLowerCase().includes(q) ||
          r.lote?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.dias - b.dias);
  }, [reposicoes, produtos, locais, busca, filtro, statusF]);

  function alterarStatus(id: string, status: StatusReposicao) {
    const atual = getReposicoes().find((r) => r.id === id);
    if (!atual) return;

    if (atual.status !== status) {
      registrarAlteracaoStatus(atual, status, atual.responsavel);
    }

    const novo = getReposicoes().map((r) =>
      r.id === id
        ? { ...r, status, statusAlteradoEm: new Date().toISOString(), statusResponsavel: r.responsavel, atualizadoEm: new Date().toISOString() }
        : r
    );
    setReposicoes(novo);
    toast.success(`Marcado como: ${STATUS_LABEL[status]}`);
  }

  function abrirEdicao(r: Reposicao) {
    setEditando(r);
    setEditForm({
      produtoId: r.produtoId,
      localId: r.localId,
      quantidade: String(r.quantidade),
      lote: r.lote ?? "",
      dataReposicao: r.dataReposicao,
      dataValidade: r.dataValidade,
      responsavel: r.responsavel,
      observacao: r.observacao ?? "",
    });
  }

  function salvarEdicao() {
    if (!editando || !editForm) return;
    const quantidade = Number(editForm.quantidade);

    if (!editForm.produtoId || !editForm.localId || !editForm.quantidade || !editForm.dataValidade || !editForm.responsavel.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }

    if (editForm.dataValidade < editForm.dataReposicao) {
      toast.error("A validade está antes da data de reposição.");
      return;
    }

    setReposicoes(
      getReposicoes().map((r) =>
        r.id === editando.id
          ? {
              ...r,
              produtoId: editForm.produtoId,
              localId: editForm.localId,
              quantidade,
              lote: editForm.lote.trim(),
              dataReposicao: editForm.dataReposicao,
              dataValidade: editForm.dataValidade,
              responsavel: editForm.responsavel.trim(),
              observacao: editForm.observacao.trim(),
              atualizadoEm: new Date().toISOString(),
            }
          : r
      )
    );
    toast.success("Reposição atualizada!");
    setEditando(null);
    setEditForm(null);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Alertas de Validade</h1>
        <p className="text-muted-foreground text-sm">Gerencie os produtos próximos do vencimento</p>
      </header>

      <Card className="p-4 shadow-card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto, setor, lote, código ou prateleira"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as faixas</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            <SelectItem value="7">Até 7 dias</SelectItem>
            <SelectItem value="15">Até 15 dias</SelectItem>
            <SelectItem value="30">Até 30 dias</SelectItem>
            <SelectItem value="ok">Acima de 30 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="conferido">Conferidos</SelectItem>
            <SelectItem value="retirado">Retirados</SelectItem>
            <SelectItem value="vendido">Vendidos</SelectItem>
            <SelectItem value="descartado">Descartados</SelectItem>
            <SelectItem value="erro">Erro de cadastro</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <div className="space-y-2">
        {lista.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">Nenhum item encontrado.</Card>
        )}
        {lista.map(({ r, p, l, dias, f }) => {
          const color =
            f === "vencido" || f === "7"
              ? "bg-destructive text-destructive-foreground"
              : f === "15"
              ? "bg-warning text-warning-foreground"
              : f === "30"
              ? "bg-caution text-caution-foreground"
              : "bg-success text-success-foreground";
          const borderColor =
            f === "vencido" || f === "7"
              ? "border-l-destructive"
              : f === "15"
              ? "border-l-warning"
              : f === "30"
              ? "border-l-caution"
              : "border-l-success";

          return (
            <Card key={r.id} className={cn("p-4 shadow-card border-l-4", borderColor)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{p?.nome ?? "—"}</h3>
                    {r.lote && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Lote {r.lote}
                      </span>
                    )}
                    {r.status !== "ativo" && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {STATUS_LABEL[r.status]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {l?.setor} · Corredor {l?.corredor || "—"} · {l?.prateleira}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Validade: {new Date(r.dataValidade + "T00:00:00").toLocaleDateString("pt-BR")} · Qtd: {r.quantidade} {p?.unidade} · Resp: {r.responsavel}
                  </div>
                  {r.observacao && <p className="text-xs text-muted-foreground mt-1 italic">{r.observacao}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap", color)}>
                    {dias < 0 ? `Vencido há ${Math.abs(dias)}d` : `${dias} dias`}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => abrirEdicao(r)}><Pencil className="w-4 h-4 mr-2" />Editar lançamento</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "conferido")}>Conferido hoje</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "retirado")}>Retirado da prateleira</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "vendido")}>Vendido</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "descartado")}>Descartado</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "erro")}>Erro de cadastro</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => alterarStatus(r.id, "ativo")}>Reativar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar reposição</DialogTitle></DialogHeader>
          {editForm && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Produto *</Label>
                <Select value={editForm.produtoId} onValueChange={(v) => setEditForm({ ...editForm, produtoId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {produtos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.marca || "sem marca"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Setor / Prateleira *</Label>
                <Select value={editForm.localId} onValueChange={(v) => setEditForm({ ...editForm, localId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.setor} · Corredor {l.corredor || "—"} · {l.prateleira}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Quantidade *</Label><Input type="number" min="1" value={editForm.quantidade} onChange={(e) => setEditForm({ ...editForm, quantidade: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Lote</Label><Input value={editForm.lote} onChange={(e) => setEditForm({ ...editForm, lote: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Data de reposição *</Label><Input type="date" value={editForm.dataReposicao} onChange={(e) => setEditForm({ ...editForm, dataReposicao: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Data de validade *</Label><Input type="date" value={editForm.dataValidade} onChange={(e) => setEditForm({ ...editForm, dataValidade: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Responsável *</Label><Input value={editForm.responsavel} onChange={(e) => setEditForm({ ...editForm, responsavel: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Observação</Label><Textarea rows={2} value={editForm.observacao} onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
