"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Funnel,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBanquetDate } from "@/app/utils/formatEventDate";
import { SkeletonTable } from "@/components/common/skeleton-table";

type BanquetRegistration = {
  _id: string;
  banquet: {
    _id: string;
    banquetslabName: string;
    startDate: string;
    time: string;
    venue: string;
  };
  event: {
    _id: string;
    eventName: string;
    eventCode: string;
  };
  registration: {
    _id: string;
    regNum: string;
    registrationSlabName: string;
  };
  paidBanquets: Array<{
    _id: string;
    userId?: {
      _id: string;
      fullName: string;
      email: string;
    };
    accompanyDetails?: {
      parentAccompanyId: string;
      fullName: string;
      relation: string;
      age: number;
      gender: string;
      mealPreference: string;
    };
    otherName?: string;
    isPaid: boolean;
  }>;
};

type Props = {
  onAddClick: () => void;
  onEditClick: (id: string, banquetData: any) => void;
  hasRegistration?: boolean;
  eventId?: string | null;
  refreshTrigger?: number;
};

export default function BanquetTable({
  onAddClick,
  onEditClick,
  hasRegistration = false,
  eventId,
  refreshTrigger = 0,
}: Props) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [banquetRegistrations, setBanquetRegistrations] = useState<
    BanquetRegistration[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  const itemsPerPage = 10;

  // Fetch paid banquet registrations
  const fetchPaidBanquets = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/banquet-registrations/paid/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Fetched paid banquets:", data);

      if (data.success && Array.isArray(data.data)) {
        setBanquetRegistrations(data.data);
      } else {
        setBanquetRegistrations([]);
      }
    } catch (error) {
      console.error("Error fetching paid banquets:", error);
      setBanquetRegistrations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaidBanquets();
  };

  // Fetch data when eventId changes or refreshTrigger updates
  useEffect(() => {
    if (eventId && hasRegistration) {
      fetchPaidBanquets();
    }
  }, [eventId, hasRegistration, refreshTrigger]);

  const handleSort = (field: "name" | "date") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Flatten all banquet entries for display
  const allBanquetEntries = banquetRegistrations.flatMap((reg) =>
    reg.paidBanquets.map((banquet) => ({
      ...banquet,
      registrationId: reg._id,
      banquetName: reg.banquet?.banquetslabName || "N/A",
      eventName: reg.event?.eventName || "N/A",
      regNum: reg.registration?.regNum || "N/A",
      banquetStartDate: reg.banquet?.startDate || "N/A",
      banquetTime: reg.banquet?.time || "N/A",
      venue: reg.banquet?.venue || "N/A",
      hasBanquetData: !!reg.banquet,
    }))
  );

  const sorted = [...allBanquetEntries]
    .filter((entry) => {
      const searchTerm = search.toLowerCase();
      const personName =
        entry.userId?.fullName?.toLowerCase() ||
        entry.accompanyDetails?.fullName?.toLowerCase() ||
        entry.otherName?.toLowerCase() ||
        "";
      return (
        personName.includes(searchTerm) ||
        entry.banquetName.toLowerCase().includes(searchTerm)
      );
    })
    // Update the sorting logic in the sorted array creation:
    .sort((a, b) => {
      if (sortBy === "name") {
        const nameA = (
          a.userId?.fullName ||
          a.accompanyDetails?.fullName ||
          a.otherName ||
          ""
        ).toLowerCase();
        const nameB = (
          b.userId?.fullName ||
          b.accompanyDetails?.fullName ||
          b.otherName ||
          ""
        ).toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        // Helper to parse date string to timestamp
        const parseDateToTimestamp = (dateStr: string): number => {
          if (!dateStr) return 0;

          try {
            // Try parsing as ISO date first
            const isoDate = new Date(dateStr);
            if (!isNaN(isoDate.getTime())) {
              return isoDate.getTime();
            }

            // Try parsing DD/MM/YYYY format
            if (dateStr.includes("/")) {
              const [day, month, year] = dateStr.split("/").map(Number);
              // Create date in YYYY-MM-DD format for reliable parsing
              const date = new Date(year, month - 1, day);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }

            return 0;
          } catch {
            return 0;
          }
        };

        const dateA = parseDateToTimestamp(a.banquetStartDate);
        const dateB = parseDateToTimestamp(b.banquetStartDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sorted.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  const getSortIcon = (field: "name" | "date") => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="inline w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="inline w-3 h-3 ml-1" />
    );
  };

  const getPersonName = (entry: any) => {
    if (entry.userId)
      return `${entry.userId.fullName || entry.userId.name || "User"} (Self)`;
    if (entry.accompanyDetails)
      return `${entry.accompanyDetails.fullName} (Accompany)`;
    if (entry.otherName) return `${entry.otherName} (Other)`;
    return "Unknown";
  };

  const getRelationValue = (entry: any) => {
    if (entry.userId) return "Self";
    if (entry.accompanyDetails)
      return entry.accompanyDetails.relation || "Accompany";
    if (entry.otherName) return "Other";
    return "Unknown";
  };

  const getPersonDetails = (entry: any) => {
    if (entry.accompanyDetails) {
      return `${entry.accompanyDetails.relation} • ${entry.accompanyDetails.age} years • ${entry.accompanyDetails.gender}`;
    }
    return "";
  };

  // if (loading && !refreshing) {
  //   return (
  //     <div className="flex items-center justify-center min-h-64">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
  //         <p className="text-gray-600">Loading banquet registrations...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#00509E]">
            Banquet Registrations
          </h2>
          {eventId && hasRegistration && (
            <p className="text-gray-600 text-sm mt-1">
              Managing banquet registrations for your event
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasRegistration && (
            <>
              {/* <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing || !eventId}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button> */}
              <Button
                onClick={onAddClick}
                className="bg-[#00509E] hover:bg-[#003B73] transition-colors cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Book Banquet
              </Button>
            </>
          )}
          {!hasRegistration && (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Complete registration to book banquet
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {hasRegistration && banquetRegistrations.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Funnel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search banquet entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-900">#</TableHead>
              <TableHead
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Person Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Relation
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Banquet Name
              </TableHead>
              {/* <TableHead className="font-semibold text-gray-900">
                Details
              </TableHead> */}
              <TableHead
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Banquet Date
                  {getSortIcon("date")}
                </div>
              </TableHead>
              {/* <TableHead className="font-semibold text-gray-900">
                Venue
              </TableHead> */}
              {/* <TableHead className="font-semibold text-gray-900">
                Registration No.
              </TableHead> */}
              <TableHead className="font-semibold text-gray-900 text-right">
                Status
              </TableHead>
              {/* <TableHead className="font-semibold text-gray-900 text-right">
                Actions
              </TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && !refreshing ? (
              <SkeletonTable rows={5} columns={6} />
            ) : currentItems.length > 0 ? (
              currentItems.map((entry, index) => (
                <TableRow
                  key={`${entry.registrationId}-${entry._id}`}
                  className="hover:bg-gray-50/50"
                >
                  <TableCell className="font-sm text-gray-900">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="font-sm">
                    {getPersonName(entry)}
                  </TableCell>
                  <TableCell className="font-sm">
                    {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"> */}
                    {getRelationValue(entry)}
                    {/* </span> */}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {entry.banquetName} {/* Add Banquet Name */}
                    </span>
                  </TableCell>
                  {/* <TableCell className="text-sm text-gray-600">
                    {getPersonDetails(entry)}
                  </TableCell> */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-sm text-gray-900">
                        {formatBanquetDate(entry.banquetStartDate)}
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell className="text-sm">{entry.venue}</TableCell> */}
                  {/* <TableCell className="font-mono text-sm">
                    {entry.regNum}
                  </TableCell> */}
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  </TableCell>
                  {/* <TableCell className="text-right">
                    {(entry.otherName || entry.accompanyDetails) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                        onClick={() => onEditClick(entry.registrationId, entry)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <PlusCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-600">
                      {hasRegistration
                        ? "No banquet registrations found"
                        : "Complete registration to book banquet"}
                    </p>
                    {hasRegistration && (
                      <p className="text-sm text-gray-500 mt-1">
                        Click "Book Banquet" to get started
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {sorted.length > 0 && hasRegistration && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sorted.length)} of{" "}
              {sorted.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
