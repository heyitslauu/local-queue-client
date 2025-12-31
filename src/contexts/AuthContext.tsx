import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  counterType: "BILLING" | "LAB" | "CASHIER";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:3000/auth/login", {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
