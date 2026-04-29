import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Moon, Sun, User, Globe, Menu, X, LogOut, MessageCircle, Bell, Clock, Shield } from "lucide-react";
import dormlinkLogo from "@/assets/dormlink-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout, isAdmin, userType } = useAuth();
  
  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => await fetchApi('/messages/'),
    enabled: isLoggedIn,
    refetchInterval: 10000,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNavbarSearch, setShowNavbarSearch] = useState(true);

  useEffect(() => {
    // If on listings page, hide navbar search unless it's the "Top Rated" view
    const sortParam = new URLSearchParams(location.search).get("sort");
    if (location.pathname === "/listings" && sortParam !== "rating") {
      setShowNavbarSearch(false);
      return;
    }

    // If not on home page, always show search
    if (location.pathname !== "/") {
      setShowNavbarSearch(true);
      return;
    }

    const handleScroll = () => {
      // Hide search if at the top of home page (hero search is visible)
      if (window.scrollY > 450) {
        setShowNavbarSearch(true);
      } else {
        setShowNavbarSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("dormlink-lang", lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const currentLang = i18n.language === "ar" ? "العربية" : "English";

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

  const handleOpenNotifications = () => {
    if (unreadNotifications.length > 0) {
      markReadMutation.mutate();
    }
  };

  const handleNotificationClick = (n: any) => {
    console.log("Notification clicked:", n);
    if (n.notification_type === 'booking_request') {
      navigate('/profile?tab=requests');
    } else if (n.notification_type === 'booking_update') {
      navigate('/profile');
    } else if (n.notification_type === 'dorm_verification') {
      navigate('/admin/properties');
    } else if (n.notification_type === 'message' || n.notification_type === 'contact' || n.notification_type === 'general') {
      navigate('/messages');
    }
    // Clicking anywhere in the menu closes it automatically due to DropdownMenuItem behavior,
    // but if we are just using divs inside DropdownMenuContent, we might need a custom state to close it.
    // However, Shadcn DropdownMenuItem handles navigation and closing.
  };

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'booking_update': return <User className="h-4 w-4 text-green-500" />;
      case 'contact': return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'dorm_verification': return <Shield className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const navLinks = [
    { path: "/", label: t("nav.home") },
    { path: "/about", label: t("nav.about") },
    { path: "/contact", label: t("nav.contact") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b glass transition-all duration-300">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={dormlinkLogo} alt="DormLink" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline">DORMLINK</span>
        </Link>

        {/* Search */}
        <div className={cn(
          "hidden md:flex relative flex-1 max-w-sm transition-all duration-300",
          showNavbarSearch ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}>
          <button 
            onClick={() => {
              if (searchQuery.trim()) {
                navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
                setSearchQuery("");
              }
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 hover:text-primary transition-colors z-10"
          >
            <Search className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </button>
          <input
            type="text"
            placeholder={t("nav.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full rounded-full border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(link.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Actions (Always visible or partially visible) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language & Theme - Desktop Only */}
          <div className="hidden md:flex items-center gap-1 border-r pr-2 mr-1 rtl:border-r-0 rtl:pr-0 rtl:mr-0 rtl:border-l rtl:pl-2 rtl:ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                  <Globe className="h-4 w-4" />
                  <span className="hidden lg:inline">{currentLang}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ar")}>العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Core Icons - Mobile & Desktop */}
          {isLoggedIn && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <DropdownMenu onOpenChange={(open) => open && handleOpenNotifications()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2">
                  <div className="flex items-center justify-between px-2 py-2">
                    <DropdownMenuLabel className="p-0 font-bold">{i18n.language === "ar" ? "الإشعارات" : "Notifications"}</DropdownMenuLabel>
                    {unreadNotifications.length > 0 && <Badge variant="secondary" className="text-[10px]">{unreadNotifications.length} New</Badge>}
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  <div className="max-h-[350px] overflow-y-auto space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        {i18n.language === "ar" ? "لا توجد إشعارات" : "No notifications"}
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n: any) => (
                        <DropdownMenuItem 
                          key={n.id} 
                          className={cn(
                            "p-3 cursor-pointer flex items-start gap-3 rounded-lg transition-colors focus:bg-muted",
                            !n.is_read && "bg-muted/30"
                          )}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="mt-1 shrink-0 p-2 rounded-full bg-background border shadow-sm">
                            {getNotificationIcon(n.notification_type)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className={cn("text-sm leading-tight", !n.is_read && "font-semibold")}>{n.message}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/messages">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <MessageCircle className="h-4 w-4" />
                  {allMessages?.some((m: any) => !m.is_read) && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </Button>
              </Link>
            </div>
          )}

          <Link to={isLoggedIn ? "/profile" : "/sign-in"}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
            </Button>
          </Link>

          {/* Auth Button - Desktop Only */}
          <div className="hidden md:block">
            {isLoggedIn ? (
              <Button size="sm" variant="outline" className="rounded-full px-5 gap-2" onClick={() => { logout(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
                {t("nav.logOut")}
              </Button>
            ) : (
              <Link to="/sign-in">
                <Button size="sm" className="rounded-full px-5">
                  {t("nav.signUp")}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("nav.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full rounded-full border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 text-sm font-medium rounded-md",
                isActive(link.path) ? "text-primary bg-primary/5" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={() => changeLanguage(i18n.language === "en" ? "ar" : "en")}>
              <Globe className="h-4 w-4 mr-1" /> {currentLang}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          {isLoggedIn ? (
            <Button variant="outline" className="w-full rounded-full gap-2" onClick={() => { logout(); setMobileOpen(false); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
              {t("nav.logOut")}
            </Button>
          ) : (
            <Link to="/sign-in" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-full">{t("nav.signUp")}</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
