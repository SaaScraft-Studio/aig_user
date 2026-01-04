// app/store/useUserStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  // Basic user info
  id?: string;
  email: string;
  fullName: string;
  photo: string;

  // Profile details
  prefix: string;
  designation: string;
  affiliation: string;
  phone: string;
  country: string;
  gender: string;
  city: string;
  state: string;
  mealPreference: string;
  pincode: string;

  // Auth status
  isAuthenticated: boolean;

  // Actions
  setUser: (data: Partial<UserState>) => void;
  updateProfile: (data: Partial<UserState>) => void;
  clearUser: () => void;
  setAuthentication: (status: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Default values
      id: undefined,
      email: "",
      fullName: "",
      photo: "/authImg/user.png",
      prefix: "",
      designation: "",
      affiliation: "",
      phone: "",
      country: "",
      gender: "",
      city: "",
      state: "",
      mealPreference: "",
      pincode: "",
      isAuthenticated: false,

      // Set user data (for login/initial setup)
      setUser: (data) =>
        set((state) => ({
          ...state,
          ...data,
          isAuthenticated: true,
        })),

      // Update profile (for profile updates)
      updateProfile: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      // Clear user (for logout)
      clearUser: () =>
        set({
          id: undefined,
          email: "",
          fullName: "",
          photo: "/authImg/user.png",
          prefix: "",
          designation: "",
          affiliation: "",
          phone: "",
          country: "",
          gender: "",
          city: "",
          state: "",
          mealPreference: "",
          pincode: "",
          isAuthenticated: false,
        }),

      // Set authentication status
      setAuthentication: (status) => set({ isAuthenticated: status }),
    }),
    {
      name: "user-storage", // localStorage key
      partialize: (state) => ({
        // Only persist these fields to localStorage
        id: state.id,
        email: state.email,
        fullName: state.fullName,
        photo: state.photo,
        prefix: state.prefix,
        designation: state.designation,
        affiliation: state.affiliation,
        phone: state.phone,
        country: state.country,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Optional: Helper hooks for specific use cases
export const useUserProfile = () => {
  const { fullName, email, photo, designation, affiliation } = useUserStore();
  return { fullName, email, photo, designation, affiliation };
};

export const useUserAuth = () => {
  const { isAuthenticated, setAuthentication, clearUser } = useUserStore();
  return { isAuthenticated, setAuthentication, clearUser };
};
