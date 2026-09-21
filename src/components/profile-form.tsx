"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/store";
import { Avatar } from "./avatar";

const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.85;
const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous, since we compress before upload anyway

/** Reads an image file, downsizes it to fit MAX_DIMENSION, and returns a compressed JPEG data URI. */
function fileToAvatarDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Your browser can't process images here."));
          return;
        }
        // Flatten any transparency onto white before JPEG encoding (JPEG has no alpha channel).
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileForm({ user }: { user: PublicUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [photo, setPhoto] = useState<string | null>(user.avatarImage);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // reset so choosing the same file again still fires onChange
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setStatus("That image is too large — pick something under 8MB.");
      return;
    }

    setProcessingPhoto(true);
    setStatus(null);
    try {
      const dataUri = await fileToAvatarDataUri(file);
      setPhoto(dataUri);
      setPhotoChanged(true);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not process that image.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoChanged(true);
    setStatus(null);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, ...(photoChanged ? { avatarImage: photo } : {}) }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setStatus(response.ok ? "Profile updated." : (data.error ?? "Could not save your profile."));
    if (response.ok) {
      setPhotoChanged(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-white">Writer profile</h2>
        <span className="text-xs text-slate-500">@{user.handle}</span>
      </div>

      <div className="flex items-center gap-4">
        <Avatar name={name || user.name} color={user.avatarColor} image={photo} size="lg" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingPhoto}
            >
              {processingPhoto ? "Processing…" : photo ? "Change photo" : "Upload photo"}
            </button>
            {photo ? (
              <button
                type="button"
                className="text-xs text-slate-500 transition hover:text-rose-300"
                onClick={removePhoto}
              >
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">JPEG, PNG, WEBP or GIF, from your device. Resized automatically.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="profile-name">
          Display name
        </label>
        <input
          id="profile-name"
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-bio">
          Bio
        </label>
        <textarea
          id="profile-bio"
          className="field min-h-24 resize-y"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={280}
        />
      </div>

      {status ? <p className="text-sm text-violet-200">{status}</p> : null}

      <button type="submit" className="btn-primary" disabled={busy || processingPhoto}>
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
