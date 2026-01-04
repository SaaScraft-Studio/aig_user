"use client";

import { FileText, ChevronLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation"; // Add useSearchParams

const sections = [
  {
    label: "Registrations",
    href: "/registration/my-registration",
    icon: FileText,
    key: "registrations",
  },
  // {
  //   label: "Abstracts",
  //   href: "/abstract/my-abstracts",
  //   icon: BookOpen,
  //   key: "abstracts",
  // },
];

export const MainSectionSidebar = ({
  activeSection,
  onBackToggle,
  onSectionClick,
  isOpen,
}: {
  activeSection: string;
  onBackToggle: () => void;
  onSectionClick: (key: string, href: string) => void;
  isOpen: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get current URL params

  // Function to build URL with current parameters
  const buildUrl = (basePath: string) => {
    const currentEventId = searchParams.get("eventId");
    const currentRegistrationId = searchParams.get("registrationId");
    const fromBadge = searchParams.get("fromBadge");

    const params = new URLSearchParams();
    if (currentEventId) params.set("eventId", currentEventId);
    if (currentRegistrationId)
      params.set("registrationId", currentRegistrationId);
    if (fromBadge) params.set("fromBadge", fromBadge);

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <aside className="hidden lg:flex fixed top-[60px] left-0 h-[calc(100vh-60px)] w-25 border-r bg-gradient-to-b from-blue-50 to-indigo-50 pt-8 pb-6 px-2 flex-col items-center z-40 shadow-lg">
      {/* Enhanced Back button */}
      <button
        onClick={() => {
          // Preserve params when going back
          const backUrl = buildUrl("/dashboard/events");
          router.push(backUrl);
        }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-gray-600 flex flex-col items-center gap-1 hover:text-blue-600 transition-all duration-200 cursor-pointer group"
      >
        <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md group-hover:bg-blue-50 transition-all">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Back to Events
        </span>
      </button>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 mt-16 w-full">
        {sections.map(({ label, href, icon: Icon, key }) => {
          const isActive = key === activeSection;
          return (
            <button
              key={label}
              onClick={() => {
                // Use the buildUrl function to preserve parameters
                const urlWithParams = buildUrl(href);
                onSectionClick(key, urlWithParams);
              }}
              className={cn(
                "flex flex-col items-center text-xs font-semibold transition-all duration-200 group relative cursor-pointer p-2 rounded-lg",
                isActive
                  ? "bg-white text-blue-700 shadow-lg border border-blue-200"
                  : "text-gray-600 hover:text-blue-600 hover:bg-white/80 hover:shadow-md"
              )}
            >
              {/* Active indicator bar */}
              {isActive && <div className=" bg-blue-600 rounded-r-full" />}

              <div
                className={cn(
                  "p-2 rounded-lg transition-colors mb-1",
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium px-1 text-center leading-tight">
                {label}
              </span>

              {/* Hover tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {label}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
