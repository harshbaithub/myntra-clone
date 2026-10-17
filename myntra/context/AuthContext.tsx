import { createContext, useContext, useEffect, useState } from "react";
import { getUserData, saveUserData, clearUserData } from "@/utils/storage";
import React from "react";
import { api } from "@/utils/api";
import { useTheme } from "./ThemeContext";

type AuthContextType = {
  isAuthenticated: boolean;
  user: { _id: string; name: string; email: string; themePreference?: string } | null;
  Signup: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { syncThemeWithUser } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    _id: string;
    name: string;
    email: string;
    themePreference?: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getUserData();
      if (data._id && data.name && data.email) {
        setUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          themePreference: data.themePreference || undefined,
        });
        setIsAuthenticated(true);
        if (data.themePreference) {
          syncThemeWithUser(data.themePreference, data._id);
        } else {
          syncThemeWithUser(undefined, data._id);
        }
      }
    })();
  }, [syncThemeWithUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/user/login", {
      email,
      password,
    });

    const data = await res.data.user;
    if (data.fullName) {
      await saveUserData(data._id, data.fullName, data.email, data.themePreference);
      setUser({
        _id: data._id,
        name: data.fullName,
        email: data.email,
        themePreference: data.themePreference,
      });
      setIsAuthenticated(true);
      if (data.themePreference) {
        await syncThemeWithUser(data.themePreference, data._id);
      } else {
        await syncThemeWithUser(undefined, data._id);
      }
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const Signup = async (fullName: string, email: string, password: string) => {
    const res = await api.post("/user/signup", {
      fullName,
      email,
      password,
    });
    const data = await res.data.user;
    if (data.fullName) {
      await saveUserData(data._id, data.fullName, data.email, data.themePreference);
      setUser({
        _id: data._id,
        name: data.fullName,
        email: data.email,
        themePreference: data.themePreference,
      });
      setIsAuthenticated(true);
      if (data.themePreference) {
        await syncThemeWithUser(data.themePreference, data._id);
      } else {
        await syncThemeWithUser(undefined, data._id);
      }
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const logout = async () => {
    await clearUserData();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, Signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
