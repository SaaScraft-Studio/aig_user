"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, Megaphone, Calendar, CreditCard, User } from "lucide-react";

const navItems = [
  {
    name: "Events",
    href: "/dashboard/events",
    icon: Calendar,
  },
  {
    name: "Payment History",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Announcements",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    name: "My Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

export const Sidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel - Starts below header */}
      <aside
        className={cn(
          // Base styles
          "fixed lg:fixed top-[60px] left-0 h-[calc(100vh-60px)] w-64 bg-gradient-to-b from-blue-50 to-blue-100 z-40 transition-transform duration-300 ease-in-out shadow-xl",

          // Mobile behavior: slide in/out
          "transform lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",

          // Desktop behavior: always visible
          "lg:flex lg:flex-col"
        )}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col h-full p-4 overflow-y-auto">
          {/* Mobile Close Button */}
          <div className="flex justify-end lg:hidden">
            {/* <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2> */}
            {/* <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-blue-200 transition-colors text-gray-600 hover:text-gray-800 mt-2"
            >
              <X size={20} />
            </button> */}
          </div>

          {/* Desktop Header */}
          {/* <div className="hidden lg:flex items-center justify-center mb-6 pt-2">
            <h2 className="text-lg font-bold text-gray-800">Dashboard Menu</h2>
          </div> */}

          {/* Navigation */}
          <nav className="flex flex-col space-y-2 flex-1 mt-6">
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  // Close sidebar on mobile when link is clicked
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  pathname === href
                    ? "bg-white text-blue-700 shadow-lg border border-blue-200"
                    : "text-gray-700 hover:bg-white hover:text-blue-600 hover:shadow-md"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    pathname === href
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                  )}
                >
                  <Icon size={18} />
                </div>
                <span className="font-medium">{name}</span>

                {/* Active indicator */}
                {pathname === href && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t border-blue-200/50 mt-4">
            <div className="text-xs text-gray-500 text-center">
              Navigation Menu
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
