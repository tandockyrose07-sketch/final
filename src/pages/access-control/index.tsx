import React, { useState } from "react";
import { useData, Person } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Users, Shield, UserCheck, UserX } from "lucide-react";
import AccessControlHeader from "./components/AccessControlHeader";
import RecognizedUserCard from "./components/RecognizedUserCard";
import WebcamFaceRecognition from "./components/WebcamFaceRecognition";
import { DetectedFace } from "@/hooks/useFaceDetection";

const AccessControl = () => {
  const [lastRecognizedPeople, setLastRecognizedPeople] = useState<Person[]>([]);
  const [detectionStats, setDetectionStats] = useState({ total: 0, registered: 0, unknown: 0 });

  const handleFaceDetected = (faces: DetectedFace[], matchedPeople: Person[]) => {
    if (matchedPeople.length > 0) {
      setLastRecognizedPeople(prev => {
        // Add new people, avoid duplicates
        const existingIds = new Set(prev.map(p => p.id));
        const newPeople = matchedPeople.filter(p => !existingIds.has(p.id));
        return [...newPeople, ...prev].slice(0, 10); // Keep last 10
      });
    }
    
    setDetectionStats({
      total: faces.length,
      registered: faces.filter(f => f.isRegistered).length,
      unknown: faces.filter(f => !f.isRegistered).length,
    });
  };

  return (
    <div className="space-y-6">
      <AccessControlHeader />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{detectionStats.total}</p>
                <p className="text-sm text-muted-foreground">Faces Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{detectionStats.registered}</p>
                <p className="text-sm text-muted-foreground">Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <UserX className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{detectionStats.unknown}</p>
                <p className="text-sm text-muted-foreground">Unknown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Webcam Recognition Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Live Face Detection
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Real-time AI-powered detection
              </span>
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
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
