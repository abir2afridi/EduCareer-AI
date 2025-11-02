import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";
import ChartDropdown from "./ChartDropdown";
import DashboardBadge from "./Badge";

const series = [
  {
    name: "New enrolments",
    data: [168, 385, 201, 298, 187, 195, 291, 210, 215, 390, 280, 312],
  },
];

const options: ApexOptions = {
  chart: {
    type: "bar",
    height: 285,
    toolbar: { show: false },
    fontFamily: "Outfit, sans-serif",
  },
  colors: ["#465FFF"],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "40%",
      borderRadius: 8,
      borderRadiusApplication: "end",
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 4,
    colors: ["transparent"],
  },
  grid: {
    borderColor: "rgba(148, 163, 184, 0.25)",
    strokeDashArray: 6,
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: "hsl(var(--muted-foreground))",
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "hsl(var(--muted-foreground))",
      },
    },
  },
  legend: {
    show: false,
  },
  tooltip: {
    theme: "light",
    y: {
      formatter: (value: number) => `${value} learners`,
    },
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            columnWidth: "55%",
          },
        },
      },
    },
  ],
};

export default function MonthlySalesChart() {
  return (
    <Card className="rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex flex-wrap items-start gap-4 sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Monthly enrolments</h3>
          <p className="text-sm text-muted-foreground">Intake trend across the current academic year</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardBadge variant="success">+8.6%</DashboardBadge>
          <ChartDropdown />
        </div>
      </div>

      <div className="mt-6 -ml-4 overflow-x-auto pb-2">
        <div className="min-w-[640px] pl-4">
          <Chart options={options} series={series} type="bar" height={285} />
        </div>
      </div>
    </Card>
  );
}
