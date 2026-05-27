"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useCollection } from "@/hooks/use-collection";
import {
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
  allowedDocumentMimeTypes,
  maxUploadSizeBytes,
} from "@/lib/constants";
import { useI18n, type Locale } from "@/lib/i18n";
import { currency, downloadCsv, isDueToday, isOverdue } from "@/lib/utils";
import { deleteUserFile, uploadUserFile } from "@/services/storage-service";
import type { Customer, DocumentMetadata, Followup, Lead, Payment, Project } from "@/types/models";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";

function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {action}
    </div>
  );
}

function statusTone(status: string) {
  if (["paid", "done", "completed", "won", "active"].includes(status)) return "green";
  if (["overdue", "lost", "cancelled"].includes(status)) return "red";
  if (["pending", "waiting_decision", "waiting_deposit", "review", "revision"].includes(status)) return "amber";
  return "blue";
}

function LoadingError({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="text-sm text-slate-500">Loading...</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>;
  return null;
}

function customerOptions(customers: Customer[]) {
  return customers.map((customer) => `${customer.id}|${customer.name}`);
}

function projectOptions(projects: Project[]) {
  return projects.map((project) => `${project.id}|${project.name}|${project.customerId}|${project.customerName}`);
}

function splitCustomer(value: string) {
  const [customerId, customerName] = value.split("|");
  return { customerId, customerName };
}

function splitProject(value: string) {
  const [projectId, projectName, customerId, customerName] = value.split("|");
  return { projectId, projectName, customerId, customerName };
}

export function DashboardPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const leads = useCollection<Lead>(user?.uid, "leads");
  const projects = useCollection<Project>(user?.uid, "projects");
  const payments = useCollection<Payment>(user?.uid, "payments");
  const followups = useCollection<Followup>(user?.uid, "followups");
  const month = new Date().toISOString().slice(0, 7);
  const paidIncome = payments.items.filter((p) => p.status === "paid" && p.paidDate?.startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
  const outstanding = payments.items.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const pipelineValue = leads.items.filter((l) => !["won", "lost"].includes(l.status)).reduce((sum, l) => sum + l.estimatedValue, 0);
  const activeProjects = projects.items.filter((p) => ["active", "review", "revision"].includes(p.status)).length;
  const todayFollowups = followups.items.filter((f) => f.status === "pending" && isDueToday(f.followUpDate)).length;
  const newCustomers = customers.items.filter((c) => c.createdAt.startsWith(month)).length;
  const paymentChart = paymentStatuses.map((status) => ({ name: status, value: payments.items.filter((p) => p.status === status).length }));
  const incomeChart = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return { name: key, income: payments.items.filter((p) => p.status === "paid" && p.paidDate?.startsWith(key)).reduce((sum, p) => sum + p.amount, 0) };
  });

  return (
    <>
      <PageHeader title="Dashboard" />
      <LoadingError loading={payments.loading || customers.loading || projects.loading || leads.loading || followups.loading} error={payments.error || customers.error || projects.error || leads.error || followups.error} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["รายรับเดือนนี้", currency(paidIncome)],
          ["ยอดค้างรับ", currency(outstanding)],
          ["มูลค่างานที่กำลังคุย", currency(pipelineValue)],
          ["งานที่กำลังทำ", activeProjects],
          ["ลูกค้าที่ต้องติดตามวันนี้", todayFollowups],
          ["ลูกค้าใหม่เดือนนี้", newCustomers],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Monthly Income</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#0f3d91" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Payment Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentChart} dataKey="value" nameKey="name" outerRadius={95} label>
                  {paymentChart.map((_, index) => <Cell key={index} fill={["#0f3d91", "#38bdf8", "#ef4444"][index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}

export function CustomersPage() {
  const { user } = useAuth();
  const data = useCollection<Customer>(user?.uid, "customers");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", type: "individual", phone: "", email: "", lineId: "", facebookUrl: "", source: "facebook", status: "new", note: "" });
  const filtered = data.items.filter((item) => `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase()));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create(form);
    setForm({ name: "", type: "individual", phone: "", email: "", lineId: "", facebookUrl: "", source: "facebook", status: "new", note: "" });
  }

  return (
    <>
      <PageHeader title="Customers" />
      <LoadingError loading={data.loading} error={data.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{customerTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{customerSources.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{customerStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="LINE"><Input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} /></Field>
          <Field label="Facebook URL"><Input value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} /></Field>
          <div className="flex items-end"><Button><Plus className="h-4 w-4" />Add</Button></div>
          <div className="md:col-span-3"><Field label="Note"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field></div>
        </form>
      </Card>
      <div className="mb-4 max-w-sm"><Input placeholder="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <EntityTable items={filtered} columns={["name", "phone", "email", "source", "status"]} onDelete={data.remove} />
    </>
  );
}

export function PipelinePage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const leads = useCollection<Lead>(user?.uid, "leads");
  const projects = useCollection<Project>(user?.uid, "projects");
  const [form, setForm] = useState({ customer: "", title: "", estimatedValue: 0, status: "new", source: "facebook", followUpDate: "", note: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const customer = splitCustomer(form.customer);
    await leads.create({ ...customer, title: form.title, estimatedValue: Number(form.estimatedValue), status: form.status, source: form.source, followUpDate: form.followUpDate, note: form.note });
    setForm({ customer: "", title: "", estimatedValue: 0, status: "new", source: "facebook", followUpDate: "", note: "" });
  }

  async function convert(lead: Lead) {
    await projects.create({ customerId: lead.customerId, customerName: lead.customerName, name: lead.title, type: "web_app", totalPrice: lead.estimatedValue, status: "pending", progress: 0, description: lead.note, tasks: [] });
    await leads.patch(lead.id, { status: "won" });
  }

  return (
    <>
      <PageHeader title="Pipeline" />
      <LoadingError loading={leads.loading || customers.loading} error={leads.error || customers.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required><option value="">Select</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Value"><Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} /></Field>
          <Field label="Follow-up"><Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Note"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button>Add Lead</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 overflow-x-auto xl:grid-cols-4 2xl:grid-cols-8">
        {leadStatuses.map((status) => (
          <Card key={status} className="min-h-72">
            <h2 className="mb-3 text-sm font-semibold">{status}</h2>
            <div className="space-y-3">
              {leads.items.filter((lead) => lead.status === status).map((lead) => (
                <div key={lead.id} className="rounded-md border border-blue-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,61,145,0.05)]">
                  <div className="font-medium">{lead.title}</div>
                  <div className="text-xs text-slate-500">{lead.customerName}</div>
                  <div className="mt-2 text-sm">{currency(lead.estimatedValue)}</div>
                  <Select className="mt-2" value={lead.status} onChange={(e) => leads.patch(lead.id, { status: e.target.value })}>{leadStatuses.map((x) => <option key={x}>{x}</option>)}</Select>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" type="button" onClick={() => convert(lead)}>Convert</Button>
                    <Button variant="danger" type="button" onClick={() => leads.remove(lead.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function ProjectsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const data = useCollection<Project>(user?.uid, "projects");
  const [form, setForm] = useState({ customer: "", name: "", type: "web_app", totalPrice: 0, startDate: "", dueDate: "", status: "pending", progress: 0, description: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create({ ...splitCustomer(form.customer), name: form.name, type: form.type, totalPrice: Number(form.totalPrice), startDate: form.startDate, dueDate: form.dueDate, status: form.status, progress: Number(form.progress), description: form.description, tasks: [] });
    setForm({ customer: "", name: "", type: "web_app", totalPrice: 0, startDate: "", dueDate: "", status: "pending", progress: 0, description: "" });
  }

  return (
    <>
      <PageHeader title="Projects" />
      <LoadingError loading={data.loading || customers.loading} error={data.error || customers.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required><option value="">Select</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{projectTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Price"><Input type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: Number(e.target.value) })} /></Field>
          <Field label="Start"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Due"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{projectStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Progress"><Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></Field>
          <div className="md:col-span-3"><Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button>Add Project</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((project) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{project.name}</h2>
                <p className="text-sm text-slate-500">{project.customerName}</p>
              </div>
              <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            </div>
            <div className="mt-4 text-sm">{currency(project.totalPrice)}</div>
            <div className="mt-3 h-2 rounded-full bg-blue-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${project.progress}%` }} /></div>
            <div className="mt-3 flex gap-2">
              <Select value={project.status} onChange={(e) => data.patch(project.id, { status: e.target.value })}>{projectStatuses.map((x) => <option key={x}>{x}</option>)}</Select>
              <Button variant="danger" onClick={() => data.remove(project.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function PaymentsPage() {
  const { user } = useAuth();
  const projects = useCollection<Project>(user?.uid, "projects");
  const data = useCollection<Payment>(user?.uid, "payments");
  const [form, setForm] = useState({ project: "", title: "", amount: 0, dueDate: "", paidDate: "", status: "pending", paymentMethod: "bank_transfer", note: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create({ ...splitProject(form.project), title: form.title, amount: Number(form.amount), dueDate: form.dueDate, paidDate: form.paidDate, status: form.status, paymentMethod: form.paymentMethod, note: form.note });
    setForm({ project: "", title: "", amount: 0, dueDate: "", paidDate: "", status: "pending", paymentMethod: "bank_transfer", note: "" });
  }

  return <MoneyLikePage title="Payments" form={form} setForm={setForm} submit={submit} projects={projects.items} data={data} />;
}

export function FollowupsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const data = useCollection<Followup>(user?.uid, "followups");
  const [form, setForm] = useState({ customer: "", title: "", followUpDate: "", status: "pending", priority: "medium", channel: "line", note: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create({ ...splitCustomer(form.customer), title: form.title, followUpDate: form.followUpDate, status: form.status, priority: form.priority, channel: form.channel, note: form.note });
    setForm({ customer: "", title: "", followUpDate: "", status: "pending", priority: "medium", channel: "line", note: "" });
  }

  return (
    <>
      <PageHeader title="Follow-up" />
      <LoadingError loading={data.loading || customers.loading} error={data.error || customers.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required><option value="">Select</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Date"><Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} required /></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Channel"><Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>{channels.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{followupStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <div className="md:col-span-2"><Field label="Note"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button>Add Follow-up</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {["today", "overdue", "all"].map((bucket) => {
          const items = data.items.filter((item) => bucket === "all" || (bucket === "today" && isDueToday(item.followUpDate)) || (bucket === "overdue" && item.status === "pending" && isOverdue(item.followUpDate)));
          return (
            <Card key={bucket}>
              <h2 className="mb-3 font-semibold">{bucket}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border border-blue-100 bg-white p-3 text-sm shadow-[0_1px_2px_rgba(15,61,145,0.05)]">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-slate-500">{item.customerName} • {item.followUpDate}</div>
                    <div className="mt-2 flex gap-2"><Badge tone={statusTone(item.priority)}>{item.priority}</Badge><Badge>{item.channel}</Badge></div>
                    <div className="mt-2 flex gap-2"><Button variant="secondary" onClick={() => data.patch(item.id, { status: "done" })}>Done</Button><Button variant="danger" onClick={() => data.remove(item.id)}>Delete</Button></div>
                  </div>
                ))}
                {!items.length && <EmptyState title="No items" />}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function DocumentsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const projects = useCollection<Project>(user?.uid, "projects");
  const data = useCollection<DocumentMetadata>(user?.uid, "documents");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ customer: "", project: "", fileType: "proposal", externalUrl: "" });
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setMessage("");
    if (file && (!allowedDocumentMimeTypes.includes(file.type) || file.size > maxUploadSizeBytes)) {
      setMessage("Invalid file type or file is larger than 15MB.");
      return;
    }
    const selectedCustomer = form.customer ? splitCustomer(form.customer) : { customerId: "", customerName: "" };
    const selectedProject = form.project ? splitProject(form.project) : { projectId: "", projectName: "" };
    const uploaded = file ? await uploadUserFile(user.uid, file) : { fileUrl: form.externalUrl, storagePath: "" };
    await data.create({ ...selectedCustomer, projectId: selectedProject.projectId, projectName: selectedProject.projectName, fileName: file?.name ?? form.externalUrl, fileType: form.fileType, fileUrl: uploaded.fileUrl, storagePath: uploaded.storagePath, size: file?.size, mimeType: file?.type, externalUrl: form.externalUrl });
    setFile(null);
    setForm({ customer: "", project: "", fileType: "proposal", externalUrl: "" });
  }

  async function remove(item: DocumentMetadata) {
    if (item.storagePath) await deleteUserFile(item.storagePath);
    await data.remove(item.id);
  }

  return (
    <>
      <PageHeader title="Documents" />
      <LoadingError loading={data.loading || customers.loading || projects.loading} error={data.error || customers.error || projects.error} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}><option value="">None</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Project"><Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option value="">None</option>{projectOptions(projects.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Type"><Select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}>{documentTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="File"><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          <div className="md:col-span-3"><Field label="External URL"><Input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button><Upload className="h-4 w-4" />Save</Button></div>
        </form>
        {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
      </Card>
      <div className="grid gap-3">
        {data.items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">{item.fileName}</div>
              <div className="text-sm text-slate-500">{item.customerName || "No customer"} • {item.projectName || "No project"}</div>
            </div>
            <div className="flex gap-2">
              <a href={item.fileUrl || item.externalUrl} target="_blank" rel="noreferrer"><Button type="button" variant="secondary"><Download className="h-4 w-4" />Open</Button></a>
              <Button variant="danger" onClick={() => remove(item)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const leads = useCollection<Lead>(user?.uid, "leads");
  const projects = useCollection<Project>(user?.uid, "projects");
  const payments = useCollection<Payment>(user?.uid, "payments");
  const sourceChart = customerSources.map((source) => ({ name: source, count: customers.items.filter((c) => c.source === source).length }));
  const conversionRate = leads.items.length ? Math.round((leads.items.filter((l) => l.status === "won").length / leads.items.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Reports" action={<Button variant="secondary" onClick={() => downloadCsv("payments.csv", [["title", "customer", "project", "amount", "status"], ...payments.items.map((p) => [p.title, p.customerName, p.projectName, p.amount, p.status])])}>Export CSV</Button>} />
      <LoadingError loading={payments.loading || customers.loading || leads.loading || projects.loading} error={payments.error || customers.error || leads.error || projects.error} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="text-sm font-medium text-slate-500">Conversion Rate</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{conversionRate}%</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Outstanding</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{currency(payments.items.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0))}</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Late Projects</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{projects.items.filter((p) => p.dueDate && isOverdue(p.dueDate) && !["completed", "cancelled"].includes(p.status)).length}</div></Card>
      </div>
      <Card className="mt-5">
        <h2 className="mb-4 font-semibold">Customers by Source</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

export function SettingsPage() {
  const { locale, setLocale } = useI18n();
  return (
    <>
      <PageHeader title="Settings" />
      <Card className="max-w-md">
        <Field label="Language">
          <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </Select>
        </Field>
      </Card>
    </>
  );
}

function EntityTable<T extends { id: string } & Record<string, unknown>>({ items, columns, onDelete }: { items: T[]; columns: string[]; onDelete: (id: string) => Promise<void> }) {
  if (!items.length) return <EmptyState title="No records" />;
  return (
    <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white shadow-[0_1px_2px_rgba(15,61,145,0.05)]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-blue-50 text-slate-600">
          <tr>{columns.map((col) => <th key={col} className="px-3 py-2 font-medium">{col}</th>)}<th className="px-3 py-2" /></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              {columns.map((col) => <td key={col} className="px-3 py-2">{String(item[col] ?? "")}</td>)}
              <td className="px-3 py-2 text-right"><Button variant="danger" onClick={() => onDelete(item.id)}>Delete</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MoneyLikePage({ title, form, setForm, submit, projects, data }: { title: string; form: any; setForm: (v: any) => void; submit: (event: React.FormEvent) => void; projects: Project[]; data: ReturnType<typeof useCollection<Payment>> }) {
  const paid = data.items.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const outstanding = data.items.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const rows = useMemo(() => data.items.map((item) => ({ ...item, status: isOverdue(item.dueDate) && item.status === "pending" ? "overdue" : item.status })), [data.items]);

  return (
    <>
      <PageHeader title={title} />
      <LoadingError loading={data.loading} error={data.error} />
      <div className="mb-5 grid gap-4 md:grid-cols-2"><Card><div className="text-sm font-medium text-slate-500">Paid</div><div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{currency(paid)}</div></Card><Card><div className="text-sm font-medium text-slate-500">Outstanding</div><div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{currency(outstanding)}</div></Card></div>
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Project"><Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required><option value="">Select</option>{projectOptions(projects).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Paid date"><Input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{paymentStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Method"><Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{paymentMethods.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <div className="flex items-end"><Button>Add Payment</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">
        {rows.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="font-medium">{item.title}</div><div className="text-sm text-slate-500">{item.customerName} • {item.projectName} • {item.dueDate}</div></div>
            <div className="flex items-center gap-2"><div className="font-semibold">{currency(item.amount)}</div><Badge tone={statusTone(item.status)}>{item.status}</Badge><Button variant="secondary" onClick={() => data.patch(item.id, { status: "paid", paidDate: new Date().toISOString().slice(0, 10) })}>Paid</Button><Button variant="danger" onClick={() => data.remove(item.id)}>Delete</Button></div>
          </Card>
        ))}
      </div>
    </>
  );
}
