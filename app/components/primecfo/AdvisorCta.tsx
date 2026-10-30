"use client";

import React, { useEffect, useState } from "react";
import TalkToAdvisor from "@/app/components/primecfo/TalkToAdvisor";
import { advisorUrl, CALENDAR_URL } from "@/lib/site/calendly";
import type { ProductTier } from "@/lib/tiers";

type AdvisorCtaProps = {
  variant?: "header" | "insight" | "inline";
  subject?: string;
  className?: string;
  /** Optional override; otherwise resolved from billing status. */
  href?: string;
};

type BillingLite = {
  subscription?: { status?: string; plan_id?: string | null } | null;
  entitlements?: { advisoryMeeting?: "none" | "quarterly" | "monthly"; tier?: ProductTier } | null;
  currentPlan?: { id?: string } | null;
};

/**
 * Persistent path to Prime Accounting Solutions — the human backstop behind the AI.
 * Resolves tier/trial Calendly URL from billing status when available.
 */
export default function AdvisorCta({
  variant = "header",
  subject = "PrimeCFO.ai — talk to my advisor",
  className = "",
  href,
}: AdvisorCtaProps) {
  const [resolved, setResolved] = useState(href ?? CALENDAR_URL);

  useEffect(() => {
    if (href) {
      setResolved(href);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as BillingLite;
        if (cancelled) return;
        const url = advisorUrl({
          status: data.subscription?.status,
          tier: data.entitlements?.tier,
          advisoryMeeting: data.entitlements?.advisoryMeeting,
        });
        setResolved(url);
      } catch {
        /* keep default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <TalkToAdvisor
      href={resolved}
      variant={variant}
      subject={subject}
      className={className}
    />
  );
}
