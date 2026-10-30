"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateInsights,
  InsightsGenerateError,
  type ReportRange,
  type InsightsResponse,
} from "@/lib/api/client";
import { toast } from "sonner";

/**
 * When the API reports refreshingInsights (snapshot exists, no cards yet),
 * automatically call POST /api/insights/generate once per snapshot.
 */
export function useAutoGenerateInsights(opts: {
  clientId: string | undefined;
  range: ReportRange;
  refreshingInsights: boolean;
  snapshotId?: string | null;
  enabled?: boolean;
}) {
  const { clientId, range, refreshingInsights, snapshotId, enabled = true } = opts;
  const queryClient = useQueryClient();
  const attemptedForSnapshot = useRef<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => generateInsights(clientId!, range),
    onSuccess: (result: InsightsResponse) => {
      queryClient.setQueryData(["insights", clientId, range], result);
    },
    onError: (e) => {
      toast.error(
        e instanceof InsightsGenerateError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to generate insights"
      );
    },
  });

  useEffect(() => {
    attemptedForSnapshot.current = null;
  }, [clientId, range]);

  useEffect(() => {
    if (!enabled || !clientId || !refreshingInsights || generateMutation.isPending) return;

    const key = snapshotId ?? "unknown";
    if (attemptedForSnapshot.current === key) return;
    attemptedForSnapshot.current = key;

    generateMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate once per snapshot
  }, [enabled, clientId, range, refreshingInsights, snapshotId, generateMutation.isPending]);

  return generateMutation;
}
