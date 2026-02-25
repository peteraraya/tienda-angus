"use client";
import { ToastProvider } from "./components/ui/ToastContainer";
import FloatingSocialButtons from "./components/FloatingSocialButtons";

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <main className="min-h-screen">{children}</main>
      <FloatingSocialButtons />
    </ToastProvider>
  );
}
