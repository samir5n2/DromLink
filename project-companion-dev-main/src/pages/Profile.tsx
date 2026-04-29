import { useAuth } from "@/contexts/AuthContext";
import StudentProfile from "./StudentProfile";
import LandlordProfile from "./LandlordProfile";
import { Navigate, useSearchParams } from "react-router-dom";

const Profile = () => {
  const { isLoggedIn, userType } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || undefined;

  const hasToken = !!localStorage.getItem("access_token");

  if (!isLoggedIn || !hasToken) return <Navigate to="/sign-in" replace />;

  return userType === "landlord" ? <LandlordProfile defaultTab={tab} /> : <StudentProfile />;
};

export default Profile;
