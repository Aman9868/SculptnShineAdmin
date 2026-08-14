"use client";

import { useEffect, useState } from "react";
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
  Star
} from "lucide-react";
import { removeTokens, getToken } from "@/lib/auth";
import { api } from "@/lib/api";

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
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Shipping", href: "/shipping", icon: Package },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);

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
    <div className="h-screen overflow-hidden bg-[#FAFAFA] flex">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/80 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 flex flex-col lg:static lg:flex ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-200 relative ${isCollapsed ? 'px-0 justify-center' : 'px-6'}`}>
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
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                                      isSubActive ? "bg-gold-50 text-gold-700 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
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
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-100 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">

            {/* Global Search */}
            <div className="flex-1 max-w-md hidden sm:block relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="block w-full rounded-xl border-0 py-2 pl-10 pr-12 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gold-500 sm:text-sm sm:leading-6 bg-gray-50"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-[10px] text-gray-400">Ctrl + K</kbd>
              </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">

              {/* Notification Bell */}
              <button type="button" className="relative -m-2.5 p-2.5 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-full border border-gray-200 transition-colors">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

              {/* Top Right Profile */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-x-3 p-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-brandDark text-white font-bold text-sm shadow-sm overflow-hidden">
                      {user.profileImage ? (
                        <img src={`http://localhost:5000${user.profileImage}`} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        user.firstName?.charAt(0) || "A"
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-bold text-brandDark leading-tight">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-gray-500 leading-tight">
                        Super Admin
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 ml-1 hidden sm:block" />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-100 py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brandDark font-medium transition-colors"
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
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
    </div>
  );
}
