import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDetected: (code: string) => void;
};

export default function BarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErro(null);
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back = devices.find((d) => /back|traseira|environment/i.test(d.label)) ?? devices[devices.length - 1];
        if (!videoRef.current) return;
        const controls = await reader.decodeFromVideoDevice(
          back?.deviceId,
          videoRef.current,
          (result, err, ctrl) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              ctrl.stop();
              onDetected(text);
              onOpenChange(false);
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Não foi possível acessar a câmera.";
        setErro(msg);
        toast.error("Erro ao acessar câmera", { description: msg });
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" /> Leitor de código de barras
          </DialogTitle>
        </DialogHeader>
        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-4/5 h-1/3 border-2 border-primary/80 rounded-lg shadow-elevated" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {erro ? (
            <p className="text-sm text-destructive">{erro}</p>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Aponte a câmera para o código de barras do produto.
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" /> Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
