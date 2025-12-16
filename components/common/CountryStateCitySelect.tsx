"use client";

import { Country, State, City } from "country-state-city";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { XCircle } from "lucide-react";

interface Props {
  control: any;
  watch: any;
  errors?: any;
  showCountry?: boolean;
  disableCountry?: boolean;
  showState?: boolean;
  showCity?: boolean;
  showPincode?: boolean;
  editing?: boolean;
  className?: string;
}

export default function CountryStateCitySelect({
  control,
  watch,
  errors,
  showCountry = true,
  disableCountry = false,
  showState = true,
  showCity = true,
  showPincode = true,
  editing = false,
  className = "",
}: Props) {
  const country = watch("country");
  const state = watch("state");

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Country */}
      {showCountry && (
        <div className="space-y-2">
          <Label>
            Country <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={disableCountry}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Country.getAllCountries().map((c) => (
                    <SelectItem key={c.isoCode} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors?.country && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {errors.country.message}
            </p>
          )}
        </div>
      )}

      {/* State */}
      {showState && (
        <div className="space-y-2">
          <Label>
            State <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value || ""}
                disabled={!editing}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {State.getStatesOfCountry(
                    Country.getAllCountries().find(
                      (c) => c.name === watch("country")
                    )?.isoCode || ""
                  ).map((s) => (
                    <SelectItem key={s.isoCode} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors?.state && (
            <p className="text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>
      )}

      {/* City */}
      {showCity && (
        <div className="space-y-2">
          <Label>
            City <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value}
                disabled={!editing}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {City.getCitiesOfState(
                    Country.getAllCountries().find(
                      (c) => c.name === watch("country")
                    )?.isoCode || "",
                    State.getStatesOfCountry(
                      Country.getAllCountries().find(
                        (c) => c.name === watch("country")
                      )?.isoCode || ""
                    ).find((s) => s.name === watch("state"))?.isoCode || ""
                  ).map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors?.city && (
            <p className="text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>
      )}

      {/* Pincode */}
      {showPincode && (
        <div className="space-y-1.5">
          <Label>
            Postal Code <span className="text-red-600">*</span>
          </Label>
          <Controller
            name="pincode"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="Enter Postal Code"
                {...field}
                disabled={!editing}
              />
            )}
          />
          {errors?.pincode && (
            <p className="text-sm text-red-600">{errors.pincode.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
