import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Lock, Palette, Database, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" className="bg-input border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" className="bg-input border-border/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@edu.com" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 234-567-8900" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="Computer Science student passionate about AI and machine learning."
                />
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-secondary" />
              Academic Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value="STU2024-001" disabled className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value="Computer Science" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input value="3rd Year" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Current GPA</Label>
                <div className="flex items-center gap-2">
                  <Input value="3.85" disabled className="bg-muted/30" />
                  <Badge className="bg-accent">A</Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Assignment Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Grade Updates</p>
                  <p className="text-sm text-muted-foreground">Alert when new grades are posted</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Course Announcements</p>
                  <p className="text-sm text-muted-foreground">Important updates from instructors</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Career Opportunities</p>
                  <p className="text-sm text-muted-foreground">Job matches and recommendations</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Password & Authentication
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" className="bg-input border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" className="bg-input border-border/50" />
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                Update Password
              </Button>
            </div>
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Two-Factor Authentication
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Display & Accessibility
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing and UI elements</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Show Animations</p>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Improve text visibility</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-6">AI Assistant Preferences</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Proactive Suggestions</p>
                  <p className="text-sm text-muted-foreground">AI recommends actions automatically</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Learning Style Adaptation</p>
                  <p className="text-sm text-muted-foreground">Personalize content delivery</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Performance Tracking</p>
                  <p className="text-sm text-muted-foreground">Allow AI to track study patterns</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
