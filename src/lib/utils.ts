import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function isDueToday(isoDate?: string) {
  if (!isoDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) === today;
}

export function isOverdue(isoDate?: string) {
  if (!isoDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) < today;
}
