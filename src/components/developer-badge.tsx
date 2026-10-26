

const DEVELOPER_EMAIL = "rudra763.org.in@gmail.com";

type DeveloperBadgeProps = {
  email?: string | null;
};

export function DeveloperBadge({ email }: DeveloperBadgeProps) {
  if (!email || email.trim().toLowerCase() !== DEVELOPER_EMAIL) {
    return null;
  }

  return (
    <>
      <style>{`
        .developer-badge {
          --dev-purple: #a855f7;
          --dev-purple-light: #d8b4fe;

          position: relative;
          isolation: isolate;

          display: inline-flex;
          align-items: center;
          gap: 7px;

          height: 30px;
          padding: 0 11px 0 6px;

          border: 1px solid rgba(168, 85, 247, 0.32);
          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              rgba(168, 85, 247, 0.18),
              rgba(88, 28, 135, 0.08)
            ),
            rgba(15, 12, 24, 0.72);

          color: rgba(255, 255, 255, 0.82);

          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;

          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          box-shadow:
            0 5px 18px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);

          cursor: default;
          overflow: hidden;

          transition:
            transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .developer-badge::before {
          content: "";
          position: absolute;
          inset: 0;

          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.13) 45%,
            transparent 70%
          );

          transform: translateX(-130%);
          transition: transform 0.7s ease;

          pointer-events: none;
        }

        .developer-badge:hover {
          transform: translateY(-2px);

          border-color: rgba(192, 132, 252, 0.65);

          box-shadow:
            0 9px 25px rgba(0, 0, 0, 0.28),
            0 0 22px rgba(168, 85, 247, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .developer-badge:hover::before {
          transform: translateX(130%);
        }

        .developer-badge-mark {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 21px;
          height: 21px;

          border-radius: 7px;

          background: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.38),
            rgba(124, 58, 237, 0.18)
          );

          border: 1px solid rgba(216, 180, 254, 0.24);

          color: var(--dev-purple-light);

          font-family:
            "SFMono-Regular",
            Consolas,
            "Liberation Mono",
            monospace;

          font-size: 10px;
          font-weight: 800;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 3px 10px rgba(168, 85, 247, 0.18);

          transition:
            transform 0.35s cubic-bezier(0.2, 1.4, 0.5, 1),
            box-shadow 0.35s ease;
        }

        .developer-badge:hover .developer-badge-mark {
          transform: rotate(-6deg) scale(1.08);

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 4px 15px rgba(168, 85, 247, 0.3);
        }

        .developer-badge-text {
          position: relative;
          z-index: 2;

          background: linear-gradient(
            135deg,
            #ffffff,
            #d8b4fe
          );

          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .developer-badge-spark {
          position: relative;
          z-index: 2;

          display: inline-flex;
          margin-left: 1px;

          color: #d8b4fe;
          font-size: 9px;

          filter: drop-shadow(
            0 0 5px rgba(216, 180, 254, 0.85)
          );

          animation: developerSpark 2s ease-in-out infinite;

          transition:
            transform 0.3s ease,
            color 0.3s ease;
        }

        .developer-badge:hover .developer-badge-spark {
          color: #ffffff;
          transform: rotate(25deg) scale(1.2);
        }

        .developer-badge::after {
          content: "";

          position: absolute;

          width: 45px;
          height: 45px;

          left: 2px;
          top: -8px;

          border-radius: 50%;

          background: rgba(168, 85, 247, 0.18);

          filter: blur(15px);

          opacity: 0.45;

          pointer-events: none;

          transition:
            transform 0.4s ease,
            opacity 0.4s ease;
        }

        .developer-badge:hover::after {
          transform: scale(1.5);
          opacity: 0.8;
        }

        @keyframes developerSpark {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(0.85) rotate(0deg);
          }

          50% {
            opacity: 1;
            transform: scale(1.15) rotate(12deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .developer-badge,
          .developer-badge::before,
          .developer-badge::after,
          .developer-badge-mark,
          .developer-badge-spark {
            transition: none;
            animation: none;
          }
        }
      `}</style>

      <span
        className="developer-badge"
        title="Site developer"
        aria-label="Site developer"
      >
        <span
          className="developer-badge-mark"
          aria-hidden="true"
        >
          &lt;/&gt;
        </span>

        <span className="developer-badge-text">
          Developer
        </span>

        <span
          className="developer-badge-spark"
          aria-hidden="true"
        >
          ✦
        </span>
      </span>
    </>
  );
}