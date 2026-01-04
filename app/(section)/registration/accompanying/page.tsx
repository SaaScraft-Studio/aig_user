"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AccompanyingFormSidebar from "@/components/registrations/accompanying/AccompanyingFormSidebar";
import AccompanyingTable from "@/components/registrations/accompanying/AccompanyingTable";
import Loading from "@/components/common/Loading";

// Add this type definition
type AccompanyPerson = {
  _id: string;
  fullName: string;
  relation: string;
  age: number;
  gender: string;
  mealPreference: string;
  isPaid: boolean;
  regNum?: string;
};

function AccompanyingContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const registrationId = searchParams.get("registrationId");

  const [open, setOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<AccompanyPerson | null>(
    null
  );
  const [mainAccompanyId, setMainAccompanyId] = useState<string | null>(null); // Add this state
  const [loading, setLoading] = useState(true);
  const [hasRegistration, setHasRegistration] = useState(false);
  const [eventName, setEventName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user has registration and get event details
  useEffect(() => {
    const checkRegistration = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if user has registration for this event
        const token = localStorage.getItem("accessToken");
        const registrationCheckRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/event/${eventId}/my-registration`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (registrationCheckRes.ok) {
          const registrationData = await registrationCheckRes.json();
          if (registrationData.success && registrationData.data) {
            setHasRegistration(true);
            setEventName(
              registrationData.data.eventId?.eventName || "this event"
            );
            setRegistrationNumber(
              registrationData.data.regNum || registrationId || ""
            ); // Add this line
          }
        }

        // If registrationId is provided, we already know user has registration
        if (registrationId) {
          setHasRegistration(true);

          // Fetch registration details to get event name
          const registrationRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/registrations/${registrationId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (registrationRes.ok) {
            const regData = await registrationRes.json();
            if (regData.success && regData.data) {
              setEventName(regData.data.eventId?.eventName || "this event");
              setRegistrationNumber(
                regData.data.regNum || registrationId || ""
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRegistration();
  }, [eventId, registrationId]);

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with context info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#00509E] mb-2">
          Accompanying Persons
        </h1>

        {hasRegistration && eventName && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">
              You are managing accompanying persons for your registration to{" "}
              <strong>{eventName}</strong>
            </p>
            {registrationId && registrationNumber && (
              <p className="text-blue-600 text-sm mt-1">
                Registration Number <strong>{registrationNumber}</strong>
              </p>
            )}
          </div>
        )}

        {!hasRegistration && eventId && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              You need to complete your main registration first before adding
              accompanying persons.
            </p>
            <div className="mt-2">
              <a
                href={`/registration/my-registration?eventId=${eventId}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Complete Registration →
              </a>
            </div>
          </div>
        )}
        {!eventId && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              No event selected. Please go back to the events page to select an
              event.
            </p>
          </div>
        )}
      </div>

      <AccompanyingTable
        eventId={eventId}
        registrationId={registrationId}
        hasRegistration={hasRegistration}
        refreshTrigger={refreshTrigger}
        onAddClick={() => {
          if (!hasRegistration) {
            alert("Please complete your main registration first.");
            return;
          }
          setEditingPerson(null); // Clear editing person
          setMainAccompanyId(null); // Clear main accompany ID
          setOpen(true);
        }}
        onEditClick={(person, mainId) => {
          setEditingPerson(person);
          setMainAccompanyId(mainId);
          setOpen(true);
        }}
      />

      <AccompanyingFormSidebar
        eventId={eventId}
        registrationId={registrationId}
        mainAccompanyId={mainAccompanyId} // Pass mainAccompanyId
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingPerson(null); // Clear editing person
          setMainAccompanyId(null); // Clear main accompany ID
        }}
        editingPerson={editingPerson}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default function AccompanyingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <Loading />
        </div>
      }
    >
      <AccompanyingContent />
    </Suspense>
  );
}
