"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch, getAuthToken } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Conversation = {
  id: string;
  created_at: string;
  participant_names?: string;
  last_message?: string | null;
  last_message_at?: string | null;
};

type Message = {
  id: string;
  id_utilisateur: string;
  role: string;
  contenu: string;
  created_at: string;
};

type RecipientRole = "admin" | "entreprise";

type Recipient = {
  id_utilisateur: string;
  nom: string;
  role: RecipientRole;
  email: string;
  subtitle?: string;
};

type ProfileResponse = {
  photo_profil_url?: string;
};

const READ_STATE_KEY = "candidate_message_read_state_v1";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.25" r="1.15" fill="currentColor" />
    </svg>
  );
}

function AttachmentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 12.5l6.6-6.6a3 3 0 114.2 4.2L9.9 19.5a5 5 0 11-7.1-7.1l9.2-9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 14.5a4.6 4.6 0 007 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function EmptyChatIcon() {
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <linearGradient id="messages-empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8f60ff" />
          <stop offset="100%" stopColor="#35063E" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="74" fill="rgba(143, 96, 255, 0.08)" />
      <circle cx="62" cy="90" r="6" fill="rgba(143, 96, 255, 0.28)" />
      <circle cx="84" cy="62" r="4" fill="rgba(143, 96, 255, 0.22)" />
      <circle cx="178" cy="74" r="5" fill="rgba(143, 96, 255, 0.2)" />
      <circle cx="196" cy="110" r="4" fill="rgba(143, 96, 255, 0.16)" />
      <circle cx="172" cy="162" r="4.5" fill="rgba(143, 96, 255, 0.28)" />
      <path
        d="M120 66c-28.7 0-52 20.8-52 46.5 0 14.6 7.6 27.5 19.4 36l-6 22.5 23.6-12.3c4.8.9 9.8 1.4 15 1.4 28.7 0 52-20.8 52-46.6C172 86.8 148.7 66 120 66z"
        fill="url(#messages-empty-gradient)"
      />
      <circle cx="102" cy="112" r="7.6" fill="#fff" />
      <circle cx="120" cy="112" r="7.6" fill="#fff" />
      <circle cx="138" cy="112" r="7.6" fill="#fff" />
    </svg>
  );
}

export default function MessagesPageProtegee() {
  return (
    <AuthenticatedWorkspace rolesAutorises={["admin", "candidat", "entreprise", "inspecteur", "aneti"]}>
      <MessagesPage />
    </AuthenticatedWorkspace>
  );
}

function MessagesPage() {
  const { utilisateur } = useAuth();
  const { t, locale } = useI18n();
  const isCandidate = utilisateur?.role === "candidat";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientSuggestions, setRecipientSuggestions] = useState<Recipient[]>([]);
  const [adminContacts, setAdminContacts] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [newConversationMessage, setNewConversationMessage] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [readState, setReadState] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const stored = window.localStorage.getItem(READ_STATE_KEY);
      return stored ? (JSON.parse(stored) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const sseRef = useRef<EventSource | null>(null);

  const localeCode = locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR";
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeCode, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [localeCode],
  );

  useEffect(() => {
    if (!utilisateur) {
      return;
    }

    window.localStorage.setItem(READ_STATE_KEY, JSON.stringify(readState));
  }, [readState, utilisateur]);

  const formatTime = (value?: string | null) => (value ? timeFormatter.format(new Date(value)) : "");

  const translateRole = (role?: string | null) =>
    role ? t(`common.roles.${role}`) : t("messages.messagingSpace");

  const fermerComposeur = () => {
    setIsComposerOpen(false);
    setStatus(null);
  };

  const ouvrirComposeur = () => {
    setIsComposerOpen(true);
    setStatus(null);
  };

  const reinitialiserComposeur = () => {
    setRecipientQuery("");
    setRecipientSuggestions([]);
    setSelectedRecipient(null);
    setNewConversationMessage("");
  };

  const chargerConversations = async () => {
    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/conversations"));
      const data = await res.json();

      if (res.ok) {
        setConversations(Array.isArray(data.donnees) ? data.donnees : []);
      } else {
        setStatus(data.message || t("messages.loadConversationsError"));
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.loadConversationsError"));
    }
  };

  const chargerPhotoUtilisateur = async () => {
    if (!utilisateur?.id_utilisateur) {
      return;
    }

    const endpointByRole: Record<string, string> = {
      candidat: `/api/candidats/profil/${utilisateur.id_utilisateur}`,
      entreprise: `/api/entreprises/profil/${utilisateur.id_utilisateur}`,
      admin: `/api/admin/profil/${utilisateur.id_utilisateur}`,
      inspecteur: `/api/admin/profil/${utilisateur.id_utilisateur}`,
      aneti: `/api/admin/profil/${utilisateur.id_utilisateur}`,
    };

    const endpoint = endpointByRole[utilisateur.role];
    if (!endpoint) {
      setUserPhotoUrl(null);
      return;
    }

    try {
      const res = await authenticatedFetch(construireUrlApi(endpoint));
      const data = await res.json();
      if (!res.ok) {
        setUserPhotoUrl(null);
        return;
      }

      const donnees = (data.donnees || {}) as ProfileResponse;
      if (!donnees.photo_profil_url) {
        setUserPhotoUrl(null);
        return;
      }

      setUserPhotoUrl(
        donnees.photo_profil_url.startsWith("data:")
          ? donnees.photo_profil_url
          : construireUrlApi(donnees.photo_profil_url),
      );
    } catch {
      setUserPhotoUrl(null);
    }
  };

  const chargerSuggestions = async (query: string, roleFilter?: RecipientRole) => {
    setRecipientQuery(query);
    setSelectedRecipient((current) => {
      if (!query.trim()) {
        return current?.role === "admin" && roleFilter === "entreprise" ? current : null;
      }

      return current?.nom === query ? current : null;
    });

    if (!query.trim()) {
      setRecipientSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({ q: query });
      if (roleFilter) {
        params.set("role", roleFilter);
      }

      const res = await authenticatedFetch(construireUrlApi(`/api/chat/destinataires?${params.toString()}`));
      const data = await res.json();
      if (res.ok) {
        setRecipientSuggestions(Array.isArray(data.donnees) ? data.donnees : []);
      }
    } catch {}
  };

  const chargerContactsAdmin = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/destinataires?role=admin"));
      const data = await res.json();
      if (res.ok) {
        setAdminContacts(Array.isArray(data.donnees) ? data.donnees : []);
      }
    } catch {}
  };

  const selectionnerDestinataire = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    if (recipient.role === "entreprise") {
      setRecipientQuery(recipient.nom);
      setRecipientSuggestions([]);
    }
  };

  const marquerConversationCommeLue = (conversationId: string, timestamp?: string | null) => {
    setReadState((current) => ({
      ...current,
      [conversationId]: timestamp || new Date().toISOString(),
    }));
  };

  const chargerMessages = async (id: string) => {
    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/chat/conversations/${id}/messages`));
      const data = await res.json();
      if (res.ok) {
        const loadedMessages = Array.isArray(data.donnees) ? data.donnees : [];
        setConvId(id);
        setMessages(loadedMessages);
        setReplyDraft("");
        marquerConversationCommeLue(id, loadedMessages.at(-1)?.created_at);
      } else {
        setStatus(data.message || t("messages.loadMessagesError"));
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.loadMessagesError"));
    }

    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    const sse = new EventSource(construireUrlApi(`/api/chat/conversations/${id}/stream?token=${token}`));
    sse.onmessage = (event) => {
      try {
        const batch = JSON.parse(event.data);
        if (Array.isArray(batch) && batch.length > 0) {
          setMessages((current) => {
            const existing = new Set(current.map((item) => item.id));
            return [...current, ...batch.filter((item) => !existing.has(item.id))];
          });
          marquerConversationCommeLue(id, batch[batch.length - 1]?.created_at);
          void chargerConversations();
        }
      } catch {}
    };
    sse.onerror = () => sse.close();
    sseRef.current = sse;
  };

  const creerConversation = async () => {
    if (!selectedRecipient) {
      setStatus(isCandidate ? t("messages.chooseRecipientCandidate") : t("messages.chooseRecipientGeneric"));
      return;
    }

    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/conversations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: [selectedRecipient.id_utilisateur],
          message_initial: newConversationMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || t("messages.createConversationError"));
        return;
      }

      reinitialiserComposeur();
      setIsComposerOpen(false);
      await chargerConversations();
      if (data.donnees?.id) {
        await chargerMessages(data.donnees.id);
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.createConversationError"));
    }
  };

  const envoyerMessage = async () => {
    if (!convId) {
      setStatus(t("messages.chooseConversationFirst"));
      return;
    }

    if (!replyDraft.trim()) {
      return;
    }

    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/chat/conversations/${convId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: replyDraft }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || t("messages.sendMessageError"));
        return;
      }

      setReplyDraft("");
      setMessages((current) => [...current, data.donnees]);
      marquerConversationCommeLue(convId, data.donnees?.created_at);
      await chargerConversations();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.sendMessageError"));
    }
  };

  const chargerConversationsInitiales = useEffectEvent(() => {
    void chargerConversations();
  });
  const chargerPhotoUtilisateurInitiale = useEffectEvent(() => {
    void chargerPhotoUtilisateur();
  });
  const chargerContactsAdminInitial = useEffectEvent(() => {
    void chargerContactsAdmin();
  });

  useEffect(() => {
    chargerConversationsInitiales();
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    chargerPhotoUtilisateurInitiale();
  }, [utilisateur?.id_utilisateur, utilisateur?.role]);

  useEffect(() => {
    if (!isCandidate) {
      return;
    }

    chargerContactsAdminInitial();
  }, [isCandidate]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === convId) ?? null,
    [convId, conversations],
  );

  const filteredConversations = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.participant_names || ""} ${conversation.last_message || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, threadSearch]);

  const hasActiveConversation = Boolean(convId);
  const activeConversationInitial = (activeConversation?.participant_names || "C").slice(0, 1).toUpperCase();

  return (
    <div className="messages-studio">
      <section className="messages-studio-shell">
        <header className="messages-studio-topbar">
          <div className="messages-studio-topbar-main">
            <div className="messages-studio-brand">
              <span className="messages-studio-brand-badge">{t("messages.badge")}</span>
              <div>
                <strong>{t("messages.inboxTitle")}</strong>
              </div>
            </div>
          </div>

          <div className="messages-studio-userpill">
            <div className="messages-studio-avatar">
              {userPhotoUrl ? (
                <Image
                  src={userPhotoUrl}
                  alt={utilisateur?.nom || t("messages.messagingSpace")}
                  className="messages-studio-avatar-image"
                  width={50}
                  height={50}
                  unoptimized
                />
              ) : (
                utilisateur?.nom?.slice(0, 1).toUpperCase() || "U"
              )}
            </div>
            <div>
              <strong>{utilisateur?.nom || t("messages.messagingSpace")}</strong>
              <span>{translateRole(utilisateur?.role)}</span>
            </div>
          </div>
        </header>

        {status ? <div className="message message-erreur">{status}</div> : null}

        <div className="messages-studio-grid">
          <aside className="messages-studio-list">
            <div className="messages-studio-panel-head">
              <div>
                <h2>{t("messages.conversationsTitle")}</h2>
                <p>{t("messages.conversationsDescription")}</p>
              </div>
            </div>

            <label className="messages-studio-searchshell">
              <span className="messages-studio-searchicon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                className="messages-studio-searchinput"
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder={t("messages.searchThreads")}
                aria-label={t("messages.searchThreads")}
              />
            </label>

            <button type="button" className="messages-studio-compose-card" onClick={ouvrirComposeur}>
              <span className="messages-studio-compose-icon" aria-hidden="true">
                <PlusIcon />
              </span>
              <span className="messages-studio-compose-copy">
                <strong>{t("messages.newConversationTitle")}</strong>
                <span>
                  {isCandidate
                    ? t("messages.newConversationCandidateDescription")
                    : t("messages.newConversationGenericDescription")}
                </span>
              </span>
            </button>

            <div className="messages-studio-section-divider" />

            <div className="messages-studio-section-label">{t("messages.recentLabel")}</div>

            <div className="messages-studio-thread-list">
              {filteredConversations.length === 0 ? (
                <div className="messages-studio-thread-empty">
                  <strong>{t("messages.noConversationsTitle")}</strong>
                  <p>{t("messages.noConversationsDescription")}</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const lastSeen = readState[conversation.id];
                  const lastMessageAt = conversation.last_message_at ?? conversation.created_at;
                  const isUnread =
                    !lastSeen || new Date(lastSeen).getTime() < new Date(lastMessageAt).getTime();

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`messages-studio-thread ${convId === conversation.id ? "is-active" : ""}`}
                      onClick={() => {
                        setIsComposerOpen(false);
                        void chargerMessages(conversation.id);
                      }}
                    >
                      <div className="messages-studio-thread-avatar">
                        {(conversation.participant_names || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="messages-studio-thread-copy">
                        <div className="messages-studio-thread-line">
                          <strong>{conversation.participant_names || t("messages.messagingSpace")}</strong>
                          <span>{formatTime(lastMessageAt)}</span>
                        </div>
                        <p>{conversation.last_message || t("messages.noMessageDescription")}</p>
                      </div>
                      {isUnread ? <span className="messages-studio-thread-badge" /> : null}
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="messages-studio-list-footer"
              onClick={() => setThreadSearch("")}
            >
              <span>{t("messages.viewAllConversations")}</span>
              <span aria-hidden="true">›</span>
            </button>
          </aside>

          <main className="messages-studio-conversation">
            <div className="messages-studio-conversation-head">
              <div>
                <h2>{t("messages.workspaceTitle")}</h2>
                <p>{t("messages.workspaceDescription")}</p>
              </div>
              <button
                type="button"
                className="messages-studio-info"
                aria-label={t("messages.workspaceTitle")}
              >
                <InfoIcon />
              </button>
            </div>

            <div className={`messages-studio-messages ${messages.length === 0 ? "is-empty" : ""}`}>
              {messages.length === 0 ? (
                <div className="messages-studio-empty-chat">
                  <div className="messages-studio-empty-visual" aria-hidden="true">
                    <EmptyChatIcon />
                  </div>
                  <strong>
                    {hasActiveConversation
                      ? t("messages.noMessageTitle")
                      : t("messages.emptySelectionTitle")}
                  </strong>
                  <p>
                    {hasActiveConversation
                      ? t("messages.noMessageDescription")
                      : t("messages.emptySelectionDescription")}
                  </p>
                  {!hasActiveConversation ? (
                    <button
                      type="button"
                      className="messages-studio-primary messages-studio-empty-action"
                      onClick={ouvrirComposeur}
                    >
                      {t("messages.newConversationTitle")}
                    </button>
                  ) : null}
                </div>
              ) : (
                messages.map((item) => {
                  const mine = utilisateur?.id_utilisateur === item.id_utilisateur;

                  return (
                    <div key={item.id} className={`messages-studio-bubble-row ${mine ? "is-mine" : ""}`}>
                      {!mine ? (
                        <div className="messages-studio-bubble-avatar">{activeConversationInitial}</div>
                      ) : null}
                      <div className={`messages-studio-bubble ${mine ? "is-mine" : ""}`}>
                        <p>{item.contenu}</p>
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="messages-studio-composer-shell">
              <button
                type="button"
                className="messages-studio-composer-iconbutton"
                disabled={!hasActiveConversation}
                aria-label={t("messages.attachmentAction")}
              >
                <AttachmentIcon />
              </button>
              <input
                className="messages-studio-composer-input"
                placeholder={t("messages.composerPlaceholder")}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && hasActiveConversation && replyDraft.trim()) {
                    event.preventDefault();
                    void envoyerMessage();
                  }
                }}
                disabled={!hasActiveConversation}
                aria-label={t("messages.composerPlaceholder")}
              />
              <button
                type="button"
                className="messages-studio-composer-iconbutton"
                disabled={!hasActiveConversation}
                aria-label={t("messages.emojiAction")}
              >
                <EmojiIcon />
              </button>
              <button
                type="button"
                className="messages-studio-send"
                onClick={envoyerMessage}
                disabled={!hasActiveConversation || !replyDraft.trim()}
              >
                {t("common.actions.send")}
              </button>
            </div>
          </main>
        </div>
      </section>

      {isComposerOpen ? (
        <div className="messages-studio-modal-backdrop" onClick={fermerComposeur}>
          <section
            className="messages-studio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-compose-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="messages-studio-modal-head">
              <div>
                <h3 id="messages-compose-title">{t("messages.newConversationTitle")}</h3>
                <p>
                  {isCandidate
                    ? t("messages.newConversationCandidateDescription")
                    : t("messages.newConversationGenericDescription")}
                </p>
              </div>
              <button type="button" className="messages-studio-modal-close" onClick={fermerComposeur}>
                {t("common.actions.close")}
              </button>
            </div>

            <label className="messages-studio-modal-field">
              <span>{isCandidate ? t("messages.searchRecipientCandidate") : t("messages.searchRecipientGeneric")}</span>
              <div className="messages-studio-searchshell">
                <span className="messages-studio-searchicon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <input
                  className="messages-studio-searchinput"
                  value={recipientQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    void chargerSuggestions(value, isCandidate ? "entreprise" : undefined);
                  }}
                  placeholder={
                    isCandidate ? t("messages.searchRecipientCandidate") : t("messages.searchRecipientGeneric")
                  }
                />
              </div>
            </label>

            {recipientSuggestions.length > 0 ? (
              <div className="messages-studio-suggestions">
                {recipientSuggestions.map((recipient) => (
                  <button
                    key={recipient.id_utilisateur}
                    type="button"
                    className={`messages-studio-suggestion ${
                      selectedRecipient?.id_utilisateur === recipient.id_utilisateur ? "is-active" : ""
                    }`}
                    onClick={() => selectionnerDestinataire(recipient)}
                  >
                    <div className="messages-studio-suggestion-avatar">
                      {recipient.nom.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong>{recipient.nom}</strong>
                      <span>{translateRole(recipient.role)} • {recipient.subtitle || recipient.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {isCandidate && adminContacts.length > 0 ? (
              <div className="messages-studio-admin-bar">
                <span>{t("messages.adminContact")}</span>
                <div className="messages-studio-admin-list">
                  {adminContacts.map((admin) => (
                    <button
                      key={admin.id_utilisateur}
                      type="button"
                      className={`messages-studio-admin-chip ${
                        selectedRecipient?.id_utilisateur === admin.id_utilisateur ? "is-active" : ""
                      }`}
                      onClick={() => selectionnerDestinataire(admin)}
                    >
                      {admin.nom}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedRecipient ? (
              <div className="messages-studio-selected">
                <strong>{selectedRecipient.nom}</strong>
                <span>{translateRole(selectedRecipient.role)} • {selectedRecipient.email}</span>
              </div>
            ) : null}

            <label className="messages-studio-modal-field">
              <span>{t("messages.firstMessagePlaceholder")}</span>
              <textarea
                className="messages-studio-first-message"
                value={newConversationMessage}
                onChange={(event) => setNewConversationMessage(event.target.value)}
                placeholder={t("messages.firstMessagePlaceholder")}
              />
            </label>

            <div className="messages-studio-modal-actions">
              <button type="button" className="messages-studio-ghost" onClick={fermerComposeur}>
                {t("common.actions.cancel")}
              </button>
              <button type="button" className="messages-studio-primary" onClick={creerConversation}>
                {t("messages.startConversation")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
