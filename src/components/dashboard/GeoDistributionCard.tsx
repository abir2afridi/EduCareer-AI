import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import ChartDropdown from "./ChartDropdown";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";

const countries = [
  { name: "United States", students: 2379, percentage: 79, code: "US" },
  { name: "France", students: 589, percentage: 23, code: "FR" },
  { name: "Bangladesh", students: 412, percentage: 18, code: "BD" },
  { name: "Australia", students: 296, percentage: 14, code: "AU" },
];

export default function GeoDistributionCard() {
  const markers = useMemo(
    () =>
      countries.map((country) => ({
        name: country.name,
        latLng: latLngByCountry[country.code] ?? [0, 0],
        style: {
          fill: "#465FFF",
          borderColor: "#fff",
          borderWidth: 1,
        },
      })),
    [],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60 bg-white/95 p-6 shadow-theme-md dark:bg-slate-950">
      <div className="flex flex-wrap items-start gap-4 sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Global learner presence</h3>
          <p className="text-sm text-muted-foreground">Regional adoption across EduCareer institutions</p>
        </div>
        <ChartDropdown />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-slate-100 via-white to-blue-50/70 p-4 dark:from-slate-950/60 dark:via-slate-900/60 dark:to-blue-950/30">
        <div className="h-[220px] w-full">
          <VectorMap
            map={worldMill}
            backgroundColor="transparent"
            zoomOnScroll={false}
            zoomAnimate
            zoomMax={12}
            zoomMin={1}
            zoomStep={1.4}
            markers={markers as any}
            markerStyle={{
              initial: {
                fill: "#465FFF",
                stroke: "#fff",
                strokeWidth: 2,
                r: 6,
              } as any,
            }}
            regionStyle={{
              initial: {
                fill: "#E2E8F0",
                fillOpacity: 1,
                stroke: "none",
              } as any,
              hover: {
                fill: "#465FFF",
                cursor: "pointer",
              } as any,
              selected: {
                fill: "#465FFF",
              } as any,
            }}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-4">
        {countries.map((country) => (
          <li key={country.code} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{country.name}</p>
              <p className="text-xs text-muted-foreground">{country.students.toLocaleString()} learners</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-2 w-32 overflow-hidden rounded-full bg-muted">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${country.percentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-foreground">{country.percentage}%</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const latLngByCountry: Record<string, [number, number]> = {
  US: [37.2580397, -104.657039],
  FR: [46.2276, 2.2137],
  BD: [23.685, 90.3563],
  AU: [-25.2744, 133.7751],
};
