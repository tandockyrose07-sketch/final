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
import { Users as UsersIcon, Plus, Pencil, Trash2, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const DEPARTMENTS_COLLEGE = ["BSIT", "BSBA", "BSHM"] as const;
const DEPARTMENTS_STAFF = ["Administration", "HR", "IT", "Finance", "Facilities", "Library"] as const;
const STRANDS = ["CSS", "HUMS"] as const;

// Validation schema
const personSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address").max(100),
  type: z.enum(["student", "teacher", "staff"] as const),
  studentType: z.enum(["college", "senior_high"] as const).optional(),
  department: z.string().optional(),
  strand: z.enum(["CSS", "HUMS"] as const).optional(),
  idNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
});

type FormData = z.infer<typeof personSchema>;

const Users = () => {
  const { people, addPerson, updatePerson, deletePerson, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      type: "student",
      studentType: undefined,
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
      studentType: undefined,
      department: "",
      strand: undefined,
      idNumber: "",
      mobileNumber: "",
    });
    setFormStep(1);
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
      studentType: person.studentType,
      department: person.department || "",
      strand: person.strand,
      idNumber: person.idNumber || "",
      mobileNumber: person.mobileNumber || "",
    });
    // Set appropriate step based on person type
    if (person.type === "student" && person.studentType) {
      setFormStep(3);
    } else if (person.type !== "student") {
      setFormStep(2);
    } else {
      setFormStep(1);
    }
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const validateCurrentStep = (): boolean => {
    const data = form.getValues();
    
    if (formStep === 1) {
      if (!data.type) {
        form.setError("type", { message: "Please select a person type" });
        return false;
      }
      return true;
    }
    
    if (formStep === 2 && data.type === "student") {
      if (!data.studentType) {
        form.setError("studentType", { message: "Please select student type" });
        return false;
      }
      return true;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    
    const data = form.getValues();
    
    if (formStep === 1) {
      if (data.type === "student") {
        setFormStep(2); // Go to student type selection
      } else {
        setFormStep(3); // Skip to details for staff/teacher
      }
    } else if (formStep === 2) {
      setFormStep(3); // Go to details
    }
  };

  const handlePrevStep = () => {
    const data = form.getValues();
    
    if (formStep === 3) {
      if (data.type === "student") {
        setFormStep(2);
      } else {
        setFormStep(1);
      }
    } else if (formStep === 2) {
      setFormStep(1);
    }
  };

  const validateFinalForm = (data: FormData): boolean => {
    // Validate ID number for students (6 digits)
    if (data.type === "student") {
      if (!/^\d{6}$/.test(data.idNumber || "")) {
        form.setError("idNumber", { message: "ID number must be exactly 6 digits" });
        return false;
      }
      
      if (data.studentType === "college") {
        if (!DEPARTMENTS_COLLEGE.includes(data.department as typeof DEPARTMENTS_COLLEGE[number])) {
          form.setError("department", { message: "Please select a valid department" });
          return false;
        }
      }
      
      if (data.studentType === "senior_high") {
        if (!STRANDS.includes(data.strand as typeof STRANDS[number])) {
          form.setError("strand", { message: "Please select a valid strand" });
          return false;
        }
      }
    } else {
      // Teacher or Staff
      if (!data.department || data.department.trim() === "") {
        form.setError("department", { message: "Department is required" });
        return false;
      }
    }
    
    // Validate mobile number format (optional but if provided, validate)
    if (data.mobileNumber && !/^[\d+\-\s]{10,15}$/.test(data.mobileNumber)) {
      form.setError("mobileNumber", { message: "Please enter a valid mobile number" });
      return false;
    }
    
    return true;
  };

  const handleAddPerson = async (data: FormData) => {
    if (!validateFinalForm(data)) return;

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

  const handleEditPerson = async (data: FormData) => {
    if (!selectedPerson || !validateFinalForm(data)) return;

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
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Step 1: Select Person Type
  const Step1PersonType = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Select Person Type</h3>
        <p className="text-sm text-muted-foreground">What type of person are you adding?</p>
      </div>
      
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "student", label: "Student", icon: "🎓" },
                { value: "teacher", label: "Teacher", icon: "👨‍🏫" },
                { value: "staff", label: "Staff", icon: "👔" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`p-4 rounded-lg border-2 ${
                    field.value === option.value
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // Step 2: Select Student Type (only for students)
  const Step2StudentType = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Select Student Type</h3>
        <p className="text-sm text-muted-foreground">What level is the student?</p>
      </div>
      
      <FormField
        control={form.control}
        name="studentType"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "college", label: "College", icon: "🏛️", desc: "BSIT, BSBA, BSHM" },
                { value: "senior_high", label: "Senior High", icon: "📚", desc: "CSS, HUMS" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`p-4 rounded-lg border-2 text-left ${
                    field.value === option.value
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // Step 3: Enter Details
  const Step3Details = () => {
    const type = form.getValues("type");
    const studentType = form.getValues("studentType");
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium">Enter Details</h3>
          <p className="text-sm text-muted-foreground">
            {type === "student" 
              ? studentType === "college" 
                ? "College Student Information" 
                : "Senior High Student Information"
              : `${type === "teacher" ? "Teacher" : "Staff"} Information`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mobile Number - for students */}
        {type === "student" && (
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+63 9XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Department - for College students and Staff/Teacher */}
        {(type !== "student" || studentType === "college") && (
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                {type === "student" && studentType === "college" ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS_COLLEGE.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS_STAFF.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Strand - for Senior High students */}
        {type === "student" && studentType === "senior_high" && (
          <FormField
            control={form.control}
            name="strand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strand</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STRANDS.map((strand) => (
                      <SelectItem key={strand} value={strand}>
                        {strand === "CSS" ? "CSS (Computer Systems Servicing)" : "HUMS (Humanities and Social Sciences)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ID Number - for students */}
        {type === "student" && (
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Number (6 digits)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123456"
                    maxLength={6}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  };

  const getStepContent = () => {
    switch (formStep) {
      case 1:
        return <Step1PersonType />;
      case 2:
        return <Step2StudentType />;
      case 3:
        return <Step3Details />;
      default:
        return null;
    }
  };

  const getTotalSteps = () => {
    const type = form.getValues("type");
    return type === "student" ? 3 : 2;
  };

  const PersonFormDialog = ({ 
    isOpen, 
    onOpenChange, 
    title, 
    description, 
    onSubmit, 
    submitLabel 
  }: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void; 
    title: string; 
    description: string;
    onSubmit: (data: FormData) => Promise<void>;
    submitLabel: string;
  }) => (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: getTotalSteps() }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-12 rounded-full transition-colors ${
                i + 1 <= formStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {getStepContent()}
            
            <DialogFooter className="flex gap-2">
              {formStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {formStep < getTotalSteps() ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      onOpenChange(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : submitLabel}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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
                        <div className="flex justify-end space-x-2">
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
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
      <PersonFormDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add New Person"
        description="Add a new student, teacher, or staff member to the system."
        onSubmit={handleAddPerson}
        submitLabel="Add Person"
      />

      {/* Edit Person Dialog */}
      <PersonFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Person"
        description={`Update the details for ${selectedPerson?.firstName} ${selectedPerson?.lastName}`}
        onSubmit={handleEditPerson}
        submitLabel="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedPerson?.firstName} {selectedPerson?.lastName}{" "}
              and all their associated biometric data. This action cannot be undone.
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
