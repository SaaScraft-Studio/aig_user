"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CalendarDays, MapPin } from "lucide-react";
import { useEventStore } from "@/app/store/useEventStore";
import { formatEventDate } from "@/app/utils/formatEventDate";
// import { useSession } from "next-auth/react";
import { useUserRegistrationsStore } from "@/app/store/useRegistrationStore";
import { Badge } from "@/components/ui/badge";
import SkeletonCard from "../common/SkeletonCard";
import { useUserStore } from "@/app/store/useUserStore";

export default function BrowseByDepartment() {
  const { events, fetchEvents } = useEventStore();
  const { registrations, fetchRegistrations } = useUserRegistrationsStore();
  const router = useRouter();
  const { isAuthenticated } = useUserStore();

  const [selectedDept, setSelectedDept] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "">("");
  // const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await fetchEvents();
      if (isAuthenticated) {
        await fetchRegistrations();
      }
      setLoading(false);
    }
    fetchData();
  }, [fetchEvents, fetchRegistrations, isAuthenticated]);

  const handleRegister = (eventId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Find the event and set it as current before navigation
      const event = events.find((e) => e._id === eventId);
      if (event) {
        useEventStore.getState().setCurrentEvent(event);
      }

      router.push(`/registration/my-registration?eventId=${eventId}`);
    }
  };

  const handleViewBadge = (eventId: string, registrationId: string) => {
    // Find the event and set it as current before navigation
    const event = events.find((e) => e._id === eventId);
    if (event) {
      useEventStore.getState().setCurrentEvent(event);
    }

    router.push(
      `/registration/my-registration/badge/${eventId}?registrationId=${registrationId}`,
    );
  };

  const handleDownloadBrochure = (url: string) => {
    window.open(url, "_blank");
  };

  const isEventPast = (event: any): boolean => {
    if (!event.endDate) return false;
    try {
      const [day, month, year] = event.endDate.split("/");
      const eventEndDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      return eventEndDate < new Date();
    } catch (error) {
      console.error("Error parsing event date:", error);
      return false;
    }
  };

  const filteredEvents = selectedDept
    ? events.filter(
        (event) => event.department?.departmentName === selectedDept,
      )
    : events;

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day).getTime();
    };

    const dateA = parseDate(a.startDate);
    const dateB = parseDate(b.startDate);
    if (sortOrder === "latest") return dateB - dateA;
    if (sortOrder === "oldest") return dateA - dateB;
    return 0;
  });

  if (loading) return <SkeletonCard count={10} />;

  return (
    <section className="px-4 md:px-12 py-12 bg-white">
      {/* Top Row: Heading + Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        {/* <h2 className="text-2xl md:text-3xl font-bold text-[#00509E]">
          Browse By Department
        </h2> */}

        <div className="flex gap-4">
          <Select onValueChange={(value) => setSelectedDept(value)}>
            <SelectTrigger className="w-[200px] cursor-pointer">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {[
                ...new Set(events.map((e) => e.department?.departmentName)),
              ].map(
                (deptName, idx) =>
                  deptName && (
                    <SelectItem key={idx} value={deptName}>
                      {deptName}
                    </SelectItem>
                  ),
              )}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              setSortOrder(value as "latest" | "oldest")
            }
          >
            <SelectTrigger className="w-[120px] cursor-pointer">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards Grid */}
      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 text-center mt-8">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
          {sortedEvents.map((event) => {
            const isPast = isEventPast(event); // ✅ FIXED
            const userReg = registrations.find(
              (r) => r.eventId === event._id && r.isPaid,
            );

            return (
              <Card
                key={event._id}
                className="relative group flex flex-col rounded-xl overflow-hidden shadow-md border bg-white w-full mx-auto hover:shadow-lg transition-all duration-300 h-full"
                style={{ maxWidth: "350px" }}
              >
                {/* ✅ Registered Badge */}
                {userReg && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                    Registered
                  </Badge>
                )}

                {/* Image container */}
                {/* Image */}
                <div
                  className="relative w-full overflow-hidden bg-gray-100"
                  style={{ aspectRatio: "300/250" }}
                >
                  <img
                    src={event.eventImage}
                    alt={event.eventName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />

                  {/* Event Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        userReg
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : isPast
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {userReg ? "Registered" : isPast ? "Past" : "Live"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow px-4 py-3">
                  <div className="flex-grow space-y-2">
                    <h3 className="text-lg font-bold text-black line-clamp-2 leading-tight">
                      {event.eventName}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
                      <CalendarDays className="w-4 h-4 flex-shrink-0 text-[#00509E]" />
                      <span className="truncate">
                        {formatEventDate(event.startDate, event.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-[#00509E]" />
                      <span className="truncate">{event.city}</span>
                    </div>
                    {event.brochureUpload && (
                      <button
                        onClick={() =>
                          handleDownloadBrochure(event.brochureUpload)
                        }
                        className="inline-flex items-center gap-1 text-md text-[#00509E] hover:text-[#003B73] cursor-pointer font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download Brochure
                      </button>
                    )}
                  </div>

                  {/* Event Type & Category */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-[#00509E] rounded-full">
                      {event.eventCategory}
                    </span>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-full">
                      {event.registrationType === "free" ? "Free" : "Paid"}
                    </span>
                    {userReg && (
                      <span className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">
                        Registered
                      </span>
                    )}
                  </div>

                  {/* Register / View Badge Button */}
                  <Button
                    onClick={() => {
                      if (userReg) {
                        handleViewBadge(event._id, userReg._id);
                      } else if (!isPast) {
                        handleRegister(event._id);
                      } else {
                        return;
                      }
                    }}
                    disabled={!userReg && isPast}
                    className={`mt-4 w-full text-sm py-2 transition-colors cursor-pointer ${
                      userReg
                        ? "bg-green-600 hover:bg-green-700"
                        : isPast
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#00509E] hover:bg-[#003B73]"
                    }`}
                  >
                    {userReg
                      ? "View Badge"
                      : isPast
                        ? "Registration Closed"
                        : "Register"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
