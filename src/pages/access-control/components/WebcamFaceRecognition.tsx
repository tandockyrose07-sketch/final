import React, { useEffect, useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import { Camera, Loader2, AlertCircle, Play, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFaceDetection, DetectedFace } from "@/hooks/useFaceDetection";
import { useData, Person } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface WebcamFaceRecognitionProps {
  onFaceDetected?: (faces: DetectedFace[], matchedPeople: Person[]) => void;
  onActiveChange?: (isActive: boolean) => void;
}

const WebcamFaceRecognition: React.FC<WebcamFaceRecognitionProps> = ({
  onFaceDetected,
  onActiveChange,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const { isDetecting, detectedFaces, error: detectionError, startContinuousDetection, stopDetection } = useFaceDetection();
  const { people, logAccess } = useData();
  
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const loggedPersonsRef = useRef<Map<string, number>>(new Map());

  // Get available video devices
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === "videoinput");
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting video devices:", err);
    }
  }, [selectedDeviceId]);

  // Request camera permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        await getVideoDevices();
      } catch (err) {
        setWebcamError(err instanceof Error ? err.message : "Camera access denied");
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };
    requestPermission();
  }, [getVideoDevices]);

  // Capture function
  const captureImage = useCallback((): string | null => {
    if (webcamRef.current) {
      return webcamRef.current.getScreenshot();
    }
    return null;
  }, []);

  // Notify parent when faces are detected
  useEffect(() => {
    if (onFaceDetected && detectedFaces.length > 0) {
      const matchedPeople = detectedFaces
        .filter(f => f.matchedPersonId)
        .map(f => people.find(p => p.id === f.matchedPersonId))
        .filter((p): p is Person => p !== undefined);
      
      onFaceDetected(detectedFaces, matchedPeople);
    }
  }, [detectedFaces, onFaceDetected, people]);

  // Notify parent of active state changes
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // Log access for recognized faces
  useEffect(() => {
    const processDetectedFaces = async () => {
      for (const face of detectedFaces) {
        if (face.isRegistered && face.matchedPersonId) {
          const person = people.find(p => p.id === face.matchedPersonId);
          if (person) {
            const now = Date.now();
            const lastLogged = loggedPersonsRef.current.get(face.matchedPersonId);
            
            if (!lastLogged || now - lastLogged > 30000) {
              loggedPersonsRef.current.set(face.matchedPersonId, now);
              
              await logAccess(
                person.id,
                `${person.firstName} ${person.lastName}`,
                person.type,
                "facial",
                true
              );

              toast.success(`Access Granted`, {
                description: `${person.firstName} ${person.lastName} • ${face.confidence}% match`,
              });
            }
          }
        }
      }
    };

    if (detectedFaces.some(f => f.isRegistered)) {
      processDetectedFaces();
    }
  }, [detectedFaces, people, logAccess]);

  const handleToggleDetection = useCallback(() => {
    if (isActive) {
      stopDetection();
      setIsActive(false);
    } else {
      // Faster detection interval: 1500ms instead of 2500ms
      startContinuousDetection(captureImage, people, 1500);
      setIsActive(true);
    }
  }, [isActive, startContinuousDetection, stopDetection, captureImage, people]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Permission request screen
  if (!hasPermission && !isLoading) {
    return (
      <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-4 p-8">
        <div className="p-4 bg-background rounded-full">
          <Camera className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-medium mb-1">Camera Access Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable camera access for face detection
          </p>
          {webcamError && (
            <p className="text-xs text-destructive mb-4">{webcamError}</p>
          )}
          <Button onClick={() => window.location.reload()}>
            Enable Camera
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Video Container */}
      <div className="relative bg-black aspect-video overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.8}
          videoConstraints={{
            width: 1280,
            height: 720,
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          }}
          className="w-full h-full object-cover"
          mirrored
        />
        
        {/* Face Bounding Boxes */}
        <div className="absolute inset-0">
          {detectedFaces.map((face) => {
            const adjustedX = 100 - face.boundingBox.x - face.boundingBox.width;
            
            return (
              <div
                key={face.id}
                className={cn(
                  "absolute border-2 rounded",
                  face.isRegistered ? "border-green-400" : "border-amber-400"
                )}
                style={{
                  left: `${adjustedX}%`,
                  top: `${face.boundingBox.y}%`,
                  width: `${face.boundingBox.width}%`,
                  height: `${face.boundingBox.height}%`,
                  boxShadow: face.isRegistered 
                    ? "0 0 20px rgba(74, 222, 128, 0.5)" 
                    : "0 0 20px rgba(251, 191, 36, 0.5)",
                }}
              >
                {/* Name Label */}
                <div 
                  className={cn(
                    "absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap",
                    face.isRegistered 
                      ? "bg-green-500 text-white" 
                      : "bg-amber-500 text-black"
                  )}
                >
                  {face.isRegistered && face.matchedPersonName 
                    ? `${face.matchedPersonName}`
                    : "Unknown"}
                </div>
                
                {/* Confidence indicator for registered faces */}
                {face.isRegistered && face.confidence > 0 && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-medium">
                    {face.confidence}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scanning Overlay */}
        {isActive && (
          <>
            {/* Scan line animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
            </div>
            
            {/* Live indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          </>
        )}

        {/* Corner Frame */}
        <div className="absolute inset-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-white/40 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-white/40 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-white/40 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-white/40 rounded-br-lg" />
        </div>

        {/* Error Overlay */}
        {detectionError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-white text-sm text-center max-w-xs">{detectionError}</p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-card border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleToggleDetection}
              variant={isActive ? "destructive" : "default"}
              size="lg"
              className="min-w-36"
            >
              {isActive ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {isActive ? (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{detectedFaces.length}</span> face{detectedFaces.length !== 1 ? "s" : ""} detected
                  {detectedFaces.filter(f => f.isRegistered).length > 0 && (
                    <span className="text-green-600">
                      • {detectedFaces.filter(f => f.isRegistered).length} recognized
                    </span>
                  )}
                </span>
              ) : (
                "Ready to scan"
              )}
            </div>
          </div>

          {/* Camera Settings */}
          <div className="flex items-center gap-2">
            {availableDevices.length > 1 && (
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="w-48">
                  <Settings2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamFaceRecognition;
