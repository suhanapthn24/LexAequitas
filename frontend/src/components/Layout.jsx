import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Scale, Gavel, FileText, LayoutDashboard, Siren, Menu, User, LogOut } from "lucide-react";
import { useState } from "react";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Home", icon: Scale },
    { path: "/services", label: "Services", icon: Gavel },
    { path: "/simulation", label: "Trial Simulation", icon: Gavel, protected: true },
    { path: "/cases", label: "Cases", icon: LayoutDashboard, protected: true },
    { path: "/documents", label: "Documents", icon: FileText, protected: true },
    { path: "/alerts", label: "Alerts", icon: Siren, protected: true },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredLinks = navLinks.filter(link => !link.protected || user);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
              <Scale className="w-8 h-8 text-[#D4AF37] transition-transform group-hover:rotate-12" />
              <span className="font-serif text-xl font-bold text-white tracking-tight">
                Lex<span className="text-[#D4AF37]">Aequitas</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-all flex items-center gap-2 ${
                      isActive
                        ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-[#D4AF37]/30 text-white hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]"
                      data-testid="user-menu-trigger"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {user.full_name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0F172A] border-[#D4AF37]/20">
                    <DropdownMenuItem className="text-slate-300">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#D4AF37]/20" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 cursor-pointer"
                      data-testid="logout-btn"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button
                    className="bg-[#0F172A] text-white border-b-2 border-[#D4AF37] hover:bg-[#1E293B] rounded-none uppercase tracking-wide text-xs font-bold"
                    data-testid="login-btn"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0F172A] border-t border-[#D4AF37]/20">
            <div className="px-4 py-3 space-y-2">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded"
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-white/5 rounded w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-[#D4AF37] hover:bg-white/5 rounded"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-[#D4AF37]/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-[#D4AF37]" />
                <span className="font-serif text-lg font-bold text-white">LexAequitas</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered legal technology platform for modern law practices.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Services</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/simulation" className="hover:text-[#D4AF37]">Trial Simulation</Link></li>
                <li><Link to="/cases" className="hover:text-[#D4AF37]">Case Management</Link></li>
                <li><Link to="/documents" className="hover:text-[#D4AF37]">Document Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/alerts" className="hover:text-[#D4AF37]">Compliance Alerts</Link></li>
                <li><Link to="/services" className="hover:text-[#D4AF37]">All Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase text-sm tracking-wide">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-[#D4AF37] cursor-pointer">Privacy Policy</li>
                <li className="hover:text-[#D4AF37] cursor-pointer">Terms of Service</li>
                <li className="hover:text-[#D4AF37] cursor-pointer">Contact</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © 2024 LexAequitas. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
