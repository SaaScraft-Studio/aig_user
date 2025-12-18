"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Loader2, MapPin, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/app/store/useUserStore";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useEventStore } from "@/app/store/useEventStore";
import { formatEventDate } from "@/app/utils/formatEventDate";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  const router = useRouter();
  const { photo, fullName, email, setUser, clearUser } = useUserStore();
  const { currentEvent, fetchEventById, loading, clearCurrentEvent } =
    useEventStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const eventIdFromUrl = searchParams.get("eventId");

  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [lastFetchedEventId, setLastFetchedEventId] = useState<string | null>(
    null
  );

  // Check if we're on a registration-related page
  const isRegistrationPage = pathname?.startsWith("/registration");
  const isPaymentSuccessPage = pathname === "/registration/payment/success";

  // Only show event info on registration pages (including payment success)
  const showEventInfo = isRegistrationPage && currentEvent;

  // Function to fetch event from registration data
  const fetchEventFromRegistration = useCallback(
    async (regId: string) => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/${regId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.eventId?._id) {
            // Fetch the event using its ID
            await fetchEventById(data.data.eventId._id);
            return data.data.eventId._id;
          }
        }
        return null;
      } catch (error) {
        console.error("Error fetching registration:", error);
        return null;
      }
    },
    [fetchEventById]
  );

  // Optimized event fetching with multiple sources
  useEffect(() => {
    const loadEventData = async () => {
      if (!isRegistrationPage) {
        // Clear event when not on registration pages
        clearCurrentEvent();
        setLastFetchedEventId(null);
        return;
      }

      let targetEventId: string | null = null;

      // Scenario 1: Event ID directly in URL (standard registration pages)
      if (eventIdFromUrl) {
        targetEventId = eventIdFromUrl;
      }
      // Scenario 2: Payment success page - get event from registration
      else if (isPaymentSuccessPage && registrationId) {
        targetEventId = await fetchEventFromRegistration(registrationId);
      }
      // Scenario 3: Badge page - extract eventId from URL path
      else if (pathname?.includes("/badge/")) {
        const parts = pathname.split("/");
        const badgeEventId = parts[parts.length - 1];
        if (badgeEventId && badgeEventId !== "badge") {
          targetEventId = badgeEventId;
        }
      }

      // Fetch event if we have an ID and it's different from last fetched
      if (targetEventId && targetEventId !== lastFetchedEventId) {
        try {
          await fetchEventById(targetEventId);
          setLastFetchedEventId(targetEventId);
        } catch (error) {
          console.error("Error fetching event data:", error);
        }
      }
    };

    loadEventData();
  }, [
    pathname,
    eventIdFromUrl,
    registrationId,
    isPaymentSuccessPage,
    isRegistrationPage,
    lastFetchedEventId,
    fetchEventById,
    clearCurrentEvent,
    fetchEventFromRegistration,
  ]);

  // ... rest of the component (profile fetching, logout, etc.) remains the same
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

  // Format venue address
  const getVenueAddress = () => {
    if (!currentEvent?.venueName) return "Venue TBA";

    const venue = currentEvent.venueName;

    if (typeof venue === "string") {
      return venue;
    }

    const parts = [];
    if (venue.venueName) parts.push(venue.venueName);
    if (venue.venueAddress) parts.push(venue.venueAddress);
    if (venue.city) parts.push(venue.city);
    if (venue.state) parts.push(venue.state);

    return parts.length > 0 ? parts.join(", ") : "Venue TBA";
  };

  // Handle profile fetching (keep existing logic)
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

      localStorage.removeItem("accessToken");
      clearUser();
      useEventStore.getState().clearCurrentEvent();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
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
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading event...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <h1 className="text-base lg:text-lg font-semibold leading-tight line-clamp-1">
                  {currentEvent?.eventName}
                </h1>

                {/* Event details row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs lg:text-sm text-gray-200">
                  {/* Date */}
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {currentEvent &&
                        formatEventDate(
                          currentEvent.startDate,
                          currentEvent.endDate
                        )}
                    </span>
                  </div>

                  {/* Time */}
                  {/* {currentEvent?.startTime && (
                    <>
                      <span className="text-white/30">•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {currentEvent.startTime} - {currentEvent.endTime}
                        </span>
                      </div>
                    </>
                  )} */}

                  {/* Venue */}
                  <span className="text-white/30">•</span>
                  <div className="flex items-center gap-1.5 truncate max-w-[200px] lg:max-w-[400px]">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate" title={getVenueAddress()}>
                      {getVenueAddress()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-4">
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
