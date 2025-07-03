import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  avatar?: string;
  phoneNumber?: string;
  timezone: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  lastLogin?: Date;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    refetch,
  };
}