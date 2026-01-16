import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Shield,
  Save,
  Key,
  Smartphone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [securitySettings, setSecuritySettings] = useState({
    requireFingerprint: true,
    requireFacialRecognition: true,
    allowMultiFactorOverride: false,
    retainLogsForDays: "90",
    autoLockoutAfterFailures: "5",
    lockoutDurationMinutes: "30",
    alertOnMultipleFailures: true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    adminDashboardAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    alertOnUnauthorizedAttempts: true,
  });
  
  const [generalSettings, setGeneralSettings] = useState({
    schoolName: "Secure School",
    systemName: "SecureGate Access Control",
    adminEmail: "admin@school.edu",
    timeZone: "UTC-5 (Eastern Time)",
    maxConcurrentSessions: "3",
    sessionTimeout: "60",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data?.totp) {
      const verifiedFactor = data.totp.find((f) => f.status === "verified");
      setMfaEnabled(!!verifiedFactor);
      if (verifiedFactor) {
        setMfaFactorId(verifiedFactor.id);
      }
    }
  };

  const startMfaEnrollment = async () => {
    setMfaEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) {
        toast.error("Failed to start 2FA setup", { description: error.message });
        setMfaEnrolling(false);
        return;
      }

      if (data) {
        setMfaQrCode(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
        setMfaFactorId(data.id);
      }
    } catch (error) {
      toast.error("Failed to start 2FA setup");
      setMfaEnrolling(false);
    }
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaFactorId || mfaVerifyCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifyingMfa(true);

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: mfaFactorId });

      if (challengeError) {
        toast.error("Challenge failed", { description: challengeError.message });
        setIsVerifyingMfa(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaVerifyCode,
      });

      if (verifyError) {
        toast.error("Invalid code", { description: "Please try again." });
        setMfaVerifyCode("");
        setIsVerifyingMfa(false);
        return;
      }

      toast.success("Two-factor authentication enabled!");
      setMfaEnabled(true);
      setMfaEnrolling(false);
      setMfaQrCode(null);
      setMfaSecret(null);
      setMfaVerifyCode("");
    } catch (error) {
      toast.error("Verification failed");
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const disableMfa = async () => {
    if (!mfaFactorId) return;

    setIsDisablingMfa(true);

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });

      if (error) {
        toast.error("Failed to disable 2FA", { description: error.message });
      } else {
        toast.success("Two-factor authentication disabled");
        setMfaEnabled(false);
        setMfaFactorId(null);
      }
    } catch (error) {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsDisablingMfa(false);
    }
  };

  const cancelMfaEnrollment = async () => {
    if (mfaFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    }
    setMfaEnrolling(false);
    setMfaQrCode(null);
    setMfaSecret(null);
    setMfaFactorId(null);
    setMfaVerifyCode("");
  };
  
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.id]: e.target.value
    });
  };
  
  const handleSecurityChange = (field: string, value: string | boolean) => {
    setSecuritySettings({
      ...securitySettings,
      [field]: value
    });
  };
  
  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [field]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-muted-foreground">
          Configure security parameters and system behavior
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic system information and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input 
                      id="schoolName" 
                      value={generalSettings.schoolName} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input 
                      id="systemName" 
                      value={generalSettings.systemName} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Administrator Email</Label>
                    <Input 
                      id="adminEmail" 
                      type="email" 
                      value={generalSettings.adminEmail} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeZone">System Time Zone</Label>
                    <Input 
                      id="timeZone" 
                      value={generalSettings.timeZone} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentSessions">Max Concurrent Admin Sessions</Label>
                    <Input 
                      id="maxConcurrentSessions" 
                      type="number" 
                      value={generalSettings.maxConcurrentSessions} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Admin Session Timeout (minutes)</Label>
                    <Input 
                      id="sessionTimeout" 
                      type="number" 
                      value={generalSettings.sessionTimeout} 
                      onChange={handleGeneralChange}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save General Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure access control policies and security parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireFingerprint">Require Fingerprint Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must have fingerprint data to access the campus
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.requireFingerprint}
                      onCheckedChange={(checked) => handleSecurityChange('requireFingerprint', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireFacialRecognition">Require Facial Recognition</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must have facial recognition data to access the campus
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.requireFacialRecognition}
                      onCheckedChange={(checked) => handleSecurityChange('requireFacialRecognition', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowMultiFactorOverride">Allow Administrator Override</Label>
                      <p className="text-sm text-muted-foreground">
                        Security administrators can override access requirements
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.allowMultiFactorOverride}
                      onCheckedChange={(checked) => handleSecurityChange('allowMultiFactorOverride', checked)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retainLogsForDays">Retain Access Logs (days)</Label>
                      <Input 
                        id="retainLogsForDays" 
                        type="number" 
                        value={securitySettings.retainLogsForDays} 
                        onChange={(e) => handleSecurityChange('retainLogsForDays', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="autoLockoutAfterFailures">Auto-Lockout After Failures</Label>
                      <Input 
                        id="autoLockoutAfterFailures" 
                        type="number" 
                        value={securitySettings.autoLockoutAfterFailures} 
                        onChange={(e) => handleSecurityChange('autoLockoutAfterFailures', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDurationMinutes">Lockout Duration (minutes)</Label>
                      <Input 
                        id="lockoutDurationMinutes" 
                        type="number" 
                        value={securitySettings.lockoutDurationMinutes} 
                        onChange={(e) => handleSecurityChange('lockoutDurationMinutes', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alertOnMultipleFailures">Alert on Multiple Access Failures</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts when multiple access failures are detected
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.alertOnMultipleFailures}
                      onCheckedChange={(checked) => handleSecurityChange('alertOnMultipleFailures', checked)}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="flex items-center">
                  <Lock className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center"
                >
                  <Key className="mr-2 h-4 w-4" />
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mfaEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      Two-factor authentication is enabled
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with an authenticator app.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={disableMfa}
                    disabled={isDisablingMfa}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {isDisablingMfa ? "Disabling..." : "Disable 2FA"}
                  </Button>
                </div>
              ) : mfaEnrolling ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan this QR code with your authenticator app (Google
                      Authenticator, Authy, etc.)
                    </p>
                    {mfaQrCode && (
                      <img
                        src={mfaQrCode}
                        alt="2FA QR Code"
                        className="mx-auto border rounded-lg p-2 bg-white"
                      />
                    )}
                    {mfaSecret && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          Or enter this code manually:
                        </p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {mfaSecret}
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Enter the 6-digit code from your app</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={mfaVerifyCode}
                        onChange={(value) => setMfaVerifyCode(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={verifyMfaEnrollment}
                      disabled={isVerifyingMfa || mfaVerifyCode.length !== 6}
                    >
                      {isVerifyingMfa ? "Verifying..." : "Verify & Enable"}
                    </Button>
                    <Button variant="outline" onClick={cancelMfaEnrollment}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Protect your account by requiring a verification code from
                    your authenticator app when signing in.
                  </p>
                  <Button onClick={startMfaEnrollment}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Set Up 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure alerts and reporting preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailAlerts">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send security alerts to administrator email
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsAlerts">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send critical security alerts via SMS
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.smsAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('smsAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="adminDashboardAlerts">Admin Dashboard Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Show real-time alerts on the administrator dashboard
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.adminDashboardAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('adminDashboardAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dailyReports">Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily summary reports of access events
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.dailyReports}
                      onCheckedChange={(checked) => handleNotificationChange('dailyReports', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive detailed weekly analytics reports
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alertOnUnauthorizedAttempts">Unauthorized Access Attempts</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when unauthorized access attempts are detected
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.alertOnUnauthorizedAttempts}
                      onCheckedChange={(checked) => handleNotificationChange('alertOnUnauthorizedAttempts', checked)}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
