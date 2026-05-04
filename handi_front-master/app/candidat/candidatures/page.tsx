"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, type SVGProps } from "react";
import { useI18n } from "@/components/i18n-provider";
import { RouteProtegee } from "@/components/route-protegee";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type CandidatureStatut = "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";
type CandidatureUiStatut = "in_progress" | "shortlist" | "accepted" | "rejected";
type FiltreStatut = "all" | CandidatureUiStatut;

type Candidature = {
  id: string;
  offre: {
    id?: string;
    titre: string;
    localisation: string;
    type_poste: string;
  };
  entreprise: {
    nom: string;
  };
  date_postulation: string;
  statut: CandidatureStatut;
  uiStatut: CandidatureUiStatut;
  score_test?: number;
};

type CandidatureApiSource = {
  id?: string;
  date_postulation?: string;
  statut?: string;
  score_test?: number | null;
};

type CandidatureApiItem = CandidatureApiSource & {
  candidature?: CandidatureApiSource;
  offre?: {
    id?: string;
    titre?: string;
    localisation?: string;
    type_poste?: string;
  };
  entreprise?: {
    nom?: string;
  };
};

type CandidaturesPayload = {
  message?: string;
  donnees?: CandidatureApiItem[];
};

type NotificationItem = {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
};

type NotificationsPayload = {
  message?: string;
  donnees?: NotificationItem[];
};

type PageCopy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allStatuses: string;
  filtersButton: string;
  notificationsShortcut: string;
  tabs: Record<FiltreStatut, string>;
  appliedOn: string;
  viewDetails: string;
  summaryTitle: string;
  total: string;
  notificationsTitle: string;
  seeAll: string;
  noNotifications: string;
  tipsTitle: string;
  tipsText: string;
  profileCta: string;
  refresh: string;
  emptyTitle: string;
  emptyText: string;
  resetFilters: string;
  detailsTitle: string;
  close: string;
  company: string;
  location: string;
  roleType: string;
  assessmentScore: string;
  statusSummary: string;
  notAvailable: string;
  pendingSummary: string;
  shortlistedSummary: string;
  interviewSummary: string;
  acceptedSummary: string;
  rejectedSummary: string;
  loadingTitle: string;
  loadingText: string;
  errorFallback: string;
  notificationFallback: string;
};

const PAGE_SIZE = 4;

const AVATAR_GRADIENTS = [
  { from: "#c493f5", to: "#a869dd" },
  { from: "#6a33a5", to: "#4f1f83" },
  { from: "#4fcd8d", to: "#2fb96f" },
  { from: "#ff6f8d", to: "#e74a71" },
];

const STATUS_COLORS: Record<CandidatureUiStatut, { fill: string; soft: string; text: string }> = {
  in_progress: {
    fill: "#f6c65c",
    soft: "#fff2d0",
    text: "#b78000",
  },
  shortlist: {
    fill: "#9d63f8",
    soft: "#efe3ff",
    text: "#6d2ecf",
  },
  accepted: {
    fill: "#46c37a",
    soft: "#def8e7",
    text: "#1e9650",
  },
  rejected: {
    fill: "#ff6888",
    soft: "#ffe2e8",
    text: "#df345d",
  },
};

const COPY: Record<"fr" | "en" | "ar", PageCopy> = {
  fr: {
    title: "Mes candidatures",
    subtitle: "Suivez l'etat de toutes vos candidatures en un coup d'oeil",
    searchPlaceholder: "Rechercher par titre de poste ou entreprise...",
    allStatuses: "Tous les statuts",
    filtersButton: "Filtres",
    notificationsShortcut: "Notifications",
    tabs: {
      all: "Toutes",
      in_progress: "En cours",
      shortlist: "Shortlist",
      accepted: "Accepte",
      rejected: "Refuse",
    },
    appliedOn: "Postule le",
    viewDetails: "Voir details",
    summaryTitle: "Resume de mes candidatures",
    total: "Total",
    notificationsTitle: "Dernieres notifications",
    seeAll: "Voir toutes",
    noNotifications: "Aucune notification recente pour le moment.",
    tipsTitle: "Conseil",
    tipsText: "Completez votre profil a 100% pour augmenter vos chances d'etre recrute.",
    profileCta: "Voir mon profil",
    refresh: "Actualiser",
    emptyTitle: "Aucune candidature trouvee",
    emptyText: "Essayez de modifier votre recherche ou vos filtres.",
    resetFilters: "Reinitialiser les filtres",
    detailsTitle: "Details de la candidature",
    close: "Fermer",
    company: "Entreprise",
    location: "Localisation",
    roleType: "Type de poste",
    assessmentScore: "Score du test",
    statusSummary: "Etape actuelle",
    notAvailable: "Non disponible",
    pendingSummary: "Votre candidature est encore en cours d'examen.",
    shortlistedSummary: "Votre profil est passe en phase de preselection.",
    interviewSummary: "Un entretien est deja planifie pour cette offre.",
    acceptedSummary: "Votre candidature a ete acceptee.",
    rejectedSummary: "Cette candidature n'a pas ete retenue.",
    loadingTitle: "Chargement de vos candidatures",
    loadingText: "Nous preparons votre suivi de candidature.",
    errorFallback: "Impossible de charger vos candidatures.",
    notificationFallback: "Nouvelle mise a jour de candidature",
  },
  en: {
    title: "My applications",
    subtitle: "Track every application status at a glance",
    searchPlaceholder: "Search by job title or company...",
    allStatuses: "All statuses",
    filtersButton: "Filters",
    notificationsShortcut: "Notifications",
    tabs: {
      all: "All",
      in_progress: "In progress",
      shortlist: "Shortlist",
      accepted: "Accepted",
      rejected: "Rejected",
    },
    appliedOn: "Applied on",
    viewDetails: "View details",
    summaryTitle: "Application summary",
    total: "Total",
    notificationsTitle: "Latest notifications",
    seeAll: "View all",
    noNotifications: "No recent notifications yet.",
    tipsTitle: "Tip",
    tipsText: "Complete your profile to 100% to improve your chances of being recruited.",
    profileCta: "View my profile",
    refresh: "Refresh",
    emptyTitle: "No applications found",
    emptyText: "Try changing your search or status filters.",
    resetFilters: "Reset filters",
    detailsTitle: "Application details",
    close: "Close",
    company: "Company",
    location: "Location",
    roleType: "Role type",
    assessmentScore: "Assessment score",
    statusSummary: "Current step",
    notAvailable: "Not available",
    pendingSummary: "Your application is still under review.",
    shortlistedSummary: "Your profile moved to the shortlist stage.",
    interviewSummary: "An interview is already planned for this role.",
    acceptedSummary: "Your application has been accepted.",
    rejectedSummary: "This application was not retained.",
    loadingTitle: "Loading your applications",
    loadingText: "Preparing your application overview.",
    errorFallback: "Unable to load your applications.",
    notificationFallback: "New application update",
  },
  ar: {
    title: "ترشحاتي",
    subtitle: "تابع حالة كل ترشح بسرعة وفي صفحة واحدة",
    searchPlaceholder: "ابحث بعنوان الوظيفة او الشركة...",
    allStatuses: "كل الحالات",
    filtersButton: "الفلاتر",
    notificationsShortcut: "الاشعارات",
    tabs: {
      all: "الكل",
      in_progress: "قيد المتابعة",
      shortlist: "القائمة المختصرة",
      accepted: "مقبول",
      rejected: "مرفوض",
    },
    appliedOn: "تم الترشح في",
    viewDetails: "عرض التفاصيل",
    summaryTitle: "ملخص الترشحات",
    total: "الاجمالي",
    notificationsTitle: "اخر الاشعارات",
    seeAll: "عرض الكل",
    noNotifications: "لا توجد اشعارات حديثة حاليا.",
    tipsTitle: "نصيحة",
    tipsText: "اكمل ملفك الشخصي بالكامل لزيادة فرصك في التوظيف.",
    profileCta: "عرض ملفي الشخصي",
    refresh: "تحديث",
    emptyTitle: "لم يتم العثور على ترشحات",
    emptyText: "حاول تعديل البحث او الفلاتر.",
    resetFilters: "اعادة ضبط الفلاتر",
    detailsTitle: "تفاصيل الترشح",
    close: "اغلاق",
    company: "الشركة",
    location: "الموقع",
    roleType: "نوع الوظيفة",
    assessmentScore: "نتيجة الاختبار",
    statusSummary: "المرحلة الحالية",
    notAvailable: "غير متوفر",
    pendingSummary: "ترشحك ما زال قيد المراجعة.",
    shortlistedSummary: "تمت اضافة ملفك الى القائمة المختصرة.",
    interviewSummary: "تمت برمجة مقابلة لهذه الوظيفة.",
    acceptedSummary: "تم قبول ترشحك.",
    rejectedSummary: "لم يتم قبول هذا الترشح.",
    loadingTitle: "جاري تحميل ترشحاتك",
    loadingText: "نقوم باعداد لوحة متابعة الترشحات.",
    errorFallback: "تعذر تحميل ترشحاتك.",
    notificationFallback: "تحديث جديد بخصوص الترشح",
  },
} as const;

const applicationsPageStyles = `
  .applications-hub-shell {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 24px;
    padding: 28px;
    border-radius: 34px;
    background:
      radial-gradient(circle at top left, rgba(244, 237, 255, 0.94), transparent 28%),
      radial-gradient(circle at top right, rgba(228, 210, 255, 0.46), transparent 24%),
      rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    box-shadow: 0 28px 64px rgba(var(--app-primary-rgb), 0.09);
  }

  .applications-hub-shell::before,
  .applications-hub-shell::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
  }

  .applications-hub-shell::before {
    top: -110px;
    right: -90px;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(215, 194, 255, 0.45), transparent 68%);
  }

  .applications-hub-shell::after {
    bottom: -120px;
    left: -70px;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle, rgba(239, 231, 255, 0.84), transparent 72%);
  }

  .applications-hub-topbar,
  .applications-hub-layout {
    position: relative;
    z-index: 1;
  }

  .applications-hub-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .applications-hub-titleblock {
    display: grid;
    gap: 8px;
  }

  .applications-hub-title {
    margin: 0;
    color: #26173b;
    font-size: clamp(2rem, 3vw, 2.7rem);
    line-height: 1.06;
    letter-spacing: -0.04em;
    font-family: var(--app-heading);
  }

  .applications-hub-subtitle {
    margin: 0;
    color: rgba(61, 44, 92, 0.72);
    font-size: 0.98rem;
  }

  .applications-hub-topactions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .applications-hub-bellbutton,
  .applications-hub-filtersbutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .applications-hub-bellbutton {
    width: 52px;
    min-width: 52px;
    padding: 0;
    border-radius: 18px;
  }

  .applications-hub-filtersbutton {
    min-width: 122px;
    border-radius: 18px;
  }

  .applications-hub-bellbutton svg,
  .applications-hub-filtersbutton svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .applications-hub-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 318px;
    gap: 20px;
    align-items: start;
  }

  .applications-hub-main,
  .applications-hub-side {
    display: grid;
    gap: 18px;
  }

  .applications-hub-controls {
    padding: 14px !important;
    border-radius: 26px;
  }

  .applications-hub-controls-highlighted {
    box-shadow:
      0 0 0 2px rgba(110, 43, 198, 0.12),
      0 22px 42px rgba(110, 43, 198, 0.12) !important;
  }

  .applications-hub-controlsrow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 164px;
    gap: 14px;
    align-items: center;
  }

  .applications-hub-searchbox,
  .applications-hub-selectbox {
    position: relative;
  }

  .applications-hub-searchicon,
  .applications-hub-selecticon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: rgba(83, 58, 131, 0.6);
    pointer-events: none;
  }

  .applications-hub-searchicon {
    left: 16px;
  }

  .applications-hub-selecticon {
    right: 14px;
  }

  .applications-hub-searchinput,
  .applications-hub-select {
    width: 100%;
    min-height: 50px;
    border-radius: 16px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.12);
    background: rgba(255, 255, 255, 0.92);
    color: var(--app-text);
    font: inherit;
  }

  .applications-hub-searchinput {
    padding: 0 18px 0 46px;
  }

  .applications-hub-select {
    padding: 0 38px 0 16px;
    appearance: none;
  }

  .applications-hub-tabs {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 14px;
    padding: 8px;
    border-radius: 18px;
    background: rgba(249, 247, 255, 0.88);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
  }

  .applications-hub-tab {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-height: 42px;
    padding: 0 14px;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: rgba(72, 47, 114, 0.78);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }

  .applications-hub-tab:hover {
    background: rgba(255, 255, 255, 0.86);
  }

  .applications-hub-tab-active {
    color: #4f1f83;
    background: #ffffff;
    box-shadow: inset 0 -2px 0 #6e2bc6, 0 12px 24px rgba(67, 37, 114, 0.08);
  }

  .applications-hub-tabdot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .applications-hub-tabcount {
    color: inherit;
    opacity: 0.8;
    font-weight: 600;
  }

  .applications-hub-feedback {
    margin: 0;
  }

  .applications-hub-list {
    display: grid;
    gap: 16px;
  }

  .applications-hub-card {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    padding: 18px 20px !important;
    border-radius: 24px;
  }

  .applications-hub-avatar {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 18px;
    color: #ffffff;
    font-size: 1.35rem;
    font-weight: 800;
    box-shadow: 0 18px 28px rgba(76, 30, 125, 0.18);
  }

  .applications-hub-cardbody {
    min-width: 0;
    display: grid;
    gap: 10px;
  }

  .applications-hub-cardtitle {
    margin: 0;
    color: #2c1c45;
    font-size: 1.18rem;
    line-height: 1.2;
    font-family: var(--app-heading);
  }

  .applications-hub-cardmeta,
  .applications-hub-carddate {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    color: rgba(74, 56, 110, 0.78);
    font-size: 0.94rem;
  }

  .applications-hub-cardmeta span,
  .applications-hub-carddate span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .applications-hub-cardmeta svg,
  .applications-hub-carddate svg {
    width: 15px;
    height: 15px;
    color: rgba(112, 85, 162, 0.78);
    flex-shrink: 0;
  }

  .applications-hub-cardactions {
    display: grid;
    justify-items: end;
    gap: 16px;
  }

  .applications-hub-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 104px;
    min-height: 38px;
    padding: 0 16px;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .applications-hub-status-inprogress {
    background: #fff2d0;
    color: #b78000;
  }

  .applications-hub-status-shortlist {
    background: #efe3ff;
    color: #6d2ecf;
  }

  .applications-hub-status-accepted {
    background: #def8e7;
    color: #1e9650;
  }

  .applications-hub-status-rejected {
    background: #ffe2e8;
    color: #df345d;
  }

  .applications-hub-cardbuttons {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .applications-hub-detailsbutton {
    min-width: 126px;
    border-radius: 16px;
    border-color: rgba(125, 85, 195, 0.24) !important;
    color: #5b2cab !important;
  }

  .applications-hub-morebutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: rgba(68, 48, 104, 0.9);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .applications-hub-morebutton:hover {
    background: rgba(244, 239, 255, 0.94);
    color: #4f1f83;
  }

  .applications-hub-morebutton svg {
    width: 18px;
    height: 18px;
  }

  .applications-hub-widget {
    padding: 18px !important;
    border-radius: 24px;
  }

  .applications-hub-widgethead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .applications-hub-widgettitle {
    margin: 0;
    color: #322046;
    font-size: 1.08rem;
    font-family: var(--app-heading);
  }

  .applications-hub-widgetlink {
    padding: 0 !important;
    min-height: auto !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    color: #6e2bc6 !important;
  }

  .applications-hub-summarycontent {
    display: grid;
    grid-template-columns: 152px minmax(0, 1fr);
    gap: 16px;
    align-items: center;
  }

  .applications-hub-ring {
    display: grid;
    place-items: center;
    width: 152px;
    height: 152px;
    margin: 0 auto;
    border-radius: 999px;
    background: conic-gradient(#efe8fb 0deg 360deg);
  }

  .applications-hub-ringinner {
    display: grid;
    place-items: center;
    width: 100px;
    height: 100px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.98);
    color: #342149;
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(var(--app-primary-rgb), 0.08);
  }

  .applications-hub-ringinner strong {
    display: block;
    font-size: 2rem;
    line-height: 1;
    font-family: var(--app-heading);
  }

  .applications-hub-ringinner span {
    display: block;
    margin-top: 4px;
    color: rgba(76, 56, 114, 0.72);
    font-size: 0.88rem;
  }

  .applications-hub-summarylist {
    display: grid;
    gap: 12px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .applications-hub-summaryitem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #432e69;
    font-weight: 700;
  }

  .applications-hub-summarylabel {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .applications-hub-summarydot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .applications-hub-summarycount {
    color: rgba(53, 33, 79, 0.82);
  }

  .applications-hub-notificationlist {
    display: grid;
    gap: 14px;
  }

  .applications-hub-notificationitem {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .applications-hub-notificationicon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    font-size: 0.95rem;
    font-weight: 800;
  }

  .applications-hub-notificationicon-success {
    background: #e1f8ea;
    color: #1e9650;
  }

  .applications-hub-notificationicon-shortlist {
    background: #efe3ff;
    color: #6d2ecf;
  }

  .applications-hub-notificationicon-warning {
    background: #fff2d0;
    color: #b78000;
  }

  .applications-hub-notificationicon-danger {
    background: #ffe2e8;
    color: #df345d;
  }

  .applications-hub-notificationcopy {
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  .applications-hub-notificationtext {
    margin: 0;
    color: #35244f;
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .applications-hub-notificationtime {
    color: rgba(82, 62, 119, 0.66);
    font-size: 0.84rem;
  }

  .applications-hub-widgetempty {
    margin: 0;
    color: rgba(76, 56, 114, 0.7);
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .applications-hub-tipscard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 112px;
    gap: 14px;
    align-items: center;
    padding: 20px !important;
    border-radius: 24px;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.24), transparent 28%),
      linear-gradient(135deg, rgba(141, 80, 219, 0.16), rgba(232, 218, 255, 0.94));
  }

  .applications-hub-tipscopy {
    display: grid;
    gap: 12px;
  }

  .applications-hub-tipscopy p {
    margin: 0;
    color: rgba(65, 47, 97, 0.8);
    line-height: 1.55;
  }

  .applications-hub-tipsart {
    display: grid;
    place-items: center;
    color: #9a63f0;
  }

  .applications-hub-tipsart svg {
    width: 98px;
    height: 98px;
    filter: drop-shadow(0 16px 24px rgba(111, 56, 180, 0.16));
  }

  .applications-hub-empty {
    display: grid;
    place-items: center;
    gap: 14px;
    padding: 34px 20px !important;
    text-align: center;
  }

  .applications-hub-emptyicon {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    border-radius: 20px;
    background: rgba(240, 231, 255, 0.95);
    color: #7b45d5;
  }

  .applications-hub-emptyicon svg {
    width: 26px;
    height: 26px;
  }

  .applications-hub-emptytitle {
    margin: 0;
    color: #2e1f44;
    font-size: 1.2rem;
    font-family: var(--app-heading);
  }

  .applications-hub-emptytext {
    margin: 0;
    max-width: 420px;
    color: rgba(76, 56, 114, 0.74);
    line-height: 1.6;
  }

  .applications-hub-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .applications-hub-pagebutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 42px;
    height: 42px;
    padding: 0 12px;
    border-radius: 14px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.12);
    background: rgba(255, 255, 255, 0.9);
    color: #5a397d;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .applications-hub-pagebutton:hover:not(:disabled) {
    background: rgba(244, 239, 255, 0.96);
    color: #4f1f83;
    border-color: rgba(110, 43, 198, 0.22);
  }

  .applications-hub-pagebutton:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .applications-hub-pagebutton-active {
    background: #5c24a3;
    color: #ffffff;
    border-color: #5c24a3;
    box-shadow: 0 14px 24px rgba(92, 36, 163, 0.2);
  }

  .applications-hub-modalbackdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(23, 13, 34, 0.5);
    backdrop-filter: blur(10px);
  }

  .applications-hub-modal {
    width: min(560px, calc(100vw - 32px));
    padding: 24px !important;
    border-radius: 28px;
    box-shadow: 0 34px 84px rgba(28, 17, 43, 0.28);
  }

  .applications-hub-modalhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .applications-hub-modaleyebrow {
    margin: 0 0 6px;
    color: rgba(96, 70, 142, 0.8);
    font-size: 0.86rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .applications-hub-modaltitle {
    margin: 0;
    color: #2f1f45;
    font-size: 1.6rem;
    line-height: 1.15;
    font-family: var(--app-heading);
  }

  .applications-hub-modalcompany {
    margin: 8px 0 0;
    color: rgba(74, 56, 110, 0.78);
  }

  .applications-hub-modalsummary {
    margin: 16px 0 0;
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(247, 243, 255, 0.94);
    color: #432d67;
    line-height: 1.6;
  }

  .applications-hub-modaldetails {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 20px;
  }

  .applications-hub-modaldetail {
    padding: 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
  }

  .applications-hub-modaldetail strong {
    display: block;
    color: rgba(90, 67, 128, 0.75);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .applications-hub-modaldetail p {
    margin: 10px 0 0;
    color: #33214a;
    line-height: 1.5;
  }

  .applications-hub-modalactions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 22px;
  }

  @media (max-width: 1180px) {
    .applications-hub-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .applications-hub-side {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 920px) {
    .applications-hub-side {
      grid-template-columns: minmax(0, 1fr);
    }

    .applications-hub-card {
      grid-template-columns: 58px minmax(0, 1fr);
    }

    .applications-hub-cardactions {
      grid-column: 1 / -1;
      justify-items: stretch;
      gap: 12px;
    }

    .applications-hub-cardbuttons {
      justify-content: space-between;
    }
  }

  @media (max-width: 720px) {
    .applications-hub-shell {
      padding: 20px;
      border-radius: 28px;
    }

    .applications-hub-topbar {
      flex-direction: column;
      align-items: stretch;
    }

    .applications-hub-topactions {
      justify-content: space-between;
    }

    .applications-hub-controlsrow,
    .applications-hub-summarycontent,
    .applications-hub-tipscard,
    .applications-hub-modaldetails {
      grid-template-columns: minmax(0, 1fr);
    }

    .applications-hub-cardmeta {
      gap: 10px;
    }
  }

  @media (max-width: 560px) {
    .applications-hub-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 10px;
    }

    .applications-hub-tab {
      flex-shrink: 0;
    }

    .applications-hub-card {
      grid-template-columns: minmax(0, 1fr);
    }

    .applications-hub-avatar {
      width: 52px;
      height: 52px;
    }

    .applications-hub-cardbuttons {
      width: 100%;
    }

    .applications-hub-detailsbutton {
      flex: 1 1 auto;
    }

    .applications-hub-modal {
      padding: 20px !important;
    }

    .applications-hub-modalactions {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  }
`;

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6.25 9.75a5.75 5.75 0 1 1 11.5 0v3.02l1.55 2.74a.75.75 0 0 1-.65 1.12H5.35a.75.75 0 0 1-.65-1.12l1.55-2.74z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M8 3.75v3.5" />
      <path d="M16 3.75v3.5" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 20V8.5A1.5 1.5 0 0 1 5.5 7H10v13" />
      <path d="M10 20V4.5A1.5 1.5 0 0 1 11.5 3h7A1.5 1.5 0 0 1 20 4.5V20" />
      <path d="M7 11h.01" />
      <path d="M7 15h.01" />
      <path d="M13 7h.01" />
      <path d="M13 11h.01" />
      <path d="M17 7h.01" />
      <path d="M17 11h.01" />
      <path d="M14 20v-4h2v4" />
    </svg>
  );
}

function DotsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <rect x="24" y="18" width="48" height="60" rx="12" fill="url(#tips-card-gradient)" />
      <rect x="34" y="10" width="28" height="14" rx="7" fill="#8F5CE7" />
      <path d="M36 34h24" stroke="#8F5CE7" strokeWidth="4" strokeLinecap="round" />
      <path d="m34 47 5 5 9-10" stroke="#8F5CE7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 62h24" stroke="#8F5CE7" strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="tips-card-gradient" x1="24" y1="18" x2="76" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="1" stopColor="#E7D7FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function mapStatutVersUi(statut: CandidatureStatut): CandidatureUiStatut {
  switch (statut) {
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    case "shortlisted":
    case "interview_scheduled":
      return "shortlist";
    default:
      return "in_progress";
  }
}

function normaliserStatut(statut?: string): CandidatureStatut {
  switch (statut) {
    case "shortlisted":
    case "interview_scheduled":
    case "rejected":
    case "accepted":
      return statut;
    default:
      return "pending";
  }
}

function normaliserCandidature(item: CandidatureApiItem, index: number): Candidature {
  const candidature = item.candidature ?? item;
  const statut = normaliserStatut(candidature.statut);

  return {
    id: candidature.id ?? `candidature-${index}`,
    offre: {
      id: item.offre?.id,
      titre: item.offre?.titre ?? "Poste",
      localisation: item.offre?.localisation ?? "Localisation indisponible",
      type_poste: item.offre?.type_poste ?? "-",
    },
    entreprise: {
      nom: item.entreprise?.nom ?? "Entreprise",
    },
    date_postulation: candidature.date_postulation ?? new Date().toISOString(),
    statut,
    uiStatut: mapStatutVersUi(statut),
    score_test: typeof candidature.score_test === "number" ? candidature.score_test : undefined,
  };
}

function localeTag(locale: "fr" | "en" | "ar") {
  switch (locale) {
    case "en":
      return "en-US";
    case "ar":
      return "ar-TN";
    default:
      return "fr-FR";
  }
}

function formaterDate(dateString: string, locale: "fr" | "en" | "ar") {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formaterTempsRelatif(dateString: string, locale: "fr" | "en" | "ar") {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, value] of units) {
    if (Math.abs(diffMs) >= value || unit === "minute") {
      return rtf.format(Math.round(diffMs / value), unit);
    }
  }

  return "";
}

function notificationTone(notification: NotificationItem) {
  const normalizedText = `${notification.type} ${notification.titre} ${notification.message}`.toLowerCase();

  if (normalizedText.includes("accept")) {
    return { className: "applications-hub-notificationicon-success", label: "A" };
  }

  if (normalizedText.includes("short") || normalizedText.includes("pres")) {
    return { className: "applications-hub-notificationicon-shortlist", label: "S" };
  }

  if (normalizedText.includes("refus") || normalizedText.includes("reject")) {
    return { className: "applications-hub-notificationicon-danger", label: "R" };
  }

  return { className: "applications-hub-notificationicon-warning", label: "!" };
}

function construireDonut(counts: Record<CandidatureUiStatut, number>, total: number) {
  if (total === 0) {
    return "conic-gradient(#efe8fb 0deg 360deg)";
  }

  let angle = 0;
  const segments: string[] = [];

  (["in_progress", "shortlist", "accepted", "rejected"] as const).forEach((status) => {
    const value = counts[status];
    if (value <= 0) {
      return;
    }

    const nextAngle = angle + (value / total) * 360;
    segments.push(`${STATUS_COLORS[status].fill} ${angle}deg ${nextAngle}deg`);
    angle = nextAngle;
  });

  if (angle < 360) {
    segments.push(`#efe8fb ${angle}deg 360deg`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

function resumeStatut(statut: CandidatureStatut, copy: PageCopy) {
  switch (statut) {
    case "accepted":
      return copy.acceptedSummary;
    case "rejected":
      return copy.rejectedSummary;
    case "shortlisted":
      return copy.shortlistedSummary;
    case "interview_scheduled":
      return copy.interviewSummary;
    default:
      return copy.pendingSummary;
  }
}

function MesCandidaturesPage() {
  const { locale } = useI18n();
  const copy = COPY[locale];
  const filtersPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const filtersHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("all");
  const [pageActuelle, setPageActuelle] = useState(1);
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [filtersHighlighted, setFiltersHighlighted] = useState(false);

  const chargerContenu = useEffectEvent(async () => {
    try {
      setLoading(true);
      setErreur(null);

      const [candidaturesResult, notificationsResult] = await Promise.allSettled([
        (async () => {
          const response = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures"));
          const payload: CandidaturesPayload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(payload.message || copy.errorFallback);
          }

          const items = Array.isArray(payload.donnees) ? payload.donnees : [];
          return items.map(normaliserCandidature);
        })(),
        (async () => {
          const response = await authenticatedFetch(construireUrlApi("/api/notifications?limit=3"));
          const payload: NotificationsPayload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(payload.message || "Unable to load notifications.");
          }

          return Array.isArray(payload.donnees) ? payload.donnees : [];
        })(),
      ]);

      if (candidaturesResult.status === "fulfilled") {
        setCandidatures(candidaturesResult.value);
      } else {
        setCandidatures([]);
        setErreur(candidaturesResult.reason instanceof Error ? candidaturesResult.reason.message : copy.errorFallback);
      }

      if (notificationsResult.status === "fulfilled") {
        setNotifications(notificationsResult.value);
      } else {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void chargerContenu();
  }, [locale]);

  useEffect(() => {
    setPageActuelle(1);
  }, [searchTerm, filtreStatut]);

  useEffect(() => {
    if (!selectedCandidature) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCandidature(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedCandidature]);

  useEffect(() => {
    return () => {
      if (filtersHighlightTimerRef.current) {
        clearTimeout(filtersHighlightTimerRef.current);
      }
    };
  }, []);

  const counts = useMemo(() => {
    return candidatures.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.byStatus[item.uiStatut] += 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {
          in_progress: 0,
          shortlist: 0,
          accepted: 0,
          rejected: 0,
        } as Record<CandidatureUiStatut, number>,
      },
    );
  }, [candidatures]);

  const candidaturesFiltrees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...candidatures]
      .filter((item) => (filtreStatut === "all" ? true : item.uiStatut === filtreStatut))
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return [item.offre.titre, item.entreprise.nom, item.offre.localisation]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => new Date(b.date_postulation).getTime() - new Date(a.date_postulation).getTime());
  }, [candidatures, filtreStatut, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(candidaturesFiltrees.length / PAGE_SIZE));
  const candidaturesVisibles = candidaturesFiltrees.slice((pageActuelle - 1) * PAGE_SIZE, pageActuelle * PAGE_SIZE);

  useEffect(() => {
    if (pageActuelle > totalPages) {
      setPageActuelle(totalPages);
    }
  }, [pageActuelle, totalPages]);

  const statusTabs = [
    { key: "all" as const, label: copy.tabs.all, count: counts.total, color: "#6e2bc6" },
    {
      key: "in_progress" as const,
      label: copy.tabs.in_progress,
      count: counts.byStatus.in_progress,
      color: STATUS_COLORS.in_progress.fill,
    },
    {
      key: "shortlist" as const,
      label: copy.tabs.shortlist,
      count: counts.byStatus.shortlist,
      color: STATUS_COLORS.shortlist.fill,
    },
    {
      key: "accepted" as const,
      label: copy.tabs.accepted,
      count: counts.byStatus.accepted,
      color: STATUS_COLORS.accepted.fill,
    },
    {
      key: "rejected" as const,
      label: copy.tabs.rejected,
      count: counts.byStatus.rejected,
      color: STATUS_COLORS.rejected.fill,
    },
  ];

  const donutBackground = useMemo(
    () =>
      construireDonut(
        {
          in_progress: counts.byStatus.in_progress,
          shortlist: counts.byStatus.shortlist,
          accepted: counts.byStatus.accepted,
          rejected: counts.byStatus.rejected,
        },
        counts.total,
      ),
    [counts],
  );

  const focusFilters = () => {
    filtersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    searchInputRef.current?.focus();
    setFiltersHighlighted(true);

    if (filtersHighlightTimerRef.current) {
      clearTimeout(filtersHighlightTimerRef.current);
    }

    filtersHighlightTimerRef.current = setTimeout(() => {
      setFiltersHighlighted(false);
    }, 1200);
  };

  return (
    <>
      <div className="app-page">
        <section className="applications-hub-shell">
          <header className="applications-hub-topbar">
            <div className="applications-hub-titleblock">
              <h1 className="applications-hub-title">{copy.title}</h1>
              <p className="applications-hub-subtitle">{copy.subtitle}</p>
            </div>

            <div className="applications-hub-topactions">
              <ButtonLink
                href="/notifications"
                variant="secondary"
                className="applications-hub-bellbutton"
                aria-label={copy.notificationsShortcut}
              >
                <BellIcon />
              </ButtonLink>
              <Button className="applications-hub-filtersbutton" onClick={focusFilters}>
                <FilterIcon />
                <span>{copy.filtersButton}</span>
              </Button>
            </div>
          </header>

          <div className="applications-hub-layout">
            <div className="applications-hub-main">
              <Card
                padding="md"
                className={classes("applications-hub-controls", filtersHighlighted && "applications-hub-controls-highlighted")}
              >
                <div className="applications-hub-controlsrow" ref={filtersPanelRef}>
                  <div className="applications-hub-searchbox">
                    <SearchIcon className="applications-hub-searchicon" />
                    <input
                      ref={searchInputRef}
                      className="applications-hub-searchinput"
                      placeholder={copy.searchPlaceholder}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>

                  <div className="applications-hub-selectbox">
                    <select
                      className="applications-hub-select"
                      value={filtreStatut}
                      onChange={(event) => setFiltreStatut(event.target.value as FiltreStatut)}
                    >
                      <option value="all">{copy.allStatuses}</option>
                      <option value="in_progress">{copy.tabs.in_progress}</option>
                      <option value="shortlist">{copy.tabs.shortlist}</option>
                      <option value="accepted">{copy.tabs.accepted}</option>
                      <option value="rejected">{copy.tabs.rejected}</option>
                    </select>
                    <ChevronDownIcon className="applications-hub-selecticon" />
                  </div>
                </div>

                <div className="applications-hub-tabs" role="tablist" aria-label={copy.allStatuses}>
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={classes("applications-hub-tab", filtreStatut === tab.key && "applications-hub-tab-active")}
                      onClick={() => setFiltreStatut(tab.key)}
                    >
                      <span className="applications-hub-tabdot" style={{ background: tab.color }} />
                      <span>{tab.label}</span>
                      <span className="applications-hub-tabcount">({tab.count})</span>
                    </button>
                  ))}
                </div>
              </Card>

              {erreur ? <p className="message message-erreur applications-hub-feedback">{erreur}</p> : null}

              {loading ? (
                <Card padding="lg">
                  <LoadingState title={copy.loadingTitle} description={copy.loadingText} />
                </Card>
              ) : candidaturesFiltrees.length === 0 ? (
                <Card padding="lg" className="applications-hub-empty">
                  <div className="applications-hub-emptyicon">
                    <SearchIcon />
                  </div>
                  <h2 className="applications-hub-emptytitle">{copy.emptyTitle}</h2>
                  <p className="applications-hub-emptytext">{copy.emptyText}</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setFiltreStatut("all");
                    }}
                  >
                    {copy.resetFilters}
                  </Button>
                </Card>
              ) : (
                <>
                  <div className="applications-hub-list">
                    {candidaturesVisibles.map((candidature, index) => {
                      const avatarGradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

                      return (
                        <Card key={candidature.id} padding="md" className="applications-hub-card">
                          <div
                            className="applications-hub-avatar"
                            style={{
                              background: `linear-gradient(135deg, ${avatarGradient.from}, ${avatarGradient.to})`,
                            }}
                          >
                            {(candidature.offre.titre || candidature.entreprise.nom).charAt(0).toUpperCase()}
                          </div>

                          <div className="applications-hub-cardbody">
                            <h2 className="applications-hub-cardtitle">{candidature.offre.titre}</h2>
                            <div className="applications-hub-cardmeta">
                              <span>
                                <BuildingIcon />
                                {candidature.entreprise.nom}
                              </span>
                              <span>
                                <LocationIcon />
                                {candidature.offre.localisation}
                              </span>
                            </div>
                            <div className="applications-hub-carddate">
                              <span>
                                <CalendarIcon />
                                {copy.appliedOn} {formaterDate(candidature.date_postulation, locale)}
                              </span>
                            </div>
                          </div>

                          <div className="applications-hub-cardactions">
                            <span
                              className={classes(
                                "applications-hub-status",
                                candidature.uiStatut === "in_progress" && "applications-hub-status-inprogress",
                                candidature.uiStatut === "shortlist" && "applications-hub-status-shortlist",
                                candidature.uiStatut === "accepted" && "applications-hub-status-accepted",
                                candidature.uiStatut === "rejected" && "applications-hub-status-rejected",
                              )}
                            >
                              {copy.tabs[candidature.uiStatut]}
                            </span>

                            <div className="applications-hub-cardbuttons">
                              <Button
                                variant="secondary"
                                className="applications-hub-detailsbutton"
                                onClick={() => setSelectedCandidature(candidature)}
                              >
                                {copy.viewDetails}
                              </Button>
                              <button
                                type="button"
                                className="applications-hub-morebutton"
                                onClick={() => setSelectedCandidature(candidature)}
                                aria-label={copy.viewDetails}
                              >
                                <DotsIcon />
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {totalPages > 1 ? (
                    <div className="applications-hub-pagination">
                      <button
                        type="button"
                        className="applications-hub-pagebutton"
                        onClick={() => setPageActuelle((current) => Math.max(1, current - 1))}
                        disabled={pageActuelle === 1}
                        aria-label="Previous"
                      >
                        ‹
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={classes("applications-hub-pagebutton", pageActuelle === page && "applications-hub-pagebutton-active")}
                          onClick={() => setPageActuelle(page)}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="applications-hub-pagebutton"
                        onClick={() => setPageActuelle((current) => Math.min(totalPages, current + 1))}
                        disabled={pageActuelle === totalPages}
                        aria-label="Next"
                      >
                        ›
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <aside className="applications-hub-side">
              <Card padding="md" className="applications-hub-widget">
                <h2 className="applications-hub-widgettitle">{copy.summaryTitle}</h2>
                <div className="applications-hub-summarycontent">
                  <div className="applications-hub-ring" style={{ background: donutBackground }}>
                    <div className="applications-hub-ringinner">
                      <strong>{counts.total}</strong>
                      <span>{copy.total}</span>
                    </div>
                  </div>

                  <ul className="applications-hub-summarylist">
                    {(["in_progress", "shortlist", "accepted", "rejected"] as const).map((status) => (
                      <li key={status} className="applications-hub-summaryitem">
                        <span className="applications-hub-summarylabel">
                          <span className="applications-hub-summarydot" style={{ background: STATUS_COLORS[status].fill }} />
                          <span>{copy.tabs[status]}</span>
                        </span>
                        <span className="applications-hub-summarycount">{counts.byStatus[status]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card padding="md" className="applications-hub-widget">
                <div className="applications-hub-widgethead">
                  <h2 className="applications-hub-widgettitle">{copy.notificationsTitle}</h2>
                  <ButtonLink href="/notifications" variant="ghost" size="sm" className="applications-hub-widgetlink">
                    {copy.seeAll}
                  </ButtonLink>
                </div>

                {notifications.length === 0 ? (
                  <p className="applications-hub-widgetempty">{copy.noNotifications}</p>
                ) : (
                  <div className="applications-hub-notificationlist">
                    {notifications.map((notification) => {
                      const tone = notificationTone(notification);

                      return (
                        <div key={notification.id} className="applications-hub-notificationitem">
                          <span className={classes("applications-hub-notificationicon", tone.className)}>{tone.label}</span>
                          <div className="applications-hub-notificationcopy">
                            <p className="applications-hub-notificationtext">
                              {notification.message || notification.titre || copy.notificationFallback}
                            </p>
                            <span className="applications-hub-notificationtime">
                              {formaterTempsRelatif(notification.created_at, locale)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card padding="md" className="applications-hub-tipscard">
                <div className="applications-hub-tipscopy">
                  <h2 className="applications-hub-widgettitle">{copy.tipsTitle}</h2>
                  <p>{copy.tipsText}</p>
                  <ButtonLink href="/profil" size="sm">
                    {copy.profileCta}
                  </ButtonLink>
                </div>

                <div className="applications-hub-tipsart" aria-hidden="true">
                  <ClipboardIcon />
                </div>
              </Card>
            </aside>
          </div>
        </section>
      </div>

      {selectedCandidature ? (
        <div className="applications-hub-modalbackdrop" onClick={() => setSelectedCandidature(null)}>
          <Card
            padding="lg"
            className="applications-hub-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="applications-hub-modalhead">
              <div>
                <p className="applications-hub-modaleyebrow">{copy.detailsTitle}</p>
                <h2 id="application-details-title" className="applications-hub-modaltitle">
                  {selectedCandidature.offre.titre}
                </h2>
                <p className="applications-hub-modalcompany">
                  {selectedCandidature.entreprise.nom} - {selectedCandidature.offre.localisation}
                </p>
              </div>

              <Button variant="ghost" onClick={() => setSelectedCandidature(null)}>
                {copy.close}
              </Button>
            </div>

            <span
              className={classes(
                "applications-hub-status",
                selectedCandidature.uiStatut === "in_progress" && "applications-hub-status-inprogress",
                selectedCandidature.uiStatut === "shortlist" && "applications-hub-status-shortlist",
                selectedCandidature.uiStatut === "accepted" && "applications-hub-status-accepted",
                selectedCandidature.uiStatut === "rejected" && "applications-hub-status-rejected",
              )}
            >
              {copy.tabs[selectedCandidature.uiStatut]}
            </span>

            <div className="applications-hub-modalsummary">{resumeStatut(selectedCandidature.statut, copy)}</div>

            <div className="applications-hub-modaldetails">
              <div className="applications-hub-modaldetail">
                <strong>{copy.company}</strong>
                <p>{selectedCandidature.entreprise.nom}</p>
              </div>
              <div className="applications-hub-modaldetail">
                <strong>{copy.location}</strong>
                <p>{selectedCandidature.offre.localisation}</p>
              </div>
              <div className="applications-hub-modaldetail">
                <strong>{copy.appliedOn}</strong>
                <p>{formaterDate(selectedCandidature.date_postulation, locale)}</p>
              </div>
              <div className="applications-hub-modaldetail">
                <strong>{copy.roleType}</strong>
                <p>{selectedCandidature.offre.type_poste || copy.notAvailable}</p>
              </div>
              <div className="applications-hub-modaldetail">
                <strong>{copy.assessmentScore}</strong>
                <p>
                  {typeof selectedCandidature.score_test === "number"
                    ? `${selectedCandidature.score_test}/100`
                    : copy.notAvailable}
                </p>
              </div>
              <div className="applications-hub-modaldetail">
                <strong>{copy.statusSummary}</strong>
                <p>{resumeStatut(selectedCandidature.statut, copy)}</p>
              </div>
            </div>

            <div className="applications-hub-modalactions">
              <Button variant="secondary" onClick={() => setSelectedCandidature(null)}>
                {copy.close}
              </Button>
              <ButtonLink href="/offres">{copy.refresh}</ButtonLink>
            </div>
          </Card>
        </div>
      ) : null}

      <style jsx global>{applicationsPageStyles}</style>
    </>
  );
}

export default function MesCandidaturesPageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <MesCandidaturesPage />
    </RouteProtegee>
  );
}
