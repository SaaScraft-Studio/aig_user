"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/app/store/useUserStore";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Department", href: "#department" },
  { label: "Conferences", href: "#conferences" },
  { label: "Workshops", href: "#workshops" },
  { label: "CMEs", href: "#cmes" },
  { label: "About Us", href: "#about" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const { photo, fullName, email, clearUser, isAuthenticated } = useUserStore();

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
            },
          );
        } catch (error) {}
      }

      // Clear client-side storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Clear user store
      clearUser();

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
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

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      // For anchor links, just close the menu
      setMenuOpen(false);
    } else {
      // For page navigation, close menu and navigate
      setMenuOpen(false);
      router.push(href);
    }
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#02075d] to-[#1e3a8a] text-white sticky top-0 z-50">
      <div className="mx-auto max-w-8xl px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/headerImg/headerImage.png"
            alt="AIG Logo"
            width={110}
            height={40}
            className="cursor-pointer w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-white hover:opacity-90 transition"
            >
              <span className="hover-underline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard/profile">
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
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={loggingOut}
                className="border border-white text-white bg-transparent hover:bg-white hover:text-[#0a1f68] px-4 py-2 cursor-pointer transition-all duration-200"
              >
                {loggingOut ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait
                  </div>
                ) : (
                  "Logout"
                )}
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                className="border border-white text-white bg-transparent hover:bg-white hover:text-[#0a1f68] px-4 py-2 cursor-pointer transition-all duration-200"
              >
                Login / Sign Up
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none cursor-pointer p-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 space-y-2 bg-gradient-to-r from-[#02075d] to-[#1e3a8a]">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="block text-white py-2 border-b border-white/20 w-full text-left hover:bg-white/10 transition-colors rounded px-2"
            >
              {item.label}
            </button>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="block"
              >
                <div className="flex items-center gap-3 py-2 border-b border-white/20 hover:bg-white/10 transition-colors rounded px-2">
                  <Avatar className="border-2 border-white/80 w-10 h-10">
                    <AvatarImage
                      src={photo || "/authImg/user.png"}
                      alt={fullName || "User"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {fullName || "User"}
                    </span>
                    <span className="text-white/70 text-sm">{email || ""}</span>
                  </div>
                </div>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={loggingOut}
                className="w-full border border-white text-white bg-transparent hover:bg-white hover:text-[#0a1f68] px-4 py-2 cursor-pointer transition-all duration-200 mt-2"
              >
                {loggingOut ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait
                  </div>
                ) : (
                  "Logout"
                )}
              </Button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full border border-white text-white bg-transparent hover:bg-white hover:text-[#0a1f68] px-4 py-2 cursor-pointer transition-all duration-200 mt-2"
              >
                Login / Sign Up
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Hover underline effect */}
      <style jsx>{`
        .hover-underline::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: white;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .hover-underline:hover::after {
          transform: scaleX(1);
        }
      `}</style>
    </header>
  );
}
