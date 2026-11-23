import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <main className="cms cms-login">
      <Card className="login-card">
        <span className="login-icon" aria-hidden="true">
          <LockKeyhole size={20} />
        </span>
        <h1>Welcome back</h1>
        <p>Sign in to edit your portfolio.</p>
        <Suspense fallback={<p>Loading…</p>}>
          <LoginForm />
        </Suspense>
        <Link href="/" className="login-back">
          Back to the site
        </Link>
      </Card>
    </main>
  );
}
