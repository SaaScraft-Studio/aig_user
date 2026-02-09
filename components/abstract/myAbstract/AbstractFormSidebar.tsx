"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAbstractStore } from "@/app/store/useAbstractStore";
import type { AbstractType } from "@/app/store/useAbstractStore";
import { Descendant, Node as SlateNode } from "slate";
import SlateEditor from "./SlateEditor";
import {
  ArrowUpRight,
  AlertCircle,
  Calendar,
  FileText,
  UserCheck,
  Clock,
} from "lucide-react";

type AbstractFormValues = {
  type: AbstractType;
  title: string;
  body: Descendant[];
  abstract: string;
  presenterName: string;
  coAuthor: string[];
  videoUrl?: string;
  uploadVideoUrl?: string;
  category: string;
  categories: {
    categoryId: string;
    selectedOption: string;
  }[];
  file?: File | null;
  uploadFile?: File | null;
  hasFile: "yes" | "no";
  hasVideo: "yes" | "no";
  confirmAccuracy: boolean;
  agreeTerms: boolean;
  interventionStatus?: "yes" | "notRelevant";
  eventId?: string;
};

type AbstractFormSidebarProps = {
  open: boolean;
  onClose: () => void;
  editId: string | null;
  eventId?: string | null;
};

type AbstractCategory = {
  _id: string;
  eventId: string;
  categoryLabel: string;
  categoryOptions: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export default function AbstractFormSidebar({
  open,
  onClose,
  editId,
  eventId,
}: AbstractFormSidebarProps) {
  const {
    isSidebarOpen,
    addAbstract,
    updateAbstract,
    selectedAbstract,
    closeSidebar,
    abstractSettings,
    categories,
    loading,
  } = useAbstractStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [presentationTypeCategory, setPresentationTypeCategory] =
    useState<AbstractCategory | null>(null);
  const [medicalCategory, setMedicalCategory] =
    useState<AbstractCategory | null>(null);
  const [submissionClosed, setSubmissionClosed] = useState(false);
  const [wordCountExceeded, setWordCountExceeded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    control,
    formState: { errors },
  } = useForm<AbstractFormValues>({
    defaultValues: {
      type: "Poster",
      title: "",
      body: [
        {
          type: "paragraph",
          children: [{ text: "" }],
        } as Descendant,
      ],
      abstract: "",
      presenterName: "",
      coAuthor: [""],
      videoUrl: "",
      uploadVideoUrl: "",
      category: "",
      categories: [],
      hasFile: "no",
      hasVideo: "no",
      confirmAccuracy: false,
      agreeTerms: false,
      interventionStatus: "yes",
      eventId: eventId || "",
    },
  });

  const uploadFile = watch("uploadFile");
  const body = watch("body");
  const abstractText = watch("abstract");
  const hasFile = watch("hasFile");
  const hasVideo = watch("hasVideo");
  const coAuthor = watch("coAuthor");
  const type = watch("type");
  const category = watch("category");
  const presenterName = watch("presenterName");
  const title = watch("title");
  const confirmAccuracy = watch("confirmAccuracy");
  const formCategories = watch("categories");
  const uploadVideoUrl = watch("uploadVideoUrl");

  // Update plain text abstract when Slate body changes
  useEffect(() => {
    const text = body.map(SlateNode.string).join("\n");
    setValue("abstract", text);

    // Check word count against settings
    if (abstractSettings) {
      const wordCount = text.trim().split(/\s+/).length;
      setWordCountExceeded(wordCount > abstractSettings.abstractWordCount);
    }
  }, [body, setValue, abstractSettings]);

  // Organize categories when they're fetched
  useEffect(() => {
    if (categories && categories.length > 0) {
      const presentationCat = categories.find(
        (cat) =>
          cat.categoryLabel?.toLowerCase().includes("presentation") ||
          cat.categoryLabel?.toLowerCase().includes("type"),
      );
      const medicalCat = categories.find(
        (cat) =>
          cat.categoryLabel?.toLowerCase().includes("medical") ||
          cat.categoryLabel?.toLowerCase().includes("submission"),
      );

      setPresentationTypeCategory(presentationCat || null);
      setMedicalCategory(medicalCat || null);
    }
  }, [categories]);

  // Initialize categories form field
  useEffect(() => {
    if (
      categories?.length > 0 &&
      (!formCategories || formCategories.length === 0)
    ) {
      const initialCategories = categories.map((cat) => ({
        categoryId: cat._id,
        selectedOption: "",
      }));
      setValue("categories", initialCategories, { shouldDirty: false });
    }
  }, [categories, formCategories, setValue]);

  // Check if submission period is closed
  useEffect(() => {
    if (abstractSettings) {
      const now = new Date();
      const endDate = new Date(abstractSettings.abstractSubmissionEndDate);
      setSubmissionClosed(now > endDate);
    }
  }, [abstractSettings]);

  // Reset form when selectedAbstract changes
  useEffect(() => {
    if (selectedAbstract) {
      const {
        title,
        type,
        categories: abstractCategories,
        presenterName,
        coAuthor,
        abstract: abstractText,
        uploadVideoUrl,
        uploadFile,
        status,
        lastModified,
        ...rest
      } = selectedAbstract;

      // Convert abstract text to Slate format
      const slateBody = abstractText
        ? [
            {
              type: "paragraph" as const,
              children: [{ text: abstractText }],
            },
          ]
        : [
            {
              type: "paragraph" as const,
              children: [{ text: "" }],
            },
          ];

      // Extract type and category from categories array or use direct values
      let presentationType = type as AbstractType;
      let medicalCategoryValue = "";

      // Build categories array from selectedAbstract
      const categoriesArray =
        abstractCategories?.map((cat) => ({
          categoryId: cat.categoryId,
          selectedOption: cat.selectedOption,
        })) || [];

      reset({
        title,
        type: presentationType,
        // category: medicalCategoryValue,
        body: slateBody,
        abstract: abstractText,
        presenterName,
        coAuthor: coAuthor || [],
        uploadVideoUrl,
        hasVideo: uploadVideoUrl ? "yes" : "no",
        hasFile: uploadFile ? "yes" : "no",
        confirmAccuracy: false,
        agreeTerms: false,
        // eventId: selectedAbstract.eventId,
        categories: categoriesArray,
        uploadFile: undefined, // File object cannot be restored from URL
        ...rest,
      });
    } else {
      reset({
        type: "Poster",
        title: "",
        body: [
          {
            type: "paragraph",
            children: [{ text: "" }],
          } as Descendant,
        ],
        abstract: "",
        presenterName: "",
        coAuthor: [""],
        videoUrl: "",
        uploadVideoUrl: "",
        category: "",
        categories:
          categories?.map((cat) => ({
            categoryId: cat._id,
            selectedOption: "",
          })) || [],
        hasFile: "no",
        hasVideo: "no",
        confirmAccuracy: false,
        agreeTerms: false,
        interventionStatus: "yes",
        eventId: eventId || "",
      });
    }
    setStep(1);
  }, [selectedAbstract, reset, eventId, categories]);

  // Calculate word count
  const wordCount = abstractText
    ? abstractText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;
  const maxWordCount = abstractSettings?.abstractWordCount || 500;

  const onSubmit = async (data: AbstractFormValues) => {
    if (!eventId) {
      toast.error("Event ID is required");
      return;
    }

    // Check if submission is closed
    if (submissionClosed) {
      toast.error("Abstract submission deadline has passed");
      return;
    }

    // Validate abstract settings
    if (abstractSettings) {
      // Check word count
      if (wordCount > maxWordCount) {
        toast.error(
          `Abstract exceeds maximum word limit of ${maxWordCount} words`,
        );
        return;
      }

      // Check if upload is required
      if (
        abstractSettings.uploadFileRequired &&
        !data.uploadFile // FIXED: Check uploadFile instead of file
      ) {
        toast.error("Abstract file upload is required");
        return;
      }

      if (abstractSettings.uploadVideoUrlRequired && !data.uploadVideoUrl) {
        toast.error("Video URL is required");
        return;
      }

      // Check registration requirement
      if (abstractSettings.regRequiredForAbstractSubmission) {
        // You would need to check if user is registered for this event
        // This would require an API call to check registration status
        toast.error("Registration is required for abstract submission");
        return;
      }
    }

    // Validate categories
    const missingCategories = data.categories?.filter(
      (cat) => !cat.selectedOption || cat.selectedOption.trim() === "",
    );

    if (missingCategories && missingCategories.length > 0) {
      toast.error("Please select all required categories");
      return;
    }

    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append("presenterName", data.presenterName);
    formData.append("title", data.title);
    formData.append("abstract", data.abstract);
    formData.append("categories", JSON.stringify(data.categories));

    if (data.uploadVideoUrl) {
      formData.append("uploadVideoUrl", data.uploadVideoUrl);
    }

    if (data.uploadFile) {
      formData.append("uploadFile", data.uploadFile);
    }

    // Add coAuthors as array
    if (data.coAuthor && Array.isArray(data.coAuthor)) {
      data.coAuthor.forEach((author, index) => {
        if (author.trim()) {
          formData.append(`coAuthor[${index}]`, author);
        }
      });
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/abstract-submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to submit abstract");
      }

      // Add to store
      if (selectedAbstract) {
        await updateAbstract(selectedAbstract.id, {
          ...result.data,
          lastModified: new Date().toISOString(),
        });
        toast.success("Abstract updated successfully");
      } else {
        await addAbstract(result.data);
        toast.success("Abstract submitted successfully");
      }

      closeSidebar();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit abstract");
    } finally {
      setSubmitting(false);
    }
  };

  const goToNext = () => {
    // Validate step 1 before proceeding
    const values = getValues();

    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!values.abstract.trim()) {
      toast.error("Abstract body is required");
      return;
    }

    if (!values.presenterName.trim()) {
      toast.error("Presenting author is required");
      return;
    }

    if (wordCount > maxWordCount) {
      toast.error(
        `Abstract exceeds maximum word limit of ${maxWordCount} words`,
      );
      return;
    }

    // FIXED: Check uploadFile instead of file
    if (abstractSettings?.uploadFileRequired && !values.uploadFile) {
      toast.error("Abstract file upload is required");
      return;
    }

    if (abstractSettings?.uploadVideoUrlRequired && !values.uploadVideoUrl) {
      toast.error("Video URL is required");
      return;
    }

    if (!values.confirmAccuracy) {
      toast.error(
        "Please confirm that all authors have read and accepted the contents",
      );
      return;
    }

    // Validate categories
    const missingCategories = values.categories?.filter(
      (cat) => !cat.selectedOption || cat.selectedOption.trim() === "",
    );

    if (missingCategories && missingCategories.length > 0) {
      toast.error("Please select all required categories");
      return;
    }

    setStep(2);
  };

  const goBack = () => setStep(1);

  const values = getValues();

  // Get submission deadline info
  const submissionDeadline = abstractSettings
    ? new Date(abstractSettings.abstractSubmissionEndDate)
    : null;
  const now = new Date();
  const isDeadlinePassed = submissionDeadline
    ? now > submissionDeadline
    : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mt-10 w-full max-w-[80vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-md animate-in fade-in-90 slide-in-from-top-10">
        <div className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-semibold">
            Abstract Submission{" "}
            {abstractSettings?.abstractGuideline && (
              <span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(abstractSettings.abstractGuideline);
                  }}
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  Guidelines for Abstract Submission
                  <ArrowUpRight className="inline-block ml-1 h-3 w-3" />
                </a>
              </span>
            )}
          </DialogTitle>

          {/* Welcome Message from Settings */}
          {/* {abstractSettings?.message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2">
              <p className="text-sm text-blue-700">
                {abstractSettings.message}
              </p>
            </div>
          )} */}

          {/* Submission Deadline Warning */}
          {isDeadlinePassed && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-2 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  Submission Closed
                </p>
                <p className="text-xs text-red-600 mt-1">
                  The abstract submission deadline has passed (
                  {submissionDeadline?.toLocaleDateString()})
                </p>
              </div>
            </div>
          )}

          {/* Registration Requirement Notice */}
          {abstractSettings?.regRequiredForAbstractSubmission && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-2 flex items-start gap-2">
              <UserCheck className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Registration Required
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  You must be registered for this event to submit an abstract
                </p>
              </div>
            </div>
          )}

          {/* Submission Period Info */}
          {abstractSettings && !isDeadlinePassed && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-2 flex items-start gap-2">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  Submission Open
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Deadline: {submissionDeadline?.toLocaleDateString()} at{" "}
                  {submissionDeadline?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 ? (
            <>
              {/* Word Count Info */}
              {/* {abstractSettings && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Word Limit: {maxWordCount} words
                    </span>
                  </div>
                  <div
                    className={`text-sm font-medium ${wordCount > maxWordCount ? "text-red-600" : "text-green-600"}`}
                  >
                    {wordCount} / {maxWordCount} words
                  </div>
                </div>
              )} */}

              {/* Abstract Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat, index) => (
                  <div key={cat._id} className="space-y-2">
                    <Label>{cat.categoryLabel} *</Label>

                    <Controller
                      control={control}
                      name={`categories.${index}.selectedOption`}
                      rules={{ required: `${cat.categoryLabel} is required` }}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) => {
                            field.onChange(val);
                            setValue(
                              `categories.${index}.categoryId`,
                              cat._id,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            );
                          }}
                          disabled={isDeadlinePassed}
                        >
                          <SelectTrigger
                            className={
                              errors.categories?.[index]?.selectedOption
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue
                              placeholder={`Select ${cat.categoryLabel}`}
                            />
                          </SelectTrigger>

                          <SelectContent>
                            {cat.categoryOptions.map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categories?.[index]?.selectedOption && (
                      <p className="text-red-500 text-sm">
                        {errors.categories[index]?.selectedOption?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Abstract Title *</Label>
                <Input
                  {...register("title", { required: "Title is required" })}
                  placeholder="Enter abstract title"
                  className={errors.title ? "border-red-500" : ""}
                  disabled={isDeadlinePassed}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

              {/* Abstract Body */}
              <div className="space-y-2">
                <Label>Abstract Body * ({maxWordCount} words limit)</Label>
                <Controller
                  name="body"
                  control={control}
                  rules={{
                    required: "Abstract body is required",
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <SlateEditor
                        value={field.value}
                        onChange={field.onChange}
                        // disabled={isDeadlinePassed}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Words: {wordCount} / {maxWordCount}
                  </p>
                  {wordCountExceeded && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠️ Exceeds word limit
                    </p>
                  )}
                </div>
              </div>

              {/* File Upload - Conditional based on settings */}
              {abstractSettings?.uploadFileRequired && (
                <div className="space-y-2">
                  <Label>Upload Abstract File *</Label>

                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setValue("uploadFile", file, { shouldValidate: true });
                    }}
                    disabled={isDeadlinePassed}
                    required={abstractSettings.uploadFileRequired}
                  />

                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {uploadFile.name}
                    </p>
                  )}

                  {/* {abstractSettings.uploadFileRequired && !uploadFile && (
                    <p className="text-sm text-red-500 mt-1">
                      File upload is required
                    </p>
                  )} */}
                </div>
              )}

              {/* Authors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presenting Author *</Label>
                  <Input
                    {...register("presenterName", {
                      required: "Presenting author is required",
                    })}
                    placeholder="Dr. John Doe"
                    className={errors.presenterName ? "border-red-500" : ""}
                    disabled={isDeadlinePassed}
                  />
                  {errors.presenterName && (
                    <p className="text-red-500 text-sm">
                      {errors.presenterName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Co-Author(s)</Label>
                  {coAuthor.map((_, index) => (
                    <div key={index} className="flex gap-2 items-center mb-2">
                      <Input
                        {...register(`coAuthor.${index}` as const)}
                        placeholder={`Co-Author ${index + 1}`}
                        disabled={isDeadlinePassed}
                      />
                      {coAuthor.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...coAuthor];
                            updated.splice(index, 1);
                            setValue("coAuthor", updated);
                          }}
                          disabled={isDeadlinePassed}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValue("coAuthor", [...coAuthor, ""])}
                    className="mt-2"
                    disabled={isDeadlinePassed}
                  >
                    + Add another co-author
                  </Button>
                </div>
              </div>

              {/* Video URL - Conditional based on settings */}
              {abstractSettings?.uploadVideoUrlRequired && (
                <div className="space-y-2">
                  <Label>Video Presentation URL *</Label>

                  <Input
                    {...register("uploadVideoUrl", {
                      required: "Video URL is required",
                    })}
                    placeholder="https://drive.google.com/..."
                    className={errors.uploadVideoUrl ? "border-red-500" : ""}
                    disabled={isDeadlinePassed}
                  />

                  {errors.uploadVideoUrl && (
                    <p className="text-red-500 text-sm">
                      {errors.uploadVideoUrl.message}
                    </p>
                  )}
                </div>
              )}

              {/* Confirmation */}
              <div className="space-y-4">
                <Controller
                  name="confirmAccuracy"
                  control={control}
                  rules={{ required: "This confirmation is required" }}
                  render={({ field, fieldState }) => (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="confirmAccuracy"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={fieldState.error ? "border-red-500" : ""}
                        disabled={isDeadlinePassed}
                      />
                      <Label htmlFor="confirmAccuracy" className="text-sm">
                        All authors have read and accepted the contents of the
                        manuscript and vouch for its authenticity *
                      </Label>
                    </div>
                  )}
                />
                {errors.confirmAccuracy && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmAccuracy.message}
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSidebar}
                  className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={goToNext}
                  className="bg-[#00509E] text-white hover:bg-[#003B73]"
                  disabled={submitting || isDeadlinePassed}
                >
                  {isDeadlinePassed ? "Submission Closed" : "Next"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 text-sm">
                {/* Review Summary */}
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Abstract Submission Summary
                  </h3>

                  <div className="space-y-4">
                    {/* Categories */}
                    {values.categories?.map((cat, idx) => {
                      const meta = categories.find(
                        (c) => c._id === cat.categoryId,
                      );
                      return (
                        <div key={idx}>
                          <p className="text-gray-600 font-medium">
                            {meta?.categoryLabel}:
                          </p>
                          <p className="font-medium mt-1">
                            {cat.selectedOption || "Not selected"}
                          </p>
                        </div>
                      );
                    })}

                    {/* Title */}
                    <div>
                      <p className="text-gray-600 font-medium">Title:</p>
                      <p className="font-medium mt-1">{values.title}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 mb-1 font-medium">
                    Abstract Body:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md border whitespace-pre-line max-h-60 overflow-y-auto">
                    {values.abstract}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Words: {wordCount} / {maxWordCount}
                    </span>
                    {wordCountExceeded && (
                      <span className="text-xs text-red-500 font-medium">
                        ⚠️ Exceeds word limit
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File */}
                  <div>
                    <p className="text-gray-600 font-medium">Abstract File:</p>
                    <p className="font-medium mt-1">
                      {uploadFile ? uploadFile.name : "No file uploaded"}
                    </p>
                  </div>

                  {/* Video */}
                  {abstractSettings?.uploadVideoUrlRequired && (
                    <div>
                      <p className="text-gray-600 font-medium">
                        Video Presentation URL:
                      </p>
                      <p className="font-medium mt-1">
                        {values.uploadVideoUrl || "Not provided"}
                      </p>
                    </div>
                  )}

                  {/* Presenting Author */}
                  <div>
                    <p className="text-gray-600 font-medium">
                      Presenting Author:
                    </p>
                    <p className="font-medium mt-1">{values.presenterName}</p>
                  </div>

                  {/* Co-Authors */}
                  <div>
                    <p className="text-gray-600 font-medium">Co-Authors:</p>
                    <div className="font-medium mt-1">
                      {values.coAuthor.filter((a) => a.trim()).length > 0
                        ? values.coAuthor.filter((a) => a.trim()).join(", ")
                        : "None"}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start space-x-2 mb-3">
                    <Checkbox
                      checked={!!values.confirmAccuracy}
                      disabled
                      className="mt-1"
                    />
                    <Label className="text-sm">
                      All authors confirm manuscript authenticity
                    </Label>
                  </div>

                  <div className="mt-2">
                    <p className="text-gray-600 mb-2 font-medium">
                      If intervention carried out:
                    </p>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={values.interventionStatus === "yes"}
                          readOnly
                          className="w-4 h-4"
                        />
                        <Label>Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={values.interventionStatus === "notRelevant"}
                          readOnly
                          className="w-4 h-4"
                        />
                        <Label>Not Relevant</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Submission Date & Time: </strong>
                    {new Date().toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </p>
                  {abstractSettings && submissionDeadline && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        Submission deadline:{" "}
                        {submissionDeadline.toLocaleDateString()} at{" "}
                        {submissionDeadline.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                  disabled={submitting}
                >
                  Back
                </Button>
                <div className="space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                    onClick={() => {
                      // Handle save as draft
                      toast.info("Abstract saved as draft");
                      // You would need to implement draft saving logic here
                    }}
                    disabled={submitting || isDeadlinePassed}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#00509E] text-white hover:bg-[#003B73]"
                    disabled={submitting || isDeadlinePassed}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Submitting...
                      </span>
                    ) : isDeadlinePassed ? (
                      "Submission Closed"
                    ) : (
                      "Submit Abstract"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
