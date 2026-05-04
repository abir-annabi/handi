"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type CvTemplate = "classic" | "modern" | "sidebar";

type CvTheme = {
  id: string;
  name: string;
  primary: string;
  surface: string;
  accent: string;
};

type CvExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  details: string;
};

type CvEducation = {
  id: string;
  diploma: string;
  school: string;
  period: string;
  details: string;
};

type CvProject = {
  id: string;
  title: string;
  period: string;
  details: string;
};

type CvAchievement = {
  id: string;
  title: string;
  details: string;
};

type CvVolunteer = {
  id: string;
  role: string;
  organization: string;
  period: string;
  details: string;
};

type CvFormState = {
  fullName: string;
  title: string;
  headline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  objective: string;
  skills: string;
  languages: string;
  certifications: string;
  template: CvTemplate;
  colorThemeId: string;
  experiences: CvExperience[];
  education: CvEducation[];
  projects: CvProject[];
  achievements: CvAchievement[];
  volunteer: CvVolunteer[];
};

const STORAGE_KEY = "candidate_cv_builder_v1";

const themes: CvTheme[] = [
  { id: "handitalents", name: "HandiTalents", primary: "#2f2458", surface: "#f3edff", accent: "#6d2a95" },
  { id: "midnight", name: "Midnight", primary: "#1f2a44", surface: "#eef2ff", accent: "#5669ff" },
  { id: "emerald", name: "Emerald", primary: "#184f46", surface: "#eefaf6", accent: "#2aa889" },
  { id: "sunrise", name: "Sunrise", primary: "#7f3d2f", surface: "#fff4ee", accent: "#ee7b4c" },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createExperience(): CvExperience {
  return { id: createId("exp"), role: "", company: "", period: "", details: "" };
}

function createEducation(): CvEducation {
  return { id: createId("edu"), diploma: "", school: "", period: "", details: "" };
}

function createProject(): CvProject {
  return { id: createId("proj"), title: "", period: "", details: "" };
}

function createDefaultState(): CvFormState {
  return {
    fullName: "Mohamed Djeddi",
    title: "UX/UI Designer",
    headline: "Creating inclusive digital experiences",
    email: "mohamed.djeddi@mail.com",
    phone: "+33 6 12 34 56 78",
    address: "Lyon, France",
    website: "mohameddjeddi.com",
    linkedin: "linkedin.com/in/mohamed-djeddi",
    github: "github.com/mohamed-djeddi",
    summary:
      "Passionate UX/UI Designer with 4+ years of experience creating accessible, user-centered digital products. I love solving problems with empathy and creating meaningful experiences.",
    objective: "I am looking for a full-time position.",
    skills: "UI Design\nUX Research\nFigma\nPrototyping\nAccessibility\nUser Testing",
    languages: "French - Native\nEnglish - Native",
    certifications: "Google UX Design Professional Certificate - 2023\nAccessibility Fundamentals - 2022",
    template: "sidebar",
    colorThemeId: "handitalents",
    experiences: [
      {
        id: createId("exp"),
        role: "UX/UI Designer",
        company: "Webelite Agency",
        period: "2021 - Present",
        details:
          "Designed and prototyped accessible web and mobile interfaces, collaborated with developers, and tested improvements with users.",
      },
      {
        id: createId("exp"),
        role: "Junior UX Designer",
        company: "Digital House",
        period: "2019 - 2021",
        details:
          "Supported design systems, prepared wireframes, and contributed to research and usability sessions.",
      },
    ],
    education: [
      {
        id: createId("edu"),
        diploma: "Master in Digital Design",
        school: "Universite Lyon 2",
        period: "2017 - 2019",
        details: "Interaction design, product strategy, and accessible service design.",
      },
      {
        id: createId("edu"),
        diploma: "Bachelor in Graphic Design",
        school: "Universite Lyon 2",
        period: "2014 - 2017",
        details: "Visual communication, typography, and design fundamentals.",
      },
    ],
    projects: [
      {
        id: createId("proj"),
        title: "FitTrack App",
        period: "2024",
        details: "Mobile fitness application focused on healthy habits and accessible activity tracking.",
      },
      {
        id: createId("proj"),
        title: "EduPlatform",
        period: "2023",
        details: "Learning platform for students and teachers with improved navigation and content clarity.",
      },
    ],
    achievements: [
      {
        id: createId("achievement"),
        title: "Accessibility first",
        details: "Led inclusive interface reviews and helped improve focus states, contrast, and keyboard flows.",
      },
    ],
    volunteer: [
      {
        id: createId("volunteer"),
        role: "Mentor",
        organization: "Design Community",
        period: "2022 - Present",
        details: "Mentor junior designers on portfolio building and accessible interface design.",
      },
    ],
  };
}

function createAchievement(): CvAchievement {
  return { id: createId("achievement"), title: "", details: "" };
}

function createVolunteer(): CvVolunteer {
  return { id: createId("volunteer"), role: "", organization: "", period: "", details: "" };
}

function normalizeCvState(value: unknown): CvFormState {
  const defaults = createDefaultState();
  const data = (value && typeof value === "object" ? value : {}) as Partial<CvFormState>;

  return {
    ...defaults,
    ...data,
    fullName: typeof data.fullName === "string" ? data.fullName : defaults.fullName,
    title: typeof data.title === "string" ? data.title : defaults.title,
    headline: typeof data.headline === "string" ? data.headline : defaults.headline,
    email: typeof data.email === "string" ? data.email : defaults.email,
    phone: typeof data.phone === "string" ? data.phone : defaults.phone,
    address: typeof data.address === "string" ? data.address : defaults.address,
    website: typeof data.website === "string" ? data.website : defaults.website,
    linkedin: typeof data.linkedin === "string" ? data.linkedin : defaults.linkedin,
    github: typeof data.github === "string" ? data.github : defaults.github,
    summary: typeof data.summary === "string" ? data.summary : defaults.summary,
    objective: typeof data.objective === "string" ? data.objective : defaults.objective,
    skills: typeof data.skills === "string" ? data.skills : defaults.skills,
    languages: typeof data.languages === "string" ? data.languages : defaults.languages,
    certifications: typeof data.certifications === "string" ? data.certifications : defaults.certifications,
    template: data.template === "classic" || data.template === "modern" || data.template === "sidebar" ? data.template : defaults.template,
    colorThemeId: typeof data.colorThemeId === "string" ? data.colorThemeId : defaults.colorThemeId,
    experiences: Array.isArray(data.experiences) ? data.experiences : defaults.experiences,
    education: Array.isArray(data.education) ? data.education : defaults.education,
    projects: Array.isArray(data.projects) ? data.projects : defaults.projects,
    achievements: Array.isArray(data.achievements) ? data.achievements : defaults.achievements,
    volunteer: Array.isArray(data.volunteer) ? data.volunteer : defaults.volunteer,
  };
}

function parseList(value: string | undefined | null) {
  return (value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safe = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  return {
    r: parseInt(safe.slice(0, 2), 16) / 255,
    g: parseInt(safe.slice(2, 4), 16) / 255,
    b: parseInt(safe.slice(4, 6), 16) / 255,
  };
}

function splitTextForPdf(text: string, fontSize: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }

  const averageCharWidth = fontSize * 0.52;
  const maxChars = Math.max(12, Math.floor(maxWidth / averageCharWidth));
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(remaining.slice(0, maxChars - 1) + "-");
      remaining = remaining.slice(maxChars - 1);
    }
    current = remaining;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function sectionTitle(title: string, theme: CvTheme) {
  return `<h2 style="margin:0 0 12px;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:${theme.primary};border-bottom:2px solid ${theme.accent};padding-bottom:6px;">${escapeHtml(title)}</h2>`;
}

function buildCvHtml(cv: CvFormState, theme: CvTheme) {
  const skills = parseList(cv.skills);
  const languages = parseList(cv.languages);
  const certifications = parseList(cv.certifications);
  const experiences = cv.experiences.filter((item) => item.role || item.company || item.details);
  const education = cv.education.filter((item) => item.diploma || item.school || item.details);
  const projects = cv.projects.filter((item) => item.title || item.details);
  const achievements = cv.achievements.filter((item) => item.title || item.details);
  const volunteer = cv.volunteer.filter((item) => item.role || item.organization || item.details);

  const header = `
    <header style="padding:28px 32px;background:${cv.template === "classic" ? "#fff" : theme.surface};border-bottom:3px solid ${theme.accent};">
      <h1 style="margin:0;color:${theme.primary};font-size:34px;">${escapeHtml(cv.fullName || "Your Name")}</h1>
      <p style="margin:8px 0 0;color:#334155;font-size:18px;">${escapeHtml(cv.title || "Professional Title")}</p>
      ${cv.headline ? `<p style="margin:8px 0 0;color:${theme.accent};font-size:14px;font-weight:600;">${escapeHtml(cv.headline)}</p>` : ""}
      <p style="margin:14px 0 0;color:#475569;font-size:14px;">${[cv.email, cv.phone, cv.address, cv.website, cv.linkedin, cv.github].filter(Boolean).map(escapeHtml).join(" | ")}</p>
    </header>
  `;

  const summary = cv.summary
    ? `<section>${sectionTitle("Professional Summary", theme)}<p style="margin:0;color:#334155;line-height:1.7;">${escapeHtml(cv.summary)}</p></section>`
    : "";

  const objective = cv.objective
    ? `<section>${sectionTitle("Career Objective", theme)}<p style="margin:0;color:#334155;line-height:1.7;">${escapeHtml(cv.objective)}</p></section>`
    : "";

  const expHtml = experiences.length
    ? `<section>${sectionTitle("Experience", theme)}${experiences
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.company || "Company")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const eduHtml = education.length
    ? `<section>${sectionTitle("Education", theme)}${education
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.diploma || "Diploma")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.school || "School")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const projectHtml = projects.length
    ? `<section>${sectionTitle("Projects", theme)}${projects
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.title || "Project")}</strong>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const achievementHtml = achievements.length
    ? `<section>${sectionTitle("Achievements", theme)}${achievements
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.title || "Achievement")}</strong>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const volunteerHtml = volunteer.length
    ? `<section>${sectionTitle("Volunteer", theme)}${volunteer
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.organization || "Organization")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const sidebarLists = [
    skills.length ? `<section>${sectionTitle("Skills", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${skills.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
    languages.length ? `<section>${sectionTitle("Languages", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${languages.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
    certifications.length ? `<section>${sectionTitle("Certifications", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${certifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
  ].join("");

  const mainSections = [summary, objective, expHtml, eduHtml, projectHtml, achievementHtml, volunteerHtml].join("");

  const content =
    cv.template === "sidebar"
      ? `
      <div style="display:grid;grid-template-columns:250px 1fr;min-height:900px;">
        <aside style="background:${theme.surface};padding:28px 24px;display:flex;flex-direction:column;gap:24px;">${sidebarLists}</aside>
        <main style="padding:28px 32px;display:flex;flex-direction:column;gap:26px;">${mainSections}</main>
      </div>`
      : `
      <main style="padding:28px 32px;display:grid;grid-template-columns:${cv.template === "modern" ? "1.4fr 0.8fr" : "1fr"};gap:28px;">
        <div style="display:flex;flex-direction:column;gap:26px;">${mainSections}</div>
        ${cv.template === "modern" ? `<aside style="display:flex;flex-direction:column;gap:24px;">${sidebarLists}</aside>` : ""}
      </main>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cv.fullName || "CV")}</title>
    <style>
      body { margin:0; background:#e2e8f0; font-family: Georgia, "Times New Roman", serif; }
      .page { width:210mm; min-height:297mm; margin:24px auto; background:#fff; box-shadow:0 20px 40px rgba(15,23,42,0.12); }
      * { box-sizing:border-box; }
      @media print {
        body { background:#fff; }
        .page { width:auto; min-height:auto; margin:0; box-shadow:none; }
      }
    </style>
  </head>
  <body>
    <div class="page">${header}${content}</div>
    <script>window.onload = () => { window.focus(); };</script>
  </body>
  </html>`;
}

function buildCvPdfBlob(cv: CvFormState, theme: CvTheme) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 44;
  const headerHeight = 92;
  const contentWidth = pageWidth - margin * 2;
  const themeRgb = hexToRgb(theme.primary);
  const accentRgb = hexToRgb(theme.accent);
  const mutedRgb = { r: 0.29, g: 0.33, b: 0.38 };
  const darkRgb = { r: 0.07, g: 0.09, b: 0.12 };
  const pages: string[] = [];
  let currentPage = "";
  let y = pageHeight - margin;

  const beginPage = () => {
    currentPage = [
      `${themeRgb.r.toFixed(3)} ${themeRgb.g.toFixed(3)} ${themeRgb.b.toFixed(3)} rg`,
      `0 ${pageHeight - headerHeight} ${pageWidth} ${headerHeight} re f`,
      "BT",
      "/F2 24 Tf",
      "1 1 1 rg",
      `1 0 0 1 ${margin} ${pageHeight - 54} Tm`,
      `(${escapePdfText(cv.fullName || "Your Name")}) Tj`,
      "ET",
      "BT",
      "/F1 12 Tf",
      "1 1 1 rg",
      `1 0 0 1 ${margin} ${pageHeight - 74} Tm`,
      `(${escapePdfText([cv.title, cv.email, cv.phone].filter(Boolean).join(" | ") || "Professional Title")}) Tj`,
      "ET",
    ].join("\n");
    y = pageHeight - headerHeight - 28;
  };

  const pushPage = () => {
    pages.push(currentPage);
    currentPage = "";
  };

  const ensureSpace = (heightNeeded: number) => {
    if (!currentPage) {
      beginPage();
      return;
    }

    if (y - heightNeeded < margin) {
      pushPage();
      beginPage();
    }
  };

  const addTextLine = (text: string, options?: { size?: number; font?: "F1" | "F2"; color?: { r: number; g: number; b: number }; x?: number }) => {
    const size = options?.size ?? 11;
    const font = options?.font ?? "F1";
    const color = options?.color ?? darkRgb;
    const x = options?.x ?? margin;

    ensureSpace(size + 8);
    currentPage += `\nBT\n/${font} ${size} Tf\n${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} rg\n1 0 0 1 ${x} ${y} Tm\n(${escapePdfText(text)}) Tj\nET`;
    y -= size + 6;
  };

  const addWrappedParagraph = (text: string, options?: { size?: number; x?: number; width?: number; color?: { r: number; g: number; b: number } }) => {
    const size = options?.size ?? 11;
    const x = options?.x ?? margin;
    const width = options?.width ?? contentWidth;
    const color = options?.color ?? mutedRgb;
    const lines = splitTextForPdf(text, size, width);

    for (const line of lines) {
      addTextLine(line, { size, font: "F1", color, x });
    }
  };

  const addSection = (title: string) => {
    ensureSpace(28);
    y -= 4;
    addTextLine(title.toUpperCase(), { size: 13, font: "F2", color: accentRgb });
    currentPage += `\n${accentRgb.r.toFixed(3)} ${accentRgb.g.toFixed(3)} ${accentRgb.b.toFixed(3)} RG\n${margin} ${y + 2} ${contentWidth} 0 l S`;
    y -= 6;
  };

  beginPage();

  const headerMeta = [cv.address, cv.website, cv.linkedin, cv.github].filter(Boolean).join(" | ");
  if (headerMeta) {
    addTextLine(headerMeta, { size: 10, color: mutedRgb });
    y -= 4;
  }

  if (cv.summary.trim()) {
    addSection("Professional Summary");
    addWrappedParagraph(cv.summary);
    y -= 4;
  }

  if (cv.objective.trim()) {
    addSection("Career Objective");
    addWrappedParagraph(cv.objective);
    y -= 4;
  }

  const experiences = cv.experiences.filter((item) => item.role || item.company || item.details);
  if (experiences.length) {
    addSection("Experience");
    for (const item of experiences) {
      addTextLine(`${item.role || "Role"}${item.company ? ` - ${item.company}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const education = cv.education.filter((item) => item.diploma || item.school || item.details);
  if (education.length) {
    addSection("Education");
    for (const item of education) {
      addTextLine(`${item.diploma || "Diploma"}${item.school ? ` - ${item.school}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const projects = cv.projects.filter((item) => item.title || item.details);
  if (projects.length) {
    addSection("Projects");
    for (const item of projects) {
      addTextLine(item.title || "Project", { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const achievements = cv.achievements.filter((item) => item.title || item.details);
  if (achievements.length) {
    addSection("Achievements");
    for (const item of achievements) {
      addTextLine(item.title || "Achievement", { size: 12, font: "F2", color: darkRgb });
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const volunteer = cv.volunteer.filter((item) => item.role || item.organization || item.details);
  if (volunteer.length) {
    addSection("Volunteer");
    for (const item of volunteer) {
      addTextLine(`${item.role || "Role"}${item.organization ? ` - ${item.organization}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const listSections = [
    { title: "Skills", items: parseList(cv.skills) },
    { title: "Languages", items: parseList(cv.languages) },
    { title: "Certifications", items: parseList(cv.certifications) },
  ];

  for (const section of listSections) {
    if (!section.items.length) {
      continue;
    }

    addSection(section.title);
    for (const item of section.items) {
      addWrappedParagraph(`• ${item}`);
    }
    y -= 4;
  }

  if (currentPage) {
    pushPage();
  }

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const contentIds = pages.map((page) =>
    addObject(`<< /Length ${page.length} >>\nstream\n${page}\nendstream`),
  );
  const pageIds = contentIds.map((contentId) =>
    addObject(`<< /Type /Page /Parent PAGES_REF 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`),
  );
  const pagesId = addObject(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const resolvedObjects = objects.map((content) => content.replaceAll("PAGES_REF", String(pagesId)));
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  resolvedObjects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${resolvedObjects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${resolvedObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export default function CandidateCvPage() {
  const [cv, setCv] = useState<CvFormState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [activeStep, setActiveStep] = useState<CvStepId>("profile");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = useState(100);
  const [fontScale, setFontScale] = useState<0.94 | 1 | 1.08>(1);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [recruiterView, setRecruiterView] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const nextCv = saved ? normalizeCvState(JSON.parse(saved)) : createDefaultState();
      setCv(nextCv);
      setPreviewHtml(buildCvHtml(nextCv, themes.find((theme) => theme.id === nextCv.colorThemeId) ?? themes[0]));
    } catch {
      const fallbackCv = createDefaultState();
      setCv(fallbackCv);
      setPreviewHtml(buildCvHtml(fallbackCv, themes[0]));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
  }, [cv, hydrated]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === cv.colorThemeId) ?? themes[0],
    [cv.colorThemeId],
  );

  const stepCompletion = useMemo(() => getStepCompletion(cv), [cv]);
  const activeStepIndex = CV_STEPS.findIndex((step) => step.id === activeStep);
  const completedSteps = CV_STEPS.filter((step) => stepCompletion[step.id]).length;
  const progressPercent = Math.round(((activeStepIndex + 1) / CV_STEPS.length) * 100);
  const completionPercent = Math.round((completedSteps / CV_STEPS.length) * 100);
  const skillTags = parseSkillTags(cv.skills);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewHtml(buildCvHtml(cv, activeTheme));
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [activeTheme, cv, hydrated]);

  const updateField = <K extends keyof CvFormState>(key: K, value: CvFormState[K]) => {
    setCv((current) => ({ ...current, [key]: value }));
  };

  const downloadPdf = () => {
    const blob = buildCvPdfBlob(cv, activeTheme);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(cv.fullName || "candidate-cv").trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    setMessage("CV PDF downloaded successfully.");
  };

  const saveDraft = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    setMessage("Draft saved locally.");
  };

  const resetBuilder = () => {
    const nextCv = createDefaultState();
    setCv(nextCv);
    setPreviewHtml(buildCvHtml(nextCv, themes[0]));
    setActiveStep("profile");
    setMessage("A fresh premium draft is ready.");
  };

  const handleAiPlaceholder = (label: string) => {
    setMessage(`${label} is a UI placeholder for now.`);
  };

  const goToNextStep = () => {
    const next = CV_STEPS[activeStepIndex + 1];
    if (next) {
      setActiveStep(next.id);
    }
  };

  const goToPreviousStep = () => {
    const previous = CV_STEPS[activeStepIndex - 1];
    if (previous) {
      setActiveStep(previous.id);
    }
  };

  if (!hydrated) {
    return <div className="p-6 text-sm text-slate-600">Loading your CV workspace...</div>;
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#140f23] text-white" : "bg-transparent text-slate-950"}`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      <div className="mx-auto max-w-[1760px] px-4 py-6 xl:px-6">
        {message ? (
          <div
            className={`mb-4 rounded-[20px] border px-4 py-3 text-sm shadow-soft ${darkMode ? "border-white/10 bg-white/10 text-white" : "border-[#e3daf9] bg-white/90 text-[#4a2d78]"}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Stepper steps={CV_STEPS} activeStep={activeStep} completed={stepCompletion} darkMode={darkMode} onStepChange={setActiveStep} />

            <div className={`rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(109,42,149,0.08)] ${darkMode ? "border-white/10 bg-white/5" : "border-white/80 bg-white/80"}`}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3e7ff] via-white to-[#efe4ff] text-2xl shadow-inner">🎧</div>
              <h3 className="text-lg font-semibold">Need help?</h3>
              <p className={`mt-2 text-sm leading-6 ${darkMode ? "text-white/70" : "text-slate-500"}`}>
                Our accessible assistant is here to help you shape each section with confidence.
              </p>
              <button
                type="button"
                onClick={() => handleAiPlaceholder("Ask anything")}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#d8caf6] bg-white px-4 py-3 text-sm font-semibold text-[#6d2a95] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]"
              >
                Ask anything
              </button>
            </div>
          </aside>

          <section className="space-y-6">
            <HeaderHero
              darkMode={darkMode}
              progressPercent={progressPercent}
              activeStepIndex={activeStepIndex}
              completionPercent={completionPercent}
              fontScale={fontScale}
              highContrast={highContrast}
              onFontScaleChange={setFontScale}
              onHighContrastToggle={() => setHighContrast((current) => !current)}
              onDarkModeToggle={() => setDarkMode((current) => !current)}
              onAssistantClick={() => handleAiPlaceholder("AI Assistant")}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <StepFormArea
                  cv={cv}
                  activeStep={activeStep}
                  darkMode={darkMode}
                  highContrast={highContrast}
                  skillTags={skillTags}
                  onAiPlaceholder={handleAiPlaceholder}
                  onFieldChange={updateField}
                  onExperienceAdd={() => setCv((current) => ({ ...current, experiences: [...current.experiences, createExperience()] }))}
                  onEducationAdd={() => setCv((current) => ({ ...current, education: [...current.education, createEducation()] }))}
                  onProjectAdd={() => setCv((current) => ({ ...current, projects: [...current.projects, createProject()] }))}
                  onAchievementAdd={() => setCv((current) => ({ ...current, achievements: [...current.achievements, createAchievement()] }))}
                  onVolunteerAdd={() => setCv((current) => ({ ...current, volunteer: [...current.volunteer, createVolunteer()] }))}
                  onExperienceRemove={(id) => setCv((current) => ({ ...current, experiences: current.experiences.filter((item) => item.id !== id) }))}
                  onEducationRemove={(id) => setCv((current) => ({ ...current, education: current.education.filter((item) => item.id !== id) }))}
                  onProjectRemove={(id) => setCv((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== id) }))}
                  onAchievementRemove={(id) => setCv((current) => ({ ...current, achievements: current.achievements.filter((item) => item.id !== id) }))}
                  onVolunteerRemove={(id) => setCv((current) => ({ ...current, volunteer: current.volunteer.filter((item) => item.id !== id) }))}
                  onExperiencePatch={(id, patch) => setCv((current) => ({ ...current, experiences: updateById(current.experiences, id, patch) }))}
                  onEducationPatch={(id, patch) => setCv((current) => ({ ...current, education: updateById(current.education, id, patch) }))}
                  onProjectPatch={(id, patch) => setCv((current) => ({ ...current, projects: updateById(current.projects, id, patch) }))}
                  onAchievementPatch={(id, patch) => setCv((current) => ({ ...current, achievements: updateById(current.achievements, id, patch) }))}
                  onVolunteerPatch={(id, patch) => setCv((current) => ({ ...current, volunteer: updateById(current.volunteer, id, patch) }))}
                />

                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[28px] border px-5 py-4 shadow-[0_18px_45px_rgba(109,42,149,0.08)] ${darkMode ? "border-white/10 bg-white/5" : "border-white/80 bg-white/88"}`}>
                  <div>
                    <p className="text-base font-semibold">{CV_STEPS[activeStepIndex].title}</p>
                    <p className={`text-sm ${darkMode ? "text-white/70" : "text-slate-500"}`}>{activeStepIndex + 1} of {CV_STEPS.length} steps completed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={goToPreviousStep} disabled={activeStepIndex === 0} className="rounded-full border border-[#d8caf6] bg-white px-4 py-2 text-sm font-semibold text-[#6d2a95] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Previous</button>
                    <button type="button" onClick={goToNextStep} disabled={activeStepIndex === CV_STEPS.length - 1} className="rounded-full bg-gradient-to-r from-[#6d2a95] to-[#8d58d1] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,42,149,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(109,42,149,0.28)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Save & continue</button>
                  </div>
                </div>
              </div>

              <PreviewPanel
                darkMode={darkMode}
                highContrast={highContrast}
                previewHtml={previewHtml}
                previewMode={previewMode}
                recruiterView={recruiterView}
                template={cv.template}
                zoom={zoom}
                onRecruiterViewToggle={() => setRecruiterView((current) => !current)}
                onPreviewModeChange={setPreviewMode}
                onTemplateChange={() => {
                  const next = nextTemplate(cv.template);
                  setCv((current) => ({ ...current, template: next }));
                  setMessage(`Preview template switched to ${next}.`);
                }}
                onZoomIn={() => setZoom((current) => Math.min(130, current + 10))}
                onZoomOut={() => setZoom((current) => Math.max(80, current - 10))}
              />
            </div>

            <BottomActionBar
              darkMode={darkMode}
              completionPercent={completionPercent}
              activeStepTitle={CV_STEPS[activeStepIndex].title}
              completedSteps={completedSteps}
              onSaveDraft={saveDraft}
              onReset={resetBuilder}
              onDownload={downloadPdf}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

type CvStepId = "profile" | "skills" | "experience" | "education" | "projects" | "extras";

type StepMeta = {
  id: CvStepId;
  index: number;
  title: string;
  description: string;
  icon: string;
};

const CV_STEPS: StepMeta[] = [
  { id: "profile", index: 1, title: "Profile", description: "Tell us about yourself", icon: "👤" },
  { id: "skills", index: 2, title: "Skills", description: "Show your strengths", icon: "🧠" },
  { id: "experience", index: 3, title: "Experience", description: "Share your experience", icon: "💼" },
  { id: "education", index: 4, title: "Education", description: "Your academic journey", icon: "🎓" },
  { id: "projects", index: 5, title: "Projects", description: "Showcase your achievements", icon: "🚀" },
  { id: "extras", index: 6, title: "Extras", description: "More about you", icon: "💜" },
];

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

function parseSkillTags(value: string) {
  return parseList(value).slice(0, 8);
}

function getStepCompletion(cv: CvFormState) {
  const skills = parseList(cv.skills);
  const languages = parseList(cv.languages);

  return {
    profile: Boolean(cv.fullName.trim() && cv.title.trim() && isValidEmail(cv.email) && cv.summary.trim()),
    skills: Boolean(skills.length && languages.length),
    experience: cv.experiences.some((item) => item.role.trim() || item.company.trim() || item.details.trim()),
    education: cv.education.some((item) => item.diploma.trim() || item.school.trim()),
    projects: cv.projects.some((item) => item.title.trim() || item.details.trim()),
    extras: Boolean(
      cv.achievements.some((item) => item.title.trim() || item.details.trim()) ||
        cv.volunteer.some((item) => item.role.trim() || item.organization.trim()),
    ),
  } satisfies Record<CvStepId, boolean>;
}

function nextTemplate(template: CvTemplate): CvTemplate {
  const order: CvTemplate[] = ["sidebar", "modern", "classic"];
  const index = order.indexOf(template);
  return order[(index + 1) % order.length];
}

function HeaderHero({
  darkMode,
  progressPercent,
  activeStepIndex,
  completionPercent,
  fontScale,
  highContrast,
  onFontScaleChange,
  onHighContrastToggle,
  onDarkModeToggle,
  onAssistantClick,
}: {
  darkMode: boolean;
  progressPercent: number;
  activeStepIndex: number;
  completionPercent: number;
  fontScale: 0.94 | 1 | 1.08;
  highContrast: boolean;
  onFontScaleChange: (value: 0.94 | 1 | 1.08) => void;
  onHighContrastToggle: () => void;
  onDarkModeToggle: () => void;
  onAssistantClick: () => void;
}) {
  return (
    <header className={`overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_60px_rgba(109,42,149,0.12)] ${darkMode ? "border-white/10 bg-[rgba(255,255,255,0.06)]" : "border-white/90 bg-white/88"}`}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-center">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-[#f2e9ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#6d2a95]">HandiTalents CV Builder</div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-[clamp(2.1rem,4vw,3.6rem)] font-semibold leading-tight">Build your story, unlock opportunities ✨</h1>
                <p className={`mt-3 max-w-3xl text-base leading-7 ${darkMode ? "text-white/70" : "text-slate-500"}`}>Create a professional CV that truly reflects your talents.</p>
              </div>
              <AccessibilityPanel
                darkMode={darkMode}
                fontScale={fontScale}
                highContrast={highContrast}
                onFontScaleChange={onFontScaleChange}
                onHighContrastToggle={onHighContrastToggle}
                onDarkModeToggle={onDarkModeToggle}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#6d2a95]">Step {activeStepIndex + 1} of {CV_STEPS.length}</span>
              <span className="text-slate-500">{completionPercent}% completed</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#efe8ff]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6d2a95] to-[#b58aff] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <button type="button" onClick={onAssistantClick} className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#6d2a95] to-[#8f5ce2] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(109,42,149,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(109,42,149,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            AI Assistant
          </button>

          <div className="relative flex w-full justify-center xl:justify-end">
            <div className="absolute inset-y-10 right-12 hidden w-52 rounded-full bg-[radial-gradient(circle,_rgba(196,172,255,0.38),_rgba(255,255,255,0))] blur-2xl xl:block" />
            <Image src="/uploads/cv.png" alt="Illustration of a woman building her CV on a laptop" width={660} height={520} className="relative z-10 h-auto w-full max-w-[320px]" priority />
          </div>
        </div>
      </div>
    </header>
  );
}

function AccessibilityPanel({
  darkMode,
  fontScale,
  highContrast,
  onFontScaleChange,
  onHighContrastToggle,
  onDarkModeToggle,
}: {
  darkMode: boolean;
  fontScale: 0.94 | 1 | 1.08;
  highContrast: boolean;
  onFontScaleChange: (value: 0.94 | 1 | 1.08) => void;
  onHighContrastToggle: () => void;
  onDarkModeToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="flex items-center gap-2 rounded-full border border-[#e7ddfb] bg-white px-2 py-2 shadow-sm">
        {[
          { label: "A-", value: 0.94 as const },
          { label: "A", value: 1 as const },
          { label: "A+", value: 1.08 as const },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={fontScale === option.value}
            onClick={() => onFontScaleChange(option.value)}
            className={`rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${fontScale === option.value ? "bg-[#6d2a95] text-white" : "text-slate-600 hover:bg-[#f4edff]"}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button type="button" aria-pressed={highContrast} onClick={onHighContrastToggle} className={`rounded-full border px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${highContrast ? "border-[#6d2a95] bg-[#f3e7ff] text-[#6d2a95]" : "border-[#e7ddfb] bg-white text-slate-700"}`}>Contrast</button>
      <button type="button" aria-pressed={darkMode} onClick={onDarkModeToggle} className={`rounded-full border px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${darkMode ? "border-[#6d2a95] bg-[#2b214f] text-white" : "border-[#e7ddfb] bg-white text-slate-700"}`}>Dark mode</button>
    </div>
  );
}

function Stepper({
  steps,
  activeStep,
  completed,
  darkMode,
  onStepChange,
}: {
  steps: StepMeta[];
  activeStep: CvStepId;
  completed: Record<CvStepId, boolean>;
  darkMode: boolean;
  onStepChange: (step: CvStepId) => void;
}) {
  return (
    <nav aria-label="CV builder steps" className={`rounded-[32px] border p-4 shadow-[0_18px_45px_rgba(109,42,149,0.08)] ${darkMode ? "border-white/10 bg-white/5" : "border-white/88 bg-white/88"}`}>
      <ol className="space-y-3">
        {steps.map((step) => {
          const isActive = step.id === activeStep;
          const isCompleted = completed[step.id];

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`group flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${isActive ? "border-transparent bg-gradient-to-r from-[#6d2a95] to-[#b08af0] text-white shadow-[0_16px_35px_rgba(109,42,149,0.25)]" : darkMode ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-transparent bg-white/60 text-slate-900 hover:bg-[#fbf8ff]"}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-semibold transition ${isActive ? "bg-white/20 text-white" : isCompleted ? "bg-[#efe4ff] text-[#6d2a95]" : "bg-[#f6f0ff] text-[#6d2a95]"}`} aria-hidden="true">
                  {isCompleted ? "✓" : step.index}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{step.icon}</span>
                    <p className="font-semibold">{step.title}</p>
                  </div>
                  <p className={`mt-1 text-sm leading-6 ${isActive ? "text-white/80" : darkMode ? "text-white/65" : "text-slate-500"}`}>{step.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepFormArea({
  cv,
  activeStep,
  darkMode,
  highContrast,
  skillTags,
  onAiPlaceholder,
  onFieldChange,
  onExperienceAdd,
  onEducationAdd,
  onProjectAdd,
  onAchievementAdd,
  onVolunteerAdd,
  onExperienceRemove,
  onEducationRemove,
  onProjectRemove,
  onAchievementRemove,
  onVolunteerRemove,
  onExperiencePatch,
  onEducationPatch,
  onProjectPatch,
  onAchievementPatch,
  onVolunteerPatch,
}: {
  cv: CvFormState;
  activeStep: CvStepId;
  darkMode: boolean;
  highContrast: boolean;
  skillTags: string[];
  onAiPlaceholder: (label: string) => void;
  onFieldChange: <K extends keyof CvFormState>(key: K, value: CvFormState[K]) => void;
  onExperienceAdd: () => void;
  onEducationAdd: () => void;
  onProjectAdd: () => void;
  onAchievementAdd: () => void;
  onVolunteerAdd: () => void;
  onExperienceRemove: (id: string) => void;
  onEducationRemove: (id: string) => void;
  onProjectRemove: (id: string) => void;
  onAchievementRemove: (id: string) => void;
  onVolunteerRemove: (id: string) => void;
  onExperiencePatch: (id: string, patch: Partial<CvExperience>) => void;
  onEducationPatch: (id: string, patch: Partial<CvEducation>) => void;
  onProjectPatch: (id: string, patch: Partial<CvProject>) => void;
  onAchievementPatch: (id: string, patch: Partial<CvAchievement>) => void;
  onVolunteerPatch: (id: string, patch: Partial<CvVolunteer>) => void;
}) {
  const emailMessage = cv.email && !isValidEmail(cv.email) ? "Add a valid email so recruiters can contact you." : "";
  const phoneMessage = cv.phone && cv.phone.replace(/\D/g, "").length < 8 ? "A longer phone number would feel safer here." : "";

  if (activeStep === "profile") {
    return (
      <>
        <FormCard darkMode={darkMode} highContrast={highContrast} icon="👋" title="Let's start with the basics" description="This information helps create your professional identity." badge="Auto-save on">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Full name" value={cv.fullName} required onChange={(value) => onFieldChange("fullName", value)} />
            <InputField label="Professional title" value={cv.title} required onChange={(value) => onFieldChange("title", value)} />
            <div className="md:col-span-2">
              <InputField label="Headline / Tagline" value={cv.headline} helperText="Short and clear usually works best." onChange={(value) => onFieldChange("headline", value)} />
            </div>
          </div>

          <TipPanel title="Tip" text="A clear title helps recruiters understand your expertise at a glance." actionLabel="Get suggestions" onAction={() => onAiPlaceholder("Get suggestions")} />
        </FormCard>

        <FormCard darkMode={darkMode} highContrast={highContrast} icon="📬" title="Contact information" description="How can employers reach you?">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Email" value={cv.email} required validationMessage={emailMessage} onChange={(value) => onFieldChange("email", value)} />
            <InputField label="Phone" value={cv.phone} validationMessage={phoneMessage} onChange={(value) => onFieldChange("phone", value)} />
            <InputField label="Location" value={cv.address} required onChange={(value) => onFieldChange("address", value)} />
            <InputField label="Portfolio / Website" value={cv.website} onChange={(value) => onFieldChange("website", value)} />
            <InputField label="LinkedIn" value={cv.linkedin} onChange={(value) => onFieldChange("linkedin", value)} />
            <InputField label="GitHub" value={cv.github} onChange={(value) => onFieldChange("github", value)} />
          </div>
        </FormCard>

        <FormCard
          darkMode={darkMode}
          highContrast={highContrast}
          icon="✨"
          title="About / Summary"
          description="Tell us a little about yourself and your goals."
          action={<button type="button" onClick={() => onAiPlaceholder("Improve with AI")} className="rounded-full bg-gradient-to-r from-[#6d2a95] to-[#8d58d1] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(109,42,149,0.22)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Improve with AI</button>}
        >
          <FloatingTextArea label="Short bio" value={cv.summary} rows={5} helperText="Write in simple, human language. Avoid jargon when it does not help." onChange={(value) => onFieldChange("summary", value)} />
          <FloatingTextArea label="Career objective" value={cv.objective} rows={3} helperText="What type of opportunity are you looking for?" onChange={(value) => onFieldChange("objective", value)} />
        </FormCard>
      </>
    );
  }

  if (activeStep === "skills") {
    return (
      <>
        <FormCard
          darkMode={darkMode}
          highContrast={highContrast}
          icon="🧠"
          title="Show your strengths"
          description="Use one skill per line. We'll turn them into clean recruiter-friendly highlights."
          action={<button type="button" onClick={() => onAiPlaceholder("Suggest content")} className="rounded-full border border-[#d9caf4] bg-white px-4 py-2 text-sm font-semibold text-[#6d2a95] transition hover:bg-[#f7f1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Suggest content</button>}
        >
          <FloatingTextArea label="Skills" value={cv.skills} rows={7} helperText="One skill per line." onChange={(value) => onFieldChange("skills", value)} />
          <div className="flex flex-wrap gap-2">
            {skillTags.map((skill) => (
              <span key={skill} className="rounded-full bg-[#f3ebff] px-3 py-1.5 text-sm font-medium text-[#6d2a95]">{skill}</span>
            ))}
          </div>
          <TipPanel title="Tip" text="Mix hard skills and human strengths. Accessibility, communication, and problem solving all matter." />
        </FormCard>

        <FormCard darkMode={darkMode} highContrast={highContrast} icon="🌍" title="Languages and certifications" description="Support your profile with relevant languages and credentials.">
          <div className="grid gap-4 md:grid-cols-2">
            <FloatingTextArea label="Languages" value={cv.languages} rows={6} helperText="One language per line." onChange={(value) => onFieldChange("languages", value)} />
            <FloatingTextArea label="Certifications" value={cv.certifications} rows={6} helperText="One certificate per line." onChange={(value) => onFieldChange("certifications", value)} />
          </div>
        </FormCard>
      </>
    );
  }

  if (activeStep === "experience") {
    return (
      <TimelineSection<CvExperience>
        darkMode={darkMode}
        highContrast={highContrast}
        icon="💼"
        title="Experience"
        description="Add your work history in short, concrete impact statements."
        addLabel="Add experience"
        items={cv.experiences}
        onAdd={onExperienceAdd}
        onRemove={onExperienceRemove}
        renderItem={(item) => (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Role" value={item.role} onChange={(value) => onExperiencePatch(item.id, { role: value })} />
            <InputField label="Company" value={item.company} onChange={(value) => onExperiencePatch(item.id, { company: value })} />
            <InputField label="Period" value={item.period} onChange={(value) => onExperiencePatch(item.id, { period: value })} />
            <div />
            <div className="md:col-span-2">
              <FloatingTextArea label="Impact highlights" value={item.details} rows={4} onChange={(value) => onExperiencePatch(item.id, { details: value })} />
            </div>
          </div>
        )}
      />
    );
  }

  if (activeStep === "education") {
    return (
      <TimelineSection<CvEducation>
        darkMode={darkMode}
        highContrast={highContrast}
        icon="🎓"
        title="Education"
        description="Include degrees, training, and meaningful academic milestones."
        addLabel="Add education"
        items={cv.education}
        onAdd={onEducationAdd}
        onRemove={onEducationRemove}
        renderItem={(item) => (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Diploma / program" value={item.diploma} onChange={(value) => onEducationPatch(item.id, { diploma: value })} />
            <InputField label="School / institution" value={item.school} onChange={(value) => onEducationPatch(item.id, { school: value })} />
            <InputField label="Period" value={item.period} onChange={(value) => onEducationPatch(item.id, { period: value })} />
            <div />
            <div className="md:col-span-2">
              <FloatingTextArea label="Details" value={item.details} rows={4} onChange={(value) => onEducationPatch(item.id, { details: value })} />
            </div>
          </div>
        )}
      />
    );
  }

  if (activeStep === "projects") {
    return (
      <TimelineSection<CvProject>
        darkMode={darkMode}
        highContrast={highContrast}
        icon="🚀"
        title="Projects"
        description="Show practical work, portfolio pieces, or problem-solving projects."
        addLabel="Add project"
        items={cv.projects}
        onAdd={onProjectAdd}
        onRemove={onProjectRemove}
        renderItem={(item) => (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Project title" value={item.title} onChange={(value) => onProjectPatch(item.id, { title: value })} />
            <InputField label="Period" value={item.period} onChange={(value) => onProjectPatch(item.id, { period: value })} />
            <div className="md:col-span-2">
              <FloatingTextArea label="What did you build?" value={item.details} rows={4} onChange={(value) => onProjectPatch(item.id, { details: value })} />
            </div>
          </div>
        )}
      />
    );
  }

  return (
    <>
      <TimelineSection<CvAchievement>
        darkMode={darkMode}
        highContrast={highContrast}
        icon="🏆"
        title="Achievements"
        description="Highlight awards, certifications, or meaningful outcomes."
        addLabel="Add achievement"
        items={cv.achievements}
        onAdd={onAchievementAdd}
        onRemove={onAchievementRemove}
        renderItem={(item) => (
          <div className="grid gap-4">
            <InputField label="Achievement title" value={item.title} onChange={(value) => onAchievementPatch(item.id, { title: value })} />
            <FloatingTextArea label="Why it matters" value={item.details} rows={3} onChange={(value) => onAchievementPatch(item.id, { details: value })} />
          </div>
        )}
      />

      <TimelineSection<CvVolunteer>
        darkMode={darkMode}
        highContrast={highContrast}
        icon="🤝"
        title="Extras"
        description="Community work, volunteer roles, and additional context can make your story richer."
        addLabel="Add extra"
        items={cv.volunteer}
        onAdd={onVolunteerAdd}
        onRemove={onVolunteerRemove}
        renderItem={(item) => (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Role" value={item.role} onChange={(value) => onVolunteerPatch(item.id, { role: value })} />
            <InputField label="Organization" value={item.organization} onChange={(value) => onVolunteerPatch(item.id, { organization: value })} />
            <InputField label="Period" value={item.period} onChange={(value) => onVolunteerPatch(item.id, { period: value })} />
            <div />
            <div className="md:col-span-2">
              <FloatingTextArea label="Contribution" value={item.details} rows={4} onChange={(value) => onVolunteerPatch(item.id, { details: value })} />
            </div>
          </div>
        )}
      />
    </>
  );
}

function FormCard({
  icon,
  title,
  description,
  badge,
  action,
  darkMode,
  highContrast,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  action?: ReactNode;
  darkMode: boolean;
  highContrast: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-[30px] border p-6 shadow-[0_18px_45px_rgba(109,42,149,0.08)] transition ${darkMode ? "border-white/10 bg-white/5" : "border-white/90 bg-white/88"} ${highContrast ? "ring-2 ring-[#6d2a95]/70" : ""}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <h2 className="text-[1.45rem] font-semibold tracking-tight">{title}</h2>
          </div>
          <p className={`max-w-2xl text-sm leading-6 ${darkMode ? "text-white/70" : "text-slate-500"}`}>{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {badge ? <span className="rounded-full bg-[#eef8f0] px-3 py-1 text-xs font-semibold text-emerald-600">{badge}</span> : null}
          {action}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TipPanel({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#e9ddfb] bg-gradient-to-r from-[#fcf9ff] to-[#f4ecff] px-5 py-4">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#6d2a95]">
          <span aria-hidden="true">💡</span>
          {title}
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">{text}</p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="rounded-full bg-gradient-to-r from-[#6d2a95] to-[#8d58d1] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(109,42,149,0.22)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  helperText,
  validationMessage,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  validationMessage?: string;
  required?: boolean;
}) {
  const hasValue = value.trim().length > 0;
  return (
    <label className="block">
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          aria-label={label}
          aria-invalid={Boolean(validationMessage)}
          className="peer w-full rounded-[20px] border border-[#e6dcfb] bg-white px-4 pb-3 pt-6 text-sm text-slate-900 shadow-[0_10px_25px_rgba(109,42,149,0.06)] outline-none transition placeholder:text-transparent hover:border-[#d4c0f6] focus:border-[#6d2a95] focus:shadow-[0_0_0_4px_rgba(109,42,149,0.12)]"
        />
        <span className={`pointer-events-none absolute left-4 text-slate-400 transition-all duration-200 peer-focus:text-[#6d2a95] ${hasValue ? "top-3 text-xs font-semibold text-[#6d2a95]" : "top-1/2 -translate-y-1/2 text-sm"} peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold`}>
          {label}{required ? " *" : ""}
        </span>
      </div>
      {validationMessage ? <p className="mt-2 text-xs text-amber-600">{validationMessage}</p> : helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </label>
  );
}

function FloatingTextArea({
  label,
  value,
  onChange,
  rows,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  helperText?: string;
}) {
  const hasValue = value.trim().length > 0;
  return (
    <label className="block">
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          aria-label={label}
          className="peer w-full rounded-[22px] border border-[#e6dcfb] bg-white px-4 pb-3 pt-7 text-sm text-slate-900 shadow-[0_10px_25px_rgba(109,42,149,0.06)] outline-none transition placeholder:text-transparent hover:border-[#d4c0f6] focus:border-[#6d2a95] focus:shadow-[0_0_0_4px_rgba(109,42,149,0.12)]"
        />
        <span className={`pointer-events-none absolute left-4 text-slate-400 transition-all duration-200 peer-focus:text-[#6d2a95] ${hasValue ? "top-3 text-xs font-semibold text-[#6d2a95]" : "top-6 text-sm"} peer-focus:top-3 peer-focus:text-xs peer-focus:font-semibold`}>
          {label}
        </span>
      </div>
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </label>
  );
}

function TimelineSection<T extends { id: string }>({
  icon,
  title,
  description,
  addLabel,
  items,
  onAdd,
  onRemove,
  renderItem,
  darkMode,
  highContrast,
}: {
  icon: string;
  title: string;
  description: string;
  addLabel: string;
  items: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  renderItem: (item: T) => ReactNode;
  darkMode: boolean;
  highContrast: boolean;
}) {
  return (
    <FormCard
      darkMode={darkMode}
      highContrast={highContrast}
      icon={icon}
      title={title}
      description={description}
      action={<button type="button" onClick={onAdd} className="rounded-full border border-[#d9caf4] bg-white px-4 py-2 text-sm font-semibold text-[#6d2a95] transition hover:bg-[#f7f1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">{addLabel}</button>}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={item.id} className="relative rounded-[26px] border border-[#eaddfb] bg-gradient-to-br from-white to-[#fbf8ff] p-5 shadow-[0_12px_28px_rgba(109,42,149,0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f2e8ff] text-sm font-semibold text-[#6d2a95]">{index + 1}</span>
                <p className="text-sm font-semibold text-slate-700">{title} entry</p>
              </div>
              <button type="button" onClick={() => onRemove(item.id)} className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-500 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400">Remove</button>
            </div>
            {renderItem(item)}
          </article>
        ))}
      </div>
    </FormCard>
  );
}

function PreviewPanel({
  darkMode,
  highContrast,
  previewHtml,
  previewMode,
  recruiterView,
  template,
  zoom,
  onRecruiterViewToggle,
  onPreviewModeChange,
  onTemplateChange,
  onZoomIn,
  onZoomOut,
}: {
  darkMode: boolean;
  highContrast: boolean;
  previewHtml: string;
  previewMode: "desktop" | "mobile";
  recruiterView: boolean;
  template: CvTemplate;
  zoom: number;
  onRecruiterViewToggle: () => void;
  onPreviewModeChange: (mode: "desktop" | "mobile") => void;
  onTemplateChange: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const previewWidth = previewMode === "desktop" ? "100%" : "320px";
  const scale = zoom / 100;

  return (
    <aside className={`space-y-5 rounded-[30px] border p-5 shadow-[0_18px_45px_rgba(109,42,149,0.08)] xl:sticky xl:top-6 xl:self-start ${darkMode ? "border-white/10 bg-white/5" : "border-white/90 bg-white/88"} ${highContrast ? "ring-2 ring-[#6d2a95]/70" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#6d2a95]" aria-hidden="true">👁️</span>
            <h2 className="text-xl font-semibold">Live CV preview</h2>
          </div>
          <p className={`mt-2 text-sm leading-6 ${darkMode ? "text-white/70" : "text-slate-500"}`}>Updates in real time with a softer refresh so the experience stays calm and readable.</p>
        </div>
        <button type="button" onClick={onTemplateChange} className="rounded-full border border-[#d9caf4] bg-white px-4 py-2 text-sm font-semibold text-[#6d2a95] transition hover:bg-[#f7f1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Change template</button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#eadffd] bg-white px-4 py-3">
        <div className="inline-flex rounded-full border border-[#eadffd] bg-[#faf7ff] p-1">
          {([{ id: "desktop", label: "Desktop view" }, { id: "mobile", label: "Mobile view" }] as const).map((mode) => (
            <button key={mode.id} type="button" onClick={() => onPreviewModeChange(mode.id)} aria-pressed={previewMode === mode.id} className={`rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${previewMode === mode.id ? "bg-[#6d2a95] text-white shadow-sm" : "text-slate-600"}`}>
              {mode.id === "desktop" ? "🖥" : "📱"}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-[#f3ebff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6d2a95]">{template}</span>
      </div>

      {recruiterView ? <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Recruiter view focuses on scanability: headline clarity, contact visibility, and section rhythm.</div> : null}

      <div className="overflow-hidden rounded-[28px] border border-[#eadffd] bg-[#f6f1ff] p-4">
        <div className="mx-auto origin-top transition-all duration-300" style={{ maxWidth: previewWidth, transform: `scale(${scale})`, transformOrigin: "top center", height: `${previewMode === "desktop" ? 920 * scale : 720 * scale}px` }}>
          <iframe title="CV preview" srcDoc={previewHtml} className={`w-full rounded-[24px] border bg-white shadow-[0_18px_40px_rgba(47,36,88,0.16)] transition-opacity duration-300 ${previewMode === "desktop" ? "h-[920px]" : "h-[720px]"}`} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Zoom</span>
          <button type="button" onClick={onZoomOut} className="h-10 w-10 rounded-full border border-[#e0d2fb] bg-white text-lg font-semibold text-[#6d2a95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]" aria-label="Zoom out">-</button>
          <span className="min-w-14 text-center text-sm font-semibold">{zoom}%</span>
          <button type="button" onClick={onZoomIn} className="h-10 w-10 rounded-full border border-[#e0d2fb] bg-white text-lg font-semibold text-[#6d2a95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]" aria-label="Zoom in">+</button>
        </div>
        <button type="button" onClick={onRecruiterViewToggle} aria-pressed={recruiterView} className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95] ${recruiterView ? "bg-[#6d2a95] text-white" : "border border-[#d9caf4] bg-white text-[#6d2a95]"}`}>Recruiter view</button>
      </div>
    </aside>
  );
}

function BottomActionBar({
  darkMode,
  completionPercent,
  activeStepTitle,
  completedSteps,
  onSaveDraft,
  onReset,
  onDownload,
}: {
  darkMode: boolean;
  completionPercent: number;
  activeStepTitle: string;
  completedSteps: number;
  onSaveDraft: () => void;
  onReset: () => void;
  onDownload: () => void;
}) {
  return (
    <footer className={`flex flex-wrap items-center justify-between gap-5 rounded-[30px] border px-5 py-4 shadow-[0_18px_45px_rgba(109,42,149,0.08)] ${darkMode ? "border-white/10 bg-white/5" : "border-white/90 bg-white/88"}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff3cd] to-[#ffe7a0] text-2xl shadow-inner">🏆</div>
        <div>
          <p className="text-base font-semibold">You are doing great!</p>
          <p className={`text-sm ${darkMode ? "text-white/70" : "text-slate-500"}`}>{activeStepTitle} in progress, {completedSteps} of {CV_STEPS.length} steps completed.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `conic-gradient(#6d2a95 ${completionPercent}%, #eadffd 0)` }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#6d2a95]">{completionPercent}%</div>
        </div>
        <button type="button" onClick={onReset} className="rounded-full border border-[#d9caf4] bg-white px-4 py-3 text-sm font-semibold text-[#6d2a95] transition hover:bg-[#f7f1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Reset</button>
        <button type="button" onClick={onSaveDraft} className="rounded-full border border-[#d9caf4] bg-white px-4 py-3 text-sm font-semibold text-[#6d2a95] transition hover:bg-[#f7f1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Save draft</button>
        <button type="button" onClick={onDownload} className="rounded-full bg-gradient-to-r from-[#6d2a95] to-[#8d58d1] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(109,42,149,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(109,42,149,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d2a95]">Preview & Download CV (PDF)</button>
      </div>
    </footer>
  );
}
