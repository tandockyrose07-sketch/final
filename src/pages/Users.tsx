import React, { useState } from "react";
import { useData, Person, UserType } from "@/contexts/DataContext";
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

const DEPARTMENTS_STUDENT = ["BSIT", "BSHM", "BSBA"] as const;
const DEPARTMENTS_STAFF = ["Administration", "HR", "IT", "Finance", "Facilities", "Library"] as const;

// Validation schema - flexible to handle all types
const personSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address").max(100, "Email must be less than 100 characters"),
  type: z.enum(["student", "teacher", "staff"] as const),
  department: z.string().optional(),
  idNumber: z.string().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      type: "student",
      department: "",
      idNumber: "",
    },
  });

  const watchedType = form.watch("type");

  // Update validation based on type
  React.useEffect(() => {
    if (watchedType === "student") {
      form.clearErrors();
    } else {
      form.clearErrors("idNumber");
    }
  }, [watchedType, form]);

  const filteredPeople = people.filter((person) => {
    const matchesSearch =
      searchQuery === "" ||
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.idNumber && person.idNumber.includes(searchQuery));

    const matchesType = typeFilter === "all" || person.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleOpenAddDialog = () => {
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      type: "student",
      department: "",
      idNumber: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (person: Person) => {
    setSelectedPerson(person);
    form.reset({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      type: person.type,
      department: person.department || "",
      idNumber: person.idNumber || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (data: FormData): boolean => {
    if (data.type === "student") {
      if (!DEPARTMENTS_STUDENT.includes(data.department as typeof DEPARTMENTS_STUDENT[number])) {
        form.setError("department", { message: "Please select a valid department" });
        return false;
      }
      if (!/^\d{6}$/.test(data.idNumber || "")) {
        form.setError("idNumber", { message: "ID number must be exactly 6 digits" });
        return false;
      }
    } else {
      if (!data.department || data.department.trim() === "") {
        form.setError("department", { message: "Department is required" });
        return false;
      }
    }
    return true;
  };

  const handleAddPerson = async (data: FormData) => {
    if (!validateForm(data)) return;

    setIsSubmitting(true);
    try {
      await addPerson({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        type: data.type as UserType,
        department: data.department,
        idNumber: data.type === "student" ? data.idNumber : undefined,
        hasFacialData: false,
        hasFingerprint: false,
        photoUrl: "",
        active: true,
      });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add person:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPerson = async (data: FormData) => {
    if (!selectedPerson || !validateForm(data)) return;

    setIsSubmitting(true);
    try {
      await updatePerson(selectedPerson.id, {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        type: data.type as UserType,
        department: data.department,
        idNumber: data.type === "student" ? data.idNumber : undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedPerson(null);
      form.reset();
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

  const PersonFormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
    <>
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Person Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isEdit}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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

      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            {watchedType === "student" ? (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEPARTMENTS_STUDENT.map((dept) => (
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

      {watchedType === "student" && (
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
    </>
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
                  <TableHead className="hidden md:table-cell">Department</TableHead>
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
                        <Badge variant="outline" className={getTypeBadgeStyles(person.type)}>
                          {person.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {person.department || "-"}
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Person</DialogTitle>
            <DialogDescription>
              Add a new student, teacher, or staff member to the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddPerson)} className="space-y-4">
              <PersonFormFields />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Person"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
            <DialogDescription>
              Update the details for {selectedPerson?.firstName} {selectedPerson?.lastName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditPerson)} className="space-y-4">
              <PersonFormFields isEdit />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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