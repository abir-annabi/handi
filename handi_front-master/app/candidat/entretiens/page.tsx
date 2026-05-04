"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireLienGoogleCalendar, extraireDureeMinutes, formaterDateEntretien, getEntretienStatutConfig, getEntretienTypeLabel } from "@/lib/entretiens";
import { construireUrlApi } from "@/lib/config";

type EntretienCandidat = {
  entretien: {
    id: string;
    date_heure: string;
    type: "visio" | "presentiel" | "telephonique";
    lieu_visio?: string | null;
    lieu?: string | null;
    statut: "planifie" | "confirme" | "reporte" | "annule" | "termine";
    duree_prevue?: string | null;
    contact_entreprise?: string | null;
    notes?: string | null;
  };
  candidature?: {
    id?: string;
    statut?: string;
  };
  offre?: {
    titre?: string;
  };
  entreprise?: {
    nom?: string;
    contact_rh_nom?: string | null;
    contact_rh_email?: string | null;
    contact_rh_telephone?: string | null;
  };
};

type EntretiensPayload = {
  message?: string;
  donnees?: EntretienCandidat[];
};

export default function MesEntretiensPage() {
  const [entretiens, setEntretiens] = useState<EntretienCandidat[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [entretienEnAction, setEntretienEnAction] = useState<string | null>(null);

  const charger = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi("/api/entretiens/candidat"));
      const data: EntretiensPayload = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your interviews.");
      }

      setEntretiens(Array.isArray(data.donnees) ? data.donnees : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load your interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const { aVenir, passes } = useMemo(() => {
    const maintenant = new Date();
    const futur: EntretienCandidat[] = [];
    const historique: EntretienCandidat[] = [];

    for (const item of entretiens) {
      const date = new Date(item.entretien.date_heure);
      if (!Number.isNaN(date.getTime()) && date >= maintenant && item.entretien.statut !== "termine") {
        futur.push(item);
      } else {
        historique.push(item);
      }
    }

    return { aVenir: futur, passes: historique };
  }, [entretiens]);

  const confirmerEntretien = async (id: string) => {
    try {
      setEntretienEnAction(id);
      setErreur(null);
      setInfo(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}/confirmer`), {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm the interview.");
      }

      setInfo(data.message || "Interview confirmed.");
      await charger();
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to confirm the interview.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const renderSection = (titre: string, description: string, items: EntretienCandidat[]) => {
    if (items.length === 0) {
      return (
        <Card padding="lg">
          <div className="empty-state">
            <strong>{titre}</strong>
            <p>{description}</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="list-stack">
        {items.map((item) => {
          const statut = getEntretienStatutConfig(item.entretien.statut);
          const date = formaterDateEntretien(item.entretien.date_heure);
          const lieu =
            item.entretien.type === "visio"
              ? item.entretien.lieu_visio || ""
              : item.entretien.type === "presentiel"
                ? item.entretien.lieu || ""
                : item.entretien.contact_entreprise || item.entreprise?.contact_rh_telephone || "";

          const lienCalendar = construireLienGoogleCalendar({
            titre: `Interview - ${item.offre?.titre || "Role"}`,
            dateHeure: item.entretien.date_heure,
            dureeMinutes: extraireDureeMinutes(item.entretien.duree_prevue || undefined),
            details: `${item.entreprise?.nom || "Company"} - ${item.entreprise?.contact_rh_email || ""}`,
            location: lieu,
          });

          return (
            <Card key={item.entretien.id} padding="lg">
              <div className="stack-lg">
                <div className="notification-meta">
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1.2rem" }}>{item.offre?.titre || "Interview"}</strong>
                      <span className={`status-pill ${statut.className}`}>{statut.label}</span>
                    </div>
                    <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                      {item.entreprise?.nom || "Company"} - {date.date} at {date.time}
                    </p>
                  </div>
                  {item.entretien.statut === "planifie" ? (
                    <Button onClick={() => confirmerEntretien(item.entretien.id)} disabled={entretienEnAction === item.entretien.id}>
                      Confirm attendance
                    </Button>
                  ) : null}
                </div>

                <div className="details-grid">
                  <div className="detail-box">
                    <strong>Type</strong>
                    <p>{getEntretienTypeLabel(item.entretien.type)}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Duration</strong>
                    <p>{item.entretien.duree_prevue || "-"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>HR contact</strong>
                    <p>{item.entreprise?.contact_rh_email || item.entreprise?.contact_rh_telephone || "-"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Calendar</strong>
                    <p>Quick add available</p>
                  </div>
                </div>

                {lieu ? (
                  <div className="detail-box">
                    <strong>{item.entretien.type === "visio" ? "Video link" : item.entretien.type === "presentiel" ? "Location" : "Contact"}</strong>
                    <p>{lieu}</p>
                  </div>
                ) : null}

                {item.entretien.notes ? (
                  <div className="detail-box">
                    <strong>Shared notes</strong>
                    <p>{item.entretien.notes}</p>
                  </div>
                ) : null}

                <div className="page-header-actions">
                  <a className="ui-button ui-button-secondary" href={lienCalendar} target="_blank" rel="noopener noreferrer">
                    Add to calendar
                  </a>
                  {item.entretien.type === "visio" && item.entretien.lieu_visio ? (
                    <a className="ui-button ui-button-ghost" href={item.entretien.lieu_visio} target="_blank" rel="noopener noreferrer">
                      Open video link
                    </a>
                  ) : null}
                  <ButtonLink href="/notifications" variant="ghost">
                    View my notifications
                  </ButtonLink>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-page">
      <PageHeader
        badge="Candidate calendar"
        title="Stay ready for your upcoming interviews."
        description="Keep interview timing, contact details, and preparation links together in a more accessible timeline."
        actions={
          <>
            <Button variant="secondary" onClick={charger}>
              Refresh
            </Button>
            <ButtonLink href="/notifications">Open notifications</ButtonLink>
          </>
        }
      />

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      {loading ? (
        <Card padding="lg">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <strong>Loading your interviews</strong>
            <p>We are retrieving your meeting calendar.</p>
          </div>
        </Card>
      ) : entretiens.length === 0 ? (
        <EmptyState
          title="No interviews scheduled"
          description="When a company schedules a meeting, it will appear here with its status and your available actions."
          action={<ButtonLink href="/offres">Continue job search</ButtonLink>}
        />
      ) : (
        <>
          {renderSection("Upcoming interviews", "You do not have any upcoming interviews right now.", aVenir)}
          {renderSection("History", "No past interviews to show.", passes)}
        </>
      )}
    </div>
  );
}
