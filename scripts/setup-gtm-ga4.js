#!/usr/bin/env node
// Setup declarativo GTM + GA4 via API (config-driven, replicavel, catch-all).
// Le config/gtm-setup.json e cria variables/triggers/tags/conversions.
// Idempotente — rerun nao duplica.
//
// Uso:
//   node scripts/setup-gtm-ga4.js                              # dry (sem publish)
//   node scripts/setup-gtm-ga4.js --publish                    # publica versao
//   node scripts/setup-gtm-ga4.js --cleanup --publish          # remove tudo que nao esta no config
//   node scripts/setup-gtm-ga4.js --config config/outro.json   # usa outro config

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const PUBLISH = args.includes('--publish');
const CLEANUP = args.includes('--cleanup');
const configIdx = args.indexOf('--config');
const CONFIG_PATH = path.resolve(configIdx >= 0 ? args[configIdx + 1] : 'config/gtm-setup.json');
const KEY_PATH = path.join(__dirname, '..', '.secrets', 'pulso-autopilot-sa.json');

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const ALL_PAGES_TRIGGER_ID = '2147479553';

function buildTriggerBody(t) {
  const body = { type: t.type };
  if (t.filter) {
    body.filter = [{
      type: t.filter.kind,
      parameter: [
        { type: 'template', key: 'arg0', value: t.filter.variable },
        { type: 'template', key: 'arg1', value: t.filter.value }
      ]
    }];
  }
  if (t.type === 'formSubmission') {
    body.waitForTags = { type: 'boolean', value: 'false' };
    body.checkValidation = { type: 'boolean', value: 'false' };
    body.waitForTagsTimeout = { type: 'template', value: '2000' };
  }
  if (t.type === 'scrollDepth') {
    body.parameter = [
      { type: 'boolean', key: 'verticalThresholdOn', value: 'true' },
      { type: 'template', key: 'verticalThresholdUnits', value: 'PERCENT' },
      { type: 'template', key: 'verticalThresholdsPercent', value: String(t.percent) },
      { type: 'boolean', key: 'horizontalThresholdOn', value: 'false' },
      { type: 'template', key: 'triggerStartOption', value: 'WINDOW_LOAD' }
    ];
  }
  if (t.type === 'customEvent') {
    if (t.event_regex) {
      body.customEventFilter = [{
        type: 'matchRegex',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: t.event_regex },
          { type: 'boolean', key: 'ignore_case', value: 'true' }
        ]
      }];
    } else if (t.event_name) {
      body.customEventFilter = [{
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: t.event_name }
        ]
      }];
    }
  }
  return body;
}

function buildVariableBody(v) {
  if (v.type === 'constant') {
    return {
      type: 'c',
      parameter: [{ type: 'template', key: 'value', value: v.value }]
    };
  }
  if (v.type === 'dataLayerVar') {
    return {
      type: 'v',
      parameter: [
        { type: 'integer', key: 'dataLayerVersion', value: '2' },
        { type: 'template', key: 'name', value: v.key },
        { type: 'boolean', key: 'setDefaultValue', value: 'false' }
      ]
    };
  }
  throw new Error(`Unknown variable type: ${v.type}`);
}

function buildTagBody(t, triggerIdMap) {
  const body = { type: t.type };
  if (t.trigger === 'ALL_PAGES') {
    body.firingTriggerId = [ALL_PAGES_TRIGGER_ID];
  } else {
    const tid = triggerIdMap[t.trigger];
    if (!tid) throw new Error(`trigger ${t.trigger} nao encontrado`);
    body.firingTriggerId = [tid];
  }

  if (t.type === 'googtag' && t.params) {
    body.parameter = Object.entries(t.params).map(([key, value]) => ({ type: 'template', key, value }));
  }
  if (t.type === 'gaawe') {
    const params = [
      { type: 'template', key: 'eventName', value: t.event_name },
      { type: 'template', key: 'measurementIdOverride', value: '{{GA4 Measurement ID}}' }
    ];
    if (t.event_params && t.event_params.length) {
      params.push({
        type: 'list',
        key: 'eventParameters',
        list: t.event_params.map(p => ({
          type: 'map',
          map: [
            { type: 'template', key: 'name', value: p.name },
            { type: 'template', key: 'value', value: p.value }
          ]
        }))
      });
    }
    body.parameter = params;
  }
  return body;
}

async function main() {
  console.log(`[setup] config: ${path.relative(process.cwd(), CONFIG_PATH)}`);
  console.log(`[setup] cliente: ${CONFIG.client.name} (${CONFIG.client.domain})`);
  console.log(`[setup] modo: publish=${PUBLISH} cleanup=${CLEANUP}\n`);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/tagmanager.readonly',
      'https://www.googleapis.com/auth/tagmanager.edit.containers',
      'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
      'https://www.googleapis.com/auth/tagmanager.publish',
      'https://www.googleapis.com/auth/tagmanager.delete.containers',
      'https://www.googleapis.com/auth/analytics.edit'
    ]
  });
  const authClient = await auth.getClient();
  const gtm = google.tagmanager({ version: 'v2', auth: authClient });
  const ga4 = google.analyticsadmin({ version: 'v1beta', auth: authClient });

  const containerPath = `accounts/${CONFIG.gtm.account_id}/containers/${CONFIG.gtm.container_id}`;
  console.log(`[gtm] container: ${containerPath}`);

  const wsListRes = await gtm.accounts.containers.workspaces.list({ parent: containerPath });
  let workspace = (wsListRes.data.workspace || []).find(w => w.name === CONFIG.gtm.workspace_name) || (wsListRes.data.workspace || [])[0];
  if (!workspace) {
    const r = await gtm.accounts.containers.workspaces.create({ parent: containerPath, requestBody: { name: CONFIG.gtm.workspace_name } });
    workspace = r.data;
  }
  const wsPath = workspace.path;
  console.log(`[gtm] workspace: ${workspace.name}\n`);

  const wantedTagNames = new Set(CONFIG.tags.map(t => t.name));
  const wantedTriggerNames = new Set(CONFIG.triggers.map(t => t.name));
  const wantedVarNames = new Set(CONFIG.variables.map(v => v.name));

  // CLEANUP
  if (CLEANUP) {
    console.log('[cleanup] removendo items fora do config...');
    const [tList, trList, vList] = await Promise.all([
      gtm.accounts.containers.workspaces.tags.list({ parent: wsPath }),
      gtm.accounts.containers.workspaces.triggers.list({ parent: wsPath }),
      gtm.accounts.containers.workspaces.variables.list({ parent: wsPath })
    ]);
    for (const t of (tList.data.tag || [])) {
      if (!wantedTagNames.has(t.name)) {
        await gtm.accounts.containers.workspaces.tags.delete({ path: t.path });
        console.log(`  - tag "${t.name}" removida`);
      }
    }
    for (const t of (trList.data.trigger || [])) {
      if (!wantedTriggerNames.has(t.name)) {
        try {
          await gtm.accounts.containers.workspaces.triggers.delete({ path: t.path });
          console.log(`  - trigger "${t.name}" removido`);
        } catch (e) { console.log(`  ! trigger "${t.name}" em uso, pulando: ${e.message.substring(0, 80)}`); }
      }
    }
    for (const v of (vList.data.variable || [])) {
      if (!wantedVarNames.has(v.name)) {
        try {
          await gtm.accounts.containers.workspaces.variables.delete({ path: v.path });
          console.log(`  - variable "${v.name}" removida`);
        } catch (e) { console.log(`  ! variable "${v.name}" em uso, pulando`); }
      }
    }
    console.log('');
  }

  // Built-in variables
  console.log('[gtm] built-in variables...');
  const biList = await gtm.accounts.containers.workspaces.built_in_variables.list({ parent: wsPath });
  const biExisting = (biList.data.builtInVariable || []).map(b => b.type);
  const biToEnable = CONFIG.builtin_variables.filter(t => !biExisting.includes(t));
  if (biToEnable.length) {
    await gtm.accounts.containers.workspaces.built_in_variables.create({ parent: wsPath, type: biToEnable });
    console.log(`  ✓ habilitadas: ${biToEnable.join(', ')}`);
  } else {
    console.log('  ✓ todas ja habilitadas');
  }

  // Custom variables
  console.log('\n[gtm] custom variables...');
  const varsList = await gtm.accounts.containers.workspaces.variables.list({ parent: wsPath });
  const existingVars = varsList.data.variable || [];
  for (const v of CONFIG.variables) {
    const body = buildVariableBody(v);
    const existing = existingVars.find(x => x.name === v.name);
    if (existing) {
      await gtm.accounts.containers.workspaces.variables.update({ path: existing.path, requestBody: { ...existing, ...body, name: v.name } });
      console.log(`  ✓ atualizada: "${v.name}"`);
    } else {
      await gtm.accounts.containers.workspaces.variables.create({ parent: wsPath, requestBody: { name: v.name, ...body } });
      console.log(`  ✓ criada: "${v.name}"`);
    }
  }

  // Triggers
  console.log('\n[gtm] triggers...');
  const trigList = await gtm.accounts.containers.workspaces.triggers.list({ parent: wsPath });
  const existingTrigs = trigList.data.trigger || [];
  const triggerIdMap = {};
  for (const t of CONFIG.triggers) {
    const body = buildTriggerBody(t);
    const existing = existingTrigs.find(x => x.name === t.name);
    if (existing) {
      const r = await gtm.accounts.containers.workspaces.triggers.update({ path: existing.path, requestBody: { ...existing, ...body, name: t.name } });
      triggerIdMap[t.id_ref] = r.data.triggerId;
      console.log(`  ✓ atualizado: "${t.name}" (${r.data.triggerId})`);
    } else {
      const r = await gtm.accounts.containers.workspaces.triggers.create({ parent: wsPath, requestBody: { name: t.name, ...body } });
      triggerIdMap[t.id_ref] = r.data.triggerId;
      console.log(`  ✓ criado: "${t.name}" (${r.data.triggerId})`);
    }
  }

  // Tags
  console.log('\n[gtm] tags...');
  const tagsList = await gtm.accounts.containers.workspaces.tags.list({ parent: wsPath });
  const existingTags = tagsList.data.tag || [];
  for (const t of CONFIG.tags) {
    const body = buildTagBody(t, triggerIdMap);
    const existing = existingTags.find(x => x.name === t.name);
    if (existing) {
      await gtm.accounts.containers.workspaces.tags.update({ path: existing.path, requestBody: { ...existing, ...body, name: t.name } });
      console.log(`  ✓ atualizada: "${t.name}"`);
    } else {
      await gtm.accounts.containers.workspaces.tags.create({ parent: wsPath, requestBody: { name: t.name, ...body } });
      console.log(`  ✓ criada: "${t.name}"`);
    }
  }

  // GA4 Conversions
  console.log('\n[ga4] key events (conversions)...');
  const propertyPath = `properties/${CONFIG.ga4.property_id}`;
  try {
    const existing = await ga4.properties.conversionEvents.list({ parent: propertyPath });
    const existingNames = (existing.data.conversionEvents || []).map(c => c.eventName);
    for (const evName of (CONFIG.ga4_conversions_only || [])) {
      if (existingNames.includes(evName)) {
        console.log(`  ✓ "${evName}" ja existe`);
      } else {
        try {
          await ga4.properties.conversionEvents.create({
            parent: propertyPath,
            requestBody: { eventName: evName, countingMethod: 'ONCE_PER_EVENT' }
          });
          console.log(`  ✓ "${evName}" criada`);
        } catch (e) {
          console.log(`  ! erro "${evName}": ${e.message.substring(0, 100)}`);
        }
      }
    }
  } catch (e) {
    console.log(`  ! GA4 API erro: ${e.message.substring(0, 120)}`);
  }

  // Publish
  if (PUBLISH) {
    console.log('\n[gtm] criando versao + publicando...');
    const version = await gtm.accounts.containers.workspaces.create_version({
      path: wsPath,
      requestBody: { name: `${CONFIG.gtm.version_prefix}-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`, notes: 'Catch-all GA4 + DLVs (super tracking)' }
    });
    console.log(`  ✓ versao: ${version.data.containerVersion.name}`);
    await gtm.accounts.containers.versions.publish({ path: version.data.containerVersion.path });
    console.log(`  ✓ publicado!`);
  } else {
    console.log('\n[gtm] skip publish (passe --publish)');
  }

  console.log('\n[setup] concluido');
}

main().catch(e => {
  console.error('\n[setup] ERRO:', e.message);
  if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
