import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <main className="cms">
      <Card>
        <h1>CMS login</h1>
        <p>Password-gated for a weekend build. Swap for GitHub OAuth later if you want.</p>
        <Suspense fallback={<p>Loading…</p>}>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}
