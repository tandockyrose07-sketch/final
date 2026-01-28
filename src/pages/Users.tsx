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
import { Users as UsersIcon, Plus, Pencil, Trash2, Search } from "lucide-react";
import { z } from "zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";

const DEPARTMENTS_COLLEGE = ["BSIT", "BSBA", "BSHM"] as const;
const DEPARTMENTS_STAFF = ["Administration", "HR", "IT", "Finance", "Facilities", "Library"] as const;
const STRANDS = ["CSS", "HUMS"] as const;

const personSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(30),
  lastName: z.string().min(1, "Last name is required").max(30),
  email: z.string().email("Invalid email address").max(100),
  type: z.enum(["student", "teacher", "staff"] as const),
  studentType: z.enum(["college", "senior_high"] as const).optional(),
  department: z.string().optional(),
  strand: z.enum(["CSS", "HUMS"] as const).optional(),
  idNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
});

type FormData = z.infer<typeof personSchema>;

interface PersonFormProps {
  form: UseFormReturn<FormData>;
  watchedType: "student" | "teacher" | "staff";
  watchedStudentType: "college" | "senior_high" | undefined;
}

const PersonFormContent: React.FC<PersonFormProps> = ({ form, watchedType, watchedStudentType }) => {
  const [firstName, setFirstName] = useState(form.getValues("firstName"));
  const [lastName, setLastName] = useState(form.getValues("lastName"));
  const [email, setEmail] = useState(form.getValues("email"));
  const [idNumber, setIdNumber] = useState(form.getValues("idNumber") || "");
  const [mobileNumber, setMobileNumber] = useState(form.getValues("mobileNumber") || "");

  return (
    <div className="space-y-4">
      {/* Person Type */}
      <div className="space-y-2">
        <Label>Person Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["student", "teacher", "staff"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => form.setValue("type", type)}
              className={`p-3 rounded border text-sm font-medium capitalize ${
                watchedType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Student Type */}
      {watchedType === "student" && (
        <div className="space-y-2">
          <Label>Student Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["college", "senior_high"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => form.setValue("studentType", st)}
                className={`p-3 rounded border text-sm font-medium ${
                  watchedStudentType === st
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {st === "college" ? "College" : "Senior High"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            maxLength={30}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              form.setValue("firstName", e.target.value);
            }}
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            maxLength={30}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              form.setValue("lastName", e.target.value);
            }}
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            form.setValue("email", e.target.value);
          }}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Department */}
      {(watchedType !== "student" || watchedStudentType === "college") && (
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={form.watch("department") || ""}
            onValueChange={(value) => form.setValue("department", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {(watchedType === "student" ? DEPARTMENTS_COLLEGE : DEPARTMENTS_STAFF).map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.department && (
            <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
          )}
        </div>
      )}

      {/* Strand */}
      {watchedType === "student" && watchedStudentType === "senior_high" && (
        <div className="space-y-2">
          <Label>Strand</Label>
          <Select
            value={form.watch("strand") || ""}
            onValueChange={(value) => form.setValue("strand", value as "CSS" | "HUMS")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strand" />
            </SelectTrigger>
            <SelectContent>
              {STRANDS.map((strand) => (
                <SelectItem key={strand} value={strand}>
                  {strand === "CSS" ? "CSS (Computer Systems Servicing)" : "HUMS (Humanities and Social Sciences)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.strand && (
            <p className="text-sm text-destructive">{form.formState.errors.strand.message}</p>
          )}
        </div>
      )}

      {/* ID Number */}
      {watchedType === "student" && (
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number (6 digits)</Label>
          <Input
            id="idNumber"
            placeholder="123456"
            maxLength={6}
            value={idNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setIdNumber(value);
              form.setValue("idNumber", value);
            }}
          />
          {form.formState.errors.idNumber && (
            <p className="text-sm text-destructive">{form.formState.errors.idNumber.message}</p>
          )}
        </div>
      )}

      {/* Mobile Number */}
      {watchedType === "student" && (
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number (optional)</Label>
          <Input
            id="mobileNumber"
            placeholder="+63 9XX XXX XXXX"
            value={mobileNumber}
            onChange={(e) => {
              setMobileNumber(e.target.value);
              form.setValue("mobileNumber", e.target.value);
            }}
          />
          {form.formState.errors.mobileNumber && (
            <p className="text-sm text-destructive">{form.formState.errors.mobileNumber.message}</p>
          )}
        </div>
      )}
    </div>
  );
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

  const form = useForm<FormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      type: "student",
      studentType: "college",
      department: "",
      strand: undefined,
      idNumber: "",
      mobileNumber: "",
    },
  });

  const watchedType = form.watch("type");
  const watchedStudentType = form.watch("studentType");

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
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      type: "student",
      studentType: "college",
      department: "",
      strand: undefined,
      idNumber: "",
      mobileNumber: "",
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (person: Person) => {
    setSelectedPerson(person);
    form.reset({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      type: person.type,
      studentType: person.studentType || "college",
      department: person.department || "",
      strand: person.strand,
      idNumber: person.idNumber || "",
      mobileNumber: person.mobileNumber || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (data: FormData): boolean => {
    if (data.type === "student") {
      if (!/^\d{6}$/.test(data.idNumber || "")) {
        form.setError("idNumber", { message: "ID number must be exactly 6 digits" });
        return false;
      }
      if (data.studentType === "college" && !DEPARTMENTS_COLLEGE.includes(data.department as typeof DEPARTMENTS_COLLEGE[number])) {
        form.setError("department", { message: "Please select a department" });
        return false;
      }
      if (data.studentType === "senior_high" && !STRANDS.includes(data.strand as typeof STRANDS[number])) {
        form.setError("strand", { message: "Please select a strand" });
        return false;
      }
    } else {
      if (!data.department || data.department.trim() === "") {
        form.setError("department", { message: "Department is required" });
        return false;
      }
    }
    if (data.mobileNumber && !/^[\d+\-\s]{10,15}$/.test(data.mobileNumber)) {
      form.setError("mobileNumber", { message: "Please enter a valid mobile number" });
      return false;
    }
    return true;
  };

  const handleAddPerson = async () => {
    const data = form.getValues();
    if (!validateForm(data)) return;

    setIsSubmitting(true);
    try {
      await addPerson({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        type: data.type as UserType,
        studentType: data.type === "student" ? data.studentType as StudentType : undefined,
        department: data.studentType === "senior_high" ? undefined : data.department,
        strand: data.studentType === "senior_high" ? data.strand as Strand : undefined,
        idNumber: data.type === "student" ? data.idNumber : undefined,
        mobileNumber: data.mobileNumber || undefined,
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
    const data = form.getValues();
    if (!selectedPerson || !validateForm(data)) return;

    setIsSubmitting(true);
    try {
      await updatePerson(selectedPerson.id, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        type: data.type as UserType,
        studentType: data.type === "student" ? data.studentType as StudentType : undefined,
        department: data.studentType === "senior_high" ? undefined : data.department,
        strand: data.studentType === "senior_high" ? data.strand as Strand : undefined,
        idNumber: data.type === "student" ? data.idNumber : undefined,
        mobileNumber: data.mobileNumber || undefined,
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
          <CardDescription>Manage user records for facial enrollment</CardDescription>
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
                  <TableHead className="hidden md:table-cell">Department/Strand</TableHead>
                  <TableHead className="hidden md:table-cell">ID Number</TableHead>
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
                      No users found matching your criteria
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
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={getTypeBadgeStyles(person.type)}>
                            {person.type}
                          </Badge>
                          {person.studentType && (
                            <span className="text-xs text-muted-foreground">
                              {person.studentType === "college" ? "College" : "Senior High"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {person.strand || person.department || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {person.idNumber || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{person.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(person)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
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
            <DialogTitle>Add New Person</DialogTitle>
            <DialogDescription>Add a new student, teacher, or staff member.</DialogDescription>
          </DialogHeader>
          {isAddDialogOpen && (
            <PersonFormContent
              key="add-form"
              form={form}
              watchedType={watchedType}
              watchedStudentType={watchedStudentType}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPerson} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Person"}
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
            <DialogDescription>Update details for {selectedPerson?.firstName} {selectedPerson?.lastName}</DialogDescription>
          </DialogHeader>
          {isEditDialogOpen && (
            <PersonFormContent
              key={`edit-form-${selectedPerson?.id}`}
              form={form}
              watchedType={watchedType}
              watchedStudentType={watchedStudentType}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditPerson} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedPerson?.firstName} {selectedPerson?.lastName} and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground"
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
