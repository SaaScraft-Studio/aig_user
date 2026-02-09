// app/store/useEventStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ===================== TYPES ===================== */

interface Organizer {
  _id: string;
  organizerName: string;
  contactPersonName: string;
  contactPersonMobile: string;
  contactPersonEmail: string;
  status: string;
}

interface Department {
  _id: string;
  departmentName: string;
  contactPersonName: string;
  contactPersonMobile: string;
  contactPersonEmail: string;
  status: string;
}

interface Venue {
  _id: string;
  venueName: string;
  venueAddress: string;
  venueImage: string;
  country: string;
  state: string;
  city: string;
  website: string;
  googleMapLink: string;
  distanceFromAirport: string;
  distanceFromRailwayStation: string;
  nearestMetroStation: string;
}

export interface Event {
  _id: string;
  eventName: string;
  shortName: string;
  eventImage: string;
  eventCode: string;
  regNum: string;
  organizer: Organizer;
  department: Department;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  venueName: Venue | string;
  country: string;
  state: string;
  city: string;
  eventType: string;
  registrationType: "free" | "paid";
  currencyType?: string;
  eventCategory: string;
  isEventApp: boolean;
  dynamicStatus: "Live" | "Past" | "Upcoming";
  createdAt: string;
  updatedAt: string;
}

type RegistrationSettings = {
  _id: string;
  eventId: string;
  attendeeRegistration: boolean;
  accompanyRegistration: boolean;
  workshopRegistration: boolean;
  banquetRegistration: boolean;
  eventRegistrationStartDate: string;
  eventRegistrationEndDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  registrationSettings: RegistrationSettings | null;
  loading: boolean;
  error: string | null;

  // Runtime-only cache (NOT persisted)
  eventCache: Map<string, { data: Event; timestamp: number }>;
  settingsCache: Map<string, { data: RegistrationSettings; timestamp: number }>;

  fetchEvents: () => Promise<void>;
  fetchEventById: (eventId: string) => Promise<Event | null>;
  fetchRegistrationSettings: (
    eventId: string,
  ) => Promise<RegistrationSettings | null>;
  setCurrentEvent: (event: Event | null) => void;
  clearCurrentEvent: () => void;
  clearCache: () => void;
  getEventById: (id: string) => Event | undefined;
}

/* ===================== CONSTANTS ===================== */

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/* ===================== STORE ===================== */

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],
      currentEvent: null,
      registrationSettings: null,
      loading: false,
      error: null,

      eventCache: new Map(),
      settingsCache: new Map(),

      /* ===================== FETCH ALL EVENTS ===================== */
      fetchEvents: async () => {
        try {
          set({ loading: true, error: null });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events`,
            { method: "GET" },
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && Array.isArray(data.data)) {
            const newEventCache = new Map<
              string,
              { data: Event; timestamp: number }
            >();

            data.data.forEach((event: Event) => {
              newEventCache.set(event._id, {
                data: event,
                timestamp: Date.now(),
              });
            });

            set({
              events: data.data, // ✅ always fresh
              eventCache: newEventCache,
              loading: false,
            });
          } else {
            throw new Error("Invalid response format");
          }
        } catch (err: any) {
          console.error("Error fetching events:", err);
          set({
            error: err.message || "Failed to fetch events",
            loading: false,
          });
        }
      },

      /* ===================== FETCH EVENT BY ID ===================== */
      fetchEventById: async (eventId: string) => {
        const cached = get().eventCache.get(eventId);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          set({ currentEvent: cached.data });
          return cached.data;
        }

        try {
          set({ loading: true });

          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Failed to fetch event");
          }

          const data = await response.json();

          if (data.success && data.data) {
            const newCache = new Map(get().eventCache);
            newCache.set(eventId, {
              data: data.data,
              timestamp: Date.now(),
            });

            set({
              currentEvent: data.data,
              eventCache: newCache,
              loading: false,
            });

            return data.data;
          }

          return null;
        } catch (err) {
          console.error("Error fetching event:", err);
          set({ loading: false });
          return null;
        }
      },

      /* ===================== FETCH REGISTRATION SETTINGS ===================== */
      fetchRegistrationSettings: async (eventId: string) => {
        const cached = get().settingsCache.get(eventId);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          set({ registrationSettings: cached.data });
          return cached.data;
        }

        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/registration-settings`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) return null;

          const data = await response.json();

          if (data.success && data.data?.length) {
            const settings = data.data[0];

            const newCache = new Map(get().settingsCache);
            newCache.set(eventId, {
              data: settings,
              timestamp: Date.now(),
            });

            set({
              registrationSettings: settings,
              settingsCache: newCache,
            });

            return settings;
          }

          return null;
        } catch (err) {
          console.error("Error fetching registration settings:", err);
          return null;
        }
      },

      setCurrentEvent: (event) => set({ currentEvent: event }),
      clearCurrentEvent: () => set({ currentEvent: null }),

      clearCache: () =>
        set({
          eventCache: new Map(),
          settingsCache: new Map(),
        }),

      getEventById: (id) => {
        const cached = get().eventCache.get(id);
        if (cached) return cached.data;
        return get().events.find((e) => e._id === id);
      },
    }),
    {
      name: "event-storage",

      // ❌ DO NOT persist cache
      partialize: (state) => ({
        events: state.events,
        currentEvent: state.currentEvent,
        registrationSettings: state.registrationSettings,
      }),
    },
  ),
);
