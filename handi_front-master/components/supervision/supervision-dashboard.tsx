"use client";

import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, StatCard } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { RegionalCompaniesMap } from "@/components/supervision/regional-companies-map";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { PipelineResponse, SupervisionOverview } from "@/lib/supervision";

export function SupervisionDashboard() {
  const { t } = useI18n();
  const overview = useSupervisionQuery<SupervisionOverview>("/statistics/overview");
  const pipeline = useSupervisionQuery<PipelineResponse>("/pipeline");

  if (overview.loading || pipeline.loading) {
    return (
      <LoadingState
        title={t("supervision.dashboard.loadingTitle")}
        description={t("supervision.dashboard.loadingDescription")}
      />
    );
  }

  if (overview.error || pipeline.error || !overview.data || !pipeline.data) {
    return (
      <EmptyState
        title={t("supervision.dashboard.unavailableTitle")}
        description={t("supervision.dashboard.unavailableDescription")}
        action={
          <ButtonLink href="/admin/supervision/reports" variant="secondary" size="sm">
            {t("supervision.dashboard.openReports")}
          </ButtonLink>
        }
      />
    );
  }

  const topCompanies = pipeline.data.by_company.slice(0, 5);
  const afficherCarteTerritoriale = ["inspecteur", "aneti"].includes(overview.data.scope.role);

  return (
    <SupervisionShell
      badge={t("supervision.dashboard.badge")}
      title={t("supervision.dashboard.title")}
      description={t("supervision.dashboard.description")}
      actions={
        <ButtonLink href="/admin/supervision/export" size="sm">
          {t("supervision.dashboard.exportData")}
        </ButtonLink>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t("supervision.dashboard.companiesInScope")}
          value={overview.data.totals.total_companies}
          hint={t("supervision.dashboard.activeCompanies", {
            count: overview.data.totals.active_companies,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.openRoles")}
          value={overview.data.totals.total_offers}
          hint={t("supervision.dashboard.applicationsTracked", {
            count: overview.data.totals.total_applications,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.shortlistedCandidates")}
          value={overview.data.totals.shortlisted_candidates}
          hint={t("supervision.dashboard.applicationsRate", {
            rate: overview.data.rates.shortlist_rate,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.hiredCandidates")}
          value={overview.data.totals.hired_candidates}
          hint={t("supervision.dashboard.hiringRate", {
            rate: overview.data.rates.hiring_rate,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.complianceReports")}
          value={overview.data.totals.total_reports}
          hint={t("supervision.dashboard.reportsAwaitingReview", {
            count: overview.data.totals.submitted_reports,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.validatedReports")}
          value={overview.data.totals.validated_reports}
          hint={t("supervision.dashboard.validationRate", {
            rate: overview.data.rates.compliance_validation_rate,
          })}
        />
        <StatCard
          label={t("supervision.dashboard.rejectedReports")}
          value={overview.data.totals.rejected_reports}
          hint={t("supervision.dashboard.rejectedHint")}
        />
        <StatCard
          label={t("supervision.dashboard.visibilityScope")}
          value={
            overview.data.scope.visibility === "territorial"
              ? t("supervision.dashboard.regional")
              : t("supervision.dashboard.national")
          }
          hint={
            overview.data.scope.region
              ? t("supervision.dashboard.regionLabel", { region: overview.data.scope.region })
              : t("supervision.dashboard.allRegions")
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("supervision.dashboard.pipelineTitle")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t("supervision.dashboard.applications")}</p>
              <strong className="text-2xl text-gray-900">{pipeline.data.totals.applications_count}</strong>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("supervision.dashboard.interviews")}</p>
              <strong className="text-2xl text-gray-900">{pipeline.data.totals.interviews_count}</strong>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("supervision.dashboard.shortlisted")}</p>
              <strong className="text-2xl text-gray-900">{pipeline.data.totals.shortlisted_count}</strong>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("supervision.dashboard.hired")}</p>
              <strong className="text-2xl text-gray-900">{pipeline.data.totals.hired_count}</strong>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {t("supervision.dashboard.privacyNote")}
          </p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("supervision.dashboard.topCompaniesTitle")}</h2>
          {topCompanies.length === 0 ? (
            <p className="text-sm text-gray-600">{t("supervision.dashboard.noCompanies")}</p>
          ) : (
            <div className="space-y-3">
              {topCompanies.map((company) => (
                <div key={company.company_id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{company.company_name}</p>
                    <p className="text-sm text-gray-500">{company.region}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{t("supervision.map.applications", { count: company.applications_count })}</p>
                    <p>{t("supervision.map.recruited", { count: company.hired_count })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {afficherCarteTerritoriale ? <RegionalCompaniesMap /> : null}
    </SupervisionShell>
  );
}
