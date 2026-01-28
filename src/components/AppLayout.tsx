import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { canAccessRoute } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import {
  BarChart3,
  Users,
  Fingerprint,
  LogOut,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  History,
  Camera,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const allNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "User Management",
      icon: Users,
      path: "/users",
    },
    {
      title: "Access Control",
      icon: Camera,
      path: "/access-control",
    },
    {
      title: "Access Logs",
      icon: History,
      path: "/access-logs",
    },
    {
      title: "Biometric Enrollment",
      icon: Fingerprint,
      path: "/enrollment",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter((item) =>
    canAccessRoute(user.role, item.path)
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="px-6 py-5 flex items-center border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-white">SecureSchool</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = window.location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start font-medium tracking-wide ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            } transition-colors`}
                            onClick={() => navigate(item.path)}
                          >
                            <item.icon className={`mr-3 h-5 w-5 ${
                              isActive ? "text-current" : "text-sidebar-foreground/60"
                            }`} />
                            <span>{item.title}</span>
                          </Button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-sidebar-accent-foreground font-semibold">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-grow overflow-auto">
          <div className="p-4 lg:p-6">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <SidebarTrigger className="lg:hidden mb-4" />
              </div>
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
