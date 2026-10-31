import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { isAdminEmail } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/qbo/supabaseAdmin';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: 'alert' | 'sync' | 'insight' | 'system';
  severity: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  link: string;
};

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const searchParams = request.nextUrl.searchParams;
  let clientId = searchParams.get('clientId')?.trim();

  const sb = supabaseAdmin();

  // If no clientId supplied, resolve default client for this user
  if (!clientId) {
    if (isAdminEmail(user.email)) {
      const { data: firstClient } = await sb
        .from('clients')
        .select('client_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      clientId = firstClient?.client_id ?? null;
    } else {
      const { data: userClient } = await sb
        .from('clients')
        .select('client_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      clientId = userClient?.client_id ?? null;
    }
  }

  const notifications: NotificationItem[] = [];

  if (clientId) {
    // 1. Fetch active financial alerts
    const { data: alerts } = await sb
      .from('financial_alert_events')
      .select('id, alert_kind, title, body, severity_key, state, updated_at')
      .eq('client_id', clientId)
      .in('state', ['active', 'acknowledged'])
      .order('updated_at', { ascending: false })
      .limit(4);

    if (alerts && alerts.length > 0) {
      for (const a of alerts) {
        const isCritical = a.alert_kind === 'cash_crunch' || a.alert_kind === 'margin_erode';
        notifications.push({
          id: `alert-${a.id}`,
          title: a.title,
          message: a.body,
          category: 'alert',
          severity: isCritical ? 'critical' : 'warning',
          timestamp: a.updated_at,
          link: '/reports',
        });
      }
    }

    // 2. Fetch latest AI insights
    const { data: insights } = await sb
      .from('ai_insights')
      .select('id, title, description, urgency, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (insights && insights.length > 0) {
      for (const ins of insights) {
        const isUrgent = ins.urgency === 'action_required' || ins.urgency === 'watch';
        notifications.push({
          id: `insight-${ins.id}`,
          title: `AI Insight: ${ins.title}`,
          message: ins.description,
          category: 'insight',
          severity: isUrgent ? 'warning' : 'info',
          timestamp: ins.created_at,
          link: '/insights',
        });
      }
    }

    // 3. Fetch latest QuickBooks sync event
    const { data: qboConn } = await sb
      .from('quickbooks_connections')
      .select('realm_id, status, updated_at, created_at')
      .eq('client_id', clientId)
      .maybeSingle();

    if (qboConn) {
      const isConnected = qboConn.status === 'connected';
      notifications.push({
        id: `sync-qbo-${clientId}`,
        title: isConnected ? 'QuickBooks Sync Active' : 'QuickBooks Re-auth Required',
        message: isConnected
          ? `Company Realm ${qboConn.realm_id} is connected and syncing live general ledger data.`
          : 'QuickBooks connection requires authorization.',
        category: 'sync',
        severity: isConnected ? 'success' : 'warning',
        timestamp: qboConn.updated_at ?? qboConn.created_at ?? new Date().toISOString(),
        link: '/connect',
      });
    }
  }

  // Fallback initial notifications if client is brand new or no events yet
  if (notifications.length === 0) {
    notifications.push({
      id: 'system-welcome',
      title: 'Welcome to PrimeCFO.ai',
      message: 'Connect your QuickBooks account to generate live financial statements and AI insights.',
      category: 'system',
      severity: 'info',
      timestamp: new Date().toISOString(),
      link: '/connect',
    });
  }

  // Sort all notifications by timestamp DESC
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ notifications });
}

