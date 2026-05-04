import { RouteProtegee } from "@/components/route-protegee";
import { OffersPerformanceView } from "@/components/supervision/offers-performance";

export default function OffersPerformancePage() {
  return (
    <RouteProtegee rolesAutorises={["admin", "inspecteur", "aneti"]}>
      <OffersPerformanceView />
    </RouteProtegee>
  );
}
