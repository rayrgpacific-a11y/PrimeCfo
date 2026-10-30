"use client";

import React, { useCallback, useState } from "react";
import { Calendar, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mailtoSales } from "@/lib/site/contact";
import { CALENDAR_URL } from "@/lib/site/calendly";

type TalkToAdvisorProps = {
  /** Resolved Calendly event URL (from advisorUrl). */
  href?: string;
  variant?: "header" | "insight" | "inline" | "button";
  label?: string;
  subject?: string;
  className?: string;
  showEmailFallback?: boolean;
};

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

function loadCalendlyScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Calendly) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-calendly]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Calendly script failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.dataset.calendly = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Calendly script failed"));
    document.body.appendChild(s);
  });
}

/**
 * Advisor booking CTA — tries Calendly popup embed, falls back to plain anchor.
 */
export default function TalkToAdvisor({
  href = CALENDAR_URL,
  variant = "header",
  label,
  subject = "PrimeCFO.ai — talk to my advisor",
  className = "",
  showEmailFallback = true,
}: TalkToAdvisorProps) {
  const [opening, setOpening] = useState(false);
  const url = href || CALENDAR_URL;

  const openBooking = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setOpening(true);
      try {
        await loadCalendlyScript();
        if (window.Calendly?.initPopupWidget) {
          window.Calendly.initPopupWidget({ url });
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setOpening(false);
      }
    },
    [url]
  );

  if (variant === "insight") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openBooking}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          {opening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
          {label ?? "Discuss this with your Prime advisor"}
        </a>
        {showEmailFallback ? (
          <a
            href={mailtoSales(subject)}
            className="text-xs text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline transition-colors"
          >
            Email
          </a>
        ) : null}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={openBooking}
        className={`inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 font-medium ${className}`}
      >
        {opening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
        {label ?? "Talk to Your Advisor"}
      </a>
    );
  }

  if (variant === "button") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={openBooking}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-teal-500/40 text-teal-300 hover:bg-teal-500/10 text-sm font-medium transition-colors ${className}`}
      >
        {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        {label ?? "Schedule meeting"}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={openBooking}
      className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-medium hover:bg-teal-500/20 hover:border-teal-500/50 transition-colors ${className}`}
    >
      {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
      {label ?? "Talk to Your Advisor"}
    </a>
  );
}

/** Helper for non-React callers that still need a toast on failure elsewhere. */
export function notifyAdvisorOpenFailed() {
  toast.error("Could not open the scheduling page — please try again.");
}
