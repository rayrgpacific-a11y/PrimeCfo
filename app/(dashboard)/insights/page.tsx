"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientContext } from "@/contexts/ClientContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import AIInsights from "@/app/components/primecfo/AIInsights";
import RiskPosture from "@/app/components/primecfo/RiskPosture";
import { Select } from "@/app/components/ui/select";
import {
  getInsights,
  generateInsights,
  syncReports,
  SyncError,
  InsightsGenerateError,
  type ReportRange,
  type InsightsResponse,
} from "@/lib/api/client";
import { useAutoGenerateInsights } from "@/app/hooks/useAutoGenerateInsights";
import type { AIInsight, RiskPosture as RiskPostureType } from "@/lib/financialData";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const RANGE_OPTIONS = [
  { value: "3m" as const, label: "Last 3 Months" },
  { value: "6m" as const, label: "Last 6 Months" },
  { value: "12m" as const, label: "Trailing 12 Months" },
  { value: "4q" as const, label: "Last 4 Quarters" },
];

export default function InsightsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedClient } = useClientContext();
  const { range, setRange } = useReportRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ["insights", selectedClient?.id, range],
    queryFn: () => getInsights(selectedClient!.id, range),
    enabled: !!selectedClient?.id,
    refetchInterval: (query) =>
      query.state.data?.refreshingInsights ? 4000 : false,
  });

  const autoGenerate = useAutoGenerateInsights({
    clientId: selectedClient?.id,
    range,
    refreshingInsights: data?.refreshingInsights === true,
    snapshotId: data?.snapshotId,
    enabled: !!selectedClient?.id,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncReports(selectedClient!.id, range, range === "4q" ? "quarter" : "month"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", selectedClient?.id, range] });
      queryClient.invalidateQueries({ queryKey: ["insights", selectedClient?.id, range] });
      toast.success("Financial data synced", {
        description: "Now generating AI executive insights...",
      });
      generateMutation.mutate();
    },
    onError: (err) => {
      if (err instanceof SyncError && (err.code === "no_connection" || err.code === "needs_reauth")) {
        toast.error("QuickBooks connection required", {
          description: "Please reconnect or authorize your QuickBooks account to sync reports.",
          action: {
            label: "Reconnect",
            onClick: () => router.push("/connect"),
          },
        });
      } else {
        toast.error("Could not sync reports", {
          description: "Intuit services may be busy. Please try again in a moment.",
        });
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateInsights(selectedClient!.id, range),
    onSuccess: (result: InsightsResponse) => {
      queryClient.setQueryData(["insights", selectedClient?.id, range], result);
      toast.success("AI insights ready", {
        description: "Executive analysis and risk posture are up to date.",
      });
    },
    onError: (e) => {
      if (e instanceof InsightsGenerateError && e.code === "no_snapshot") {
        toast.error("Financial sync required", {
          description: "QuickBooks data has not been synced for this period yet.",
          action: {
            label: "Sync Now",
            onClick: () => syncMutation.mutate(),
          },
        });
        return;
      }
      toast.error("Could not generate insights", {
        description:
          e instanceof InsightsGenerateError || e instanceof Error
            ? e.message
            : "Please try again in a few moments.",
      });
    },
  });

  const insights: AIInsight[] = data?.insights ?? [];
  const riskPosture: RiskPostureType | null = data?.riskPosture ?? null;
  const isGenerating = autoGenerate.isPending || generateMutation.isPending || syncMutation.isPending;

  if (!selectedClient) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">AI Insights</h2>
        <p className="text-slate-400">Loading your business profile…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Select<ReportRange>
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
          aria-label="Time period"
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-400 py-4">
          {error instanceof Error ? error.message : "Failed to load insights"}
        </p>
      ) : insights.length === 0 && (data?.refreshingInsights || isGenerating) ? (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-10 text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Generating insights…</p>
          <p className="text-slate-500 text-sm mt-2">
            Building analysis for your latest metrics snapshot.
          </p>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-white font-medium mb-2">No AI insights yet</p>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            {data?.needsGeneration
              ? "Your metrics snapshot is ready — generate plain-English analysis for this period."
              : "Sync QuickBooks data for this period to generate plain-English analysis powered by AI."}
          </p>
          {data?.needsGeneration ? (
            <button
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generateMutation.isPending ? "Generating insights..." : "Generate insights"}
            </button>
          ) : (
            <button
              onClick={() => syncMutation.mutate()}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {syncMutation.isPending ? "Syncing data..." : generateMutation.isPending ? "Generating insights..." : "Sync & Generate Insights"}
            </button>
          )}
        </div>
      ) : (
        <>
          <RiskPosture riskPosture={riskPosture} />
          <AIInsights
            insights={insights}
            onRefresh={() => generateMutation.mutate()}
            isRefreshing={isGenerating}
            snapshotId={data?.snapshotId}
          />
        </>
      )}
    </div>
  );
}
