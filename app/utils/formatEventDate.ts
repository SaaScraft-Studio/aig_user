// utils/formatEventDate.ts
export function formatEventDate(startDate?: string, endDate?: string) {
  if (!startDate) return ""; // ✅ early return if startDate missing

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const start = parseDate(startDate);
  if (!endDate) return formatter.format(start);

  const end = parseDate(endDate);

  // If same date → show only once
  if (start.getTime() === end.getTime()) {
    return formatter.format(start);
  }

  // If different → show range
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function formatSlabValidity(startISO?: string, endISO?: string) {
  if (!startISO || !endISO) return "";

  const fmt = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const start = new Date(startISO);
  const end = new Date(endISO);
  const today = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  // Only two states now: valid or expired
  if (today <= end) {
    return `Valid till ${fmt.format(end)}`;
  }

  return `Validity expired on ${fmt.format(end)}`;
}

export function formatValidTill(endDate?: string) {
  if (!endDate) return "";

  // Check if date is in DD/MM/YYYY format
  const isSlabFormat = endDate.includes("/") && !endDate.includes("-");

  let end: Date;

  if (isSlabFormat) {
    // Parse DD/MM/YYYY format
    const [day, month, year] = endDate.split("/").map(Number);
    end = new Date(year, month - 1, day);
  } else {
    // Parse ISO format (YYYY-MM-DD)
    end = new Date(endDate);
  }

  if (Number.isNaN(end.getTime())) return "";

  const fmt = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const today = new Date();

  if (today <= end) {
    return `Valid till ${fmt.format(end)}`;
  }

  return `valid till ${fmt.format(end)}`;
}

//for single dates
export function formatSingleDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const formatBanquetDate = (dateStr: string): string => {
  if (!dateStr) return "-";

  try {
    // Check if it's already in a different format
    if (dateStr.includes("-") || dateStr.includes("T")) {
      // Try formatSingleDate for ISO or other formats
      const formatted = formatSingleDate(dateStr);
      if (formatted !== "Invalid Date") {
        return formatted;
      }
    }

    // Handle DD/MM/YYYY format specifically for banquet dates
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr
        .split("/")
        .map((num) => parseInt(num, 10));

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Validate month (1-12)
      if (month >= 1 && month <= 12) {
        return `${day} ${monthNames[month - 1]} ${year}`;
      }
    }

    return dateStr; // Return original if can't parse
  } catch (error) {
    console.error("Error formatting banquet date:", error);
    return dateStr;
  }
};
