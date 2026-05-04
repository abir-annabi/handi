"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { PassageTest } from "@/components/passage-test";
import { RouteProtegee } from "@/components/route-protegee";
import { LoadingState } from "@/components/ui/layout";
import { useI18n } from "@/components/i18n-provider";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type TestDisponible = {
  id_test: string;
  titre: string;
  description?: string;
  type_test?: string;
  duree_minutes?: number;
  instructions?: string;
  deja_passe?: boolean;
  peut_passer?: boolean;
};

type Resultat = {
  id_resultat: string;
  score_obtenu?: number | string;
  pourcentage?: number | string;
  est_visible?: boolean;
  date_passage?: string;
  temps_passe_minutes?: number;
  peut_modifier_visibilite?: boolean;
  test?: {
    id_test?: string;
    titre?: string;
    type_test?: string;
  };
};

type TestEnCours = {
  id_test: string;
  titre: string;
  description: string;
  duree_minutes: number;
  instructions: string;
  questions: Array<{
    id_question: string;
    contenu_question: string;
    type_question: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
    ordre: number;
    obligatoire: boolean;
    options: Array<{
      id_option: string;
      texte_option: string;
      ordre: number;
    }>;
  }>;
};

type FilterKey = "all" | "recommended" | "easy" | "short" | "accessible";
type SortKey = "recommended" | "duration" | "difficulty";
type Difficulty = "Easy" | "Medium" | "Hard";
type IconName =
  | "users"
  | "code"
  | "chart"
  | "brain"
  | "clock"
  | "calendar"
  | "spark"
  | "star"
  | "trend"
  | "accessibility"
  | "contrast"
  | "motion"
  | "target"
  | "filter"
  | "robot"
  | "heart"
  | "eye"
  | "badge";

type EnhancedTest = TestDisponible & {
  duration: number;
  difficulty: Difficulty;
  recommended: boolean;
  accessible: boolean;
  icon: IconName;
  summary: string;
  learnTags: string[];
  accessibilityLabel: string;
  primarySkill: string;
};

type EnhancedResult = Resultat & {
  title: string;
  score: number;
  dateLabel: string;
  timeSpent: number;
  difficulty: Difficulty;
  passed: boolean;
  visible: boolean;
  primarySkill: string;
};

const RESULTAT_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "recommended", label: "Recommended" },
  { key: "easy", label: "Easy" },
  { key: "short", label: "Short" },
  { key: "accessible", label: "Accessible" },
];

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "recommended", label: "Recommended" },
  { key: "duration", label: "Shortest" },
  { key: "difficulty", label: "Difficulty" },
];

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferDifficulty(title: string, type: string, duration: number): Difficulty {
  const source = `${title} ${type}`.toLowerCase();
  if (
    source.includes("technical") ||
    source.includes("aptitude") ||
    source.includes("cogn") ||
    source.includes("logic") ||
    duration >= 28
  ) {
    return "Hard";
  }

  if (
    source.includes("soft") ||
    source.includes("person") ||
    source.includes("communication") ||
    duration <= 18
  ) {
    return "Easy";
  }

  return "Medium";
}

function describeTest(test: TestDisponible) {
  const title = (test.titre || "").toLowerCase();
  const type = (test.type_test || "").toLowerCase();

  if (title.includes("soft") || title.includes("communication")) {
    return {
      icon: "users" as const,
      summary:
        test.description ||
        "Evaluate your communication, adaptability and teamwork skills.",
      learnTags: ["Communication", "Adaptability"],
      primarySkill: "Communication",
    };
  }

  if (title.includes("technical") || title.includes("aptitude") || type.includes("compet")) {
    return {
      icon: "code" as const,
      summary:
        test.description ||
        "Test your logic, problem-solving and technical understanding.",
      learnTags: ["Logic", "Problem Solving"],
      primarySkill: "Problem solving",
    };
  }

  if (title.includes("person")) {
    return {
      icon: "chart" as const,
      summary:
        test.description ||
        "Discover your personality traits and preferred work style.",
      learnTags: ["Self-awareness", "Work Style"],
      primarySkill: "Adaptability",
    };
  }

  if (title.includes("cogn")) {
    return {
      icon: "brain" as const,
      summary:
        test.description ||
        "Assess your memory, attention and cognitive abilities.",
      learnTags: ["Memory", "Attention"],
      primarySkill: "Creativity",
    };
  }

  return {
    icon: "spark" as const,
    summary:
      test.description || "Build confidence with an inclusive guided assessment.",
    learnTags: ["Confidence", "Potential"],
    primarySkill: "Teamwork",
  };
}

function inferPrimarySkill(resultat: Resultat) {
  const title = (resultat.test?.titre || "").toLowerCase();
  const type = (resultat.test?.type_test || "").toLowerCase();

  if (title.includes("soft") || title.includes("communication")) return "Communication";
  if (title.includes("technical") || title.includes("aptitude") || type.includes("compet")) {
    return "Problem solving";
  }
  if (title.includes("person") || type.includes("person")) return "Adaptability";
  if (title.includes("cogn")) return "Creativity";
  return "Teamwork";
}

function radarMetrics(results: EnhancedResult[]) {
  const buckets: Record<string, number[]> = {
    Communication: [],
    Teamwork: [],
    "Problem solving": [],
    Adaptability: [],
  };

  results.forEach((item) => {
    const key = item.primarySkill;
    if (buckets[key]) {
      buckets[key].push(item.score);
    }
  });

  return Object.entries(buckets).map(([label, values]) => ({
    label,
    value:
      values.length > 0
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 34,
  }));
}

function strongestAndWeakest(data: Array<{ label: string; value: number }>) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return {
    top: sorted[0] || { label: "Communication", value: 0 },
    low: sorted[sorted.length - 1] || { label: "Adaptability", value: 0 },
  };
}

function radarPoints(values: number[]) {
  const cx = 120;
  const cy = 110;
  const radius = 76;

  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
      const scaledRadius = (radius * value) / 100;
      const x = cx + Math.cos(angle) * scaledRadius;
      const y = cy + Math.sin(angle) * scaledRadius;
      return `${x},${y}`;
    })
    .join(" ");
}

function radarLabelPosition(index: number, total: number) {
  const cx = 120;
  const cy = 110;
  const radius = 102;
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function AppIcon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "users":
      return (
        <svg {...props}>
          <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M15.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M3.5 18.5c0-2.4 2.4-4 5-4s5 1.6 5 4" />
          <path d="M13.5 17c.5-1.4 1.9-2.4 3.7-2.4 1.6 0 3 .7 3.3 2" />
        </svg>
      );
    case "code":
      return (
        <svg {...props}>
          <path d="M8 8 4 12l4 4" />
          <path d="M16 8l4 4-4 4" />
          <path d="m13 5-2 14" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M5 18V12" />
          <path d="M12 18V7" />
          <path d="M19 18V4" />
        </svg>
      );
    case "brain":
      return (
        <svg {...props}>
          <path d="M8 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3" />
          <path d="M16 5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3" />
          <path d="M8 8h1.6a2.4 2.4 0 1 1 0 4.8H8" />
          <path d="M16 8h-1.6a2.4 2.4 0 1 0 0 4.8H16" />
          <path d="M12 5v14" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path d="M7 3v4" />
          <path d="M17 3v4" />
          <rect x="4" y="6" width="16" height="14" rx="3" />
          <path d="M4 10h16" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 20l1-6L3.2 9.4l6.1-.9Z" />
        </svg>
      );
    case "trend":
      return (
        <svg {...props}>
          <path d="M4 16 10 10l4 4 6-7" />
          <path d="M15 7h5v5" />
        </svg>
      );
    case "accessibility":
      return (
        <svg {...props}>
          <circle cx="12" cy="5" r="2.2" />
          <path d="M6 9h12" />
          <path d="M12 9v10" />
          <path d="m8.3 19 3.7-5 3.7 5" />
          <path d="m8.2 9 1.8 4" />
          <path d="m15.8 9-1.8 4" />
        </svg>
      );
    case "contrast":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 0 16Z" />
        </svg>
      );
    case "motion":
      return (
        <svg {...props}>
          <path d="M3 12h5" />
          <path d="M10 12h5" />
          <path d="M17 12h4" />
          <path d="M7 8h10" />
          <path d="M7 16h10" />
        </svg>
      );
    case "target":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case "filter":
      return (
        <svg {...props}>
          <path d="M4 6h16l-6 7v5l-4 2v-7L4 6Z" />
        </svg>
      );
    case "robot":
      return (
        <svg {...props}>
          <rect x="5" y="8" width="14" height="10" rx="4" />
          <path d="M12 4v4" />
          <circle cx="9.5" cy="12.5" r="1" />
          <circle cx="14.5" cy="12.5" r="1" />
          <path d="M9 16h6" />
        </svg>
      );
    case "heart":
      return (
        <svg {...props}>
          <path d="M12 19s-7-4.4-7-9.3A4.2 4.2 0 0 1 9.2 5c1.2 0 2.3.5 2.8 1.4.5-.9 1.6-1.4 2.8-1.4A4.2 4.2 0 0 1 19 9.7C19 14.6 12 19 12 19Z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "badge":
      return (
        <svg {...props}>
          <path d="M12 3 4 7v6c0 4.2 3.6 7.8 8 8 4.4-.2 8-3.8 8-8V7l-8-4Z" />
          <path d="m9.2 12.2 1.9 1.9 3.7-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TestsPsychologiquesCandidatPage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <CandidateAssessmentsPage />
    </RouteProtegee>
  );
}

function CandidateAssessmentsPage() {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testsDisponibles, setTestsDisponibles] = useState<TestDisponible[]>([]);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [testEnCours, setTestEnCours] = useState<TestEnCours | null>(null);
  const [testDemarrageId, setTestDemarrageId] = useState<string | null>(null);
  const [visibiliteResultatId, setVisibiliteResultatId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [showAllResults, setShowAllResults] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const localeCode = locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeCode, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [localeCode],
  );

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);

      const [testsRes, resultsRes] = await Promise.all([
        authenticatedFetch(construireUrlApi("/api/tests-psychologiques/candidat/tests-disponibles")),
        authenticatedFetch(construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats")),
      ]);

      const testsData = await testsRes.json().catch(() => ({}));
      const resultsData = await resultsRes.json().catch(() => ({}));

      if (!testsRes.ok && !resultsRes.ok) {
        throw new Error(
          testsData.message || resultsData.message || t("assessments.candidate.loadError"),
        );
      }

      setTestsDisponibles(Array.isArray(testsData?.donnees?.tests) ? testsData.donnees.tests : []);
      setResultats(
        Array.isArray(resultsData?.donnees?.resultats) ? resultsData.donnees.resultats : [],
      );
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : t("assessments.candidate.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const tests = useMemo<EnhancedTest[]>(() => {
    return testsDisponibles.map((test) => {
      const duration = toNumber(test.duree_minutes) || 20;
      const difficulty = inferDifficulty(test.titre || "", test.type_test || "", duration);
      const description = describeTest(test);

      return {
        ...test,
        duration,
        difficulty,
        recommended: difficulty !== "Hard" || description.primarySkill === "Communication",
        accessible: true,
        icon: description.icon,
        summary: description.summary,
        learnTags: description.learnTags,
        accessibilityLabel: "Accessible",
        primarySkill: description.primarySkill,
      };
    });
  }, [testsDisponibles]);

  const results = useMemo<EnhancedResult[]>(() => {
    return resultats
      .map((item) => {
        const score =
          toNumber(item.pourcentage) > 0
            ? clampPercent(toNumber(item.pourcentage))
            : clampPercent(toNumber(item.score_obtenu));
        const duration = toNumber(item.temps_passe_minutes);

        return {
          ...item,
          title: item.test?.titre || "Assessment result",
          score,
          dateLabel: item.date_passage
            ? dateFormatter.format(new Date(item.date_passage))
            : "Recently completed",
          timeSpent: duration || 1,
          difficulty: inferDifficulty(
            item.test?.titre || "",
            item.test?.type_test || "",
            duration || 15,
          ),
          passed: score >= 50,
          visible: Boolean(item.est_visible),
          primarySkill: inferPrimarySkill(item),
        };
      })
      .sort((a, b) => {
        const first = a.date_passage ? new Date(a.date_passage).getTime() : 0;
        const second = b.date_passage ? new Date(b.date_passage).getTime() : 0;
        return second - first;
      });
  }, [dateFormatter, resultats]);

  const filteredTests = useMemo(() => {
    const base = tests.filter((test) => {
      if (activeFilter === "recommended") return test.recommended;
      if (activeFilter === "easy") return test.difficulty === "Easy";
      if (activeFilter === "short") return test.duration <= 20;
      if (activeFilter === "accessible") return test.accessible;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortKey === "duration") return a.duration - b.duration;
      if (sortKey === "difficulty") {
        return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
      }

      const scoreA = Number(a.recommended) * 20 + Number(!a.deja_passe) * 10;
      const scoreB = Number(b.recommended) * 20 + Number(!b.deja_passe) * 10;
      return scoreB - scoreA;
    });
  }, [activeFilter, sortKey, tests]);

  const radarData = radarMetrics(results);
  const strengths = strongestAndWeakest(radarData);
  const visibleResults = showAllResults ? results : results.slice(0, 3);
  const globalScore =
    results.length > 0
      ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length)
      : 82;
  const weeklyProgress = results.length > 0 ? Math.max(12, results.length * 4) : 12;
  const badgesEarned = results.length > 0 ? Math.max(3, Math.round(globalScore / 30)) : 3;
  const testsCompleted = results.length > 0 ? results.length : 12;
  const recommendedTests = tests.filter((item) => !item.deja_passe).slice(0, 3);
  const aiSuggestion =
    tests.find((item) => !item.deja_passe && item.primarySkill === strengths.low.label) ||
    recommendedTests[0] ||
    null;

  const themeStyle = {
    fontSize: `${fontScale}rem`,
  } as CSSProperties;

  const commencerTest = async (idTest: string) => {
    try {
      setErreur(null);
      setMessage(null);
      setTestDemarrageId(idTest);

      const response = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/tests/${idTest}/commencer`),
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to start the test.");
      }

      const donnees = data?.donnees;
      if (!donnees?.id_test) {
        throw new Error("Unable to start the test.");
      }

      setTestEnCours({
        id_test: donnees.id_test,
        titre: donnees.titre || "",
        description: donnees.description || "",
        duree_minutes: Number(donnees.duree_minutes || 0),
        instructions: donnees.instructions || "",
        questions: Array.isArray(donnees.questions) ? donnees.questions : [],
      });
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to start the test.");
    } finally {
      setTestDemarrageId(null);
    }
  };

  const toggleVisibilite = async (id: string, actuel?: boolean) => {
    if (!RESULTAT_UUID_REGEX.test(id)) {
      setErreur(t("assessments.candidate.updateVisibilityError"));
      return;
    }

    try {
      setMessage(null);
      setErreur(null);
      setVisibiliteResultatId(id);

      const res = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${id}/visibilite`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ est_visible: !actuel }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || t("assessments.candidate.updateVisibilityError"));
      }

      setResultats((current) =>
        current.map((item) =>
          item.id_resultat === id ? { ...item, est_visible: !actuel } : item,
        ),
      );
      setMessage("Result visibility updated.");
    } catch (error: unknown) {
      setErreur(
        error instanceof Error ? error.message : t("assessments.candidate.updateVisibilityError"),
      );
    } finally {
      setVisibiliteResultatId(null);
    }
  };

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("assessments.candidate.loadingTitle")}
          description={t("assessments.candidate.loadingDescription")}
        />
      </main>
    );
  }

  if (testEnCours) {
    return (
      <PassageTest
        test={testEnCours}
        onTerminer={() => {
          setTestEnCours(null);
          setMessage("Test completed successfully.");
          void charger();
        }}
        onAnnuler={() => {
          setTestEnCours(null);
        }}
      />
    );
  }

  return (
    <div
      className="assess-dashboard"
      data-contrast={highContrast ? "high" : "default"}
      data-motion={reducedMotion ? "reduced" : "default"}
      style={themeStyle}
    >
      <div className="assess-dashboard__frame">
        <section className="assess-dashboard__hero card-base">
          <div className="assess-dashboard__hero-left">
            <span className="assess-dashboard__eyebrow">ASSESSMENTS</span>
            <h1>
              Track your progress, unlock your potential{" "}
              <span aria-hidden="true">&#10024;</span>
            </h1>
            <p>
              Complete tests, discover your strengths, and grow every day.
            </p>
          </div>

          <div className="assess-dashboard__hero-right">
            <div className="assess-dashboard__top-actions">
              <button
                type="button"
                className="assess-dashboard__accessibility"
                aria-label="Accessibility settings"
              >
                <AppIcon name="accessibility" size={18} />
                <span>Accessibility</span>
              </button>
              <button
                type="button"
                className="assess-dashboard__circle-action"
                aria-label="Help"
              >
                ?
              </button>
              <button
                type="button"
                className="assess-dashboard__avatar-chip"
                aria-label="Open profile"
              >
                MD
              </button>
            </div>

            <div className="assess-dashboard__quick-controls" role="group" aria-label="Accessibility quick controls">
              {[0.94, 1, 1.08].map((value, index) => (
                <button
                  key={value}
                  type="button"
                  className={`assess-dashboard__quick-button ${fontScale === value ? "is-active" : ""}`}
                  onClick={() => setFontScale(value)}
                  aria-label={
                    index === 0
                      ? "Decrease font size"
                      : index === 1
                        ? "Default font size"
                        : "Increase font size"
                  }
                  aria-pressed={fontScale === value}
                >
                  {index === 0 ? "A-" : index === 1 ? "A" : "A+"}
                </button>
              ))}
              <button
                type="button"
                className={`assess-dashboard__quick-button ${highContrast ? "is-active" : ""}`}
                onClick={() => setHighContrast((value) => !value)}
                aria-label="Toggle high contrast"
                aria-pressed={highContrast}
              >
                <AppIcon name="contrast" size={16} />
              </button>
              <button
                type="button"
                className={`assess-dashboard__quick-button ${reducedMotion ? "is-active" : ""}`}
                onClick={() => setReducedMotion((value) => !value)}
                aria-label="Toggle reduced motion"
                aria-pressed={reducedMotion}
              >
                <AppIcon name="motion" size={16} />
              </button>
            </div>

            <div className="assess-dashboard__hero-visual">
              <div className="assess-dashboard__hero-bubble assess-dashboard__hero-bubble--left" />
              <div className="assess-dashboard__hero-bubble assess-dashboard__hero-bubble--right" />
              <Image
                src="/uploads/handi.png"
                alt=""
                width={340}
                height={340}
                priority
                className="assess-dashboard__hero-image"
              />
            </div>
          </div>

          <div className="assess-dashboard__stats">
            <HeaderStatCard
              kind="score"
              icon="target"
              title="Global Score"
              value={`${globalScore}%`}
              helper="Great job! You're above average"
              progress={globalScore}
            />
            <HeaderStatCard
              kind="plain"
              icon="trend"
              title="Progress this week"
              value={`+${weeklyProgress}%`}
              helper="Keep it up!"
            />
            <HeaderStatCard
              kind="plain"
              icon="badge"
              title="Badges earned"
              value={`${badgesEarned}`}
              helper="View all"
            />
            <HeaderStatCard
              kind="plain"
              icon="calendar"
              title="Tests completed"
              value={`${testsCompleted}`}
              helper="See history"
            />
          </div>
        </section>

        {erreur ? <div className="assess-dashboard__message is-error">{erreur}</div> : null}
        {message ? <div className="assess-dashboard__message is-info">{message}</div> : null}

        <div className="assess-dashboard__layout">
          <main className="assess-dashboard__main">
            <section className="card-base assess-dashboard__section">
              <div className="assess-dashboard__section-top">
                <div className="assess-dashboard__section-title">
                  <h2>Available tests</h2>
                  <span>{filteredTests.length}</span>
                </div>

                <div className="assess-dashboard__toolbar">
                  <label className="assess-dashboard__sort">
                    <span>Sort by:</span>
                    <select
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as SortKey)}
                      aria-label="Sort available tests"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="assess-dashboard__tool-button"
                    onClick={() => void charger()}
                    aria-label="Refresh tests"
                  >
                    <AppIcon name="filter" size={18} />
                  </button>
                </div>
              </div>

              <div className="assess-dashboard__filters" role="tablist" aria-label="Assessment filters">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`assess-dashboard__filter ${activeFilter === filter.key ? "is-active" : ""}`}
                    onClick={() => setActiveFilter(filter.key)}
                    aria-pressed={activeFilter === filter.key}
                  >
                    {filter.label}
                    {filter.key === "accessible" ? " ♿" : ""}
                  </button>
                ))}
              </div>

              {filteredTests.length === 0 ? (
                <div className="assess-dashboard__empty">
                  <strong>No tests match this filter right now.</strong>
                  <p>Try another filter or refresh your dashboard.</p>
                </div>
              ) : (
                <div className="assess-dashboard__test-list">
                  {filteredTests.map((test) => (
                    <AssessmentCard
                      key={test.id_test}
                      test={test}
                      starting={testDemarrageId === test.id_test}
                      onStart={() => void commencerTest(test.id_test)}
                    />
                  ))}
                </div>
              )}

              <div className="assess-dashboard__request-line">
                <span>Can&apos;t find what you need?</span>
                <button type="button" className="assess-dashboard__text-link">
                  Send us a request
                </button>
              </div>
            </section>

            <section className="card-base assess-dashboard__section">
              <div className="assess-dashboard__section-top">
                <div>
                  <h2>Recommended for you</h2>
                  <p>Based on your results and goals</p>
                </div>
                <button type="button" className="assess-dashboard__text-link">
                  View all recommendations
                </button>
              </div>

              <div className="assess-dashboard__recommendations">
                {recommendedTests.length > 0 ? (
                  recommendedTests.map((test) => (
                    <article key={`${test.id_test}-rec`} className="assess-dashboard__mini-card">
                      <div className="assess-dashboard__mini-icon">
                        <AppIcon name={test.icon} size={20} />
                      </div>
                      <div className="assess-dashboard__mini-content">
                        <strong>{test.titre}</strong>
                        <div className="assess-dashboard__mini-meta">
                          <span className={`assess-dashboard__pill is-${test.difficulty.toLowerCase()}`}>
                            {test.difficulty}
                          </span>
                          <span className="assess-dashboard__soft-pill">
                            <AppIcon name="clock" size={14} />
                            {test.duration} min
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="assess-dashboard__empty">
                    <strong>Everything recommended is already completed.</strong>
                    <p>Come back after your next assessment to unlock fresh suggestions.</p>
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="assess-dashboard__side">
            <section className="card-base assess-dashboard__section">
              <div className="assess-dashboard__section-top">
                <h2>Your results</h2>
                <button type="button" className="assess-dashboard__text-link">
                  View all history
                </button>
              </div>

              {visibleResults.length === 0 ? (
                <div className="assess-dashboard__empty">
                  <strong>No results yet.</strong>
                  <p>Take your first test to unlock your progress dashboard.</p>
                </div>
              ) : (
                <div className="assess-dashboard__result-list">
                  {visibleResults.map((result) => (
                    <ResultCard
                      key={result.id_resultat}
                      result={result}
                      isUpdating={visibiliteResultatId === result.id_resultat}
                      onToggleVisibility={() =>
                        void toggleVisibilite(result.id_resultat, result.visible)
                      }
                    />
                  ))}
                </div>
              )}

              {results.length > 3 ? (
                <button
                  type="button"
                  className="assess-dashboard__show-more"
                  onClick={() => setShowAllResults((value) => !value)}
                >
                  {showAllResults ? "Show fewer results" : "Show more results"}
                </button>
              ) : null}
            </section>

            <section className="card-base assess-dashboard__section">
              <div className="assess-dashboard__dual-head">
                <h2>Your strengths</h2>
                <h3>Skills Radar</h3>
              </div>

              <div className="assess-dashboard__insights">
                <div className="assess-dashboard__strengths">
                  <StrengthCard
                    icon="star"
                    tone="top"
                    title="Top skill"
                    skill={strengths.top.label}
                    text="Your strongest area"
                  />
                  <StrengthCard
                    icon="trend"
                    tone="low"
                    title="Needs improvement"
                    skill={strengths.low.label}
                    text="Keep practicing"
                  />
                </div>

                <RadarChart data={radarData} />
              </div>

              <div className="assess-dashboard__section-footer">
                <button type="button" className="assess-dashboard__secondary-button">
                  View detailed analytics
                </button>
              </div>
            </section>

            <section className="card-base assess-dashboard__section">
              <div className="assess-dashboard__section-top">
                <div className="assess-dashboard__coach-title">
                  <AppIcon name="robot" size={18} />
                  <h2>AI Coach</h2>
                  <span className="assess-dashboard__beta">BETA</span>
                </div>
              </div>

              <p className="assess-dashboard__coach-subtitle">
                Get personalized tips to improve your skills.
              </p>

              <div className="assess-dashboard__coach-card">
                <div className="assess-dashboard__coach-avatar">
                  <AppIcon name="robot" size={20} />
                </div>
                <div className="assess-dashboard__coach-copy">
                  <strong>
                    {aiSuggestion
                      ? `Based on your results, you could improve your ${strengths.low.label.toLowerCase()} skills.`
                      : "Complete a test to unlock your first AI recommendation."}
                  </strong>
                  <p>
                    {aiSuggestion
                      ? `We recommend the "${aiSuggestion.titre}" test to strengthen your profile and highlight your potential.`
                      : "Your AI Coach will suggest the next best test once you have at least one result."}
                  </p>
                </div>
              </div>

              <div className="assess-dashboard__section-footer is-right">
                <button type="button" className="assess-dashboard__primary-button">
                  Ask AI Coach
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .assess-dashboard {
          --bg: #f8f6fb;
          --text: #15112b;
          --muted: #6c6686;
          --purple: #6d2a95;
          --purple-strong: #53206c;
          --lavender: #f1e8ff;
          --border: rgba(109, 42, 149, 0.12);
          --shadow: 0 18px 45px rgba(109, 42, 149, 0.08);
          --shadow-lift: 0 24px 55px rgba(109, 42, 149, 0.14);
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(174, 142, 255, 0.2), transparent 22%),
            linear-gradient(180deg, #fcfbfe 0%, var(--bg) 100%);
          color: var(--text);
        }

        .assess-dashboard[data-contrast="high"] {
          --text: #09060f;
          --muted: #383347;
          --border: rgba(9, 6, 15, 0.18);
          --shadow: none;
          --shadow-lift: none;
        }

        .assess-dashboard[data-motion="reduced"] * {
          animation: none !important;
          transition: none !important;
        }

        .assess-dashboard__frame {
          max-width: 1360px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .card-base {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid var(--border);
          border-radius: 26px;
          box-shadow: var(--shadow);
        }

        .assess-dashboard__hero {
          position: relative;
          overflow: hidden;
          padding: 28px;
          background:
            radial-gradient(circle at 75% 18%, rgba(185, 148, 255, 0.24), transparent 18%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 232, 255, 0.92));
        }

        .assess-dashboard__hero-left {
          max-width: 680px;
        }

        .assess-dashboard__eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          color: var(--purple);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .assess-dashboard__hero-left h1 {
          margin: 0;
          font-size: clamp(2.25rem, 3vw, 3.45rem);
          line-height: 1.06;
        }

        .assess-dashboard__hero-left p {
          margin: 14px 0 0;
          color: var(--muted);
          font-size: 1.08rem;
          line-height: 1.6;
        }

        .assess-dashboard__hero-right {
          position: absolute;
          right: 28px;
          top: 24px;
          width: 420px;
          display: grid;
          gap: 16px;
          justify-items: end;
        }

        .assess-dashboard__top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assess-dashboard__accessibility,
        .assess-dashboard__circle-action,
        .assess-dashboard__avatar-chip,
        .assess-dashboard__quick-button,
        .assess-dashboard__tool-button,
        .assess-dashboard__filter,
        .assess-dashboard__text-link,
        .assess-dashboard__show-more,
        .assess-dashboard__primary-button,
        .assess-dashboard__secondary-button,
        .assess-dashboard__test-button,
        .assess-dashboard__result-button,
        .assess-dashboard__visibility-button,
        .assess-dashboard__sort select {
          font: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .assess-dashboard__accessibility {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 999px;
          padding: 12px 18px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--text);
          font-weight: 700;
        }

        .assess-dashboard__circle-action,
        .assess-dashboard__avatar-chip {
          width: 44px;
          height: 44px;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--purple);
          font-weight: 700;
        }

        .assess-dashboard__avatar-chip {
          border-radius: 999px;
        }

        .assess-dashboard__quick-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.95);
          padding: 8px;
          border-radius: 999px;
        }

        .assess-dashboard__quick-button {
          width: 40px;
          height: 40px;
          border: 1px solid transparent;
          border-radius: 999px;
          background: transparent;
          color: var(--text);
          display: grid;
          place-items: center;
          font-weight: 700;
        }

        .assess-dashboard__quick-button.is-active {
          background: linear-gradient(135deg, #5f2cc0, #ab8df6);
          color: #fff;
          box-shadow: var(--shadow-lift);
        }

        .assess-dashboard__hero-visual {
          position: relative;
          width: 340px;
          height: 220px;
          display: grid;
          place-items: center;
        }

        .assess-dashboard__hero-image {
          width: 320px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 22px 45px rgba(109, 42, 149, 0.16));
        }

        .assess-dashboard__hero-bubble {
          position: absolute;
          border-radius: 20px;
          background: rgba(171, 141, 246, 0.18);
        }

        .assess-dashboard__hero-bubble--left {
          width: 44px;
          height: 44px;
          left: 18px;
          top: 18px;
        }

        .assess-dashboard__hero-bubble--right {
          width: 56px;
          height: 56px;
          right: 18px;
          bottom: 16px;
        }

        .assess-dashboard__stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
          padding-right: 380px;
        }

        .assess-dashboard__message {
          border-radius: 18px;
          padding: 14px 18px;
          border: 1px solid var(--border);
          font-weight: 600;
        }

        .assess-dashboard__message.is-error {
          background: rgba(255, 237, 242, 0.96);
          color: #9e3040;
        }

        .assess-dashboard__message.is-info {
          background: rgba(238, 244, 255, 0.96);
          color: #31539a;
        }

        .assess-dashboard__layout {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(390px, 0.95fr);
          gap: 18px;
          align-items: start;
        }

        .assess-dashboard__main,
        .assess-dashboard__side {
          display: grid;
          gap: 18px;
        }

        .assess-dashboard__section {
          padding: 22px;
        }

        .assess-dashboard__section-top,
        .assess-dashboard__dual-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .assess-dashboard__section-top h2,
        .assess-dashboard__dual-head h2,
        .assess-dashboard__dual-head h3,
        .assess-dashboard__coach-title h2 {
          margin: 0;
          font-size: 1.28rem;
        }

        .assess-dashboard__section-top p,
        .assess-dashboard__coach-subtitle {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 0.92rem;
        }

        .assess-dashboard__section-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assess-dashboard__section-title span {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: var(--lavender);
          color: var(--purple);
          display: grid;
          place-items: center;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .assess-dashboard__toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assess-dashboard__sort {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 0.92rem;
          font-weight: 600;
        }

        .assess-dashboard__sort select {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 14px;
          padding: 10px 14px;
          color: var(--text);
        }

        .assess-dashboard__tool-button {
          width: 42px;
          height: 42px;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 14px;
          color: var(--purple);
          display: grid;
          place-items: center;
        }

        .assess-dashboard__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .assess-dashboard__filter {
          border: 1px solid var(--border);
          background: #fff;
          color: var(--text);
          border-radius: 999px;
          padding: 10px 16px;
          font-weight: 700;
        }

        .assess-dashboard__filter.is-active {
          background: linear-gradient(135deg, #5f2cc0, #ab8df6);
          color: #fff;
          border-color: transparent;
          box-shadow: var(--shadow-lift);
        }

        .assess-dashboard__test-list,
        .assess-dashboard__result-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .assess-dashboard__request-line {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          color: var(--muted);
          font-size: 0.86rem;
        }

        .assess-dashboard__text-link {
          border: 0;
          background: transparent;
          color: var(--purple);
          font-weight: 700;
          padding: 0;
        }

        .assess-dashboard__recommendations {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .assess-dashboard__mini-card {
          border-radius: 20px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          background: #fff;
          box-shadow: 0 10px 24px rgba(109, 42, 149, 0.05);
        }

        .assess-dashboard__mini-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.1), rgba(171, 141, 246, 0.25));
          color: var(--purple);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .assess-dashboard__mini-content {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .assess-dashboard__mini-content strong {
          display: block;
          font-size: 0.95rem;
        }

        .assess-dashboard__mini-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .assess-dashboard__pill,
        .assess-dashboard__soft-pill,
        .assess-dashboard__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .assess-dashboard__pill {
          background: #f4edff;
          color: var(--purple);
        }

        .assess-dashboard__pill.is-easy {
          background: #eaf9ef;
          color: #158357;
        }

        .assess-dashboard__pill.is-medium {
          background: #f4edff;
          color: var(--purple);
        }

        .assess-dashboard__pill.is-hard {
          background: #fff0f1;
          color: #be4357;
        }

        .assess-dashboard__soft-pill {
          background: #f8f5ff;
          color: #72698e;
        }

        .assess-dashboard__empty {
          border: 1px dashed var(--border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.84);
          padding: 18px;
          display: grid;
          gap: 8px;
          margin-top: 18px;
        }

        .assess-dashboard__empty p {
          margin: 0;
          color: var(--muted);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .assess-dashboard__show-more {
          margin: 14px auto 0;
          display: block;
          border: 0;
          background: transparent;
          color: var(--purple);
          font-weight: 700;
        }

        .assess-dashboard__dual-head {
          margin-bottom: 16px;
        }

        .assess-dashboard__insights {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(220px, 1fr);
          gap: 18px;
          align-items: center;
        }

        .assess-dashboard__strengths {
          display: grid;
          gap: 12px;
        }

        .assess-dashboard__section-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 14px;
        }

        .assess-dashboard__section-footer.is-right {
          justify-content: flex-end;
        }

        .assess-dashboard__secondary-button,
        .assess-dashboard__primary-button {
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 700;
        }

        .assess-dashboard__secondary-button {
          border: 1px solid var(--border);
          background: #fff;
          color: var(--purple);
        }

        .assess-dashboard__primary-button {
          border: 1px solid transparent;
          background: linear-gradient(135deg, #5f2cc0, #ab8df6);
          color: #fff;
          box-shadow: var(--shadow-lift);
        }

        .assess-dashboard__coach-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .assess-dashboard__beta {
          border-radius: 999px;
          background: var(--lavender);
          color: var(--purple);
          padding: 5px 8px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .assess-dashboard__coach-subtitle {
          margin-top: 6px;
        }

        .assess-dashboard__coach-card {
          margin-top: 16px;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          gap: 14px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.05), rgba(171, 141, 246, 0.12));
          box-shadow: 0 10px 24px rgba(109, 42, 149, 0.05);
        }

        .assess-dashboard__coach-avatar {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          background: #fff;
          color: var(--purple);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .assess-dashboard__coach-copy {
          display: grid;
          gap: 6px;
        }

        .assess-dashboard__coach-copy strong {
          display: block;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .assess-dashboard__coach-copy p {
          margin: 0;
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .assess-dashboard :global(button),
        .assess-dashboard :global(select) {
          cursor: pointer;
        }

        .assess-dashboard :global(button:focus-visible),
        .assess-dashboard :global(select:focus-visible) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(109, 42, 149, 0.24), 0 0 0 5px rgba(109, 42, 149, 0.08);
        }

        .assess-dashboard__accessibility:hover,
        .assess-dashboard__circle-action:hover,
        .assess-dashboard__avatar-chip:hover,
        .assess-dashboard__quick-button:hover,
        .assess-dashboard__tool-button:hover,
        .assess-dashboard__filter:hover,
        .assess-dashboard__secondary-button:hover,
        .assess-dashboard__primary-button:hover,
        .assess-dashboard__test-button:hover,
        .assess-dashboard__result-button:hover,
        .assess-dashboard__visibility-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-lift);
        }

        @media (max-width: 1320px) {
          .assess-dashboard__hero-right {
            position: static;
            width: 100%;
            justify-items: start;
            margin-top: 18px;
          }

          .assess-dashboard__hero-visual {
            width: 320px;
            height: 220px;
          }

          .assess-dashboard__stats {
            padding-right: 0;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1180px) {
          .assess-dashboard__layout {
            grid-template-columns: 1fr;
          }

          .assess-dashboard__recommendations {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .assess-dashboard__test-list,
          .assess-dashboard__result-list {
            gap: 12px;
          }

          .assess-dashboard__insights {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .assess-dashboard {
            padding: 12px;
          }

          .assess-dashboard__hero,
          .assess-dashboard__section {
            padding: 16px;
          }

          .assess-dashboard__stats {
            grid-template-columns: 1fr;
          }

          .assess-dashboard__section-top,
          .assess-dashboard__dual-head {
            flex-direction: column;
            align-items: stretch;
          }

          .assess-dashboard__toolbar,
          .assess-dashboard__quick-controls,
          .assess-dashboard__top-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}

function HeaderStatCard({
  kind,
  icon,
  title,
  value,
  helper,
  progress,
}: {
  kind: "score" | "plain";
  icon: IconName;
  title: string;
  value: string;
  helper: string;
  progress?: number;
}) {
  if (kind === "score") {
    const ringStyle = {
      ["--ring-value" as string]: `${clampPercent(progress || 0)}`,
      ["--ring-color" as string]: "#7a35c5",
    } as CSSProperties;

    return (
      <article className="header-stat">
        <div className="header-stat__ring" style={ringStyle}>
          <span>{value}</span>
        </div>
        <div className="header-stat__copy">
          <strong>{title}</strong>
          <small>{helper}</small>
        </div>
        <style jsx>{`
          .header-stat {
            background: #fff;
            border: 1px solid rgba(109, 42, 149, 0.12);
            border-radius: 22px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 16px;
            min-height: 102px;
            box-shadow: 0 10px 28px rgba(109, 42, 149, 0.06);
          }

          .header-stat__ring {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: conic-gradient(var(--ring-color) calc(var(--ring-value) * 1%), #efe8fb 0);
            display: grid;
            place-items: center;
            position: relative;
            flex-shrink: 0;
          }

          .header-stat__ring::before {
            content: "";
            position: absolute;
            inset: 9px;
            border-radius: 50%;
            background: #fff;
          }

          .header-stat__ring span {
            position: relative;
            z-index: 1;
            font-size: 1.2rem;
            font-weight: 800;
            color: #6d2a95;
          }

          .header-stat__copy {
            display: grid;
            gap: 4px;
          }

          .header-stat__copy strong {
            font-size: 1.05rem;
          }

          .header-stat__copy small {
            color: #6c6686;
            font-size: 0.88rem;
            line-height: 1.45;
          }
        `}</style>
      </article>
    );
  }

  return (
    <article className="header-stat">
      <div className="header-stat__icon">
        <AppIcon name={icon} size={22} />
      </div>
      <div className="header-stat__copy">
        <strong>{value}</strong>
        <span>{title}</span>
        <small>{helper}</small>
      </div>
      <style jsx>{`
        .header-stat {
          background: #fff;
          border: 1px solid rgba(109, 42, 149, 0.12);
          border-radius: 22px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 102px;
          box-shadow: 0 10px 28px rgba(109, 42, 149, 0.06);
        }

        .header-stat__icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.1), rgba(171, 141, 246, 0.25));
          color: #6d2a95;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .header-stat__copy {
          display: grid;
          gap: 4px;
        }

        .header-stat__copy strong {
          font-size: 1.5rem;
          line-height: 1;
        }

        .header-stat__copy span {
          font-weight: 700;
        }

        .header-stat__copy small {
          color: #6c6686;
          font-size: 0.88rem;
        }
      `}</style>
    </article>
  );
}

function AssessmentCard({
  test,
  starting,
  onStart,
}: {
  test: EnhancedTest;
  starting: boolean;
  onStart: () => void;
}) {
  return (
    <article className="assessment-card">
      <div className="assessment-card__icon">
        <AppIcon name={test.icon} size={28} />
      </div>

      <div className="assessment-card__main">
        <div className="assessment-card__head">
          <h3>{test.titre}</h3>
          <span className={`assessment-card__pill is-${test.difficulty.toLowerCase()}`}>
            {test.difficulty}
          </span>
          <span className="assessment-card__soft-pill">
            <AppIcon name="clock" size={14} />
            {test.duration} min
          </span>
        </div>
        <p>{test.summary}</p>
        <div className="assessment-card__footer-row">
          <span className="assessment-card__soft-pill">
            <AppIcon name="accessibility" size={14} />
            {test.accessibilityLabel}
          </span>
        </div>
      </div>

      <div className="assessment-card__learn">
        <small>You&apos;ll learn</small>
        <div className="assessment-card__tags">
          {test.learnTags.map((tag) => (
            <span key={`${test.id_test}-${tag}`} className="assessment-card__soft-pill">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="assessment-card__action">
        {test.peut_passer === false ? (
          <span className="assessment-card__status is-private">Unavailable</span>
        ) : test.deja_passe ? (
          <span className="assessment-card__status is-visible">Completed</span>
        ) : (
          <button
            type="button"
            className="assessment-card__button"
            onClick={onStart}
            disabled={starting}
            aria-label={`Start ${test.titre}`}
          >
            {starting ? "Starting..." : "Start test ->"}
          </button>
        )}
      </div>

      <style jsx>{`
        .assessment-card {
          border: 1px solid rgba(109, 42, 149, 0.12);
          background: #fff;
          border-radius: 22px;
          padding: 16px 18px;
          display: grid;
          grid-template-columns: 68px minmax(0, 1.45fr) minmax(180px, 0.88fr) 138px;
          gap: 18px;
          align-items: center;
          box-shadow: 0 10px 24px rgba(109, 42, 149, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .assessment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 55px rgba(109, 42, 149, 0.14);
        }

        .assessment-card__icon {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.1), rgba(171, 141, 246, 0.25));
          color: #6d2a95;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .assessment-card__main {
          display: grid;
          gap: 9px;
          min-width: 0;
        }

        .assessment-card__head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .assessment-card__head h3 {
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.3;
        }

        .assessment-card__main p {
          margin: 0;
          color: #6c6686;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .assessment-card__learn {
          border-left: 1px solid rgba(109, 42, 149, 0.1);
          padding-left: 14px;
          display: grid;
          gap: 9px;
          align-content: center;
          min-height: 86px;
        }

        .assessment-card__learn small {
          color: #6c6686;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .assessment-card__tags,
        .assessment-card__footer-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .assessment-card__pill,
        .assessment-card__soft-pill,
        .assessment-card__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .assessment-card__pill {
          background: #f4edff;
          color: #6d2a95;
        }

        .assessment-card__pill.is-easy {
          background: #eaf9ef;
          color: #158357;
        }

        .assessment-card__pill.is-medium {
          background: #f4edff;
          color: #6d2a95;
        }

        .assessment-card__pill.is-hard {
          background: #fff0f1;
          color: #be4357;
        }

        .assessment-card__soft-pill {
          background: #f8f5ff;
          color: #72698e;
        }

        .assessment-card__status.is-visible {
          background: #eef4ff;
          color: #31539a;
        }

        .assessment-card__status.is-private {
          background: #f5efff;
          color: #6d2a95;
        }

        .assessment-card__action {
          display: grid;
          justify-items: stretch;
        }

        .assessment-card__button {
          border: 1px solid transparent;
          border-radius: 16px;
          background: linear-gradient(135deg, #5f2cc0, #ab8df6);
          color: #fff;
          padding: 12px 16px;
          font-weight: 800;
          box-shadow: 0 24px 55px rgba(109, 42, 149, 0.14);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .assessment-card__button:hover {
          transform: translateY(-1px);
        }

        .assessment-card__button[disabled] {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        @media (max-width: 980px) {
          .assessment-card {
            grid-template-columns: 68px 1fr;
          }

          .assessment-card__learn,
          .assessment-card__action {
            grid-column: 1 / -1;
          }

          .assessment-card__learn {
            border-left: 0;
            padding-left: 0;
            min-height: 0;
          }
        }
      `}</style>
    </article>
  );
}

function ResultCard({
  result,
  isUpdating,
  onToggleVisibility,
}: {
  result: EnhancedResult;
  isUpdating: boolean;
  onToggleVisibility: () => void;
}) {
  const ringStyle = {
    ["--ring-value" as string]: `${result.score}`,
    ["--ring-color" as string]:
      result.score >= 80 ? "#7a35c5" : result.score >= 50 ? "#28a36b" : "#f59d0b",
  } as CSSProperties;

  return (
    <article className="result-card">
      <div className="result-card__ring" style={ringStyle}>
        <span>{result.score}%</span>
      </div>

      <div className="result-card__main">
        <div className="result-card__top">
          <div>
            <h3>{result.title}</h3>
            <small>{result.dateLabel}</small>
          </div>
          <span className={`result-card__status ${result.passed ? "is-passed" : "is-private"}`}>
            {result.passed ? "Passed" : "Private"}
          </span>
        </div>

        <div className="result-card__meta">
          <span className="result-card__soft-pill">
            <AppIcon name="clock" size={14} />
            {result.timeSpent} min
          </span>
          <span className={`result-card__pill is-${result.difficulty.toLowerCase()}`}>
            {result.difficulty}
          </span>
          <span className={`result-card__status ${result.visible ? "is-visible" : "is-private"}`}>
            {result.visible ? "Visible" : "Private"}
          </span>
        </div>
      </div>

      <div className="result-card__actions">
        <button type="button" className="result-card__button">
          View details
        </button>
        {result.peut_modifier_visibilite !== false ? (
          <button
            type="button"
            className="result-card__button result-card__button--primary"
            onClick={onToggleVisibility}
            disabled={isUpdating}
          >
            {isUpdating
              ? "Updating..."
              : result.visible
                ? "Hide from recruiters"
                : "Show to recruiters"}
          </button>
        ) : null}
      </div>

      <style jsx>{`
        .result-card {
          border: 1px solid rgba(109, 42, 149, 0.12);
          background: #fff;
          border-radius: 22px;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 82px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          box-shadow: 0 10px 24px rgba(109, 42, 149, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .result-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 55px rgba(109, 42, 149, 0.14);
        }

        .result-card__ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: conic-gradient(var(--ring-color) calc(var(--ring-value) * 1%), #efe8fb 0);
          display: grid;
          place-items: center;
          position: relative;
          flex-shrink: 0;
        }

        .result-card__ring::before {
          content: "";
          position: absolute;
          inset: 9px;
          border-radius: 50%;
          background: #fff;
        }

        .result-card__ring span {
          position: relative;
          z-index: 1;
          font-size: 1.1rem;
          font-weight: 800;
          color: #6d2a95;
        }

        .result-card__main {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .result-card__top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .result-card__top h3 {
          margin: 0;
          font-size: 1.02rem;
        }

        .result-card__top small {
          color: #6c6686;
        }

        .result-card__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .result-card__pill,
        .result-card__soft-pill,
        .result-card__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .result-card__pill {
          background: #f4edff;
          color: #6d2a95;
        }

        .result-card__pill.is-easy {
          background: #eaf9ef;
          color: #158357;
        }

        .result-card__pill.is-medium {
          background: #f4edff;
          color: #6d2a95;
        }

        .result-card__pill.is-hard {
          background: #fff0f1;
          color: #be4357;
        }

        .result-card__soft-pill {
          background: #f8f5ff;
          color: #72698e;
        }

        .result-card__status.is-passed {
          background: #eaf9ef;
          color: #158357;
        }

        .result-card__status.is-visible {
          background: #eef4ff;
          color: #31539a;
        }

        .result-card__status.is-private {
          background: #f5efff;
          color: #6d2a95;
        }

        .result-card__actions {
          display: grid;
          gap: 8px;
          justify-items: end;
        }

        .result-card__button {
          border: 1px solid rgba(109, 42, 149, 0.12);
          background: #fff;
          color: #6d2a95;
          border-radius: 14px;
          padding: 8px 12px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .result-card__button--primary {
          border-color: transparent;
          background: linear-gradient(135deg, #5f2cc0, #ab8df6);
          color: #fff;
          box-shadow: 0 24px 55px rgba(109, 42, 149, 0.14);
        }

        .result-card__button:hover {
          transform: translateY(-1px);
        }

        .result-card__button[disabled] {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        @media (max-width: 980px) {
          .result-card {
            grid-template-columns: 1fr;
          }

          .result-card__actions {
            justify-items: stretch;
          }
        }
      `}</style>
    </article>
  );
}

function StrengthCard({
  icon,
  tone,
  title,
  skill,
  text,
}: {
  icon: IconName;
  tone: "top" | "low";
  title: string;
  skill: string;
  text: string;
}) {
  return (
    <article className={`strength-card ${tone === "top" ? "is-top" : "is-low"}`}>
      <div className="strength-card__icon">
        <AppIcon name={icon} size={18} />
      </div>
      <div className="strength-card__copy">
        <small>{title}</small>
        <strong>{skill}</strong>
        <p>{text}</p>
      </div>
      <style jsx>{`
        .strength-card {
          border: 1px solid rgba(109, 42, 149, 0.12);
          border-radius: 20px;
          padding: 14px;
          display: flex;
          gap: 12px;
          align-items: start;
          box-shadow: 0 10px 24px rgba(109, 42, 149, 0.05);
        }

        .strength-card.is-top {
          background: #f8f2ff;
        }

        .strength-card.is-low {
          background: #fff2f3;
        }

        .strength-card__icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #fff;
          color: #6d2a95;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .strength-card__copy small {
          display: block;
          color: #6c6686;
          margin-bottom: 4px;
        }

        .strength-card__copy strong {
          display: block;
          margin-bottom: 4px;
        }

        .strength-card__copy p {
          margin: 0;
          color: #6c6686;
          font-size: 0.86rem;
        }
      `}</style>
    </article>
  );
}

function RadarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const points = radarPoints(data.map((item) => item.value));

  return (
    <div className="radar-card">
      <svg viewBox="0 0 240 220" role="img" aria-label="Skills radar chart">
        <g fill="none" stroke="rgba(109, 42, 149, 0.14)">
          <polygon points="120,34 190,74 190,146 120,186 50,146 50,74" />
          <polygon points="120,54 174,84 174,136 120,166 66,136 66,84" />
          <polygon points="120,74 158,94 158,126 120,146 82,126 82,94" />
        </g>
        <g stroke="rgba(109, 42, 149, 0.16)">
          <line x1="120" y1="34" x2="120" y2="186" />
          <line x1="50" y1="74" x2="190" y2="146" />
          <line x1="50" y1="146" x2="190" y2="74" />
        </g>
        <polygon
          points={points}
          fill="rgba(109, 42, 149, 0.2)"
          stroke="#6d2a95"
          strokeWidth="2.2"
        />
        {data.map((item, index) => {
          const position = radarLabelPosition(index, data.length);
          return (
            <text
              key={item.label}
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#5e5678"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
      <style jsx>{`
        .radar-card {
          min-height: 220px;
          display: grid;
          place-items: center;
        }
      `}</style>
    </div>
  );
}
