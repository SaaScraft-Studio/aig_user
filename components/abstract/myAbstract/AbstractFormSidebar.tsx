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

import { useAbstractStore } from "@/app/store/useAbstractStore";
import type { AbstractType } from "@/app/store/useAbstractStore";
import { Descendant, Node as SlateNode } from "slate";
import SlateEditor from "./SlateEditor";
import { ArrowUpRight } from "lucide-react";

type AbstractFormValues = {
  type: AbstractType;
  title: string;
  body: Descendant[];
  authors: string;
  // coAuthors: string;
  coAuthors: string[];
  videoUrl?: string;
  category: string;
  file?: File | null;
  hasFile: "yes" | "no";
  hasVideo: "yes" | "no";
  confirmAccuracy: boolean;
  agreeTerms: boolean;
  interventionStatus?: "yes" | "notRelevant";
};

type AbstractFormSidebarProps = {
  open: boolean;
  onClose: () => void;
  editId: number | null;
};

export default function AbstractFormSidebar({
  open,
  onClose,
  editId,
}: AbstractFormSidebarProps) {
  const {
    isSidebarOpen,
    addAbstract,
    updateAbstract,
    selectedAbstract,
    closeSidebar,
  } = useAbstractStore();

  const [step, setStep] = useState(1);

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
      authors: "",
      // coAuthors: "",
      coAuthors: [""],
      videoUrl: "",
      category: "",
      hasFile: "no",
      hasVideo: "no",
      confirmAccuracy: false,
      agreeTerms: false,
      interventionStatus: "yes",
    },
  });

  const file = watch("file");
  const body = watch("body");
  const hasFile = watch("hasFile");
  const hasVideo = watch("hasVideo");
  const coAuthors = watch("coAuthors");

  useEffect(() => {
    if (selectedAbstract) {
      reset(selectedAbstract);
    } else {
      reset();
    }
    setStep(1);
  }, [selectedAbstract, reset]);

  const onSubmit = (data: AbstractFormValues) => {
    if (selectedAbstract) {
      updateAbstract(selectedAbstract.id, data);
    } else {
      addAbstract(data);
    }
    closeSidebar();
  };

  const goToNext = () => setStep(2);
  const goBack = () => setStep(1);

  const values = getValues();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mt-10 w-full max-w-[80vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-md animate-in fade-in-90 slide-in-from-top-10">
        <div className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-semibold">
            Abstract Submission
          </DialogTitle>
          <a
            href="#"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Guidelines for Abstract Submission{" "}
            <ArrowUpRight className="inline-block ml-1 h-3 w-3" />
          </a>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 ? (
            <>
              {/* Abstract Type and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Abstract Type</Label>
                  <Select
                    onValueChange={(val) =>
                      setValue("type", val as AbstractType)
                    }
                    defaultValue="Poster"
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Poster">Poster</SelectItem>
                      <SelectItem value="Oral Presentation">
                        Oral Presentation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Abstract Category</Label>
                  <Select
                    onValueChange={(val) => setValue("category", val)}
                    defaultValue=""
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paediatric">Paediatric</SelectItem>
                      <SelectItem value="Surgical">Surgical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Abstract Title</Label>
                <Input
                  {...register("title", { required: true })}
                  placeholder="This is the title"
                />
              </div>

              {/* Abstract Body */}
              <div className="space-y-2">
                <Label>Abstract Body (*3000 characters limit)</Label>
                <Controller
                  name="body"
                  control={control}
                  rules={{
                    required: true,
                    validate: (value) =>
                      value.map(SlateNode.string).join("\n").length <= 3000 ||
                      "Abstract exceeds 3000 character limit",
                  }}
                  render={({ field }) => (
                    <SlateEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {body.map(SlateNode.string).join("\n").length} / 3000
                  characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Do you want to upload an abstract file?</Label>
                <Controller
                  name="hasFile"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" />
                        <Label>Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" />
                        <Label>No</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Upload File */}
              <div className="space-y-2">
                {/* <Label>Upload Abstract File (Doc & PDF only)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setValue("file", e.target.files?.[0] || null)
                  }
                /> */}
                {hasFile === "yes" && (
                  <div className="space-y-2">
                    <Label>Upload Abstract File (Doc & PDF only)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setValue("file", e.target.files?.[0] || null)
                      }
                    />
                    {file && (
                      <p className="text-sm text-green-600">{file.name}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Authors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presenting Author</Label>
                  <Input
                    {...register("authors", { required: true })}
                    placeholder="Dr Khan (Presenting Author)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Co-Author(s)</Label>

                  {coAuthors.map((_, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        {...register(`coAuthors.${index}` as const)}
                        placeholder={`Co-Author ${index + 1}`}
                      />

                      {coAuthors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const updated = [...coAuthors];
                            updated.splice(index, 1);
                            setValue("coAuthors", updated);
                          }}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValue("coAuthors", [...coAuthors, ""])}
                    className="mt-2"
                  >
                    + Add another co-author
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Is this a video presentation?</Label>
                <Controller
                  name="hasVideo"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" />
                        <Label>Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" />
                        <Label>No</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                {/* <Label>Enter Video URL (For video presentations)</Label>
                <Input
                  {...register("videoUrl")}
                  placeholder="https://drive.google.com/..."
                /> */}
                {hasVideo === "yes" && (
                  <div className="space-y-2">
                    <Label>Enter Video URL</Label>
                    <Input
                      {...register("videoUrl")}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div className="space-y-4">
                <Controller
                  name="confirmAccuracy"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="confirmAccuracy"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="confirmAccuracy">
                        All authors have read and accepted the contents of the
                        manuscript and vouch for its authenticity
                      </Label>
                    </div>
                  )}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSidebar}
                  className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={goToNext}
                  className="bg-[#00509E] text-white hover:bg-[#003B73]"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Abstract Type</strong> – {values.type}
                </p>
                <p>
                  <strong>Category</strong> – {values.category}
                </p>
                <p>
                  <strong>Title</strong> – {values.title}
                </p>

                <div>
                  <strong>Abstract Body</strong>
                  <div className="text-muted-foreground mt-1 whitespace-pre-line">
                    {values.body.map(SlateNode.string).join("\n")}
                  </div>
                </div>

                <p>
                  <strong>Abstract File</strong> –{" "}
                  {file ? file.name : "No file uploaded"}
                </p>

                <p>
                  <strong>Presenting Author</strong> – {values.authors}
                </p>
                <p>
                  <strong>Co-Authors</strong> – {values.coAuthors}
                </p>
                <p>
                  <strong>Video URL</strong> – {values.videoUrl || "N/A"}
                </p>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    checked={!!values.confirmAccuracy}
                    readOnly
                  />
                  <label className="text-sm">
                    All authors confirm manuscript authenticity
                  </label>
                </div>

                <div className="mt-2">
                  <p className="mb-1">If intervention carried out:</p>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={values.interventionStatus === "yes"}
                        readOnly
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={values.interventionStatus === "notRelevant"}
                        readOnly
                      />
                      Not Relevant
                    </label>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  <strong>Submission Date & Time: </strong>
                  {new Date().toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                    timeZoneName: "short",
                  })}
                </p>
              </div>

              <div className="flex justify-between border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                >
                  Back
                </Button>
                <div className="space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[#00509E] hover:text-[#00509E] border-[#00509E]"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#00509E] text-white hover:bg-[#003B73]"
                  >
                    Submit
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
