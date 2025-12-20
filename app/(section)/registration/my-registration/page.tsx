"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useRegistrationStore } from "@/app/store/useRegistrationStore";
import { useEventStore } from "@/app/store/useEventStore";
import RegistrationStepper from "@/components/registrations/myRegistration/RegistrationStepper";
import Step1BasicDetails from "@/components/registrations/myRegistration/Step1BasicDetails";
import Step4ConfirmPay from "@/components/registrations/myRegistration/Step4ConfirmPay";
import Loading from "@/components/common/Loading";
import ExistingRegistrationView from "@/components/registrations/myRegistration/ExistingRegistrationView";
import { toast } from "sonner";

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

function RegistrationContent() {
  const {
    currentStep,
    setStep,
    updateBasicDetails,
    resetForm,
    setDynamicFormFields,
  } = useRegistrationStore();
  const { events, currentEvent, setCurrentEvent, fetchEvents } =
    useEventStore();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");
  const registrationIdFromUrl = searchParams.get("registrationId");
  const fromBadge = searchParams.get("fromBadge") === "true";

  const [loading, setLoading] = useState(true);
  const [hasExistingRegistration, setHasExistingRegistration] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [registrationSettings, setRegistrationSettings] =
    useState<RegistrationSettings | null>(null);
  const [settingsChecked, setSettingsChecked] = useState(false);

  // Check registration settings
  const checkRegistrationSettings = async (eventId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/registration-settings`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setRegistrationSettings(data.data[0]);
          return data.data[0];
        } else {
          // No settings found - treat as registration not available
          setRegistrationSettings(null);
          return null;
        }
      }
      setRegistrationSettings(null);
      return null;
    } catch (error) {
      console.error("Error checking registration settings:", error);
      setRegistrationSettings(null);
      return null;
    }
  };

  // Check for existing registration and initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setSettingsChecked(false);

        if (eventIdFromUrl && !fromBadge) {
          resetForm();
          setStep(1);
        }

        // ✅ NEW: Reset dynamic form fields when event changes
        setDynamicFormFields([]);

        // Fetch events if not loaded
        if (!events.length) {
          await fetchEvents();
        }

        // Set current event and check registration settings
        if (eventIdFromUrl && events.length) {
          const foundEvent = events.find((e) => e._id === eventIdFromUrl);
          if (foundEvent) {
            setCurrentEvent(foundEvent);

            // ✅ Check registration settings FIRST
            const settings = await checkRegistrationSettings(eventIdFromUrl);
            setSettingsChecked(true);

            // If registration is not enabled, stop here
            if (!settings || settings.attendeeRegistration !== true) {
              setLoading(false);
              return;
            }

            // Only proceed with registration if it's enabled
            updateBasicDetails({
              eventId: foundEvent._id,
              eventName: foundEvent.eventName,
            });

            // Fetch user profile
            const token = localStorage.getItem("accessToken");
            const profileRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/profile`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (profileRes.ok) {
              const user = await profileRes.json();
              updateBasicDetails({
                prefix: user.prefix ?? "",
                fullName: user.fullname || user.name || "",
                phone: user.mobile || user.phone || "",
                email: user.email || "",
                affiliation: user.affiliation ?? "",
                designation: user.designation ?? "",
                country: user.country ?? "",
                city: user.city ?? "",
                state: user.state ?? "",
                pincode: user.pincode ?? "",
                gender: user.gender ?? "",
              });
            }

            // Check if user already has registration for this event
            const registrationCheckRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/event/${eventIdFromUrl}/my-registration`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (registrationCheckRes.ok) {
              const registrationData = await registrationCheckRes.json();
              if (registrationData.success && registrationData.data) {
                setHasExistingRegistration(true);
                setExistingRegistration(registrationData.data);

                if (fromBadge || registrationData.data) {
                  resetForm();
                  setStep(1);
                }
              }
            }
          }
        }

        // If registrationId is provided in URL, fetch that specific registration
        if (registrationIdFromUrl) {
          const token = localStorage.getItem("accessToken");
          const registrationRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/${registrationIdFromUrl}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (registrationRes.ok) {
            const registrationData = await registrationRes.json();
            if (registrationData.success && registrationData.data) {
              setHasExistingRegistration(true);
              setExistingRegistration(registrationData.data);
              resetForm();
            }
          }
        }
      } catch (error) {
        console.error("Error initializing registration:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [
    eventIdFromUrl,
    registrationIdFromUrl,
    fromBadge,
    events,
    fetchEvents,
    setCurrentEvent,
    updateBasicDetails,
    resetForm,
    setStep,
    setDynamicFormFields, // Add this
  ]);

  const goNext = () => setStep(Math.min(currentStep + 1, 2));
  const goBack = () => setStep(Math.max(currentStep - 1, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loading />
      </div>
    );
  }

  // ✅ Show registration closed message if settings don't allow registration
  if (
    settingsChecked &&
    (!registrationSettings ||
      registrationSettings.attendeeRegistration !== true)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Registration Not Available
            </h2>
            <p className="text-gray-600 mb-2">
              Main registration is currently closed for this event. or not
              started yet.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Please check back later or contact the event organizers for more
              information.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="bg-[#00509E] hover:bg-[#003B73] text-white px-6 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard/events")}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg transition-colors cursor-pointer"
              >
                View Other Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show existing registration details if user already registered
  if (hasExistingRegistration && existingRegistration) {
    return (
      <ExistingRegistrationView
        registration={existingRegistration}
        eventId={eventIdFromUrl}
      />
    );
  }

  // Show registration form for new registration (only if attendeeRegistration is true)
  return (
    <main className="px-4 sm:px-6 pb-10 relative mt-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#00509E]">
            My Registration
          </h2>
          {currentEvent && (
            <p className="text-gray-600">
              Registering for: <strong>{currentEvent.eventName}</strong>
            </p>
          )}
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <RegistrationStepper currentStep={currentStep} />

          <div className="mt-10">
            {currentStep === 1 && <Step1BasicDetails onNext={goNext} />}
            {currentStep === 2 && <Step4ConfirmPay onBack={goBack} />}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <Loading />
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
