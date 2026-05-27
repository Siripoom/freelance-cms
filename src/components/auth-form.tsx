"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { hasFirebaseConfig } from "@/lib/firebase/client";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") await auth.login(email, password);
      if (mode === "register") await auth.register(email, password);
      if (mode === "forgot") {
        await auth.resetPassword(email);
        setMessage("Password reset email sent.");
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),linear-gradient(180deg,#f5f8ff_0%,#ffffff_100%)] px-4">
      <Card className="w-full max-w-md border-blue-100 p-6 shadow-[0_18px_50px_rgba(15,61,145,0.12)]">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-white">F</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Freelance CRM</h1>
          <p className="mt-1 text-sm text-slate-500">{mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครสมาชิก" : "รีเซ็ตรหัสผ่าน"}</p>
        </div>
        {!hasFirebaseConfig && <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">เติมค่า Firebase ใน .env.local ก่อนใช้งานจริง</div>}
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Email">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          {mode !== "forgot" && (
            <Field label="Password">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            </Field>
          )}
          {message && <p className="text-sm text-slate-500">{message}</p>}
          <Button className="w-full" disabled={busy}>
            {mode === "login" ? "Login" : mode === "register" ? "Register" : "Send reset email"}
          </Button>
          {mode === "login" && (
            <Button type="button" variant="secondary" className="w-full" onClick={() => auth.googleLogin().then(() => router.replace("/dashboard")).catch((err) => setMessage(err.message))}>
              Login with Google
            </Button>
          )}
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <Link href="/login" className="font-medium text-primary hover:text-blue-800">Login</Link>
          <Link href="/register" className="font-medium text-primary hover:text-blue-800">Register</Link>
          <Link href="/forgot-password" className="font-medium text-primary hover:text-blue-800">Forgot</Link>
        </div>
      </Card>
    </div>
  );
}
