import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6 text-white">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure platform-level controls, APIs, and scheduled maintenance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-200">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Manage Roles &amp; Permissions</p>
              <p className="text-sm text-slate-300">Control access for staff, mentors, and advisors.</p>
            </div>
            <Button variant="outline" className="rounded-xl border-white/20 text-white">
              Open role matrix
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Connect AI APIs</p>
              <p className="text-sm text-slate-300">Manage keys for OpenAI, HuggingFace, and custom models.</p>
            </div>
            <Button className="rounded-xl bg-primary/80 text-white hover:bg-primary">Configure</Button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Database backup</p>
              <p className="text-sm text-slate-300">Trigger on-demand backup or schedule recurring snapshots.</p>
            </div>
            <Button variant="outline" className="rounded-xl border-white/20 text-white">
              Start backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Toggle real-time features and theming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-1">
              <Label htmlFor="dark-mode">Dark theme</Label>
              <p className="text-sm text-slate-300">Switch the admin console between dark and light.</p>
            </div>
            <Switch id="dark-mode" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-1">
              <Label htmlFor="realtime">Enable realtime sync</Label>
              <p className="text-sm text-slate-300">Stream updates for assessments and alerts.</p>
            </div>
            <Switch id="realtime" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="space-y-1">
              <Label htmlFor="ai-suggestions">AI suggestions</Label>
              <p className="text-sm text-slate-300">Allow proactive hints inside management workflows.</p>
            </div>
            <Switch id="ai-suggestions" defaultChecked />
          </div>
          <Button className="w-full rounded-xl bg-primary/80 text-white hover:bg-primary">Save changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
