"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminLogin, adminLogout, adminGetMe } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | string;
  is_active: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_TOKEN_KEY = "captionstudio_admin_token";

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem("admin_token");
}

export function setClientToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem("admin_token", token);
    document.cookie = `captionstudio_admin_token=${token}; path=/; max-age=${30 * 86400}; SameSite=Lax`;
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem("admin_token");
    document.cookie = "captionstudio_admin_token=; path=/; max-age=0";
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = getClientToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminGetMe();
      if (data.authenticated) {
        setUser({
          id: data.session_id,
          name: "Administrator",
          email: "admin@captionstudio.local",
          role: "ADMIN",
          is_active: true,
        });
        setToken(savedToken);
      } else {
        setClientToken(null);
        setUser(null);
        setToken(null);
      }
    } catch {
      setClientToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      const res = await adminLogin(password);
      setClientToken(res.token);
      setToken(res.token);
      setUser({
        id: "admin-session",
        name: "Administrator",
        email: "admin@captionstudio.local",
        role: "ADMIN",
        is_active: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch {
      // ignore
    } finally {
      setClientToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        login,
        logout,
        refreshUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
