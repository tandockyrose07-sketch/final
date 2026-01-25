import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, Eye, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import PasswordRequirements, { usePasswordValidation } from "@/components/auth/PasswordRequirements";
import FriendlyRecaptcha from "@/components/auth/FriendlyRecaptcha";

const SuperAdminSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { allMet: passwordValid } = usePasswordValidation(password);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      toast.error("Password requirements not met", {
        description: "Please ensure your password meets all the requirements.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    if (!recaptchaToken) {
      toast.error("Please complete the verification", {
        description: "We need to confirm you're human before creating your account.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const success = await signup(email, password, fullName, "super_admin");
      if (success) {
        await login(email, password);
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmitSignup = 
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    passwordValid &&
    password === confirmPassword &&
    recaptchaToken !== null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100 py-8">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-center mb-6">
          <div className="bg-amber-500 p-4 rounded-full">
            <Crown className="h-10 w-10 text-white" />
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
              Super Admin Registration
            </CardTitle>
            <CardDescription>
              Developer access - Create a Super Admin account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <PasswordRequirements password={password} />

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">
                    Passwords don't match yet - no worries, just double-check! 🔍
                  </p>
                )}
                {confirmPassword && password === confirmPassword && passwordValid && (
                  <p className="text-xs text-success mt-1">
                    Perfect match! ✅
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <Crown className="h-5 w-5" />
                  <span className="font-medium text-sm">Super Admin Access</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Full system access including user management, enrollment, analytics, and settings.
                </p>
              </div>

              <FriendlyRecaptcha onVerify={setRecaptchaToken} />

              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                disabled={isLoading || !canSubmitSignup}
              >
                {isLoading ? "Creating account..." : "Create Super Admin Account"}
              </Button>

              {!canSubmitSignup && (
                <p className="text-xs text-center text-muted-foreground">
                  Complete all fields and requirements above to create your account 🌟
                </p>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col">
            <div className="text-center text-sm text-muted-foreground mt-2">
              <div className="flex items-center justify-center space-x-1">
                <Fingerprint className="h-4 w-4" />
                <span>Secured with two-factor authentication</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSignup;
