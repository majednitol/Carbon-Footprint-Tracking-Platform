"use client";

import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "../dashboard/page";
import ActivityLogging from "../activity/page";
import Analytics from "../analytics/page";
import NotFound from "../not-found/page";
import Admin from "../admin/page";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import Landing from "../landing/page";


// Pages


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthRender />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthRender() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  // Handle redirects
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // If not authenticated → always go to landing
      if (pathname !== "/") router.replace("/");
    } else {
      // If authenticated and visiting landing, send to dashboard
      if (pathname === "/") router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ---------- Authenticated Layout ----------
  if (isAuthenticated) {
    const sidebarStyle = {
      "--sidebar-width": "16rem", // 256px
      "--sidebar-width-icon": "4rem",
    } as React.CSSProperties;

    const renderAuthenticatedRoute = () => {
      switch (pathname) {
        case "/":
        case "/dashboard":
          return <Dashboard />;
        case "/activity":
        case "/activity-logging":
          return <ActivityLogging />;
        case "/analytics":
          return <Analytics />;
        case "/admin":
          return user?.role === "admin" ? <Admin /> : <NotFound />;
        default:
          return <NotFound />;
      }
    };

    return (
      <SidebarProvider style={sidebarStyle}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b border-border bg-card">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="text-sm text-muted-foreground">
                Enterprise Carbon Management
              </div>
            </header>

            <main className="flex-1 overflow-auto bg-background p-6">
              {renderAuthenticatedRoute()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // ---------- Public (Unauthenticated) Layout ----------
  const renderUnauthenticatedRoute = () => {
    switch (pathname) {
      case "/":
      case "/landing":
        return <Landing />;
      default:
        return <Landing />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderUnauthenticatedRoute()}
    </div>
  );
}

export default App;
