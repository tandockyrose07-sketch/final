import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, Check, RotateCcw, Loader2, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Person } from "@/contexts/DataContext";

interface FacialEnrollmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  onEnrollmentComplete: () => void;
}

type CaptureAngle = "front" | "left" | "right";

interface CapturedImage {
  angle: CaptureAngle;
  dataUrl: string;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

const ANGLE_INSTRUCTIONS: Record<CaptureAngle, { label: string; instruction: string; icon: React.ReactNode }> = {
  front: {
    label: "Front View",
    instruction: "Look directly at the camera",
    icon: <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">👤</div>,
  },
  left: {
    label: "Left Side",
    instruction: "Turn your head slightly to the left",
    icon: <ChevronLeft className="w-12 h-12 text-primary" />,
  },
  right: {
    label: "Right Side", 
    instruction: "Turn your head slightly to the right",
    icon: <ChevronRight className="w-12 h-12 text-primary" />,
  },
};

const CAPTURE_SEQUENCE: CaptureAngle[] = ["front", "left", "right"];

const FacialEnrollmentDialog: React.FC<FacialEnrollmentDialogProps> = ({
  isOpen,
  onOpenChange,
  person,
  onEnrollmentComplete,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [availableDevices, setAvailableDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const currentAngle = CAPTURE_SEQUENCE[currentAngleIndex];
  const progress = (capturedImages.length / CAPTURE_SEQUENCE.length) * 100;

  // Get available video devices
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`
        }));
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error getting video devices:", error);
    }
  }, [selectedDeviceId]);

  // Request camera permission directly in user gesture
  const requestCameraPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: 640, 
          height: 480,
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        },
        audio: false,
      });
      // Stop the stream immediately - Webcam component will handle its own stream
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      await getVideoDevices();
    } catch (error) {
      console.error("Camera permission error:", error);
      if ((error as Error).name === "NotAllowedError") {
        toast.error("Camera access denied", {
          description: "Please allow camera access in your browser settings",
        });
      } else {
        toast.error("Could not access camera");
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }, [selectedDeviceId, getVideoDevices]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentAngleIndex(0);
      setCapturedImages([]);
      setIsCapturing(false);
      setIsSaving(false);
      setCountdown(null);
    } else {
      // Get devices when dialog opens
      getVideoDevices();
    }
  }, [isOpen, getVideoDevices]);

  const captureImage = useCallback(() => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Capture after countdown
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        setCapturedImages(prev => [...prev, { angle: currentAngle, dataUrl: imageSrc }]);
        
        // Move to next angle or finish
        if (currentAngleIndex < CAPTURE_SEQUENCE.length - 1) {
          setCurrentAngleIndex(prev => prev + 1);
        }
      }
      setIsCapturing(false);
    }, 3000);
  }, [currentAngle, currentAngleIndex]);

  const retakeCurrentAngle = useCallback(() => {
    // Remove the last captured image if we're retaking
    if (capturedImages.length > 0 && capturedImages[capturedImages.length - 1].angle === currentAngle) {
      setCapturedImages(prev => prev.slice(0, -1));
    }
  }, [capturedImages, currentAngle]);

  const saveEnrollment = useCallback(async () => {
    if (!person || capturedImages.length !== CAPTURE_SEQUENCE.length) return;

    setIsSaving(true);
    try {
      // For now, we'll save the front-facing image as the photo URL
      // In a real implementation, you'd send all images to a face recognition API
      const frontImage = capturedImages.find(img => img.angle === "front");
      
      if (frontImage) {
        // Update the person's record to indicate facial data is enrolled
        const { error } = await supabase
          .from("people")
          .update({ 
            has_facial_data: true,
            photo_url: frontImage.dataUrl 
          })
          .eq("id", person.id);

        if (error) throw error;

        toast.success("Facial enrollment complete!", {
          description: `${person.firstName} ${person.lastName} can now be recognized`,
        });
        
        onEnrollmentComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to save enrollment:", error);
      toast.error("Failed to save facial data");
    } finally {
      setIsSaving(false);
    }
  }, [person, capturedImages, onEnrollmentComplete, onOpenChange]);

  const isAllCaptured = capturedImages.length === CAPTURE_SEQUENCE.length;

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Facial Enrollment
          </DialogTitle>
          <DialogDescription>
            Enrolling {person.firstName} {person.lastName} - Capture face from multiple angles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{capturedImages.length} / {CAPTURE_SEQUENCE.length} captured</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Angle indicators */}
          <div className="flex justify-center gap-4">
            {CAPTURE_SEQUENCE.map((angle, index) => {
              const isCaptured = capturedImages.some(img => img.angle === angle);
              const isCurrent = index === currentAngleIndex && !isAllCaptured;
              
              return (
                <div
                  key={angle}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border-2",
                    isCaptured && "border-green-500 bg-green-50 dark:bg-green-950",
                    isCurrent && !isCaptured && "border-primary bg-primary/5",
                    !isCaptured && !isCurrent && "border-muted"
                  )}
                >
                  {isCaptured ? (
                    <Check className="w-8 h-8 text-green-500" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                      {index + 1}
                    </div>
                  )}
                  <span className="text-xs mt-1 font-medium">
                    {ANGLE_INSTRUCTIONS[angle].label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Webcam selector */}
          {hasPermission && availableDevices.length > 1 && !isAllCaptured && (
            <div className="flex items-center gap-3">
              <Video className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Camera view or permission request */}
          {!hasPermission ? (
            <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-4">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Camera access is required for facial enrollment
              </p>
              <Button onClick={requestCameraPermission} disabled={isRequestingPermission}>
                {isRequestingPermission && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enable Camera
              </Button>
            </div>
          ) : isAllCaptured ? (
            // Preview captured images
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Review your captured images
              </p>
              <div className="grid grid-cols-3 gap-3">
                {capturedImages.map((img) => (
                  <div key={img.angle} className="relative rounded-lg overflow-hidden border-2 border-green-500">
                    <img 
                      src={img.dataUrl} 
                      alt={`${img.angle} view`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                      {ANGLE_INSTRUCTIONS[img.angle].label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Live camera feed
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                  }}
                  className="w-full h-full object-cover"
                  mirrored
                />

                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-4 border-dashed border-white/50 rounded-full" />
                </div>

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-8xl font-bold text-white animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Current instruction */}
                <div className="absolute top-4 left-0 right-0 text-center">
                  <div className="inline-flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-full">
                    {ANGLE_INSTRUCTIONS[currentAngle].icon}
                    <span className="font-medium">{ANGLE_INSTRUCTIONS[currentAngle].instruction}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImages([]);
                setCurrentAngleIndex(0);
              }}
              disabled={capturedImages.length === 0 || isCapturing || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>

            {isAllCaptured ? (
              <Button onClick={saveEnrollment} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Enrollment
                  </>
                )}
              </Button>
            ) : hasPermission ? (
              <Button onClick={captureImage} disabled={isCapturing}>
                {isCapturing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture {ANGLE_INSTRUCTIONS[currentAngle].label}
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacialEnrollmentDialog;
