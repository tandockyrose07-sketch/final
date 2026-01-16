
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BiometricSimulation from "./BiometricSimulation";

interface SimulationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  method: "facial" | "fingerprint";
  progress: number;
  animationComplete: boolean;
  verificationResult: boolean | null;
  recognizedUser: { name: string; role: string } | null;
  onClose: () => void;
}

const SimulationDialog: React.FC<SimulationDialogProps> = ({
  isOpen,
  onOpenChange,
  method,
  progress,
  animationComplete,
  verificationResult,
  recognizedUser,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {method === "facial" ? "Facial Recognition Scan" : "Fingerprint Scan"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <BiometricSimulation
            method={method}
            animationComplete={animationComplete}
            verificationResult={verificationResult}
          />

          {!animationComplete && (
            <div className="mt-6">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {method === "facial" ? "Scanning face..." : "Reading fingerprint..."}
              </p>
            </div>
          )}
        </div>

        {animationComplete && verificationResult && recognizedUser && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Welcome, {recognizedUser.name}</p>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <Button variant={animationComplete ? "default" : "outline"} onClick={onClose}>
            {animationComplete ? "Done" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimulationDialog;
