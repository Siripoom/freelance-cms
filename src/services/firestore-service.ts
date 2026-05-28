import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BaseDoc } from "@/types/models";

type CollectionName = "customers" | "projects" | "payments" | "documents";

function requireDb() {
  if (!db) throw new Error("Firebase config is missing. Fill .env.local first.");
  return db;
}

function col(uid: string, name: CollectionName) {
  return collection(requireDb(), "users", uid, name);
}

export async function listDocs<T extends BaseDoc>(uid: string, name: CollectionName): Promise<T[]> {
  const snapshot = await getDocs(query(col(uid, name), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function createDoc<T extends Omit<BaseDoc, "id">>(uid: string, name: CollectionName, data: Omit<T, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  return addDoc(col(uid, name), { ...data, createdAt: now, updatedAt: now });
}

export async function replaceDoc<T extends Omit<BaseDoc, "id">>(uid: string, name: CollectionName, id: string, data: Omit<T, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  return setDoc(doc(requireDb(), "users", uid, name, id), { ...data, createdAt: now, updatedAt: now });
}

export async function patchDoc(uid: string, name: CollectionName, id: string, data: Record<string, unknown>) {
  return updateDoc(doc(requireDb(), "users", uid, name, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function removeDoc(uid: string, name: CollectionName, id: string) {
  return deleteDoc(doc(requireDb(), "users", uid, name, id));
}
