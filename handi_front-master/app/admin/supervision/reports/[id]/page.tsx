import { RouteProtegee } from "@/components/route-protegee";
import { ComplianceReportDetailView } from "@/components/supervision/compliance-report-detail";

export default async function ComplianceReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <ComplianceReportDetailView reportId={resolvedParams.id} />
    </RouteProtegee>
  );
}
