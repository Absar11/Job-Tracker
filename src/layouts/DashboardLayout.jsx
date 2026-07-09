import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice.js";
import { useToast } from "../components/Toast.jsx";
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const DashboardLayout = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast("Logged out successfully.", "info");
    navigate("/login");
  };

  // Sidebar Links config
  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["User", "Admin"],
    },
    {
      name: "Jobs List",
      path: "/jobs",
      icon: Briefcase,
      roles: ["User", "Admin"],
    },
    {
      name: "Create Job",
      path: "/jobs/new",
      icon: PlusCircle,
      roles: ["User", "Admin"],
    },
    {
      name: "User Profile",
      path: "/profile",
      icon: User,
      roles: ["User", "Admin"],
    },
  ];



  const activeLink = navLinks.find((link) => location.pathname === link.path);
  const activeTitle = activeLink ? activeLink.name : "Job Tracker Pro";

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200/80" id="sidebar-content">
      {/* Sidebar Header Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-150">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-blue-500/20">
          J
        </div>
        <div>
          <span className="font-bold text-base leading-tight tracking-tight block text-slate-800">
            Tracker Pro
          </span>
          <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">
            Career Pipeline
          </span>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-4 border-b border-slate-100 mx-3 my-4 rounded-xl bg-slate-50/80 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 uppercase overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (user?.name || "U").charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-800 truncate">{user?.name || "Welcome Guest"}</h4>
            <p className="text-[10px] text-slate-500 truncate italic">Pro Member</p>
          </div>
        </div>

      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 space-y-1 py-2">
        {navLinks.map((link) => {
          const IconComponent = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-50 text-blue-700 shadow-none border-none"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
          Logout User
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" id="dashboard-layout-root">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 shadow-sm z-30">
        {renderSidebarContent()}
      </aside>

      {/* Main Core View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-8 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar"
              id="hamburger-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-850 tracking-tight">{activeTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* <span className="hidden md:inline text-xs text-slate-400 font-medium">
              SaaS Session: Active
            </span> */}
            <div className="w-px h-6 bg-slate-205 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user?.name}
              </span>
              <Link to="/profile">
                <div className="w-8 h-8 rounded-full bg-blue-105 border border-slate-200 shadow-sm flex items-center justify-center text-xs font-bold text-slate-700 uppercase hover:ring-2 hover:ring-blue-100 transition-all overflow-hidden cursor-pointer">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (user?.name || "U").charAt(0)
                  )}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Dynamic Mobile Sliding Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backing Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black z-40 lg:hidden"
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 lg:hidden shadow-2xl h-full"
              >
                {/* Close Button inside drawer */}
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
                {renderSidebarContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Inner Page Grid Canvas */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
