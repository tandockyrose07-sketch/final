import React, { useState, useEffect } from "react";
import { useData, Person } from "@/contexts/DataContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  Search,
  Camera,
  RefreshCcw,
  Check,
  X,
  UserRoundX,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Enrollment = () => {
  const { people, enrollFacial, enrollFingerprint, resetBiometrics } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollingType, setEnrollingType] = useState<"facial" | "fingerprint" | null>(null);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  useEffect(() => {
    console.log('Status Filter:', statusFilter);
    console.log('Filter Options:', [
      { value: 'all', label: 'All Users' },
      { value: 'enrolled', label: 'Fully Enrolled' },
      { value: 'partial', label: 'Partially Enrolled' },
      { value: 'none', label: 'No Biometrics' }
    ]);
  }, [statusFilter]);

  const filteredPeople = people.filter(person => {
    const matchesSearch = searchQuery === "" || 
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "enrolled" && (person.hasFacialData && person.hasFingerprint)) ||
      (statusFilter === "partial" && ((person.hasFacialData || person.hasFingerprint) && !(person.hasFacialData && person.hasFingerprint))) ||
      (statusFilter === "none" && !person.hasFacialData && !person.hasFingerprint);
    
    return matchesSearch && matchesStatus;
  });

  const startEnrollment = (person: Person, type: "facial" | "fingerprint") => {
    setSelectedPerson(person);
    setEnrollingType(type);
    setIsEnrolling(true);
    setEnrollProgress(0);
    
    const progressInterval = setInterval(() => {
      setEnrollProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    if (type === "facial") {
      enrollFacial(person.id).finally(() => {
        clearInterval(progressInterval);
        setIsEnrolling(false);
      });
    } else {
      enrollFingerprint(person.id).finally(() => {
        clearInterval(progressInterval);
        setIsEnrolling(false);
      });
    }
  };

  const handleResetBiometrics = (person: Person) => {
    if (window.confirm(`Are you sure you want to reset all biometric data for ${person.firstName} ${person.lastName}?`)) {
      resetBiometrics(person.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Biometric Enrollment</h1>
        <p className="text-muted-foreground">
          Enroll users for facial recognition and fingerprint access
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fingerprint className="mr-2 h-5 w-5" />
            Enrollment Status
          </CardTitle>
          <CardDescription>
            View and manage biometric data for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="enrolled">Fully Enrolled</SelectItem>
                <SelectItem value="partial">Partially Enrolled</SelectItem>
                <SelectItem value="none">No Biometrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Facial</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeople.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeople.map(person => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="font-medium">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground hidden md:block">
                          {person.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${person.type === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              person.type === 'teacher' ? 'bg-green-50 text-green-700 border-green-200' : 
                              person.type === 'staff' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-purple-50 text-purple-700 border-purple-200'}
                          `}
                        >
                          {person.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {person.hasFacialData ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            <X className="h-3 w-3 mr-1" /> Not Enrolled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {person.hasFingerprint ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            <X className="h-3 w-3 mr-1" /> Not Enrolled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {!person.hasFacialData && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => startEnrollment(person, "facial")}
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Enroll Face</span>
                              <span className="sm:hidden">Face</span>
                            </Button>
                          )}
                          
                          {!person.hasFingerprint && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => startEnrollment(person, "fingerprint")}
                            >
                              <Fingerprint className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Enroll Fingerprint</span>
                              <span className="sm:hidden">Finger</span>
                            </Button>
                          )}
                          
                          {(person.hasFacialData || person.hasFingerprint) && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleResetBiometrics(person)}
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Reset</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isEnrolling} onOpenChange={(open) => {
        if (!open) setIsEnrolling(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {enrollingType === "facial" ? "Facial Recognition Enrollment" : "Fingerprint Enrollment"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {selectedPerson && (
              <div className="text-center mb-4">
                <p className="font-medium">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedPerson.type}</p>
              </div>
            )}
            
            {enrollingType === "facial" ? (
              <div className="face-recognition-box w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center relative">
                {enrollProgress < 100 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserRoundX className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium">Scanning face...</p>
                      <p className="text-xs text-muted-foreground">{enrollProgress}% complete</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-16 w-16 text-green-500" />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium text-green-600">Face enrolled successfully!</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-lg animate-pulse"></div>
              </div>
            ) : (
              <div className="fingerprint-scanner w-48 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {enrollProgress < 100 ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-blue-700/20" />
                    <div className="fingerprint-scan-line"></div>
                    <Fingerprint className={`h-24 w-24 text-blue-400 ${enrollProgress > 50 ? 'opacity-70' : 'opacity-100'}`} />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-xs text-white/80">Place finger on sensor</p>
                      <p className="text-xs text-white/60">{enrollProgress}% complete</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/20">
                    <Check className="h-16 w-16 text-green-400" />
                    <p className="mt-2 text-xs text-white">Fingerprint enrolled!</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6">
              <Progress value={enrollProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {enrollProgress < 100 
                  ? "Please wait while we process the biometric data..." 
                  : "Enrollment completed successfully!"}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsEnrolling(false)}
              disabled={enrollProgress < 100}
            >
              {enrollProgress < 100 ? "Cancel" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enrollment;
