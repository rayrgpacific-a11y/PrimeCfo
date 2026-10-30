/**
 * Server-side PDF document for PrimeCFO financial summary reports.
 * Shared by Download PDF and monthly AI summary emails.
 */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ReportPdfData } from '@/lib/reports/buildReportPdfData';
import { money } from '@/lib/reports/buildReportPdfData';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 12,
  },
  brand: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  muted: {
    color: '#64748b',
    fontSize: 9,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#134e4a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpi: {
    width: '23%',
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  colLabel: { width: '40%' },
  colNum: { width: '20%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
});

function fmtPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

function fmtRatio(n: number | null): string {
  if (n == null) return '—';
  return n.toFixed(2);
}

function ReportDocument({ data }: { data: ReportPdfData }) {
  const generated = new Date(data.generatedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>PrimeCFO.ai</Text>
          <Text style={styles.title}>{data.companyName} — Financial Summary</Text>
          <Text style={styles.muted}>
            {data.rangeLabel} · {data.displayBasis} basis · Generated {generated}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key metrics</Text>
          <View style={styles.grid}>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Revenue</Text>
              <Text style={styles.kpiValue}>{money(data.summary.revenue)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Net income</Text>
              <Text style={styles.kpiValue}>{money(data.summary.netIncome)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Cash</Text>
              <Text style={styles.kpiValue}>{money(data.summary.cash)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Gross margin</Text>
              <Text style={styles.kpiValue}>{fmtPct(data.summary.grossMargin)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Net margin</Text>
              <Text style={styles.kpiValue}>{fmtPct(data.summary.netMargin)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Current ratio</Text>
              <Text style={styles.kpiValue}>{fmtRatio(data.summary.currentRatio)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Quick ratio</Text>
              <Text style={styles.kpiValue}>{fmtRatio(data.summary.quickRatio)}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>DSO</Text>
              <Text style={styles.kpiValue}>
                {data.summary.dso != null ? `${data.summary.dso} days` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {data.arAging ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>A/R Aging (from Aging Summary)</Text>
            <View style={styles.grid}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Total open</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.total)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Current</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.current)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>1–30</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.days1_30)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>31–60</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.days31_60)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>61–90</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.days61_90)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>91+</Text>
                <Text style={styles.kpiValue}>{money(data.arAging.days91_plus)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {data.monthly.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Period detail</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colLabel}>Period</Text>
              <Text style={styles.colNum}>Revenue</Text>
              <Text style={styles.colNum}>Expenses</Text>
              <Text style={styles.colNum}>Net</Text>
            </View>
            {data.monthly.slice(-12).map((row) => (
              <View key={row.label} style={styles.tableRow} wrap={false}>
                <Text style={styles.colLabel}>{row.label}</Text>
                <Text style={styles.colNum}>{money(row.revenue)}</Text>
                <Text style={styles.colNum}>{money(row.expenses)}</Text>
                <Text style={styles.colNum}>{money(row.profit)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Numbers tie to synced QuickBooks reports. Prepared by PrimeCFO.ai for advisory use —
          not a formal audit opinion.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(data: ReportPdfData): Promise<Buffer> {
  // @react-pdf typings expect DocumentProps; cast is safe for our ReportDocument wrapper.
  const element = React.createElement(ReportDocument, { data }) as React.ReactElement;
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
  return Buffer.from(buffer);
}
