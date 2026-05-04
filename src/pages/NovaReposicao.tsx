import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { getReposicoes, setReposicoes, uid } from "@/lib/storage";
import { toast } from "@/components/ui/sonner";

export default function NovaReposicao() {
  const navigate = useNavigate();
  const { produtos, locais } = useData();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    produtoId: "",
    localId: "",
    quantidade: "",
    lote: "",
    dataReposicao: today,
    dataValidade: "",
    responsavel: "",
    observacao: "",
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const quantidade = Number(form.quantidade);

    if (!form.produtoId || !form.localId || !form.quantidade || !form.dataValidade || !form.responsavel.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }

    if (form.dataValidade < form.dataReposicao) {
      toast.error("A validade está antes da data de reposição.", {
        description: "Confira a data antes de salvar este lançamento.",
      });
      return;
    }

    const novo = [
      ...getReposicoes(),
      {
        id: uid(),
        produtoId: form.produtoId,
        localId: form.localId,
        quantidade,
        lote: form.lote.trim(),
        dataReposicao: form.dataReposicao,
        dataValidade: form.dataValidade,
        responsavel: form.responsavel.trim(),
        observacao: form.observacao.trim(),
        status: "ativo" as const,
        criadoEm: new Date().toISOString(),
      },
    ];
    setReposicoes(novo);
    toast.success("Reposição cadastrada!");
    navigate("/alertas");
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Nova Reposição</h1>
        <p className="text-muted-foreground text-sm">Registre produto, lote, prateleira e validade</p>
      </header>

      <Card className="p-5 md:p-6 shadow-card">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Produto *</Label>
              <Select value={form.produtoId} onValueChange={(v) => update("produtoId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {p.marca || "sem marca"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Setor / Prateleira *</Label>
              <Select value={form.localId} onValueChange={(v) => update("localId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a localização" /></SelectTrigger>
                <SelectContent>
                  {locais.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.setor} · Corredor {l.corredor || "—"} · {l.prateleira}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantidade}
                onChange={(e) => update("quantidade", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lote</Label>
              <Input
                value={form.lote}
                onChange={(e) => update("lote", e.target.value)}
                placeholder="Ex.: L-0426"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável *</Label>
              <Input
                value={form.responsavel}
                onChange={(e) => update("responsavel", e.target.value)}
                placeholder="Nome do funcionário"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de reposição *</Label>
              <Input type="date" value={form.dataReposicao} onChange={(e) => update("dataReposicao", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Data de validade *</Label>
              <Input type="date" value={form.dataValidade} onChange={(e) => update("dataValidade", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={(e) => update("observacao", e.target.value)} rows={2} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-gradient-primary">Salvar reposição</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
