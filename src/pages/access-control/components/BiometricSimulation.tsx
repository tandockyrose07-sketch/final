
import React from "react";
import { Camera, Fingerprint, UserCheck, UserX } from "lucide-react";

interface BiometricSimulationProps {
  method: "facial" | "fingerprint";
  animationComplete: boolean;
  verificationResult: boolean | null;
}

const BiometricSimulation: React.FC<BiometricSimulationProps> = ({
  method,
  animationComplete,
  verificationResult,
}) => {
  if (method === "facial") {
    return (
      <div className="face-recognition-box w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center relative">
        {!animationComplete ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center">
                <Camera className="h-16 w-16 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute top-0 left-0 right-0 bottom-0">
              <div className="w-full h-full relative">
                <div className="absolute top-0 bottom-0 left-0 right-0 border-4 border-dashed border-blue-400 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {verificationResult === true ? (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <UserCheck className="h-16 w-16 text-green-500" />
                </div>
                <p className="mt-4 text-lg font-medium text-green-600">Access Granted</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <UserX className="h-16 w-16 text-red-500" />
                </div>
                <p className="mt-4 text-lg font-medium text-red-600">Access Denied</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fingerprint-scanner w-48 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
      {!animationComplete ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-purple-700/20" />
          <div className="absolute left-0 top-0 w-full h-4 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70 animate-scanning"></div>
          <Fingerprint className="h-24 w-24 text-blue-400" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {verificationResult === true ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                <UserCheck className="h-10 w-10 text-white" />
              </div>
              <p className="mt-4 text-md text-white">Access Granted</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center mx-auto">
                <UserX className="h-10 w-10 text-white" />
              </div>
              <p className="mt-4 text-md text-white">Access Denied</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BiometricSimulation;
