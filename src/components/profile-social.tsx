"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";

import type { PublicUser } from "@/lib/store";

import { Avatar } from "./avatar";
import { DeveloperBadge } from "@/components/developer-badge";

async function readApiJson<T>(
  response: Response
): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  return contentType.includes("application/json")
    ? (response.json() as Promise<T>)
    : null;
}

export function ProfileSocial({
  author,
  signedIn,
  isOwnProfile,
}: {
  author: PublicUser;
  signedIn: boolean;
  isOwnProfile: boolean;
}) {
  const [profile, setProfile] = useState(author);
  const [busy, setBusy] = useState(false);

  const [panel, setPanel] = useState<
    "followers" | "following" | null
  >(null);

  const [people, setPeople] = useState<PublicUser[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [error, setError] = useState("");

  async function toggleFollow() {
    if (!signedIn) {
      window.location.assign(
        `/login?next=/authors/${profile.handle}`
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/users/${profile.handle}/follow`,
        {
          method: profile.isFollowing ? "DELETE" : "POST",
        }
      );

      const data = await readApiJson<{
        author?: PublicUser;
        error?: string;
      }>(response);

      if (!response.ok || !data?.author) {
        throw new Error(
          data?.error || "Could not update your follow."
        );
      }

      setProfile(data.author);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your follow."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openConnections(
    kind: "followers" | "following"
  ) {
    setPanel(kind);
    setLoadingPeople(true);
    setError("");

    try {
      const response = await fetch(
        `/api/users/${profile.handle}/connections?kind=${kind}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await readApiJson<{
        people?: PublicUser[];
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Connections API failed with status ${response.status}`
        );
      }

      if (!data) {
        throw new Error(
          "Connections API returned an invalid response."
        );
      }

      setPeople(data.people || []);
    } catch (err) {
      setPeople([]);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load people."
      );
    } finally {
      setLoadingPeople(false);
    }
  }

  return (
    <>
      {/* FOLLOW BUTTON */}
      {!isOwnProfile && (
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            className={`follow-button ${
              profile.isFollowing
                ? "follow-button-active"
                : ""
            }`}
            aria-pressed={profile.isFollowing}
          >
            <span
              className="follow-button-orbit"
              aria-hidden="true"
            >
              ✦
            </span>

            <span
              className="follow-button-icon"
              aria-hidden="true"
            >
              {profile.isFollowing ? "✓" : "+"}
            </span>

            <span>
              {busy
                ? "Saving…"
                : profile.isFollowing
                ? "In your circle"
                : "Add to your circle"}
            </span>
          </button>

          {error && (
            <p className="text-xs text-rose-300">
              {error}
            </p>
          )}
        </div>
      )}

      {/* SOCIAL STATS */}
      <style>{`
        .social-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
        }

        .social-stat {
          --stat-color: #a855f7;
          --stat-color-soft: rgba(168, 85, 247, 0.16);

          position: relative;
          isolation: isolate;
          display: flex;
          align-items: center;
          min-height: 78px;
          padding: 13px 14px;

          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0.018)
            ),
            rgba(12, 12, 20, 0.72);

          color: white;
          text-align: left;
          overflow: hidden;
          cursor: pointer;

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          box-shadow:
            0 8px 28px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.055);

          transition:
            transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 0.35s ease,
            box-shadow 0.35s ease,
            background 0.35s ease;
        }

        .social-stat-followers {
          --stat-color: #c084fc;
          --stat-color-soft: rgba(192, 132, 252, 0.16);
        }

        .social-stat-following {
          --stat-color: #818cf8;
          --stat-color-soft: rgba(129, 140, 248, 0.16);
        }

        .social-stat::before {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          left: -45px;
          top: -55px;
          border-radius: 50%;
          background: var(--stat-color);
          opacity: 0.06;
          filter: blur(25px);

          transition:
            transform 0.5s ease,
            opacity 0.4s ease;
        }

        .social-stat::after {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 0;
          height: 1px;

          background: linear-gradient(
            90deg,
            transparent,
            var(--stat-color),
            transparent
          );

          opacity: 0.15;
          transition: opacity 0.35s ease;
        }

        .social-stat:hover {
          transform: translateY(-4px);

          border-color: color-mix(
            in srgb,
            var(--stat-color) 45%,
            transparent
          );

          background:
            linear-gradient(
              135deg,
              var(--stat-color-soft),
              rgba(255, 255, 255, 0.025)
            ),
            rgba(15, 13, 25, 0.86);

          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.3),
            0 0 25px color-mix(
              in srgb,
              var(--stat-color) 15%,
              transparent
            ),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .social-stat:hover::before {
          transform: scale(1.8);
          opacity: 0.12;
        }

        .social-stat:hover::after {
          opacity: 0.65;
        }

        .social-stat:active {
          transform: translateY(-1px) scale(0.98);
        }

        .social-stat:focus-visible {
          outline: none;

          box-shadow:
            0 0 0 3px rgba(168, 85, 247, 0.18),
            0 0 0 6px rgba(168, 85, 247, 0.06),
            0 12px 30px rgba(0, 0, 0, 0.28);
        }

        .social-stat-icon {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          flex: 0 0 auto;

          width: 42px;
          height: 42px;
          margin-right: 11px;

          border-radius: 13px;

          background:
            linear-gradient(
              145deg,
              color-mix(
                in srgb,
                var(--stat-color) 25%,
                transparent
              ),
              rgba(255, 255, 255, 0.035)
            );

          border: 1px solid color-mix(
            in srgb,
            var(--stat-color) 28%,
            transparent
          );

          color: var(--stat-color);
          font-size: 17px;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            0 5px 16px color-mix(
              in srgb,
              var(--stat-color) 12%,
              transparent
            );

          transition:
            transform 0.4s cubic-bezier(0.2, 1.4, 0.5, 1),
            box-shadow 0.35s ease;
        }

        .social-stat:hover .social-stat-icon {
          transform: rotate(-7deg) scale(1.1);

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 7px 22px color-mix(
              in srgb,
              var(--stat-color) 22%,
              transparent
            );
        }

        .social-stat-copy {
          position: relative;
          z-index: 2;

          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .social-stat-value {
          display: block;

          font-size: 20px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.04em;

          background: linear-gradient(
            135deg,
            #ffffff 20%,
            var(--stat-color)
          );

          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;

          transition: transform 0.3s ease;
        }

        .social-stat:hover .social-stat-value {
          transform: translateX(2px);
        }

        .social-stat-label {
          margin-top: 4px;

          color: rgba(255, 255, 255, 0.48);

          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .social-stat-arrow {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 25px;
          height: 25px;
          margin-left: auto;

          border-radius: 50%;

          color: rgba(255, 255, 255, 0.38);
          font-size: 14px;

          background: rgba(255, 255, 255, 0.035);

          transition:
            transform 0.35s ease,
            background 0.35s ease,
            color 0.35s ease;
        }

        .social-stat:hover .social-stat-arrow {
          transform: translateX(4px);
          color: white;
          background: var(--stat-color-soft);
        }

        .social-stat-particle {
          position: absolute;

          width: 3px;
          height: 3px;

          border-radius: 50%;

          background: var(--stat-color);

          box-shadow:
            0 0 8px var(--stat-color);

          opacity: 0;

          pointer-events: none;

          transition: opacity 0.3s ease;
        }

        .social-stat-particle-1 {
          top: 12px;
          right: 48px;
        }

        .social-stat-particle-2 {
          bottom: 12px;
          right: 65px;
        }

        .social-stat-particle-3 {
          top: 25px;
          right: 25px;
        }

        .social-stat:hover .social-stat-particle {
          opacity: 0.8;
          animation: statParticle 1.8s ease-in-out infinite;
        }

        .social-stat:hover .social-stat-particle-2 {
          animation-delay: -0.6s;
        }

        .social-stat:hover .social-stat-particle-3 {
          animation-delay: -1.2s;
        }

        @keyframes statParticle {
          0%,
          100% {
            transform: translateY(0) scale(0.7);
          }

          50% {
            transform: translateY(-5px) scale(1.2);
          }
        }

        @media (max-width: 480px) {
          .social-stats-grid {
            gap: 9px;
          }

          .social-stat {
            min-height: 70px;
            padding: 10px;
            border-radius: 15px;
          }

          .social-stat-icon {
            width: 37px;
            height: 37px;
            margin-right: 8px;
          }

          .social-stat-value {
            font-size: 18px;
          }

          .social-stat-label {
            font-size: 9px;
          }

          .social-stat-arrow {
            width: 22px;
            height: 22px;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .social-stat,
          .social-stat::before,
          .social-stat::after,
          .social-stat-icon,
          .social-stat-value,
          .social-stat-arrow {
            transition: none;
          }

          .social-stat-particle {
            animation: none !important;
          }
        }
      `}</style>

      <div className="social-stats-grid">
        {(
          [
            [
              "followers",
              "Followers",
              "✦",
              profile.followerCount,
            ],
            [
              "following",
              "Following",
              "↗",
              profile.followingCount,
            ],
          ] as const
        ).map(([kind, label, icon, value]) => (
          <button
            key={kind}
            type="button"
            onClick={() => openConnections(kind)}
            className={`social-stat social-stat-${kind}`}
          >
            <span
              className="social-stat-particle social-stat-particle-1"
              aria-hidden="true"
            />

            <span
              className="social-stat-particle social-stat-particle-2"
              aria-hidden="true"
            />

            <span
              className="social-stat-particle social-stat-particle-3"
              aria-hidden="true"
            />

            <span
              className="social-stat-icon"
              aria-hidden="true"
            >
              {icon}
            </span>

            <span className="social-stat-copy">
              <span className="social-stat-value">
                {value}
              </span>

              <span className="social-stat-label">
                {label}
              </span>
            </span>

            <span
              className="social-stat-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        ))}
      </div>

  {/* FOLLOWERS / FOLLOWING MODAL */}
      {panel &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${profile.name}'s ${panel}`}
            onMouseDown={() => setPanel(null)}
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <section
              onMouseDown={(event) => event.stopPropagation()}
              className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
              style={{
                maxHeight: "80vh",
              }}
            >
              {/* HEADER */}
              <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-serif text-xl text-white">
                    {panel === "followers" ? "Followers" : "Following"}
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    @{profile.handle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="btn-ghost btn-sm"
                  aria-label="Close"
                >
                  Close
                </button>
              </header>

              {/* PEOPLE LIST */}
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {loadingPeople ? (
                  <p className="p-3 text-sm text-slate-400">
                    Gathering the circle…
                  </p>
                ) : people.length ? (
                  <div className="space-y-2">
                    {people.map((person) => (
                      <Link
                        key={person.id}
                        href={`/authors/${person.handle}`}
                        onClick={() => setPanel(null)}
                        className="flex min-w-0 items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.06]"
                      >
                        <Avatar
                          name={person.name}
                          color={person.avatarColor}
                          image={person.avatarImage}
                          verified={person.verified}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
                            <span className="min-w-0 truncate">
                              {person.name}
                            </span>

                            <span className="shrink-0">
                              <DeveloperBadge email={person.email} />
                            </span>
                          </span>

                          <span className="block truncate text-xs text-slate-400">
                            @{person.handle}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 text-sm text-slate-400">
                    No one here yet.
                  </p>
                )}
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}