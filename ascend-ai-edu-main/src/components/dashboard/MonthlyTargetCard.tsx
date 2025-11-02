import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";
import ChartDropdown from "./ChartDropdown";

const targetSeries = [75.5];

const targetOptions: ApexOptions = {
  chart: {
    type: "radialBar",
    height: 320,
    toolbar: { show: false },
    sparkline: { enabled: true },
    fontFamily: "Outfit, sans-serif",
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: { size: "70%" },
      track: {
        background: "rgba(148, 163, 184, 0.25)",
        strokeWidth: "100%",
      },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: "32px",
          fontWeight: 600,
          offsetY: -10,
          formatter: (value) => `${Math.round(value)}%`,
        },
      },
    },
  },
  stroke: { lineCap: "round" },
  colors: ["#465FFF"],
};

export default function MonthlyTargetCard() {
  return (
    <Card className="rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Monthly target</h3>
          <p className="text-sm text-muted-foreground">Retention objective for the current cohort</p>
        </div>
        <ChartDropdown />
      </div>

      <div className="relative mt-6 flex flex-col items-center justify-center">
        <Chart options={targetOptions} series={targetSeries} type="radialBar" height={320} />
        <span className="absolute bottom-12 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          +10% vs target
        </span>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-4 text-center text-sm font-medium">
        <div>
          <dt className="text-muted-foreground">Target</dt>
          <dd className="mt-1 text-foreground">$120K</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Actual</dt>
          <dd className="mt-1 text-foreground">$132K</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Today</dt>
          <dd className="mt-1 text-foreground">$5.2K</dd>
        </div>
      </dl>
    </Card>
  );
}
