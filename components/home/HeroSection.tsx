"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      className="relative w-full h-[90vh] bg-cover bg-center flex items-center px-6 md:px-12"
      style={{
        backgroundImage: "url('/homeImg/auditorium.avif')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050c1a]/70 to-[#08152e]/60 z-0" />

      {/* Content */}
      <div className="relative z-10 text-white max-w-4xl space-y-6 text-left">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-francois leading-tight md:whitespace-nowrap">
          AIG Hospitals | Academic Cell
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg font-poppins leading-relaxed max-w-3xl">
          AIG Hospitals, one of India's largest tertiary care hospitals, is a
          pioneer in academics driven content and events. The Academic Cell at
          AIG regularly conducts workshops, meetings, CMEs and large-scale
          conferences covering the entire spectrum of medical & surgical
          specialties.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search Conferences, Workshops, CMEs..."
            className="pl-12 pr-4 py-3 rounded-full w-full text-black bg-white placeholder:text-gray-400"
          />
        </div>
      </div>
    </section>
  );
}
