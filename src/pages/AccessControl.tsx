import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, RefreshCw, UserCheck, UserX, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DetectedFace {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  matchedPersonId: string | null;
  matchedPersonName: string | null;
  confidence: number;
  isRegistered: boolean;
}

const AccessControl = () => {
  const { people } = useData();
  const webcamRef = useRef<Webcam>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const getVideoDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error getting video devices:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    getVideoDevices();
  }, [getVideoDevices]);

  const captureAndDetect = useCallback(async () => {
    if (!webcamRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const registeredFaces = people
        .filter((person) => person.hasFacialData && person.active)
        .map((person) => ({
          id: person.id,
          name: `${person.firstName} ${person.lastName}`,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("face-recognition", {
        body: {
          capturedImage: imageSrc,
          registeredFaces,
          mode: "detect",
        },
      });

      if (fnError) {
        console.error("Face detection error:", fnError);
      } else if (data?.faces) {
        setDetectedFaces(data.faces);
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [people]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setError(null);
    captureAndDetect();
    intervalRef.current = setInterval(captureAndDetect, 1500);
    toast.success("Monitoring started");
  }, [captureAndDetect]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    setDetectedFaces([]);
    toast.info("Monitoring stopped");
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const logAccess = async (face: DetectedFace) => {
    if (!face.matchedPersonId || !face.matchedPersonName) return;

    try {
      const matchedPerson = people.find((p) => p.id === face.matchedPersonId);
      await supabase.from("access_logs").insert({
        person_id: face.matchedPersonId,
        person_name: face.matchedPersonName,
        person_type: matchedPerson?.type || "student",
        access_type: "entry",
        method: "facial",
        granted: true,
        location: "Main Gate",
      });
      toast.success(`Access granted: ${face.matchedPersonName}`);
    } catch (err) {
      console.error("Failed to log access:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Access Control</h1>
        <p className="text-muted-foreground">
          Real-time face detection and access monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Live Camera Feed
              </CardTitle>
              <div className="flex items-center gap-2">
                {availableDevices.length > 1 && (
                  <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                    <SelectTrigger className="w-[200px]">
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
                <Button variant="outline" size="icon" onClick={getVideoDevices}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex flex-col items-center justify-center h-[480px] bg-muted rounded-lg">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive">{error}</p>
                <Button className="mt-4" onClick={getVideoDevices}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                  }}
                  className="w-full rounded-lg"
                />
                
                {/* Face Bounding Boxes */}
                {detectedFaces.map((face) => (
                  <div
                    key={face.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${face.boundingBox.x}%`,
                      top: `${face.boundingBox.y}%`,
                      width: `${face.boundingBox.width}%`,
                      height: `${face.boundingBox.height}%`,
                    }}
                  >
                    <div
                      className={`w-full h-full border-4 rounded ${
                        face.isRegistered ? "border-green-500" : "border-red-500"
                      }`}
                    />
                    <div
                      className={`absolute -top-7 left-0 px-2 py-1 text-xs font-bold text-white rounded ${
                        face.isRegistered ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {face.isRegistered
                        ? `${face.matchedPersonName} (${face.confidence}%)`
                        : "Unregistered"}
                    </div>
                  </div>
                ))}

                {isProcessing && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="animate-pulse">
                      Scanning...
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {!isMonitoring ? (
                <Button onClick={startMonitoring} className="flex-1">
                  Start Monitoring
                </Button>
              ) : (
                <Button onClick={stopMonitoring} variant="destructive" className="flex-1">
                  Stop Monitoring
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detected Faces Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Detected Faces</CardTitle>
          </CardHeader>
          <CardContent>
            {detectedFaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No faces detected</p>
                <p className="text-sm">Start monitoring to detect faces</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detectedFaces.map((face) => (
                  <div
                    key={face.id}
                    className={`p-3 rounded-lg border ${
                      face.isRegistered
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {face.isRegistered ? (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <UserX className="h-5 w-5 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {face.isRegistered ? face.matchedPersonName : "Unknown Person"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {face.isRegistered
                            ? `Confidence: ${face.confidence}%`
                            : "Not registered in system"}
                        </p>
                      </div>
                      {face.isRegistered && (
                        <Button size="sm" variant="outline" onClick={() => logAccess(face)}>
                          Log Entry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{detectedFaces.length}</div>
            <p className="text-sm text-muted-foreground">Faces Detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {detectedFaces.filter((f) => f.isRegistered).length}
            </div>
            <p className="text-sm text-muted-foreground">Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {detectedFaces.filter((f) => !f.isRegistered).length}
            </div>
            <p className="text-sm text-muted-foreground">Unregistered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {people.filter((p) => p.hasFacialData).length}
            </div>
            <p className="text-sm text-muted-foreground">Enrolled Faces</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessControl;
