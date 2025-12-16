"use client";

import { useEffect, useState } from "react";
import { useRegistrationStore } from "@/app/store/useRegistrationStore";
import { useEventStore } from "@/app/store/useEventStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Helper to format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Step4ConfirmPay({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { currentEvent } = useEventStore();

  const { basicDetails, updateBasicDetails } = useRegistrationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      // Create FormData for file uploads
      const formData = new FormData();

      const registrationSlabId = basicDetails.registrationCategory._id;

      // 1. Add registrationSlabId to query params
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${basicDetails.eventId}/register?registrationSlabId=${registrationSlabId}`;

      // 2. Add all basic fields as text
      formData.append("prefix", basicDetails.prefix || "");
      formData.append("name", basicDetails.fullName);
      formData.append("gender", basicDetails.gender || "");
      formData.append("email", basicDetails.email);
      formData.append("mobile", basicDetails.phone);
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

      // 3. Prepare dynamic form answers (Additional Registration Information)
      const dynamicFormAnswers: Array<{
        id: string;
        label: string;
        type: string;
        required: boolean;
        value: any;
        fileUrl: string | null;
      }> = [];

      // Track dynamic form files that need to be uploaded
      const dynamicFilesToUpload: Record<string, File> = {};

      if (basicDetails.dynamicFormAnswers?.length) {
        for (const answer of basicDetails.dynamicFormAnswers) {
          const file = basicDetails.dynamicFormFileUploads?.[answer.id];
          const answerObj: any = {
            id: answer.id,
            label: answer.label,
            type: answer.type,
            required: answer.required,
            // value: "", // CHANGED: Empty string as default
            // fileUrl: null,
          };

          // Check if this is a file upload field
          const isFileField =
            answer.type === "file" ||
            (answer.type === "input" && answer.inputTypes === "file");

          if (isFileField) {
            if (file instanceof File) {
              // File needs to be uploaded
              dynamicFilesToUpload[answer.id] = file;
              // For file fields, we DON'T include value or fileUrl in the JSON
              // The backend will get the file from formData
              delete answerObj.value;
              delete answerObj.fileUrl;
            } else if (answer.value && typeof answer.value === "string") {
              // Existing file URL (when editing existing registration)
              answerObj.value = answer.value;
              answerObj.fileUrl = answer.value;
            } else {
              // No file - still send the field info but without value
              delete answerObj.value;
              delete answerObj.fileUrl;
            }
          } else if (answer.type === "checkbox") {
            answerObj.value = Array.isArray(answer.value)
              ? answer.value
              : [answer.value].filter(Boolean);
          } else {
            // For text fields
            answerObj.value = answer.value || "";
          }

          // Add additional properties if they exist
          if (answer.inputTypes && !isFileField) {
            answerObj.inputTypes = answer.inputTypes;
          }
          if (answer.options) {
            answerObj.options = answer.options;
          }

          dynamicFormAnswers.push(answerObj);
        }

        // Add dynamic form files to FormData if any
        Object.entries(dynamicFilesToUpload).forEach(([fieldId, file]) => {
          const fileKey = `file_dyn_${fieldId}`;
          formData.append(fileKey, file);
        });

        formData.append(
          "dynamicFormAnswers",
          JSON.stringify(dynamicFormAnswers)
        );
      }

      // 4. Prepare additionalAnswers (Registration Slab Additional Info)
      const additionalAnswers: Array<{
        id: number;
        label: string;
        type: string;
        value: any;
        fileUrl: string | null;
      }> = [];

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
            value: "", // CHANGED: Empty string as default
            fileUrl: null,
          };

          if (field.type === "upload") {
            if (file instanceof File) {
              // Add file to FormData - backend expects file_<id>
              const fileKey = `file_${fieldId}`;
              formData.append(fileKey, file);
              answerObj.value = ""; // CHANGED: Empty string
              answerObj.fileUrl = ""; // CHANGED: Empty string
            } else if (fieldValue && typeof fieldValue === "string") {
              // Existing file URL
              answerObj.value = fieldValue;
              answerObj.fileUrl = fieldValue;
            } else {
              // No file uploaded
              answerObj.value = ""; // CHANGED: Empty string
              answerObj.fileUrl = ""; // CHANGED: Empty string
            }
          } else if (field.type === "checkbox") {
            answerObj.value = Array.isArray(fieldValue)
              ? fieldValue // Keep as array for checkbox
              : fieldValue || "";
          } else {
            answerObj.value = fieldValue || "";
          }

          additionalAnswers.push(answerObj);
        }
      }

      // Add additionalAnswers as JSON string (only if there are answers)
      if (additionalAnswers.length > 0) {
        formData.append("additionalAnswers", JSON.stringify(additionalAnswers));
      } else {
        // Send empty array if no additional answers
        formData.append("additionalAnswers", "[]");
      }

      // 5. Make API call with FormData
      const token = localStorage.getItem("accessToken");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // 6. Handle response
      let result;
      try {
        const text = await response.text();

        // Check if response is HTML (error page)
        if (
          text.trim().startsWith("<!DOCTYPE") ||
          text.trim().startsWith("<html")
        ) {
          throw new Error("Server error: Please try again later.");
        }

        // Try to parse as JSON
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new Error("Invalid server response");
        }
      } catch (parseError) {
        throw new Error("Failed to process server response");
      }

      if (!response.ok) {
        let errorMessage = "Registration failed. Please try again.";

        if (result?.message) {
          errorMessage = result.message;
        } else if (result?.error) {
          errorMessage = result.error;
        }

        // Check for specific file upload errors
        if (
          errorMessage.toLowerCase().includes("file") ||
          errorMessage.toLowerCase().includes("upload") ||
          errorMessage.toLowerCase().includes("required")
        ) {
          // Go back to fix file uploads
          onBack();
        }

        throw new Error(errorMessage);
      }

      if (result.success) {
        const registrationId = result.data?._id;

        if (registrationId) {
          // Update store with the registration ID
          updateBasicDetails({
            ...basicDetails,
            registrationId: registrationId,
          });

          // Clear localStorage draft
          localStorage.removeItem(`registration-draft-${basicDetails.eventId}`);

          // Redirect to payment page
          router.push(
            `/registration/payment?registrationId=${registrationId}&eventId=${basicDetails.eventId}`
          );
          // toast.success("Registration created successfully!");
        } else {
          throw new Error("No registration ID received");
        }
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");

      if (error instanceof Error) {
        const errorMsg = error.message;

        if (
          errorMsg.includes("File") ||
          errorMsg.includes("upload") ||
          errorMsg.includes("required") ||
          errorMsg.includes("size")
        ) {
          toast.error(errorMsg, { duration: 5000 });
          onBack();
        } else {
          toast.error(errorMsg);
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Details */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#00509E]">
              Basic Details
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBack()}
              className="cursor-pointer"
            >
              ✎ Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "prefix", label: "Prefix" },
              { key: "fullName", label: "Full Name" },
              { key: "phone", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "affiliation", label: "Affiliation" },
              { key: "designation", label: "Designation" },
              { key: "address", label: "Address", span: 2 },
              { key: "country", label: "Country" },
              { key: "state", label: "State" },
              { key: "city", label: "City" },
              { key: "pincode", label: "Pincode" },
              { key: "mealPreference", label: "Meal Preference" },
              { key: "gender", label: "Gender" },
            ].map(({ key, label, span }) => (
              <div key={key} className={span === 2 ? "sm:col-span-2" : ""}>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {label}
                </p>
                <Input
                  value={(basicDetails as any)[key] || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            ))}

            {/* Registration Category Display */}
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Registration Category
              </p>
              <Input
                value={
                  basicDetails.registrationCategory?.slabName || "Not selected"
                }
                disabled
                className="bg-gray-50 font-medium"
              />
            </div>

            {/* Registration Amount Display */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Registration Fee
              </p>
              <Input
                value={`₹ ${regAmount.toLocaleString("en-IN")}.00`}
                disabled
                className="bg-gray-50 font-medium text-green-600"
              />
            </div>
          </div>

          {/* Display Additional Answers */}
          {basicDetails.additionalAnswers &&
            Object.keys(basicDetails.additionalAnswers).length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {basicDetails.registrationCategory?.additionalFields?.map(
                    (field) => {
                      const value =
                        basicDetails.additionalAnswers?.[field.id.toString()];
                      const file =
                        basicDetails.fileUploads?.[field.id.toString()];

                      return (
                        <div key={field.id}>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            {field.label}
                          </p>
                          {field.type === "upload" && file instanceof File ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={file.name}
                                disabled
                                className="bg-gray-50"
                              />
                              <span className="text-sm text-gray-500">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                          ) : field.type === "checkbox" ? (
                            <Input
                              value={
                                Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value || "Not provided")
                              }
                              disabled
                              className="bg-gray-50"
                            />
                          ) : (
                            <Input
                              value={String(value || "Not provided")}
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

          {/* Display Dynamic Form Answers */}
          {basicDetails.dynamicFormAnswers &&
            basicDetails.dynamicFormAnswers.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Additional Registration Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {basicDetails.dynamicFormAnswers.map((answer) => {
                    const file =
                      basicDetails.dynamicFormFileUploads?.[answer.id];

                    return (
                      <div key={answer.id}>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {answer.label}
                          {answer.required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </p>

                        {answer.type === "file" ? (
                          file instanceof File ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={file.name}
                                disabled
                                className="bg-gray-50"
                              />
                              <span className="text-sm text-gray-500">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                          ) : answer.value ? (
                            <Input
                              value="File uploaded previously"
                              disabled
                              className="bg-gray-50"
                            />
                          ) : (
                            <Input
                              value="No file selected"
                              disabled
                              className="bg-gray-50"
                            />
                          )
                        ) : answer.type === "checkbox" ? (
                          <Input
                            value={
                              Array.isArray(answer.value)
                                ? answer.value.join(", ")
                                : String(answer.value || "Not provided")
                            }
                            disabled
                            className="bg-gray-50"
                          />
                        ) : (
                          <Input
                            value={String(answer.value || "Not provided")}
                            disabled
                            className="bg-gray-50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </section>

        {/* Order Summary */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#00509E]">
            Order Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {currentEvent?.eventName
                  ? `${currentEvent.eventName} - ${
                      basicDetails?.registrationCategory?.slabName ||
                      "Registration"
                    }`
                  : basicDetails?.registrationCategory?.slabName ||
                    "Registration"}
              </span>
              <span className="font-semibold">
                ₹ {regAmount.toLocaleString("en-IN")}.00
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span className="text-gray-900">Total Amount</span>
                <span className="text-green-600">
                  ₹ {regAmount.toLocaleString("en-IN")}.00
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Confirm & Pay */}
        <div className="text-center pt-6">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#00509E] hover:bg-[#003B73] text-white px-8 py-3 text-lg min-w-40 cursor-pointer"
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
          <p className="text-sm text-gray-500 mt-3">
            You will be redirected to secure payment page
          </p>
        </div>
      </div>
    </div>
  );
}
