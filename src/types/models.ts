import type {
  customerSources,
  customerStatuses,
  customerTypes,
  documentTypes,
  paymentMethods,
  paymentStatuses,
  projectStatuses,
  projectTypes,
} from "@/lib/constants";

export type CustomerType = (typeof customerTypes)[number];
export type CustomerSource = (typeof customerSources)[number];
export type CustomerStatus = (typeof customerStatuses)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectType = (typeof projectTypes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type DocumentType = (typeof documentTypes)[number];

export type BaseDoc = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type Customer = BaseDoc & {
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  lineId?: string;
  facebookUrl?: string;
  source: CustomerSource;
  status: CustomerStatus;
  note?: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
};

export type Project = BaseDoc & {
  customerId: string;
  customerName: string;
  name: string;
  type: ProjectType;
  totalPrice: number;
  startDate?: string;
  dueDate?: string;
  status: ProjectStatus;
  progress: number;
  description?: string;
  tasks: ProjectTask[];
};

export type Payment = BaseDoc & {
  customerId: string;
  customerName: string;
  projectId: string;
  projectName: string;
  title: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  slipUrl?: string;
  note?: string;
};

export type DocumentMetadata = BaseDoc & {
  customerId?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
  fileName: string;
  fileType: DocumentType;
  fileUrl: string;
  storagePath?: string;
  size?: number;
  mimeType?: string;
  externalUrl?: string;
};
