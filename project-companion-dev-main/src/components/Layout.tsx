import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { PreferencesOnboarding } from "./PreferencesOnboarding";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <PreferencesOnboarding />
  </div>
);

export default Layout;
