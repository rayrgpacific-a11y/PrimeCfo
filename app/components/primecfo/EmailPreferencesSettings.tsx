"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

type Prefs = {
  ai_summary_enabled: boolean;
  marketing_enabled: boolean;
  unsubscribed_at: string | null;
  welcome_snapshot_sent_at: string | null;
  last_summary_sent_at: string | null;
};

export default function EmailPreferencesSettings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [welcomeLog, setWelcomeLog] = useState<{
    recipient: string;
    provider_message_id: string | null;
    status: string;
    error_detail: string | null;
    created_at: string;
  } | null>(null);
  const [cadenceNote, setCadenceNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/email-preferences", { cache: "no-store" });
        const data = (await res.json()) as {
          preferences?: Prefs;
          cadenceNote?: string;
          welcomeEmailLog?: {
            recipient: string;
            provider_message_id: string | null;
            status: string;
            error_detail: string | null;
            created_at: string;
          } | null;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        if (!cancelled) {
          setPrefs(data.preferences ?? null);
          setCadenceNote(data.cadenceNote ?? "");
          setWelcomeLog(data.welcomeEmailLog ?? null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error("Could not load email preferences.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (patch: Partial<Prefs> & { unsubscribe?: boolean }) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { preferences?: Prefs; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setPrefs(data.preferences ?? null);
      toast.success(patch.unsubscribe ? "Unsubscribed from email summaries." : "Email preferences saved.");
    } catch (e) {
      console.error(e);
      toast.error("Could not save email preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Email summaries</h3>
          <p className="text-sm text-slate-400">
            Plain-English AI summaries emailed on your plan&apos;s cadence. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {loading || !prefs ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading preferences…
        </div>
      ) : (
        <div className="space-y-4">
          {cadenceNote ? <p className="text-xs text-slate-500">{cadenceNote}</p> : null}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
              checked={prefs.ai_summary_enabled && !prefs.unsubscribed_at}
              disabled={saving}
              onChange={(e) => void save({ ai_summary_enabled: e.target.checked })}
            />
            <span>
              <span className="text-sm text-white font-medium">AI financial summary emails</span>
              <span className="block text-xs text-slate-400 mt-0.5">
                Monthly (Starter/See) or weekly (Understand/Act), with a PDF snapshot attached.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-500"
              checked={prefs.marketing_enabled}
              disabled={saving}
              onChange={(e) => void save({ marketing_enabled: e.target.checked })}
            />
            <span>
              <span className="text-sm text-white font-medium">Product updates</span>
              <span className="block text-xs text-slate-400 mt-0.5">
                Occasional product news from PrimeCFO.ai (optional).
              </span>
            </span>
          </label>

          {prefs.welcome_snapshot_sent_at ? (
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                Welcome Snapshot recorded {new Date(prefs.welcome_snapshot_sent_at).toLocaleDateString()}
                {welcomeLog?.status === 'sent' ? ' — delivered' : welcomeLog?.status === 'failed' ? ' — send failed' : ''}.
              </p>
              {welcomeLog ? (
                <>
                  <p>To: {welcomeLog.recipient}</p>
                  {welcomeLog.provider_message_id ? (
                    <p>Message ID: {welcomeLog.provider_message_id}</p>
                  ) : welcomeLog.status === 'failed' ? (
                    <p className="text-amber-400/90">{welcomeLog.error_detail ?? 'Provider rejected or API key missing'}</p>
                  ) : (
                    <p className="text-amber-400/90">No provider message ID — email may not have been sent.</p>
                  )}
                </>
              ) : (
                <p className="text-amber-400/90">No delivery log on file for this send.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Welcome Snapshot emails send 7 days after QuickBooks connect (if summaries are enabled).
            </p>
          )}

          {prefs.last_summary_sent_at ? (
            <p className="text-xs text-slate-500">
              Last summary sent {new Date(prefs.last_summary_sent_at).toLocaleDateString()}.
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving || !!prefs.unsubscribed_at}
            onClick={() => void save({ unsubscribe: true })}
            className="text-sm text-slate-400 hover:text-red-300 underline-offset-2 hover:underline disabled:opacity-40"
          >
            Unsubscribe from all summary emails
          </button>
        </div>
      )}
    </div>
  );
}
