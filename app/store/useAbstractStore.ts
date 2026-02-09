// app/store/useAbstractStore.ts
import { create } from "zustand";

export type AbstractStatus = "Pending" | "Reviewed" | "Accept" | "Rejected";
export type AbstractType = "Poster" | "Oral" | "Presentation";

export type Abstract = {
  id: string; // Changed from number to string for MongoDB _id
  abstractId: string;
  abstractNumber: string;
  title: string;
  type: AbstractType;
  category: string;
  categories?: {
    categoryId: string;
    selectedOption: string;
  }[];
  presenterName: string;
  coAuthor: string[];
  abstract: string;
  uploadFile?: string;
  uploadVideoUrl?: string;
  status: AbstractStatus;
  lastModified: string;
  eventId: string;
  userId: string;
  confirmAccuracy?: boolean;
  authors?: string; // For backward compatibility
};

type AbstractStore = {
  abstracts: Abstract[];
  isSidebarOpen: boolean;
  selectedAbstract: Abstract | null;
  loading: boolean;
  error: string | null;
  abstractSettings: any | null;
  categories: any[];

  // Actions
  addAbstract: (
    newAbstract: Omit<
      Abstract,
      "id" | "abstractId" | "abstractNumber" | "status" | "lastModified"
    >,
  ) => Promise<void>;
  updateAbstract: (id: string, updated: Partial<Abstract>) => Promise<void>;
  deleteAbstract: (id: string) => Promise<void>;
  getAbstractById: (id: string) => Abstract | undefined;
  fetchAbstracts: (eventId: string) => Promise<void>;
  fetchAbstractSettings: (eventId: string) => Promise<void>;
  fetchCategories: (eventId: string) => Promise<void>;

  openSidebar: (id?: string) => void;
  closeSidebar: () => void;
};

export const useAbstractStore = create<AbstractStore>((set, get) => ({
  abstracts: [],
  isSidebarOpen: false,
  selectedAbstract: null,
  loading: false,
  error: null,
  abstractSettings: null,
  categories: [],

  addAbstract: async (data) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("accessToken");

      // Prepare categories array
      const categories = [];
      if (data.type) {
        categories.push({
          categoryId: "presentation_type_id", // You'll need to get this from categories
          selectedOption: data.type,
        });
      }
      if (data.category) {
        categories.push({
          categoryId: "medical_category_id", // You'll need to get this from categories
          selectedOption: data.category,
        });
      }

      const formData = new FormData();
      formData.append("presenterName", data.presenterName || "");
      formData.append("title", data.title);
      formData.append("abstract", data.abstract);
      formData.append("categories", JSON.stringify(categories));
      if (data.uploadVideoUrl) {
        formData.append("uploadVideoUrl", data.uploadVideoUrl);
      }
      if (data.uploadFile) {
        formData.append("uploadFile", data.uploadFile);
      }
      // Add coAuthors as array
      if (data.coAuthor && Array.isArray(data.coAuthor)) {
        data.coAuthor.forEach((author, index) => {
          formData.append(`coAuthor[${index}]`, author);
        });
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${data.eventId}/abstract-submit`,
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

      // Add to local state
      set((state) => ({
        abstracts: [...state.abstracts, result.data],
        isSidebarOpen: false,
        selectedAbstract: null,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAbstract: async (id, updated) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("accessToken");

      // Update API call would go here
      // For now, update local state
      set((state) => ({
        abstracts: state.abstracts.map((abs) =>
          abs.id === id
            ? { ...abs, ...updated, lastModified: new Date().toISOString() }
            : abs,
        ),
        isSidebarOpen: false,
        selectedAbstract: null,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteAbstract: async (id) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("accessToken");

      // Delete API call would go here
      // For now, update local state
      set((state) => ({
        abstracts: state.abstracts.filter((abs) => abs.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getAbstractById: (id) => get().abstracts.find((abs) => abs.id === id),

  fetchAbstracts: async (eventId: string) => {
    try {
      set({ loading: true, error: null });
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/abstracts/my-abstracts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        set({ abstracts: result.data || [], loading: false });
      } else {
        throw new Error(result.message || "Failed to fetch abstracts");
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAbstractSettings: async (eventId: string) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/abstract-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      console.log("Abstract settings response:", result);

      if (result.success) {
        set({ abstractSettings: result.data });
      }
    } catch (error: any) {
      console.error("Failed to fetch abstract settings:", error);
    }
  },

  fetchCategories: async (eventId: string) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/abstract-categories/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      console.log("Categories response:", result);

      if (result.success) {
        set({ categories: result.data || [] });
      }
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
    }
  },

  openSidebar: (id) => {
    const selected = id ? (get().getAbstractById(id) ?? null) : null;
    set({ selectedAbstract: selected, isSidebarOpen: true });
  },

  closeSidebar: () => set({ isSidebarOpen: false, selectedAbstract: null }),
}));
