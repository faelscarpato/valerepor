import * as React from "react";

type ToastKind = "success" | "error" | "warning" | "info";
type ToastOptions = { description?: string };
type ToastItem = { id: string; kind: ToastKind; title: string; description?: string };

function emit(kind: ToastKind, title: string, options?: ToastOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastItem>("valerepor:toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind,
        title,
        description: options?.description,
      },
    })
  );
}

export const toast = {
  success: (title: string, options?: ToastOptions) => emit("success", title, options),
  error: (title: string, options?: ToastOptions) => emit("error", title, options),
  warning: (title: string, options?: ToastOptions) => emit("warning", title, options),
  info: (title: string, options?: ToastOptions) => emit("info", title, options),
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const item = (event as CustomEvent<ToastItem>).detail;
      setItems((current) => [item, ...current].slice(0, 4));
      window.setTimeout(() => {
        setItems((current) => current.filter((x) => x.id !== item.id));
      }, 4200);
    };
    window.addEventListener("valerepor:toast", handler);
    return () => window.removeEventListener("valerepor:toast", handler);
  }, []);

  const tone: Record<ToastKind, string> = {
    success: "border-green-200 bg-green-50 text-green-950",
    error: "border-red-200 bg-red-50 text-red-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    info: "border-slate-200 bg-white text-slate-950",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none">
      {items.map((item) => (
        <div key={item.id} className={`rounded-lg border p-3 shadow-lg pointer-events-auto ${tone[item.kind]}`}>
          <div className="font-semibold text-sm">{item.title}</div>
          {item.description && <div className="text-xs opacity-80 mt-1">{item.description}</div>}
        </div>
      ))}
    </div>
  );
}
