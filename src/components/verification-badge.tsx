export function VerificationBadge({ verified = false }: { verified?: boolean }) {
  if (!verified) return null;
  return <span title="Verified writer" aria-label="Verified writer" className="verification-badge">✦</span>;
}
