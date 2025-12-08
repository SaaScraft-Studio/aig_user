// components/dashboard/EventCard.tsx
"use client";

import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEventStore } from "@/app/store/useEventStore";
import { useUserRegistrationsStore } from "@/app/store/useRegistrationStore";
import { formatEventDate } from "@/app/utils/formatEventDate";
import { UserRegistration } from "@/app/store/useRegistrationStore";
import SkeletonCard from "../common/SkeletonCard";

const TABS = ["Registered", "All", "Past"];
const FILTERS = ["All", "Conference", "Workshop", "CME"];

export default function EventTabs() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  const { events, fetchEvents, loading, error } = useEventStore();
  const { registrations, fetchRegistrations } = useUserRegistrationsStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      await fetchEvents();
      await fetchRegistrations(); // Fetch user registrations
    }
    fetchData();
  }, [fetchEvents, fetchRegistrations]);

  const handleRegister = (eventId?: string) => {
    if (!eventId) return;

    // Find the event and set it as current before navigation
    const event = events.find((e) => e._id === eventId);
    if (event) {
      useEventStore.getState().setCurrentEvent(event);
    }

    router.push(`/registration/my-registration?eventId=${eventId}`);
  };

  const handleViewBadge = (eventId?: string, registrationId?: string) => {
    if (!eventId || !registrationId) return;

    // Find the event and set it as current before navigation
    const event = events.find((e) => e._id === eventId);
    if (event) {
      useEventStore.getState().setCurrentEvent(event);
    }

    router.push(
      `/registration/my-registration/badge/${eventId}?registrationId=${registrationId}`
    );
  };

  // Helper function to check if event is past
  const isEventPast = (event: any): boolean => {
    if (!event.endDate) return false;

    try {
      // Convert "28/10/2025" to Date object
      const [day, month, year] = event.endDate.split("/");
      const eventEndDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      return eventEndDate < new Date();
    } catch (error) {
      console.error("Error parsing event date:", error);
      return false;
    }
  };

  // Helper function to get user registration for an event
  const getUserRegistration = (
    eventId: string
  ): UserRegistration | undefined => {
    return registrations.find((r) => r.eventId === eventId && r.isPaid);
  };

  // Helper function to check if user is registered for an event
  const isUserRegistered = (eventId: string): boolean => {
    return !!getUserRegistration(eventId);
  };

  // Registered events (both current and past)
  const registeredEvents = events.filter((event) =>
    isUserRegistered(event._id)
  );

  // Past events (all events that have ended)
  const pastEvents = events.filter((event) => isEventPast(event));

  // Apply tab + search + filter
  const filteredEvents = (
    activeTab === "Registered"
      ? registeredEvents
      : activeTab === "Past"
      ? pastEvents
      : events
  )
    .filter((event) =>
      event?.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((event) =>
      filterType === "All" ? true : event?.eventCategory === filterType
    );

  // Get button text and action based on event status and registration
  const getEventButtonConfig = (event: any) => {
    const userReg = getUserRegistration(event._id);
    const isPast = isEventPast(event);
    const isRegistered = !!userReg;

    if (isRegistered) {
      return {
        text: isPast ? "View Badge" : "View Badge",
        onClick: () => handleViewBadge(event._id, userReg._id),
        variant: "success" as const,
        disabled: false,
      };
    } else {
      return {
        text: isPast ? "Registration Closed" : "Register Now",
        onClick: () => handleRegister(event._id),
        variant: isPast ? "disabled" : ("primary" as const),
        disabled: isPast,
      };
    }
  };

  if (error) {
    return (
      <section className="px-4 md:px-8 py-8">
        <div className="text-center py-8">
          <p className="text-red-600 text-lg mb-4">
            Error loading events: {error}
          </p>
          <Button
            onClick={() => fetchEvents()}
            className="bg-[#00509E] hover:bg-[#003B73]"
          >
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4 text-[#00509E]">Events</h1>

      {/* Tabs */}
      <div className="flex gap-6 text-sm font-medium text-blue-900 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "pb-2 transition-all cursor-pointer",
              activeTab === tab
                ? "border-b-2 border-blue-800 text-blue-900"
                : "text-gray-500 hover:text-blue-800"
            )}
          >
            {tab} {tab === "Registered" && `(${registeredEvents.length})`}
            {tab === "Past" && `(${pastEvents.length})`}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/3 bg-white"
        />

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 cursor-pointer bg-white">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid / Skeleton / No Results */}
      {loading ? (
        <SkeletonCard count={8} />
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No events found</p>
          <p className="text-gray-400 text-sm">
            {searchQuery || filterType !== "All"
              ? "Try adjusting your search or filter"
              : activeTab === "Registered"
              ? "You haven't registered for any events yet"
              : "No events available at the moment"}
          </p>
          {activeTab === "Registered" && (
            <Button
              onClick={() => setActiveTab("All")}
              className="mt-4 bg-[#00509E] hover:bg-[#003B73]"
            >
              Browse All Events
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map((event) => {
            const userReg = getUserRegistration(event._id);
            const isRegistered = !!userReg;
            const isPast = isEventPast(event);
            const buttonConfig = getEventButtonConfig(event);

            return (
              <Card
                key={event._id}
                className="group relative flex flex-col rounded-xl overflow-hidden shadow-md border bg-white hover:shadow-lg transition-all duration-300 h-full"
              >
                {/* Image */}
                <div
                  className="w-full overflow-hidden"
                  style={{ aspectRatio: "300/250" }}
                >
                  <img
                    src={event.eventImage}
                    alt={event.eventName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // ✅ Hide the broken image and show CSS fallback
                      target.style.display = "none";
                    }}
                  />

                  {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center hidden group-has-[img:failed]:flex">
                    <div className="text-center text-gray-500">
                      <CalendarDays className="w-12 h-12 mx-auto mb-2 text-blue-300" />
                      <p className="text-sm font-medium">Event Image</p>
                      <p className="text-xs">Not Available</p>
                    </div>
                  </div> */}

                  {/* Event Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={clsx(
                        "px-2 py-1 text-xs font-semibold rounded-full",
                        isRegistered
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : event.dynamicStatus === "Live"
                          ? "bg-blue-100 text-blue-800"
                          : event.dynamicStatus === "Past"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                      )}
                    >
                      {isRegistered ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Registered
                        </span>
                      ) : (
                        event.dynamicStatus
                      )}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-4">
                  <div className="flex-grow space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                      {event.eventName}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <CalendarDays className="w-4 h-4 text-[#00509E] flex-shrink-0" />
                        <span className="truncate">
                          {formatEventDate(event.startDate, event.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <Clock className="w-4 h-4 text-[#00509E] flex-shrink-0" />
                        <span>
                          {event.startTime} - {event.endTime} {event.timeZone}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <MapPin className="w-4 h-4 text-[#00509E] flex-shrink-0" />
                        <span className="truncate">
                          {event.venueName?.venueName ||
                            `${event.city}, ${event.state}`}
                        </span>
                      </div>
                    </div>

                    {/* Event Type & Category */}
                    <div className="flex items-center gap-2 pt-2">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                        {event.eventCategory}
                      </span>
                      <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-full">
                        {event.registrationType === "free" ? "Free" : "Paid"}
                      </span>
                      {isRegistered && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">
                          Registered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      onClick={buttonConfig.onClick}
                      disabled={buttonConfig.disabled}
                      className={clsx(
                        "w-full transition-colors font-medium cursor-pointer",
                        buttonConfig.variant === "success" &&
                          "bg-green-600 hover:bg-green-700 text-white",
                        buttonConfig.variant === "primary" &&
                          "bg-[#00509E] hover:bg-[#003B73] text-white",
                        buttonConfig.variant === "disabled" &&
                          "bg-gray-300 text-gray-500 cursor-not-allowed"
                      )}
                    >
                      {buttonConfig.text}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
