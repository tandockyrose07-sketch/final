import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

export interface WebcamHook {
  webcamRef: React.RefObject<Webcam>;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  captureImage: () => string | null;
  requestPermission: () => Promise<boolean>;
}

export const useWebcam = (): WebcamHook => {
  const webcamRef = useRef<Webcam>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Camera access denied";
      setError(errorMessage);
      setHasPermission(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  const captureImage = useCallback((): string | null => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      return imageSrc;
    }
    return null;
  }, []);

  return {
    webcamRef,
    isLoading,
    error,
    hasPermission,
    captureImage,
    requestPermission,
  };
};
