import * as React from "react";
import { cn } from "@/lib/utils";

type CtxValue = { open: boolean; setOpen: (v: boolean) => void };
const Ctx = React.createContext<CtxValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <Ctx.Provider value={{ open, setOpen }}><div className="relative inline-block">{children}</div></Ctx.Provider>;
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        ctx?.setOpen(!ctx.open);
      },
    });
  }
  return <button type="button" onClick={() => ctx?.setOpen(!ctx.open)}>{children}</button>;
}

export function DropdownMenuContent({ align: _align, className, children }: { align?: "start" | "end"; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  if (!ctx?.open) return null;
  return (
    <div className={cn("absolute right-0 z-50 mt-2 min-w-56 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx);
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground", className)}
      onClick={(e) => { onClick?.(e); ctx?.setOpen(false); }}
      {...props}
    />
  );
}
