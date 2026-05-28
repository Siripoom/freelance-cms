import { z } from "zod";
import {
  customerSources,
  customerStatuses,
  customerTypes,
  documentTypes,
  paymentMethods,
  paymentStatuses,
  projectStatuses,
  projectTypes,
} from "@/lib/constants";

export const customerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(customerTypes),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  lineId: z.string().optional(),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  source: z.enum(customerSources),
  status: z.enum(customerStatuses),
  note: z.string().optional(),
});

export const projectSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(projectTypes),
  totalPrice: z.coerce.number().min(0),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(projectStatuses),
  progress: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
});

export const paymentSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  title: z.string().min(1),
  amount: z.coerce.number().min(0),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  status: z.enum(paymentStatuses),
  paymentMethod: z.enum(paymentMethods),
  note: z.string().optional(),
});

export const documentSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  fileName: z.string().min(1),
  fileType: z.enum(documentTypes),
  fileUrl: z.string().url(),
  storagePath: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
});
