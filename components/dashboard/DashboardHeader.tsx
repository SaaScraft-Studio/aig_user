"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/app/store/useUserStore";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useEventStore } from "@/app/store/useEventStore";
import { formatEventDate } from "@/app/utils/formatEventDate";

export function DashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const router = useRouter();
  const { photo, fullName, email, setUser, clearUser } = useUserStore();
  const { currentEvent, setCurrentEvent } = useEventStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");

  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(false);

  // Only show event info on registration routes when eventId is present
  const showEventInfo = pathname?.startsWith("/registration") && currentEvent;

  // ✅ Fetch event data when on registration page and eventId is in URL
  useEffect(() => {
    async function fetchEventData() {
      if (pathname?.startsWith("/registration") && eventIdFromUrl) {
        try {
          setLoadingEvent(true);
          const token = localStorage.getItem("accessToken");

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventIdFromUrl}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCurrentEvent(data.data);
            }
          }
        } catch (error) {
          console.error("Error fetching event data:", error);
        } finally {
          setLoadingEvent(false);
        }
      }
    }

    fetchEventData();
  }, [pathname, eventIdFromUrl, setCurrentEvent]);

  // ✅ Fetch latest user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
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
            clearUser();
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user profile");
        }

        const data = await res.json();

        // Update user store with profile data
        setUser({
          id: data._id,
          email: data.email || "",
          fullName: data.fullname || data.name || "User",
          photo: data.profilePicture || "/authImg/user.png",
          prefix: data.prefix || "",
          designation: data.designation || "",
          affiliation: data.affiliation || "",
          medicalCouncilState: data.medicalCouncilState || "",
          medicalCouncilRegistration: data.medicalCouncilRegistration || "",
          phone: data.mobile || data.phone || "",
          country: data.country || "",
          gender: data.gender || "",
          city: data.city || "",
          state: data.state || "",
          mealPreference: data.mealPreference || "",
          pincode: data.pincode || "",
          isAuthenticated: true,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [router, setUser, clearUser]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Call backend logout endpoint
      if (token) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            }
          );
        } catch (error) {
          console.log("Backend logout optional - frontend cleared");
        }
      }

      // Clear client-side storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Clear user store
      clearUser();

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-gradient-to-r from-[#000d4e] to-[#005aa7] shadow-lg sticky top-0 z-50">
      {/* Left: Logo + Event Info + Hamburger */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onMenuToggle}
          className="lg:hidden text-white hover:bg-white/20 focus:outline-none cursor-pointer p-2 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </Button>
        <Link href="/" className="flex items-center">
          <Image
            src="/headerImg/logo.png"
            alt="AIG Hospitals Logo"
            width={120}
            height={40}
            className="object-contain cursor-pointer"
            priority
          />
        </Link>
        {/* Event Info */}
        {showEventInfo && (
          <div className="hidden md:flex flex-col justify-center text-white ml-4 lg:ml-6 border-l border-white/30 pl-4 lg:pl-6">
            {loadingEvent ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading event...</span>
              </div>
            ) : (
              <>
                <h1 className="text-base lg:text-lg font-semibold leading-tight line-clamp-1">
                  {currentEvent?.eventName}
                </h1>

                {/* Single Line: Date | Address */}
                <div className="flex items-center flex-wrap gap-x-2 text-xs lg:text-sm text-gray-200 mt-0.5">
                  <span className="flex-shrink-0">
                    {currentEvent &&
                      formatEventDate(
                        currentEvent.startDate,
                        currentEvent.endDate
                      )}
                  </span>

                  <span className="text-white/50">|</span>

                  <span className="flex items-center gap-1.5 flex-shrink-0 truncate max-w-[180px] sm:max-w-[220px] lg:max-w-[700px]">
                    <MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {/* {typeof currentEvent?.venueName === "string"
                        ? currentEvent.venueName
                        : currentEvent?.venueName?.venueName || "Venue TBA"} */}

                      {/* Show venueAddress if it exists */}
                      {typeof currentEvent?.venueName === "object" &&
                        currentEvent?.venueName?.venueAddress &&
                        `${currentEvent.venueName.venueAddress}`}

                      {/* Show city if it exists (from venueName object) */}
                      {/* {typeof currentEvent?.venueName === "object" &&
                        currentEvent?.venueName?.city &&
                        ` • ${currentEvent.venueName.city}`} */}

                      {/* Show state if it exists (from venueName object) */}
                      {/* {typeof currentEvent?.venueName === "object" &&
                        currentEvent?.venueName?.state &&
                        `${currentEvent?.venueName?.city ? ", " : " • "}${
                          currentEvent.venueName.state
                        }`} */}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-4">
        {/* User Profile with Name */}
        {/* <div className="hidden md:flex flex-col items-end text-white">
          <span className="text-sm font-semibold leading-tight">
            {loadingProfile ? "Loading..." : fullName || "Welcome"}
          </span>
          <span className="text-xs text-gray-200 opacity-80">
            {loadingProfile ? "" : email || "User"}
          </span>
        </div> */}

        {/* Avatar */}
        <Link href="/dashboard/profile" className="cursor-pointer">
          <Avatar className="border-2 border-white/80 w-10 h-10 cursor-pointer hover:border-white transition-colors">
            <AvatarImage
              src={photo || "/authImg/user.png"}
              alt={fullName || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          disabled={loggingOut}
          className="border border-white text-white bg-transparent hover:bg-white hover:text-[#005aa7] px-4 py-2 cursor-pointer transition-all duration-200 font-medium"
        >
          {loggingOut ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out...
            </div>
          ) : (
            "Logout"
          )}
        </Button>
      </div>
    </header>
  );
}
