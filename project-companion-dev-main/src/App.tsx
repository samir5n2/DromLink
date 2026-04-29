import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SignIn from "./pages/SignIn";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Listings from "./pages/Listings";
import DormReview from "./pages/DormReview";
import LandlordReview from "./pages/LandlordReview";
import StudentReview from "./pages/StudentReview";
import PropertyReviews from "./pages/PropertyReviews";
import PropertyDetails from "./pages/PropertyDetails";
import Messages from "./pages/Messages";
import UserManagement from "./pages/admin/UserManagement";
import PopulationVerification from "./pages/admin/PopulationVerification";
import PropertyVerification from "./pages/admin/PropertyVerification";
import MonitorActivity from "./pages/admin/MonitorActivity";
import GenerateReports from "./pages/admin/GenerateReports";
import BlockUsers from "./pages/admin/BlockUsers";
import "@/i18n";

const queryClient = new QueryClient();

const MessagesWrapper = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? (
    <AdminLayout>
      <Messages />
    </AdminLayout>
  ) : (
    <Layout>
      <Messages />
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                <Route path="/profile/:type/:id" element={<Layout><PublicProfile /></Layout>} />
                <Route path="/listings" element={<Layout><Listings /></Layout>} />
                <Route path="/review/dorm" element={<ProtectedRoute><Layout><DormReview /></Layout></ProtectedRoute>} />
                <Route path="/review/landlord" element={<ProtectedRoute><Layout><LandlordReview /></Layout></ProtectedRoute>} />
                <Route path="/review/student" element={<ProtectedRoute><Layout><StudentReview /></Layout></ProtectedRoute>} />
                <Route path="/property/reviews" element={<ProtectedRoute><Layout><PropertyReviews /></Layout></ProtectedRoute>} />
                <Route path="/property/:id" element={<Layout><PropertyDetails /></Layout>} />
                <Route path="/messages" element={<ProtectedRoute><MessagesWrapper /></ProtectedRoute>} />
                {/* Admin routes */}
                <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
                <Route path="/admin/verification" element={<AdminLayout><PopulationVerification /></AdminLayout>} />
                <Route path="/admin/properties" element={<AdminLayout><PropertyVerification /></AdminLayout>} />
                <Route path="/admin/activity" element={<AdminLayout><MonitorActivity /></AdminLayout>} />
                <Route path="/admin/reports" element={<AdminLayout><GenerateReports /></AdminLayout>} />
                <Route path="/admin/block" element={<AdminLayout><BlockUsers /></AdminLayout>} />
                <Route path="/" element={<Layout><Index /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
                <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
