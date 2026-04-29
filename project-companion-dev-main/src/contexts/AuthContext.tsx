import { createContext, useContext, useState, ReactNode } from "react";

type UserType = "student" | "landlord" | null;

const ADMIN_EMAILS = [
  "admin@dormlink.com",
  "superadmin@dormlink.com",
];

interface AuthContextType {
  isLoggedIn: boolean;
  userType: UserType;
  isAdmin: boolean;
  accountStatus: string;
  userEmail: string | null;
  login: (type?: UserType, email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userType: null,
  isAdmin: false,
  accountStatus: 'pending',
  userEmail: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("dormlink-auth") === "true"
  );
  const [userType, setUserType] = useState<UserType>(
    () => (localStorage.getItem("dormlink-user-type") as UserType) || null
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    () => localStorage.getItem("dormlink-email") || null
  );

  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("dormlink-is-admin") === "true"
  );
  const [accountStatus, setAccountStatus] = useState(
    () => localStorage.getItem("dormlink-account-status") || "pending"
  );

  const login = (type: UserType = "student", email?: string, admin: boolean = false, status: string = "pending") => {
    localStorage.setItem("dormlink-auth", "true");
    localStorage.setItem("dormlink-user-type", type || "student");
    localStorage.setItem("dormlink-is-admin", admin ? "true" : "false");
    localStorage.setItem("dormlink-account-status", status);
    if (email) localStorage.setItem("dormlink-email", email);
    
    setIsLoggedIn(true);
    setUserType(type);
    setIsAdmin(admin);
    setAccountStatus(status);
    if (email) setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("dormlink-auth");
    localStorage.removeItem("dormlink-user-type");
    localStorage.removeItem("dormlink-email");
    localStorage.removeItem("dormlink-is-admin");
    localStorage.removeItem("dormlink-account-status");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    setIsLoggedIn(false);
    setUserType(null);
    setIsAdmin(false);
    setAccountStatus("pending");
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userType, isAdmin, accountStatus, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
