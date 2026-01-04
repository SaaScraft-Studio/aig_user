"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { formatEventDate } from "@/app/utils/formatEventDate";

interface BadgeProps {
  registration: any;
}

export function Badge({ registration }: BadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;

    try {
      // Get the actual dimensions like in the working example
      const width = badgeRef.current.offsetWidth;
      const height = badgeRef.current.offsetHeight;

      const imgData = await toPng(badgeRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `badge-${registration.regNum || registration._id}.png`;
      link.click();
    } catch (error) {
      console.error("Error downloading badge:", error);
    }
  };

  const handleShareBadge = async () => {
    if (!badgeRef.current) return;

    try {
      setIsSharing(true);

      // Get dimensions for share as well
      const width = badgeRef.current.offsetWidth;
      const height = badgeRef.current.offsetHeight;

      const imgData = await toPng(badgeRef.current, {
        quality: 0.9,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        cacheBust: true,
      });

      const blob = await (await fetch(imgData)).blob();
      const file = new File(
        [blob],
        `badge-${registration.regNum || registration._id}.png`,
        { type: "image/png" }
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Badge for ${registration.name}`,
          text: `Here is my badge for ${
            registration.eventId?.title || "the event"
          }`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing badge:", err);
      handleDownloadBadge();
    } finally {
      setIsSharing(false);
    }
  };

  const eventName =
    registration.eventId?.eventName ||
    registration.eventId?.title ||
    registration.eventName ||
    "Event";

  const attendeeName = registration.name || "Attendee";
  const prefix = registration.prefix || "";
  const regNum = registration.regNum || `N/A`;
  const registrationCategory =
    registration.registrationSlabId?.slabName ||
    registration.registrationCategory ||
    "Attendee";

  const qrValue = regNum;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#00509E]">
            Your Event Badge
          </h1>
        </div>

        {/* Badge Container - Match the structure of working example */}
        <div
          className="mb-6"
          style={{ width: "350px", maxWidth: "100%", margin: "0 auto" }}
        >
          <Card
            ref={badgeRef}
            className="overflow-hidden border border-gray-300 bg-white mx-auto shadow-lg"
            style={{
              width: "100%",
              maxWidth: "350px",
              margin: "0 auto",
            }}
          >
            <CardContent className="flex flex-col items-center py-6 px-4 sm:px-6">
              {/* Name */}
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                {prefix} {attendeeName}
              </h2>

              {/* Reg Number */}
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  REGISTRATION NUMBER
                </p>
                <div className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-md">
                  <p className="text-base font-bold tracking-wider">{regNum}</p>
                </div>
              </div>

              {/* QR */}
              <div className="my-4 flex justify-center p-2 border border-gray-300 rounded-lg bg-white">
                <QRCodeSVG
                  value={qrValue}
                  size={160}
                  includeMargin={true}
                  level="H"
                />
              </div>

              {/* Event & Date */}
              <div className="text-center mb-4 w-full">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {eventName}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatEventDate(
                    registration.eventId?.startDate,
                    registration.eventId?.endDate
                  )}
                </p>
              </div>

              {/* Category */}
              <div className="w-full mb-2">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-center py-3 rounded-lg text-sm">
                  {registrationCategory.toUpperCase()}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Scan QR code for verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center w-full px-2">
          <Button
            onClick={handleDownloadBadge}
            className="flex items-center gap-2 bg-[#00509E] hover:bg-[#003B73] text-white text-sm sm:text-base cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Badge
          </Button>

          <Button
            onClick={handleShareBadge}
            disabled={isSharing}
            variant="outline"
            className="flex items-center gap-2 border-[#00509E] text-[#00509E] hover:bg-[#00509E] hover:text-white text-sm sm:text-base cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> {isSharing ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    </div>
  );
}
