"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { formatEventDate, formatSingleDate } from "@/app/utils/formatEventDate";
import { SkeletonTable } from "../common/skeleton-table";

type PaymentStatus = "paid" | "failed" | "pending" | "initiated";

const itemsPerPage = 15;

export default function PaymentHistoryTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to view payment history");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/my`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch payments");
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setAllPayments(data.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  // Safe data access function
  const getEventName = (payment: any) => {
    // Check if event data is directly available in eventId
    if (payment.eventId && payment.eventId.eventName) {
      return payment.eventId.eventName;
    }
    // Check if it's a workshop payment with workshopRegistrationId
    if (
      payment.workshopRegistrationId &&
      payment.workshopRegistrationId.eventId
    ) {
      return (
        payment.workshopRegistrationId.eventId.eventName || "Workshop Event"
      );
    }
    // Check if it's a regular event registration
    if (payment.eventRegistrationId?.eventId) {
      return payment.eventRegistrationId.eventId.eventName || "Event";
    }
    // Check if eventRegistrationId is a string (reference ID)
    if (typeof payment.eventRegistrationId === "string") {
      return "Event";
    }
    return "Event";
  };

  // Replace the existing getEventDate function with this:
  const getEventDate = (payment: any) => {
    // Check direct eventId first
    if (payment.eventId?.startDate && payment.eventId?.endDate) {
      return formatEventDate(
        payment.eventId.startDate,
        payment.eventId.endDate
      );
    }
    // Check workshop registration
    if (
      payment.workshopRegistrationId?.eventId?.startDate &&
      payment.workshopRegistrationId?.eventId?.endDate
    ) {
      return formatEventDate(
        payment.workshopRegistrationId.eventId.startDate,
        payment.workshopRegistrationId.eventId.endDate
      );
    }
    // Check event registration
    if (
      payment.eventRegistrationId?.eventId?.startDate &&
      payment.eventRegistrationId?.eventId?.endDate
    ) {
      return formatEventDate(
        payment.eventRegistrationId.eventId.startDate,
        payment.eventRegistrationId.eventId.endDate
      );
    }
    return "Date not available";
  };

  const filteredPayments = allPayments.filter(
    (payment) =>
      payment.razorpayOrderId?.toLowerCase().includes(search.toLowerCase()) ||
      payment.razorpayPaymentId?.toLowerCase().includes(search.toLowerCase()) ||
      payment.status?.toLowerCase().includes(search.toLowerCase()) ||
      getEventName(payment).toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200";
      case "pending":
      case "initiated":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentCategoryColor = (category: string) => {
    switch (category) {
      case "Event Registration":
        return "bg-[#001BB7]/10 text-[#001BB7] border border-[#001BB7]/30";
      case "Workshop":
        return "bg-[#F87B1B]/10 text-[#F87B1B] border border-[#F87B1B]/30";
      case "Accompany":
        return "bg-[#0A400C]/10 text-[#0A400C] border border-[#0A400C]/30";
      case "Banquet":
        return "bg-[#03A6A1]/10 text-[#03A6A1] border border-[#03A6A1]/30";
      default:
        return "bg-[#393E46]/10 text-[#393E46] border border-[#393E46]/30";
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    // TODO: Implement receipt download
    alert("Receipt download feature coming soon!");
  };

  const handleViewDetails = (payment: any) => {
    // TODO: Implement detailed view
    alert("Payment details view coming soon!");
  };

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4 text-[#00509E]">
          Payment History
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4 text-[#00509E]">
        Payment History
      </h1>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            {allPayments.length}
          </div>
          <div className="text-sm text-gray-600">Total Payments</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {allPayments.filter((p) => p.status === "paid").length}
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {
              allPayments.filter(
                (p) => p.status === "pending" || p.status === "initiated"
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {allPayments.filter((p) => p.status === "failed").length}
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
          <Input
            type="text"
            placeholder="Search by Order ID, Payment ID, Event Name, or Status..."
            className="flex-1 bg-white"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredPayments.length} payments found
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Event Name</th>
                <th className="px-4 py-3 font-medium">Payment Category</th>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Payment Date</th>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Payment Mode</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonTable key={idx} rows={5} columns={9} />
                ))
              ) : currentPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-lg mb-2">No payments found</div>
                      <div className="text-sm text-gray-400">
                        {search
                          ? "Try adjusting your search terms"
                          : "You haven't made any payments yet"}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{getEventName(payment)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getEventDate(payment)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={getPaymentCategoryColor(
                          payment.paymentCategory
                        )}
                      >
                        {payment.paymentCategory}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {payment.razorpayOrderId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {payment._id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {formatSingleDate(payment.createdAt)}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">
                        {payment.razorpayPaymentId || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">
                        {payment.paymentMode || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={getStatusBadge(payment.status)}
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                          className="h-8 px-2"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {payment.status === "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment)}
                            className="h-8 px-2"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && currentPayments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredPayments.length)} of{" "}
              {filteredPayments.length} entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm text-gray-600 min-w-20 text-center">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-2"
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
