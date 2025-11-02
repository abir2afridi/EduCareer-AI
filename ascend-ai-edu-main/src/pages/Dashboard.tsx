import OverviewMetrics from "@/components/dashboard/OverviewMetrics";
import MonthlySalesChart from "@/components/dashboard/MonthlySalesChart";
import MonthlyTargetCard from "@/components/dashboard/MonthlyTargetCard";
import PerformanceAreaChart from "@/components/dashboard/PerformanceAreaChart";
import GeoDistributionCard from "@/components/dashboard/GeoDistributionCard";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          EduCareer intelligence overview
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Monitor learner outcomes, programme health, and global reach in a single glance.
        </p>
      </header>

      <OverviewMetrics />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <MonthlySalesChart />
        <MonthlyTargetCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <PerformanceAreaChart />
        <GeoDistributionCard />
      </div>

      <RecentActivityTable />
    </div>
  );
}
