"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Check } from "lucide-react";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_admin_email");
    if (savedEmail) {
      setValue("email", savedEmail);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await api.post("/auth/login", data);
      
      if (response.data.success) {
        if (response.data?.data?.user?.role !== "ADMIN") {
          setError("Access denied. Admin only.");
          return;
        }

        if (rememberMe) {
          localStorage.setItem("saved_admin_email", data.email);
        } else {
          localStorage.removeItem("saved_admin_email");
        }

        setTokens(response.data.data.accessToken, response.data.data.refreshToken);
        router.push('/');
        router.refresh();
      } else {
        setError(response.data?.message || "Something went wrong during login");
      }
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>;
      setError(apiError.response?.data?.message || "Something went wrong during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1616394584738-1d446fa64005?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark luxury overlay */}
      <div className="absolute inset-0 bg-brandDark/60 backdrop-blur-sm z-0"></div>

      <div className="z-10 sm:mx-auto sm:w-full sm:max-w-md w-full px-4">
        
        {/* Glass Card Container */}
        <div className="glass-panel py-10 px-6 shadow-luxury sm:rounded-2xl sm:px-12 transition-all duration-300">
          
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="mb-2">
              <img 
                src="/assets/logo.svg" 
                alt="SculptnShine Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-brandDark-lighter tracking-wider uppercase">
              Admin Portal Login
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center shadow-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-brandDark-soft mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-gold-600/70" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  className="focus:ring-gold-500 focus:border-gold-500 block w-full pl-11 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white/60 backdrop-blur-md transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-inner"
                  placeholder="admin@sculptnshine.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brandDark-soft mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-gold-600/70" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="focus:ring-gold-500 focus:border-gold-500 block w-full pl-11 pr-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-white/60 backdrop-blur-md transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-inner"
                  placeholder="Enter your admin password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gold-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me Checkbox & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-500 transition-colors"
                />
                <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => alert("Please contact Super Admin to reset your password.")}
                className="text-xs font-semibold text-gold-600 hover:text-gold-700 hover:underline transition-all"
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold tracking-wider text-white bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed uppercase"
              >
                {isLoading ? "Authenticating..." : "Sign In to Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl z-0"></div>
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-cream-100/10 rounded-full blur-3xl z-0"></div>
    </div>
  );
}
