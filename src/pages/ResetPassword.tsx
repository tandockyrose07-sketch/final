import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { ShieldCheck, Key, Shield } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [hasMfa, setHasMfa] = useState<boolean | null>(null);
  const [isCheckingMfa, setIsCheckingMfa] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMfaAndSession = async () => {
      // Check if we have access token in URL (from password reset email)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (!accessToken || type !== "recovery") {
        toast.error("Invalid reset link", {
          description: "Please request a new password reset.",
        });
        navigate("/login");
        return;
      }

      // Check if user has MFA enabled
      try {
        const { data: factors, error } = await supabase.auth.mfa.listFactors();
        if (error) {
          console.error("Error checking MFA:", error);
          setHasMfa(false);
          setStep("reset");
        } else {
          const verifiedFactors = factors?.totp?.filter(f => f.status === "verified") || [];
          if (verifiedFactors.length > 0) {
            setHasMfa(true);
            setStep("verify");
          } else {
            setHasMfa(false);
            setStep("reset");
          }
        }
      } catch (error) {
        console.error("Error checking MFA:", error);
        setHasMfa(false);
        setStep("reset");
      } finally {
        setIsCheckingMfa(false);
      }
    };

    checkMfaAndSession();
  }, [navigate]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find(f => f.status === "verified");

      if (!totpFactor) {
        toast.error("No verified authenticator found");
        setIsLoading(false);
        return;
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) {
        toast.error("Failed to create challenge", {
          description: challengeError.message,
        });
        setIsLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: otpCode,
      });

      if (verifyError) {
        toast.error("Invalid verification code", {
          description: "Please check your authenticator app and try again.",
        });
      } else {
        toast.success("Verification successful");
        setStep("reset");
      }
    } catch (error) {
      toast.error("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error("Failed to reset password", {
          description: error.message,
        });
      } else {
        toast.success("Password reset successfully", {
          description: "You can now login with your new password.",
        });
        navigate("/login");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingMfa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-full">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {step === "verify" ? "Two-Factor Verification" : "Reset Password"}
            </CardTitle>
            <CardDescription>
              {step === "verify"
                ? "Enter the code from your authenticator app"
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "verify" && hasMfa ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
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
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || otpCode.length !== 6}>
                  <Shield className="mr-2 h-4 w-4" />
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Key className="mr-2 h-4 w-4" />
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
