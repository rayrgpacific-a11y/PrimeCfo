/**

 * AR aging + Calendly regression tests.

 */

import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { parseArAgingBuckets, arOver30Ratio, normalizeAgingColTitle } from '@/lib/reporting/parseArAging';

import { advisorUrl, CALENDLY_EVENTS, CALENDAR_URL } from '@/lib/site/calendly';



/** Andrew Jul 28 pull — hyphenated columns, TOTAL data row. */

const AR_RAW_JUL28 = {

  Columns: {

    Column: [

      { ColTitle: { value: '' } },

      { ColTitle: { value: 'Current' } },

      { ColTitle: { value: '1-30' } },

      { ColTitle: { value: '31-60' } },

      { ColTitle: { value: '61-90' } },

      { ColTitle: { value: '91 and over' } },

    ],

  },

  Rows: {

    Row: [

      {

        type: 'Data',

        ColData: [

          { value: 'TOTAL' },

          { value: '4725.00' },

          { value: '2804.43' },

          { value: '3419.00' },

          { value: '0' },

          { value: '5036.72' },

        ],

      },

    ],

  },

};



/** RG Pacific Aug 3 — spaced columns + GrandTotal row. */

const AR_RAW_AUG3 = {

  Columns: {

    Column: [

      { ColTitle: '' },

      { ColTitle: 'Current' },

      { ColTitle: '1 - 30' },

      { ColTitle: '31 - 60' },

      { ColTitle: '61 - 90' },

      { ColTitle: '91 and over' },

      { ColTitle: 'Total' },

    ],

  },

  Rows: {

    Row: [

      {

        group: 'GrandTotal',

        Summary: {

          ColData: [

            { value: 'TOTAL' },

            { value: '2200.00' },

            { value: '10597.50' },

            { value: '3898.43' },

            { value: '0' },

            { value: '3611.72' },

            { value: '20307.65' },

          ],

        },

      },

    ],

  },

};



describe('AR aging + Calendly', () => {

  it('normalizes spaced / and-over column titles', () => {

    assert.equal(normalizeAgingColTitle('1 - 30'), '1-30');

    assert.equal(normalizeAgingColTitle('91 and over'), '91+');

  });



  it('parses Jul 28 AR aging to ~$15,985 with $5,037 in 91+', () => {

    const b = parseArAgingBuckets(AR_RAW_JUL28);

    assert.ok(Math.abs(b.total - 15985.15) < 0.02);

    assert.ok(Math.abs(b.days91_plus - 5036.72) < 0.02);

    assert.ok(arOver30Ratio(b) > 0.5);

  });



  it('parses Aug 3 GrandTotal AR aging to ~$20,307.65', () => {

    const b = parseArAgingBuckets(AR_RAW_AUG3);

    assert.ok(Math.abs(b.total - 20307.65) < 0.02, `total=${b.total}`);

    assert.ok(Math.abs(b.current - 2200) < 0.02);

    assert.ok(Math.abs(b.days1_30 - 10597.5) < 0.02);

    assert.ok(Math.abs(b.days31_60 - 3898.43) < 0.02);

    assert.ok(Math.abs(b.days61_90 - 0) < 0.02);

    assert.ok(Math.abs(b.days91_plus - 3611.72) < 0.02);

  });



  it('advisorUrl maps trial / understand / act', () => {

    assert.equal(advisorUrl({ status: 'trialing' }), CALENDLY_EVENTS.trialWelcome);

    assert.equal(

      advisorUrl({ status: 'active', advisoryMeeting: 'quarterly' }),

      CALENDLY_EVENTS.understand

    );

    assert.equal(advisorUrl({ status: 'active', tier: 'act' }), CALENDLY_EVENTS.act);

    assert.ok(!CALENDAR_URL.includes('primeacc'));

    assert.ok(CALENDAR_URL.includes('andrew-primecfo'));

  });

});

