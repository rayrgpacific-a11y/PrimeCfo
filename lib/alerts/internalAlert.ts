/**
 * Internal ops alerts — console + optional email when configured.
 */
export async function alertInternal(subject: string, detail: string): Promise<void> {
  const payload = { subject, detail, at: new Date().toISOString() };
  console.error('[internal-alert]', JSON.stringify(payload));

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.SUBSCRIBER_ALERT_EMAIL?.trim();
  const from =
    process.env.SUBSCRIBER_ALERT_FROM?.trim() || 'PrimeCFO.ai <alerts@primecfo.ai>';

  if (!apiKey || !to) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        subject: `[PrimeCFO] ${subject}`,
        text: detail,
      }),
    });
  } catch (e) {
    console.error('[internal-alert] email failed', e);
  }
}
