"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  User,
  Users,
  PanelLeft,
  PanelRight,
  MonitorPlay,
  Utensils,
  BookOpen,
  UserPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense, useEffect, useState } from "react";
import Loading from "../common/Loading";
import { useEventStore } from "@/app/store/useEventStore";

type SidebarItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  settingKey: string;
};

const sidebarMap: Record<string, SidebarItem[]> = {
  registrations: [
    {
      label: "My Registration",
      path: "/registration/my-registration",
      icon: User,
      settingKey: "attendeeRegistration",
    },
    {
      label: "Accompanying",
      path: "/registration/accompanying",
      icon: Users,
      settingKey: "accompanyRegistration",
    },
    {
      label: "Workshop",
      path: "/registration/workshop",
      icon: MonitorPlay,
      settingKey: "workshopRegistration",
    },
    {
      label: "Banquet",
      path: "/registration/banquet",
      icon: Utensils,
      settingKey: "banquetRegistration",
    },
  ],
  abstracts: [
    {
      label: "My Abstracts",
      path: "/abstract/my-abstracts",
      icon: BookOpen,
      settingKey: "abstractRegistration",
    },
    {
      label: "Authors",
      path: "/abstract/authors",
      icon: UserPen,
      settingKey: "abstractRegistration",
    },
  ],
};

type RegistrationSettings = {
  _id: string;
  eventId: string;
  attendeeRegistration: boolean;
  accompanyRegistration: boolean;
  workshopRegistration: boolean;
  banquetRegistration: boolean;
  eventRegistrationStartDate: string;
  eventRegistrationEndDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export function SubSidebar({
  section,
  isOpen,
  onToggle,
  eventId: propEventId,
}: {
  section: string;
  isOpen: boolean;
  onToggle: () => void;
  eventId?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registrationSettings, fetchRegistrationSettings } = useEventStore();
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsFetched, setSettingsFetched] = useState(false); // Add this state

  const items = sidebarMap[section] || [];
  const eventId = propEventId || searchParams.get("eventId");

  const isBadgePage = pathname.startsWith(
    "/registration/my-registration/badge"
  );
  const urlEventId = isBadgePage
    ? pathname.split("/").pop() // This should extract the eventId from the URL
    : searchParams.get("eventId");
  const registrationId = searchParams.get("registrationId");
  const targetEventId = eventId || urlEventId;

  // Update the useEffect to only fetch registration settings for registration section
  useEffect(() => {
    const loadRegistrationSettings = async () => {
      // Only fetch registration settings for registrations section
      if (section !== "registrations") return;

      if (!targetEventId) {
        return;
      }

      setLoadingSettings(true);
      try {
        await fetchRegistrationSettings(targetEventId);
      } catch (error) {
        console.error("Error fetching registration settings:", error);
      } finally {
        setLoadingSettings(false);
        setSettingsFetched(true); // Add this line
      }
    };

    loadRegistrationSettings();
  }, [targetEventId, fetchRegistrationSettings, section]); // Add section to dependencies

  // Update the filteredItems logic
  const filteredItems = items.filter((item) => {
    // For abstracts section, show all items without filtering
    if (section === "abstracts") {
      return true;
    }

    // For registrations section, apply filtering based on settings
    if (loadingSettings) return false;
    if (!registrationSettings) return false;

    const settingValue =
      registrationSettings[item.settingKey as keyof RegistrationSettings];
    return settingValue === true;
  });

  // Function to build URLs with preserved parameters
  const buildUrl = (basePath: string) => {
    const params = new URLSearchParams();
    if (urlEventId) params.set("eventId", urlEventId);
    if (registrationId) params.set("registrationId", registrationId);
    if (isBadgePage) params.set("fromBadge", "true");
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <Suspense fallback={<Loading />}>
      {/* Enhanced Chevron toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "hidden lg:flex fixed top-[93px] z-[70] bg-white border-2 border-blue-100 shadow-lg rounded-full w-10 h-10 items-center justify-center transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-105 hover:border-blue-200",
          isOpen ? "left-[336px]" : "left-[88px]"
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <PanelLeft className="w-5 h-5 text-blue-600 transition-transform group-hover:scale-110" />
        ) : (
          <PanelRight className="w-5 h-5 text-blue-600 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Enhanced Sub Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed top-[60px] left-[95px] h-[calc(100vh-60px)] border-r transition-all duration-300 z-30 bg-gradient-to-b from-blue-50/95 to-indigo-50/95 backdrop-blur-sm shadow-xl",
          isOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div
          className={cn(
            "h-full w-64 transition-opacity duration-200 flex flex-col",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-blue-100/50 bg-white/80">
            <h3 className="font-semibold text-gray-800 text-lg text-center mt-4">
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h3>
            {/* <p className="text-sm text-gray-600 mt-1">
              Manage your registration
            </p> */}
            {loadingSettings && (
              <p className="text-xs text-blue-600 mt-1 text-center">
                Loading settings...
              </p>
            )}
            {settingsFetched && filteredItems.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No options available</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {loadingSettings ? (
              // Show loading state
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading options...</p>
              </div>
            ) : (
              // Show filtered items
              <>
                {filteredItems.map(({ label, path, icon: Icon }) => {
                  const url = buildUrl(path);
                  const isActive =
                    pathname === path || pathname.startsWith(path + "/");

                  return (
                    <Link key={path} href={url}>
                      <div
                        className={cn(
                          "flex items-center gap-3 text-sm rounded-xl px-4 py-3 font-medium w-full transition-all duration-200 group cursor-pointer border border-transparent",
                          isActive
                            ? "bg-white text-blue-700 shadow-md border-blue-200 shadow-blue-100"
                            : "text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-md hover:border-blue-100"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="font-medium">{label}</span>

                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        )}
                      </div>
                    </Link>
                  );
                })}

                {/* Show message if no items are available after settings are loaded */}
                {filteredItems.length === 0 && settingsFetched && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No registration options available for this event
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </aside>
    </Suspense>
  );
}
