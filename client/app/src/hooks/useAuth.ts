"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  const res = await fetch("http://localhost:5001/api/auth/user", { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}
