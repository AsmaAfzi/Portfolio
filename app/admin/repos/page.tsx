import { AdminNav } from "@/components/AdminNav";
import { RepoCurator } from "@/components/RepoCurator";
import { Card } from "@/components/ui/Card";
import { getAllReposWithVisibility } from "@/lib/display";
import { getDetectedTech } from "@/lib/repo-tech";
import { getSiteConfig } from "@/lib/site";

export default async function AdminReposPage() {
  let repos: Awaited<ReturnType<typeof getAllReposWithVisibility>> = [];
  let detectedTech: Awaited<ReturnType<typeof getDetectedTech>> = {};
  let error = "";

  try {
    repos = await getAllReposWithVisibility();
    detectedTech = await getDetectedTech(repos);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load repositories.";
  }

  const site = await getSiteConfig();

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Repositories</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        {error ? (
          <p className="cms-status cms-status-error">{error}</p>
        ) : repos.length === 0 ? (
          <p>No public repositories found for GITHUB_OWNER.</p>
        ) : (
          <RepoCurator
            repos={repos}
            initialHiddenIds={site.hiddenRepoIds}
            initialTech={site.repoTech ?? {}}
            detectedTech={detectedTech}
          />
        )}
      </Card>
    </main>
  );
}
