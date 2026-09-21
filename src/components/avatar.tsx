import Link from "next/link";
import { VerificationBadge } from "./verification-badge";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  name: string;
  color: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  href?: string;
  verified?: boolean;
};

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, color, image, size = "md", href, verified = false }: AvatarProps) {
  const content = image ? (
    // eslint-disable-next-line @next/next/no-img-element -- data: URIs can't go through next/image's loader
    <img
      src={image}
      alt={name}
      className={`inline-block ${SIZES[size]} shrink-0 rounded-full object-cover ring-2 ring-white/10`}
    />
  ) : (
    <span
      className={`inline-flex ${SIZES[size]} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} font-semibold text-white ring-2 ring-white/10`}
      aria-hidden={Boolean(href)}
    >
      {initials(name)}
    </span>
  );

  const decorated = <span className="relative inline-flex">{content}<VerificationBadge verified={verified} /></span>;
  if (!href) return decorated;
  return (
    <Link href={href} className="transition hover:scale-105" title={name}>
      {decorated}
    </Link>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}
