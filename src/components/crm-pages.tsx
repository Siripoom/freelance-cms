"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Upload, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useCollection } from "@/hooks/use-collection";
import {
  allowedDocumentMimeTypes,
  customerSources,
  customerStatuses,
  customerTypes,
  documentTypes,
  maxUploadSizeBytes,
  paymentMethods,
  paymentStatuses,
  projectStatuses,
  projectTypes,
} from "@/lib/constants";
import { currency, downloadCsv, isOverdue } from "@/lib/utils";
import { deleteUserFile, uploadUserFile } from "@/services/storage-service";
import type { Customer, DocumentMetadata, Payment, Project } from "@/types/models";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";

type SortOrder = "newest" | "oldest";

const customerInitialForm = { name: "", type: "individual", phone: "", email: "", lineId: "", facebookUrl: "", source: "facebook", status: "new", note: "" };
const projectInitialForm = { customer: "", name: "", type: "web_app", totalPrice: 0, startDate: "", dueDate: "", status: "pending", progress: 0, description: "" };
const paymentInitialForm = { project: "", title: "", amount: 0, dueDate: "", paidDate: "", status: "pending", paymentMethod: "bank_transfer", note: "" };
const documentInitialForm = { customer: "", project: "", fileType: "proposal", externalUrl: "" };

function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {action}
    </div>
  );
}

function AddPanel({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <Card className="mb-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <Button type="button" variant="ghost" className="h-9 px-3" onClick={onClose}>
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>
      {children}
    </Card>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 grid gap-3 rounded-lg border border-blue-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,61,145,0.05)] md:flex md:items-end md:justify-between">{children}</div>;
}

function LoadingError({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="mb-4 text-sm text-slate-500">Loading...</div>;
  if (error) return <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>;
  return null;
}

function statusTone(status: string) {
  if (["paid", "completed", "active"].includes(status)) return "green";
  if (["overdue", "cancelled"].includes(status)) return "red";
  if (["pending", "review", "revision"].includes(status)) return "amber";
  return "blue";
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

function byCreatedAt<T extends { createdAt: string }>(items: T[], order: SortOrder) {
  return [...items].sort((a, b) => (order === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
}

export function DashboardPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const projects = useCollection<Project>(user?.uid, "projects");
  const payments = useCollection<Payment>(user?.uid, "payments");
  const documents = useCollection<DocumentMetadata>(user?.uid, "documents");
  const month = new Date().toISOString().slice(0, 7);
  const paidIncome = payments.items.filter((p) => p.status === "paid" && p.paidDate?.startsWith(month)).reduce((sum, p) => sum + p.amount, 0);
  const outstanding = payments.items.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const activeProjects = projects.items.filter((p) => ["active", "review", "revision"].includes(p.status)).length;
  const lateProjects = projects.items.filter((p) => p.dueDate && isOverdue(p.dueDate) && !["completed", "cancelled"].includes(p.status)).length;
  const newCustomers = customers.items.filter((c) => c.createdAt.startsWith(month)).length;
  const recentDocuments = documents.items.filter((d) => d.createdAt.startsWith(month)).length;
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
      <LoadingError loading={payments.loading || customers.loading || projects.loading || documents.loading} error={payments.error || customers.error || projects.error || documents.error} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["รายรับเดือนนี้", currency(paidIncome)],
          ["ยอดค้างรับ", currency(outstanding)],
          ["งานที่กำลังทำ", activeProjects],
          ["งานเลยกำหนด", lateProjects],
          ["ลูกค้าใหม่เดือนนี้", newCustomers],
          ["เอกสารเดือนนี้", recentDocuments],
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
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(customerInitialForm);
  const filtered = byCreatedAt(data.items, sort).filter((item) => {
    const matchesQuery = `${item.name} ${item.email} ${item.phone} ${item.lineId}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || item.status === status);
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create(form);
    setForm(customerInitialForm);
    setOpen(false);
  }

  return (
    <>
      <PageHeader title="Customers" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Customer</Button>} />
      <LoadingError loading={data.loading} error={data.error} />
      <AddPanel title="Add Customer" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{customerTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{customerSources.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{customerStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="LINE"><Input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} /></Field>
          <Field label="Facebook URL"><Input value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} /></Field>
          <div className="md:col-span-3"><Field label="Note"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field></div>
          <div className="md:col-span-3"><Button><Plus className="h-4 w-4" />Save Customer</Button></div>
        </form>
      </AddPanel>
      <Toolbar>
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_160px_140px]">
          <Field label="Search"><Input placeholder="Name, phone, email, LINE" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option>{customerStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Sort"><Select value={sort} onChange={(e) => setSort(e.target.value as SortOrder)}><option value="newest">Newest</option><option value="oldest">Oldest</option></Select></Field>
        </div>
        <div className="text-sm text-slate-500">{filtered.length} records</div>
      </Toolbar>
      <EntityTable items={filtered} columns={["name", "phone", "email", "source", "status"]} onDelete={data.remove} />
    </>
  );
}

export function ProjectsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const data = useCollection<Project>(user?.uid, "projects");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"newest" | "due">("newest");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(projectInitialForm);
  const filtered = useMemo(() => {
    const rows = data.items.filter((item) => {
      const matchesQuery = `${item.name} ${item.customerName}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery && (status === "all" || item.status === status);
    });
    return [...rows].sort((a, b) => {
      if (sort === "due") return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [data.items, query, sort, status]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create({ ...splitCustomer(form.customer), name: form.name, type: form.type, totalPrice: Number(form.totalPrice), startDate: form.startDate, dueDate: form.dueDate, status: form.status, progress: Number(form.progress), description: form.description, tasks: [] });
    setForm(projectInitialForm);
    setOpen(false);
  }

  return (
    <>
      <PageHeader title="Projects" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Project</Button>} />
      <LoadingError loading={data.loading || customers.loading} error={data.error || customers.error} />
      <AddPanel title="Add Project" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required><option value="">Select</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{projectTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Price"><Input type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: Number(e.target.value) })} /></Field>
          <Field label="Start"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Due"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{projectStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Progress"><Input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></Field>
          <div className="md:col-span-4"><Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="md:col-span-4"><Button>Save Project</Button></div>
        </form>
      </AddPanel>
      <Toolbar>
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_170px_150px]">
          <Field label="Search"><Input placeholder="Project or customer" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option>{projectStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Sort"><Select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "due")}><option value="newest">Newest</option><option value="due">Due date</option></Select></Field>
        </div>
        <div className="text-sm text-slate-500">{filtered.length} projects</div>
      </Toolbar>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{project.name}</h2>
                <p className="text-sm text-slate-500">{project.customerName}</p>
              </div>
              <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm"><span>{currency(project.totalPrice)}</span><span className="text-slate-500">Due {project.dueDate || "-"}</span></div>
            <div className="mt-3 h-2 rounded-full bg-blue-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${project.progress}%` }} /></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_92px_auto]">
              <Select value={project.status} onChange={(e) => data.patch(project.id, { status: e.target.value })}>{projectStatuses.map((x) => <option key={x}>{x}</option>)}</Select>
              <Input type="number" min={0} max={100} value={project.progress} onChange={(e) => data.patch(project.id, { progress: Number(e.target.value) })} />
              <Button variant="danger" onClick={() => data.remove(project.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      {!filtered.length && <EmptyState title="No projects" />}
    </>
  );
}

export function PaymentsPage() {
  const { user } = useAuth();
  const projects = useCollection<Project>(user?.uid, "projects");
  const data = useCollection<Payment>(user?.uid, "payments");
  const [form, setForm] = useState(paymentInitialForm);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await data.create({ ...splitProject(form.project), title: form.title, amount: Number(form.amount), dueDate: form.dueDate, paidDate: form.paidDate, status: form.status, paymentMethod: form.paymentMethod, note: form.note });
    setForm(paymentInitialForm);
  }

  return <MoneyLikePage form={form} setForm={setForm} submit={submit} projects={projects.items} data={data} loading={projects.loading || data.loading} error={projects.error || data.error} />;
}

export function DocumentsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const projects = useCollection<Project>(user?.uid, "projects");
  const data = useCollection<DocumentMetadata>(user?.uid, "documents");
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(documentInitialForm);
  const [message, setMessage] = useState("");
  const filtered = data.items.filter((item) => {
    const matchesQuery = `${item.fileName} ${item.customerName} ${item.projectName}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (fileType === "all" || item.fileType === fileType);
  });

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
    setForm(documentInitialForm);
    setOpen(false);
  }

  async function remove(item: DocumentMetadata) {
    if (item.storagePath) await deleteUserFile(item.storagePath);
    await data.remove(item.id);
  }

  return (
    <>
      <PageHeader title="Documents" action={<Button onClick={() => setOpen(true)}><Upload className="h-4 w-4" />Add Document</Button>} />
      <LoadingError loading={data.loading || customers.loading || projects.loading} error={data.error || customers.error || projects.error} />
      <AddPanel title="Add Document" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <Field label="Customer"><Select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}><option value="">None</option>{customerOptions(customers.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Project"><Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option value="">None</option>{projectOptions(projects.items).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Type"><Select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}>{documentTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="File"><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          <div className="md:col-span-3"><Field label="External URL"><Input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button><Upload className="h-4 w-4" />Save</Button></div>
        </form>
        {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
      </AddPanel>
      <Toolbar>
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_180px]">
          <Field label="Search"><Input placeholder="File, customer, project" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Type"><Select value={fileType} onChange={(e) => setFileType(e.target.value)}><option value="all">All</option>{documentTypes.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        </div>
        <div className="text-sm text-slate-500">{filtered.length} documents</div>
      </Toolbar>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">{item.fileName}</div>
              <div className="text-sm text-slate-500">{item.customerName || "No customer"} • {item.projectName || "No project"} • {item.fileType}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={item.fileUrl || item.externalUrl} target="_blank" rel="noreferrer"><Button type="button" variant="secondary"><Download className="h-4 w-4" />Open</Button></a>
              <Button variant="danger" onClick={() => remove(item)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      {!filtered.length && <EmptyState title="No documents" />}
    </>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const customers = useCollection<Customer>(user?.uid, "customers");
  const projects = useCollection<Project>(user?.uid, "projects");
  const payments = useCollection<Payment>(user?.uid, "payments");
  const documents = useCollection<DocumentMetadata>(user?.uid, "documents");
  const sourceChart = customerSources.map((source) => ({ name: source, count: customers.items.filter((c) => c.source === source).length }));
  const projectStatusChart = projectStatuses.map((status) => ({ name: status, value: projects.items.filter((p) => p.status === status).length }));
  const outstanding = payments.items.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const paid = payments.items.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const lateProjects = projects.items.filter((p) => p.dueDate && isOverdue(p.dueDate) && !["completed", "cancelled"].includes(p.status)).length;

  return (
    <>
      <PageHeader title="Reports" action={<Button variant="secondary" onClick={() => downloadCsv("payments.csv", [["title", "customer", "project", "amount", "status"], ...payments.items.map((p) => [p.title, p.customerName, p.projectName, p.amount, p.status])])}>Export CSV</Button>} />
      <LoadingError loading={payments.loading || customers.loading || projects.loading || documents.loading} error={payments.error || customers.error || projects.error || documents.error} />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm font-medium text-slate-500">Paid</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{currency(paid)}</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Outstanding</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{currency(outstanding)}</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Late Projects</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{lateProjects}</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Documents</div><div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{documents.items.length}</div></Card>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Customers by Source</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Projects by Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusChart} dataKey="value" nameKey="name" outerRadius={95} label>
                  {projectStatusChart.map((_, index) => <Cell key={index} fill={["#0f3d91", "#38bdf8", "#f59e0b", "#8b5cf6", "#22c55e", "#16a34a", "#ef4444"][index]} />)}
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

function MoneyLikePage({
  form,
  setForm,
  submit,
  projects,
  data,
  loading,
  error,
}: {
  form: typeof paymentInitialForm;
  setForm: (v: typeof paymentInitialForm) => void;
  submit: (event: React.FormEvent) => Promise<void>;
  projects: Project[];
  data: ReturnType<typeof useCollection<Payment>>;
  loading: boolean;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"newest" | "due" | "amount">("newest");
  const [open, setOpen] = useState(false);
  const paid = data.items.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const outstanding = data.items.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const rows = useMemo(() => {
    const filtered = data.items
      .map((item) => ({ ...item, status: isOverdue(item.dueDate) && item.status === "pending" ? "overdue" : item.status }))
      .filter((item) => {
        const matchesQuery = `${item.title} ${item.customerName} ${item.projectName}`.toLowerCase().includes(query.toLowerCase());
        return matchesQuery && (status === "all" || item.status === status);
      });
    return filtered.sort((a, b) => {
      if (sort === "due") return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
      if (sort === "amount") return b.amount - a.amount;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [data.items, query, sort, status]);

  async function submitAndClose(event: React.FormEvent) {
    await submit(event);
    setOpen(false);
  }

  return (
    <>
      <PageHeader title="Payments" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Payment</Button>} />
      <LoadingError loading={loading} error={error} />
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <Card><div className="text-sm font-medium text-slate-500">Paid</div><div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{currency(paid)}</div></Card>
        <Card><div className="text-sm font-medium text-slate-500">Outstanding</div><div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{currency(outstanding)}</div></Card>
      </div>
      <AddPanel title="Add Payment" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submitAndClose}>
          <Field label="Project"><Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required><option value="">Select</option>{projectOptions(projects).map((x) => <option key={x} value={x}>{x.split("|")[1]}</option>)}</Select></Field>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Paid date"><Input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{paymentStatuses.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Method"><Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{paymentMethods.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <div className="flex items-end"><Button>Save Payment</Button></div>
        </form>
      </AddPanel>
      <Toolbar>
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_160px_150px]">
          <Field label="Search"><Input placeholder="Payment, customer, project" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option>{paymentStatuses.map((x) => <option key={x}>{x}</option>)}<option value="overdue">overdue</option></Select></Field>
          <Field label="Sort"><Select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "due" | "amount")}><option value="newest">Newest</option><option value="due">Due date</option><option value="amount">Amount</option></Select></Field>
        </div>
        <div className="text-sm text-slate-500">{rows.length} payments</div>
      </Toolbar>
      <div className="grid gap-3">
        {rows.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="font-medium">{item.title}</div><div className="text-sm text-slate-500">{item.customerName} • {item.projectName} • {item.dueDate || "-"}</div></div>
            <div className="flex flex-wrap items-center gap-2"><div className="font-semibold">{currency(item.amount)}</div><Badge tone={statusTone(item.status)}>{item.status}</Badge><Button variant="secondary" onClick={() => data.patch(item.id, { status: "paid", paidDate: new Date().toISOString().slice(0, 10) })}>Paid</Button><Button variant="danger" onClick={() => data.remove(item.id)}>Delete</Button></div>
          </Card>
        ))}
      </div>
      {!rows.length && <EmptyState title="No payments" />}
    </>
  );
}
