import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, setAccessToken } from "../api/client";

export type User = {
  id: string;
  email: string;
  name: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const updateToken = (newToken: string | null) => {
    setTokenState(newToken);
    setAccessToken(newToken);
  };

  useEffect(() => {
    // Silent Refresh on initial load using httpOnly cookie
    async function restoreSession() {
      try {
        const res = await apiRequest<{ user: User; accessToken: string }>("/api/auth/refresh", {
          method: "POST"
        });
        setUser(res.user);
        updateToken(res.accessToken);
      } catch {
        // No active refresh token or expired
        setUser(null);
        updateToken(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: User; accessToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setUser(res.user);
    updateToken(res.accessToken);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await apiRequest<{ user: User; accessToken: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name })
    });
    setUser(res.user);
    updateToken(res.accessToken);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      updateToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
