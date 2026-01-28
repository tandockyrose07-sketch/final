import React, { useEffect, useState, useCallback, useRef } from "react";
import Webcam from "react-webcam";
import { Camera, Loader2, AlertCircle, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebcam } from "@/hooks/useWebcam";
import { useFaceDetection, DetectedFace } from "@/hooks/useFaceDetection";
import { useData, Person } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface WebcamFaceRecognitionProps {
  onFaceDetected?: (faces: DetectedFace[], matchedPeople: Person[]) => void;
}

const WebcamFaceRecognition: React.FC<WebcamFaceRecognitionProps> = ({
  onFaceDetected,
}) => {
  const { webcamRef, hasPermission, error: webcamError, requestPermission, captureImage, isLoading: webcamLoading } = useWebcam();
  const { isDetecting, detectedFaces, error: detectionError, startContinuousDetection, stopDetection } = useFaceDetection();
  const { people, logAccess } = useData();
  
  const [isActive, setIsActive] = useState(false);
  const loggedPersonsRef = useRef<Map<string, number>>(new Map());

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

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

  // Log access when registered face is detected - uses DataContext for real-time sync
  useEffect(() => {
    const processDetectedFaces = async () => {
      for (const face of detectedFaces) {
        if (face.isRegistered && face.matchedPersonId) {
          const person = people.find(p => p.id === face.matchedPersonId);
          if (person) {
            // Check if we recently logged this person (within last 30 seconds) to avoid spam
            const now = Date.now();
            const lastLogged = loggedPersonsRef.current.get(face.matchedPersonId);
            
            if (!lastLogged || now - lastLogged > 30000) {
              loggedPersonsRef.current.set(face.matchedPersonId, now);
              
              // Use the DataContext logAccess function for real-time sync with dashboard
              await logAccess(
                person.id,
                `${person.firstName} ${person.lastName}`,
                person.type,
                "facial",
                true
              );

              toast.success(`Access Granted: ${person.firstName} ${person.lastName}`, {
                description: `Face recognized with ${face.confidence}% confidence`,
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
      startContinuousDetection(captureImage, people, 2500);
      setIsActive(true);
    }
  }, [isActive, startContinuousDetection, stopDetection, captureImage, people]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Render permission request
  if (!hasPermission && !webcamLoading) {
    return (
      <div className="w-full max-w-2xl h-96 mx-auto bg-muted rounded-lg flex flex-col items-center justify-center gap-4 p-6">
        <Camera className="h-16 w-16 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Camera access is required for face detection
        </p>
        {webcamError && (
          <p className="text-xs text-destructive text-center">{webcamError}</p>
        )}
        <Button onClick={requestPermission} disabled={webcamLoading}>
          {webcamLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Enable Camera
        </Button>
      </div>
    );
  }

  if (webcamLoading) {
    return (
      <div className="w-full max-w-2xl h-96 mx-auto bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Webcam container with face boxes */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "user",
          }}
          className="w-full h-full object-cover"
          mirrored
        />
        
        {/* Face bounding boxes overlay */}
        <div className="absolute inset-0 z-10">
          {detectedFaces.map((face) => {
            // Adjust for mirrored video: flip x coordinate
            const adjustedX = 100 - face.boundingBox.x - face.boundingBox.width;
            
            return (
              <div
                key={face.id}
                className={cn(
                  "absolute pointer-events-none transition-all duration-200",
                  "border-4 rounded-md",
                  face.isRegistered 
                    ? "border-green-500" 
                    : "border-amber-500"
                )}
                style={{
                  left: `${adjustedX}%`,
                  top: `${face.boundingBox.y}%`,
                  width: `${face.boundingBox.width}%`,
                  height: `${face.boundingBox.height}%`,
                  boxShadow: face.isRegistered 
                    ? '0 0 20px 4px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.2)' 
                    : '0 0 20px 4px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.2)',
                }}
              >
                {/* Corner accents */}
                <div className={cn(
                  "absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 rounded-tl",
                  face.isRegistered ? "border-green-400" : "border-amber-400"
                )} />
                <div className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 rounded-tr",
                  face.isRegistered ? "border-green-400" : "border-amber-400"
                )} />
                <div className={cn(
                  "absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 rounded-bl",
                  face.isRegistered ? "border-green-400" : "border-amber-400"
                )} />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 rounded-br",
                  face.isRegistered ? "border-green-400" : "border-amber-400"
                )} />

                {/* Label above the box */}
                <div 
                  className={cn(
                    "absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap",
                    face.isRegistered 
                      ? "bg-green-500 text-white" 
                      : "bg-amber-500 text-black"
                  )}
                >
                  {face.isRegistered && face.matchedPersonName 
                    ? `${face.matchedPersonName} ${face.confidence}%`
                    : "Unknown"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scanning indicator */}
        {isDetecting && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        )}

        {/* Corner guides */}
        <div className="absolute inset-4 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-white/30 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-white/30 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-white/30 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-white/30 rounded-br-lg" />
        </div>

        {/* Error overlay */}
        {detectionError && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-white text-sm text-center">{detectionError}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isActive ? (
            <span>
              Detected: <strong>{detectedFaces.length}</strong> face(s)
              {detectedFaces.filter(f => f.isRegistered).length > 0 && (
                <span className="text-green-600 ml-2">
                  ({detectedFaces.filter(f => f.isRegistered).length} registered)
                </span>
              )}
            </span>
          ) : (
            <span>Click Start to begin face detection</span>
          )}
        </div>
        
        <Button 
          onClick={handleToggleDetection}
          variant={isActive ? "destructive" : "default"}
          className="min-w-32"
        >
          {isActive ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Detection
            </>
          )}
        </Button>
      </div>

      {/* Detected faces list */}
      {detectedFaces.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {detectedFaces.map((face) => (
            <div
              key={face.id}
              className={cn(
                "p-3 rounded-lg border text-sm",
                face.isRegistered 
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                  : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
              )}
            >
              <p className="font-medium">
                {face.matchedPersonName || "Unknown Person"}
              </p>
              {face.confidence > 0 && (
                <p className="text-xs text-muted-foreground">
                  Confidence: {face.confidence}%
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebcamFaceRecognition;
