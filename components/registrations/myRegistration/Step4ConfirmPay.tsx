"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegistrationStore } from "@/app/store/useRegistrationStore";
import { useEventStore } from "@/app/store/useEventStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Step4ConfirmPay({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { currentEvent } = useEventStore();

  const {
    basicDetails,
    accompanyingPersons,
    selectedWorkshops,
    updateBasicDetails,
    setAccompanyingPersons,
    setSelectedWorkshops,
    skippedAccompanying,
    skippedWorkshops,
  } = useRegistrationStore();

  const [loading, setLoading] = useState(false);
  const [tempBasic, setTempBasic] = useState({ ...basicDetails });

  useEffect(() => {
    setTempBasic({ ...basicDetails });
  }, [basicDetails]);

  const regAmount = basicDetails?.registrationCategory?.amount || 0;

  const handleSubmit = async () => {
    if (
      !basicDetails.eventId ||
      !basicDetails.eventName ||
      !basicDetails.fullName ||
      !basicDetails.email ||
      !basicDetails.phone ||
      !basicDetails.registrationCategory?._id
    ) {
      toast.error("Please complete all required details before submitting.");
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file uploads
      const formData = new FormData();

      // 1. Add all basic fields as text
      formData.append(
        "registrationSlabId",
        basicDetails.registrationCategory?._id
      );
      formData.append("prefix", basicDetails.prefix || "");
      formData.append("name", basicDetails.fullName); // Changed from fullName to name
      formData.append("gender", basicDetails.gender || "");
      formData.append("email", basicDetails.email);
      formData.append("mobile", basicDetails.phone); // Changed from phone to mobile
      formData.append("designation", basicDetails.designation || "");
      formData.append("affiliation", basicDetails.affiliation || "");
      formData.append(
        "medicalCouncilState",
        basicDetails.medicalCouncilState || ""
      );
      formData.append(
        "medicalCouncilRegistration",
        basicDetails.medicalCouncilRegistration || ""
      );
      formData.append("mealPreference", basicDetails.mealPreference || "");
      formData.append("country", basicDetails.country);
      formData.append("city", basicDetails.city || "");
      formData.append("state", basicDetails.state || "");
      formData.append("address", basicDetails.address || "");
      formData.append("pincode", basicDetails.pincode || "");

      // 2. Prepare additionalAnswers for FormData
      const additionalAnswers: Array<{
        id: number;
        label: string;
        type: string;
        value: any;
        fileUrl: string | null;
      }> = [];

      // Check if we have file upload fields
      let hasFileUpload = false;

      if (
        basicDetails.registrationCategory?.needAdditionalInfo &&
        basicDetails.registrationCategory?.additionalFields
      ) {
        for (const field of basicDetails.registrationCategory
          .additionalFields) {
          const fieldId = field.id;
          const fieldValue =
            basicDetails.additionalAnswers?.[fieldId.toString()];
          const file = basicDetails.fileUploads?.[fieldId.toString()];

          const answerObj: any = {
            id: fieldId,
            label: field.label,
            type: field.type,
            value: null,
            fileUrl: null,
          };

          if (field.type === "upload") {
            if (file instanceof File) {
              // Add file to FormData - backend expects file_1, file_2, etc.
              const fileKey = `file_${fieldId}`;
              formData.append(fileKey, file);
              hasFileUpload = true;

              // For upload fields, value should be null
              answerObj.value = null;
              answerObj.fileUrl = null;
            } else if (fieldValue) {
              // If editing existing registration with already uploaded file
              answerObj.value = fieldValue;
            } else {
              // No file provided for required upload field
              toast.error(`File upload required for: ${field.label}`);
              throw new Error(`File upload required for: ${field.label}`);
            }
          } else if (field.type === "checkbox") {
            // Handle checkbox array
            const value = Array.isArray(fieldValue) ? fieldValue : [];
            answerObj.value = value.join(", ");
          } else {
            // For textbox, date, radio fields
            answerObj.value = fieldValue || "";
          }

          additionalAnswers.push(answerObj);
        }
      }

      // 3. Add additionalAnswers as JSON string
      formData.append("additionalAnswers", JSON.stringify(additionalAnswers));

      // 4. Log for debugging
      console.log("=== FORM DATA BEING SENT ===");
      console.log("Has file upload:", hasFileUpload);
      const formDataObj: Record<string, any> = {};
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataObj[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
          };
        } else if (key === "additionalAnswers") {
          try {
            formDataObj[key] = JSON.parse(value as string);
          } catch (e) {
            formDataObj[key] = value;
          }
        } else {
          formDataObj[key] = value;
        }
      }
      console.log("Complete FormData:", JSON.stringify(formDataObj, null, 2));
      console.log("=== END FORM DATA ===");

      // 5. Make API call with FormData (multipart/form-data)
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${basicDetails.eventId}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: Don't set Content-Type for FormData, browser will set it
          },
          body: formData,
        }
      );

      // 6. Handle response
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);

        // Handle specific errors
        if (errorData.message?.includes("already registered")) {
          throw new Error("You are already registered for this event");
        } else if (errorData.message?.includes("File upload required")) {
          throw new Error(errorData.message);
        } else {
          throw new Error(
            errorData.message || `Server error: ${response.status}`
          );
        }
      }

      const result = await response.json();

      if (result.success) {
        const registrationId = result.data?._id;

        if (registrationId) {
          // Update store with the registration ID if needed
          updateBasicDetails({
            ...basicDetails,
            registrationId: registrationId,
          });

          // Redirect to payment page
          router.push(
            `/registration/payment?registrationId=${registrationId}&eventId=${basicDetails.eventId}`
          );
        } else {
          throw new Error("No registration ID received");
        }
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration Error:", error);

      if (error instanceof Error) {
        if (error.message.includes("File upload required")) {
          toast.error(error.message);
          // Go back to step 1 to fix the file upload
          onBack();
        } else if (error.message.includes("already registered")) {
          toast.error("You are already registered for this event");
        } else {
          toast.error(error.message || "Something went wrong");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Basic Details */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#00509E] border-b-2 border-[#00509E] pb-1">
              Basic Details
            </h3>
            <Button
              className="bg-[#00509E] hover:bg-[#003B73] text-white transition-all duration-200 cursor-pointer"
              size="sm"
              onClick={() => onBack()}
            >
              ✎ Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { key: "prefix", label: "Prefix" },
              { key: "fullName", label: "Full Name" },
              { key: "phone", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "affiliation", label: "Affiliation" },
              { key: "designation", label: "Designation" },
              {
                key: "medicalCouncilRegistration",
                label: "Medical Council Registration",
              },
              { key: "medicalCouncilState", label: "Medical Council State" },
              { key: "address", label: "Address", span: 2 },
              { key: "country", label: "Country" },
              { key: "state", label: "State" },
              { key: "city", label: "City" },
              { key: "pincode", label: "Pincode" },
              { key: "mealPreference", label: "Meal Preference" },
              { key: "gender", label: "Gender" },
            ].map(({ key, label, span }) => (
              <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                <p className="text-gray-600 font-medium mb-1">{label}</p>
                <Input
                  value={(basicDetails as any)[key] || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            ))}

            {/* Registration Category Display */}
            <div className="sm:col-span-2">
              <p className="text-gray-600 font-medium mb-1">
                Registration Category
              </p>
              <Input
                value={
                  basicDetails.registrationCategory?.slabName || "Not selected"
                }
                disabled
                className="bg-gray-50 font-semibold"
              />
            </div>

            {/* Registration Amount Display */}
            <div>
              <p className="text-gray-600 font-medium mb-1">Registration Fee</p>
              <Input
                value={`₹ ${regAmount.toLocaleString("en-IN")}.00`}
                disabled
                className="bg-gray-50 font-semibold text-green-600"
              />
            </div>
          </div>

          {/* Display Additional Answers */}
          {basicDetails.additionalAnswers &&
            Object.keys(basicDetails.additionalAnswers).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {basicDetails.registrationCategory?.additionalFields?.map(
                    (field) => {
                      const value =
                        basicDetails.additionalAnswers?.[field.id.toString()];
                      const file =
                        basicDetails.fileUploads?.[field.id.toString()];

                      return (
                        <div key={field.id}>
                          <p className="text-gray-600 font-medium mb-1">
                            {field.label}
                            {field.type === "upload" && file && (
                              <span className="text-green-600 text-xs ml-2">
                                ✓ File attached
                              </span>
                            )}
                          </p>
                          {field.type === "upload" && file instanceof File ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={file.name}
                                disabled
                                className="bg-gray-50 flex-1"
                              />
                              <span className="text-xs text-gray-500">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                          ) : (
                            <Input
                              value={
                                Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value || "Not provided")
                              }
                              disabled
                              className="bg-gray-50"
                            />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#00509E] border-b-2 border-[#00509E] pb-1 mb-4">
            Order Summary
          </h3>
          <div className="text-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {currentEvent?.eventName
                  ? `${currentEvent.eventName} - ${
                      basicDetails?.registrationCategory?.slabName ||
                      "Registration"
                    }`
                  : basicDetails?.registrationCategory?.slabName ||
                    "Registration"}

                {!skippedAccompanying && accompanyingPersons.length > 0 && (
                  <span className="text-gray-500 text-xs ml-2">
                    + {accompanyingPersons.length} accompanying person(s)
                  </span>
                )}
              </span>
              <span className="font-semibold">
                ₹ {regAmount.toLocaleString("en-IN")}.00
              </span>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between items-center font-semibold text-base">
              <span className="text-gray-900">Total Amount</span>
              <span className="text-green-600">
                ₹ {regAmount.toLocaleString("en-IN")}.00
              </span>
            </div>
          </div>
        </section>

        {/* Confirm & Pay */}
        <div className="text-center pt-6">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#00509E] hover:bg-[#003B73] text-white transition-all duration-200 px-8 py-3 text-lg min-w-40 cursor-pointer"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            You will be redirected to secure payment page
          </p>
        </div>
      </div>
    </div>
  );
}
