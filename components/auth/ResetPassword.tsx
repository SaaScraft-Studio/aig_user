"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import {
  Loader2,
  Lock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[@$!%*?&#]/, {
        message: "Password must contain at least one special character",
      }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Real-time validation feedback
  const handleInputChange = (field: keyof ResetPasswordForm) => {
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error("Missing or invalid reset token");
      return;
    }

    try {
      setLoading(true);
      setSubmitStatus("idle");

      // ❌ Current (query parameter) - doesn't match your backend
      // const res = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/reset-password?token=${token}`,

      // ✅ Fixed (URL parameter) - matches your backend route
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: data.password,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        setSubmitStatus("error");
        toast.error(result.message || "Failed to reset password");
        return;
      }

      setSubmitStatus("success");
      toast.success(result.message || "Password reset successfully!");

      setTimeout(() => {
        reset();
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setSubmitStatus("error");
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSubmitStatus("idle");
    reset();
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password">
            <Button className="bg-[#00509E] hover:bg-[#003B73] text-white">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-[#00509E] hover:text-[#003B73] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-[#00509E]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Create a new password for your account
              </p>
            </div>

            {/* Success/Error States */}
            {submitStatus === "success" ? (
              <div className="text-center space-y-6 py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-green-600">
                    Redirecting you to login page...
                  </p>
                </div>
              </div>
            ) : submitStatus === "error" ? (
              <div className="text-center space-y-6 py-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-red-700 mb-2">
                    Reset Failed
                  </h3>
                  <p className="text-red-600 mb-4">
                    Unable to reset password. The link may have expired.
                  </p>
                  <Button
                    onClick={handleRetry}
                    className="bg-[#00509E] hover:bg-[#003B73] text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...register("password")}
                      onChange={(e) => {
                        register("password").onChange(e);
                        handleInputChange("password");
                      }}
                      className={cn(
                        "pl-10 pr-10 border-2 focus:border-[#00509E] focus:ring-[#00509E] transition-colors",
                        errors.password ? "border-red-500" : "border-gray-300",
                      )}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...register("confirmPassword")}
                      onChange={(e) => {
                        register("confirmPassword").onChange(e);
                        handleInputChange("confirmPassword");
                      }}
                      className={cn(
                        "pl-10 pr-10 border-2 focus:border-[#00509E] focus:ring-[#00509E] transition-colors",
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300",
                      )}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00509E] to-[#003B73] hover:from-[#003B73] hover:to-[#00274D] text-white font-semibold py-3 text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {/* Additional Help */}
            {submitStatus === "idle" && (
              <div className="mt-6 text-center">
                <p className="text-lg text-gray-600">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="text-[#00509E] font-semibold hover:underline"
                  >
                    Back to Login
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
