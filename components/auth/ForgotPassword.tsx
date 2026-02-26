"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      // ❌ Wrong endpoint
      // const res = await fetch("/api/auth/forgot-password", {

      // ✅ Correct endpoint - matches your backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong"); // ✅ Use backend error message
      }

      setStatus("success");
      toast.success(data.message || "Password reset link sent successfully!"); // ✅ Use backend success message
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setErrors({});
  };

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
                <Mail className="w-8 h-8 text-[#00509E]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Enter your email address and we'll send you a link to reset your
                password
              </p>
            </div>

            {/* Success State */}
            {status === "success" ? (
              <div className="text-center space-y-6 py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-green-700">
                    Check Your Email!
                  </h3>
                  <p className="text-green-600 text-sm">
                    We've sent a password reset link to
                    <br />
                    <strong>{email}</strong>
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-[#00509E] text-[#00509E] hover:bg-[#00509E] hover:text-white"
                  >
                    Send to another email
                  </Button>
                  <Link href="/login" className="block w-full">
                    <Button className="w-full bg-[#00509E] hover:bg-[#003B73] text-white">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : status === "error" ? (
              <div className="text-center space-y-6 py-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-red-700">
                    Something went wrong
                  </h3>
                  <p className="text-red-600 text-sm">
                    We couldn't send the reset link. Please try again.
                  </p>
                </div>
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#00509E] hover:bg-[#003B73] text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={cn(
                      "border-2 focus:border-[#00509E] focus:ring-[#00509E] transition-colors",
                      errors.email ? "border-red-500" : "border-gray-300",
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00509E] to-[#003B73] hover:from-[#003B73] hover:to-[#00274D] text-white font-semibold py-3 text-lg rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}

            {/* Additional Help */}
            {status === "idle" && (
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

        {/* Mobile Optimized Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Can't find the email? Check your spam folder or{" "}
            <button
              onClick={handleRetry}
              className="text-[#00509E] hover:underline font-medium"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
