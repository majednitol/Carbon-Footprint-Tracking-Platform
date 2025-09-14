"use client"
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "../../../../server/shared/schema";

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalActivities: number;
  totalEmissions: number;
}

import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { Badge } from "../src/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../src/components/ui/avatar";


import { Users, Building2, BarChart3, Leaf, Search, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { useAuth } from "../src/hooks/useAuth";
import { useToast } from "../src/hooks/use-toast";
import { isUnauthorizedError } from "../src/lib/authUtils";
import { apiRequest } from "../src/lib/queryClient";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      // Redirect to dashboard
      // window.location.href = '/';
    }
  }, [user, authLoading, toast]);

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    // enabled: user?.role === 'admin',
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/stats`);
      return res.json();
    },
  });

  const { data: users, isLoading: usersLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    // enabled: user?.role === 'admin',
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users`);
      return res.json();
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        // window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (authLoading || statsLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not admin
  // if (!user || user.role !== 'admin') {
  //   return null;
  // }

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return email?.split("@")[0] || "User";
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'user': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Enterprise Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage users, organizations, and system settings</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-users">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {adminStats?.totalUsers?.toLocaleString() || 0}
              </h3>
            </CardContent>
          </Card>

          <Card data-testid="card-total-organizations">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-sm text-muted-foreground">Organizations</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {adminStats?.totalOrganizations?.toLocaleString() || 0}
              </h3>
            </CardContent>
          </Card>

          <Card data-testid="card-total-activities">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">Monthly Activities</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {adminStats?.totalActivities?.toLocaleString() || 0}
              </h3>
            </CardContent>
          </Card>

          <Card data-testid="card-total-emissions">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-chart-2" />
                </div>
                <span className="text-sm text-muted-foreground">Total Emissions (t)</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {(adminStats?.totalEmissions || 0).toFixed(1)}
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table */}
        <Card data-testid="card-user-management">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                    data-testid="input-search-users"
                  />
                </div>
                <Button data-testid="button-add-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Organization</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users && users.length > 0 ? (
                    users.map((userData, index) => (
                      <tr key={index} className="hover:bg-muted/50" data-testid={`user-row-${index}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userData.profileImageUrl || ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                {getInitials(userData.firstName || undefined, userData.lastName || undefined, userData.email || undefined)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {getDisplayName(userData.firstName || undefined, userData.lastName || undefined, userData.email || undefined)}
                              </p>
                              <p className="text-sm text-muted-foreground">{userData.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-foreground">
                            {userData.organizationId || "No Organization"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={getRoleBadgeColor(userData.role || undefined)}>
                            {userData.role || 'user'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="bg-chart-2/10 text-chart-2">
                            Active
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" data-testid={`button-edit-user-${index}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`button-delete-user-${index}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No users found</h3>
                          <p className="text-sm">Users will appear here once they join the platform</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {users && users.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing 1-{users.length} of {adminStats?.totalUsers || 0} users
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
