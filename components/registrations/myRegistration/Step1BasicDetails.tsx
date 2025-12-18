"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AdditionalField,
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
import { formatValidTill } from "@/app/utils/formatEventDate";
import { ChevronDownIcon, Info } from "lucide-react";
import DynamicFormSection from "./DynamicFormSection";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Update createDynamicSchema function:
const createDynamicSchema = (
  category: RegistrationCategory | null,
  dynamicFormFields: any[]
) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    prefix: z.string().min(1, "Prefix is required"),
    name: z.string().min(1, "Full Name is required"),
    gender: z.string().min(1, "Gender is required"),
    email: z.string().email("Invalid email"),
    mobile: z
      .string()
      .regex(/^\d{10}$/, { message: "Mobile must be 10 digits" }),
    designation: z.string().min(1, "Designation is required"),
    affiliation: z.string().min(1, "Affiliation is required"),
    mealPreference: z.string().min(1, "Please select a meal preference"),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    address: z.string().min(1, "Address is required"),
    pincode: z.string().min(1, "Pincode is required"),
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

  // Add category additional fields
  if (category?.needAdditionalInfo && category.additionalFields?.length) {
    category.additionalFields.forEach((field) => {
      const fieldKey = `additional_${field.id}`;

      if (field.type === "upload") {
        schemaFields[fieldKey] = z.any().optional();
      } else if (field.type === "checkbox") {
        schemaFields[fieldKey] = z.array(z.string()).optional();
      } else {
        schemaFields[fieldKey] = z.string().optional();
      }
    });
  }

  // Add dynamic form fields to schema
  dynamicFormFields.forEach((field) => {
    const fieldKey = `dynamic_${field.id}`;

    // Check for file fields (both type: "file" and type: "input" with inputTypes: "file")
    const isFileField =
      field.type === "file" ||
      (field.type === "input" && field.inputTypes === "file");

    if (isFileField) {
      // Skip Zod validation for file fields
      schemaFields[fieldKey] = z.any().optional();
    } else if (field.type === "checkbox") {
      schemaFields[fieldKey] = field.required
        ? z.array(z.string()).min(1, `${field.label} is required`)
        : z.array(z.string()).optional();
    } else {
      schemaFields[fieldKey] = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
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
  const {
    basicDetails,
    updateBasicDetails,
    dynamicFormFields,
    setDynamicFormFields,
    setDynamicFormFileUpload,
  } = useRegistrationStore();
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
    createDynamicSchema(null, dynamicFormFields)
  );
  const [loadingDynamicForm, setLoadingDynamicForm] = useState(false);

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
      // Note: Backend expects "name" not "fullName"
      name: basicDetails.fullName || "",
      prefix: basicDetails.prefix || "",
      gender: basicDetails.gender || "",
      email: basicDetails.email || "",
      mobile: basicDetails.phone || "", // Backend expects "mobile"
      designation: basicDetails.designation || "",
      affiliation: basicDetails.affiliation || "",
      mealPreference: basicDetails.mealPreference || "",
      country: basicDetails.country || "",
      city: basicDetails.city || "",
      state: basicDetails.state || "",
      address: basicDetails.address || "",
      pincode: basicDetails.pincode || "",
      acceptedTerms: basicDetails.acceptedTerms || false,
      registrationCategory: basicDetails.registrationCategory || null,
    } as any,
  });

  // Prefill form - CORRECTED
  useEffect(() => {
    const defaultValues: any = {
      ...basicDetails,
      // Map frontend field names to backend field names
      name: basicDetails.fullName || "",
      mobile: basicDetails.phone || "",
    };

    // Add additional answers
    if (basicDetails.additionalAnswers) {
      Object.entries(basicDetails.additionalAnswers).forEach(([key, value]) => {
        defaultValues[`additional_${key}`] = value;
      });
    }

    // Add dynamic form answers
    if (basicDetails.dynamicFormAnswers) {
      basicDetails.dynamicFormAnswers.forEach((answer) => {
        defaultValues[`dynamic_${answer.id}`] = answer.value;
      });
    }

    reset(defaultValues);

    if (basicDetails.registrationCategory) {
      setSelectedCategory(basicDetails.registrationCategory);
      const newSchema = createDynamicSchema(
        basicDetails.registrationCategory,
        dynamicFormFields
      );
      setDynamicSchema(newSchema);
    }
  }, [basicDetails, reset, dynamicFormFields]);

  // Update schema when category changes
  const updateDynamicSchema = (category: RegistrationCategory | null) => {
    const newSchema = createDynamicSchema(category, dynamicFormFields);
    setDynamicSchema(newSchema);
  };

  // Fetch dynamic form - FIXED
  useEffect(() => {
    const fetchDynamicForm = async () => {
      if (!currentEvent?._id) return;

      try {
        setLoadingDynamicForm(true);
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${currentEvent._id}/dynamic-form`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch dynamic form:", response.status);
          return;
        }

        // Clone the response before parsing
        const responseClone = response.clone();

        try {
          const data = await response.json();

          if (data.success && data.data?.fields) {
            // Ensure fields have correct type mapping
            const transformedFields = data.data.fields.map((field: any) => {
              // IMPORTANT: Check for input with file type
              if (field.type === "input" && field.inputTypes === "file") {
                return {
                  ...field,
                  type: "file", // Convert to "file" type
                };
              }
              return field;
            });

            setDynamicFormFields(transformedFields);
          }
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError);
          // Try to read as text to see what the response is
          const text = await responseClone.text();
          console.error("Response text:", text.substring(0, 500));
        }
      } catch (error) {
        console.error("Error fetching dynamic form:", error);
        toast.error("Failed to load additional form fields");
      } finally {
        setLoadingDynamicForm(false);
      }
    };

    fetchDynamicForm();
  }, [currentEvent?._id, setDynamicFormFields]);

  const onSubmit: SubmitHandler<FormDataType> = (data) => {
    const additionalAnswers: Record<string, any> = {};
    const fileUploads: Record<string, File> = {};

    // Process category additional fields
    if (data.registrationCategory?.needAdditionalInfo) {
      const category = data.registrationCategory;

      if (category.additionalFields?.length) {
        category.additionalFields.forEach((field: AdditionalField) => {
          const fieldKey = `additional_${field.id}`;
          const value = (data as any)[fieldKey];

          if (field.type === "upload") {
            if (value instanceof File) {
              fileUploads[field.id.toString()] = value;
              additionalAnswers[field.id.toString()] = ""; // Empty string for file
            } else if (typeof value === "string" && value) {
              additionalAnswers[field.id.toString()] = value;
            } else {
              additionalAnswers[field.id.toString()] = "";
            }
          } else if (field.type === "checkbox") {
            // FIX: Checkbox fields should always be arrays
            if (Array.isArray(value)) {
              additionalAnswers[field.id.toString()] = value;
            } else if (typeof value === "string") {
              // Single checkbox value (not common but possible)
              additionalAnswers[field.id.toString()] = [value];
            } else {
              additionalAnswers[field.id.toString()] = [];
            }
          } else if (field.type === "radio") {
            // Radio buttons return single value
            additionalAnswers[field.id.toString()] = value || "";
          } else {
            // Textbox, date, etc.
            additionalAnswers[field.id.toString()] = value || "";
          }
        });
      }
    }

    // Process dynamic form fields
    const dynamicFormAnswers: any[] = [];
    const dynamicFileUploads: Record<string, File> = {};

    dynamicFormFields.forEach((field) => {
      const fieldKey = `dynamic_${field.id}`;
      const value = (data as any)[fieldKey];
      const existingFile = basicDetails.dynamicFormFileUploads?.[field.id];

      const answer: Record<string, any> = {
        id: field.id,
        label: field.label,
        type: field.type, // Keep original type
        required: field.required,
        value: "", // CHANGED: Default to empty string
        fileUrl: "",
      };

      // Check if it's a file field (both formats)
      const isFileField =
        field.type === "file" ||
        (field.type === "input" && field.inputTypes === "file");

      if (isFileField) {
        if (existingFile instanceof File) {
          dynamicFileUploads[field.id] = existingFile;
          answer.value = ""; // CHANGED: Empty string for file
          answer.fileUrl = ""; // CHANGED: Empty string
        } else if (value && typeof value === "string") {
          answer.value = value;
          answer.fileUrl = value;
        } else {
          answer.value = ""; // CHANGED: Empty string
          answer.fileUrl = ""; // CHANGED: Empty string
        }
      } else if (field.type === "checkbox") {
        answer.value = Array.isArray(value) ? value : [value].filter(Boolean);
      } else {
        answer.value = value || "";
      }

      // Add inputTypes for input fields
      if (field.inputTypes) {
        answer.inputTypes = field.inputTypes;
      }
      if (field.options) {
        answer.options = field.options;
      }

      dynamicFormAnswers.push(answer);
    });

    // Verify no File objects
    const hasFileObjects = dynamicFormAnswers.some(
      (answer) => answer.value instanceof File
    );
    if (hasFileObjects) {
      console.error("ERROR: File objects in dynamicFormAnswers!");
    }

    // Save to store
    updateBasicDetails({
      ...basicDetails,
      fullName: data.name,
      phone: data.mobile,
      prefix: data.prefix,
      gender: data.gender,
      email: data.email,
      designation: data.designation,
      affiliation: data.affiliation,
      mealPreference: data.mealPreference,
      country: data.country,
      city: data.city,
      state: data.state,
      address: data.address,
      pincode: data.pincode,
      acceptedTerms: data.acceptedTerms,
      registrationCategory: data.registrationCategory,
      additionalAnswers,
      fileUploads,
      dynamicFormAnswers,
      dynamicFormFileUploads: dynamicFileUploads,
      eventId: currentEvent?._id || "",
      eventName: currentEvent?.eventName || "",
    });

    toast.success("Details saved!");
    onNext();
  };

  const handleCategorySelect = (category: RegistrationCategory) => {
    setSelectedCategory(category);
    setValue("registrationCategory", category);
    updateDynamicSchema(category);

    // Clear previous additional answers
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

  // Fixed file upload handler
  const handleDynamicFileUpload = (id: string, file: File | null) => {
    setDynamicFormFileUpload(id, file);
    // Set form value to null, NOT the File object
    setValue(`dynamic_${id}`, null, { shouldValidate: true });
  };

  // Render additional fields - SIMPLIFIED UI
  const renderAdditionalFields = () => {
    if (
      !selectedCategory?.needAdditionalInfo ||
      !selectedCategory.additionalFields?.length
    ) {
      return null;
    }

    return (
      <div className="mt-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#00509E] mb-4">
            Additional Information Required
          </h3>
          <div className="space-y-4">
            {selectedCategory.additionalFields.map((field) => {
              const fieldKey = `additional_${field.id}`;
              const isRequired = [
                "textbox",
                "date",
                "radio",
                "upload",
              ].includes(field.type);

              return (
                <div key={field.id} className="space-y-2">
                  <Label className="font-medium">
                    {field.label}
                    {isRequired && <span className="text-red-600 ml-1">*</span>}
                  </Label>

                  {field.type === "textbox" && (
                    <Input
                      {...register(fieldKey as any)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}

                  {field.type === "date" && (
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            {watch(fieldKey as any)
                              ? new Date(
                                  watch(fieldKey as any)
                                ).toLocaleDateString()
                              : "Select date"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              watch(fieldKey as any)
                                ? new Date(watch(fieldKey as any))
                                : undefined
                            }
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setValue(
                                fieldKey as any,
                                date?.toISOString().split("T")[0] || ""
                              );
                            }}
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {field.type === "radio" && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            value={option.label}
                            {...register(fieldKey as any)}
                            className="text-[#00509E]"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "checkbox" && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            value={option.label}
                            onChange={(e) => {
                              const currentValues =
                                watch(fieldKey as any) || [];

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
                            className="rounded"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "upload" && (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept={`.${field.extension || "*"}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 5 * 1024 * 1024;
                            if (file.size > maxSize) {
                              toast.error(`File exceeds 5MB limit.`);
                              e.target.value = "";
                              return;
                            }
                            setValue(fieldKey as any, file);
                          }
                        }}
                      />

                      {/* File restrictions info - show below input */}
                      <div className="flex items-center gap-2">
                        {field.extension && (
                          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Allowed:{" "}
                            {field.extension.startsWith(".")
                              ? field.extension
                              : `.${field.extension}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Max: 5MB
                        </p>
                      </div>
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
      </div>
    );
  };

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
            additionalFields: slab.additionalFields as AdditionalField[],
            startDate: slab.startDate,
            endDate: slab.endDate,
          }));

          setCategories(transformedCategories);
          fetchTerms(currentEvent._id);
        } else {
          toast.error("Failed to load registration options");
        }
      } catch (err) {
        toast.error("Error loading registration options");
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrationSlabs();
  }, [currentEvent?._id]);

  // Fetch meal preferences function
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

  // Fetch terms and conditions
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
      setTerms([]);
    } finally {
      setTermsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Grid of Inputs - CORRECTED field names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>
            Prefix <span className="text-red-600">*</span>
          </Label>
          <Input placeholder="Eg: Dr, Mr, Ms" {...register("prefix")} />
          {errors.prefix && (
            <p className="text-sm text-red-600">
              {typeof errors.prefix.message === "string"
                ? errors.prefix.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Full Name <span className="text-red-600">*</span>
          </Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-600">
              {typeof errors.name.message === "string"
                ? errors.name.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>
            Mobile No. <span className="text-red-600">*</span>
          </Label>
          <Input
            {...register("mobile")}
            onInput={(e) => {
              let val = e.currentTarget.value.replace(/\D/g, "");
              if (val.length > 10) val = val.slice(0, 10);
              e.currentTarget.value = val;
            }}
          />
          {errors.mobile && (
            <p className="text-sm text-red-600">
              {typeof errors.mobile.message === "string"
                ? errors.mobile.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>
            Designation <span className="text-red-600">*</span>
          </Label>
          <Input {...register("designation")} />
          {errors.designation && (
            <p className="text-sm text-red-600">
              {typeof errors.designation.message === "string"
                ? errors.designation.message
                : "This field is required"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Meal Preference <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="mealPreference"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Meal Preference" />
                </SelectTrigger>
                <SelectContent>
                  {mealPreferences.length > 0 ? (
                    mealPreferences.map((meal) => (
                      <SelectItem key={meal._id} value={meal.mealName}>
                        {meal.mealName}
                      </SelectItem>
                    ))
                  ) : (
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
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>
            Address <span className="text-red-600">*</span>
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

        <div className="md:col-span-2">
          {" "}
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

      {/* Dynamic Form Section - SIMPLIFIED */}
      {loadingDynamicForm ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00509E] mx-auto mb-2"></div>
            <p className="text-gray-600">Loading additional form fields...</p>
          </div>
        </div>
      ) : dynamicFormFields.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-[#00509E]">
            Additional Registration Information
          </h3>
          <DynamicFormSection
            fields={dynamicFormFields}
            control={control}
            watch={watch}
            register={register}
            setValue={setValue}
            errors={errors}
            fileUploads={basicDetails.dynamicFormFileUploads || {}}
            onFileUpload={handleDynamicFileUpload}
          />
        </div>
      ) : null}

      {/* Registration Category Section - SIMPLIFIED */}
      <div className="space-y-4">
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
          <div className="text-center py-8">
            <p className="text-gray-500">
              No registration options available for this event.
            </p>
          </div>
        ) : (
          <RadioGroup
            onValueChange={(val) => {
              const category = JSON.parse(val);
              handleCategorySelect(category);
            }}
            className="space-y-3"
          >
            {categories.map((cat) => (
              <Label
                key={cat._id}
                htmlFor={cat._id}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={JSON.stringify(cat)} id={cat._id} />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {cat.slabName}
                      {cat.needAdditionalInfo && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Info className="h-3 w-3" />
                          <span className="text-xs">
                            Additional info required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-[20px] font-semibold text-green-600">
                    ₹ {cat.amount.toLocaleString("en-IN")}.00
                  </div>
                  {cat.endDate && (
                    <div className="text-[12px] text-gray-500 font-medium">
                      {formatValidTill(cat.endDate)}
                    </div>
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

      {/* Render Additional Fields - SIMPLIFIED */}
      {renderAdditionalFields()}

      {/* Terms & Conditions */}
      <div>
        <div className="flex items-start gap-3">
          <Controller
            name="acceptedTerms"
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm">
                  I accept the{" "}
                  <a
                    href={
                      currentEvent?._id
                        ? `/events/${currentEvent._id}/terms`
                        : "#"
                    }
                    target="_blank"
                    className="text-[#00509E] underline"
                  >
                    Terms & Conditions
                  </a>
                </span>
              </label>
            )}
          />
        </div>
        {errors.acceptedTerms && (
          <p className="text-sm text-red-600">
            {typeof errors.acceptedTerms.message === "string"
              ? errors.acceptedTerms.message
              : "This field is required"}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="text-center pt-4">
        <Button
          type="submit"
          className="bg-[#00509E] hover:bg-[#003B73] px-8 cursor-pointer"
          disabled={loading || categories.length === 0}
        >
          {loading ? "Loading..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
