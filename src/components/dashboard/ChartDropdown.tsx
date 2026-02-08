import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChartDropdownProps {
  items?: { label: string; onSelect?: () => void }[];
}

const wrapperVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      ease: "easeOut",
      duration: 0.16,
      staggerChildren: 0.06,
    },
  },
  closed: {
    opacity: 0,
    y: 6,
    transition: {
      when: "afterChildren",
      ease: "easeIn",
      duration: 0.14,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  closed: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};

const iconVariants = {
  open: { rotate: 90, transition: { duration: 0.18, ease: "easeOut" } },
  closed: { rotate: 0, transition: { duration: 0.16, ease: "easeIn" } },
};

type MenuPosition = {
  top: number;
  right: number;
};

export default function ChartDropdown({
  items = [
    { label: "View details" },
    { label: "Download report" },
    { label: "Export CSV" },
  ],
}: ChartDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    const handleResize = () => updateMenuPosition();
    const handleScroll = () => updateMenuPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, updateMenuPosition]);

  const handleToggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    updateMenuPosition();
    setOpen(true);
  }, [open, updateMenuPosition]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition hover:border-border/50 hover:bg-muted/10 hover:text-foreground"
        ref={buttonRef}
      >
        <motion.span
          animate={open ? "open" : "closed"}
          variants={iconVariants}
          className="inline-flex h-4 w-4 items-center justify-center"
          initial={false}
        >
          <MoreHorizontal className="h-4 w-4" />
        </motion.span>
        <span className="sr-only">Open chart actions</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.16, ease: "easeIn" } }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: menuPosition ? "fixed" : "absolute",
              top: menuPosition?.top,
              right: menuPosition?.right,
            }}
            className="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border/60 bg-white p-1 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <motion.ul
              initial="closed"
              animate="open"
              exit="closed"
              variants={wrapperVariants}
              className="flex flex-col gap-1"
            >
              {items.map((item) => (
                <motion.li key={item.label} variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect?.();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-primary/5 hover:text-foreground"
                  >
                    <span>{item.label}</span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
