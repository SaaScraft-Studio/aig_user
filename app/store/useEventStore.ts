// store/useEventStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  startDate: string; // Format: "28/10/2025"
  endDate: string; // Format: "28/10/2025"
  startTime: string; // Format: "09:00 AM"
  endTime: string; // Format: "06:00 AM"
  timeZone: string;
  venueName: Venue | string;
  country: string;
  state: string;
  city: string;
  eventType: string;
  registrationType: "free" | "paid";
  currencyType?: string;
  eventCategory: string; // Conference | Workshop | CME
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

  // Cache for individual events
  eventCache: Map<
    string,
    {
      data: Event;
      timestamp: number;
    }
  >;

  // Cache for registration settings
  settingsCache: Map<
    string,
    {
      data: RegistrationSettings;
      timestamp: number;
    }
  >;

  fetchEvents: () => Promise<void>;
  fetchEventById: (eventId: string) => Promise<Event | null>;
  fetchRegistrationSettings: (
    eventId: string
  ) => Promise<RegistrationSettings | null>;
  setCurrentEvent: (event: Event | null) => void;
  setRegistrationSettings: (settings: RegistrationSettings | null) => void;
  clearCurrentEvent: () => void;
  clearCache: () => void;
  getEventById: (id: string) => Event | undefined;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

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

      fetchEvents: async () => {
        const { events } = get();
        // Don't refetch if events are already loaded
        if (events.length > 0) {
          return;
        }

        try {
          set({ loading: true, error: null });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events`,
            {
              method: "GET",
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && Array.isArray(data.data)) {
            // Cache each event individually
            const newEventCache = new Map(get().eventCache);
            data.data.forEach((event: Event) => {
              newEventCache.set(event._id, {
                data: event,
                timestamp: Date.now(),
              });
            });

            set({
              events: data.data,
              loading: false,
              eventCache: newEventCache,
            });
          } else {
            throw new Error("Invalid response format from events API");
          }
        } catch (err: any) {
          console.error("Error fetching events:", err);
          set({
            error: err.message || "Failed to fetch events",
            loading: false,
          });
        }
      },

      fetchEventById: async (eventId: string) => {
        const { eventCache, events } = get();

        // Check cache first
        const cached = eventCache.get(eventId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          set({ currentEvent: cached.data });
          return cached.data;
        }

        // Check if event exists in events array
        const existingEvent = events.find((event) => event._id === eventId);
        if (existingEvent) {
          // Update cache
          const newEventCache = new Map(eventCache);
          newEventCache.set(eventId, {
            data: existingEvent,
            timestamp: Date.now(),
          });
          set({
            currentEvent: existingEvent,
            eventCache: newEventCache,
          });
          return existingEvent;
        }

        try {
          set({ loading: true });

          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}`,
            {
              method: "GET",
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch event: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.data) {
            const eventData = data.data;

            // Update cache
            const newEventCache = new Map(eventCache);
            newEventCache.set(eventId, {
              data: eventData,
              timestamp: Date.now(),
            });

            set({
              currentEvent: eventData,
              loading: false,
              eventCache: newEventCache,
            });

            return eventData;
          }
          return null;
        } catch (err: any) {
          console.error("Error fetching event:", err);
          set({ loading: false });
          return null;
        }
      },

      fetchRegistrationSettings: async (eventId: string) => {
        const { settingsCache } = get();

        // Check cache first
        const cached = settingsCache.get(eventId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          set({ registrationSettings: cached.data });
          return cached.data;
        }

        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/registration-settings`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              const settings = data.data[0];

              // Update cache
              const newSettingsCache = new Map(settingsCache);
              newSettingsCache.set(eventId, {
                data: settings,
                timestamp: Date.now(),
              });

              set({
                registrationSettings: settings,
                settingsCache: newSettingsCache,
              });

              return settings;
            }
          }
          return null;
        } catch (error) {
          console.error("Error fetching registration settings:", error);
          return null;
        }
      },

      setCurrentEvent: (event) => set({ currentEvent: event }),

      setRegistrationSettings: (settings) =>
        set({ registrationSettings: settings }),

      clearCurrentEvent: () => set({ currentEvent: null }),

      clearCache: () =>
        set({
          eventCache: new Map(),
          settingsCache: new Map(),
        }),

      getEventById: (id: string) => {
        const { events, eventCache } = get();

        // Check cache first
        const cached = eventCache.get(id);
        if (cached) return cached.data;

        // Check events array
        return events.find((event) => event._id === id);
      },
    }),
    {
      name: "event-storage",
      partialize: (state) => ({
        events: state.events,
        currentEvent: state.currentEvent,
        registrationSettings: state.registrationSettings,
        eventCache: Array.from(state.eventCache.entries()),
        settingsCache: Array.from(state.settingsCache.entries()),
      }),
      merge: (persistedState: any, currentState) => {
        // Restore Maps from arrays
        if (
          persistedState?.eventCache &&
          Array.isArray(persistedState.eventCache)
        ) {
          persistedState.eventCache = new Map(persistedState.eventCache);
        }
        if (
          persistedState?.settingsCache &&
          Array.isArray(persistedState.settingsCache)
        ) {
          persistedState.settingsCache = new Map(persistedState.settingsCache);
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
);
