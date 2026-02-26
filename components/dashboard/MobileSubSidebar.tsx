// components/dashboard/MobileSubSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, User, Users, MonitorPlay, Utensils, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

type SidebarItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  settingKey: string;
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
  // abstract: [
  //   {
  //     label: "My Abstracts",
  //     path: "/abstract/my-abstracts",
  //     icon: BookOpen,
  //     settingKey: "abstractRegistration",
  //   },
  // ],
  travel: [],
  accomodation: [],
  presentation: [],
};

export const MobileSubSidebar = ({
  section,
  isOpen,
  onClose,
  eventId,
}: {
  section: string;
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [registrationSettings, setRegistrationSettings] =
    useState<RegistrationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const items = sidebarMap[section] || [];
  // const eventId = searchParams.get("eventId");

  const isBadgePage = pathname.startsWith(
    "/registration/my-registration/badge",
  );
  const urlEventId = isBadgePage
    ? pathname.split("/").pop()
    : searchParams.get("eventId");
  const registrationId = searchParams.get("registrationId");

  // Fetch registration settings
  useEffect(() => {
    const fetchRegistrationSettings = async () => {
      if (!eventId) {
        setRegistrationSettings(null);
        return;
      }

      try {
        setLoadingSettings(true);
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/registration-settings`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setRegistrationSettings(data.data[0]);
          } else {
            setRegistrationSettings({} as RegistrationSettings);
          }
        } else {
          setRegistrationSettings({} as RegistrationSettings);
        }
      } catch (error) {
        console.error("Error fetching registration settings:", error);
        setRegistrationSettings({} as RegistrationSettings);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchRegistrationSettings();
  }, [eventId]);

  // Filter sidebar items based on registration settings
  const filteredItems = items.filter((item) => {
    if (!registrationSettings) return true; // Show all if no settings loaded

    const settingValue =
      registrationSettings[item.settingKey as keyof RegistrationSettings];
    return settingValue === true;
  });

  const buildUrl = (basePath: string) => {
    const params = new URLSearchParams();
    if (urlEventId) params.set("eventId", urlEventId);
    if (registrationId) params.set("registrationId", registrationId);
    if (isBadgePage) params.set("fromBadge", "true");
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#eaf3ff] z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col space-y-2">
            {loadingSettings ? (
              // Loading state
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading options...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              // No items available
              <div className="text-center py-4 text-gray-500 text-sm">
                No registration options available
              </div>
            ) : (
              // Show filtered items
              filteredItems.map(({ label, path, icon: Icon }) => {
                const url = buildUrl(path);
                const isActive =
                  pathname === path || pathname.startsWith(path + "/");

                return (
                  <Link
                    key={path}
                    href={url}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-700 hover:bg-white hover:text-blue-600",
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
