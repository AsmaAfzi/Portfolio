import { AdminNav } from "@/components/AdminNav";
import { ThemeForm } from "@/components/ThemeForm";
import { Card } from "@/components/ui/Card";
import { getTheme } from "@/lib/theme";

export default async function ThemePage() {
  const theme = await getTheme();

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Theme</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        <p>Edit design tokens. Changes commit to GitHub and redeploy like projects.</p>
        <ThemeForm initialTheme={theme} />
      </Card>
    </main>
  );
}
