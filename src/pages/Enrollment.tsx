import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Camera,
  RefreshCcw,
  Check,
  X,
  ScanFace,
} from "lucide-react";
import FacialEnrollmentDialog from "@/components/enrollment/FacialEnrollmentDialog";

const Enrollment = () => {
  const { people, resetBiometrics, refreshData } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);

  const filteredPeople = people.filter(person => {
    const matchesSearch = searchQuery === "" || 
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "enrolled" && person.hasFacialData) ||
      (statusFilter === "none" && !person.hasFacialData);
    
    return matchesSearch && matchesStatus;
  });

  const startEnrollment = (person: Person) => {
    setSelectedPerson(person);
    setIsEnrollmentDialogOpen(true);
  };

  const handleEnrollmentComplete = async () => {
    await refreshData();
    setSelectedPerson(null);
  };

  const handleResetBiometrics = (person: Person) => {
    if (window.confirm(`Are you sure you want to reset facial data for ${person.firstName} ${person.lastName}?`)) {
      resetBiometrics(person.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Facial Enrollment</h1>
        <p className="text-muted-foreground">
          Enroll users for facial recognition access control
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanFace className="mr-2 h-5 w-5" />
            Enrollment Status
          </CardTitle>
          <CardDescription>
            View and manage facial recognition data for all users
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
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="none">Not Enrolled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Facial Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeople.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeople.map(person => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {person.photoUrl && person.photoUrl !== "/placeholder.svg" ? (
                            <img 
                              src={person.photoUrl} 
                              alt={`${person.firstName} ${person.lastName}`}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-muted-foreground">
                                {person.firstName[0]}{person.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {person.firstName} {person.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground hidden md:block">
                              {person.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant="outline" 
                          className={`
                            ${person.type === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              person.type === 'teacher' ? 'bg-green-50 text-green-700 border-green-200' : 
                              'bg-amber-50 text-amber-700 border-amber-200'}
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!person.hasFacialData ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => startEnrollment(person)}
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Enroll Face</span>
                              <span className="sm:hidden">Enroll</span>
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => startEnrollment(person)}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Re-enroll</span>
                                <span className="sm:hidden">Update</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleResetBiometrics(person)}
                              >
                                <RefreshCcw className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Reset</span>
                              </Button>
                            </>
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
      
      {/* Facial Enrollment Dialog */}
      <FacialEnrollmentDialog
        isOpen={isEnrollmentDialogOpen}
        onOpenChange={setIsEnrollmentDialogOpen}
        person={selectedPerson}
        onEnrollmentComplete={handleEnrollmentComplete}
      />
    </div>
  );
};

export default Enrollment;
