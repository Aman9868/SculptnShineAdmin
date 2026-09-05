"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Package,
  Boxes,
  Grid,
  Tag,
  Image as ImageIcon,
  BookOpen,
  Search,
  Bell,
  Trophy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Headset,
  Star,
  TicketPercent,
  Sun,
  Moon
} from "lucide-react";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import MaintenanceAlertBanner from "@/components/common/MaintenanceAlertBanner";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { removeTokens, getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const sidebarNavigation = [
  {
    section: "MAIN",
    links: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    section: "MANAGEMENT",
    links: [
      { name: "User Management", href: "/users", icon: Users },
      { name: "Product Category", href: "/product-category", icon: Grid },
      { name: "Brands Management", href: "/brands", icon: Tag },
      { name: "Product Management", href: "/products", icon: Package },
      { name: "Coupons & Vouchers", href: "/coupons", icon: TicketPercent },
      { name: "Orders Management", href: "/orders", icon: LayoutDashboard },
      { 
        name: "Support & Complaints", 
        icon: Headset,
        subLinks: [
          { name: "Support Tickets", href: "/support" },
          { name: "Support Contact Info", href: "/support/contact-info" }
        ]
      },
      { name: "Ratings & Reviews", href: "/reviews", icon: Star },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    section: "CONTENT",
    links: [
      { name: "Guides", href: "/guides", icon: BookOpen },
      { name: "Banners", href: "/banners", icon: ImageIcon },
      { name: "Tutorials", href: "/tutorials", icon: BookOpen },
      { name: "Policies", href: "/policies", icon: BookOpen },
    ],
  },
  {
    section: "SETTINGS",
    links: [
      { 
        name: "Settings", 
        icon: Settings,
        subLinks: [
          { name: "Resource Usage", href: "/resource-usage" },
          { name: "Shipping", href: "/shipping" },
          { name: "WhatsApp Engine", href: "/whatsapp" },
          { name: "Email Engine", href: "/email-engine" },
          { name: "Journal Logs", href: "/journal-logs" }
        ]
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    if (getToken()) {
      fetchUser();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { userId: 'current' }).catch(() => { });
    } catch (e) {
      console.error(e);
    } finally {
      removeTokens();
      router.push('/login');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#0B0F19] flex text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/80 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 flex flex-col lg:static lg:flex ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-800 relative ${isCollapsed ? 'px-0 justify-center' : 'px-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <img
                src="/assets/logo.svg"
                alt="SculptnShine Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          )}

          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button
              className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col mt-4 px-4 overflow-y-auto overflow-x-hidden no-scrollbar pb-6 relative">
          
          {/* Desktop Collapse Button - Moved above nav items */}
          <div className={`hidden lg:flex mb-6 ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 shadow-sm"
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <ul role="list" className="flex flex-1 flex-col gap-y-6">

            {/* Main Section */}
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {sidebarNavigation.filter((n: any) => n.section === "MAIN")[0]?.links.map((item: any) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.name : undefined}
                        className={`group flex items-center rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                          isCollapsed ? "justify-center p-3" : "gap-x-3 p-3"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Management Section */}
            <li>
              {!isCollapsed ? (
                <div className="text-xs font-bold leading-6 text-gray-400 tracking-wider mb-2 mt-4">MANAGEMENT</div>
              ) : (
                <div className="h-px bg-gray-200 my-4 mx-2"></div>
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {sidebarNavigation.filter((n: any) => n.section === "MANAGEMENT")[0]?.links.map((item: any) => {
                  const isActive = pathname === item.href || (item.subLinks && item.subLinks.some((sub: any) => pathname.startsWith(sub.href)));
                  const isDropdownOpen = openDropdowns[item.name];

                  if (item.subLinks) {
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => {
                            if (isCollapsed) setIsCollapsed(false);
                            toggleDropdown(item.name);
                          }}
                          className={`w-full group flex items-center justify-between rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                            isCollapsed ? "justify-center p-3" : "gap-x-3 p-2.5"
                          } ${
                            isActive
                              ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon
                              className={`h-5 w-5 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                              }`}
                              aria-hidden="true"
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${isActive ? "text-white" : "text-gray-400"}`} />
                          )}
                        </button>
                        {!isCollapsed && isDropdownOpen && (
                          <ul className="mt-1 space-y-1 pl-10 pr-2">
                            {item.subLinks.map((sub: any) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <li key={sub.name}>
                                  <Link
                                    href={sub.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                      isSubActive ? "bg-gold-50 text-gold-700 dark:bg-gold-950/60 dark:text-gold-300 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-white font-medium"
                                    }`}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.name : undefined}
                        className={`group flex items-center rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                          isCollapsed ? "justify-center p-3" : "gap-x-3 p-2.5"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Content Section */}
            <li>
              {!isCollapsed ? (
                <div className="text-xs font-bold leading-6 text-gray-400 tracking-wider mb-2 mt-4">CONTENT</div>
              ) : (
                <div className="h-px bg-gray-200 my-4 mx-2"></div>
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {sidebarNavigation.filter((n: any) => n.section === "CONTENT")[0]?.links.map((item: any) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.name : undefined}
                        className={`group flex items-center rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                          isCollapsed ? "justify-center p-3" : "gap-x-3 p-2.5"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Settings Section */}
            <li>
              {!isCollapsed ? (
                <div className="text-xs font-bold leading-6 text-gray-400 tracking-wider mb-2 mt-4">SETTINGS</div>
              ) : (
                <div className="h-px bg-gray-200 my-4 mx-2"></div>
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {sidebarNavigation.filter((n: any) => n.section === "SETTINGS")[0]?.links.map((item: any) => {
                  const isActive = pathname === item.href || (item.subLinks && item.subLinks.some((sub: any) => pathname.startsWith(sub.href)));
                  const isDropdownOpen = openDropdowns[item.name];

                  if (item.subLinks) {
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => {
                            if (isCollapsed) setIsCollapsed(false);
                            toggleDropdown(item.name);
                          }}
                          className={`w-full group flex items-center justify-between rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                            isCollapsed ? "justify-center p-3" : "gap-x-3 p-2.5"
                          } ${
                            isActive
                              ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon
                              className={`h-5 w-5 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                              }`}
                              aria-hidden="true"
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${isActive ? "text-white" : "text-gray-400"}`} />
                          )}
                        </button>
                        {!isCollapsed && isDropdownOpen && (
                          <ul className="mt-1 space-y-1 pl-10 pr-2">
                            {item.subLinks.map((sub: any) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <li key={sub.name}>
                                  <Link
                                    href={sub.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                      isSubActive ? "bg-gold-50 text-gold-700 dark:bg-gold-950/60 dark:text-gold-300 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-white font-medium"
                                    }`}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.name : undefined}
                        className={`group flex items-center rounded-xl text-sm leading-6 font-semibold transition-all duration-200 ${
                          isCollapsed ? "justify-center p-3" : "gap-x-3 p-2.5"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-gold-400 to-gold-500 text-white shadow-md shadow-gold-500/20"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/80"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                          aria-hidden="true"
                        />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>

          <div className="mt-8 space-y-4">
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto bg-[#FAFAFA] dark:bg-[#0B0F19]">
        <MaintenanceAlertBanner />
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F172A] px-3 sm:px-6 lg:px-8 transition-colors">
          <button
            type="button"
            className="p-2 text-gray-700 dark:text-gray-300 lg:hidden shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6 justify-between items-center min-w-0">

            {/* Global Search Command Palette Trigger */}
            <div className="flex-1 max-w-[180px] xs:max-w-xs sm:max-w-md">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 hover:bg-gray-100/80 dark:bg-gray-800/80 dark:hover:bg-gray-800 transition-all cursor-pointer shadow-2xs group text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 group-hover:text-gold-500 transition-colors shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors truncate">
                    Search...
                  </span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 font-sans text-[10px] font-bold text-gray-400 dark:text-gray-500 shadow-2xs shrink-0 ml-1">
                  Ctrl + K
                </kbd>
              </button>
            </div>

            {/* Right Action Icons */}
            <div className="ml-auto flex items-center gap-x-1.5 sm:gap-x-3 lg:gap-x-4 shrink-0">

              {/* Quick Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-xl text-gray-500 hover:text-gold-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gold-400 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400 animate-in spin-in-180 duration-300" />
                ) : (
                  <Moon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-600 animate-in spin-in-180 duration-300" />
                )}
              </button>

              {/* Notification Dropdown */}
              <NotificationDropdown />

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

              {/* Top Right Profile */}
              {user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-x-3 p-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-brandDark dark:bg-gold-500 text-white dark:text-gray-950 font-bold text-sm shadow-sm overflow-hidden">
                      {user.profileImage ? (
                        <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        user.firstName?.charAt(0) || "A"
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-bold text-brandDark dark:text-gray-100 leading-tight">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        Super Admin
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 ml-1 hidden sm:block" />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#1E293B] shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-gray-100 dark:border-gray-700 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 font-medium transition-colors"
                      >
                        My Profile & Preferences
                      </Link>

                      {/* Theme Toggle in Dropdown */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTheme();
                        }}
                        className="px-4 py-2.5 flex items-center justify-between border-t border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isDark ? <Moon className="h-4 w-4 text-amber-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Dark Theme</span>
                        </div>
                        <div
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            isDark ? 'bg-gold-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>

                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 py-10 overflow-y-auto min-h-0">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
}
