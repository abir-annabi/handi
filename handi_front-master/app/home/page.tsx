"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState, PageHeader, StatCard } from "@/components/ui/layout";
import { EntrepriseHome } from "@/components/entreprise-home";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { fetchSupervisionResource, type SupervisionOverview } from "@/lib/supervision";

type CandidateStatItem = {
  statut: string;
  count: number;
};

type AdminUserStatistics = {
  total_utilisateurs?: number;
  utilisateurs_actifs_periode?: number;
  actifs?: number;
};

type PendingRequestsPayload = {
  demandes?: unknown[];
};

type StatParStatut = { statut: string; count: number };
type EntrepriseActive = { entreprise_nom: string; nombre_offres: number; nombre_candidatures: number };

type StatistiquesAdmin = {
  stats_par_statut: StatParStatut[];
  taux_recrutement: number;
  temps_moyen_traitement_jours: number;
  total_candidatures: number;
  entreprises_actives: EntrepriseActive[];
};

type WorkflowPoint = {
  date: string;
  nouvelles: number;
  shortlistees: number;
  entretiens: number;
  acceptees: number;
  refusees: number;
};

type EntrepriseOffreStat = {
  statut?: string;
};

type WorkspaceStatCard = {
  label: string;
  value: number | string;
  hint?: string;
};

type WorkspaceAction = {
  title: string;
  text: string;
  href: string;
};

type WorkspaceContent = {
  badge: string;
  title: string;
  description: string;
  actions: WorkspaceAction[];
};

function isShowcaseWorkspaceRole(role: string) {
  return role === "admin" || role === "inspecteur" || role === "aneti";
}

async function fetchApiData<T>(path: string): Promise<T> {
  const response = await authenticatedFetch(construireUrlApi(path));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load workspace data.");
  }

  return (payload?.donnees ?? payload) as T;
}

function buildWorkspaceContent(
  role: string,
  t: (key: string, replacements?: Record<string, string | number>) => string,
): WorkspaceContent {
  if (role === "entreprise") {
    return {
      badge: t("home.workspace.entreprise.badge"),
      title: t("home.workspace.entreprise.title"),
      description: t("home.workspace.entreprise.description"),
      actions: [
        {
          title: t("home.workspace.entreprise.actions.rolesTitle"),
          text: t("home.workspace.entreprise.actions.rolesText"),
          href: "/entreprise/offres",
        },
        {
          title: t("home.workspace.entreprise.actions.applicantsTitle"),
          text: t("home.workspace.entreprise.actions.applicantsText"),
          href: "/entreprise/candidatures",
        },
        {
          title: t("home.workspace.entreprise.actions.profileTitle"),
          text: t("home.workspace.entreprise.actions.profileText"),
          href: "/entreprise/profil",
        },
      ],
    };
  }

  if (role === "admin") {
    return {
      badge: t("home.workspace.admin.badge"),
      title: t("home.workspace.admin.title"),
      description: t("home.workspace.admin.description"),
      actions: [
        {
          title: t("home.workspace.admin.actions.accountsTitle"),
          text: t("home.workspace.admin.actions.accountsText"),
          href: "/admin/comptes",
        },
        {
          title: t("home.workspace.admin.actions.usersTitle"),
          text: t("home.workspace.admin.actions.usersText"),
          href: "/admin/utilisateurs",
        },
        {
          title: t("home.workspace.admin.actions.statsTitle"),
          text: t("home.workspace.admin.actions.statsText"),
          href: "#admin-stats",
        },
      ],
    };
  }

  if (role === "inspecteur") {
    return {
      badge: t("home.workspace.inspecteur.badge"),
      title: t("home.workspace.inspecteur.title"),
      description: t("home.workspace.inspecteur.description"),
      actions: [
        {
          title: t("home.workspace.inspecteur.actions.statsTitle"),
          text: t("home.workspace.inspecteur.actions.statsText"),
          href: "/admin/supervision",
        },
        {
          title: t("home.workspace.inspecteur.actions.profileTitle"),
          text: t("home.workspace.inspecteur.actions.profileText"),
          href: "/profil",
        },
        {
          title: t("home.workspace.inspecteur.actions.messagesTitle"),
          text: t("home.workspace.inspecteur.actions.messagesText"),
          href: "/messages",
        },
      ],
    };
  }

  return {
    badge: t("home.workspace.aneti.badge"),
    title: t("home.workspace.aneti.title"),
    description: t("home.workspace.aneti.description"),
    actions: [
      {
        title: t("home.workspace.aneti.actions.statsTitle"),
        text: t("home.workspace.aneti.actions.statsText"),
        href: "/admin/supervision",
      },
      {
        title: t("home.workspace.aneti.actions.profileTitle"),
        text: t("home.workspace.aneti.actions.profileText"),
        href: "/profil",
      },
      {
        title: t("home.workspace.aneti.actions.messagesTitle"),
        text: t("home.workspace.aneti.actions.messagesText"),
        href: "/messages",
      },
    ],
  };
}

export default function HomePage() {
  return (
    <AuthenticatedWorkspace>
      <HomeContent />
    </AuthenticatedWorkspace>
  );
}

function HomeContent() {
  const router = useRouter();
  const { t } = useI18n();
  const { utilisateur } = useAuth();
  const [candidateStats, setCandidateStats] = useState<CandidateStatItem[]>([]);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStatCard[]>([]);
  const [adminStats, setAdminStats] = useState<StatistiquesAdmin | null>(null);
  const [adminWorkflow, setAdminWorkflow] = useState<WorkflowPoint[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [erreurStats, setErreurStats] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur) {
      return;
    }

    let active = true;

    const charger = async () => {
      setLoadingStats(true);
      setErreurStats(null);

      try {
        if (utilisateur.role === "candidat") {
          const data = await fetchApiData<CandidateStatItem[]>("/api/candidatures/mes-statistiques");
          if (active) {
            setCandidateStats(Array.isArray(data) ? data : []);
            setWorkspaceStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (utilisateur.role === "admin") {
          const [pendingResult, userStatsResult, applicationsResult, workflowResult, overviewResult] =
            await Promise.allSettled([
              fetchApiData<PendingRequestsPayload>("/api/admin/demandes-en-attente"),
              fetchApiData<AdminUserStatistics>("/api/admin/utilisateurs/statistiques?periode=mois"),
              fetchApiData<StatistiquesAdmin>("/api/admin/candidatures/statistiques-globales"),
              fetchApiData<WorkflowPoint[]>("/api/admin/workflow-recrutement?periode=30"),
              fetchSupervisionResource<SupervisionOverview>("/statistics/overview"),
            ]);

          const cards: WorkspaceStatCard[] = [];

          if (pendingResult.status === "fulfilled") {
            const pendingCount = Array.isArray(pendingResult.value)
              ? pendingResult.value.length
              : Array.isArray(pendingResult.value?.demandes)
                ? pendingResult.value.demandes.length
                : 0;
            cards.push({
              label: t("home.workspace.admin.stats.pendingRequests"),
              value: pendingCount,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (userStatsResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.activeUsers"),
              value:
                userStatsResult.value.utilisateurs_actifs_periode ??
                userStatsResult.value.actifs ??
                0,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (applicationsResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.totalApplications"),
              value: applicationsResult.value.total_candidatures ?? 0,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (overviewResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.complianceReports"),
              value: overviewResult.value.totals.total_reports,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(applicationsResult.status === "fulfilled" ? applicationsResult.value : null);
            setAdminWorkflow(
              workflowResult.status === "fulfilled" && Array.isArray(workflowResult.value)
                ? workflowResult.value
                : [],
            );
          }
          return;
        }

        if (utilisateur.role === "entreprise") {
          const [candidaturesResult, offresResult] = await Promise.allSettled([
            fetchApiData<{ donnees: CandidateStatItem[] }>("/api/candidatures/statistiques"),
            fetchApiData<{ donnees: { offres: EntrepriseOffreStat[] } }>("/api/entreprise/offres"),
          ]);

          const cards: WorkspaceStatCard[] = [];

          // Process candidatures statistics
          if (candidaturesResult.status === "fulfilled") {
            const candidaturesData = candidaturesResult.value;
            const stats = Array.isArray(candidaturesData.donnees) ? candidaturesData.donnees : 
                         Array.isArray(candidaturesData) ? candidaturesData : [];
            
            const getStatValue = (statut: string) => {
              const stat = stats.find(s => s.statut === statut);
              return stat ? stat.count : 0;
            };

            const total = stats.reduce((sum, stat) => sum + (Number(stat.count) || 0), 0);
            
            cards.push(
              {
                label: "Total des candidatures",
                value: total,
                hint: "Données réelles - Candidatures reçues",
              },
              {
                label: "Candidatures en attente",
                value: getStatValue("pending"),
                hint: "Données réelles - En cours d'examen",
              },
              {
                label: "Candidats présélectionnés",
                value: getStatValue("shortlisted"),
                hint: "Données réelles - Retenus pour entretien",
              },
              {
                label: "Candidats acceptés",
                value: getStatValue("accepted"),
                hint: "Données réelles - Embauchés avec succès",
              }
            );
          }

          // Process offers statistics
          if (offresResult.status === "fulfilled") {
            const offresData = offresResult.value;
            const offres = offresData.donnees?.offres || [];
            const activeOffers = offres.filter((offre) => offre.statut === "active" || offre.statut === "ouverte").length;
            
            cards.push({
              label: "Offres actives",
              value: activeOffers,
              hint: `Données réelles - ${offres.length} offres au total`,
            });
          }

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
          const overview = await fetchSupervisionResource<SupervisionOverview>("/statistics/overview");
          const cards: WorkspaceStatCard[] = [
            {
              label: t("supervision.dashboard.companiesInScope"),
              value: overview.totals.total_companies,
              hint: t("supervision.dashboard.activeCompanies", {
                count: overview.totals.active_companies,
              }),
            },
            {
              label: t("supervision.dashboard.openRoles"),
              value: overview.totals.total_offers,
              hint: t("supervision.dashboard.applicationsTracked", {
                count: overview.totals.total_applications,
              }),
            },
            {
              label: t("supervision.dashboard.shortlistedCandidates"),
              value: overview.totals.shortlisted_candidates,
              hint: t("supervision.dashboard.applicationsRate", {
                rate: overview.rates.shortlist_rate,
              }),
            },
            {
              label: t("supervision.dashboard.hiredCandidates"),
              value: overview.totals.hired_candidates,
              hint: t("supervision.dashboard.hiringRate", {
                rate: overview.rates.hiring_rate,
              }),
            },
          ];

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
        }
      } catch (error: unknown) {
        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
          setErreurStats(
            error instanceof Error
              ? error.message
              : utilisateur.role === "candidat"
                ? t("home.candidate.loadStatsError")
                : t("home.workspace.noRealDataDescription"),
          );
        }
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    };

    void charger();

    return () => {
      active = false;
    };
  }, [t, utilisateur]);

  if (!utilisateur) {
    return null;
  }

  if (utilisateur.role === "candidat") {
    return (
      <CandidateHome
        utilisateurNom={utilisateur.nom}
        stats={candidateStats}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
        t={t}
      />
    );
  }

  if (utilisateur.role === "entreprise") {
    return (
      <EntrepriseHome
        utilisateurNom={utilisateur.nom}
        stats={workspaceStats}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
      />
    );
  }

  const contenu = buildWorkspaceContent(utilisateur.role, t);

  if (isShowcaseWorkspaceRole(utilisateur.role)) {
    return (
      <RoleWorkspaceHome
        role={utilisateur.role}
        utilisateurNom={utilisateur.nom}
        content={contenu}
        stats={workspaceStats}
        adminStats={adminStats}
        adminWorkflow={adminWorkflow}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
        t={t}
      />
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        badge={contenu.badge}
        title={contenu.title}
        description={contenu.description}
        tone="dark"
        actions={
          <ButtonLink href={contenu.actions[0].href} variant="secondary">
            {t("home.workspace.openNextStep")}
          </ButtonLink>
        }
      />

      {loadingStats && (utilisateur.role === "admin" || utilisateur.role === "inspecteur" || utilisateur.role === "aneti") ? (
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description={t("common.loadingWorkspaceDescription")}
        />
      ) : null}

      {workspaceStats.length > 0 ? (
        <section className="stat-grid">
          {workspaceStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
          ))}
        </section>
      ) : null}

      {erreurStats && workspaceStats.length === 0 && utilisateur.role === "entreprise" ? (
        <div className="message message-erreur">{erreurStats}</div>
      ) : null}

      <section className="surface-grid surface-grid-3">
        {contenu.actions.map((action) => (
          <Card key={action.href} interactive padding="lg">
            <div className="stack-lg">
              <div>
                <p className="badge">{action.title}</p>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontFamily: "var(--app-heading)" }}>
                  {action.title}
                </h2>
                <p className="texte-secondaire" style={{ margin: "12px 0 0" }}>
                  {action.text}
                </p>
              </div>
              <button
                className="ui-button ui-button-secondary"
                onClick={() => router.push(action.href)}
                type="button"
              >
                {t("home.workspace.openSection")}
              </button>
            </div>
          </Card>
        ))}
      </section>

      <Card tone="accent" padding="lg">
        <div className="split-grid">
          <div>
            <p className="badge">{t("home.workspace.oneSystemBadge")}</p>
            <h2 style={{ margin: 0, fontSize: "2rem", fontFamily: "var(--app-heading)" }}>
              {t("home.workspace.oneSystemTitle")}
            </h2>
          </div>
          <p className="texte-secondaire" style={{ margin: 0 }}>
            {t("home.workspace.oneSystemDescription")}
          </p>
        </div>
      </Card>
    </div>
  );
}

function RoleWorkspaceHome({
  role,
  utilisateurNom,
  content,
  stats,
  adminStats,
  adminWorkflow,
  loadingStats,
  erreurStats,
  t,
}: {
  role: string;
  utilisateurNom: string;
  content: WorkspaceContent;
  stats: WorkspaceStatCard[];
  adminStats: StatistiquesAdmin | null;
  adminWorkflow: WorkflowPoint[];
  loadingStats: boolean;
  erreurStats: string | null;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "HandiTalents";
  const primaryAction = content.actions[0];
  const secondaryAction = content.actions[1] ?? content.actions[0];
  const highlightedStats =
    stats.length > 0
      ? stats.slice(0, 2)
      : content.actions.slice(0, 2).map((action) => ({
          label: action.title,
          value: "—",
          hint: action.text,
        }));
  const insightItems =
    stats.length > 0
      ? stats.slice(0, 3).map((item) => ({
          title: item.label,
          text: item.hint || t("home.workspace.showcase.realDataText"),
        }))
      : content.actions.slice(0, 3).map((action) => ({
          title: action.title,
          text: action.text,
        }));
  const stripItems = Array.from(
    new Set(
      (stats.length > 0 ? stats.map((item) => item.label) : content.actions.map((action) => action.title)).slice(0, 5),
    ),
  );

  if (loadingStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description={t("common.loadingWorkspaceDescription")}
        />
      </main>
    );
  }

  return (
    <div className="candidate-showcase">
      <section className="candidate-showcase-hero">
        <div className="candidate-showcase-copy">
          <p className="candidate-showcase-tag">{content.badge}</p>
          <h1>{content.title}</h1>
          <p>{t("home.workspace.showcase.welcome", { name: firstName, description: content.description })}</p>
          <div className="candidate-showcase-actions">
            <ButtonLink href={primaryAction.href}>{primaryAction.title}</ButtonLink>
            {secondaryAction ? (
              <ButtonLink href={secondaryAction.href} variant="secondary">
                {secondaryAction.title}
              </ButtonLink>
            ) : null}
          </div>
        </div>

        <div className="candidate-showcase-visual">
          <div className="candidate-showcase-image-wrap">
            <div className="candidate-showcase-image" aria-hidden="true" />
          </div>
          {highlightedStats[0] ? (
            <div className="candidate-showcase-pill candidate-showcase-pill-top">
              <strong>{highlightedStats[0].value}</strong>
              <span>{highlightedStats[0].label}</span>
            </div>
          ) : null}
          {highlightedStats[1] ? (
            <div className="candidate-showcase-pill candidate-showcase-pill-right">
              <strong>{highlightedStats[1].value}</strong>
              <span>{highlightedStats[1].label}</span>
            </div>
          ) : null}
        </div>
      </section>

      {stripItems.length > 0 ? (
        <section className="candidate-showcase-strip">
          {stripItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </section>
      ) : null}

      {erreurStats ? <div className="message message-erreur">{erreurStats}</div> : null}

      {role === "admin" && adminStats ? (
        <section id="admin-stats" className="stack-lg">
          <div className="surface-grid surface-grid-4">
            <StatCard
              label={t("adminStats.totalApplications")}
              value={adminStats.total_candidatures ?? 0}
            />
            <StatCard
              label={t("adminStats.hiringRate")}
              value={`${formatPercent(adminStats.taux_recrutement)} %`}
            />
            <StatCard
              label={t("adminStats.averageTime")}
              value={formatPercent(adminStats.temps_moyen_traitement_jours)}
            />
            <StatCard
              label={t("adminStats.pending")}
              value={sumStatuses(adminStats.stats_par_statut, ["pending", "en_attente"])}
            />
          </div>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.statusBreakdown")}</strong>
              </div>
            </div>

            <div className="surface-grid surface-grid-3">
              {adminStats.stats_par_statut.map((item) => (
                <div key={`${item.statut}-${item.count}`} className="detail-box">
                  <strong>{translateStatusLabel(item.statut, t)}</strong>
                  <span>{item.count ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.workflowTitle")}</strong>
                <p className="texte-secondaire" style={{ margin: "6px 0 0" }}>
                  {t("adminStats.workflowDescription")}
                </p>
              </div>
            </div>

            {adminWorkflow.length === 0 ? (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                {t("adminStats.noRecentData")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>{t("adminStats.columns.date")}</th>
                      <th>{t("adminStats.columns.new")}</th>
                      <th>{t("adminStats.columns.shortlisted")}</th>
                      <th>{t("adminStats.columns.interviews")}</th>
                      <th>{t("adminStats.columns.accepted")}</th>
                      <th>{t("adminStats.columns.rejected")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminWorkflow.map((point) => (
                      <tr key={point.date}>
                        <td>{formatDate(point.date)}</td>
                        <td>{point.nouvelles ?? 0}</td>
                        <td>{point.shortlistees ?? 0}</td>
                        <td>{point.entretiens ?? 0}</td>
                        <td>{point.acceptees ?? 0}</td>
                        <td>{point.refusees ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.topCompaniesTitle")}</strong>
              </div>
            </div>

            {adminStats.entreprises_actives.length === 0 ? (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                {t("adminStats.noCompanyActivity")}
              </p>
            ) : (
              <div className="space-y-3">
                {adminStats.entreprises_actives.map((entreprise) => (
                  <div key={entreprise.entreprise_nom} className="profile-preference-row">
                    <div className="profile-preference-copy">
                      <strong>{entreprise.entreprise_nom}</strong>
                      <p>
                        {t("adminStats.companySummary", {
                          offers: entreprise.nombre_offres ?? 0,
                          applications: entreprise.nombre_candidatures ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      ) : null}

      <section className="candidate-showcase-learning">
        <div className="candidate-showcase-collage">
          <div className="candidate-showcase-collage-image" aria-hidden="true" />
        </div>
        <div className="candidate-showcase-learning-copy">
          <p className="candidate-showcase-tag">{t("home.workspace.showcase.focusTag")}</p>
          <h2>{t("home.workspace.showcase.focusTitle")}</h2>
          <div className="candidate-showcase-benefits">
            {insightItems.map((item) => (
              <div key={item.title} className="candidate-showcase-benefit">
                <div className="candidate-showcase-benefit-icon" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="candidate-showcase-courses">
        <div className="candidate-showcase-courses-head">
          <p className="candidate-showcase-tag">{t("home.workspace.showcase.sectionsTag")}</p>
          <h2>{t("home.workspace.showcase.sectionsTitle")}</h2>
        </div>
        <div className="candidate-showcase-cards">
          {content.actions.map((action, index) => (
            <article key={action.href} className="candidate-showcase-card">
              <div
                className={`candidate-showcase-card-image candidate-showcase-card-image-${(index % 3) + 1}`}
                aria-hidden="true"
              />
              <strong>{action.title}</strong>
              <p>{action.text}</p>
              <ButtonLink href={action.href} variant="secondary">
                {t("home.workspace.openSection")}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="candidate-showcase-stats">
          {stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="candidate-showcase-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>
      ) : (
        <section className="candidate-showcase-search">
          <p className="candidate-showcase-tag">{t("home.workspace.oneSystemBadge")}</p>
          <h2>{t("home.workspace.noRealDataTitle")}</h2>
          <p className="texte-secondaire" style={{ margin: "12px auto 0", maxWidth: 680 }}>
            {t("home.workspace.noRealDataDescription")}
          </p>
        </section>
      )}

      <section className="candidate-showcase-final">
        <div className="candidate-showcase-final-copy">
          <p className="candidate-showcase-tag">{t("home.workspace.oneSystemBadge")}</p>
          <h2>{t("home.workspace.oneSystemTitle")}</h2>
          <p>{t("home.workspace.oneSystemDescription")}</p>
          <div className="candidate-showcase-actions">
            {content.actions.map((action) => (
              <ButtonLink key={action.href} href={action.href} variant="secondary">
                {action.title}
              </ButtonLink>
            ))}
          </div>
        </div>
        <div className="candidate-showcase-final-visual">
          <div className="candidate-showcase-final-image" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}

function CandidateHome({
  utilisateurNom,
  stats,
  loadingStats,
  erreurStats,
  t,
}: {
  utilisateurNom: string;
  stats: CandidateStatItem[];
  loadingStats: boolean;
  erreurStats: string | null;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [profileProgress, setProfileProgress] = useState<number | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState<Record<string, unknown> | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number | null>(null);
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null);
  const [publicOffers, setPublicOffers] = useState<OffrePublique[]>([]);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);

  const statsMap = useMemo(
    () =>
      stats.reduce<Record<string, number>>((acc, item) => {
        acc[item.statut] = Number(item.count) || 0;
        return acc;
      }, {}),
    [stats],
  );

  useEffect(() => {
    if (!utilisateur || utilisateur.role !== "candidat") {
      return;
    }

    let active = true;

    const loadDashboardData = async () => {
      setProfileError(null);
      setApplicationsError(null);
      setInterviewsError(null);
      setFavoritesError(null);
      setOffersError(null);

      const profilePromise = authenticatedFetch(construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`)).then(
        async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload?.message || "Unable to load profile.");
          return payload?.donnees ?? payload;
        },
      );

      const candidaturesPromise = authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures")).then(
        async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload?.message || "Unable to load applications.");
          return Array.isArray(payload?.donnees) ? payload.donnees : [];
        },
      );

      const interviewsPromise = authenticatedFetch(construireUrlApi("/api/entretiens/candidat")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Unable to load interviews.");
        return Array.isArray(payload?.donnees) ? payload.donnees : [];
      });

      const favorisPromise = authenticatedFetch(construireUrlApi("/api/favoris")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Unable to load favorites.");
        return Array.isArray(payload?.donnees) ? payload.donnees : [];
      });

      const offersPromise = fetch(construireUrlApi("/api/offres/publiques")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Unable to load public offers.");
        const offers = Array.isArray(payload?.donnees?.offres) ? payload.donnees.offres : [];
        return offers as OffrePublique[];
      });

      const [profileResult, candidaturesResult, interviewsResult, favorisResult, offersResult] = await Promise.allSettled([
        profilePromise,
        candidaturesPromise,
        interviewsPromise,
        favorisPromise,
        offersPromise,
      ]);

      if (!active) return;

      if (profileResult.status === "fulfilled") {
        const profil = profileResult.value as Record<string, unknown>;
        setProfileSnapshot(profil);
        const completionValues = [
          profil.nom,
          profil.email,
          profil.telephone,
          profil.addresse,
          profil.experience,
          profil.formation,
          profil.handicap,
          profil.salaire_souhaite,
        ];
        const completed = completionValues.filter((value) => typeof value === "string" && value.trim().length > 0).length;
        setProfileProgress(Math.round((completed / completionValues.length) * 100));
      } else {
        setProfileSnapshot(null);
        setProfileProgress(null);
        setProfileError(profileResult.reason instanceof Error ? profileResult.reason.message : "Impossible de charger le profil.");
      }

      if (candidaturesResult.status === "fulfilled") {
        setApplicationsCount(candidaturesResult.value.length);
      } else {
        setApplicationsCount(null);
        setApplicationsError(
          candidaturesResult.reason instanceof Error
            ? candidaturesResult.reason.message
            : "Impossible de charger les candidatures.",
        );
      }

      if (interviewsResult.status === "fulfilled") {
        const now = Date.now();
        const upcoming = interviewsResult.value.filter((item: Record<string, unknown>) => {
          const entretien = (item.entretien || {}) as Record<string, unknown>;
          const ts = new Date(String(entretien.date_heure || "")).getTime();
          return !Number.isNaN(ts) && ts >= now;
        }).length;
        setInterviewsCount(upcoming);
      } else {
        setInterviewsCount(null);
        setInterviewsError(
          interviewsResult.reason instanceof Error ? interviewsResult.reason.message : "Impossible de charger les entretiens.",
        );
      }

      if (favorisResult.status === "fulfilled") {
        setFavoritesCount(favorisResult.value.length);
      } else {
        setFavoritesCount(null);
        setFavoritesError(favorisResult.reason instanceof Error ? favorisResult.reason.message : "Impossible de charger les favoris.");
      }

      if (offersResult.status === "fulfilled") {
        const latestActiveOffers = offersResult.value
          .filter((offer) => normalizeStatus(String(offer.statut || "active")) === "active")
          .sort((left, right) => {
            return new Date(String(right.created_at || "")).getTime() - new Date(String(left.created_at || "")).getTime();
          })
          .slice(0, 3);
        setPublicOffers(latestActiveOffers);
      } else {
        setPublicOffers([]);
        setOffersError(offersResult.reason instanceof Error ? offersResult.reason.message : "Impossible de charger les offres.");
      }
    };

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, [utilisateur]);

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const pending = statsMap.pending || 0;
  const shortlistAndInterview = (statsMap.shortlisted || 0) + (statsMap.interview_scheduled || 0);
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "HandiTalents";
  const profileValue = profileProgress ?? 0;
  const applicationsValue = applicationsCount ?? total;
  const interviewsValue = interviewsCount ?? shortlistAndInterview;
  const favoritesValue = favoritesCount ?? 0;
  const profileSections = [
    {
      label: "Informations personnelles",
      done:
        hasText(profileSnapshot?.nom) &&
        hasText(profileSnapshot?.email) &&
        hasText(profileSnapshot?.telephone),
    },
    {
      label: "Competences et parcours",
      done: hasText(profileSnapshot?.experience) || hasText(profileSnapshot?.formation),
    },
    {
      label: "Preferences et accessibilite",
      done: hasText(profileSnapshot?.handicap) || hasText(profileSnapshot?.salaire_souhaite),
    },
    {
      label: "Documents et finalisation",
      done: profileValue >= 80,
    },
  ];
  const matchingScore = clamp(
    Math.round(profileValue * 0.72 + applicationsValue * 4 + interviewsValue * 7 + favoritesValue * 2),
    profileValue > 0 ? 42 : 24,
    96,
  );
  const responseWaiting = Math.max(applicationsValue - pending - interviewsValue, 0);
  const spotlightOffers = publicOffers.map((offer, index) => ({
    ...offer,
    match: clamp(matchingScore - index * 7 + (index === 0 ? 9 : 0), 72, 96),
    isNew: index === 0,
  }));
    const heroHighlights = [
    { title: "Offres inclusives", text: "Des postes adaptes a votre rythme et a vos besoins." },
    { title: "Recommande pour vous", text: "Un tri plus fin selon votre progression actuelle." },
    { title: "Entreprises engagees", text: "Des recruteurs qui affichent leurs engagements." },
    { title: "Booster mon profil", text: profileProgress === null ? "Profil a completer" : `Completion ${profileValue}%` },
  ];
  const quickActions = [
    {
      title: "Deposer mon CV",
      text: "Mettez a jour votre CV",
      href: "/candidat/cv",
      accent: "violet",
      icon: "CV",
    },
    {
      title: "Passer un test",
      text: "Evaluez vos competences",
      href: "/candidat/tests-psychologiques",
      accent: "rose",
      icon: "TS",
    },
    {
      title: "Explorer les formations",
      text: "Developpez vos talents",
      href: "/offres",
      accent: "mint",
      icon: "FO",
    },
    {
      title: "Simulateur d'entretien",
      text: "Entrainez-vous",
      href: "/candidat/entretiens",
      accent: "lavender",
      icon: "EN",
    },
    {
      title: "Discuter avec l'IA",
      text: "Obtenez des conseils",
      href: "/messages",
      accent: "sky",
      icon: "IA",
      badge: "Nouveau",
    },
  ];
  const resources = [
    {
      title: "Guide d'accessibilite",
      text: "Conseils et bonnes pratiques",
      href: "/offres",
      icon: "GA",
    },
    {
      title: "Aides & dispositifs",
      text: "Decouvrez les aides disponibles",
      href: "/messages",
      icon: "AD",
    },
    {
      title: "Temoignages",
      text: "Ils ont reussi avec HandiTalents",
      href: "/candidat/avis",
      icon: "TE",
    },
  ];
  const dashboardErrorMessage = [erreurStats, applicationsError, interviewsError, favoritesError, offersError]
    .filter(Boolean)
    .join(" ");

  if (loadingStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title={t("common.loadingWorkspaceTitle")} description={t("common.loadingWorkspaceDescription")} />
      </main>
    );
  }

  return (
    <div className="candidate-home-v2x">
        <section className="candidate-home-v2x__hero card-base">
          <div className="candidate-home-v2x__hero-copy">
            <div className="candidate-home-v2x__hero-top">
              <div>
                <h1>Bonjour {firstName}</h1>
                <p className="candidate-home-v2x__hero-subtitle">
                  Chaque talent a sa place ici. Votre compte avance, vos pistes se clarifient, et vos prochaines opportunites deviennent plus visibles.
                </p>
              </div>
            </div>

          <div className="candidate-home-v2x__hero-actions">
            <ButtonLink href="/offres" variant="secondary">
              Explorer les offres
            </ButtonLink>
            <ButtonLink href="/candidat/cv" variant="secondary">
              Ameliorer mon profil
            </ButtonLink>
          </div>

          <div className="candidate-home-v2x__highlight-grid">
            {heroHighlights.map((item) => (
              <article key={item.title} className="candidate-home-v2x__highlight-card">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
                {item.title === "Booster mon profil" ? (
                  <i style={{ width: `${Math.max(profileValue, 8)}%` }} aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="candidate-home-v2x__hero-visual">
          <div className="candidate-home-v2x__hero-illustration" aria-hidden="true">
            <Image src="/uploads/home.png" alt="" width={640} height={640} className="candidate-home-v2x__hero-img" />
          </div>
        </div>
      </section>

      <div className="candidate-home-v2x__dashboard">
        <div className="candidate-home-v2x__main">
          <section className="candidate-home-v2x__searchbar card-base">
            <form
              className="candidate-home-v2x__searchform"
              onSubmit={(event) => {
                event.preventDefault();
                const term = searchTerm.trim();
                router.push(term ? `/offres?search=${encodeURIComponent(term)}` : "/offres");
              }}
            >
              <label className="candidate-home-v2x__search-inputwrap">
                <span aria-hidden="true" className="candidate-home-v2x__search-icon">
                  O
                </span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher un poste, une competence, une entreprise..."
                  aria-label="Rechercher une offre"
                />
              </label>
              <button type="submit" aria-label="Lancer la recherche">
                Rechercher
              </button>
              <button
                type="button"
                className="candidate-home-v2x__filter-button"
                aria-label="Afficher les filtres"
                onClick={() => router.push("/offres")}
              >
                ≡
              </button>
            </form>
          </section>

          <section className="candidate-home-v2x__top-panels">
            <article className="candidate-home-v2x__profile-panel">
              <div className="candidate-home-v2x__panel-head candidate-home-v2x__panel-head--light">
                <div>
                  <h2>Completion de votre profil</h2>
                  <p>Super ! Vous etes presque pret(e)</p>
                </div>
                <span className="candidate-home-v2x__panel-orb" aria-hidden="true">
                  A
                </span>
              </div>
              {profileError ? <p className="candidate-home-v2x__section-error">{profileError}</p> : null}
              <div className="candidate-home-v2x__progress candidate-home-v2x__progress--hero">
                <span style={{ width: `${profileValue}%` }} />
              </div>
              <div className="candidate-home-v2x__profile-progressmeta">
                <strong>{profileProgress === null ? "Non precise" : `${profileValue}%`}</strong>
              </div>
              <div className="candidate-home-v2x__checklist">
                {profileSections.map((section) => (
                  <div key={section.label} className={`candidate-home-v2x__check ${section.done ? "is-done" : ""}`}>
                    <span aria-hidden="true">{section.done ? "✓" : "○"}</span>
                    <p>{section.label}</p>
                  </div>
                ))}
              </div>
              <ButtonLink href="/candidat/cv" variant="secondary" className="candidate-home-v2x__profile-cta">
                Completer mon profil
              </ButtonLink>
            </article>

            <article className="candidate-home-v2x__activity-panel card-base">
              <div className="candidate-home-v2x__panel-head">
                <div>
                  <h2>Votre activite</h2>
                </div>
                <ButtonLink href="/candidat/candidatures" variant="secondary">
                  Voir tout
                </ButtonLink>
              </div>
              <div className="candidate-home-v2x__activity-grid">
                <div>
                  <strong>{applicationsValue}</strong>
                  <span>Candidatures</span>
                  <small>Envoyees</small>
                </div>
                <div>
                  <strong>{interviewsValue}</strong>
                  <span>Entretiens</span>
                  <small>A venir</small>
                </div>
                <div>
                  <strong>{favoritesValue}</strong>
                  <span>Favoris</span>
                  <small>Offres sauvegardees</small>
                </div>
                <div>
                  <strong>{responseWaiting}</strong>
                  <span>Reponse</span>
                  <small>En attente</small>
                </div>
              </div>
            </article>

            <article className="candidate-home-v2x__match-panel card-base">
              <div className="candidate-home-v2x__panel-head">
                <div>
                  <h2>Score de correspondance</h2>
                </div>
              </div>
              <div className="candidate-home-v2x__score-ring" style={{ ["--score" as string]: `${matchingScore}%` }}>
                <div>
                  <strong>{matchingScore}%</strong>
                  <span>Bon match !</span>
                </div>
              </div>
              <p className="candidate-home-v2x__panel-copy">Des offres vous correspondent</p>
              <small>Mise a jour aujourd&apos;hui</small>
            </article>
          </section>

          <section className="candidate-home-v2x__actions-section">
            <div className="candidate-home-v2x__section-headline">
              <h2>Actions rapides</h2>
            </div>
            <div className="candidate-home-v2x__actions">
              {quickActions.map((action) => (
                <ButtonLink
                  key={action.title}
                  href={action.href}
                  variant="secondary"
                  className={`candidate-home-v2x__action-card candidate-home-v2x__action-card--${action.accent}`}
                >
                  {action.badge ? <span className="candidate-home-v2x__action-chip">{action.badge}</span> : null}
                  <span className="candidate-home-v2x__action-badge" aria-hidden="true">
                    {action.icon}
                  </span>
                  <strong>{action.title}</strong>
                  <small>{action.text}</small>
                </ButtonLink>
              ))}
            </div>
          </section>

            <section className="candidate-home-v2x__journey">
              <div className="candidate-home-v2x__journey-copy">
                <div className="candidate-home-v2x__section-headline candidate-home-v2x__journey-headline">
                  <h2>Mettez en avant vos competences</h2>
                  <p className="candidate-home-v2x__journey-lead">
                    Completez votre profil pour recevoir des offres qui vous correspondent vraiment.
                  </p>
                </div>
                <div className="candidate-home-v2x__journey-actions">
                  <ButtonLink href="/candidat/cv" variant="secondary" className="candidate-home-v2x__journey-button">
                    Completer mon profil
                  </ButtonLink>
                </div>
              </div>
            <div className="candidate-home-v2x__journey-art" aria-hidden="true">
              <Image src="/uploads/fleche.png" alt="" width={420} height={420} className="candidate-home-v2x__cta-img" />
            </div>
          </section>
        </div>

        <aside className="candidate-home-v2x__rail">
          <section className="candidate-home-v2x__offers-panel card-base">
            <div className="candidate-home-v2x__panel-head">
              <div>
                <h2>Offres pour vous</h2>
              </div>
              <ButtonLink href="/offres" variant="secondary">
                Voir toutes
              </ButtonLink>
            </div>

            {spotlightOffers.length > 0 ? (
              <div className="candidate-home-v2x__offers-list">
                {spotlightOffers.map((offer) => (
                  <article key={offer.id_offre} className="candidate-home-v2x__offer-item">
                    <div className="candidate-home-v2x__offer-mark">{buildOfferMark(offer.nom_entreprise)}</div>
                    <div className="candidate-home-v2x__offer-copy">
                      <div className="candidate-home-v2x__offer-head">
                        <h3>{offer.titre}</h3>
                        {offer.isNew ? <span className="candidate-home-v2x__offer-chip">Nouveau</span> : null}
                      </div>
                      <p>{offer.nom_entreprise || "Entreprise non precise"}</p>
                      <small>{offer.localisation || "Localisation non precise"}</small>
                    </div>
                    <span className="candidate-home-v2x__match-chip">{offer.match}% match</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="candidate-home-v2x__offers-empty">
                <strong>Aucune offre prioritaire pour le moment.</strong>
                <p>{offersError || "Nous afficherons ici les nouvelles opportunites des qu&apos;elles seront disponibles."}</p>
              </div>
            )}

            <ButtonLink href="/offres" variant="secondary" className="candidate-home-v2x__offers-footer">
              Voir toutes les offres
            </ButtonLink>
          </section>

          <section className="candidate-home-v2x__resources-panel card-base">
            <div className="candidate-home-v2x__panel-head">
              <div>
                <h2>Ressources utiles</h2>
              </div>
            </div>
            <div className="candidate-home-v2x__resources-list">
              {resources.map((resource) => (
                <ButtonLink key={resource.title} href={resource.href} variant="secondary" className="candidate-home-v2x__resource-row">
                  <span className="candidate-home-v2x__resource-mark" aria-hidden="true">
                    {resource.icon}
                  </span>
                  <span className="candidate-home-v2x__resource-copy">
                    <strong>{resource.title}</strong>
                    <small>{resource.text}</small>
                  </span>
                  <span className="candidate-home-v2x__resource-arrow" aria-hidden="true">
                    &gt;
                  </span>
                </ButtonLink>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {dashboardErrorMessage ? (
        <div className="message message-erreur">
          {dashboardErrorMessage}
        </div>
      ) : null}
    </div>
  );
}

type OffrePublique = {
  id_offre: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min: number;
  salaire_max: number;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  statut?: string;
  date_limite?: string;
  created_at?: string;
  candidatures_count?: number;
  vues_count?: number;
  nom_entreprise?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildOfferMark(company?: string) {
  const clean = company?.trim() || "HT";
  const parts = clean.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "H") + (parts[1]?.[0] || parts[0]?.[1] || "T");
}
function sumStatuses(items: StatParStatut[] | undefined, statuses: string[]) {
  if (!items) {
    return 0;
  }

  const normalized = new Set(statuses.map(normalizeStatus));
  return items.reduce((total, item) => {
    return total + (normalized.has(normalizeStatus(item.statut)) ? item.count : 0);
  }, 0);
}

function translateStatusLabel(status: string, t: (key: string) => string) {
  switch (normalizeStatus(status)) {
    case "pending":
    case "en_attente":
      return t("adminStats.statuses.pending");
    case "new":
    case "nouvelles":
    case "nouvelle":
      return t("adminStats.statuses.new");
    case "shortlisted":
    case "shortlistees":
    case "shortlistee":
      return t("adminStats.statuses.shortlisted");
    case "interviews":
    case "interview":
    case "entretiens":
    case "entretien":
      return t("adminStats.statuses.interviews");
    case "accepted":
    case "acceptees":
    case "acceptee":
      return t("adminStats.statuses.accepted");
    case "rejected":
    case "refusees":
    case "refusee":
      return t("adminStats.statuses.rejected");
    default:
      return humanizeStatus(status);
  }
}

function normalizeStatus(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function humanizeStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatPercent(value: number | undefined) {
  return Number(value ?? 0).toFixed(1);
}

