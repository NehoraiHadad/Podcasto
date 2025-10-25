'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Settings, DollarSign, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  getSystemSettingsAction,
  updateSystemSettingAction,
  initializeSystemSettingsAction,
  SETTING_KEYS
} from '@/lib/actions/admin/settings-actions';

/**
 * Supported types for system setting values
 */
type SystemSettingValue = string | number | boolean;

type SettingValue = {
  value: SystemSettingValue;
  description: string | null;
  category: string | null;
  updated_at: Date | null;
  updated_by: string | null;
};

export function SystemSettingsManager() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Load settings
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await getSystemSettingsAction();

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.data?.settings) {
        setSettings(result.data.settings);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      const result = await initializeSystemSettingsAction();

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'System settings initialized successfully',
      });
      await loadSettings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: SystemSettingValue) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all changed settings
      const promises = Object.entries(settings).map(([key, setting]) =>
        updateSystemSettingAction(key, setting.value)
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });

      setHasChanges(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const creditSettings = Object.entries(settings).filter(([_, s]) => s.category === 'credits');
  const featureSettings = Object.entries(settings).filter(([_, s]) => s.category === 'features');
  const limitSettings = Object.entries(settings).filter(([_, s]) => s.category === 'limits');

  return (
    <div className="space-y-6">
      {/* Initialize Button */}
      {Object.keys(settings).length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Settings Found</CardTitle>
            <CardDescription>
              Initialize system settings with default values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInitialize}>
              Initialize Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credit Settings */}
      {creditSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Credit Settings
            </CardTitle>
            <CardDescription>
              Configure credit-related thresholds and costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditSettings.map(([key, setting]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {setting.description || key}
                  {key === SETTING_KEYS.PREMIUM_CREDIT_THRESHOLD && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Users with this many credits get premium access)
                    </span>
                  )}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Feature Settings */}
      {featureSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>
              Enable or disable system features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureSettings.map(([key, setting]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={key}>{setting.description || key}</Label>
                </div>
                <Switch
                  id={key}
                  checked={setting.value}
                  onCheckedChange={(checked) => updateSetting(key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Limit Settings */}
      {limitSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Limits
            </CardTitle>
            <CardDescription>
              Configure maximum limits for users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {limitSettings.map(([key, setting]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{setting.description || key}</Label>
                <Input
                  id={key}
                  type="number"
                  value={setting.value}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {Object.keys(settings).length > 0 && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={!hasChanges || isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
