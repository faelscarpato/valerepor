import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/hooks/useData";
import { getProdutos, getReposicoes, registrarEvento, setProdutos, setReposicoes, uid } from "@/lib/storage";
import { toast } from "@/components/ui/sonner";
import { ArrowRight, CalendarClock, CheckCircle2, PackagePlus, Sparkles, Zap } from "lucide-react";

const hojeISO = () => new Date().toISOString().slice(0, 10);
const addDays = (base: string, dias: number) => {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

export default function NovaReposicao() {
  const navigate = useNavigate();
  const { produtos, locais, reposicoes } = useData();
  const today = hojeISO();

  const [form, setForm] = useState({
    produtoId: "",
    localId: "",
    quantidade: "1",
    lote: "",
    dataReposicao: today,
    dataValidade: "",
    responsavel: "",
    observacao: "",
  });
  const [produtoRapido, setProdutoRapido] = useState({ nome: "", codigoBarras: "", categoria: "", marca: "", unidade: "un" });
  const [mostrarProdutoRapido, setMostrarProdutoRapido] = useState(produtos.length === 0);

  const responsaveisRecentes = useMemo(() => {
    const nomes = reposicoes.map((r) => r.responsavel).filter(Boolean);
    return [...new Set(nomes)].slice(0, 6);
  }, [reposicoes]);

  const produtoSelecionado = produtos.find((p) => p.id === form.produtoId);
  const localSelecionado = locais.find((l) => l.id === form.localId);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function salvarProdutoRapido() {
    const nome = produtoRapido.nome.trim();
    if (!nome) return toast.error("Informe o nome do produto rápido.");
    const codigo = produtoRapido.codigoBarras.trim();
    if (codigo && getProdutos().some((p) => p.codigoBarras === codigo)) {
      return toast.error("Código de barras já cadastrado.");
    }
    const novoProduto = {
      id: uid(),
      nome,
      codigoBarras: codigo,
      categoria: produtoRapido.categoria.trim(),
      marca: produtoRapido.marca.trim(),
      unidade: produtoRapido.unidade.trim() || "un",
    };
    setProdutos([...getProdutos(), novoProduto]);
    registrarEvento({ tipo: "criacao", entidade: "produto", entidadeId: novoProduto.id, descricao: `Produto criado rapidamente: ${novoProduto.nome}` });
    setForm((f) => ({ ...f, produtoId: novoProduto.id }));
    setProdutoRapido({ nome: "", codigoBarras: "", categoria: "", marca: "", unidade: "un" });
    setMostrarProdutoRapido(false);
    toast.success("Produto criado e selecionado.");
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const quantidade = Number(form.quantidade);

    if (!form.produtoId || !form.localId || !form.quantidade || !form.dataValidade || !form.responsavel.trim()) {
      toast.error("Preencha produto, local, quantidade, validade e responsável.");
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

    const reposicao = {
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
    };

    setReposicoes([...getReposicoes(), reposicao]);
    registrarEvento({
      tipo: "criacao",
      entidade: "reposicao",
      entidadeId: reposicao.id,
      reposicaoId: reposicao.id,
      responsavel: reposicao.responsavel,
      descricao: `Reposição criada: ${produtoSelecionado?.nome ?? "produto"}, lote ${reposicao.lote || "sem lote"}`,
    });
    toast.success("Reposição cadastrada!", { description: "Ela já aparece nos alertas e relatórios." });
    navigate("/alertas");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="overflow-hidden rounded-[30px] bg-gradient-primary p-5 text-[#035b24] shadow-elevated md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              <Zap className="h-3.5 w-3.5" /> Fluxo rápido
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">Nova reposição</h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-[#075c29]/80">
              Registre produto, prateleira, lote e validade em poucos toques. Campos obrigatórios estão marcados com *.
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-2xl bg-white/90 font-bold text-primary hover:bg-white">
            <Link to="/produtos"><PackagePlus className="h-4 w-4" /> Produtos</Link>
          </Button>
        </div>
      </section>

      {(produtos.length === 0 || locais.length === 0) && (
        <Card className="border-warning/30 bg-warning/10 p-4 text-sm shadow-card">
          <div className="font-bold text-warning">Antes do primeiro lançamento</div>
          <p className="mt-1 text-muted-foreground">Cadastre ao menos um produto e uma prateleira/setor. Você também pode criar produto rápido abaixo.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/produtos">Cadastrar produtos</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/locais">Cadastrar setores</Link></Button>
          </div>
        </Card>
      )}

      <Card className="p-4 shadow-card md:p-6">
        <form onSubmit={salvar} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Produto *</Label>
                <Button type="button" size="sm" variant="ghost" className="h-8 text-primary" onClick={() => setMostrarProdutoRapido((v) => !v)}>
                  <PackagePlus className="h-4 w-4" /> Produto rápido
                </Button>
              </div>
              <Select value={form.produtoId} onValueChange={(v) => update("produtoId", v)}>
                <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {p.marca || "sem marca"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mostrarProdutoRapido && (
              <div className="md:col-span-2 rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="h-4 w-4" /> Criar produto sem sair da reposição</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Nome do produto *" value={produtoRapido.nome} onChange={(e) => setProdutoRapido({ ...produtoRapido, nome: e.target.value })} />
                  <Input placeholder="Código de barras" value={produtoRapido.codigoBarras} onChange={(e) => setProdutoRapido({ ...produtoRapido, codigoBarras: e.target.value })} />
                  <Input placeholder="Categoria" value={produtoRapido.categoria} onChange={(e) => setProdutoRapido({ ...produtoRapido, categoria: e.target.value })} />
                  <Input placeholder="Marca" value={produtoRapido.marca} onChange={(e) => setProdutoRapido({ ...produtoRapido, marca: e.target.value })} />
                  <Input placeholder="Unidade" value={produtoRapido.unidade} onChange={(e) => setProdutoRapido({ ...produtoRapido, unidade: e.target.value })} />
                  <Button type="button" onClick={salvarProdutoRapido} className="rounded-2xl bg-gradient-primary">Criar e selecionar</Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <Label>Setor / Prateleira *</Label>
              <Select value={form.localId} onValueChange={(v) => update("localId", v)}>
                <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Selecione a localização" /></SelectTrigger>
                <SelectContent>
                  {locais.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.setor} · Corredor {l.corredor || "—"} · {l.prateleira}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input className="h-12 rounded-2xl text-lg font-bold" type="number" min="1" inputMode="numeric" value={form.quantidade} onChange={(e) => update("quantidade", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Lote</Label>
              <Input className="h-12 rounded-2xl" value={form.lote} onChange={(e) => update("lote", e.target.value)} placeholder="Ex.: L-0426" />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável *</Label>
              <Input className="h-12 rounded-2xl" value={form.responsavel} onChange={(e) => update("responsavel", e.target.value)} placeholder="Nome do funcionário" />
              {responsaveisRecentes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {responsaveisRecentes.map((nome) => (
                    <button key={nome} type="button" onClick={() => update("responsavel", nome)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      {nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Data de reposição *</Label>
              <Input className="h-12 rounded-2xl" type="date" value={form.dataReposicao} onChange={(e) => update("dataReposicao", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Data de validade *</Label>
              <Input className="h-12 rounded-2xl" type="date" value={form.dataValidade} onChange={(e) => update("dataValidade", e.target.value)} />
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[7, 15, 30, 60].map((dias) => (
                  <Button key={dias} type="button" variant="outline" size="sm" className="rounded-2xl" onClick={() => update("dataValidade", addDays(form.dataReposicao || today, dias))}>
                    +{dias}d
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Observação</Label>
              <Textarea className="rounded-2xl" value={form.observacao} onChange={(e) => update("observacao", e.target.value)} rows={2} placeholder="Ex.: ponta de gôndola, lote promocional, caixa avariada..." />
            </div>
          </div>

          <Card className="bg-muted/40 p-4 shadow-none">
            <div className="flex items-start gap-3 text-sm">
              <CalendarClock className="mt-0.5 h-5 w-5 text-primary" />
              <div className="min-w-0">
                <div className="font-bold">Resumo do lançamento</div>
                <div className="text-muted-foreground">
                  {produtoSelecionado?.nome || "Produto não selecionado"} {form.lote ? `· lote ${form.lote}` : ""} · {localSelecionado ? `${localSelecionado.setor} / ${localSelecionado.prateleira}` : "local não selecionado"}
                </div>
              </div>
            </div>
          </Card>

          <div className="sticky bottom-24 z-10 flex gap-3 rounded-[24px] border border-border bg-card/95 p-2 shadow-dock backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" className="h-12 flex-1 rounded-2xl bg-gradient-primary text-base font-black">
              <CheckCircle2 className="h-5 w-5" /> Salvar <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
