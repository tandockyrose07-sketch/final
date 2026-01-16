import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Person } from "@/contexts/DataContext";

export interface DetectedFace {
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

export interface FaceDetectionResult {
  faces: DetectedFace[];
  totalFaces: number;
  message: string;
}

export interface FaceDetectionHook {
  isDetecting: boolean;
  detectedFaces: DetectedFace[];
  error: string | null;
  startContinuousDetection: (
    captureImage: () => string | null,
    registeredPeople: Person[],
    intervalMs?: number
  ) => void;
  stopDetection: () => void;
  detectOnce: (imageData: string, registeredPeople: Person[]) => Promise<FaceDetectionResult | null>;
}

export const useFaceDetection = (): FaceDetectionHook => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const detectOnce = useCallback(async (
    imageData: string,
    registeredPeople: Person[]
  ): Promise<FaceDetectionResult | null> => {
    try {
      const registeredFaces = registeredPeople
        .filter(person => person.hasFacialData && person.active)
        .map(person => ({
          id: person.id,
          name: `${person.firstName} ${person.lastName}`,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("face-recognition", {
        body: {
          capturedImage: imageData,
          registeredFaces,
          mode: "detect",
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Face detection failed");
      }

      const result: FaceDetectionResult = {
        faces: data.faces || [],
        totalFaces: data.totalFaces || 0,
        message: data.message || "",
      };

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Detection error";
      setError(errorMessage);
      return null;
    }
  }, []);

  const startContinuousDetection = useCallback((
    captureImage: () => string | null,
    registeredPeople: Person[],
    intervalMs: number = 2000
  ) => {
    setIsDetecting(true);
    setError(null);

    const runDetection = async () => {
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      const imageData = captureImage();
      
      if (imageData) {
        const result = await detectOnce(imageData, registeredPeople);
        if (result) {
          setDetectedFaces(result.faces);
        }
      }
      
      isProcessingRef.current = false;
    };

    // Run immediately
    runDetection();

    // Then run on interval
    intervalRef.current = setInterval(runDetection, intervalMs);
  }, [detectOnce]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsDetecting(false);
    setDetectedFaces([]);
    isProcessingRef.current = false;
  }, []);

  return {
    isDetecting,
    detectedFaces,
    error,
    startContinuousDetection,
    stopDetection,
    detectOnce,
  };
};
