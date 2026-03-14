import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Scale, Mail, Lock, User, Building, Loader2, ArrowRight } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register form
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    firmName: ""
  });

  // Redirect if already logged in
  if (user) {
    navigate("/cases");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success("Welcome back!");
      navigate("/cases");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.fullName) {
      toast.error("Please fill in required fields");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(
        registerData.email,
        registerData.password,
        registerData.fullName,
        registerData.firmName
      );
      toast.success("Account created successfully!");
      navigate("/cases");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 border border-[#D4AF37]/30 flex items-center justify-center">
            <Scale className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">
            Lex<span className="text-[#D4AF37]">Aequitas</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Legal Technology Platform</p>
        </div>

        <Card className="bg-[#020617] border-slate-800 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 mb-6">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0F172A]"
                data-testid="login-tab"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0F172A]"
                data-testid="register-tab"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      placeholder="you@lawfirm.com"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="login-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      placeholder="••••••••"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="login-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold py-4"
                  data-testid="login-submit"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                      placeholder="John Smith"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="register-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      placeholder="you@lawfirm.com"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="register-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Law Firm (Optional)</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={registerData.firmName}
                      onChange={(e) => setRegisterData({...registerData, firmName: e.target.value})}
                      placeholder="Smith & Associates"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="register-firm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      placeholder="••••••••"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="register-password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className="pl-10 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                      data-testid="register-confirm-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold py-4"
                  data-testid="register-submit"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
