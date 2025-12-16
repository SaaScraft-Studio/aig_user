"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info, X, FileText, Image, ChevronDownIcon } from "lucide-react";
import { DynamicFormField } from "@/app/store/useRegistrationStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import format from "date-fns/format";

interface DynamicFormSectionProps {
  fields: DynamicFormField[];
  control: any;
  watch: any;
  register: any;
  setValue: any;
  errors: any;
  fileUploads: Record<string, File>;
  onFileUpload: (id: string, file: File | null) => void;
}

export default function DynamicFormSection({
  fields,
  control,
  watch,
  register,
  setValue,
  errors,
  fileUploads,
  onFileUpload,
}: DynamicFormSectionProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );

  if (!fields || fields.length === 0) {
    return null;
  }

  const handleFileChange = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
    field: DynamicFormField
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB default)
    const maxSize = (field.maxFileSize || 5) * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${field.maxFileSize || 5}MB limit`);
      event.target.value = "";
      return;
    }

    // In handleFileChange function, update the validation:
    if (field.fileUploadTypes) {
      const allowedExtensions = field.fileUploadTypes
        .split(",")
        .map((ext) => ext.trim().toLowerCase());

      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      // Handle cases like "png" (without dot) or ".png" (with dot)
      const normalizedAllowedExtensions = allowedExtensions.map((ext) =>
        ext.startsWith(".") ? ext.substring(1) : ext
      );

      if (
        !fileExtension ||
        !normalizedAllowedExtensions.includes(fileExtension)
      ) {
        toast.error(`File type not allowed. Allowed: ${field.fileUploadTypes}`);
        event.target.value = "";
        return;
      }
    }

    setUploadingFiles((prev) => ({ ...prev, [id]: true }));

    try {
      // Store file separately, NOT in form value
      onFileUpload(id, file);

      // IMPORTANT: Set form value to null
      setValue(`dynamic_${field.id}`, null, { shouldValidate: true });

      toast.success(`File uploaded: ${file.name}`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [id]: false }));
    }
  };

  const removeFile = (id: string) => {
    onFileUpload(id, null);
    const fileInput = document.getElementById(`file-${id}`) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const renderField = (field: DynamicFormField) => {
    const fieldKey = `dynamic_${field.id}`;
    const hasError = (errors as any)[fieldKey];
    const uploadedFile = fileUploads?.[field.id];

    // Check if it's a file field (both formats)
    const isFileField =
      field.type === "file" ||
      (field.type === "input" && field.inputTypes === "file");

    return (
      <div key={field.id} className="space-y-3">
        {/* Field Header */}
        <div className="flex items-center justify-between">
          <Label className="font-medium">
            {field.label}
            {field.required && <span className="text-red-600 ml-1">*</span>}
            {field.description && (
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-md">
                  {field.description}
                </div>
              </div>
            )}
          </Label>
        </div>

        {/* Field Input */}
        {field.type === "input" && (
          <Input
            type={field.inputTypes || "text"}
            placeholder={field.placeholder}
            {...register(fieldKey)}
            defaultValue={field.defaultValue}
            className="w-full"
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            placeholder={field.placeholder}
            {...register(fieldKey)}
            defaultValue={field.defaultValue}
            rows={3}
            className="w-full"
          />
        )}

        {field.type === "select" && field.options && (
          <Controller
            name={fieldKey}
            control={control}
            defaultValue={field.defaultValue || ""}
            render={({ field: controllerField }) => (
              <Select
                onValueChange={controllerField.onChange}
                value={controllerField.value || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={field.placeholder || "Select an option"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options!.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {field.type === "radio" && field.options && (
          <Controller
            name={fieldKey}
            control={control}
            defaultValue={field.defaultValue || ""}
            render={({ field: controllerField }) => (
              <RadioGroup
                onValueChange={controllerField.onChange}
                value={controllerField.value || ""}
                className="space-y-2"
              >
                {field.options!.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${field.id}-${index}`}
                    />
                    <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        )}

        {field.type === "checkbox" && field.options && (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  onChange={(e) => {
                    const currentValues = watch(fieldKey) || [];
                    if (e.target.checked) {
                      const newValues = [...currentValues, option];

                      if (
                        field.maxSelected &&
                        newValues.length > field.maxSelected
                      ) {
                        toast.error(
                          `Maximum ${field.maxSelected} selections allowed`
                        );
                        return;
                      }

                      setValue(fieldKey, newValues);
                    } else {
                      setValue(
                        fieldKey,
                        currentValues.filter((v: string) => v !== option)
                      );
                    }
                  }}
                  checked={(watch(fieldKey) || []).includes(option)}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === "date" && (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  {watch(fieldKey)
                    ? new Date(watch(fieldKey)).toLocaleDateString()
                    : "Select date"}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    watch(fieldKey) ? new Date(watch(fieldKey)) : undefined
                  }
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setValue(fieldKey, date?.toISOString().split("T")[0] || "");
                  }}
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* For file fields (type: "file" OR type: "input" with inputTypes: "file") */}
        {(field.type === "file" ||
          (field.type === "input" && field.inputTypes === "file")) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                id={`file-${field.id}`}
                type="file"
                accept={
                  field.fileUploadTypes
                    ? field.fileUploadTypes
                        .split(",")
                        .map((ext) =>
                          ext.trim().startsWith(".")
                            ? ext.trim()
                            : `.${ext.trim()}`
                        )
                        .join(",")
                    : "*"
                }
                onChange={(e) => handleFileChange(field.id, e, field)}
                className="flex-1"
                disabled={uploadingFiles[field.id]}
              />
            </div>

            {/* File restrictions info - show below input */}
            {(field.fileUploadTypes || field.maxFileSize) && (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                {field.fileUploadTypes && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Allowed: {field.fileUploadTypes}
                  </span>
                )}
                {field.maxFileSize && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Max: {field.maxFileSize}MB
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <p className="text-sm text-red-600">{hasError.message as string}</p>
        )}
      </div>
    );
  };

  return <div className="space-y-6">{fields.map(renderField)}</div>;
}
