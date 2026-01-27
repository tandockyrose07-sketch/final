import React, { useState } from "react";
import { useData, Person } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Shield, UserCheck, Clock, Zap } from "lucide-react";
import WebcamFaceRecognition from "./components/WebcamFaceRecognition";
import { DetectedFace } from "@/hooks/useFaceDetection";

const AccessControl = () => {
  const [lastRecognizedPeople, setLastRecognizedPeople] = useState<Person[]>([]);
  const [detectionStats, setDetectionStats] = useState({ total: 0, registered: 0, unknown: 0 });
  const [isActive, setIsActive] = useState(false);

  const handleFaceDetected = (faces: DetectedFace[], matchedPeople: Person[]) => {
    if (matchedPeople.length > 0) {
      setLastRecognizedPeople(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPeople = matchedPeople.filter(p => !existingIds.has(p.id));
        return [...newPeople, ...prev].slice(0, 6);
      });
    }
    
    setDetectionStats({
      total: faces.length,
      registered: faces.filter(f => f.isRegistered).length,
      unknown: faces.filter(f => !f.isRegistered).length,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Access Control</h1>
                <p className="text-sm text-muted-foreground">Real-time facial recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isActive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  SCANNING
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Camera Feed - Takes up most space */}
          <div className="xl:col-span-3">
            <Card className="overflow-hidden border-2">
              <CardContent className="p-0">
                <WebcamFaceRecognition 
                  onFaceDetected={handleFaceDetected}
                  onActiveChange={setIsActive}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Live Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Detection Stats</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{detectionStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{detectionStats.registered}</div>
                    <div className="text-xs text-muted-foreground">Known</div>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{detectionStats.unknown}</div>
                    <div className="text-xs text-muted-foreground">Unknown</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recently Recognized */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Recent Access</h3>
                </div>
                
                {lastRecognizedPeople.length > 0 ? (
                  <div className="space-y-2">
                    {lastRecognizedPeople.slice(0, 6).map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 p-2 bg-green-500/5 rounded-lg border border-green-500/20"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {person.firstName} {person.lastName}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(new Date())}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {person.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No recent access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
