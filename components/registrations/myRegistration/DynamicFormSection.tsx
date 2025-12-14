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
import {
  Info,
  FileUp,
  X,
  FileText,
  Image,
  File,
  Music,
  Video,
} from "lucide-react";
import { DynamicFormField } from "@/app/store/useRegistrationStore";
import {
  validateFileUpload,
  getAcceptAttribute,
  formatFileSize,
} from "@/app/utils/fileValidation";

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

  // Get file icon component
  const getFileIconComponent = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "ppt":
      case "pptx":
        return <FileText className="h-4 w-4 text-orange-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "bmp":
      case "svg":
        return <Image className="h-4 w-4 text-purple-500" />;
      case "mp3":
      case "wav":
      case "ogg":
        return <Music className="h-4 w-4 text-pink-500" />;
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
        return <Video className="h-4 w-4 text-indigo-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleFileChange = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
    field: DynamicFormField
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFileUpload(
      file,
      field.fileUploadTypes,
      field.maxFileSize
    );

    if (!validation.valid) {
      toast.error(validation.error);
      event.target.value = "";
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [id]: true }));

    try {
      onFileUpload(id, file);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.success(`${file.name} uploaded (${fileSizeMB} MB)`);
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
    const isFileField = field.type === "input" && field.inputTypes === "file";

    return (
      <div
        key={field.id}
        className={`p-4 border rounded-lg space-y-3 ${
          hasError
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-gray-50 hover:bg-gray-100/50"
        }`}
      >
        {/* Field Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="font-medium text-gray-800">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            {field.description && (
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-md z-50">
                  {field.description}
                </div>
              </div>
            )}
          </div>

          {isFileField && field.fileUploadTypes && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Allowed: {field.fileUploadTypes}
            </span>
          )}
        </div>

        {/* Field Input */}
        {field.type === "input" && (
          <div className="space-y-2">
            {isFileField ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id={`file-${field.id}`}
                      type="file"
                      accept={getAcceptAttribute(field.fileUploadTypes)}
                      onChange={(e) => handleFileChange(field.id, e, field)}
                      className="bg-white"
                      disabled={uploadingFiles[field.id]}
                    />
                  </div>
                  {uploadedFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFile(field.id)}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {uploadedFile && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {getFileIconComponent(uploadedFile.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(uploadedFile.size)}</span>
                        <span>•</span>
                        <span>
                          {uploadedFile.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Ready to upload
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Info className="h-3 w-3" />
                  <span>Max size: {field.maxFileSize || 5}MB</span>
                  {field.fileUploadTypes && (
                    <>
                      <span>•</span>
                      <span>Types: {field.fileUploadTypes}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Input
                type={field.inputTypes || "text"}
                placeholder={field.placeholder}
                {...register(fieldKey)}
                defaultValue={field.defaultValue}
                minLength={field.minLength}
                maxLength={field.maxLength}
                className="bg-white"
              />
            )}
          </div>
        )}

        {field.type === "textarea" && (
          <Textarea
            placeholder={field.placeholder}
            {...register(fieldKey)}
            defaultValue={field.defaultValue}
            minLength={field.minLength}
            maxLength={field.maxLength}
            rows={3}
            className="bg-white"
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
                <SelectTrigger className="bg-white cursor-pointer">
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
                className="space-y-2 bg-white p-3 rounded-md border border-gray-300"
              >
                {field.options!.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={option}
                      id={`${field.id}-${index}`}
                    />
                    <Label
                      htmlFor={`${field.id}-${index}`}
                      className="cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        )}

        {field.type === "checkbox" &&
          field.options &&
          field.options.length > 0 && (
            <div className="space-y-2 bg-white p-3 rounded-md border border-gray-300">
              {field.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
                >
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
                    className="rounded focus:ring-[#00509E]"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
              {field.minSelected && (
                <p className="text-xs text-gray-500">
                  Minimum {field.minSelected} selection(s) required
                </p>
              )}
              {field.maxSelected && (
                <p className="text-xs text-gray-500">
                  Maximum {field.maxSelected} selection(s) allowed
                </p>
              )}
            </div>
          )}

        {field.type === "date" && (
          <Input
            type="date"
            {...register(fieldKey)}
            defaultValue={field.defaultValue}
            className="bg-white"
          />
        )}

        {/* Error Message */}
        {hasError && (
          <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-md border border-red-200">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{hasError.message as string}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 p-6 border border-gray-300 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-[#00509E] mb-6 pb-2 border-b border-gray-200">
        Additional Registration Information
      </h3>
      <div className="space-y-6">{fields.map(renderField)}</div>
    </div>
  );
}
