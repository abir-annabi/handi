import { RouteProtegee } from "@/components/route-protegee";
import { SupervisionPipeline } from "@/components/supervision/supervision-pipeline";

export default function SupervisionPipelinePage() {
  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <SupervisionPipeline />
    </RouteProtegee>
  );
}
