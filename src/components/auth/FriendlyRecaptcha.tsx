import React, { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Shield, CheckCircle2, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FriendlyRecaptchaProps {
  onVerify: (token: string | null) => void;
  className?: string;
  siteKey?: string;
}

const FriendlyRecaptcha: React.FC<FriendlyRecaptchaProps> = ({
  onVerify,
  className,
  siteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", // Google's test key for development
}) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (token: string | null) => {
    setIsLoading(false);
    if (token) {
      setIsVerified(true);
      onVerify(token);
    } else {
      setIsVerified(false);
      onVerify(null);
    }
  };

  const handleExpired = () => {
    setIsVerified(false);
    onVerify(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground font-medium">
          {isVerified
            ? "Awesome! We know you're human! 🎉"
            : "Quick security check - just to make sure you're human! 🤖❌"}
        </span>
      </div>

      <div
        className={cn(
          "relative rounded-lg border-2 p-4 transition-all duration-300",
          isVerified
            ? "border-success bg-success/5"
            : "border-muted bg-muted/30"
        )}
      >
        {isVerified ? (
          <div className="flex items-center gap-3 py-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-success">Verification complete!</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Thanks for proving you're human <Heart className="h-3 w-3 text-destructive inline" />
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={handleChange}
              onExpired={handleExpired}
              onErrored={() => setIsLoading(false)}
              theme="light"
            />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              This helps us keep the community safe from bots 🛡️
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendlyRecaptcha;
