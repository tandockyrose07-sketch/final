import React, { useState } from "react";
import { useData, Person, UserType, StudentType, Strand } from "@/contexts/DataContext";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Users as UsersIcon, Plus, Pencil, Trash2, Search } from "lucide-react";

const DEPARTMENTS_COLLEGE = ["BSIT", "BSBA", "BSHM"] as const;
const DEPARTMENTS_STAFF = ["Administration", "HR", "IT", "Finance", "Facilities", "Library"] as const;
const STRANDS = ["CSS", "HUMS"] as const;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  type: UserType;
  studentType?: StudentType;
  department: string;
  strand?: Strand;
  idNumber: string;
  mobileNumber: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  type: "student",
  studentType: undefined,
  department: "",
  strand: undefined,
  idNumber: "",
  mobileNumber: "",
};

const Users = () => {
  const { people, addPerson, updatePerson, deletePerson, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const filteredPeople = people.filter((person) => {
    const matchesSearch =
      searchQuery === "" ||
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.idNumber && person.idNumber.includes(searchQuery));

    const matchesType = typeFilter === "all" || person.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      type: person.type,
      studentType: person.studentType,
      department: person.department || "",
      strand: person.strand,
      idNumber: person.idNumber || "",
      mobileNumber: person.mobileNumber || "",
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === "type") {
        updated.studentType = undefined;
        updated.department = "";
        updated.strand = undefined;
        updated.idNumber = "";
      }
      if (field === "studentType") {
        updated.department = "";
        updated.strand = undefined;
      }
      
      return updated;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.type === "student") {
      if (!formData.studentType) newErrors.studentType = "Select student level";
      if (!/^\d{6}$/.test(formData.idNumber)) newErrors.idNumber = "ID must be 6 digits";
      
      if (formData.studentType === "college" && !formData.department) {
        newErrors.department = "Select department";
      }
      if (formData.studentType === "senior_high" && !formData.strand) {
        newErrors.strand = "Select strand";
      }
    } else {
      if (!formData.department) newErrors.department = "Select department";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPerson = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await addPerson({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        type: formData.type,
        studentType: formData.type === "student" ? formData.studentType : undefined,
        department: formData.studentType === "senior_high" ? undefined : formData.department,
        strand: formData.studentType === "senior_high" ? formData.strand : undefined,
        idNumber: formData.type === "student" ? formData.idNumber : undefined,
        mobileNumber: formData.mobileNumber || undefined,
        hasFacialData: false,
        hasFingerprint: false,
        photoUrl: "",
        active: true,
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to add person:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPerson = async () => {
    if (!selectedPerson || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await updatePerson(selectedPerson.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        type: formData.type,
        studentType: formData.type === "student" ? formData.studentType : undefined,
        department: formData.studentType === "senior_high" ? undefined : formData.department,
        strand: formData.studentType === "senior_high" ? formData.strand : undefined,
        idNumber: formData.type === "student" ? formData.idNumber : undefined,
        mobileNumber: formData.mobileNumber || undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedPerson(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update person:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!selectedPerson) return;

    setIsSubmitting(true);
    try {
      await deletePerson(selectedPerson.id);
      setIsDeleteDialogOpen(false);
      setSelectedPerson(null);
    } catch (error) {
      console.error("Failed to delete person:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadgeStyles = (type: UserType) => {
    switch (type) {
      case "student":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "teacher":
        return "bg-green-50 text-green-700 border-green-200";
      case "staff":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const PersonForm = () => (
    <div className="space-y-4">
      {/* Person Type */}
      <div className="space-y-2">
        <Label>Person Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["student", "teacher", "staff"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateField("type", type)}
              className={`p-3 rounded-lg border-2 text-center capitalize ${
                formData.type === type
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Student Level (only for students) */}
      {formData.type === "student" && (
        <div className="space-y-2">
          <Label>Student Level</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "college", label: "College" },
              { value: "senior_high", label: "Senior High" },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField("studentType", option.value)}
                className={`p-3 rounded-lg border-2 text-center ${
                  formData.studentType === option.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.studentType && <p className="text-xs text-destructive">{errors.studentType}</p>}
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="John"
          />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="john.doe@example.com"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Department/Strand based on type */}
      {formData.type === "student" && formData.studentType === "college" && (
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={formData.department} onValueChange={(v) => updateField("department", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS_COLLEGE.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
        </div>
      )}

      {formData.type === "student" && formData.studentType === "senior_high" && (
        <div className="space-y-2">
          <Label>Strand</Label>
          <Select value={formData.strand || ""} onValueChange={(v) => updateField("strand", v as Strand)}>
            <SelectTrigger>
              <SelectValue placeholder="Select strand" />
            </SelectTrigger>
            <SelectContent>
              {STRANDS.map((strand) => (
                <SelectItem key={strand} value={strand}>
                  {strand === "CSS" ? "CSS (Computer Systems Servicing)" : "HUMS (Humanities & Social Sciences)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.strand && <p className="text-xs text-destructive">{errors.strand}</p>}
        </div>
      )}

      {(formData.type === "teacher" || formData.type === "staff") && (
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={formData.department} onValueChange={(v) => updateField("department", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS_STAFF.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
        </div>
      )}

      {/* ID Number (students only) */}
      {formData.type === "student" && (
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number (6 digits)</Label>
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => updateField("idNumber", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            maxLength={6}
          />
          {errors.idNumber && <p className="text-xs text-destructive">{errors.idNumber}</p>}
        </div>
      )}

      {/* Mobile Number (optional) */}
      <div className="space-y-2">
        <Label htmlFor="mobileNumber">Mobile Number (optional)</Label>
        <Input
          id="mobileNumber"
          value={formData.mobileNumber}
          onChange={(e) => updateField("mobileNumber", e.target.value)}
          placeholder="+63 9XX XXX XXXX"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage students, teachers, and staff
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            Manage user records for biometric enrollment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Dept/Strand</TableHead>
                  <TableHead className="hidden md:table-cell">ID</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredPeople.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeople.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="font-medium">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground lg:hidden">
                          {person.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeStyles(person.type)}>
                          {person.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {person.strand || person.department || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {person.idNumber || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{person.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(person)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleOpenDeleteDialog(person)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Add Person Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
            <DialogDescription>Add a new person to the system</DialogDescription>
          </DialogHeader>
          <PersonForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddPerson} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Person"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setSelectedPerson(null);
        }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
            <DialogDescription>
              Update details for {selectedPerson?.firstName} {selectedPerson?.lastName}
            </DialogDescription>
          </DialogHeader>
          <PersonForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditPerson} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedPerson?.firstName} {selectedPerson?.lastName} and all their biometric data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
