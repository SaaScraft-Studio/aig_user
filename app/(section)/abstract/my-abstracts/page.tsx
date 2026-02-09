// app/abstract/my-abstracts/page.tsx
"use client";

import { useAbstractStore } from "@/app/store/useAbstractStore";
import AbstractFormSidebar from "@/components/abstract/myAbstract/AbstractFormSidebar";
import { AbstractTable } from "@/components/abstract/myAbstract/MyAbstractTable";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";

export default function MyAbstractPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  const {
    openSidebar,
    closeSidebar,
    isSidebarOpen,
    deleteAbstract,
    fetchAbstracts,
    fetchAbstractSettings,
    fetchCategories,
    loading,
  } = useAbstractStore();

  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchAbstracts(eventId);
      fetchAbstractSettings(eventId);
      fetchCategories(eventId);
    }
  }, [eventId, fetchAbstracts, fetchAbstractSettings, fetchCategories]);

  const handleAdd = () => {
    setEditId(null);
    openSidebar();
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    openSidebar(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this abstract?")) {
      deleteAbstract(id);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <AbstractTable
        onAddAbstract={handleAdd}
        onEditAbstract={handleEdit}
        onDeleteAbstract={handleDelete}
      />

      <AbstractFormSidebar
        open={isSidebarOpen}
        onClose={() => {
          closeSidebar();
          setEditId(null);
        }}
        editId={editId}
        eventId={eventId}
      />
    </>
  );
}
