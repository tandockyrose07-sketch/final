import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Person } from "@/contexts/DataContext";

export interface FaceRecognitionResult {
  faceDetected: boolean;
  matchFound: boolean;
  matchedPersonId: string | null;
  matchedPersonName: string | null;
  confidence: number;
  message: string;
}

export interface FaceRecognitionHook {
  isProcessing: boolean;
  result: FaceRecognitionResult | null;
  error: string | null;
  recognizeFace: (imageData: string, registeredPeople: Person[]) => Promise<FaceRecognitionResult | null>;
  reset: () => void;
}

export const useFaceRecognition = (): FaceRecognitionHook => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FaceRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognizeFace = useCallback(async (
    imageData: string,
    registeredPeople: Person[]
  ): Promise<FaceRecognitionResult | null> => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Prepare registered faces data
      const registeredFaces = registeredPeople
        .filter(person => person.hasFacialData && person.active)
        .map(person => ({
          id: person.id,
          name: `${person.firstName} ${person.lastName}`,
          photoUrl: person.photoUrl,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("face-recognition", {
        body: {
          capturedImage: imageData,
          registeredFaces,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Face recognition failed");
      }

      const recognitionResult: FaceRecognitionResult = {
        faceDetected: data.faceDetected ?? false,
        matchFound: data.matchFound ?? false,
        matchedPersonId: data.matchedPersonId ?? null,
        matchedPersonName: data.matchedPersonName ?? null,
        confidence: data.confidence ?? 0,
        message: data.message ?? "Unknown result",
      };

      setResult(recognitionResult);
      setIsProcessing(false);
      return recognitionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Face recognition error";
      setError(errorMessage);
      setIsProcessing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    result,
    error,
    recognizeFace,
    reset,
  };
};
