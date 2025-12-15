import { create } from "zustand";

export interface AdditionalField {
  id: number;
  type: "textbox" | "date" | "radio" | "checkbox" | "upload";
  label: string;
  extension?: string;
  options?: Array<{
    id: number;
    label: string;
  }>;
}

export interface RegistrationCategory {
  _id: string;
  slabName: string;
  amount: number;
  startDate?: string;
  endDate?: string;
  needAdditionalInfo?: boolean;
  additionalFields?: AdditionalField[];
  AccompanyAmount?: number;
}

// FIXED: Dynamic Form Field Interface to match backend
export interface DynamicFormField {
  id: string;
  type: string; // Backend expects: "input", "textarea", "select", "radio", "checkbox", "date", "file"
  label: string;
  placeholder?: string;
  inputTypes?: string; // For "input" type: "text", "email", "number", "file"
  required: boolean;
  description?: string;
  defaultValue?: any;
  minLength?: number;
  maxLength?: number;
  maxFileSize?: number;
  fileUploadTypes?: string; // e.g., ".pdf,.doc,.docx"
  options?: string[];
  minSelected?: number;
  maxSelected?: number;
  value?: any;
}

// FIXED: Dynamic Form Answer Interface to match backend expectations
export interface DynamicFormAnswer {
  id: string;
  label: string;
  type: string; // Must match field.type (backend expects "file" for file uploads)
  required: boolean;
  value: any;
  fileUrl?: string | null;
  // These are optional for frontend only
  inputTypes?: string;
  options?: string[];
  minSelected?: number;
  maxSelected?: number;
}

// FIXED: Main form type to match backend field names
export type BasicDetails = {
  // Event info
  eventId: any;
  eventName: any;

  // Personal details (matching backend field names)
  prefix?: string;
  fullName: string; // Frontend uses fullName, but backend expects "name"
  email: string;
  phone: string; // Frontend uses phone, but backend expects "mobile"

  // Professional details
  affiliation?: string;
  designation?: string;
  medicalCouncilRegistration: string;
  medicalCouncilState?: string;

  // Address details
  address?: string;
  country: string;
  state?: string;
  city?: string;
  pincode?: string;

  acceptedTerms?: boolean;

  // Preferences
  mealPreference?: string;
  gender?: string;

  // Registration details
  registrationCategory: RegistrationCategory;
  registrationId?: string;
  registrationSlabId?: string;

  // Additional fields
  additionalAnswers?: Record<string, any>;
  fileUploads?: Record<string, File>; // For category additional upload fields

  // Dynamic form fields
  dynamicFormAnswers?: DynamicFormAnswer[];
  dynamicFormFileUploads?: Record<string, File>; // Files for dynamic form

  // Frontend only - for mapping
  _name?: string; // For mapping fullName -> name
  _mobile?: string; // For mapping phone -> mobile
};

// Accompanying person type
export type AccompanyingPerson = {
  name: string;
  age: string;
  gender: string;
  relation: string;
  mealPreference: string;
};

// Badge info type for success page
export type BadgeInfo = {
  qrCodeUrl: string;
  name: string;
  registrationId: string;
  category: string;
  workshop?: string;
};

// Zustand store shape
type RegistrationState = {
  currentStep: number;
  basicDetails: BasicDetails;
  dynamicFormFields: DynamicFormField[];
  accompanyingPersons: AccompanyingPerson[];
  selectedWorkshops: string[];
  badgeInfo: BadgeInfo | null;
  skippedAccompanying: boolean;
  skippedWorkshops: boolean;

  setStep: (step: number) => void;
  updateBasicDetails: (data: Partial<BasicDetails>) => void;
  setDynamicFormFields: (fields: DynamicFormField[]) => void;
  updateDynamicFormAnswer: (id: string, value: any, fileUrl?: string) => void; // UPDATED
  setDynamicFormFileUpload: (id: string, file: File | null) => void;
  setAccompanyingPersons: (data: AccompanyingPerson[]) => void;
  skipAccompanyingPersons: () => void;
  setSelectedWorkshops: (workshops: string[]) => void;
  skipWorkshops: () => void;
  setBadgeInfo: (info: BadgeInfo) => void;
  resetForm: () => void;

  // NEW: Helper to get backend-compatible data
  getBackendCompatibleDetails: () => {
    name: string;
    mobile: string;
    [key: string]: any;
  };
};

// ✅ Initial values
const initialBasicDetails: BasicDetails = {
  eventId: "",
  eventName: "",
  prefix: "",
  fullName: "",
  email: "",
  phone: "",
  affiliation: "",
  designation: "",
  medicalCouncilRegistration: "",
  medicalCouncilState: "",
  address: "",
  country: "India",
  state: "",
  city: "",
  pincode: "",
  mealPreference: "",
  gender: "",
  registrationCategory: undefined as any,
  dynamicFormAnswers: [],
  dynamicFormFileUploads: {},
  fileUploads: {},
  additionalAnswers: {},
  registrationId: "",
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  currentStep: 1,
  basicDetails: initialBasicDetails,
  dynamicFormFields: [],
  accompanyingPersons: [],
  selectedWorkshops: [],
  badgeInfo: null,
  skippedAccompanying: false,
  skippedWorkshops: false,

  setStep: (step) => set({ currentStep: step }),

  updateBasicDetails: (data) =>
    set((state) => ({
      basicDetails: { ...state.basicDetails, ...data },
    })),

  // Set dynamic form fields
  setDynamicFormFields: (fields) => set({ dynamicFormFields: fields }),

  // UPDATED: Update dynamic form answer with fileUrl support
  updateDynamicFormAnswer: (id, value, fileUrl) =>
    set((state) => {
      const existingAnswers = state.basicDetails.dynamicFormAnswers || [];
      const existingIndex = existingAnswers.findIndex((a) => a.id === id);

      // Find the field definition
      const field = state.dynamicFormFields.find((f) => f.id === id);

      let updatedAnswers;
      if (existingIndex >= 0) {
        updatedAnswers = [...existingAnswers];
        updatedAnswers[existingIndex] = {
          ...updatedAnswers[existingIndex],
          value,
          ...(fileUrl !== undefined && { fileUrl }),
        };
      } else {
        if (!field) return state;

        const newAnswer: DynamicFormAnswer = {
          id,
          label: field.label,
          type: field.type,
          required: field.required,
          value,
          fileUrl: fileUrl || null,
        };

        // Add additional properties based on field type
        if (field.type === "input") {
          newAnswer.inputTypes = field.inputTypes;
        }
        if (field.options) {
          newAnswer.options = field.options;
        }
        if (field.minSelected !== undefined) {
          newAnswer.minSelected = field.minSelected;
        }
        if (field.maxSelected !== undefined) {
          newAnswer.maxSelected = field.maxSelected;
        }

        updatedAnswers = [...existingAnswers, newAnswer];
      }

      return {
        basicDetails: {
          ...state.basicDetails,
          dynamicFormAnswers: updatedAnswers,
        },
      };
    }),

  // Set dynamic form file upload
  setDynamicFormFileUpload: (id, file) =>
    set((state) => {
      const currentUploads = state.basicDetails.dynamicFormFileUploads || {};
      const updatedUploads = file
        ? { ...currentUploads, [id]: file }
        : Object.fromEntries(
            Object.entries(currentUploads).filter(([key]) => key !== id)
          );

      // Also update the answer value if needed
      const existingAnswers = state.basicDetails.dynamicFormAnswers || [];
      const answerIndex = existingAnswers.findIndex((a) => a.id === id);

      let updatedAnswers = [...existingAnswers];
      if (answerIndex >= 0) {
        updatedAnswers[answerIndex] = {
          ...updatedAnswers[answerIndex],
          value: file ? null : updatedAnswers[answerIndex].value,
          fileUrl: null, // Clear fileUrl when file is removed
        };
      }

      return {
        basicDetails: {
          ...state.basicDetails,
          dynamicFormAnswers: updatedAnswers,
          dynamicFormFileUploads: updatedUploads,
        },
      };
    }),

  setAccompanyingPersons: (data) =>
    set({ accompanyingPersons: data, skippedAccompanying: false }),

  skipAccompanyingPersons: () =>
    set({ accompanyingPersons: [], skippedAccompanying: true }),

  setSelectedWorkshops: (workshops) =>
    set({ selectedWorkshops: workshops, skippedWorkshops: false }),

  skipWorkshops: () => set({ selectedWorkshops: [], skippedWorkshops: true }),

  setBadgeInfo: (info) => set({ badgeInfo: info }),

  resetForm: () =>
    set({
      currentStep: 1,
      basicDetails: initialBasicDetails,
      dynamicFormFields: [],
      accompanyingPersons: [],
      selectedWorkshops: [],
      badgeInfo: null,
      skippedAccompanying: false,
      skippedWorkshops: false,
    }),

  // NEW: Helper to get backend-compatible data
  getBackendCompatibleDetails: () => {
    const state = get();
    const details = state.basicDetails;

    return {
      // Map frontend field names to backend field names
      name: details.fullName,
      mobile: details.phone,
      // Keep all other fields as-is
      ...details,
    };
  },
}));

// Existing User Registrations Store (unchanged)
export interface UserRegistration {
  _id: string;
  eventId: string;
  eventName: string;
  regNum: string;
  isPaid: boolean;
}

interface UserRegistrationsState {
  registrations: UserRegistration[];
  fetchRegistrations: () => Promise<void>;
}

export const useUserRegistrationsStore = create<UserRegistrationsState>(
  (set) => ({
    registrations: [],
    fetchRegistrations: async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;

        if (!token) {
          set({ registrations: [] });
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/my/registrations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch user registrations");
          return;
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const transformedRegistrations = data.data.map((reg: any) => ({
            _id: reg._id,
            eventId: reg.eventId?._id || reg.eventId,
            eventName: reg.eventId?.title || "Event",
            regNum: reg.regNum || `REG-${reg._id.slice(-6)}`,
            isPaid: reg.isPaid || false,
          }));

          set({ registrations: transformedRegistrations });
        }
      } catch (err) {
        console.error("Error loading user registrations", err);
      }
    },
  })
);
