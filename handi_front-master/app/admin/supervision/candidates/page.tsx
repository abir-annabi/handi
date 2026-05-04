import { RouteProtegee } from "@/components/route-protegee";
import { CandidatesVisibilityView } from "@/components/supervision/candidates-visibility";

export default function VisibleCandidatesPage() {
  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <CandidatesVisibilityView />
    </RouteProtegee>
  );
}
