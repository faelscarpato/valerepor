import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useData } from "@/hooks/useData";
import { getProdutos, setProdutos, uid } from "@/lib/storage";
import { toast } from "sonner";

export default function Produtos() {
  const { produtos } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", codigoBarras: "", categoria: "", marca: "", unidade: "un" });

  function salvar() {
    if (!form.nome) return toast.error("Informe o nome do produto.");
    setProdutos([...getProdutos(), { id: uid(), ...form }]);
    setForm({ nome: "", codigoBarras: "", categoria: "", marca: "", unidade: "un" });
    setOpen(false);
    toast.success("Produto cadastrado!");
  }

  function excluir(id: string) {
    setProdutos(getProdutos().filter((p) => p.id !== id));
    toast.success("Produto removido.");
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground text-sm">Cadastro de produtos do supermercado</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary"><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Código de barras</Label><Input value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Unidade</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="un, kg, L" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={salvar} className="bg-gradient-primary">Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {produtos.length === 0 && <Card className="p-8 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">Nenhum produto cadastrado.</Card>}
        {produtos.map((p) => (
          <Card key={p.id} className="p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{p.nome}</h3>
                <p className="text-xs text-muted-foreground">{p.marca} · {p.categoria}</p>
                <p className="text-xs text-muted-foreground mt-1">Cód.: {p.codigoBarras || "—"}</p>
                <p className="text-xs text-muted-foreground">Unidade: {p.unidade}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => excluir(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
