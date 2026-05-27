"use client";

import { cn } from "@/lib/utils";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const { className, variant = "primary", ...rest } = props;
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-blue-900",
        variant === "secondary" && "border border-blue-200 bg-secondary text-secondary-foreground hover:bg-blue-100",
        variant === "ghost" && "bg-transparent text-slate-700 hover:bg-blue-50 hover:text-primary",
        variant === "danger" && "bg-destructive text-destructive-foreground shadow-sm hover:bg-red-700",
        className,
      )}
      {...rest}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-ring/25", props.className)} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-ring/25", props.className)} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-ring/25", props.className)} {...props} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-blue-100 bg-card p-4 shadow-[0_1px_2px_rgba(15,61,145,0.06)]", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-medium",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "green" && "bg-blue-100 text-blue-800",
        tone === "amber" && "bg-sky-100 text-sky-800",
        tone === "red" && "bg-red-100 text-red-800",
        tone === "blue" && "bg-indigo-100 text-indigo-800",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title }: { title: string }) {
  return <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center text-sm text-slate-500">{title}</div>;
}
