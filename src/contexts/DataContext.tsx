import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type UserType = "student" | "teacher" | "staff";
export type StudentType = "college" | "senior_high";
export type Strand = "CSS" | "HUMS";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  type: UserType;
  email: string;
  department?: string;
  idNumber?: string;
  mobileNumber?: string;
  studentType?: StudentType;
  strand?: Strand;
  hasFacialData: boolean;
  hasFingerprint: boolean;
  photoUrl: string;
  active: boolean;
  createdAt: Date;
}

export interface AccessLog {
  id: string;
  personId: string | null;
  personName: string;
  personType: UserType;
  timestamp: Date;
  accessType: "entry" | "exit";
  method: "facial" | "fingerprint";
  granted: boolean;
  location: string;
}

interface DataContextType {
  people: Person[];
  accessLogs: AccessLog[];
  isLoading: boolean;
  addPerson: (person: Omit<Person, "id" | "createdAt">) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Omit<Person, "id" | "createdAt">>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  enrollFacial: (personId: string) => Promise<boolean>;
  enrollFingerprint: (personId: string) => Promise<boolean>;
  resetBiometrics: (personId: string) => Promise<void>;
  simulateAccess: (method: "facial" | "fingerprint", personId?: string) => Promise<{ granted: boolean; person: Person | null }>;
  refreshData: () => Promise<void>;
  logAccess: (personId: string, personName: string, personType: UserType, method: "facial" | "fingerprint", granted: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const mapPersonFromDb = (dbPerson: any): Person => ({
    id: dbPerson.id,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    type: dbPerson.person_type as UserType,
    email: dbPerson.email || "",
    department: dbPerson.department || undefined,
    idNumber: dbPerson.id_number || undefined,
    mobileNumber: dbPerson.mobile_number || undefined,
    studentType: dbPerson.student_type as StudentType | undefined,
    strand: dbPerson.strand as Strand | undefined,
    hasFacialData: dbPerson.has_facial_data,
    hasFingerprint: dbPerson.has_fingerprint,
    photoUrl: dbPerson.photo_url || "/placeholder.svg",
    active: dbPerson.active,
    createdAt: new Date(dbPerson.created_at),
  });

  const mapAccessLogFromDb = (dbLog: any): AccessLog => ({
    id: dbLog.id,
    personId: dbLog.person_id,
    personName: dbLog.person_name,
    personType: dbLog.person_type as UserType,
    timestamp: new Date(dbLog.timestamp),
    accessType: dbLog.access_type as "entry" | "exit",
    method: dbLog.method as "facial" | "fingerprint",
    granted: dbLog.granted,
    location: dbLog.location,
  });

  const fetchPeople = async () => {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching people:", error);
      return [];
    }

    return (data || []).map(mapPersonFromDb);
  };

  const fetchAccessLogs = async () => {
    const { data, error } = await supabase
      .from("access_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching access logs:", error);
      return [];
    }

    return (data || []).map(mapAccessLogFromDb);
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const [peopleData, logsData] = await Promise.all([
        fetchPeople(),
        fetchAccessLogs(),
      ]);
      setPeople(peopleData);
      setAccessLogs(logsData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setPeople([]);
      setAccessLogs([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const addPerson = async (personData: Omit<Person, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("people")
      .insert({
        first_name: personData.firstName,
        last_name: personData.lastName,
        person_type: personData.type,
        email: personData.email || null,
        department: personData.department || null,
        id_number: personData.idNumber || null,
        mobile_number: personData.mobileNumber || null,
        student_type: personData.studentType || null,
        strand: personData.strand || null,
        photo_url: personData.photoUrl || null,
        has_facial_data: personData.hasFacialData,
        has_fingerprint: personData.hasFingerprint,
        active: personData.active,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add person", { description: error.message });
      throw error;
    }

    setPeople((prev) => [mapPersonFromDb(data), ...prev]);
    toast.success("Person added successfully");
  };

  const updatePerson = async (id: string, updates: Partial<Omit<Person, "id" | "createdAt">>) => {
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.type !== undefined) dbUpdates.person_type = updates.type;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.department !== undefined) dbUpdates.department = updates.department || null;
    if (updates.idNumber !== undefined) dbUpdates.id_number = updates.idNumber || null;
    if (updates.mobileNumber !== undefined) dbUpdates.mobile_number = updates.mobileNumber || null;
    if (updates.studentType !== undefined) dbUpdates.student_type = updates.studentType || null;
    if (updates.strand !== undefined) dbUpdates.strand = updates.strand || null;
    if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl || null;
    if (updates.hasFacialData !== undefined) dbUpdates.has_facial_data = updates.hasFacialData;
    if (updates.hasFingerprint !== undefined) dbUpdates.has_fingerprint = updates.hasFingerprint;
    if (updates.active !== undefined) dbUpdates.active = updates.active;

    const { error } = await supabase
      .from("people")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update person", { description: error.message });
      throw error;
    }

    setPeople((prev) =>
      prev.map((person) => (person.id === id ? { ...person, ...updates } : person))
    );
    toast.success("Person updated successfully");
  };

  const deletePerson = async (id: string) => {
    const { error } = await supabase.from("people").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete person", { description: error.message });
      throw error;
    }

    setPeople((prev) => prev.filter((person) => person.id !== id));
    toast.success("Person deleted successfully");
  };

  const enrollFacial = async (personId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const { error } = await supabase
      .from("people")
      .update({ has_facial_data: true })
      .eq("id", personId);

    if (error) {
      toast.error("Failed to enroll facial data", { description: error.message });
      return false;
    }

    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId ? { ...person, hasFacialData: true } : person
      )
    );

    toast.success("Facial data enrolled successfully");
    return true;
  };

  const enrollFingerprint = async (personId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const { error } = await supabase
      .from("people")
      .update({ has_fingerprint: true })
      .eq("id", personId);

    if (error) {
      toast.error("Failed to enroll fingerprint", { description: error.message });
      return false;
    }

    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId ? { ...person, hasFingerprint: true } : person
      )
    );

    toast.success("Fingerprint enrolled successfully");
    return true;
  };

  const resetBiometrics = async (personId: string) => {
    const { error } = await supabase
      .from("people")
      .update({ has_facial_data: false, has_fingerprint: false })
      .eq("id", personId);

    if (error) {
      toast.error("Failed to reset biometrics", { description: error.message });
      throw error;
    }

    setPeople((prev) =>
      prev.map((person) =>
        person.id === personId
          ? { ...person, hasFacialData: false, hasFingerprint: false }
          : person
      )
    );

    toast.success("Biometric data reset successfully");
  };

  const logAccess = async (
    personId: string,
    personName: string,
    personType: UserType,
    method: "facial" | "fingerprint",
    granted: boolean
  ) => {
    const accessType = "entry";
    const { data: newLogData, error } = await supabase
      .from("access_logs")
      .insert({
        person_id: personId,
        person_name: personName,
        person_type: personType,
        access_type: accessType,
        method,
        granted,
        location: "Main Gate",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating access log:", error);
      return;
    }

    if (newLogData) {
      setAccessLogs((prev) => [mapAccessLogFromDb(newLogData), ...prev]);
    }
  };

  const simulateAccess = async (
    method: "facial" | "fingerprint",
    personId?: string
  ): Promise<{ granted: boolean; person: Person | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const eligiblePeople = personId
      ? people.filter((p) => p.id === personId)
      : people.filter((p) =>
          method === "facial" ? p.hasFacialData : p.hasFingerprint
        );

    if (eligiblePeople.length === 0) {
      toast.error("No eligible person found for this access method");
      return { granted: false, person: null };
    }

    const person = personId
      ? eligiblePeople[0]
      : eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)];

    const granted = Math.random() > 0.1 && person.active;

    await logAccess(person.id, `${person.firstName} ${person.lastName}`, person.type, method, granted);

    if (granted) {
      toast.success(`Access granted for ${person.firstName} ${person.lastName}`, {
        description: `${method === "facial" ? "Facial recognition" : "Fingerprint"} authentication successful`,
      });
    } else {
      toast.error(`Access denied for ${person.firstName} ${person.lastName}`, {
        description: person.active
          ? `${method === "facial" ? "Facial recognition" : "Fingerprint"} authentication failed`
          : "User account is inactive",
      });
    }

    return { granted, person };
  };

  return (
    <DataContext.Provider
      value={{
        people,
        accessLogs,
        isLoading,
        addPerson,
        updatePerson,
        deletePerson,
        enrollFacial,
        enrollFingerprint,
        resetBiometrics,
        simulateAccess,
        refreshData,
        logAccess,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
