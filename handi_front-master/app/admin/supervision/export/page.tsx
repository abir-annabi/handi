import { RouteProtegee } from "@/components/route-protegee";
import { SupervisionExportPanel } from "@/components/supervision/export-panel";

export default function SupervisionExportPage() {
  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <SupervisionExportPanel />
    </RouteProtegee>
  );
}
