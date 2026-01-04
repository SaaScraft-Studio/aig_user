"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useAccompanyingStore } from "@/app/store/useAccompanyingStore";
import { useRegistrationStore } from "@/app/store/useRegistrationStore";
import { toast } from "sonner";

const personSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  relation: z.string().min(1, "Relation is required"),
  age: z
    .string()
    .min(1, "Age is required")
    .refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
      "Age must be a valid number"
    ),
  gender: z.enum(["Male", "Female", "Other"]),
  mealPreference: z.string().min(1, "Meal preference is required"),
});

const formSchema = z.object({
  people: z.array(personSchema),
});

type FormData = z.infer<typeof formSchema>;

type MealPreference = {
  _id: string;
  eventId: string;
  mealName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

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

type Props = {
  eventId?: string | null;
  registrationId?: string | null;
  mainAccompanyId?: string | null;
  open: boolean;
  onClose: () => void;
  editingPerson?: AccompanyPerson | null;
  onSuccess?: () => void;
};

// Razorpay script loading function
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(script);
  });
};

export default function AccompanyingFormSidebar({
  eventId,
  registrationId,
  mainAccompanyId,
  open,
  onClose,
  editingPerson,
  onSuccess,
}: Props) {
  const { people, addPerson, updatePerson } = useAccompanyingStore();
  const { basicDetails } = useRegistrationStore();
  const [submitting, setSubmitting] = useState(false);
  const [mealPreferences, setMealPreferences] = useState<MealPreference[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [accompanyAmount, setAccompanyAmount] = useState<number | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [loadingSlabs, setLoadingSlabs] = useState(false);

  // Fetch accompanying amount from the specific API
  const fetchAccompanyAmount = async (
    eventId: string,
    registrationId: string
  ) => {
    try {
      setLoadingSlabs(true);
      setAmountError(null);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accompanies/${eventId}/${registrationId}/amount`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success && data.data) {
        setAccompanyAmount(data.data.accompanyAmount || 0);
      } else {
        console.error("Failed to fetch accompany amount:", data);
        setAccompanyAmount(null);
        setAmountError("Unable to fetch accompanying fee. Please try again.");
        toast.error("Failed to load accompanying fee information");
      }
    } catch (err) {
      console.error("GET accompany amount error:", err);
      setAccompanyAmount(null);
      setAmountError(
        "Network error. Please check your connection and try again."
      );
      toast.error("Failed to load accompanying fee");
    } finally {
      setLoadingSlabs(false);
    }
  };

  // Fetch meal preferences
  const fetchMealPreferences = async (eventId: string) => {
    try {
      setLoadingMeals(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/meal-preferences/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch meal preferences");
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setMealPreferences(data.data);
      } else {
        console.error("Failed to fetch meal preferences:", data);
        // Fallback to default options if API fails
        setMealPreferences([
          {
            _id: "1",
            eventId: eventId,
            mealName: "Vegetarian",
            status: "Active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
          {
            _id: "2",
            eventId: eventId,
            mealName: "Non-Vegetarian",
            status: "Active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
        ]);
      }
    } catch (err) {
      console.error("GET meal preferences error:", err);
      // Fallback to default options
      setMealPreferences([
        {
          _id: "1",
          eventId: eventId,
          mealName: "Vegetarian",
          status: "Active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        },
        {
          _id: "2",
          eventId: eventId,
          mealName: "Non-Vegetarian",
          status: "Active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        },
      ]);
    } finally {
      setLoadingMeals(false);
    }
  };

  // Payment initiation function
  const initiateAccompanyPayment = async (
    accompanyId: string,
    accompanyItemIds: string, // Add this parameter
    amount: number
  ) => {
    try {
      // Load Razorpay script first
      await loadRazorpayScript();

      const token = localStorage.getItem("accessToken");

      // Create payment order with accompanyItemIds
      const paymentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/accompany/create-order/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            eventRegistrationId: registrationId,
            accompanyId: accompanyId,
            accompanyItemIds: accompanyItemIds, // Add this field
            amount: amount,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(
          paymentData.message || "Failed to create payment order"
        );
      }

      // Double check if Razorpay is available
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK still not loaded after waiting");
      }

      // Initialize Razorpay payment with the key from API response
      const options = {
        key: paymentData.data.razorpayKeyId,
        amount: paymentData.data.amount * 100,
        currency: paymentData.data.currency || "INR",
        name: "Accompanying Registration",
        description: "Accompanying Persons Payment",
        order_id: paymentData.data.orderId,
        handler: async function (response: any) {
          await verifyAccompanyPayment(
            response,
            paymentData.data.paymentId,
            accompanyId
          );
        },
        prefill: {
          name: basicDetails.fullName || "",
          email: basicDetails.email || "",
          contact: basicDetails.phone || "",
        },
        theme: {
          color: "#00509E",
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled. You can complete payment later.");
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to initiate payment: " + (error as Error).message);
    }
  };

  // Payment verification function
  const verifyAccompanyPayment = async (
    razorpayResponse: any,
    paymentId: string,
    accompanyId: string
  ) => {
    try {
      const token = localStorage.getItem("accessToken");

      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/accompany/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
            paymentId: paymentId,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        toast.success("Payment successful! Accompanying persons added.");
        onClose();
        if (onSuccess) onSuccess();
        // window.location.reload();
      } else {
        throw new Error(verifyData.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
    }
  };

  // Fetch both meal preferences and accompanying amount when sidebar opens
  useEffect(() => {
    if (open && eventId) {
      fetchMealPreferences(eventId);

      // Only fetch accompany amount when NOT editing (i.e., adding new persons)
      if (!editingPerson && registrationId) {
        fetchAccompanyAmount(eventId, registrationId);
      } else if (!editingPerson && eventId) {
        // Fallback if no registrationId - set error state only for adding
        setAccompanyAmount(null);
        setAmountError(
          "Registration ID is required to fetch accompanying fee."
        );
      } else {
        // When editing, we don't need the amount, so clear it
        setAccompanyAmount(null);
        setAmountError(null);
      }
    }
  }, [open, eventId, registrationId, editingPerson]);

  const defaultValues = editingPerson
    ? [
        {
          name: editingPerson.fullName,
          relation: editingPerson.relation,
          age: String(editingPerson.age),
          gender: editingPerson.gender as "Male" | "Female" | "Other",
          mealPreference: editingPerson.mealPreference,
        },
      ]
    : [
        {
          name: "",
          relation: "",
          age: "",
          gender: "Female" as const,
          mealPreference: "",
        },
      ];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      people: defaultValues as any,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "people",
  });

  // useEffect(() => {
  //   if (editingPerson && open) {
  //     console.log(
  //       "Editing person meal preference:",
  //       editingPerson.mealPreference
  //     );
  //     console.log("Available meal preferences:", mealPreferences);
  //     console.log(
  //       "Form meal preference value:",
  //       watch("people.0.mealPreference")
  //     );
  //   }
  // }, [editingPerson, open, mealPreferences, watch]);

  useEffect(() => {
    if (editingPerson && open && mealPreferences.length > 0) {
      reset({
        people: [
          {
            name: editingPerson.fullName,
            relation: editingPerson.relation,
            age: String(editingPerson.age),
            gender: editingPerson.gender as "Male" | "Female" | "Other",
            mealPreference: editingPerson.mealPreference,
          },
        ],
      });

      // Force set the meal preference after reset to ensure it's properly set
      setTimeout(() => {
        setValue("people.0.mealPreference", editingPerson.mealPreference);
      }, 100);
    } else if (open) {
      reset({
        people: [
          {
            name: "",
            relation: "",
            age: "",
            gender: "Female",
            mealPreference: "",
          },
        ],
      });
    }
  }, [editingPerson, reset, open, setValue, mealPreferences]);

  const onSubmit = async (data: FormData) => {
    // Only check accompanyAmount for adding new persons, not for editing
    if (!editingPerson && accompanyAmount === null) {
      toast.error(
        "Cannot proceed. Accompanying fee information is not available."
      );
      return;
    }

    try {
      setSubmitting(true);

      // If we have eventId and registrationId, save to backend FIRST
      if (eventId && registrationId) {
        const token = localStorage.getItem("accessToken");

        if (editingPerson) {
          // Only validate mainAccompanyId for editing, not for adding
          if (
            !mainAccompanyId ||
            (editingPerson && mainAccompanyId === editingPerson._id)
          ) {
            console.error("Invalid mainAccompanyId:", mainAccompanyId);
            toast.error("Invalid accompany record ID");
            return;
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accompanies/${mainAccompanyId}/edit`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                accompanies: [
                  {
                    _id: editingPerson._id, // Use the accompany item _id
                    fullName: data.people[0].name,
                    relation: data.people[0].relation,
                    age: Number(data.people[0].age),
                    gender: data.people[0].gender,
                    mealPreference: data.people[0].mealPreference,
                  },
                ],
              }),
            }
          );

          const result = await response.json();

          if (!result.success) {
            throw new Error(
              result.message || "Failed to update accompanying person"
            );
          }

          toast.success("Person updated successfully!");
          onClose();
          if (onSuccess) onSuccess();
          // window.location.reload(); // Reload to reflect changes
        } else {
          // ADD NEW PERSON - Use the add endpoint (no mainAccompanyId validation needed)
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accompanies/${eventId}/${registrationId}/add`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                accompanies: data.people.map((person) => ({
                  fullName: person.name,
                  relation: person.relation,
                  age: Number(person.age),
                  gender: person.gender,
                  mealPreference: person.mealPreference,
                })),
              }),
            }
          );

          const result = await response.json();

          if (!result.success) {
            throw new Error(
              result.message || "Failed to save accompanying persons"
            );
          }

          // Only initiate payment for NEW additions when amount > 0
          if (
            accompanyAmount &&
            accompanyAmount > 0 &&
            result.data &&
            result.data._id
          ) {
            // Extract ONLY the newly added accompanyItemIds from the response
            const allAccompanies = result.data.accompanies || [];
            const newlyAddedAccompanies = allAccompanies.slice(-fields.length);
            const accompanyItemIds = newlyAddedAccompanies.map(
              (acc: any) => acc._id
            );

            await initiateAccompanyPayment(
              result.data._id,
              accompanyItemIds,
              total
            );
          } else {
            // If no payment required, show success and close
            toast.success("Persons added successfully!");
            onClose();
            if (onSuccess) onSuccess();
          }
        }
      } else {
        // Update local store only (for demo/testing)
        data.people.forEach((p) => {
          const parsed = {
            id: p.id ?? Date.now(),
            name: p.name,
            relation: p.relation,
            age: Number(p.age),
            gender: p.gender,
            mealPreference: p.mealPreference,
          };
          if (editingPerson) updatePerson(parsed.id, parsed);
          else addPerson(parsed);
        });

        toast.success(
          editingPerson
            ? "Person updated successfully!"
            : "Persons added successfully!"
        );
        onClose();
      }
    } catch (error) {
      console.error("Error saving accompanying persons:", error);
      toast.error("Failed to save accompanying persons");
    } finally {
      setSubmitting(false);
    }
  };

  const total =
    !editingPerson && accompanyAmount !== null
      ? fields.length * accompanyAmount
      : 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-[40vw] sm:max-w-[40vw] md:w-[35vw] md:max-w-[35vw] lg:w-[30vw] lg:max-w-[30vw] flex flex-col p-0 border-l border-gray-200 transition-all duration-300 ease-in-out"
      >
        <SheetHeader className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
          <SheetTitle className="text-lg font-semibold text-[#00509E]">
            {editingPerson ? "Edit" : "Add"} Accompanying Person
            {fields.length > 1 ? "s" : ""}
          </SheetTitle>
        </SheetHeader>
        {/* Scrollable form section */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50"
          id="accompanying-form"
        >
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="bg-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-[#00509E]">
                  Person {idx + 1}
                </p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-gray-400 hover:text-red-600 text-lg font-bold leading-none cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor={`name-${idx}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </Label>
                  <Input
                    id={`name-${idx}`}
                    {...register(`people.${idx}.name`)}
                    className={
                      errors.people?.[idx]?.name ? "border-red-500" : ""
                    }
                  />
                  {errors.people?.[idx]?.name && (
                    <p className="text-red-500 text-xs">
                      {errors.people[idx]?.name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`relation-${idx}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Relation *
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      setValue(`people.${idx}.relation`, val)
                    }
                    value={watch(`people.${idx}.relation`)}
                  >
                    <SelectTrigger
                      id={`relation-${idx}`}
                      className={`w-full cursor-pointer ${
                        errors.people?.[idx]?.relation ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wife">Wife</SelectItem>
                      <SelectItem value="Husband">Husband</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.people?.[idx]?.relation && (
                    <p className="text-red-500 text-xs">
                      {errors.people[idx]?.relation?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`age-${idx}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Age *
                  </Label>
                  <Input
                    id={`age-${idx}`}
                    type="number"
                    {...register(`people.${idx}.age`)}
                    className={
                      errors.people?.[idx]?.age ? "border-red-500" : ""
                    }
                  />
                  {errors.people?.[idx]?.age && (
                    <p className="text-red-500 text-xs">
                      {errors.people[idx]?.age?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`gender-${idx}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Gender *
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      setValue(`people.${idx}.gender`, val as any)
                    }
                    value={watch(`people.${idx}.gender`)}
                  >
                    <SelectTrigger
                      id={`gender-${idx}`}
                      className="w-full cursor-pointer"
                    >
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor={`meal-${idx}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Meal Preference *
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      setValue(`people.${idx}.mealPreference`, val)
                    }
                    value={watch(`people.${idx}.mealPreference`)}
                    disabled={loadingMeals}
                  >
                    <SelectTrigger
                      id={`meal-${idx}`}
                      className="w-full cursor-pointer"
                    >
                      <SelectValue
                        placeholder={
                          loadingMeals
                            ? "Loading meal preferences..."
                            : "Select Meal Preference"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPreferences.map((meal) => (
                        <SelectItem key={meal._id} value={meal.mealName}>
                          {meal.mealName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.people?.[idx]?.mealPreference && (
                    <p className="text-red-500 text-xs">
                      {errors.people[idx]?.mealPreference?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!editingPerson && accompanyAmount === null && !loadingSlabs && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Unable to load accompanying fee information
              </p>
              <p className="text-red-600 text-xs mt-1">
                Please refresh the page or contact support if the issue
                persists.
              </p>
            </div>
          )}
          {!editingPerson && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-[#00509E] text-[#00509E] hover:bg-[#00509E] hover:text-white gap-2 border-dashed"
              onClick={() =>
                append({
                  name: "",
                  relation: "",
                  age: "",
                  gender: "Female",
                  mealPreference: "",
                })
              }
            >
              <PlusCircle className="h-4 w-4" />
              Add Another Person
            </Button>
          )}
        </form>
        {/* Fixed footer */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {fields.length} person{fields.length !== 1 ? "s" : ""}
            </div>

            {/* Only show amount section when NOT editing (i.e., adding new persons) */}
            {!editingPerson && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#00509E]">
                  {accompanyAmount !== null ? (
                    `₹ ${total.toLocaleString("en-IN")}.00`
                  ) : (
                    <span className="text-red-500 text-lg">
                      Fee not available
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {loadingSlabs ? (
                    "Loading fee..."
                  ) : accompanyAmount !== null ? (
                    accompanyAmount > 0 ? (
                      <>
                        ₹ {accompanyAmount.toLocaleString("en-IN")}.00 per
                        person
                        <div className="text-xs text-blue-600 mt-1">
                          Payment required after adding
                        </div>
                      </>
                    ) : (
                      "No accompanying fee"
                    )
                  ) : (
                    <span className="text-red-500">Unable to load fee</span>
                  )}
                </div>
                {amountError && (
                  <div className="text-xs text-red-500 mt-1">{amountError}</div>
                )}
              </div>
            )}
          </div>

          {/* Button section - show different text based on editing vs adding */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="accompanying-form"
              className="flex-1 bg-[#00509E] hover:bg-[#003B73]"
              disabled={
                submitting ||
                loadingMeals ||
                (loadingSlabs && !editingPerson) || // Only disable for loading slabs when adding
                (accompanyAmount === null && !editingPerson) || // Only require amount when adding
                fields.length === 0
              }
            >
              {submitting
                ? "Processing..."
                : editingPerson
                ? "Update"
                : accompanyAmount && accompanyAmount > 0
                ? "Add & Pay"
                : "Add Persons"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
