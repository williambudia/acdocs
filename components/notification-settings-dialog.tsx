"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bell, Mail, MessageCircle, Monitor, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { NotificationService } from "@/lib/notifications";
import { useUpdateUser } from "@/lib/queries/users";

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsDialog({
  open,
  onOpenChange,
}: NotificationSettingsDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const updateUserMutation = useUpdateUser();

  const [phone, setPhone] = useState(user?.phone || "");
  const [emailEnabled, setEmailEnabled] = useState(
    user?.notificationPreferences?.email ?? true
  );
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    user?.notificationPreferences?.whatsapp ?? false
  );
  const [browserEnabled, setBrowserEnabled] = useState(
    user?.notificationPreferences?.browser ?? true
  );
  const [alertDays, setAlertDays] = useState<number[]>(
    user?.notificationPreferences?.alertDaysBefore ?? [7, 30]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setEmailEnabled(user.notificationPreferences?.email ?? true);
      setWhatsappEnabled(user.notificationPreferences?.whatsapp ?? false);
      setBrowserEnabled(user.notificationPreferences?.browser ?? true);
      setAlertDays(user.notificationPreferences?.alertDaysBefore ?? [7, 30]);
    }
  }, [user]);

  const toggleAlertDay = (day: number) => {
    setAlertDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        updates: {
          phone,
          notificationPreferences: {
            email: emailEnabled,
            whatsapp: whatsappEnabled,
            browser: browserEnabled,
            alertDaysBefore: alertDays,
          },
        },
      });

      toast.success(t.toast.settingsSaved);
      onOpenChange(false);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableBrowser = async () => {
    const granted = await NotificationService.requestBrowserPermission();
    if (granted) {
      setBrowserEnabled(true);
      toast.success("Permissão concedida!");
    } else {
      toast.error(t.toast.notificationPermissionDenied);
    }
  };

  const handleTest = async (type: "email" | "whatsapp" | "browser") => {
    if (!user) return;

    try {
      await NotificationService.testNotification(user, type);
      toast.success(t.toast.notificationSent);
    } catch (error) {
      toast.error(t.toast.errorGeneric);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            {t.notifications.settings}
          </DialogTitle>
          <DialogDescription>
            Configure como e quando você deseja receber alertas de documentos expirando
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Canais de Notificação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.notifications.channels}</h3>

            {/* Email */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.notifications.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="email"
                      checked={emailEnabled}
                      onCheckedChange={(checked) => setEmailEnabled(checked === true)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest("email")}
                      disabled={!emailEnabled}
                    >
                      <Send className="size-3 mr-1" />
                      Testar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <MessageCircle className="size-5 text-green-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.notifications.whatsapp}</p>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas via WhatsApp
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="whatsapp"
                      checked={whatsappEnabled}
                      onCheckedChange={(checked) => setWhatsappEnabled(checked === true)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest("whatsapp")}
                      disabled={!whatsappEnabled || !phone}
                    >
                      <Send className="size-3 mr-1" />
                      Testar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs">
                    {t.notifications.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.notifications.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Browser */}
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Monitor className="size-5 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.notifications.browser}</p>
                    <p className="text-sm text-muted-foreground">
                      Notificações nativas do sistema
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Notification.permission === "granted" ? (
                      <Checkbox
                        id="browser"
                        checked={browserEnabled}
                        onCheckedChange={(checked) => setBrowserEnabled(checked === true)}
                      />
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleEnableBrowser}>
                        {t.notifications.enableBrowser}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest("browser")}
                      disabled={!browserEnabled || Notification.permission !== "granted"}
                    >
                      <Send className="size-3 mr-1" />
                      Testar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dias de Alerta */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t.notifications.alertDays}</h3>
            <p className="text-sm text-muted-foreground">
              Selecione em quais dias antes da expiração você deseja ser alertado
            </p>
            <div className="flex flex-wrap gap-2">
              {[7, 15, 30, 60, 90].map((day) => (
                <Badge
                  key={day}
                  variant={alertDays.includes(day) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => toggleAlertDay(day)}
                >
                  {day} dias
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
