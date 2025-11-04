import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import ChartDropdown from "./ChartDropdown";

const TARGET_PERCENTAGE = 75.5;
const TREND_PERCENTAGE = 10;

export default function MonthlyTargetCard() {
  const progress = Math.min(Math.max(TARGET_PERCENTAGE, 0), 100);
  const progressAngle = progress * 3.6;

  return (
    <Card className="rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Monthly target</h3>
          <p className="text-sm text-muted-foreground">Retention objective for the current cohort</p>
        </div>
        <ChartDropdown />
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div
            className="relative h-full w-full rounded-full"
            style={{
              backgroundImage: `conic-gradient(#465FFF ${progressAngle}deg, rgba(70, 95, 255, 0.12) 0deg)`,
              transform: "rotate(-90deg)",
              mask: "radial-gradient(circle at center, transparent 60%, black 61%)",
              WebkitMask: "radial-gradient(circle at center, transparent 60%, black 61%)",
            }}
          />
          <div className="absolute inset-6 rounded-full border border-border/50 bg-white/95 shadow-lg dark:border-slate-800/80 dark:bg-slate-950/95">
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-3xl font-semibold text-foreground tabular-nums">{Math.round(progress)}%</span>
              <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Of goal</span>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300">
          <ArrowUpRight className="h-3.5 w-3.5" />
          +{TREND_PERCENTAGE}% vs target
        </span>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-4 text-center text-sm font-medium">
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Target</dt>
          <dd className="mt-2 text-lg font-semibold text-foreground tabular-nums">$120K</dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actual</dt>
          <dd className="mt-2 text-lg font-semibold text-foreground tabular-nums">$132K</dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</dt>
          <dd className="mt-2 text-lg font-semibold text-foreground tabular-nums">$5.2K</dd>
        </div>
      </dl>
    </Card>
  );
}
