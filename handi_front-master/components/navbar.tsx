"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccessibility } from "@/components/accessibility-provider";
import { triggerAccessibilityPanel } from "@/components/accessibility-widget";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface NavbarProps {
  utilisateur: UtilisateurConnecte;
  candidateSidebarCollapsed?: boolean;
  onToggleCandidateSidebar?: () => void;
}

type NavLinkItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type NavGroupItem = {
  id: string;
  label: string;
  items: NavLinkItem[];
  badgeCount?: number;
};

type NavItem = NavLinkItem | NavGroupItem;

type ShortcutEntry = {
  key: string;
  label: string;
  href?: string;
  menuId?: string;
  items?: Array<{ key: string; label: string; href: string }>;
};

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hasItems(item: NavItem): item is NavGroupItem {
  return "items" in item;
}

function normalizeShortcutLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLocaleLowerCase();
}

function buildUniqueShortcuts(entries: Array<{ label: string; href?: string; menuId?: string; items?: NavLinkItem[] }>): ShortcutEntry[] {
  const normalized = entries.map((entry) => ({
    ...entry,
    normalizedLabel: normalizeShortcutLabel(entry.label),
  }));

  return normalized.map((entry) => {
    let length = 1;
    while (
      length < entry.normalizedLabel.length &&
      normalized.some(
        (other) => other !== entry && other.normalizedLabel.startsWith(entry.normalizedLabel.slice(0, length)),
      )
    ) {
      length += 1;
    }

    const key = entry.normalizedLabel.slice(0, length);
    const childItems = entry.items
      ? buildUniqueShortcuts(entry.items.map((item) => ({ label: item.label, href: item.href }))).map((item) => ({
          key: item.key,
          label: item.label,
          href: item.href || "",
        }))
      : undefined;

    return {
      key,
      label: entry.label,
      href: entry.href,
      menuId: entry.menuId,
      items: childItems,
    };
  });
}

export function Navbar({
  utilisateur,
  candidateSidebarCollapsed = false,
  onToggleCandidateSidebar,
}: NavbarProps) {
  const { t } = useI18n();
  const { settings } = useAccessibility();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [profilMenuOuvert, setProfilMenuOuvert] = useState(false);
  const [profileMenuPlacement, setProfileMenuPlacement] = useState<"down" | "up">("down");
  const [profileMenuMaxHeight, setProfileMenuMaxHeight] = useState<number>(420);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);
  const [navigationMenuOuvert, setNavigationMenuOuvert] = useState<string | null>(null);
  const [keyboardBuffer, setKeyboardBuffer] = useState("");
  const [keyboardGuideVisible, setKeyboardGuideVisible] = useState(true);
  const headerRef = useRef<HTMLElement | null>(null);
  const profileShellRef = useRef<HTMLDivElement | null>(null);
  const keyboardBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCandidate = utilisateur.role === "candidat";
  const hasCollapsibleSidebar = utilisateur.role === "candidat" || utilisateur.role === "admin" || utilisateur.role === "entreprise";
  const keyboardModeEnabled = settings.keyboardMoveMode;
  const keyboardAnnouncement = keyboardModeEnabled ? t("accessibility.keyboardAnnouncement") : "";

  const liens = useMemo(() => {
    if (utilisateur.role === "candidat") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        {
          id: "explore-jobs",
          label: t("navbar.exploreJobs"),
          items: [
            { href: "/offres", label: t("navbar.jobs") },
            { href: "/favoris", label: t("navbar.favorites") },
          ],
        },
        {
          id: "applications",
          label: t("navbar.applications"),
          items: [
            { href: "/candidat/candidatures", label: t("navbar.applications") },
            { href: "/candidat/entretiens", label: t("navbar.interviews") },
            { href: "/candidat/cv", label: t("navbar.cvBuilder") },
            { href: "/candidat/avis", label: "Avis entreprises" },
          ],
        },
        {
          id: "social",
          label: t("navbar.social"),
          badgeCount: notificationsNonLues,
          items: [
            { href: "/messages", label: t("navbar.messages") },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
        { href: "/candidat/tests-psychologiques", label: t("navbar.assessments") },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "admin") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        {
          id: "admin-accounts",
          label: t("navbar.accounts"),
          items: [
            { href: "/admin/comptes", label: t("navbar.accounts") },
            { href: "/admin/utilisateurs", label: t("home.workspace.admin.actions.usersTitle") },
          ],
        },
        {
          id: "admin-operations",
          label: t("navbar.insights"),
          items: [
            { href: "/admin/supervision", label: t("navbar.supervision") },
            { href: "/admin/tests-psychologiques", label: t("navbar.assessments") },
          ],
        },
        {
          id: "admin-social",
          label: t("navbar.social"),
          badgeCount: notificationsNonLues,
          items: [
            { href: "/messages", label: t("navbar.messages") },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "entreprise") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        { href: "/entreprise/reports-requests", label: t("navbar.reportsRequests") },
        {
          id: "entreprise-applications",
          label: t("navbar.applications"),
          items: [
            { href: "/entreprise/candidatures", label: "All applicants" },
            { href: "/entreprise/candidatures?status=shortlisted", label: "Shortlisted" },
            { href: "/entreprise/candidatures?status=interview_scheduled", label: "Interviews" },
            { href: "/entreprise/candidatures?status=accepted", label: "Hired" },
            { href: "/entreprise/offres", label: t("navbar.manageRoles") },
          ],
        },
        {
          id: "entreprise-job-listings",
          label: "Job listings",
          items: [
            { href: "/entreprise/offres", label: "All roles" },
          ],
        },
        {
          id: "entreprise-social",
          label: t("navbar.social"),
          badgeCount: notificationsNonLues,
          items: [
            { href: "/messages", label: t("navbar.messages") },
            { href: "/notifications", label: t("navbar.notifications"), badgeCount: notificationsNonLues },
          ],
        },
      ] satisfies NavItem[];
    }

    if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
      return [
        { href: "/home", label: t("navbar.workspace") },
        { href: "/admin/supervision", label: t("navbar.supervision") },
        { href: "/admin/supervision/reports", label: t("supervision.nav.reports") },
        { href: "/profil", label: t("navbar.profile") },
      ] satisfies NavItem[];
    }

    return [
      { href: "/home", label: t("navbar.workspace") },
      { href: "/admin/comptes", label: t("navbar.accounts") },
      { href: "/admin/supervision", label: t("navbar.supervision") },
      { href: "/admin/tests-psychologiques", label: t("navbar.assessments") },
    ] satisfies NavItem[];
  }, [notificationsNonLues, t, utilisateur.role]);

  const primaryAction = useMemo(() => {
    if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
      return { href: "/admin/supervision", label: t("navbar.openSupervision") };
    }

    return null;
  }, [t, utilisateur.role]);

  const profilHref = utilisateur.role === "entreprise" ? "/entreprise/profil" : "/profil";
  const candidateShortcuts = useMemo(() => {
    if (!isCandidate) {
      return [];
    }

    return buildUniqueShortcuts(
      liens.map((item) =>
        hasItems(item)
          ? { label: item.label, menuId: item.id, items: item.items }
          : { label: item.label, href: item.href },
      ),
    );
  }, [isCandidate, liens]);

  useEffect(() => {
    const gererClicExterieur = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setNavigationMenuOuvert(null);
        setProfilMenuOuvert(false);
      }
    };

    document.addEventListener("mousedown", gererClicExterieur);
    return () => {
      document.removeEventListener("mousedown", gererClicExterieur);
    };
  }, []);

  useEffect(() => {
    let actif = true;

    const chargerNotifications = async () => {
      try {
        const response = await authenticatedFetch(construireUrlApi("/api/notifications/non-lues/count"));
        const data = await response.json();
        if (!response.ok || !actif) {
          return;
        }
        setNotificationsNonLues(Number(data?.donnees?.count || 0));
      } catch {
        if (actif) {
          setNotificationsNonLues(0);
        }
      }
    };

    void chargerNotifications();

    const onNotificationsRead = () => {
      if (actif) {
        setNotificationsNonLues(0);
      }
    };

    window.addEventListener("notifications-marked-read", onNotificationsRead);

    return () => {
      actif = false;
      window.removeEventListener("notifications-marked-read", onNotificationsRead);
    };
  }, [pathname]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setNavigationMenuOuvert(null);
      setMenuOuvert(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  useEffect(() => {
    if (hasCollapsibleSidebar && candidateSidebarCollapsed) {
      const frameId = window.requestAnimationFrame(() => {
        setProfilMenuOuvert(false);
        setNavigationMenuOuvert(null);
        setMenuOuvert(false);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }
  }, [candidateSidebarCollapsed, hasCollapsibleSidebar]);

  useEffect(() => {
    if (!profilMenuOuvert) {
      return;
    }

    const updateProfileMenuLayout = () => {
      const shell = profileShellRef.current;
      if (!shell) {
        return;
      }

      const rect = shell.getBoundingClientRect();
      const viewportPadding = 16;
      const menuGap = 12;
      const defaultMaxHeight = 420;
      const minimumMenuHeight = 180;
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding - menuGap;
      const availableAbove = rect.top - viewportPadding - menuGap;
      const placeUp = availableBelow < 240 && availableAbove > availableBelow;
      const availableHeight = placeUp ? availableAbove : availableBelow;

      setProfileMenuPlacement(placeUp ? "up" : "down");
      setProfileMenuMaxHeight(
        Math.max(minimumMenuHeight, Math.min(defaultMaxHeight, Math.floor(availableHeight))),
      );
    };

    updateProfileMenuLayout();
    window.addEventListener("resize", updateProfileMenuLayout);
    window.addEventListener("scroll", updateProfileMenuLayout, true);

    return () => {
      window.removeEventListener("resize", updateProfileMenuLayout);
      window.removeEventListener("scroll", updateProfileMenuLayout, true);
    };
  }, [profilMenuOuvert]);

  useEffect(() => {
    if (keyboardModeEnabled) {
      setKeyboardGuideVisible(true);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setKeyboardBuffer("");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [keyboardModeEnabled]);

  useEffect(() => {
    if (!keyboardModeEnabled || !isCandidate) {
      return;
    }

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        setNavigationMenuOuvert(null);
        setKeyboardBuffer("");
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) {
        return;
      }

      const key = normalizeShortcutLabel(event.key);

      const availableEntries =
        navigationMenuOuvert && candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items
          ? candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items || []
          : candidateShortcuts;
      const navigateFromKeyboard = (chemin: string) => {
        setMenuOuvert(false);
        setProfilMenuOuvert(false);
        setNavigationMenuOuvert(null);
        router.push(chemin);
      };

      const trySequence = (sequence: string) => {
        const matches = availableEntries.filter((entry) => entry.key.startsWith(sequence));
        if (matches.length === 0) {
          return false;
        }

        setKeyboardBuffer(sequence);

        if (keyboardBufferTimerRef.current) {
          clearTimeout(keyboardBufferTimerRef.current);
        }

        keyboardBufferTimerRef.current = setTimeout(() => {
          setKeyboardBuffer("");
        }, 1200);

        const exact = matches.find((entry) => entry.key === sequence);
        if (!exact) {
          return true;
        }

        event.preventDefault();

        if ("href" in exact && exact.href) {
          navigateFromKeyboard(exact.href);
          setKeyboardBuffer("");
          return true;
        }

        if ("menuId" in exact && exact.menuId) {
          setProfilMenuOuvert(false);
          setMenuOuvert(false);
          setNavigationMenuOuvert(exact.menuId);
          setKeyboardBuffer("");
          return true;
        }

        return true;
      };

      const nextSequence = keyboardBuffer + key;
      if (trySequence(nextSequence)) {
        return;
      }

      trySequence(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (keyboardBufferTimerRef.current) {
        clearTimeout(keyboardBufferTimerRef.current);
      }
    };
  }, [candidateShortcuts, keyboardBuffer, keyboardModeEnabled, navigationMenuOuvert, router]);

  const getNavInitials = (label: string) => {
    // Custom initials mapping
    const initialsMap: Record<string, string> = {
      [t("navbar.applications")]: "AP",
      [t("navbar.assessments")]: "AS",
    };
    
    return initialsMap[label] || label.charAt(0);
  };

  const deconnexion = () => {
    localStorage.removeItem("token_auth");
    localStorage.removeItem("utilisateur_connecte");
    router.push("/connexion");
  };

  const ouvrirPanneauAccessibilite = () => {
    setMenuOuvert(false);
    setProfilMenuOuvert(false);
    setNavigationMenuOuvert(null);
    triggerAccessibilityPanel("open");
  };

  const naviguerVers = (chemin: string) => {
    setMenuOuvert(false);
    setProfilMenuOuvert(false);
    setNavigationMenuOuvert(null);
    // If sidebar is collapsed, open it first before navigation
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
    }
    router.push(chemin);
  };

  const navigationActive = (item: NavItem) =>
    hasItems(item) ? item.items.some((child) => pathname === child.href) : pathname === item.href;

  const basculerMenuNavigation = (menuId: string) => {
    setProfilMenuOuvert(false);
    // If sidebar is collapsed, open it first
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
      // Set a small delay to allow sidebar animation to start
      setTimeout(() => {
        setNavigationMenuOuvert((current) => (current === menuId ? null : menuId));
      }, 100);
    } else {
      setNavigationMenuOuvert((current) => (current === menuId ? null : menuId));
    }
  };

  const fermerMenuNavigation = () => {
    setNavigationMenuOuvert(null);
  };

  const ouvrirMenuNavigation = (menuId: string) => {
    setProfilMenuOuvert(false);
    // If sidebar is collapsed, open it first
    if (hasCollapsibleSidebar && candidateSidebarCollapsed && onToggleCandidateSidebar) {
      onToggleCandidateSidebar();
    }
    setNavigationMenuOuvert(menuId);
  };

  return (
    <header className={classes("app-header", "app-theme", hasCollapsibleSidebar && "app-header-candidat")} ref={headerRef}>
      <div className="app-header-inner">
        <div className="candidate-brand-row">
          <Link href="/home" className="brand-pill">
            <span className="brand-mark" aria-hidden="true" />
            <span className={classes("brand-copy", isCandidate && candidateSidebarCollapsed && "brand-copy-collapsed")}>
              <strong>HandiTalents</strong>
              <span>{t(`common.roles.${utilisateur.role}`)}</span>
            </span>
          </Link>
          {hasCollapsibleSidebar ? (
            <button
              className="sidebar-toggle"
              onClick={onToggleCandidateSidebar}
              type="button"
              aria-label={candidateSidebarCollapsed ? t("navbar.expandSidebar") : t("navbar.collapseSidebar")}
              aria-pressed={candidateSidebarCollapsed}
            >
              <span
                className={classes("sidebar-toggle-lines", candidateSidebarCollapsed && "sidebar-toggle-lines-collapsed")}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>

        <nav className="app-nav" aria-label="Primary">
          {liens.map((lien) =>
            hasItems(lien) ? (
              <div 
                key={lien.id} 
                className="nav-dropdown-shell"
                onMouseEnter={() => ouvrirMenuNavigation(lien.id)}
                onMouseLeave={fermerMenuNavigation}
              >
                <button
                  onClick={() => basculerMenuNavigation(lien.id)}
                  className={classes("nav-chip", navigationActive(lien) && "nav-chip-active")}
                  type="button"
                  title={hasCollapsibleSidebar && candidateSidebarCollapsed ? lien.label : undefined}
                >
                  {hasCollapsibleSidebar ? <span className="nav-chip-glyph" aria-hidden="true">{getNavInitials(lien.label)}</span> : null}
                  <span className={classes(hasCollapsibleSidebar && candidateSidebarCollapsed && "nav-chip-label-collapsed")}>{lien.label}</span>
                  {lien.badgeCount && lien.badgeCount > 0 ? <span className="badge-count">{lien.badgeCount}</span> : null}
                  <span
                    className={classes("nav-chip-caret", navigationMenuOuvert === lien.id && "nav-chip-caret-open")}
                    aria-hidden="true"
                  />
                </button>

                {navigationMenuOuvert === lien.id ? (
                  <div className="nav-dropdown-menu">
                    {lien.items.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => naviguerVers(item.href)}
                        className={classes("nav-dropdown-item", pathname === item.href && "nav-dropdown-item-active")}
                        type="button"
                      >
                        <span>{item.label}</span>
                        {item.badgeCount && item.badgeCount > 0 ? <span className="badge-count">{item.badgeCount}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              (() => {
                const navLink = lien as NavLinkItem;
                return (
                  <button
                    key={navLink.href}
                    onClick={() => naviguerVers(navLink.href)}
                    className={classes("nav-chip", pathname === navLink.href && "nav-chip-active")}
                    type="button"
                    title={hasCollapsibleSidebar && candidateSidebarCollapsed ? navLink.label : undefined}
                  >
                    {hasCollapsibleSidebar ? <span className="nav-chip-glyph" aria-hidden="true">{getNavInitials(navLink.label)}</span> : null}
                    <span className={classes(hasCollapsibleSidebar && candidateSidebarCollapsed && "nav-chip-label-collapsed")}>{navLink.label}</span>
                    {navLink.badgeCount && navLink.badgeCount > 0 ? <span className="badge-count">{navLink.badgeCount}</span> : null}
                  </button>
                );
              })()
            ),
          )}
        </nav>

        <div className="app-header-actions">
          {!(hasCollapsibleSidebar && candidateSidebarCollapsed) ? <LanguageSwitcher /> : null}

          {primaryAction ? (
            <ButtonLink href={primaryAction.href} variant="secondary" size="sm">
              {primaryAction.label}
            </ButtonLink>
          ) : null}

          {!(hasCollapsibleSidebar && candidateSidebarCollapsed) ? (
          <div className="profile-shell" ref={profileShellRef}>
            <button
              className="profile-trigger"
              onClick={() => {
                setNavigationMenuOuvert(null);
                setProfilMenuOuvert((open) => !open);
              }}
              type="button"
            >
              <span className="profile-avatar">{utilisateur.nom.charAt(0).toUpperCase()}</span>
              <span className="profile-meta">
                <strong>{utilisateur.nom}</strong>
                <span>{t(`common.roles.${utilisateur.role}`)}</span>
              </span>
              <span className={classes("profile-caret", profilMenuOuvert && "profile-caret-open")} aria-hidden="true" />
            </button>

            {profilMenuOuvert ? (
              <div
                className={classes(
                  "profile-menu",
                  profileMenuPlacement === "up" ? "profile-menu-up" : "profile-menu-down",
                )}
                style={{ maxHeight: `${profileMenuMaxHeight}px` }}
              >
                <div className="profile-menu-header">
                  <strong>{utilisateur.nom}</strong>
                  <p style={{ margin: 0, color: "var(--app-muted)" }}>{utilisateur.email}</p>
                  <p style={{ margin: "8px 0 0", color: "var(--app-muted)" }}>
                    {t("common.status")}: {utilisateur.statut}
                  </p>
                </div>

                <div className="profile-menu-actions">
                  {isCandidate ? (
                    <button className="nav-chip" onClick={ouvrirPanneauAccessibilite} type="button">
                      {t("accessibility.open")}
                    </button>
                  ) : null}
                  <button className="nav-chip" onClick={() => naviguerVers(profilHref)} type="button">
                    {t("navbar.openProfile")}
                  </button>
                  <button className="nav-chip" onClick={() => naviguerVers("/messages")} type="button">
                    {t("navbar.openMessages")}
                  </button>
                  <button className="nav-chip" onClick={deconnexion} type="button">
                    {t("common.actions.signOut")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          <button
            className="ui-button ui-button-secondary ui-button-sm mobile-menu-toggle"
            onClick={() => setMenuOuvert((open) => !open)}
            type="button"
          >
            {menuOuvert ? t("common.actions.close") : t("navbar.menu")}
          </button>
        </div>
      </div>

      {menuOuvert ? (
        <div className="mobile-nav">
          {liens.map((lien) =>
            hasItems(lien) ? (
              <div key={lien.id} className="mobile-nav-group">
                <button
                  onClick={() => basculerMenuNavigation(lien.id)}
                  className={classes("nav-chip", navigationActive(lien) && "nav-chip-active")}
                  type="button"
                >
                  <span>
                    {lien.label}
                    {lien.badgeCount && lien.badgeCount > 0 ? ` (${lien.badgeCount})` : ""}
                  </span>
                  <span aria-hidden="true">
                    {navigationMenuOuvert === lien.id ? t("common.actions.close") : t("common.actions.open")}
                  </span>
                </button>

                {navigationMenuOuvert === lien.id ? (
                  <div className="mobile-nav-submenu">
                    {lien.items.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => naviguerVers(item.href)}
                        className={classes("nav-chip", pathname === item.href && "nav-chip-active")}
                        type="button"
                      >
                        <span>
                          {item.label}
                          {item.badgeCount && item.badgeCount > 0 ? ` (${item.badgeCount})` : ""}
                        </span>
                        <span aria-hidden="true">{t("common.actions.open")}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              (() => {
                const navLink = lien as NavLinkItem;
                return (
                  <button
                    key={navLink.href}
                    onClick={() => naviguerVers(navLink.href)}
                    className={classes("nav-chip", pathname === navLink.href && "nav-chip-active")}
                    type="button"
                  >
                    <span>
                      {navLink.label}
                      {navLink.badgeCount && navLink.badgeCount > 0 ? ` (${navLink.badgeCount})` : ""}
                    </span>
                    <span aria-hidden="true">{t("common.actions.open")}</span>
                  </button>
                );
              })()
            ),
          )}
          {primaryAction ? (
            <ButtonLink href={primaryAction.href} variant="primary" size="sm">
              {primaryAction.label}
            </ButtonLink>
          ) : null}
          {isCandidate ? (
            <button className="nav-chip" onClick={ouvrirPanneauAccessibilite} type="button">
              {t("accessibility.open")}
            </button>
          ) : null}
        </div>
      ) : null}

      {settings.keyboardMoveMode && keyboardGuideVisible ? (
        <aside className="keyboard-guide" aria-live="polite">
          <div className="keyboard-guide-header">
            <strong>{t("accessibility.keyboardGuideTitle")}</strong>
            <button
              className="keyboard-guide-close"
              onClick={() => setKeyboardGuideVisible(false)}
              type="button"
              aria-label={t("common.actions.close")}
            >
              ×
            </button>
          </div>
          <p>{t("accessibility.keyboardGuideIntro")}</p>
          <div className="keyboard-guide-list">
            <span><kbd>Tab</kbd> Naviguer vers l'element suivant</span>
            <span><kbd>Shift + Tab</kbd> Revenir a l'element precedent</span>
            <span><kbd>Entree</kbd> Activer le bouton ou le lien selectionne</span>
            <span><kbd>Echap</kbd> Fermer les menus ou modales</span>
            <span><kbd>Fleches</kbd> Se deplacer dans les listes et menus</span>
          </div>
          {isCandidate ? <p>Raccourcis rapides candidat :</p> : null}
          {isCandidate ? (
            <div className="keyboard-guide-list">
              {candidateShortcuts.map((entry) => (
                <span key={entry.label}>
                  <kbd>{entry.key.toUpperCase()}</kbd> {entry.label}
                </span>
              ))}
            </div>
          ) : null}
          {navigationMenuOuvert && candidateShortcuts.find((entry) => entry.menuId === navigationMenuOuvert)?.items ? (
            <>
              <p>{t("accessibility.keyboardGuideExplore")}</p>
              <div className="keyboard-guide-list">
                {candidateShortcuts
                  .find((entry) => entry.menuId === navigationMenuOuvert)
                  ?.items?.map((entry) => (
                    <span key={entry.label}>
                      <kbd>{entry.key.toUpperCase()}</kbd> {entry.label}
                    </span>
                  ))}
              </div>
            </>
          ) : null}
          <p>{t("accessibility.keyboardGuideClose")}</p>
        </aside>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {keyboardAnnouncement}
      </div>
    </header>
  );
}
