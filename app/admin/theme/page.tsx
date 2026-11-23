import { AdminNav } from "@/components/AdminNav";
import { ThemeForm } from "@/components/ThemeForm";
import { Card } from "@/components/ui/Card";
import { getTheme } from "@/lib/theme";

export default async function ThemePage() {
  const theme = await getTheme();

  return (
    <main className="cms cms-wide">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Theme</h1>
          <p className="cms-header-desc">
            Changes show up in the preview straight away. Publish when you&apos;re happy.
          </p>
        </div>
        <AdminNav />
      </Card>

      <ThemeForm initialTheme={theme} />
    </main>
  );
}
