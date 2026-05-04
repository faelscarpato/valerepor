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
    setItems((current) => current.some((x) => x.value === item.value) ? current : [...current, item]);
  }, []);
  return <Ctx.Provider value={{ value, onValueChange, items, register, placeholder, setPlaceholder }}>{children}</Ctx.Provider>;
}

export function SelectTrigger({ className }: { className?: string; children?: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  return (
    <select
      value={ctx.value ?? ""}
      onChange={(e) => ctx.onValueChange?.(e.target.value)}
      className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
    >
      {ctx.placeholder && <option value="" disabled>{ctx.placeholder}</option>}
      {ctx.items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
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
