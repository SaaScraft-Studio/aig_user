"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatEventDate } from "@/app/utils/formatEventDate";
import { SkeletonTable } from "@/components/common/skeleton-table";

type Workshop = {
  _id: string;
  eventId: string;
  workshopName: string;
  workshopCategory: string;
  hallName: string;
  amount: number;
  maxRegAllowed: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isEventRegistrationRequired: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

// Update the types to match the actual API response structure
type WorkshopRegistrationItem = {
  _id: string;
  workshopIds: Workshop;
};

type RegisteredWorkshop = {
  _id: string;
  eventId: {
    _id: string;
    eventName: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    // other event fields
  };
  workshops: WorkshopRegistrationItem[];
  registrationType: "Paid" | "Free";
  totalAmount: number;
  paymentStatus: "Pending" | "Completed";
  createdAt: string;
  updatedAt: string;
  userId: string;
  __v: number;
};

type Props = {
  eventId?: string | null;
  registrationId?: string | null;
  onAddClick: () => void;
  onEditClick: (workshopId: number) => void;
  refreshTrigger?: number;
};

// Create a new type for flattened workshop items
type FlatWorkshopItem = {
  workshop: Workshop;
  registrationId: string;
  registrationType: "Paid" | "Free";
  paymentStatus: "Pending" | "Completed";
  registrationDate: string;
  workshopItemId: string; // The _id from workshops array
};

export default function WorkshopTable({
  eventId,
  registrationId,
  onAddClick,
  onEditClick,
  refreshTrigger = 0,
}: Props) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flatWorkshopItems, setFlatWorkshopItems] = useState<
    FlatWorkshopItem[]
  >([]);
  const [registeredWorkshops, setRegisteredWorkshops] = useState<
    RegisteredWorkshop[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [sortBy, setSortBy] = useState<"name" | "date" | "price" | "category">(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch registered workshops from API
  const fetchRegisteredWorkshops = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/my-registrations/event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.success && Array.isArray(data.data)) {
        const regs: RegisteredWorkshop[] = data.data;
        setRegisteredWorkshops(regs);

        // ✅ FIXED: Flatten ALL workshop items (including duplicates)
        const allFlatWorkshopItems: FlatWorkshopItem[] = [];

        regs.forEach((registration) => {
          if (registration.workshops && Array.isArray(registration.workshops)) {
            registration.workshops.forEach((workshopItem) => {
              if (workshopItem.workshopIds && workshopItem.workshopIds._id) {
                allFlatWorkshopItems.push({
                  workshop: workshopItem.workshopIds,
                  registrationId: registration._id,
                  registrationType: registration.registrationType,
                  paymentStatus: registration.paymentStatus,
                  registrationDate: registration.createdAt,
                  workshopItemId: workshopItem._id,
                });
              }
            });
          }
        });

        setFlatWorkshopItems(allFlatWorkshopItems);
      } else {
        setRegisteredWorkshops([]);
        setFlatWorkshopItems([]);
      }
    } catch (error) {
      console.error("Error fetching registered workshops:", error);
      setError("Failed to load registered workshops");
      setRegisteredWorkshops([]);
      setFlatWorkshopItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRegisteredWorkshops();
  };

  // Fetch data when eventId changes or refreshTrigger updates
  useEffect(() => {
    fetchRegisteredWorkshops();
  }, [eventId, refreshTrigger]);

  const toggleSort = (column: "name" | "date" | "price" | "category") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortedWorkshops = () => {
    let filtered = flatWorkshopItems.filter((item) =>
      item.workshop.workshopName.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === "name") {
          const nameA = a.workshop.workshopName.toLowerCase();
          const nameB = b.workshop.workshopName.toLowerCase();
          return sortOrder === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        } else if (sortBy === "date") {
          const dateA = new Date(a.workshop.startDate).getTime();
          const dateB = new Date(b.workshop.startDate).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } else if (sortBy === "price") {
          return sortOrder === "asc"
            ? a.workshop.amount - b.workshop.amount
            : b.workshop.amount - a.workshop.amount;
        } else if (sortBy === "category") {
          return sortOrder === "asc"
            ? a.workshop.workshopCategory.localeCompare(
                b.workshop.workshopCategory
              )
            : b.workshop.workshopCategory.localeCompare(
                a.workshop.workshopCategory
              );
        }
        return 0;
      });
    }

    return filtered;
  };

  const sortedWorkshops = getSortedWorkshops();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedWorkshops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedWorkshops.slice(startIndex, endIndex);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  const getSortIcon = (column: "name" | "date" | "price" | "category") => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#00509E]">
            My Registered Workshops
          </h2>
          {eventId && (
            <p className="text-gray-600 text-sm mt-1">
              View your registered workshops for this event
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddClick}
            className="bg-[#00509E] hover:bg-[#003B73] transition-colors cursor-pointer whitespace-nowrap"
            disabled={!eventId}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Register for More Workshops
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search registered workshops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
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
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Workshop Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSort("category")}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon("category")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Date & Time
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Venue
              </TableHead>
              {/* <TableHead
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSort("price")}
              >
                <div className="flex items-center gap-1">
                  Price
                  {getSortIcon("price")}
                </div>
              </TableHead> */}
              <TableHead className="font-semibold text-gray-900">
                Registration Type
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                Payment Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <SkeletonTable rows={5} columns={8} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const workshop = item.workshop;

                return (
                  <TableRow
                    key={`${item.registrationId}-${item.workshopItemId}-${
                      startIndex + index
                    }`}
                    className="hover:bg-gray-50/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">
                          {workshop.workshopName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {workshop.workshopCategory || "General"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatEventDate(workshop.startDate)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {workshop.startTime} - {workshop.endTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{workshop.hallName}</span>
                      </div>
                    </TableCell>
                    {/* <TableCell className="font-semibold text-[#00509E]">
                      {workshop.amount > 0
                        ? `₹${workshop.amount.toLocaleString("en-IN")}`
                        : "Free"}
                    </TableCell> */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.registrationType === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.registrationType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.paymentStatus === "Completed"
                            ? "bg-green-100 text-green-800"
                            : item.paymentStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.paymentStatus === "Completed" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {item.paymentStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <PlusCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-600">No registered workshops</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {eventId
                        ? "You haven't registered for any workshops yet"
                        : "Please select an event to view registered workshops"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {sortedWorkshops.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, sortedWorkshops.length)} of{" "}
              {sortedWorkshops.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
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
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          Showing {flatWorkshopItems.length} workshop registrations from{" "}
          {registeredWorkshops.length} registration entries
        </p>
      </div>
    </div>
  );
}
