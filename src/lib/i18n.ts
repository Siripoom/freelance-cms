"use client";

import { create } from "zustand";

export type Locale = "th" | "en";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  th: {
    dashboard: "แดชบอร์ด",
    customers: "ลูกค้า",
    pipeline: "ไปป์ไลน์",
    projects: "โปรเจกต์",
    payments: "การชำระเงิน",
    followups: "ติดตาม",
    documents: "เอกสาร",
    reports: "รายงาน",
    settings: "ตั้งค่า",
    logout: "ออกจากระบบ",
    login: "เข้าสู่ระบบ",
    register: "สมัครสมาชิก",
    email: "อีเมล",
    password: "รหัสผ่าน",
    name: "ชื่อ",
    phone: "โทรศัพท์",
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    create: "เพิ่ม",
    search: "ค้นหา",
    status: "สถานะ",
    source: "ช่องทาง",
    customer: "ลูกค้า",
    project: "งาน",
    amount: "จำนวนเงิน",
    dueDate: "วันครบกำหนด",
    todayFollowups: "ต้องติดตามวันนี้",
    paidIncome: "รายรับเดือนนี้",
    outstanding: "ยอดค้างรับ",
    activeProjects: "งานที่กำลังทำ",
    pipelineValue: "มูลค่างานที่กำลังคุย",
    newCustomers: "ลูกค้าใหม่เดือนนี้",
  },
  en: {
    dashboard: "Dashboard",
    customers: "Customers",
    pipeline: "Pipeline",
    projects: "Projects",
    payments: "Payments",
    followups: "Follow-up",
    documents: "Documents",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    name: "Name",
    phone: "Phone",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    status: "Status",
    source: "Source",
    customer: "Customer",
    project: "Project",
    amount: "Amount",
    dueDate: "Due date",
    todayFollowups: "Follow-ups today",
    paidIncome: "Income this month",
    outstanding: "Outstanding",
    activeProjects: "Active projects",
    pipelineValue: "Pipeline value",
    newCustomers: "New customers this month",
  },
};

type I18nState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

export const useI18n = create<I18nState>((set, get) => ({
  locale: "th",
  setLocale: (locale) => {
    localStorage.setItem("freelance-crm-locale", locale);
    set({ locale });
  },
  t: (key) => dictionaries[get().locale][key] ?? key,
}));

export function initLocale() {
  const stored = localStorage.getItem("freelance-crm-locale") as Locale | null;
  if (stored === "th" || stored === "en") useI18n.getState().setLocale(stored);
}
