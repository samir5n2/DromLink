import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users, ShieldCheck, Activity, FileText, Ban, Moon, Sun, Bell,
  Building2, Eye, UserCircle, Home, CheckCircle, MessageSquare,
  Menu, X, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "User management", icon: Users, path: "/admin/users" },
  { label: "Population verification", icon: ShieldCheck, path: "/admin/verification" },
  { label: "Property verification", icon: Home, path: "/admin/properties" },
  { label: "Monitor system activity", icon: Activity, path: "/admin/activity" },
  { label: "Generate reports", icon: FileText, path: "/admin/reports" },
  { label: "Block users", icon: Ban, path: "/admin/block" },
  { label: "Chat", icon: MessageSquare, path: "/messages" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoggedIn, userEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => await fetchApi('/admin/users/'),
    enabled: isLoggedIn && isAdmin,
  });

  const { data: allDorms = [] } = useQuery({
    queryKey: ['admin_all_dorms'],
    queryFn: async () => await fetchApi('/dorms/'),
    enabled: isLoggedIn && isAdmin,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['admin_all_bookings'],
    queryFn: async () => await fetchApi('/bookings/'),
    enabled: isLoggedIn && isAdmin,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => await fetchApi('/notifications/'),
    enabled: isLoggedIn,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => await fetchApi('/notifications/mark_all_read/', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const handleOpenNotifications = () => {
    if (unreadNotifications.length > 0) {
      markReadMutation.mutate();
    }
  };

  const pendingCount = users.filter((u: any) => u.status === 'pending').length;
  const pendingDormsCount = allDorms.filter((d: any) => d.approval_status === 'pending').length;
  const bannedCount = users.filter((u: any) => u.status === 'banned').length;
  const activeDormsCount = allDorms.filter((d: any) => d.approval_status === 'approved').length;
  const totalBookingsCount = allBookings.length;

  const stats = [
    { label: "TOTAL BOOKINGS", value: totalBookingsCount.toString(), icon: Activity, color: "" },
    { label: "TOTAL USERS", value: users.length.toString(), icon: Users, color: "" },
    { label: "ACTIVE PLACES", value: activeDormsCount.toString(), icon: Building2, color: "" },
    { label: "PENDING ITEMS", value: (pendingCount + pendingDormsCount).toString(), icon: ShieldCheck, color: "text-primary" },
    { label: "BANNED USERS", value: bannedCount.toString(), icon: Ban, color: "text-destructive" },
  ];

  const handleNotificationClick = (n: any) => {
    if (n.notification_type === 'contact' || n.notification_type === 'message') {
      navigate(`/messages?user=${n.related_id}`);
    } else if (n.notification_type === 'property_update' || n.notification_type === 'contact') {
      navigate('/admin/properties');
    } else if (n.notification_type === 'user_registration') {
      navigate('/admin/users');
    }
  };

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col p-4 gap-2 transition-transform duration-300 transform
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:flex shrink-0
      `}>
        <div className="flex items-center justify-between px-3 py-4 mb-4">
          <Link to="/admin/users" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg tracking-tight text-foreground">DORMLINK</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.filter(i => i.label !== "Chat").map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.path === "/admin/users" && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
                {item.path === "/admin/properties" && pendingDormsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingDormsCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="my-2 border-t border-border" />
          
          {navItems.filter(i => i.label === "Chat").map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {userEmail?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs truncate">
              <div className="font-semibold text-foreground truncate">Admin Panel</div>
              <div className="text-muted-foreground truncate">Super Admin</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full mt-2 justify-start gap-2 h-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle Theme
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header & Stats */}
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-foreground">Dashboard Overview</h1>
            </div>

            <div className="flex items-center gap-2 mr-auto rtl:ml-0 ltr:ml-auto">
              <DropdownMenu onOpenChange={(open) => open && handleOpenNotifications()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <DropdownMenuItem 
                          key={n.id} 
                          className={`p-3 mb-1 cursor-pointer flex flex-col items-start gap-1 focus:bg-muted ${!n.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <span className="text-sm">{n.message}</span>
                          <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                             <Clock className="h-3 w-3" />
                             {new Date(n.created_at).toLocaleString()}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {userEmail?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">{s.label}</span>
                </div>
                <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto bg-muted/20">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
