"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/app/store/useUserStore";
import {
  Loader2,
  Pencil,
  Camera,
  User,
  Shield,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import CountryStateCitySelect from "../common/CountryStateCitySelect";
import { medicalCouncils } from "@/app/data/medicalCouncils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// Profile type
export type Profile = {
  photo: string;
  fullName: string;
  prefix: string;
  designation: string;
  affiliation: string;
  phone: string;
  email: string;
  country: string;
  gender: string;
  city: string;
  state: string;
  mealPreference: string;
  pincode: string;
};

// Schema to match Profile type
const profileSchema = z.object({
  photo: z.string().optional(),
  fullName: z
    .string()
    .min(3, "Full name is required")
    .regex(/^[A-Za-z\s]+$/, "Only alphabets and spaces are allowed")
    .max(50, "Maximum 50 characters"),
  prefix: z.string().min(1, "Prefix is required").max(10),
  designation: z
    .string()
    .regex(/^[A-Za-z\s]+$/, "Only alphabets allowed")
    .min(2, "Minimum 2 characters")
    .max(50, "Maximum 50 characters")
    .optional()
    .or(z.literal("")),
  affiliation: z.string().min(1, "Affiliation is required").max(50),
  phone: z
    .string()
    .regex(/^\d{10}$/, { message: "Mobile number must be 10 digits" }),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  gender: z.string().optional().or(z.literal("")),
  city: z
    .string()
    .regex(/^[A-Za-z\s]+$/, "Only alphabets allowed")
    .min(2, "Minimum 2 characters")
    .max(50, "Maximum 50 characters")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .regex(/^[A-Za-z\s]+$/, "Only alphabets allowed")
    .min(2, "Minimum 2 characters")
    .max(50, "Maximum 50 characters")
    .optional()
    .or(z.literal("")),
  mealPreference: z.string().optional().or(z.literal("")),
  pincode: z
    .string()
    .regex(/^\d+$/, "Pincode must be numeric")
    .min(4, "Minimum 4 digits")
    .max(10, "Maximum 10 digits")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof profileSchema>;

interface MyProfileFormProps {
  initialData: Profile;
  onProfileUpdate?: (updatedProfile: Profile) => void;
}

export default function MyProfileForm({
  initialData,
  onProfileUpdate,
}: MyProfileFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ NEW: Track if form has any changes including photo
  const [hasChanges, setHasChanges] = useState(false);

  const setUser = useUserStore((state) => state.setUser);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...initialData,
    },
  });

  // ✅ NEW: Watch for changes in form values AND photo file
  const formValues = watch();

  useEffect(() => {
    // Check if any form field has changed from initial data
    const formChanged = Object.keys(formValues).some((key) => {
      const formValue = formValues[key as keyof FormData];
      const initialValue = initialData[key as keyof Profile];
      return formValue !== initialValue;
    });

    // Update hasChanges considering both form changes AND photo file changes
    setHasChanges(formChanged || photoFile !== null);
  }, [formValues, initialData, photoFile]);

  useEffect(() => {
    reset(initialData);
    setUser({
      photo: initialData.photo,
      fullName: initialData.fullName,
      email: initialData.email,
    });
    setHasChanges(false); // Reset changes when initial data loads
    setPhotoFile(null); // Reset photo file when initial data loads
  }, [initialData, reset, setUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setPhotoError("Unsupported file type. Use JPG, JPEG, PNG, GIF, or WEBP.");
      return;
    }
    if (file.size > maxSize) {
      setPhotoError("File size exceeds 5MB. Please choose a smaller file.");
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);

    // Update form state
    reset({
      ...watch(),
      photo: previewUrl,
    });

    // Update global user state
    setUser({
      photo: previewUrl,
      fullName: watch("fullName"),
      email: watch("email"),
    });

    setPhotoError("");
    setHasChanges(true); // ✅ Mark as changed when photo is selected
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();

      // ✅ CORRECTED: Map form fields to API expected field names
      // Note: Your backend expects "name" but your form uses "fullName"
      formData.append("name", data.fullName); // ✅ Changed from "fullname" to "name"
      formData.append("prefix", data.prefix);
      formData.append("designation", data.designation || "");
      formData.append("affiliation", data.affiliation);
      formData.append("mobile", data.phone);
      formData.append("email", data.email);
      formData.append("country", data.country);
      formData.append("gender", data.gender || "");
      formData.append("city", data.city || "");
      formData.append("state", data.state || "");
      formData.append("mealPreference", data.mealPreference || "");
      formData.append("pincode", data.pincode || "");

      // Append profile picture if changed
      if (photoFile) {
        formData.append("profilePicture", photoFile);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await res.json();

      // Update local state with the response
      const updatedProfile = {
        ...data,
        photo: result.user?.profilePicture || data.photo,
      };

      setUser({
        photo: updatedProfile.photo,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
      });

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile as Profile);
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setPhotoFile(null);
      setHasChanges(false); // ✅ Reset changes after successful update
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset(initialData);
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoError("");
    setHasChanges(false); // ✅ Reset changes on cancel

    setUser({
      photo: initialData.photo,
      fullName: initialData.fullName,
      email: initialData.email,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 lg:p-8">
      {/* Profile Header with Photo */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8 pb-6 border-b border-gray-200">
        <div className="flex-shrink-0">
          <div className="relative group">
            <label htmlFor="photo" className="cursor-pointer block">
              {/* ✅ FIXED: Use Avatar component like in header */}
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage
                    src={watch("photo")}
                    alt={watch("fullName") || "Profile"}
                    className="object-cover transition-all duration-300 group-hover:scale-105"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 text-xl font-semibold w-full h-full">
                    {watch("fullName") ? (
                      watch("fullName")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    ) : (
                      <User className="w-8 h-8 text-blue-400" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              )}
            </label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              disabled={!isEditing}
            />
          </div>
          {photoError && (
            <p className="text-sm text-red-500 mt-2 font-medium text-center">
              {photoError}
            </p>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#00509E] rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {watch("fullName") || "Your Name"}
              </h2>
              <p className="text-gray-600 flex items-center gap-2 mt-1 text-sm lg:text-base">
                <Mail className="w-4 h-4" />
                {watch("email")}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-xs lg:text-sm">
            Update your photo and personal details. File size: Up to 5MB •
            Supported: JPG, JPEG, PNG, GIF, WEBP
          </p>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 p-5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg lg:text-xl text-gray-900">
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <InputField
                control={control}
                name="prefix"
                label="Prefix"
                required
                editing={isEditing}
                error={errors.prefix}
              />
              <InputField
                control={control}
                name="fullName"
                label="Full Name"
                required
                editing={isEditing}
                error={errors.fullName}
              />
              <SelectField
                control={control}
                name="gender"
                label="Gender"
                options={["Male", "Female", "Other"]}
                editing={isEditing}
                error={errors.gender}
              />
              <InputField
                control={control}
                name="phone"
                label="Mobile Number"
                required
                editing={isEditing}
                error={errors.phone}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 p-5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg lg:text-xl text-gray-900">
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your professional details and credentials
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <InputField
                control={control}
                name="designation"
                label="Designation"
                editing={isEditing}
                error={errors.designation}
              />
              <InputField
                control={control}
                name="affiliation"
                label="Affiliation"
                required
                editing={isEditing}
                error={errors.affiliation}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Preferences */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 p-5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg lg:text-xl text-gray-900">
                  Location
                  {/* & Preferences */}
                </CardTitle>
                <CardDescription>
                  Your location details
                  {/* and preferences */}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {/* <SelectField
                control={control}
                name="mealPreference"
                label="Meal Preference"
                options={["Veg", "Non-Veg", "Vegan"]}
                editing={isEditing}
                error={errors.mealPreference}
              /> */}
              <div className="md:col-span-2">
                <CountryStateCitySelect
                  control={control}
                  watch={watch}
                  errors={errors}
                  showCountry={true}
                  disableCountry={true}
                  showState={true}
                  showCity={true}
                  showPincode={true}
                  editing={isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 pt-6 border-t border-gray-200">
        {!isEditing ? (
          <Button
            type="button"
            className="px-8 py-3 bg-gradient-to-r from-[#00509E] to-[#003B73] hover:from-[#003B73] hover:to-[#002D5C] text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Profile"
              )}
            </Button>
            <Button
              type="button"
              className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

// Enhanced InputField component with consistent styling
const InputField = ({
  control,
  name,
  label,
  required,
  editing,
  disabled,
  error,
}: {
  control: any;
  name: keyof FormData;
  label: string;
  required?: boolean;
  editing: boolean;
  disabled?: boolean;
  error?: any;
}) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...field}
          id={name}
          disabled={!editing || disabled}
          className={`w-full h-11 ${
            error
              ? "border-red-500 focus:border-red-500 bg-red-50/50"
              : "border-gray-300 focus:border-[#00509E] bg-white/80"
          } transition-all duration-200 rounded-lg shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/20`}
        />
      )}
    />
    {error && (
      <p className="text-sm text-red-500 font-medium flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error.message}
      </p>
    )}
  </div>
);

// SelectField component with consistent styling
const SelectField = ({
  control,
  name,
  label,
  options,
  editing,
  error,
}: {
  control: any;
  name: keyof FormData;
  label: string;
  options: string[];
  editing: boolean;
  error?: any;
}) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={field.value || ""}
          onValueChange={field.onChange}
          disabled={!editing}
        >
          <SelectTrigger
            id={name}
            className={`w-full h-11 ${
              error
                ? "border-red-500 focus:border-red-500 bg-red-50/50"
                : "border-gray-300 focus:border-[#00509E] bg-white/80"
            } transition-all duration-200 rounded-lg shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/20`}
          >
            <SelectValue placeholder="-Select-" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="cursor-pointer py-3"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
    {error && (
      <p className="text-sm text-red-500 font-medium flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error.message}
      </p>
    )}
  </div>
);
