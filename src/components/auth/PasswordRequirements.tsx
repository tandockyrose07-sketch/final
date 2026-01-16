import React from "react";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const usePasswordValidation = (password: string) => {
  const requirements: PasswordRequirement[] = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "One number (0-9)",
      met: /[0-9]/.test(password),
    },
  ];

  const allMet = requirements.every((req) => req.met);
  const metCount = requirements.filter((req) => req.met).length;

  return { requirements, allMet, metCount };
};

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  className,
}) => {
  const { requirements, allMet, metCount } = usePasswordValidation(password);

  const getEncouragingMessage = () => {
    if (password.length === 0) return "Let's create a strong password together! 💪";
    if (allMet) return "Perfect! Your password is strong and secure! 🎉";
    if (metCount >= 3) return "Almost there! Just a bit more... ✨";
    if (metCount >= 2) return "Great progress! Keep going! 🌟";
    if (metCount >= 1) return "Good start! You're on the right track! 👍";
    return "Let's make this password stronger! 💪";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground font-medium">
          {getEncouragingMessage()}
        </span>
      </div>

      <div className="space-y-2 bg-muted/50 rounded-lg p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Password requirements:
        </p>
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm transition-all duration-300",
              req.met ? "text-success" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300",
                req.met
                  ? "bg-success text-success-foreground"
                  : "bg-muted-foreground/20"
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </div>
            <span className={cn(req.met && "line-through opacity-70")}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium",
              metCount === 4
                ? "text-success"
                : metCount >= 2
                ? "text-warning"
                : "text-destructive"
            )}
          >
            {metCount === 4
              ? "Strong"
              : metCount >= 3
              ? "Good"
              : metCount >= 2
              ? "Fair"
              : metCount >= 1
              ? "Weak"
              : "Too weak"}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              metCount === 4
                ? "bg-success"
                : metCount >= 2
                ? "bg-warning"
                : "bg-destructive"
            )}
            style={{ width: `${(metCount / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PasswordRequirements;
