import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type UserRole = "admin" | "security" | "super_admin";

interface AppUser {
  id: string;
  email: string;
  role: UserRole | null;
  name: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    return data?.role as UserRole | null;
  };

  const fetchUserProfile = async (userId: string, authUser?: User): Promise<string> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
      return authUser?.user_metadata?.full_name || "User";
    }

    // If no profile exists (for users who signed up before trigger was added), try to create one
    if (!data && authUser) {
      const fullName = authUser.user_metadata?.full_name || authUser.email || "User";
      await supabase
        .from("profiles")
        .insert({ id: userId, full_name: fullName })
        .single();
      return fullName;
    }

    return data?.full_name || authUser?.user_metadata?.full_name || "User";
  };

  const buildAppUser = async (authUser: User): Promise<AppUser> => {
    const [role, name] = await Promise.all([
      fetchUserRole(authUser.id),
      fetchUserProfile(authUser.id, authUser),
    ]);

    return {
      id: authUser.id,
      email: authUser.email || "",
      role,
      name,
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(async () => {
            const appUser = await buildAppUser(session.user);
            setUser(appUser);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const appUser = await buildAppUser(session.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Login failed", {
          description: error.message,
        });
        return false;
      }

      if (data.user) {
        const appUser = await buildAppUser(data.user);
        setUser(appUser);
        toast.success("Login successful", {
          description: `Welcome back, ${appUser.name}!`,
        });
        return true;
      }

      return false;
    } catch (error) {
      toast.error("Login failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      return false;
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error("Signup failed", {
          description: error.message,
        });
        return false;
      }

      if (data.user) {
        // Insert the user role using service role via edge function or direct insert
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: role as any });

        if (roleError) {
          console.error("Error inserting user role:", roleError);
          // Continue anyway - admin can assign role later
        }

        toast.success("Account created", {
          description: `Welcome! You've been registered as ${role === 'super_admin' ? 'Super Admin' : 'Admin'}.`,
        });
        return true;
      }

      return false;
    } catch (error) {
      toast.error("Signup failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
