"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AuthService from "@/services/auth.service";

// Define the types for the context
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, country: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Instantiate AuthService
  const authService = new AuthService();

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem("jwt_token");
    if (token) {
      authService
        .validateToken(token)
        .then((userData) => {
          if (userData) {
            setUser({ ...userData, id: userData._id || userData.id });
            setIsAuthenticated(true);
          } else {
            throw new Error("Invalid token");
          }
        })
        .catch(() => {
          localStorage.removeItem("jwt_token");
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.login(email, password, "email");
      // Adjust based on actual respose structure. Assuming response.data.data.token
      const token = (response.data as any).token || (response.data as any).data?.token;

      if (token) {
        localStorage.setItem("jwt_token", token);

        // Fetch user profile immediately after login
        const userRes = await authService.getUser(token);
        const userData = (userRes.data as any).data || userRes.data;
        setUser({ ...userData, id: userData._id || userData.id });
        setIsAuthenticated(true);
      } else {
        throw new Error("No token received");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    country: string,
  ): Promise<void> => {
    try {
      await authService.register(name, email, password, country, "manual");
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
