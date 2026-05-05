import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "end";

type CtxValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const Ctx = React.createContext<CtxValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <Ctx.Provider value={{ open, setOpen, triggerRef }}>
      <span className="inline-flex">{children}</span>
    </Ctx.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);

  const toggle = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      ctx?.setOpen(!ctx.open);
    },
    [ctx]
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        if (ctx) ctx.triggerRef.current = node;
      },
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        toggle(event);
      },
      "aria-haspopup": "menu",
      "aria-expanded": Boolean(ctx?.open),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      type="button"
      ref={(node) => {
        if (ctx) ctx.triggerRef.current = node;
      }}
      onClick={toggle}
      aria-haspopup="menu"
      aria-expanded={Boolean(ctx?.open)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "end",
  className,
  children,
}: {
  align?: Align;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: "hidden" });

  const updatePosition = React.useCallback(() => {
    const trigger = ctx?.triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const gap = 8;
    const viewportPadding = 12;
    const triggerRect = trigger.getBoundingClientRect();
    const width = Math.max(content.offsetWidth || 224, 224);
    const height = content.offsetHeight || 280;

    let left = align === "end" ? triggerRect.right - width : triggerRect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));

    let top = triggerRect.bottom + gap;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceBelow < height + gap + viewportPadding && spaceAbove > height + gap + viewportPadding) {
      top = triggerRect.top - height - gap;
    } else {
      top = Math.min(top, window.innerHeight - height - viewportPadding);
      top = Math.max(viewportPadding, top);
    }

    setStyle({
      position: "fixed",
      top,
      left,
      width:"265px" ,
      zIndex: 9999,
      maxHeight: "min(70vh, 360px)",
      overflowY: "auto",
    });
  }, [align, ctx]);

  React.useLayoutEffect(() => {
    if (!ctx?.open) return;

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [ctx?.open, updatePosition]);

  React.useEffect(() => {
    if (!ctx?.open) return;

    const closeOnOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contentRef.current?.contains(target)) return;
      if (ctx.triggerRef.current?.contains(target)) return;
      ctx.setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") ctx.setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside, { passive: true });
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [ctx]);

  if (!ctx?.open) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      style={style}
      className={cn(
        "rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-popover/95",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

export function DropdownMenuItem({ className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx);
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        ctx?.setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      {...props}
    />
  );
}
