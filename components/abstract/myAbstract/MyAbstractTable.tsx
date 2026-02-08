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
import { ChevronLeft, ChevronRight, PlusCircle, Funnel } from "lucide-react";
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
  const { abstracts } = useAbstractStore();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"index" | "title" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAbstracts = abstracts.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAbstracts = [...filteredAbstracts].sort((a, b) => {
    if (!sortBy) return 0;
    if (sortBy === "title") {
      return sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    if (sortBy === "index") {
      const indexA = abstracts.findIndex((x) => x.id === a.id);
      const indexB = abstracts.findIndex((x) => x.id === b.id);
      return sortOrder === "asc" ? indexA - indexB : indexB - indexA;
    }
    return 0;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedAbstracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedAbstracts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "bg-gray-200 text-gray-700",
      submitted: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const normalizedStatus = status.toLowerCase(); // Convert to lowercase

    return (
      <Badge
        className={`capitalize ${
          statusMap[normalizedStatus] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#00509E]">Abstracts</h2>
        <Button
          onClick={onAddAbstract}
          className="bg-[#00509E] hover:bg-[#003B73] transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Abstract
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border bg-white overflow-hidden">
        {/* Search Filter */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          <Funnel className="w-4 h-4 text-gray-600" />
          <Input
            placeholder="Search abstract title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm bg-white"
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader className="bg-gray-100 uppercase">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Abstract ID</TableHead>
              <TableHead>abstract title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>presenting author</TableHead>
              <TableHead>co-authors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Accepted for</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((a, index) => (
                <TableRow key={a.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{a.abstractId}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {a.title}
                  </TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>{a.authors}</TableCell>
                  <TableCell>{a.authors}</TableCell>
                  <TableCell>{getStatusBadge(a.status)}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewAbstract?.(a.id.toString())}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        View
                      </Button>

                      {["DRAFT"].includes(a.status) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditAbstract(a.id.toString())}
                            className="text-green-600 hover:text-green-800 cursor-pointer"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteAbstract?.(a.id.toString())}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            Delete
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
                  colSpan={9}
                  className="text-center py-6 text-gray-500"
                >
                  No abstracts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
          <span>
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, sortedAbstracts.length)} of{" "}
            {sortedAbstracts.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
