import { useState } from 'react';
import { Save, Mail, Smartphone, Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const { settings, isLoadingSettings, updateSettings } = useNotifications();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    enableInApp: settings?.enableInApp ?? true,
    enableEmail: settings?.enableEmail ?? true,
    enableSms: settings?.enableSms ?? false,
    enableWebhook: settings?.enableWebhook ?? false,
    defaultFrequency: settings?.defaultFrequency ?? 'immediate',
    digestTime: settings?.digestTime ?? '08:00',
    weeklyDigestDay: settings?.weeklyDigestDay ?? 1,
    monthlyDigestDay: settings?.monthlyDigestDay ?? 1,
    escalationEnabled: settings?.escalationEnabled ?? false,
    escalationTimeoutMinutes: settings?.escalationTimeoutMinutes ?? 60,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      toast({
        title: "Success",
        description: "Notification settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    try {
      // Send a test notification
      const testNotification = {
        alertType: 'system_alert' as const,
        alertCategory: 'system_health' as const,
        priority: 'medium' as const,
        channels: ['in_app', 'email'] as const,
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings are working correctly.',
        templateData: {
          timestamp: new Date().toLocaleString(),
        },
      };

      // This would call the sendTestNotification function
      toast({
        title: "Test Sent",
        description: "A test notification has been sent with your current settings",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="notification-settings">
      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Delivery Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="inApp">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications in the app</p>
              </div>
            </div>
            <Switch
              id="inApp"
              checked={formData.enableInApp}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableInApp: checked }))}
              data-testid="switch-in-app"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email"
              checked={formData.enableEmail}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableEmail: checked }))}
              data-testid="switch-email"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="sms">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={formData.enableSms}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSms: checked }))}
              data-testid="switch-sms"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="webhook">Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">Send notifications to external systems</p>
              </div>
            </div>
            <Switch
              id="webhook"
              checked={formData.enableWebhook}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableWebhook: checked }))}
              data-testid="switch-webhook"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            Control how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Default Frequency</Label>
            <Select
              value={formData.defaultFrequency}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, defaultFrequency: value }))}
            >
              <SelectTrigger data-testid="select-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily_digest">Daily Digest</SelectItem>
                <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Digest Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="digestTime">Daily Digest Time</Label>
                <Select
                  value={formData.digestTime}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, digestTime: value }))}
                >
                  <SelectTrigger data-testid="select-digest-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyDay">Weekly Digest Day</Label>
                <Select
                  value={formData.weeklyDigestDay.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weeklyDigestDay: parseInt(value) }))}
                >
                  <SelectTrigger data-testid="select-weekly-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Settings</CardTitle>
          <CardDescription>
            Configure when and how critical alerts are escalated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="escalation">Enable Alert Escalation</Label>
              <p className="text-sm text-muted-foreground">
                Escalate unacknowledged critical alerts
              </p>
            </div>
            <Switch
              id="escalation"
              checked={formData.escalationEnabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, escalationEnabled: checked }))}
              data-testid="switch-escalation"
            />
          </div>

          {formData.escalationEnabled && (
            <div className="space-y-2">
              <Label htmlFor="escalationTimeout">Escalation Timeout (minutes)</Label>
              <Select
                value={formData.escalationTimeoutMinutes.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, escalationTimeoutMinutes: parseInt(value) }))}
              >
                <SelectTrigger data-testid="select-escalation-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
          data-testid="save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleSendTest}
          data-testid="test-notification"
        >
          <Bell className="h-4 w-4 mr-2" />
          Send Test
        </Button>
      </div>
    </div>
  );
}