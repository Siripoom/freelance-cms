"use client";

import { useCallback, useEffect, useState } from "react";
import { createDoc, listDocs, patchDoc, removeDoc } from "@/services/firestore-service";
import type { BaseDoc } from "@/types/models";

type CollectionName = "customers" | "leads" | "projects" | "payments" | "followups" | "documents";

export function useCollection<T extends BaseDoc>(uid: string | undefined, name: CollectionName) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      setItems(await listDocs<T>(uid, name));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [name, uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    refresh,
    create: async (data: Record<string, unknown>) => {
      if (!uid) return;
      await createDoc(uid, name, data as never);
      await refresh();
    },
    patch: async (id: string, data: Record<string, unknown>) => {
      if (!uid) return;
      await patchDoc(uid, name, id, data);
      await refresh();
    },
    remove: async (id: string) => {
      if (!uid) return;
      await removeDoc(uid, name, id);
      await refresh();
    },
  };
}
