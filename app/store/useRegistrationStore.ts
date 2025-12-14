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

// NEW: Dynamic Form Field Interface
export interface DynamicFormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  inputTypes?: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
  minLength?: number;
  maxLength?: number;
  maxFileSize?: number;
  fileUploadTypes?: string;
  options?: string[];
  minSelected?: number;
  maxSelected?: number;
  value?: any;
}

// NEW: Dynamic Form Answer Interface
export interface DynamicFormAnswer {
  id: string;
  label: string;
  type: string;
  required: boolean;
  value: any;
  fileUrl?: string | null;
  inputTypes?: string;
  options?: string[];
  minSelected?: number;
  maxSelected?: number;
}

// Main form type
export type BasicDetails = {
  eventId: any;
  eventName: any;
  prefix?: string;
  fullName: string;
  email: string;
  phone: string;
  affiliation?: string;
  designation?: string;
  medicalCouncilRegistration: string;
  medicalCouncilState?: string;
  address?: string;
  country: string;
  state?: string;
  city?: string;
  pincode?: string;
  mealPreference?: string;
  gender?: string;
  registrationCategory: RegistrationCategory;
  additionalAnswers?: Record<string, any>;
  dynamicFormAnswers?: DynamicFormAnswer[]; // NEW
  dynamicFormFileUploads?: Record<string, File>; // NEW
  fileUploads?: Record<string, File>;
  registrationId?: string;
  registrationSlabId?: string;
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
  dynamicFormFields: DynamicFormField[]; // NEW
  accompanyingPersons: AccompanyingPerson[];
  selectedWorkshops: string[];
  badgeInfo: BadgeInfo | null;
  skippedAccompanying: boolean;
  skippedWorkshops: boolean;

  setStep: (step: number) => void;
  updateBasicDetails: (data: Partial<BasicDetails>) => void;
  setDynamicFormFields: (fields: DynamicFormField[]) => void; // NEW
  updateDynamicFormAnswer: (id: string, value: any) => void; // NEW
  setDynamicFormFileUpload: (id: string, file: File | null) => void; // NEW
  setAccompanyingPersons: (data: AccompanyingPerson[]) => void;
  skipAccompanyingPersons: () => void;
  setSelectedWorkshops: (workshops: string[]) => void;
  skipWorkshops: () => void;
  setBadgeInfo: (info: BadgeInfo) => void;
  resetForm: () => void;
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
  dynamicFormAnswers: [], // NEW
  dynamicFormFileUploads: {}, // NEW
  registrationId: "",
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  currentStep: 1,
  basicDetails: initialBasicDetails,
  dynamicFormFields: [], // NEW
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

  // NEW: Set dynamic form fields
  setDynamicFormFields: (fields) => set({ dynamicFormFields: fields }),

  // NEW: Update dynamic form answer
  updateDynamicFormAnswer: (id, value) =>
    set((state) => {
      const existingAnswers = state.basicDetails.dynamicFormAnswers || [];
      const existingIndex = existingAnswers.findIndex((a) => a.id === id);

      let updatedAnswers;
      if (existingIndex >= 0) {
        updatedAnswers = [...existingAnswers];
        updatedAnswers[existingIndex] = {
          ...updatedAnswers[existingIndex],
          value,
        };
      } else {
        const field = state.dynamicFormFields.find((f) => f.id === id);
        if (!field) return state;

        updatedAnswers = [
          ...existingAnswers,
          {
            id,
            label: field.label,
            type: field.type,
            required: field.required,
            value,
          },
        ];
      }

      return {
        basicDetails: {
          ...state.basicDetails,
          dynamicFormAnswers: updatedAnswers,
        },
      };
    }),

  // NEW: Set dynamic form file upload
  setDynamicFormFileUpload: (id, file) =>
    set((state) => {
      const currentUploads = state.basicDetails.dynamicFormFileUploads || {};
      const updatedUploads = file
        ? { ...currentUploads, [id]: file }
        : Object.fromEntries(
            Object.entries(currentUploads).filter(([key]) => key !== id)
          );

      return {
        basicDetails: {
          ...state.basicDetails,
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
      dynamicFormFields: [], // NEW
      accompanyingPersons: [],
      selectedWorkshops: [],
      badgeInfo: null,
      skippedAccompanying: false,
      skippedWorkshops: false,
    }),
}));

// Existing User Registrations Store
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
