import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTwitter,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#1f1f1f] to-[#101010] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Address */}
        <div>
          <h4 className="text-xl font-semibold mb-4">Address</h4>
          <p className="text-sm leading-relaxed">
            1-66/AIG/2 to 5, Mindspace Road, Gachibowli, Hyderabad, Telangana
            500032 <br />
            <br />
            <strong>Ambulance Services:</strong> +91 40 4244 4244 <br />
            <strong>Appointments:</strong> +91 40 4244 4222 <br />
            <br />
            Asian Institute of Gastroenterology Private Limited (AIG Hospitals){" "}
            <br />
            6/3/661, Somajiguda, Hyderabad, Telangana 500082
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: "About Us", href: "/about" },
              { label: "Contact Us", href: "/contact" },
              { label: "Login/ Sign Up", href: "/login" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Logo, Contact & Social */}
        <div className="space-y-4">
          <Image
            src="/footerImg/logo.png"
            alt="AIG Logo"
            width={120}
            height={40}
            className="h-auto w-24 sm:w-28 md:w-32 lg:w-40"
          />

          <p className="text-sm">
            <strong>Email:</strong>{" "}
            <a
              href="mailto:info@aighospitals.com"
              className="hover:underline text-white font-medium"
            >
              info@aighospitals.com
            </a>
          </p>

          {/* Social Icons */}
          <div className="flex gap-4 mt-2">
            <a href="#" className="hover:text-blue-400" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:text-pink-500" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-blue-600" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
            <a href="#" className="hover:text-red-500" aria-label="YouTube">
              <FaYoutube />
            </a>
            <a href="#" className="hover:text-blue-400" aria-label="Twitter">
              <FaTwitter />
            </a>
          </div>

          {/* Seals */}
          <div className="flex gap-3 pt-4">
            <Image
              src="/footerImg/seal1.png"
              alt="Seal 1"
              width={40}
              height={40}
            />
            <Image
              src="/footerImg/seal2.png"
              alt="Seal 2"
              width={40}
              height={40}
            />
            <Image
              src="/footerImg/seal3.png"
              alt="Seal 3"
              width={40}
              height={40}
            />
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#1e3a8a] text-center py-3 text-sm text-white">
        © Copyright 2025 AIG Hospital. All Rights Reserved.
      </div>
    </footer>
  );
}
