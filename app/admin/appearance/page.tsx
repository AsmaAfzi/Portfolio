import { AdminNav } from "@/components/AdminNav";
import { SiteSettingsForm } from "@/components/SiteSettingsForm";
import { Card } from "@/components/ui/Card";
import { getSiteConfig } from "@/lib/site";

export default async function AppearancePage() {
  const site = await getSiteConfig();

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Layout</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        <p>Edit homepage copy and how repo cards are displayed.</p>
        <SiteSettingsForm initialSite={site} />
      </Card>
    </main>
  );
}
