import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const notifications = [
  { title: "Dropout warning", type: "critical", detail: "AI flagged 12 students for immediate outreach", time: "5 min ago" },
  { title: "Low grade alert", type: "warning", detail: "Data Science cohort average slipped below 3.0", time: "18 min ago" },
  { title: "Mentor reminder", type: "info", detail: "Mentor sync needed for UX batch", time: "1 hr ago" },
  { title: "System insight", type: "info", detail: "Recommend launching resume clinic", time: "2 hr ago" },
] as const;

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notifications &amp; Alerts</CardTitle>
            <CardDescription>Track automated warnings and system notices across all programs.</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl border-white/10 text-white">
            Mark all as read
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {notifications.map((notification) => (
          <Card key={notification.title} className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-white">{notification.title}</CardTitle>
                <CardDescription className="text-slate-200">{notification.detail}</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={
                  notification.type === "critical"
                    ? "bg-rose-500/20 text-rose-100"
                    : notification.type === "warning"
                    ? "bg-amber-500/20 text-amber-100"
                    : "bg-sky-500/15 text-sky-100"
                }
              >
                {notification.time}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="rounded-xl bg-primary/80 text-white hover:bg-primary">
                View details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
