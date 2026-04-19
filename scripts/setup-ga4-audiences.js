#!/usr/bin/env node
// Cria audiencias GA4 via Admin API (v1alpha)
// Uso: node scripts/setup-ga4-audiences.js [--force]
//   --force  arquiva audiencias existentes antes de recriar
//
// Requer:
//   - .secrets/pulso-autopilot-sa.json (service account)
//   - SA adicionado em GA4 > Admin > Property Access Management
//     com role "Editor" na property 533692705

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROPERTY_ID = '533692705';
const ACCOUNT_ID = '391895069';
const KEY_FILE = path.join(__dirname, '..', '.secrets', 'pulso-autopilot-sa.json');
const SCOPES = ['https://www.googleapis.com/auth/analytics.edit'];

const MAX_DURATION = 540;

// Top-level filterExpression em simpleFilter TEM que ser andGroup contendo
// orGroups; orGroups contem eventFilter/dimensionOrMetricFilter.
// Operations validas em NumericFilter: EQUAL, LESS_THAN, GREATER_THAN
// (nao existe GREATER_THAN_OR_EQUAL — usar GREATER_THAN com value-1).
//
// Helper: wrap um leaf (eventFilter ou dimOrMetricFilter) em andGroup>orGroup.
function wrapAndGroup(leaf) {
  return {
    andGroup: {
      filterExpressions: [{
        orGroup: {
          filterExpressions: [leaf]
        }
      }]
    }
  };
}

// Event com contagem >= N: eventFilter com eventParameterFilterExpression
// que filtra eventCount via GREATER_THAN (N-1).
function eventCountAtLeast(eventName, minCount) {
  return {
    eventFilter: {
      eventName,
      eventParameterFilterExpression: {
        andGroup: {
          filterExpressions: [{
            orGroup: {
              filterExpressions: [{
                dimensionOrMetricFilter: {
                  fieldName: 'eventCount',
                  numericFilter: {
                    operation: 'GREATER_THAN',
                    value: { int64Value: String(minCount - 1) }
                  }
                }
              }]
            }
          }]
        }
      }
    }
  };
}

function eventAtLeastOnce(eventName) {
  return {
    eventFilter: { eventName }
  };
}

const AUDIENCES = [
  {
    displayName: 'Leitores engajados',
    description: 'Usuarios com 3+ eventos article_scroll_75 nos ultimos 30 dias',
    membershipDurationDays: 30,
    filterClauses: [{
      clauseType: 'INCLUDE',
      simpleFilter: {
        scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
        filterExpression: wrapAndGroup(eventCountAtLeast('article_scroll_75', 3))
      }
    }]
  },
  {
    displayName: 'Assinantes newsletter',
    description: 'Usuarios que dispararam newsletter_submit (retencao max 540 dias)',
    membershipDurationDays: MAX_DURATION,
    filterClauses: [{
      clauseType: 'INCLUDE',
      simpleFilter: {
        scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
        filterExpression: wrapAndGroup(eventAtLeastOnce('newsletter_submit'))
      }
    }]
  },
  {
    displayName: 'Interessados WhatsApp',
    description: 'Usuarios que dispararam whatsapp_click (retencao max 540 dias)',
    membershipDurationDays: MAX_DURATION,
    filterClauses: [{
      clauseType: 'INCLUDE',
      simpleFilter: {
        scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
        filterExpression: wrapAndGroup(eventAtLeastOnce('whatsapp_click'))
      }
    }]
  },
  {
    displayName: 'Retornantes',
    description: 'Usuarios com 2+ sessoes nos ultimos 30 dias',
    membershipDurationDays: 30,
    filterClauses: [{
      clauseType: 'INCLUDE',
      simpleFilter: {
        scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
        filterExpression: wrapAndGroup(eventCountAtLeast('session_start', 2))
      }
    }]
  },
  {
    displayName: 'Leitores profundos',
    description: 'Usuarios que chegaram em article_scroll_100 (retencao max 540 dias)',
    membershipDurationDays: MAX_DURATION,
    filterClauses: [{
      clauseType: 'INCLUDE',
      simpleFilter: {
        scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
        filterExpression: wrapAndGroup(eventAtLeastOnce('article_scroll_100'))
      }
    }]
  }
];

async function main() {
  const force = process.argv.includes('--force');

  if (!fs.existsSync(KEY_FILE)) {
    console.error(`! arquivo de credenciais nao encontrado: ${KEY_FILE}`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES
  });

  const analyticsadmin = google.analyticsadmin({ version: 'v1alpha', auth });
  const parent = `properties/${PROPERTY_ID}`;

  let existing = [];
  try {
    const res = await analyticsadmin.properties.audiences.list({ parent });
    existing = res.data.audiences || [];
    console.log(`\n${existing.length} audiencia(s) existentes na property ${PROPERTY_ID}`);
  } catch (err) {
    console.error(`! erro ao listar audiencias: ${err.message}`);
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }

  const targetNames = AUDIENCES.map(a => a.displayName);
  const existingByName = new Map(existing.map(a => [a.displayName, a]));

  if (force) {
    console.log('\n--force: arquivando audiencias existentes que serao recriadas...');
    for (const name of targetNames) {
      const found = existingByName.get(name);
      if (found) {
        try {
          await analyticsadmin.properties.audiences.archive({ name: found.name });
          console.log(`  arquivada: "${name}" (${found.name})`);
          existingByName.delete(name);
        } catch (err) {
          console.error(`  ! falha ao arquivar "${name}": ${err.message}`);
        }
      }
    }
  }

  console.log('');
  let created = 0, skipped = 0, errored = 0;
  for (const audience of AUDIENCES) {
    if (existingByName.has(audience.displayName)) {
      console.log(`  "${audience.displayName}" ja existe`);
      skipped++;
      continue;
    }
    try {
      const res = await analyticsadmin.properties.audiences.create({
        parent,
        requestBody: audience
      });
      console.log(`  "${audience.displayName}" criada (${res.data.name})`);
      created++;
    } catch (err) {
      errored++;
      const msg = err.response && err.response.data
        ? JSON.stringify(err.response.data.error || err.response.data)
        : err.message;
      console.error(`  ! erro "${audience.displayName}": ${msg}`);
    }
  }

  console.log(`\nresumo: ${created} criada(s), ${skipped} pulada(s), ${errored} com erro`);
  if (errored > 0) process.exit(2);
}

main().catch(err => {
  console.error('falha fatal:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
