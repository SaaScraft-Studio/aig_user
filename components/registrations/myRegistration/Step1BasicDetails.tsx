// components/registrations/myRegistration/Step1BasicDetails.tsx
"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegistrationCategory,
  useRegistrationStore,
} from "@/app/store/useRegistrationStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import CountryStateCitySelect from "@/components/common/CountryStateCitySelect";
import { useEventStore } from "@/app/store/useEventStore";
import { medicalCouncils } from "@/app/data/medicalCouncils";
import { formatValidTill } from "@/app/utils/formatEventDate";

// Base schema
const baseSchema = z.object({
  prefix: z.string().min(1, "Prefix is required"),
  fullName: z.string().min(1, "Full Name is required"),
  phone: z.string().regex(/^\d{10}$/, { message: "Mobile must be 10 digits" }),
  email: z.string().email("Invalid email"),
  affiliation: z.string().min(1, "Affiliation is required"),
  designation: z.string().min(1, "Designation is required"),
  medicalCouncilRegistration: z.string().min(1, "Registration is required"),
  medicalCouncilState: z.string().min(1, "Medical Council State is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  gender: z.string().min(1, "Gender is required"),
  mealPreference: z.string().min(1, "Please select a meal preference"),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms and conditions",
  }),
  registrationCategory: z.object({
    _id: z.string(),
    slabName: z.string(),
    amount: z.number(),
    needAdditionalInfo: z.boolean().optional(),
    additionalFields: z.array(z.any()).optional(),
  }),
});

// Function to create dynamic schema
const createDynamicSchema = (category: RegistrationCategory | null) => {
  if (!category?.needAdditionalInfo || !category.additionalFields?.length) {
    return baseSchema;
  }

  // Create a fresh schema object
  const schemaFields: any = {
    prefix: z.string().min(1, "Prefix is required"),
    fullName: z.string().min(1, "Full Name is required"),
    phone: z
      .string()
      .regex(/^\d{10}$/, { message: "Mobile must be 10 digits" }),
    email: z.string().email("Invalid email"),
    affiliation: z.string().min(1, "Affiliation is required"),
    designation: z.string().min(1, "Designation is required"),
    medicalCouncilRegistration: z.string().min(1, "Registration is required"),
    medicalCouncilState: z.string().min(1, "Medical Council State is required"),
    address: z.string().min(1, "Address is required"),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    pincode: z.string().min(1, "Pincode is required"),
    gender: z.string().min(1, "Gender is required"),
    mealPreference: z.string().min(1, "Please select a meal preference"),
    acceptedTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms and conditions",
    }),
    registrationCategory: z.object({
      _id: z.string(),
      slabName: z.string(),
      amount: z.number(),
      needAdditionalInfo: z.boolean().optional(),
      additionalFields: z.array(z.any()).optional(),
    }),
  };

  // Add dynamic fields
  category.additionalFields.forEach((field) => {
    const fieldKey = `additional_${field.id}`;

    switch (field.type) {
      case "textbox":
      case "date":
      case "radio":
        schemaFields[fieldKey] = z
          .string()
          .min(1, `${field.label} is required`);
        break;
      case "checkbox":
        schemaFields[fieldKey] = z
          .array(z.string())
          .min(1, `Please select at least one option for ${field.label}`);
        break;
      case "upload":
        // For upload fields, we'll handle validation separately
        schemaFields[fieldKey] = z.any().optional();
        break;
      default:
        schemaFields[fieldKey] = z.string().optional();
    }
  });

  return z.object(schemaFields);
};

type DynamicSchema = ReturnType<typeof createDynamicSchema>;
type FormDataType = z.infer<DynamicSchema>;

type MealPreference = {
  _id: string;
  eventId: string;
  mealName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export default function Step1BasicDetails({ onNext }: { onNext: () => void }) {
  const { basicDetails, updateBasicDetails } = useRegistrationStore();
  const { currentEvent } = useEventStore();
  const [categories, setCategories] = useState<RegistrationCategory[]>([]);
  const [mealPreferences, setMealPreferences] = useState<MealPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [terms, setTerms] = useState<any[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<RegistrationCategory | null>(null);
  const [dynamicSchema, setDynamicSchema] = useState<DynamicSchema>(() =>
    createDynamicSchema(null)
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      ...basicDetails,
      ...(basicDetails.additionalAnswers || {}),
    } as any,
  });

  // Prefill form
  useEffect(() => {
    const defaultValues: any = { ...basicDetails };

    // Add additional answers to form values
    if (basicDetails.additionalAnswers) {
      Object.entries(basicDetails.additionalAnswers).forEach(([key, value]) => {
        defaultValues[`additional_${key}`] = value;
      });
    }

    reset(defaultValues);

    if (basicDetails.registrationCategory) {
      setSelectedCategory(basicDetails.registrationCategory);
      const newSchema = createDynamicSchema(basicDetails.registrationCategory);
      setDynamicSchema(newSchema);
    }
  }, [basicDetails, reset]);

  // Update schema when category changes
  const updateDynamicSchema = (category: RegistrationCategory | null) => {
    const newSchema = createDynamicSchema(category);
    setDynamicSchema(newSchema);
  };

  // In Step1BasicDetails.tsx - in the onSubmit function
  const onSubmit: SubmitHandler<FormDataType> = (data) => {
    const additionalAnswers: Record<string, any> = {};
    const fileUploads: Record<string, File> = {};

    if (data.registrationCategory?.needAdditionalInfo) {
      Object.keys(data).forEach((key) => {
        if (key.startsWith("additional_")) {
          const fieldId = key.replace("additional_", "");
          const value = (data as any)[key];

          // Check if it's a file
          if (value instanceof File) {
            fileUploads[fieldId] = value;
            additionalAnswers[fieldId] = null; // Store null for file fields
          } else {
            additionalAnswers[fieldId] = value;
          }
        }
      });
    }

    // Save to store
    updateBasicDetails({
      ...data,
      additionalAnswers,
      fileUploads,
      eventId: currentEvent?._id || "",
      eventName: currentEvent?.eventName || "",
    } as any);

    toast.success("Details saved!");
    onNext();
  };

  const handleCategorySelect = (category: RegistrationCategory) => {
    setSelectedCategory(category);
    setValue("registrationCategory", category);
    updateDynamicSchema(category);

    // Clear previous additional answers when category changes
    if (category?.needAdditionalInfo && category.additionalFields) {
      category.additionalFields.forEach((field) => {
        const fieldKey = `additional_${field.id}`;
        if (field.type === "checkbox") {
          setValue(fieldKey as any, []);
        } else {
          setValue(fieldKey as any, "");
        }
      });
    }
  };

  // Render additional fields
  const renderAdditionalFields = () => {
    if (
      !selectedCategory?.needAdditionalInfo ||
      !selectedCategory.additionalFields?.length
    ) {
      return null;
    }

    return (
      <div className="mt-6 p-6 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-[#00509E] mb-4">
          Additional Information Required
        </h3>
        <div className="space-y-4">
          {selectedCategory.additionalFields.map((field) => {
            const fieldKey = `additional_${field.id}`;
            const isRequired = ["textbox", "date", "radio", "upload"].includes(
              field.type
            );

            return (
              <div key={field.id} className="space-y-2">
                <Label className="font-medium">
                  {field.label}
                  {isRequired && <span className="text-red-600"> *</span>}
                </Label>

                {field.type === "textbox" && (
                  <Input
                    {...register(fieldKey as any)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="bg-white"
                  />
                )}

                {field.type === "date" && (
                  <Input
                    type="date"
                    {...register(fieldKey as any)}
                    className="bg-white"
                  />
                )}

                {field.type === "radio" && field.options && (
                  <div className="space-y-2">
                    {field.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          value={option.label}
                          {...register(fieldKey as any)}
                          className="text-[#00509E]"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === "checkbox" && field.options && (
                  <div className="space-y-2">
                    {field.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={option.label}
                          onChange={(e) => {
                            const currentValues = watch(fieldKey as any) || [];
                            if (e.target.checked) {
                              setValue(fieldKey as any, [
                                ...currentValues,
                                option.label,
                              ]);
                            } else {
                              setValue(
                                fieldKey as any,
                                currentValues.filter(
                                  (v: string) => v !== option.label
                                )
                              );
                            }
                          }}
                          className="text-[#00509E] rounded"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === "upload" && (
                  <div>
                    <Input
                      type="file"
                      accept={`.${field.extension || "*"}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue(fieldKey as any, file);
                        }
                      }}
                      className="bg-white"
                    />
                    {field.extension && (
                      <p className="text-sm text-gray-500 mt-1">
                        Upload .{field.extension} file only
                      </p>
                    )}
                  </div>
                )}

                {(errors as any)[fieldKey] && (
                  <p className="text-sm text-red-600">
                    {(errors as any)[fieldKey]?.message as string}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Fetch meal preferences based on event ID
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

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setMealPreferences(data.data);
      } else {
        console.error("Failed to fetch meal preferences:", data);
        toast.error("Failed to load meal preferences");
        // Fallback to default options if API fails
        setMealPreferences([
          {
            _id: "1",
            mealName: "Vegetarian",
            status: "Active",
          } as MealPreference,
          {
            _id: "2",
            mealName: "Non-Vegetarian",
            status: "Active",
          } as MealPreference,
          { _id: "3", mealName: "Vegan", status: "Active" } as MealPreference,
        ]);
      }
    } catch (err) {
      console.error("GET meal preferences error:", err);
      toast.error("Error loading meal preferences");
      // Fallback to default options
      setMealPreferences([
        {
          _id: "1",
          mealName: "Vegetarian",
          status: "Active",
        } as MealPreference,
        {
          _id: "2",
          mealName: "Non-Vegetarian",
          status: "Active",
        } as MealPreference,
        { _id: "3", mealName: "Vegan", status: "Active" } as MealPreference,
      ]);
    } finally {
      setLoadingMeals(false);
    }
  };

  const fetchTerms = async (eventId: string) => {
    try {
      setTermsLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/terms-and-conditions`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) {
        // treat 404 / not-found as empty list
        setTerms([]);
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setTerms(data.data);
      } else {
        setTerms([]);
      }
    } catch (err) {
      console.error("GET terms error:", err);
      setTerms([]);
    } finally {
      setTermsLoading(false);
    }
  };

  // Fetch registration slabs based on event ID
  useEffect(() => {
    async function fetchRegistrationSlabs() {
      if (!currentEvent?._id) {
        return;
      }

      try {
        setLoading(true);

        // Fetch meal preferences first
        await fetchMealPreferences(currentEvent._id);

        // Then fetch registration slabs
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${currentEvent._id}/slabs/active`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const transformedCategories = data.data.map((slab: any) => ({
            _id: slab._id,
            slabName: slab.slabName,
            amount: slab.amount,
            AccompanyAmount: slab.AccompanyAmount,
            needAdditionalInfo: slab.needAdditionalInfo,
            additionalFields: slab.additionalFields,
            startDate: slab.startDate,
            endDate: slab.endDate,
          }));

          setCategories(transformedCategories);
          fetchTerms(currentEvent._id);
        } else {
          console.error("Invalid response format:", data);
          toast.error("Failed to load registration options");
        }
      } catch (err) {
        console.error("GET registration slabs error:", err);
        toast.error("Error loading registration options");
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrationSlabs();
  }, [currentEvent?._id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="prefix">
            Prefix <span className="text-red-600">*</span>
          </Label>
          <Input
            id="prefix"
            placeholder="Eg: Dr, Mr, Ms"
            {...register("prefix")}
          />
          {errors.prefix && (
            <p className="text-sm text-red-600">
              {typeof errors.prefix.message === "string"
                ? errors.prefix.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Full Name <span className="text-red-600">*</span>
          </Label>
          <Input {...register("fullName")} />
          {errors.fullName && (
            <p className="text-sm text-red-600">
              {typeof errors.fullName.message === "string"
                ? errors.fullName.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Gender <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-sm text-red-600">
              {typeof errors.gender.message === "string"
                ? errors.gender.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Email Id <span className="text-red-600">*</span>
          </Label>
          <Input {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">
              {typeof errors.email.message === "string"
                ? errors.email.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Mobile No. <span className="text-red-600">*</span>
          </Label>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            {...register("phone")}
            onInput={(e) => {
              let val = e.currentTarget.value.replace(/\D/g, "");
              if (val.length > 10) val = val.slice(0, 10);
              e.currentTarget.value = val;
            }}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">
              {typeof errors.phone.message === "string"
                ? errors.phone.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Affiliation <span className="text-red-600">*</span>
          </Label>
          <Input {...register("affiliation")} />
          {errors.affiliation && (
            <p className="text-sm text-red-600">
              {typeof errors.affiliation.message === "string"
                ? errors.affiliation.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Designation <span className="text-red-600">*</span>
          </Label>
          <Input {...register("designation")} />
        </div>

        <div className="space-y-1.5">
          <Label>Medical Council Registration</Label>
          <Input {...register("medicalCouncilRegistration")} />
          {errors.medicalCouncilRegistration && (
            <p className="text-sm text-red-600">
              {typeof errors.medicalCouncilRegistration.message === "string"
                ? errors.medicalCouncilRegistration.message
                : "This field is required"}
            </p>
          )}
        </div>

        {/* ✅ Updated Meal Preference Section */}
        <div className="space-y-1.5">
          <Label>
            Meal Preference <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="mealPreference"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={loadingMeals}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue
                    placeholder={
                      loadingMeals
                        ? "Loading meal preferences..."
                        : "Select Meal Preference"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {mealPreferences.length > 0 ? (
                    mealPreferences.map((meal) => (
                      <SelectItem key={meal._id} value={meal.mealName}>
                        {meal.mealName}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback options if no meal preferences are loaded
                    <>
                      <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="Non-Vegetarian">
                        Non-Vegetarian
                      </SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.mealPreference && (
            <p className="text-sm text-red-600">
              {typeof errors.mealPreference.message === "string"
                ? errors.mealPreference.message
                : "This field is required"}
            </p>
          )}
          {loadingMeals && (
            <p className="text-sm text-blue-600">Loading meal preferences...</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Medical Council State <span className="text-red-600">*</span>
          </Label>

          {!basicDetails.medicalCouncilState ||
          basicDetails.medicalCouncilState.trim() === "" ? (
            // ✅ Show dropdown if no prefilled value
            <Controller
              name="medicalCouncilState"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select Medical Council" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicalCouncils.map((council) => (
                      <SelectItem key={council} value={council}>
                        {council}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            // ✅ Show text input if profile already has a council value
            <Input {...register("medicalCouncilState")} />
          )}

          {errors.medicalCouncilState && (
            <p className="text-sm text-red-600">
              {typeof errors.medicalCouncilState.message === "string"
                ? errors.medicalCouncilState.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label>
            Primary Address <span className="text-red-600">*</span>
          </Label>
          <Textarea {...register("address")} />
          {errors.address && (
            <p className="text-sm text-red-600">
              {typeof errors.address.message === "string"
                ? errors.address.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          <CountryStateCitySelect
            control={control}
            watch={watch}
            errors={errors}
            showCountry={true}
            disableCountry={true}
            showState={true}
            showCity={true}
            showPincode={true}
            editing={true}
          />
        </div>
      </div>

      {/* Registration Category Section */}
      <div className="space-y-2">
        <Label className="font-medium">
          Select Registration Category <span className="text-red-600">*</span>
        </Label>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00509E] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading registration options...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <p className="text-gray-500">
              No registration options available for this event.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Please contact event organizers.
            </p>
          </div>
        ) : (
          <RadioGroup
            defaultValue={
              basicDetails.registrationCategory
                ? JSON.stringify(basicDetails.registrationCategory)
                : ""
            }
            onValueChange={(val) => {
              const category = JSON.parse(val);
              handleCategorySelect(category);
            }}
            className="space-y-2 border border-gray-200 rounded-lg p-3"
          >
            {categories.map((cat) => (
              <Label
                key={cat._id}
                htmlFor={cat._id}
                className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={JSON.stringify(cat)} id={cat._id} />
                  <div>
                    <span className="font-medium">{cat.slabName}</span>
                    {cat.needAdditionalInfo && (
                      <p className="text-xs text-blue-600 mt-1">
                        ⓘ Additional information required
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ₹ {cat.amount.toLocaleString("en-IN")}.00
                  </p>
                  {cat.endDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatValidTill(cat.endDate)}
                    </p>
                  )}
                </div>
              </Label>
            ))}
          </RadioGroup>
        )}
        {errors.registrationCategory && (
          <p className="text-sm text-red-600">
            {typeof errors.registrationCategory.message === "string"
              ? errors.registrationCategory.message
              : "This field is required"}
          </p>
        )}
      </div>

      {/* Render Additional Fields */}
      {renderAdditionalFields()}

      {/* Terms & Conditions - Compact Version */}
      <div className="mt-6">
        <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
          <Controller
            name="acceptedTerms"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-[#00509E] border-gray-300 rounded focus:ring-[#00509E]"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-900">
                    I accept the{" "}
                    <a
                      href={
                        currentEvent?._id
                          ? `/events/${currentEvent._id}/terms`
                          : "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00509E] hover:text-[#003B73] font-medium underline transition-colors"
                    >
                      Terms & Conditions
                    </a>{" "}
                    and Cancellation Policy
                  </span>
                </div>
              </label>
            )}
          />
        </div>
        {/* Validation Error */}
        {errors.acceptedTerms && (
          <p className="text-sm text-red-600">
            {typeof errors.acceptedTerms.message === "string"
              ? errors.acceptedTerms.message
              : "This field is required"}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="text-center">
        <Button
          type="submit"
          className="bg-[#00509E] hover:bg-[#003B73] px-8 cursor-pointer"
          disabled={loading || categories.length === 0 || loadingMeals}
        >
          {loading || loadingMeals ? "Loading..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
