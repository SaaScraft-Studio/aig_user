"use client";

import { useEffect, useState } from "react";
import MyProfileForm from "@/components/dashboard/MyProfileForm";
import { Profile } from "@/app/data/profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            throw new Error("Session expired. Please login again.");
          }
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }

        const data = await res.json();

        setProfile({
          photo: data.profilePicture || data.photo || "/authImg/user.png",
          fullName: data.fullname || data.name || "",
          prefix: data.prefix || "",
          designation: data.designation || "",
          affiliation: data.affiliation || "",
          phone: data.mobile || data.phone || "",
          email: data.email || "",
          country: data.country || "",
          gender: data.gender || "",
          city: data.city || "",
          state: data.state || "",
          mealPreference: data.mealPreference || "",
          pincode: data.pincode || "",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error loading profile";
        setError(errorMessage);
        toast.error(errorMessage);

        if (
          errorMessage.includes("Session expired") ||
          errorMessage.includes("No authentication token")
        ) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center space-y-4 p-6">
        {/* <Loader2 className="w-12 h-12 animate-spin text-[#00509E]" /> */}
        <Loading />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Profile
          </h3>
          <p className="text-gray-600 max-w-md">
            We're fetching your profile information. This will just take a
            moment.
          </p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Profile
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Profile Not Found
            </h3>
            <p className="text-yellow-700 mb-1">No profile data found.</p>
            <p className="text-yellow-600 text-sm">
              Please complete your profile setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        {/* <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            My Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your personal information, professional details, and
            preferences in one place
          </p>
        </div> */}

        {/* Profile Form Card */}
        <div className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <MyProfileForm
            initialData={profile}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your information is securely stored and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
