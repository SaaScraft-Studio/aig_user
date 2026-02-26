"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Real-time validation feedback
  const handleInputChange = (field: keyof FormData) => {
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include", // ✅ Important for cookies (refresh token)
        },
      );

      const result = await res.json(); // ✅ Parse response JSON

      if (res.ok) {
        // ✅ Store access token in localStorage/sessionStorage
        localStorage.setItem("accessToken", result.accessToken);
        // ✅ You might also want to store user data
        localStorage.setItem("user", JSON.stringify(result.user));

        setSubmitStatus("success");
        // toast.success(
        //   result.message || "Login successful! Redirecting to dashboard..."
        // );

        // Redirect after a short delay to show success state
        // setTimeout(() => {
        // }, 1500);
        router.push("/dashboard");
      } else {
        setSubmitStatus("error");
        // ✅ Use backend error message instead of generic one
        toast.error(
          result.message || "Invalid email or password. Please try again.",
        );
      }
    } catch (error) {
      setSubmitStatus("error");
      toast.error("Login failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setSubmitStatus("idle");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-6xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-[#00509E] hover:text-[#003B73] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 rounded-2xl shadow-xl border-0 overflow-hidden bg-white">
          {/* Left Form Section */}
          <div className="w-full">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4 p-6 sm:p-8 md:p-10"
            >
              {/* Header */}
              <div className="text-center mb-6">
                {/* <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="w-8 h-8 text-[#00509E]" />
                </div> */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Sign In
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Success/Error States */}
              {submitStatus === "success" ? (
                <div className="text-center space-y-6 py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">
                      Login Successful!
                    </h3>
                    <p className="text-green-600">
                      Redirecting you to dashboard...
                    </p>
                  </div>
                </div>
              ) : submitStatus === "error" ? (
                <div className="text-center space-y-6 py-4">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-red-700 mb-2">
                      Login Failed
                    </h3>
                    <p className="text-red-600 mb-4">
                      Invalid email or password. Please try again.
                    </p>
                    <Button
                      onClick={handleRetry}
                      className="bg-[#00509E] hover:bg-[#003B73] text-white px-8"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        {...register("email")}
                        onChange={(e) => {
                          register("email").onChange(e);
                          handleInputChange("email");
                        }}
                        className={cn(
                          "pl-10 border-2 focus:border-[#00509E] focus:ring-[#00509E] transition-colors",
                          errors.email ? "border-red-500" : "border-gray-300",
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password")}
                        onChange={(e) => {
                          register("password").onChange(e);
                          handleInputChange("password");
                        }}
                        className={cn(
                          "pl-10 pr-10 border-2 focus:border-[#00509E] focus:ring-[#00509E] transition-colors",
                          errors.password
                            ? "border-red-500"
                            : "border-gray-300",
                        )}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end -mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#00509E] hover:text-[#003B73] font-medium hover:underline transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#00509E] to-[#003B73] hover:from-[#003B73] hover:to-[#00274D] text-white font-semibold py-3 text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Sign Up Link */}
              <p className="text-center text-lg text-gray-600 mt-6">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[#00509E] font-semibold hover:underline"
                >
                  Create account now
                </Link>
              </p>
            </form>
          </div>

          {/* Right Image Section - Hidden on mobile, shown on lg screens */}
          <div className="hidden lg:block relative">
            <Image
              src="https://aig-academics.s3.ap-southeast-1.amazonaws.com/aig-user-login.jpeg"
              alt="Login to your account"
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />

            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center text-white space-y-6 max-w-md">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                  <LogIn className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Welcome Back!</h2>
                <p className="text-white/90 text-lg leading-relaxed">
                  We're glad to see you again. Access your personalized
                  dashboard and continue your journey with us.
                </p>
                <div className="space-y-3 text-sm text-white/80">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Secure & Encrypted Login</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>24/7 Account Access</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Instant Dashboard Access</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
