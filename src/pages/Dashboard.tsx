
import React from "react";
import { useData, AccessLog } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Fingerprint,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { people, accessLogs } = useData();

  // Calculate stats
  const totalUsers = people.length;
  const activeUsers = people.filter(p => p.active).length;
  
  const facialEnrolled = people.filter(p => p.hasFacialData).length;
  const fingerprintEnrolled = people.filter(p => p.hasFingerprint).length;
  
  const todayLogs = accessLogs.filter(log => {
    const today = new Date();
    return log.timestamp.getDate() === today.getDate() &&
           log.timestamp.getMonth() === today.getMonth() &&
           log.timestamp.getFullYear() === today.getFullYear();
  });
  
  const successfulAccesses = todayLogs.filter(log => log.granted).length;
  const failedAccesses = todayLogs.filter(log => !log.granted).length;
  
  const recentLogs = accessLogs.slice(0, 8);

  // Distribution of user types
  const userTypeCounts = people.reduce((acc, person) => {
    acc[person.type] = (acc[person.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of access control activity and system status
        </p>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-md">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className={`h-2 w-2 rounded-full ${activeUsers === totalUsers ? 'bg-green-500' : 'bg-amber-500'} mr-1`} />
              <span className="text-muted-foreground">{activeUsers} active users ({Math.round(activeUsers / totalUsers * 100)}%)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Biometric Enrollment</p>
                <p className="text-3xl font-bold">{Math.round((facialEnrolled + fingerprintEnrolled) / (totalUsers * 2) * 100)}%</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-md">
                <Fingerprint className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-1" />
                <span className="text-muted-foreground">Face: {facialEnrolled}</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 mr-1" />
                <span className="text-muted-foreground">Finger: {fingerprintEnrolled}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Today's Access</p>
                <p className="text-3xl font-bold">{todayLogs.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-md">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                <span className="text-muted-foreground">Success: {successfulAccesses}</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-red-500 mr-1" />
                <span className="text-muted-foreground">Failed: {failedAccesses}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">User Types</p>
                <p className="text-3xl font-bold">{Object.keys(userTypeCounts).length}</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-md">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {Object.entries(userTypeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className={`h-2 w-2 rounded-full mr-1
                        ${type === 'student' ? 'bg-blue-500' : 
                          type === 'teacher' ? 'bg-green-500' : 
                          type === 'staff' ? 'bg-amber-500' : 'bg-purple-500'}`} 
                    />
                    <span className="capitalize text-muted-foreground">{type}s</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest access events in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentLogs.map((log) => (
                <AccessLogItem key={log.id} log={log} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AccessLogItem: React.FC<{ log: AccessLog }> = ({ log }) => {
  const getTypeColor = (type: string) => {
    switch(type) {
      case "student": return "bg-blue-100 text-blue-800";
      case "teacher": return "bg-green-100 text-green-800";
      case "staff": return "bg-amber-100 text-amber-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div className="flex items-center justify-between pb-4 border-b last:border-b-0 last:pb-0">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center
          ${log.granted ? 'bg-green-100' : 'bg-red-100'}`}>
          {log.granted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div>
          <div className="font-medium">{log.personName}</div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{log.accessType === "entry" ? "Entered" : "Exited"}</span>
            <span>•</span>
            <span>{log.location}</span>
            <span>•</span>
            <span className="capitalize">{log.method} authentication</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(log.personType)}`}>
          {log.personType}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
