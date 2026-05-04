import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDetected: (code: string) => void;
};

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

export default function BarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let interval: number | undefined;

    async function iniciar() {
      setErro(null);
      if (!window.BarcodeDetector) {
        const msg = "Este navegador não possui leitor nativo de código de barras. Digite o código manualmente ou use Chrome/Android.";
        setErro(msg);
        toast.error("Leitor indisponível", { description: msg });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (!videoRef.current || cancelled) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
        });

        interval = window.setInterval(async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const code = results[0]?.rawValue;
            if (code) {
              onDetected(code);
              onOpenChange(false);
            }
          } catch {
            // ignora falhas pontuais de leitura enquanto a câmera está aberta
          }
        }, 700);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Não foi possível acessar a câmera.";
        setErro(msg);
        toast.error("Erro ao acessar câmera", { description: msg });
      }
    }

    iniciar();

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
