"use client";

import { type FormEvent, type SVGProps, useEffect, useEffectEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TextToSpeechButton } from "@/components/text-to-speech-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

interface OffreEmploi {
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
  statut: string;
  date_limite?: string;
  created_at: string;
  candidatures_count: number;
  vues_count: number;
  nom_entreprise?: string;
}

type CandidatureOffreItem = {
  id_offre?: string;
  idOffre?: string;
  candidature?: {
    id_offre?: string;
    id_candidat?: string;
  };
  offre?: {
    id_offre?: string;
    id?: string | number;
  };
};

type FavoriItem = {
  id_offre?: string;
};

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});

const formatSalaryAmount = (value: number) => tndNumberFormatter.format(value);

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

function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 7h12" />
      <path d="M8 12h12" />
      <path d="M8 17h12" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V20l-5-3-5 3z" />
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

function SalaryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" />
      <path d="M3.5 10.5h17" />
      <circle cx="12" cy="12" r="1.8" />
    </svg>
  );
}

function ExperienceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="7" width="16" height="12" rx="2.5" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M15 19v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1" />
      <circle cx="10" cy="10" r="3" />
      <path d="M21 19v-1a3 3 0 0 0-2-2.82" />
      <path d="M16 7.13a3 3 0 0 1 0 5.74" />
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

function EmptyJobsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <circle cx="48" cy="48" r="34" fill="url(#jobs-empty-gradient)" />
      <path d="M48 28c-13.255 0-24 8.507-24 19 0 5.586 3.07 10.61 8.003 14.095V70l10.117-5.192A33.08 33.08 0 0 0 48 65c13.255 0 24-8.507 24-19s-10.745-19-24-19Z" fill="#6E2BC6" />
      <circle cx="39" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="48" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="57" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="24" cy="34" r="3" fill="#D9C1FB" />
      <circle cx="72" cy="32" r="3" fill="#D9C1FB" />
      <circle cx="70" cy="67" r="3" fill="#D9C1FB" />
      <circle cx="26" cy="66" r="4" fill="#E8D7FF" />
      <defs>
        <linearGradient id="jobs-empty-gradient" x1="20" y1="20" x2="76" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3EAFE" />
          <stop offset="1" stopColor="#E3CCFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const formatSalaryRange = (offre: OffreEmploi) =>
  `${formatSalaryAmount(offre.salaire_min)} - ${formatSalaryAmount(offre.salaire_max)} TND`;

const formatContractLabel = (typePoste: string) => typePoste.trim().toUpperCase() || "CDI";

const formatExperienceLabel = (experience?: string) => {
  if (!experience?.trim()) {
    return "0 ans";
  }

  return experience.trim();
};

const formatDeadline = (date?: string) => {
  if (!date) {
    return "Open";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Open";
  }

  return parsedDate.toLocaleDateString("fr-FR");
};

const buildOfferSpeechContent = (offre: OffreEmploi, aiSummary?: string) => {
  const company = offre.nom_entreprise?.trim() || "Not specified";
  const skills = offre.competences_requises?.trim() || "Not specified";
  const experience = offre.experience_requise?.trim() || "Not specified";
  const location = offre.localisation?.trim() || "Not specified";
  const contractType = offre.type_poste?.trim() || "Not specified";
  const description = offre.description?.trim() || "Not specified";
  const summary = aiSummary?.trim() || "Not specified";

  return [
    `Job title: ${offre.titre}`,
    `Company name: ${company}`,
    `Job description: ${description}`,
    `Required skills: ${skills}`,
    `Experience: ${experience}`,
    `Location: ${location}`,
    `Contract type: ${contractType}`,
    `AI summary: ${summary}`,
  ].join(". ");
};

const jobsStudioScopedStyles = `
  .jobs-studio-shell {
    position: relative;
    display: grid;
    gap: 26px;
    padding: 30px 30px 34px;
    border-radius: 34px;
    background:
      radial-gradient(circle at top left, rgba(241, 232, 255, 0.92), transparent 28%),
      radial-gradient(circle at top right, rgba(228, 212, 255, 0.42), transparent 24%),
      rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    box-shadow: 0 28px 64px rgba(var(--app-primary-rgb), 0.09);
    overflow: hidden;
  }

  .jobs-studio-shell::before,
  .jobs-studio-shell::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
    opacity: 0.38;
  }

  .jobs-studio-shell::before {
    top: -120px;
    right: -100px;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(214, 191, 255, 0.48), transparent 68%);
  }

  .jobs-studio-shell::after {
    bottom: -140px;
    left: -80px;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(239, 231, 255, 0.88), transparent 72%);
  }

  .jobs-studio-header,
  .jobs-studio-resultsbar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .jobs-studio-heading h1 {
    margin: 0;
    color: #181636;
    font-family: var(--app-heading);
    font-size: clamp(2.1rem, 2vw + 1.2rem, 3rem);
    line-height: 1.05;
  }

  .jobs-studio-heading p {
    margin: 12px 0 0;
    color: rgba(67, 63, 105, 0.72);
    font-size: 1rem;
    line-height: 1.65;
  }

  .jobs-studio-header-actions,
  .jobs-studio-resultsactions,
  .jobs-studio-cardbadges,
  .jobs-studio-cardactions,
  .jobs-studio-cardmeta,
  .jobs-studio-activefilters,
  .jobs-studio-viewtoggle {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .jobs-studio-iconbutton,
  .jobs-studio-viewtoggle button,
  .jobs-studio-bookmark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: rgba(255, 255, 255, 0.94);
    color: #61527f;
    box-shadow: 0 12px 28px rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-iconbutton {
    width: 58px;
    height: 58px;
    border-radius: 20px;
  }

  .jobs-studio-filtersbutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 58px;
    padding: 0 22px;
    border: 0;
    border-radius: 20px;
    background: linear-gradient(135deg, #35063e, #6d2bd0);
    color: white;
    font-weight: 800;
    box-shadow: 0 18px 34px rgba(var(--app-primary-rgb), 0.18);
  }

  .jobs-studio-toolbar {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 0.72fr));
    gap: 14px;
    align-items: center;
  }

  .jobs-studio-search,
  .jobs-studio-selectshell,
  .jobs-studio-morefilters {
    min-height: 60px;
    border-radius: 20px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.09);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  .jobs-studio-search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
  }

  .jobs-studio-search input,
  .jobs-studio-select,
  .jobs-studio-sorter select {
    width: 100%;
    border: 0;
    background: transparent;
    color: #2a2342;
    font: inherit;
  }

  .jobs-studio-search input::placeholder {
    color: rgba(91, 89, 122, 0.68);
  }

  .jobs-studio-search input:focus,
  .jobs-studio-select:focus,
  .jobs-studio-sorter select:focus {
    outline: none;
  }

  .jobs-studio-search:focus-within,
  .jobs-studio-selectshell:focus-within,
  .jobs-studio-sorter:focus-within {
    border-color: rgba(var(--app-primary-rgb), 0.22);
    box-shadow: 0 0 0 4px rgba(var(--app-primary-rgb), 0.08);
  }

  .jobs-studio-selectshell {
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .jobs-studio-select,
  .jobs-studio-sorter select {
    appearance: none;
    padding-right: 24px;
    background-image:
      linear-gradient(45deg, transparent 50%, #6a5a90 50%),
      linear-gradient(135deg, #6a5a90 50%, transparent 50%);
    background-position:
      calc(100% - 14px) calc(50% - 2px),
      calc(100% - 9px) calc(50% - 2px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
  }

  .jobs-studio-morefilters {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 18px;
    color: #3b3157;
    font-weight: 700;
  }

  .jobs-studio-advanced {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 22px;
    background: rgba(247, 241, 255, 0.88);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
  }

  .jobs-studio-activechip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    color: #4d3666;
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-activechip.is-muted {
    color: rgba(77, 54, 102, 0.72);
  }

  .jobs-studio-resetfilters {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 16px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: white;
    color: #4d3666;
    font-weight: 700;
  }

  .jobs-studio-resetfilters:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .jobs-studio-resultscount {
    margin: 0;
    color: rgba(58, 50, 86, 0.84);
    font-size: 1.08rem;
  }

  .jobs-studio-resultscount strong {
    color: #5e21cb;
    font-size: 1.9rem;
    font-weight: 800;
  }

  .jobs-studio-sorter {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    background: rgba(255, 255, 255, 0.92);
    color: rgba(67, 63, 105, 0.8);
    font-weight: 700;
  }

  .jobs-studio-sorter select {
    min-width: 132px;
    color: #22183b;
    font-weight: 800;
  }

  .jobs-studio-viewtoggle {
    gap: 10px;
  }

  .jobs-studio-viewtoggle button {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }

  .jobs-studio-viewtoggle button.is-active {
    border-color: transparent;
    background: linear-gradient(135deg, #35063e, #6d2bd0);
    color: white;
    box-shadow: 0 16px 32px rgba(var(--app-primary-rgb), 0.18);
  }

  .jobs-studio-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .jobs-studio-grid.is-list {
    grid-template-columns: 1fr;
  }

  .jobs-studio-card {
    display: grid;
    gap: 18px;
    min-height: 100%;
    padding: 20px 20px 18px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    box-shadow: 0 18px 36px rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-cardtop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .jobs-studio-contractbadge,
  .jobs-studio-statusbadge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .jobs-studio-contractbadge {
    background: rgba(130, 68, 255, 0.1);
    color: #6a2fd2;
  }

  .jobs-studio-statusbadge {
    gap: 8px;
    background: rgba(42, 183, 102, 0.1);
    color: #1b9e54;
  }

  .jobs-studio-statusdot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #1fbe62;
  }

  .jobs-studio-bookmark {
    width: 42px;
    height: 42px;
    border-radius: 16px;
  }

  .jobs-studio-bookmark.is-active {
    color: #5c27c9;
    background: rgba(130, 68, 255, 0.1);
    border-color: rgba(130, 68, 255, 0.16);
  }

  .jobs-studio-bookmark.is-static {
    pointer-events: none;
  }

  .jobs-studio-cardbody {
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .jobs-studio-cardtitle {
    margin: 0;
    color: #171538;
    font-family: var(--app-heading);
    font-size: 1.35rem;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }

  .jobs-studio-cardcompany,
  .jobs-studio-cardsalary,
  .jobs-studio-carddeadline,
  .jobs-studio-cardmeta span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .jobs-studio-cardcompany,
  .jobs-studio-cardmeta,
  .jobs-studio-carddeadline {
    color: rgba(67, 63, 105, 0.78);
  }

  .jobs-studio-cardsalary {
    color: #24193f;
    font-size: 1.02rem;
    font-weight: 800;
  }

  .jobs-studio-cardsnippet {
    margin: 0;
    color: rgba(67, 63, 105, 0.66);
    font-size: 0.94rem;
    line-height: 1.6;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .jobs-studio-cardmeta {
    gap: 18px;
  }

  .jobs-studio-carddeadline {
    font-weight: 700;
  }

  .jobs-studio-metaicon,
  .jobs-studio-icon {
    flex: none;
  }

  .jobs-studio-metaicon {
    width: 16px;
    height: 16px;
  }

  .jobs-studio-icon {
    width: 19px;
    height: 19px;
  }

  .jobs-studio-search-icon {
    width: 20px;
    height: 20px;
    color: rgba(67, 63, 105, 0.68);
  }

  .jobs-studio-more-icon {
    width: 18px;
    height: 18px;
  }

  .jobs-studio-cardactions {
    justify-content: space-between;
    align-items: stretch;
  }

  .jobs-studio-cardprimary,
  .jobs-studio-cardsecondary,
  .jobs-studio-emptybutton {
    min-height: 46px;
    border-radius: 16px;
    font-weight: 800;
  }

  .jobs-studio-cardprimary,
  .jobs-studio-emptybutton {
    padding: 0 20px;
    border: 0;
    background: linear-gradient(135deg, rgba(122, 64, 255, 0.14), rgba(233, 221, 255, 0.95));
    color: #5320b9;
  }

  .jobs-studio-cardsecondary {
    padding: 0 16px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: rgba(255, 255, 255, 0.96);
    color: #493264;
  }

  .jobs-studio-empty {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    gap: 14px;
    min-height: 520px;
    padding: 36px 20px;
    text-align: center;
  }

  .jobs-studio-emptyicon {
    display: grid;
    place-items: center;
    width: 220px;
    height: 220px;
  }

  .jobs-studio-emptyart {
    width: 100%;
    height: 100%;
  }

  .jobs-studio-empty h2 {
    margin: 0;
    color: #1b1738;
    font-family: var(--app-heading);
    font-size: 2rem;
  }

  .jobs-studio-empty p {
    margin: 0;
    max-width: 460px;
    color: rgba(67, 63, 105, 0.72);
    line-height: 1.7;
  }

  @media (max-width: 1320px) {
    .jobs-studio-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1120px) {
    .jobs-studio-toolbar {
      grid-template-columns: minmax(0, 1fr) repeat(2, minmax(0, 1fr));
    }

    .jobs-studio-morefilters {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 920px) {
    .jobs-studio-shell {
      padding: 24px 20px 26px;
      border-radius: 28px;
    }

    .jobs-studio-header,
    .jobs-studio-resultsbar,
    .jobs-studio-advanced {
      flex-direction: column;
      align-items: stretch;
    }

    .jobs-studio-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .jobs-studio-resultsactions {
      justify-content: space-between;
    }
  }

  @media (max-width: 720px) {
    .jobs-studio-toolbar,
    .jobs-studio-grid {
      grid-template-columns: 1fr;
    }

    .jobs-studio-cardactions {
      flex-direction: column;
    }

    .jobs-studio-cardprimary,
    .jobs-studio-cardsecondary {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .jobs-studio-heading h1 {
      font-size: 2rem;
    }

    .jobs-studio-header-actions,
    .jobs-studio-resultsactions {
      width: 100%;
      justify-content: space-between;
    }

    .jobs-studio-iconbutton,
    .jobs-studio-filtersbutton {
      min-height: 52px;
    }

    .jobs-studio-filtersbutton {
      flex: 1;
      justify-content: center;
    }

    .jobs-studio-sorter {
      width: 100%;
      justify-content: space-between;
    }

    .jobs-studio-card {
      padding: 18px;
    }

    .jobs-studio-empty {
      min-height: 420px;
    }

    .jobs-studio-emptyicon {
      width: 170px;
      height: 170px;
    }

    .jobs-studio-empty h2 {
      font-size: 1.7rem;
    }
  }
`;

export default function OffresPage() {
  const CV_REQUIS_MESSAGE = "Vous devez joindre votre CV pour postuler a cette offre.";
  const [offres, setOffres] = useState<OffreEmploi[]>([]);
  const [offresFiltered, setOffresFiltered] = useState<OffreEmploi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filtres, setFiltres] = useState({
    titre: "",
    localisation: "",
    type_poste: "",
    accessibilite_handicap: true,
  });
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [candidatures, setCandidatures] = useState<Set<string>>(new Set());
  const [offreEnDetails, setOffreEnDetails] = useState<OffreEmploi | null>(null);
  const [offreSelectionnee, setOffreSelectionnee] = useState<OffreEmploi | null>(null);
  const [lettreMotivation, setLettreMotivation] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFieldTouched, setCvFieldTouched] = useState(false);
  const [envoiCandidature, setEnvoiCandidature] = useState(false);
  const [erreurCandidature, setErreurCandidature] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tri, setTri] = useState<"recent" | "salary" | "deadline">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [summaryLoadingOfferId, setSummaryLoadingOfferId] = useState<string | null>(null);
  const [summaryByOfferId, setSummaryByOfferId] = useState<Record<string, string>>({});
  const [summaryErrorByOfferId, setSummaryErrorByOfferId] = useState<Record<string, string>>({});
  const { utilisateur } = useAuth();
  const cvFieldError = cvFieldTouched && !cvFile ? CV_REQUIS_MESSAGE : null;

  useEffect(() => {
    chargerOffresPubliques();
    chargerFavoris();
    chargerMesCandidatures();
  }, [utilisateur]);

  useEffect(() => {
    let filtered = offres;
    const recherche = filtres.titre.trim().toLowerCase();

    if (recherche) {
      filtered = filtered.filter((o) =>
        [o.titre, o.description, o.localisation, o.nom_entreprise]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(recherche)),
      );
    }
    if (filtres.localisation) {
      filtered = filtered.filter((o) => o.localisation.toLowerCase() === filtres.localisation.toLowerCase());
    }
    if (filtres.type_poste) {
      filtered = filtered.filter((o) => o.type_poste.toLowerCase() === filtres.type_poste.toLowerCase());
    }

    filtered = filtered.filter((o) => o.statut === "active");
    filtered = [...filtered].sort((offreA, offreB) => {
      if (tri === "salary") {
        return offreB.salaire_max - offreA.salaire_max;
      }

      if (tri === "deadline") {
        const deadlineA = offreA.date_limite ? new Date(offreA.date_limite).getTime() : Number.MAX_SAFE_INTEGER;
        const deadlineB = offreB.date_limite ? new Date(offreB.date_limite).getTime() : Number.MAX_SAFE_INTEGER;
        return deadlineA - deadlineB;
      }

      return new Date(offreB.created_at).getTime() - new Date(offreA.created_at).getTime();
    });
    setOffresFiltered(filtered);
  }, [offres, filtres, tri]);

  const reinitialiserFiltres = () =>
    setFiltres({ titre: "", localisation: "", type_poste: "", accessibilite_handicap: true });

  const chargerFavoris = useEffectEvent(async () => {
    try {
      if (!utilisateur || utilisateur.role !== "candidat") return;
      const res = await authenticatedFetch(construireUrlApi("/api/favoris"));
      if (!res.ok) return;
      const data = await res.json();
      const donnees = Array.isArray(data.donnees) ? (data.donnees as FavoriItem[]) : [];
      setFavoris(new Set(donnees.map((f) => f.id_offre).filter((id): id is string => typeof id === "string" && id.length > 0)));
    } catch {}
  });

  const chargerMesCandidatures = useEffectEvent(async () => {
    try {
      if (!utilisateur || utilisateur.role !== "candidat") return;
      const res = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures"));
      if (!res.ok) return;
      const data = await res.json();
      const donneesBrutes = Array.isArray(data.donnees) ? (data.donnees as CandidatureOffreItem[]) : [];
      const idCandidatConnecte = (utilisateur as { candidat?: { id?: string } } | null)?.candidat?.id;
      const donnees = idCandidatConnecte
        ? donneesBrutes.filter((item) => !item.candidature?.id_candidat || item.candidature.id_candidat === idCandidatConnecte)
        : donneesBrutes;
      const ids = new Set(
        donnees
          .map(
            (item) =>
              item.id_offre ??
              item.candidature?.id_offre ??
              item.offre?.id_offre ??
              item.offre?.id ??
              item.idOffre,
          )
          .filter((id): id is string | number => id !== null && id !== undefined)
          .map((id) => String(id))
          .filter((id) => id.length > 0),
      );
      setCandidatures(ids);
    } catch {}
  });

  const chargerOffresPubliques = useEffectEvent(async () => {
    setLoading(true);
    setErreur(null);

    try {
      const response = await fetch(construireUrlApi("/api/offres/publiques"), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setOffres(data.donnees?.offres || []);
      } else {
        await chargerOffresDepuisAPIEntreprise();
      }
    } catch {
      await chargerOffresDepuisAPIEntreprise();
    } finally {
      setLoading(false);
    }
  });

  const chargerOffresDepuisAPIEntreprise = async () => {
    try {
      const response = await fetch(construireUrlApi("/api/entreprise/offres"), {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setOffres(data.donnees?.offres || []);
      } else {
        setErreur("Impossible de charger les offres.");
      }
    } catch {
      setErreur("Impossible de charger les offres.");
    }
  };

  const toggleFavori = async (idOffre: string) => {
    setInfo(null);
    if (!utilisateur || utilisateur.role !== "candidat") {
      setErreur("Connectez-vous en tant que candidat pour gerer vos favoris.");
      return;
    }

    try {
      const estFavori = favoris.has(idOffre);
      const res = await authenticatedFetch(construireUrlApi(`/api/favoris/${idOffre}`), {
        method: estFavori ? "DELETE" : "POST",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Impossible de mettre a jour le favori");
      }

      const next = new Set(favoris);
      if (estFavori) {
        next.delete(idOffre);
      } else {
        next.add(idOffre);
      }
      setFavoris(next);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de mettre a jour le favori");
    }
  };

  const reinitialiserFormulaireCandidature = () => {
    setOffreSelectionnee(null);
    setLettreMotivation("");
    setCvFile(null);
    setCvFieldTouched(false);
    setErreurCandidature(null);
  };

  const ouvrirDetailsOffre = (offre: OffreEmploi) => {
    setErreur(null);
    setInfo(null);
    setOffreEnDetails(offre);
  };

  const fermerDetailsOffre = () => {
    setOffreEnDetails(null);
  };

  const ouvrirFormulaireCandidature = (offre: OffreEmploi) => {
    setErreur(null);
    setInfo(null);
    setErreurCandidature(null);

    if (!utilisateur || utilisateur.role !== "candidat") {
      setErreur("Connectez-vous en tant que candidat pour postuler.");
      return;
    }

    setOffreSelectionnee(offre);
  };

  const ouvrirFormulaireDepuisDetails = (offre: OffreEmploi) => {
    fermerDetailsOffre();
    ouvrirFormulaireCandidature(offre);
  };

  const buildOfferTextForSummary = (offre: OffreEmploi) =>
    [
      `Titre: ${offre.titre}`,
      `Entreprise: ${offre.nom_entreprise || "Non précisé"}`,
      `Localisation: ${offre.localisation || "Non précisé"}`,
      `Type de poste: ${offre.type_poste || "Non précisé"}`,
      `Salaire minimum: ${String(offre.salaire_min ?? "Non précisé")}`,
      `Salaire maximum: ${String(offre.salaire_max ?? "Non précisé")}`,
      `Compétences requises: ${offre.competences_requises || "Non précisé"}`,
      `Expérience requise: ${offre.experience_requise || "Non précisé"}`,
      `Niveau étude: ${offre.niveau_etude || "Non précisé"}`,
      `Date limite: ${offre.date_limite || "Non précisé"}`,
      "",
      `Description: ${offre.description || "Non précisé"}`,
    ].join("\n");

  const resumerOffre = async (offre: OffreEmploi) => {
    setSummaryLoadingOfferId(offre.id_offre);
    setSummaryErrorByOfferId((current) => ({ ...current, [offre.id_offre]: "" }));

    try {
      const response = await fetch("/api/job-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobOffer: buildOfferTextForSummary(offre) }),
      });

      const data = (await response.json()) as { summary?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Impossible de résumer cette offre.");
      }

      if (!data.summary) {
        throw new Error("Résumé vide reçu.");
      }

      setSummaryByOfferId((current) => ({ ...current, [offre.id_offre]: data.summary as string }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur pendant le résumé.";
      setSummaryErrorByOfferId((current) => ({ ...current, [offre.id_offre]: message }));
    } finally {
      setSummaryLoadingOfferId((current) => (current === offre.id_offre ? null : current));
    }
  };

  const fermerFormulaireCandidature = () => {
    if (envoiCandidature) {
      return;
    }
    reinitialiserFormulaireCandidature();
  };

  const postuler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreur(null);
    setInfo(null);
    setErreurCandidature(null);

    if (!offreSelectionnee) {
      return;
    }

    if (!cvFile) {
      setCvFieldTouched(true);
      setErreurCandidature(CV_REQUIS_MESSAGE);
      return;
    }

    setEnvoiCandidature(true);

    try {
      const lettre = lettreMotivation.trim();
      const formData = new FormData();
      formData.append("id_offre", offreSelectionnee.id_offre);
      formData.append("cv", cvFile);
      if (lettre) {
        formData.append("lettre_motivation", lettre);
      }

      const res = await authenticatedFetch(construireUrlApi("/api/candidatures"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setInfo(data.message || "Candidature envoyee.");
        setCandidatures((prev) => new Set(prev).add(offreSelectionnee.id_offre));
        reinitialiserFormulaireCandidature();
        return;
      }

      if (res.status === 409) {
        setInfo(data.message || "Vous avez deja postule a cette offre.");
        setCandidatures((prev) => new Set(prev).add(offreSelectionnee.id_offre));
        reinitialiserFormulaireCandidature();
        return;
      }

      setErreurCandidature(data.message || "Erreur candidature");
    } catch (error: unknown) {
      setErreurCandidature(error instanceof Error ? error.message : "Erreur candidature");
    } finally {
      setEnvoiCandidature(false);
    }
  };

  const contractTypes = Array.from(
    new Set(offres.map((offre) => offre.type_poste.trim()).filter((value) => value.length > 0)),
  ).sort((typeA, typeB) => typeA.localeCompare(typeB, "fr"));

  const locations = Array.from(
    new Set(offres.map((offre) => offre.localisation.trim()).filter((value) => value.length > 0)),
  ).sort((locationA, locationB) => locationA.localeCompare(locationB, "fr"));

  const hasActiveFilters = Boolean(filtres.titre || filtres.localisation || filtres.type_poste);

  const contenu = (
    <div className="app-page">
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      <section className="jobs-studio-shell">
        <div className="jobs-studio-header">
          <div className="jobs-studio-heading">
            <h1>Explore jobs</h1>
            <p>Discover opportunities that match your skills and aspirations.</p>
          </div>
          <div className="jobs-studio-header-actions">
            <button type="button" className="jobs-studio-iconbutton" aria-label="Notifications">
              <BellIcon className="jobs-studio-icon" />
            </button>
            <button
              type="button"
              className="jobs-studio-filtersbutton"
              onClick={() => setShowAdvancedFilters((currentValue) => !currentValue)}
            >
              <FilterIcon className="jobs-studio-icon" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="jobs-studio-toolbar">
          <label className="jobs-studio-search">
            <SearchIcon className="jobs-studio-icon jobs-studio-search-icon" />
            <input
              type="text"
              value={filtres.titre}
              onChange={(event) => setFiltres({ ...filtres, titre: event.target.value })}
              placeholder="Search by job title, company or keyword..."
              aria-label="Search jobs"
            />
          </label>

          <label className="jobs-studio-selectshell">
            <select
              value={filtres.type_poste}
              onChange={(event) => setFiltres({ ...filtres, type_poste: event.target.value })}
              className="jobs-studio-select"
              aria-label="Filter by contract type"
            >
              <option value="">All contract types</option>
              {contractTypes.map((typePoste) => (
                <option key={typePoste} value={typePoste}>
                  {formatContractLabel(typePoste)}
                </option>
              ))}
            </select>
          </label>

          <label className="jobs-studio-selectshell">
            <select
              value={filtres.localisation}
              onChange={(event) => setFiltres({ ...filtres, localisation: event.target.value })}
              className="jobs-studio-select"
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="jobs-studio-morefilters"
            onClick={() => setShowAdvancedFilters((currentValue) => !currentValue)}
          >
            <MoreIcon className="jobs-studio-icon jobs-studio-more-icon" />
            <span>More filters</span>
          </button>
        </div>

        {showAdvancedFilters || hasActiveFilters ? (
          <div className="jobs-studio-advanced">
            <div className="jobs-studio-activefilters">
              {hasActiveFilters ? (
                <>
                  {filtres.titre ? <span className="jobs-studio-activechip">Search: {filtres.titre}</span> : null}
                  {filtres.type_poste ? (
                    <span className="jobs-studio-activechip">Contract: {formatContractLabel(filtres.type_poste)}</span>
                  ) : null}
                  {filtres.localisation ? <span className="jobs-studio-activechip">Location: {filtres.localisation}</span> : null}
                </>
              ) : (
                <span className="jobs-studio-activechip is-muted">No additional filters active</span>
              )}
            </div>
            <button
              type="button"
              className="jobs-studio-resetfilters"
              onClick={reinitialiserFiltres}
              disabled={!hasActiveFilters}
            >
              Reset filters
            </button>
          </div>
        ) : null}

        <div className="jobs-studio-resultsbar">
          <p className="jobs-studio-resultscount">
            <strong>{offresFiltered.length}</strong> jobs found
          </p>

          <div className="jobs-studio-resultsactions">
            <label className="jobs-studio-sorter">
              <span>Sort by:</span>
              <select value={tri} onChange={(event) => setTri(event.target.value as "recent" | "salary" | "deadline")}>
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
                <option value="deadline">Deadline soonest</option>
              </select>
            </label>

            <div className="jobs-studio-viewtoggle" aria-label="Change jobs layout" role="group">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : undefined}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <GridIcon className="jobs-studio-icon" />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : undefined}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <ListIcon className="jobs-studio-icon" />
              </button>
            </div>
          </div>
        </div>

        {offresFiltered.length === 0 ? (
          <div className="jobs-studio-empty">
            <div className="jobs-studio-emptyicon">
              <EmptyJobsIcon className="jobs-studio-emptyart" />
            </div>
            <h2>Aucune offre trouvée</h2>
            <p>Essayez de modifier vos filtres</p>
            <button type="button" className="jobs-studio-emptybutton" onClick={reinitialiserFiltres}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className={`jobs-studio-grid ${viewMode === "list" ? "is-list" : ""}`}>
            {offresFiltered.map((offre) => {
              const estFavori = favoris.has(offre.id_offre);

              return (
                <article key={offre.id_offre} className="jobs-studio-card">
                  <div className="jobs-studio-cardtop">
                    <div className="jobs-studio-cardbadges">
                      <span className="jobs-studio-contractbadge">{formatContractLabel(offre.type_poste)}</span>
                      <span className="jobs-studio-statusbadge">
                        <span className="jobs-studio-statusdot" />
                        Active
                      </span>
                    </div>

                    {utilisateur?.role === "candidat" ? (
                      <button
                        type="button"
                        className={`jobs-studio-bookmark ${estFavori ? "is-active" : ""}`}
                        onClick={() => toggleFavori(offre.id_offre)}
                        aria-label={estFavori ? "Remove favorite" : "Save favorite"}
                        title={estFavori ? "Remove favorite" : "Save favorite"}
                      >
                        <BookmarkIcon className="jobs-studio-icon" />
                      </button>
                    ) : (
                      <span className="jobs-studio-bookmark is-static" aria-hidden="true">
                        <BookmarkIcon className="jobs-studio-icon" />
                      </span>
                    )}
                  </div>

                  <div className="jobs-studio-cardbody">
                    <h2 className="jobs-studio-cardtitle" title={offre.titre}>
                      {offre.titre}
                    </h2>
                    <p className="jobs-studio-cardcompany">
                      <LocationIcon className="jobs-studio-metaicon" />
                      <span>
                        {offre.nom_entreprise || "Company"} - {offre.localisation}
                      </span>
                    </p>
                    <p className="jobs-studio-cardsalary">
                      <SalaryIcon className="jobs-studio-metaicon" />
                      <span>{formatSalaryRange(offre)}</span>
                    </p>
                    <p className="jobs-studio-cardsnippet" title={offre.description}>
                      {offre.description}
                    </p>

                    <div className="jobs-studio-cardmeta">
                      <span>
                        <ExperienceIcon className="jobs-studio-metaicon" />
                        {formatExperienceLabel(offre.experience_requise)}
                      </span>
                      <span>
                        <UsersIcon className="jobs-studio-metaicon" />
                        {offre.candidatures_count}
                      </span>
                    </div>

                    <p className="jobs-studio-carddeadline">
                      <CalendarIcon className="jobs-studio-metaicon" />
                      <span>Deadline: {formatDeadline(offre.date_limite)}</span>
                    </p>
                  </div>

                  <div className="jobs-studio-cardactions">
                    <button type="button" className="jobs-studio-cardprimary" onClick={() => ouvrirDetailsOffre(offre)}>
                      View details
                    </button>
                    <button
                      type="button"
                      className="jobs-studio-cardsecondary"
                      onClick={() => ouvrirFormulaireCandidature(offre)}
                    >
                      Postuler
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {offreSelectionnee ? (
        <div
          aria-labelledby="application-modal-title"
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(15, 23, 42, 0.52)",
            backdropFilter: "blur(6px)",
          }}
          onClick={fermerFormulaireCandidature}
        >
          <Card
            padding="lg"
            style={{ width: "min(100%, 760px)", maxHeight: "min(90vh, 820px)", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <form className="stack-lg" onSubmit={postuler}>
              <div className="page-header-actions" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="badge" style={{ marginBottom: "12px" }}>
                    Application
                  </p>
                  <h2 id="application-modal-title" style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>
                    Apply to {offreSelectionnee.titre}
                  </h2>
                  <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                    Review the role details and attach your CV to this specific offer before sending your application.
                  </p>
                </div>
                <Button variant="ghost" onClick={fermerFormulaireCandidature} disabled={envoiCandidature}>
                  Close
                </Button>
              </div>

              <Card tone="accent" padding="md">
                <div style={{ display: "grid", gap: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontFamily: "var(--app-heading)" }}>
                    {offreSelectionnee.nom_entreprise || "Company"}
                  </h3>
                  <p className="texte-secondaire" style={{ margin: 0 }}>
                    {offreSelectionnee.localisation} - {offreSelectionnee.type_poste.toUpperCase()}
                  </p>
                  <p style={{ margin: 0, color: "var(--app-primary)", fontWeight: 700 }}>
                    {formatSalaryAmount(offreSelectionnee.salaire_min)} - {formatSalaryAmount(offreSelectionnee.salaire_max)} TND
                  </p>
                  <p className="texte-secondaire" style={{ margin: 0 }}>
                    {offreSelectionnee.description}
                  </p>
                </div>
              </Card>

              <div style={{ display: "grid", gap: "10px" }}>
                <label htmlFor="application-cv" style={{ fontWeight: 700 }}>
                  CV attachment *
                </label>
                <input
                  id="application-cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    setCvFile(event.target.files?.[0] || null);
                    setCvFieldTouched(true);
                    if (erreurCandidature === CV_REQUIS_MESSAGE) {
                      setErreurCandidature(null);
                    }
                  }}
                  onBlur={() => setCvFieldTouched(true)}
                  className="champ"
                  disabled={envoiCandidature}
                  aria-invalid={cvFieldError ? "true" : "false"}
                  aria-describedby={cvFieldError ? "application-cv-help application-cv-error" : "application-cv-help"}
                  style={
                    cvFieldError
                      ? {
                          borderColor: "#c62828",
                          boxShadow: "0 0 0 3px rgba(198, 40, 40, 0.14)",
                        }
                      : undefined
                  }
                  required
                />
                <p id="application-cv-help" className="texte-secondaire" style={{ margin: 0 }}>
                  Required for this application. This file will be attached to this offer. Accepted formats: PDF, DOC, DOCX.
                </p>
                {cvFile ? (
                  <p className="texte-secondaire" style={{ margin: 0, color: "var(--app-primary)", fontWeight: 700 }}>
                    Selected file: {cvFile.name}
                  </p>
                ) : null}
                {cvFieldError ? (
                  <p
                    id="application-cv-error"
                    style={{ margin: 0, color: "#c62828", fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    {cvFieldError}
                  </p>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <label htmlFor="lettre-motivation" style={{ fontWeight: 700 }}>
                  Motivation note
                </label>
                <textarea
                  id="lettre-motivation"
                  value={lettreMotivation}
                  onChange={(event) => setLettreMotivation(event.target.value)}
                  placeholder="Share the skills, experience, or accommodations that make this role a good fit."
                  className="champ"
                  rows={8}
                  maxLength={2000}
                  disabled={envoiCandidature}
                  style={{ minHeight: "220px", resize: "vertical" }}
                />
                <p className="texte-secondaire" style={{ margin: 0 }}>
                  Optional, but recommended. {lettreMotivation.length}/2000 characters.
                </p>
              </div>

              {erreurCandidature ? <div className="message message-erreur">{erreurCandidature}</div> : null}

              <div className="page-header-actions" style={{ justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={fermerFormulaireCandidature} disabled={envoiCandidature}>
                  Cancel
                </Button>
                <Button type="submit" disabled={envoiCandidature || !cvFile}>
                  {envoiCandidature ? "Sending..." : "Send application"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {offreEnDetails ? (
        <div
          aria-labelledby="job-details-modal-title"
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(15, 23, 42, 0.52)",
            backdropFilter: "blur(6px)",
          }}
          onClick={fermerDetailsOffre}
        >
          <Card
            padding="lg"
            style={{ width: "min(100%, 820px)", maxHeight: "min(90vh, 860px)", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg">
              <div className="page-header-actions" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="badge" style={{ marginBottom: "12px" }}>
                    Role details
                  </p>
                  <h2 id="job-details-modal-title" style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>
                    {offreEnDetails.titre}
                  </h2>
                  <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                    {offreEnDetails.nom_entreprise || "Company"} - {offreEnDetails.localisation}
                  </p>
                </div>
                <Button variant="ghost" onClick={fermerDetailsOffre}>
                  Close
                </Button>
              </div>

              <Card tone="accent" padding="md">
                <div className="details-grid">
                  <div className="detail-box">
                    <strong>Contract type</strong>
                    <p>{offreEnDetails.type_poste.toUpperCase()}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Salary range</strong>
                    <p>
                      {formatSalaryAmount(offreEnDetails.salaire_min)} - {formatSalaryAmount(offreEnDetails.salaire_max)} TND
                    </p>
                  </div>
                  <div className="detail-box">
                    <strong>Applications</strong>
                    <p>{offreEnDetails.candidatures_count}</p>
                  </div>
                </div>
              </Card>

              <div className="detail-box">
                <strong>Description</strong>
                <p>{offreEnDetails.description}</p>
              </div>

              <Card tone="accent" padding="md">
                <div style={{ display: "grid", gap: "10px" }}>
                  <strong>Lecture vocale</strong>
                  <TextToSpeechButton
                    text={buildOfferSpeechContent(
                      offreEnDetails,
                      summaryByOfferId[offreEnDetails.id_offre],
                    )}
                  />
                </div>
              </Card>

              <Card tone="accent" padding="md">
                <div className="stack-lg">
                  <div className="page-header-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Résumé simplifié (IA)</strong>
                    <Button
                      variant="secondary"
                      onClick={() => void resumerOffre(offreEnDetails)}
                      disabled={summaryLoadingOfferId === offreEnDetails.id_offre}
                    >
                      {summaryLoadingOfferId === offreEnDetails.id_offre ? "Résumé en cours..." : "Résumer l’offre"}
                    </Button>
                  </div>

                  {summaryErrorByOfferId[offreEnDetails.id_offre] ? (
                    <div className="message message-erreur">{summaryErrorByOfferId[offreEnDetails.id_offre]}</div>
                  ) : null}

                  {summaryByOfferId[offreEnDetails.id_offre] ? (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.7,
                        border: "1px solid var(--app-border)",
                        borderRadius: "14px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {summaryByOfferId[offreEnDetails.id_offre]}
                    </div>
                  ) : (
                    <p className="texte-secondaire" style={{ margin: 0 }}>
                      Cliquez sur le bouton pour générer un résumé simple et accessible.
                    </p>
                  )}
                </div>
              </Card>

              <div className="details-grid">
                <div className="detail-box">
                  <strong>Required skills</strong>
                  <p>{offreEnDetails.competences_requises || "Not specified"}</p>
                </div>
                <div className="detail-box">
                  <strong>Experience</strong>
                  <p>{offreEnDetails.experience_requise || "Not specified"}</p>
                </div>
                <div className="detail-box">
                  <strong>Education</strong>
                  <p>{offreEnDetails.niveau_etude || "Not specified"}</p>
                </div>
                <div className="detail-box">
                  <strong>Deadline</strong>
                  <p>{offreEnDetails.date_limite ? new Date(offreEnDetails.date_limite).toLocaleDateString() : "Open until filled"}</p>
                </div>
              </div>

              <div className="page-header-actions" style={{ justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={fermerDetailsOffre}>
                  Close
                </Button>
                <Button onClick={() => ouvrirFormulaireDepuisDetails(offreEnDetails)}>Postuler</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <style jsx global>{jobsStudioScopedStyles}</style>
    </div>
  );

  if (loading) {
    return utilisateur ? (
      <AppShell utilisateur={utilisateur}>
        <LoadingState title="Loading roles" description="Collecting the latest opportunities for the refreshed job board." />
      </AppShell>
    ) : (
      <main className="page-centree section-page app-theme">
        <LoadingState title="Loading roles" description="Collecting the latest opportunities for the refreshed job board." />
      </main>
    );
  }

  return utilisateur ? <AppShell utilisateur={utilisateur}>{contenu}</AppShell> : <main className="page-centree section-page app-theme">{contenu}</main>;
}
