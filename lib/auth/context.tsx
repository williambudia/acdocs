"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, Role } from "@/lib/types";
import { hasPermission } from "@/lib/types";
import { useAuthenticateUser, useLogoutUser } from "@/lib/queries/users";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  can: (permission: string) => boolean;
  isRole: (...roles: Role[]) => boolean;
}

const AUTH_STORAGE_KEY = "acdocs_auth_user";

// Helper para acessar storage de forma segura
const getStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      // Tenta localStorage primeiro (mais confiável no iOS)
      if (window.localStorage) {
        return window.localStorage;
      }
      // Fallback para sessionStorage
      if (window.sessionStorage) {
        return window.sessionStorage;
      }
    }
  } catch (error) {
    console.warn('Storage not available:', error);
  }
  return null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  const authenticateMutation = useAuthenticateUser();
  const logoutMutation = useLogoutUser();

  // Hydrate from storage after mount (client only)
  useEffect(() => {
    try {
      const storage = getStorage();
      if (storage) {
        const stored = storage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored) as User);
        }
      }
    } catch (error) {
      console.warn('Failed to load auth state:', error);
    }
    setHydrated(true);
  }, []);

  // Persist user changes to storage
  useEffect(() => {
    if (!hydrated) return;
    try {
      const storage = getStorage();
      if (storage) {
        if (user) {
          storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
          storage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to persist auth state:', error);
    }
  }, [user, hydrated]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const authenticatedUser = await authenticateMutation.mutateAsync({ email, password });
      if (authenticatedUser) {
        setUser(authenticatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [authenticateMutation]);

  const logout = useCallback(async () => {
    if (user) {
      try {
        await logoutMutation.mutateAsync({ 
          userId: user.id, 
          userName: user.name 
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
  }, [user, logoutMutation]);

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  const isRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hydrated,
        login,
        logout,
        can,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
