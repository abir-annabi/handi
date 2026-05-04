import { RouteProtegee } from "@/components/route-protegee";
import { SupervisionDashboard } from "@/components/supervision/supervision-dashboard";

export default function SupervisionDashboardPage() {
  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <SupervisionDashboard />
    </RouteProtegee>
  );
}
