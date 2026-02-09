// /app/data/profile.ts

export type Profile = {
  photo: string;
  fullName: string;
  prefix: string;
  designation: string;
  affiliation: string;
  department?: string;
  address?: string;
  phone: string;
  email: string;
  country: string;
  gender: string;
  city: string;
  state: string;
  mealPreference: string;
  pincode: string;
  mciRegistered?: "yes" | "no";
  mciNumber?: string;
  mciState?: string;
};

export const getDummyProfile = (): Profile => ({
  photo: "/authImg/user.png", // default avatar
  fullName: "Manpreet Singh Dhillon",
  prefix: "Dr",
  designation: "",
  affiliation: "",
  phone: "4512666232",
  email: "abc@gmail.com",
  country: "",
  gender: "",
  city: "",
  state: "",
  mealPreference: "",
  pincode: "",
});
