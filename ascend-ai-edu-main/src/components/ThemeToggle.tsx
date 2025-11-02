import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  variant?: "icon" | "menu";
  className?: string;
  onToggle?: (isDark: boolean) => void;
};

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const ThemeToggle = ({ variant = "icon", className, onToggle }: ThemeToggleProps) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return prefersDark();
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("disable-transitions");

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.setTimeout(() => {
      root.classList.remove("disable-transitions");
    }, 0);

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    }
  }, [isDark]);

  const handleToggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  };

  const icon = isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-muted-foreground transition hover:bg-muted/30 hover:text-foreground",
          className,
        )}
        aria-label={label}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <span className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={label}
    >
      {icon}
    </Button>
  );
};

export default ThemeToggle;
