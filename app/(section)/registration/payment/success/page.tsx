// app/(section)/registration/payment/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatSingleDate } from "@/app/utils/formatEventDate";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const registrationId = searchParams.get("registrationId");
  const paymentId = searchParams.get("paymentId");
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrationDetails = async () => {
      if (!registrationId) {
        router.push("/dashboard/events");
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/${registrationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch registration details");
        }

        const data = await res.json();

        if (data.success && data.data) {
          setRegistrationData(data.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
        setError("Failed to load registration details");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationDetails();
  }, [registrationId, router]);

  const handleViewBadge = () => {
    if (registrationData) {
      router.push(
        `/registration/my-registration/badge/${registrationData.eventId._id}?registrationId=${registrationId}`
      );
    }
  };

  const handleBackToEvents = () => {
    router.push("/dashboard/events");
  };

  const handleViewAllRegistrations = () => {
    router.push("/dashboard/events?tab=Registered");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00509E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your registration details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={handleBackToEvents}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <CheckCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              No Data Found
            </h2>
            <p className="text-yellow-600 mb-4">
              Registration details not found
            </p>
            <Button
              onClick={handleBackToEvents}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <Card className="border-green-200 shadow-lg mb-6">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              Payment Successful!
            </h1>
            <p className="text-green-600 text-lg mb-4">
              Thank you for your registration. Your payment has been processed
              successfully.
            </p>

            {/* Registration Number */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block mb-4">
              <p className="text-green-800 font-semibold text-lg">
                Registration Number: {registrationData.regNum}
              </p>
            </div>

            {paymentId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 inline-block mx-2">
                <p className="text-gray-700 text-sm">
                  Payment Reference: {paymentId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00509E]" />
              Event Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Event Name</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {registrationData.eventId.eventName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {registrationData.eventId.shortName}
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Start Date
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatEventDate(registrationData.eventId.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">End Date</p>
                  <p className="font-medium text-gray-900">
                    {formatEventDate(registrationData.eventId.endDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Event Status
                </p>
                <Badge
                  className={
                    registrationData.eventId.dynamicStatus === "Live"
                      ? "bg-green-100 text-green-800"
                      : registrationData.eventId.dynamicStatus === "Past"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                  }
                >
                  {registrationData.eventId.dynamicStatus}
                </Badge>
              </div>

              {registrationData.eventId.venueName && (
                <div>
                  <p className="text-sm text-gray-600 font-medium">Venue</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="font-medium text-gray-900">
                      {registrationData.eventId.venueName.venueName}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {registrationData.eventId.venueName.venueAddress}
                  </p>
                </div>
              )}

              {/* Payment Status */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600 font-medium">
                  Payment Status
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge className="bg-green-100 text-green-800">Paid ✓</Badge>
                  <span className="text-sm text-gray-600">
                    Completed on {formatSingleDate(registrationData.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Details */}
          {/* <Card className="shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#00509E]" />
                Attendee Information
              </h2>

              <div className="space-y-4 space-x-0 sm:space-x-4  text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Name</p>
                    <p className="font-semibold text-gray-900">
                      {registrationData.prefix} {registrationData.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Registration Category
                    </p>
                    <Badge className="bg-blue-100 text-blue-800">
                      {registrationData.registrationSlabName}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {registrationData.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Mobile</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {registrationData.mobile}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Gender</p>
                    <p className="font-medium text-gray-900">
                      {registrationData.gender}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Meal Preference
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      {registrationData.mealPreference}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Designation & Affiliation
                  </p>
                  <p className="font-medium text-gray-900">
                    {registrationData.designation} at{" "}
                    {registrationData.affiliation}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Medical Council
                  </p>
                  <p className="font-medium text-gray-900">
                    {registrationData.medicalCouncilState} -{" "}
                    {registrationData.medicalCouncilRegistration}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium">Address</p>
                  <p className="font-medium text-gray-900">
                    {registrationData.address}, {registrationData.city},{" "}
                    {registrationData.state}, {registrationData.country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            onClick={handleViewBadge}
            className="bg-[#00509E] hover:bg-[#003B73] text-white px-8 py-3 text-lg cursor-pointer"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            View & Download Badge
          </Button>

          <Button
            onClick={handleViewAllRegistrations}
            variant="outline"
            className="border-[#00509E] text-[#00509E] hover:bg-[#00509E] hover:text-white px-8 py-3 text-lg cursor-pointer"
            size="lg"
          >
            View All Registrations
          </Button>

          <Button
            onClick={handleBackToEvents}
            variant="outline"
            className="border-gray-400 text-gray-700 hover:bg-gray-100 px-8 py-3 text-lg cursor-pointer"
            size="lg"
          >
            Back to Events
          </Button>
        </div>

        {/* Important Notes */}
        {/* <Card className="mt-8 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Important Information
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  Your registration <strong>{registrationData.regNum}</strong>{" "}
                  is confirmed
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  Download your event badge for venue entry - required for
                  attendance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep your registration number handy for any queries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  Bring a government-issued ID along with your badge to the
                  event
                </span>
              </li>
            </ul>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
