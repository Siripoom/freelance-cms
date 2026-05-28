export const customerTypes = ["individual", "company"] as const;
export const customerSources = ["facebook", "line", "website", "referral", "email", "phone", "other"] as const;
export const customerStatuses = ["new", "active", "inactive"] as const;

export const projectStatuses = ["pending", "active", "review", "revision", "delivered", "completed", "cancelled"] as const;
export const projectTypes = ["website", "pwa", "mobile_app", "tor", "web_app", "design", "other"] as const;
export const paymentStatuses = ["pending", "paid", "overdue"] as const;
export const paymentMethods = ["bank_transfer", "promptpay", "cash", "other"] as const;
export const documentTypes = ["proposal", "tor", "contract", "invoice", "receipt", "requirement", "reference", "design", "other"] as const;

export const allowedDocumentMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "application/zip",
];

export const maxUploadSizeBytes = 15 * 1024 * 1024;
