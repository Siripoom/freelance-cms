import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

function requireStorage() {
  if (!storage) throw new Error("Firebase config is missing. Fill .env.local first.");
  return storage;
}

export async function uploadUserFile(uid: string, file: File) {
  const path = `users/${uid}/documents/${Date.now()}-${file.name}`;
  const fileRef = ref(requireStorage(), path);
  await uploadBytes(fileRef, file);
  return {
    fileUrl: await getDownloadURL(fileRef),
    storagePath: path,
  };
}

export async function deleteUserFile(path?: string) {
  if (!path) return;
  await deleteObject(ref(requireStorage(), path));
}
