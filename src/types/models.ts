import type {
  channels,
  customerSources,
  customerStatuses,
  customerTypes,
  documentTypes,
  followupStatuses,
  leadStatuses,
  paymentMethods,
  paymentStatuses,
  priorities,
  projectStatuses,
  projectTypes,
} from "@/lib/constants";

export type CustomerType = (typeof customerTypes)[number];
export type CustomerSource = (typeof customerSources)[number];
export type CustomerStatus = (typeof customerStatuses)[number];
export type LeadStatus = (typeof leadStatuses)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectType = (typeof projectTypes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type FollowupStatus = (typeof followupStatuses)[number];
export type Priority = (typeof priorities)[number];
export type Channel = (typeof channels)[number];
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

export type Lead = BaseDoc & {
  customerId: string;
  customerName: string;
  title: string;
  estimatedValue: number;
  status: LeadStatus;
  source: CustomerSource;
  followUpDate?: string;
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

export type Followup = BaseDoc & {
  customerId: string;
  customerName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  followUpDate: string;
  status: FollowupStatus;
  priority: Priority;
  channel: Channel;
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
