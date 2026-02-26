// components/dashboard/MobileSectionSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, FileText, BookOpen } from "lucide-react";

const mobileSections = [
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

export const MobileSectionSidebar = ({
  isOpen,
  onClose,
  activeSection,
  onSectionClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionClick: (key: string, href: string) => void;
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#eaf3ff] z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col space-y-2">
            {mobileSections.map(({ label, href, icon: Icon, key }) => (
              <button
                key={key}
                onClick={() => {
                  onSectionClick(key, href);
                  onClose();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium w-full text-left transition-colors",
                  activeSection === key
                    ? "bg-white text-blue-600 shadow-sm border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-white hover:text-blue-600",
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
