"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Funnel,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAbstractStore } from "@/app/store/useAbstractStore";

interface AbstractTableProps {
  onAddAbstract: () => void;
  onEditAbstract: (id: string) => void;
  onViewAbstract?: (id: string) => void;
  onDeleteAbstract?: (id: string) => void;
}

export const AbstractTable = ({
  onAddAbstract,
  onEditAbstract,
  onViewAbstract,
  onDeleteAbstract,
}: AbstractTableProps) => {
  const { abstracts, loading, abstractSettings } = useAbstractStore();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "title" | "abstractNumber" | "status" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Check if user can submit more abstracts
  const canSubmitMore = abstractSettings
    ? abstracts.length < abstractSettings.numberOfAbstractSubmission
    : true;

  const remainingSubmissions = abstractSettings
    ? abstractSettings.numberOfAbstractSubmission - abstracts.length
    : 0;

  const filteredAbstracts = abstracts.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.abstractNumber?.toLowerCase().includes(search.toLowerCase()) ||
      a.presenterName?.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedAbstracts = [...filteredAbstracts].sort((a, b) => {
    if (!sortBy) return 0;

    let aValue, bValue;

    switch (sortBy) {
      case "title":
        aValue = a.title;
        bValue = b.title;
        break;
      case "abstractNumber":
        aValue = a.abstractNumber || "";
        bValue = b.abstractNumber || "";
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    return sortOrder === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedAbstracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedAbstracts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const toggleSort = (column: "title" | "abstractNumber" | "status") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      Pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Pending",
      },
      Reviewed: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Reviewed",
      },
      Accept: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Accepted",
      },
      Reject: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Rejected",
      },
      DRAFT: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: "Draft",
      },
      SUBMITTED: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Submitted",
      },
      ACCEPTED: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Accepted",
      },
      REJECTED: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Rejected",
      },
    };

    const statusConfig = statusMap[status] || {
      color: "bg-gray-100 text-gray-600 border-gray-200",
      label: status,
    };

    return (
      <Badge
        variant="outline"
        className={`capitalize ${statusConfig.color} border`}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  // Function to get presentation type from categories
  const getPresentationType = (abstract: any) => {
    if (abstract.type) return abstract.type;

    if (abstract.categories && Array.isArray(abstract.categories)) {
      const presentationType = abstract.categories.find(
        (cat: any) =>
          cat.categoryId === "presentation_type_id" ||
          cat.categoryLabel?.includes("Presentation") ||
          cat.categoryLabel?.includes("Type"),
      );
      return presentationType?.selectedOption || "N/A";
    }
    return "N/A";
  };

  // Function to get medical category from categories
  const getMedicalCategory = (abstract: any) => {
    if (abstract.category) return abstract.category;

    if (abstract.categories && Array.isArray(abstract.categories)) {
      const medicalCategory = abstract.categories.find(
        (cat: any) =>
          cat.categoryId === "medical_category_id" ||
          cat.categoryLabel?.includes("Medical") ||
          cat.categoryLabel?.includes("Submission"),
      );
      return medicalCategory?.selectedOption || "N/A";
    }
    return "N/A";
  };

  // Format co-authors for display
  const formatCoAuthors = (coAuthors: string[] | undefined) => {
    if (!coAuthors || coAuthors.length === 0) return "None";
    if (coAuthors.length === 1) return coAuthors[0];
    return `${coAuthors[0]} +${coAuthors.length - 1}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="animate-pulse h-8 w-48 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-10 w-40 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00509E]">My Abstracts</h1>
          {abstractSettings ? (
            <div className="text-gray-600 mt-1">
              <p>
                You can submit {abstractSettings.numberOfAbstractSubmission}{" "}
                abstract(s).
                {remainingSubmissions > 0
                  ? ` ${remainingSubmissions} remaining.`
                  : " Maximum limit reached."}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Submission period:{" "}
                {new Date(
                  abstractSettings.abstractSubmissionStartDate,
                ).toLocaleDateString()}{" "}
                -{" "}
                {new Date(
                  abstractSettings.abstractSubmissionEndDate,
                ).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mt-1">Loading abstract settings...</p>
          )}
        </div>

        <Button
          onClick={onAddAbstract}
          className="bg-[#00509E] hover:bg-[#003B73] transition-colors whitespace-nowrap"
          disabled={!canSubmitMore}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Submit Abstract
          {!canSubmitMore && <span className="ml-2">(Limit Reached)</span>}
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        {/* Search Filter */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Funnel className="w-4 h-4 text-gray-600 shrink-0" />
            <Input
              placeholder="Search by title, abstract ID, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="text-sm text-gray-500 ml-4">
            {sortedAbstracts.length} abstract
            {sortedAbstracts.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">#</TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("abstractNumber")}
                >
                  Abstract ID
                  {sortBy === "abstractNumber" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("title")}
                >
                  Title
                  {sortBy === "title" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">
                  Presenting Author
                </TableHead>
                <TableHead className="font-semibold">Co-Authors</TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead className="font-semibold">Last Modified</TableHead>
                <TableHead className="font-semibold text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((abstract, index) => (
                  <TableRow key={abstract.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {abstract.abstractNumber ||
                        abstract.abstractId ||
                        "Pending"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div
                        className="font-medium truncate"
                        title={abstract.title}
                      >
                        {abstract.title}
                      </div>
                      {abstract.abstract && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {abstract.abstract.substring(0, 100)}...
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getPresentationType(abstract)}</TableCell>
                    <TableCell>{getMedicalCategory(abstract)}</TableCell>
                    <TableCell>
                      {abstract.presenterName || abstract.authors || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-xs truncate"
                        title={abstract.coAuthor?.join(", ")}
                      >
                        {formatCoAuthors(abstract.coAuthor)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(abstract.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {abstract.lastModified
                        ? new Date(abstract.lastModified).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onViewAbstract?.(abstract.id.toString())
                          }
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                          title="View abstract"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Only show edit/delete for drafts and pending abstracts */}
                        {["DRAFT", "Pending", "draft"].includes(
                          abstract.status,
                        ) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onEditAbstract(abstract.id.toString())
                              }
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 cursor-pointer"
                              title="Edit abstract"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDeleteAbstract?.(abstract.id.toString())
                              }
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                              title="Delete abstract"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <PlusCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No abstracts found
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {search
                          ? "Try a different search term"
                          : "Submit your first abstract to get started"}
                      </p>
                      {!search && canSubmitMore && (
                        <Button
                          onClick={onAddAbstract}
                          className="mt-4 bg-[#00509E] hover:bg-[#003B73]"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Submit Abstract
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {sortedAbstracts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t text-sm text-gray-600 gap-3">
            <div className="text-sm">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sortedAbstracts.length)} of{" "}
              {sortedAbstracts.length} abstract
              {sortedAbstracts.length !== 1 ? "s" : ""}
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
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[36px] ${
                        currentPage === pageNum
                          ? "bg-[#00509E] text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
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

      {/* Submission Limits Info */}
      {/* {abstractSettings && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            Submission Guidelines
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • Maximum word limit: {abstractSettings.abstractWordCount} words
            </li>
            <li>
              • Maximum submissions per user:{" "}
              {abstractSettings.numberOfAbstractSubmission}
            </li>
            {abstractSettings.uploadFileRequired && (
              <li>• Abstract file upload is required</li>
            )}
            {abstractSettings.uploadVideoUrlRequired && (
              <li>• Video URL is required for presentations</li>
            )}
            <li>
              • Submission deadline:{" "}
              {new Date(
                abstractSettings.abstractSubmissionEndDate,
              ).toLocaleDateString()}
            </li>
          </ul>
        </div>
      )} */}
    </div>
  );
};
