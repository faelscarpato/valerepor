import * as React from "react";
import { cn } from "@/lib/utils";

type Item = { value: string; label: React.ReactNode };
type SelectCtx = {
  value?: string;
  onValueChange?: (value: string) => void;
  items: Item[];
  register: (item: Item) => void;
  placeholder?: string;
  setPlaceholder: (value?: string) => void;
};

const Ctx = React.createContext<SelectCtx | null>(null);

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [placeholder, setPlaceholder] = React.useState<string | undefined>();

  const register = React.useCallback((item: Item) => {
    setItems((current) => {
      const existingIndex = current.findIndex((x) => x.value === item.value);
      if (existingIndex === -1) return [...current, item];
      const copy = [...current];
      copy[existingIndex] = item;
      return copy;
    });
  }, []);

  return <Ctx.Provider value={{ value, onValueChange, items, register, placeholder, setPlaceholder }}>{children}</Ctx.Provider>;
}

export function SelectTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;

  return (
    <>
      {/*
        O SelectValue fica como filho do SelectTrigger nas telas. A versão anterior
        ignorava children; por isso o placeholder não era registrado e o select HTML
        exibia visualmente o primeiro item sem atualizar o estado do formulário.
      */}
      <span className="sr-only" aria-hidden="true">{children}</span>
      <select
        value={ctx.value ?? ""}
        onChange={(e) => ctx.onValueChange?.(e.target.value)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !ctx.value && "text-muted-foreground",
          className
        )}
      >
        <option value="" disabled>
          {ctx.placeholder || "Selecione uma opção"}
        </option>
        {ctx.items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(Ctx);
  React.useEffect(() => {
    ctx?.setPlaceholder(placeholder);
  }, [ctx, placeholder]);
  return null;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="hidden">{children}</div>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  React.useEffect(() => {
    ctx?.register({ value, label: children });
  }, [ctx, value, children]);
  return null;
}
