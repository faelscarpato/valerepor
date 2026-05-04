import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useData } from "@/hooks/useData";
import { getLocais, getReposicoes, setLocais, uid } from "@/lib/storage";
import { toast } from "@/components/ui/sonner";

type LocalForm = { setor: string; corredor: string; prateleira: string; observacao: string };
const formInicial: LocalForm = { setor: "", corredor: "", prateleira: "", observacao: "" };

export default function Locais() {
  const { locais } = useData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<LocalForm>(formInicial);

  function abrirNovo() {
    setEditId(null);
    setForm(formInicial);
    setOpen(true);
  }

  function abrirEdicao(id: string) {
    const local = locais.find((l) => l.id === id);
    if (!local) return;
    setEditId(id);
    setForm({
      setor: local.setor,
      corredor: local.corredor,
      prateleira: local.prateleira,
      observacao: local.observacao ?? "",
    });
    setOpen(true);
  }

  function fechar(v: boolean) {
    setOpen(v);
    if (!v) {
      setEditId(null);
      setForm(formInicial);
    }
  }

  function salvar() {
    if (!form.setor.trim() || !form.prateleira.trim()) return toast.error("Preencha setor e prateleira.");

    const payload = {
      setor: form.setor.trim(),
      corredor: form.corredor.trim(),
      prateleira: form.prateleira.trim(),
      observacao: form.observacao.trim(),
    };

    if (editId) {
      setLocais(getLocais().map((l) => (l.id === editId ? { ...l, ...payload } : l)));
      toast.success("Local atualizado!");
    } else {
      setLocais([...getLocais(), { id: uid(), ...payload }]);
      toast.success("Local cadastrado!");
    }

    fechar(false);
  }

  function excluir(id: string) {
    const vinculada = getReposicoes().some((r) => r.localId === id);
    if (vinculada) {
      toast.error("Local possui reposições vinculadas.", {
        description: "Para preservar o histórico, edite o local em vez de apagar.",
      });
      return;
    }

    if (!window.confirm("Deseja remover este local?")) return;
    setLocais(getLocais().filter((l) => l.id !== id));
    toast.success("Local removido.");
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Setores & Prateleiras</h1>
          <p className="text-muted-foreground text-sm">Localizações dentro do mercado</p>
        </div>
        <Dialog open={open} onOpenChange={fechar}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary" onClick={abrirNovo}><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Local" : "Novo Local"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Setor *</Label><Input value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Corredor</Label><Input value={form.corredor} onChange={(e) => setForm({ ...form, corredor: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Prateleira *</Label><Input value={form.prateleira} onChange={(e) => setForm({ ...form, prateleira: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Observação</Label><Textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={salvar} className="bg-gradient-primary">Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {locais.length === 0 && <Card className="p-8 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">Nenhum local cadastrado.</Card>}
        {locais.map((l) => (
          <Card key={l.id} className="p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold truncate">{l.setor}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Corredor {l.corredor || "—"} · Prateleira {l.prateleira}</p>
                {l.observacao && <p className="text-xs text-muted-foreground mt-1 italic">{l.observacao}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => abrirEdicao(l.id)} title="Editar local"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => excluir(l.id)} title="Excluir local"><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
