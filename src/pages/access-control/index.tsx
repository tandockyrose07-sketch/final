import React, { useState } from "react";
import { useData, Person } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Users } from "lucide-react";
import AccessControlHeader from "./components/AccessControlHeader";
import RecognizedUserCard from "./components/RecognizedUserCard";
import WebcamFaceRecognition from "./components/WebcamFaceRecognition";
import { DetectedFace } from "@/hooks/useFaceDetection";

const AccessControl = () => {
  const [lastRecognizedPeople, setLastRecognizedPeople] = useState<Person[]>([]);

  const handleFaceDetected = (faces: DetectedFace[], matchedPeople: Person[]) => {
    if (matchedPeople.length > 0) {
      setLastRecognizedPeople(matchedPeople);
    }
  };

  return (
    <div className="space-y-6">
      <AccessControlHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Webcam Recognition Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Live Face Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WebcamFaceRecognition onFaceDetected={handleFaceDetected} />
          </CardContent>
        </Card>

        {/* Recognized People Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recently Recognized
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastRecognizedPeople.length > 0 ? (
              <div className="space-y-3">
                {lastRecognizedPeople.slice(0, 5).map((person) => (
                  <RecognizedUserCard 
                    key={person.id}
                    name={`${person.firstName} ${person.lastName}`} 
                    role={person.type} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No faces recognized yet</p>
                <p className="text-xs mt-1">Start detection to identify registered people</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessControl;
