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
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useData } from "@/hooks/useData";
import { getLocais, setLocais, uid } from "@/lib/storage";
import { toast } from "sonner";

export default function Locais() {
  const { locais } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ setor: "", corredor: "", prateleira: "", observacao: "" });

  function salvar() {
    if (!form.setor || !form.prateleira) return toast.error("Preencha setor e prateleira.");
    setLocais([...getLocais(), { id: uid(), ...form }]);
    setForm({ setor: "", corredor: "", prateleira: "", observacao: "" });
    setOpen(false);
    toast.success("Local cadastrado!");
  }

  function excluir(id: string) {
    setLocais(getLocais().filter((l) => l.id !== id));
    toast.success("Local removido.");
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Setores & Prateleiras</h1>
          <p className="text-muted-foreground text-sm">Localizações dentro do mercado</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary"><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Local</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Setor *</Label><Input value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
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
              <Button variant="ghost" size="icon" onClick={() => excluir(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
