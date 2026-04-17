#!/usr/bin/env node
// Extrator de skills Claude Code -> skills.json
// Le ~/.claude/skills/*/SKILL.md, extrai frontmatter, categoriza, salva JSON

const fs = require('fs');
const path = require('path');
const os = require('os');

const SOURCES = [
  { dir: path.join(os.homedir(), '.claude', 'skills'), origin: 'claude' },
  { dir: path.join(os.homedir(), '.flowhub', 'skills'), origin: 'flowhub' }
];
const OUTPUT = path.join(__dirname, 'skills.json');

const CATEGORIES = [
  { key: 'ai-ml', label: 'AI & Machine Learning', patterns: [/^ai-/, /^ml-/, /llm/, /rag/, /agent/, /prompt/, /embedding/, /langchain/, /langgraph/, /crewai/, /voice-ai/, /computer-vision/, /ai-engineer/, /ai-product/, /ai-seo/, /ai-wrapper/] },
  { key: 'azure', label: 'Azure & Microsoft', patterns: [/^azure-/, /^m365-/, /^microsoft-/, /copilot/] },
  { key: 'cloud-devops', label: 'Cloud & DevOps', patterns: [/^aws-/, /^gcp-/, /cloudflare/, /vercel/, /railway/, /render/, /kubernetes/, /docker/, /terraform/, /devops/, /ci\/cd/, /cicd/, /helm/, /kubectl/, /istio/, /linkerd/, /service-mesh/, /grafana/, /prometheus/, /datadog/, /sentry/, /gitlab-ci/, /deployment-/, /deploy-/, /^azd-/, /^cdk-/, /cloudformation/, /incident-/, /linux-troubleshooting/, /^network-/, /^server-/, /observability/, /^slo-/, /slo-implementation/, /distributed-tracing/, /sast-/, /environment-setup/, /mlops/, /^mlops/, /ml-engineer/, /machine-learning-ops/, /monorepo/, /gitops/, /turborepo/, /nx-workspace/, /multi-cloud/, /hybrid-cloud/, /cloud-architect/, /langfuse/, /secrets-management/, /^mtls/, /trigger-dev/, /^appdeploy/, /shellcheck/, /busybox/, /os-scripting/, /scanning-tools/, /ethical-hacking-methodology/, /application-performance/, /architecture/, /^software-architecture/, /senior-architect/, /monorepo-architect/, /threat-mitigation/] },
  { key: 'frontend', label: 'Frontend & UI', patterns: [/^react-/, /^angular/, /^nextjs/, /^vue/, /^svelte/, /shadcn/, /tailwind/, /css/, /html/, /^ui-/, /^ux-/, /figma/, /canva/, /design-system/, /stitch/, /radix/, /hig-/, /frontend/, /flutter/, /swiftui/, /jetpack/, /ios-developer/, /android-/, /react-native/, /expo/, /remotion/, /three/, /^3d-/, /webgl/, /glsl/, /shader/, /algorithmic-art/, /browser-extension/, /chrome-extension/, /zustand/, /fp-ts-/, /interactive-portfolio/, /theme-factory/, /web-artifacts-builder/, /web-design-guidelines/, /core-components/, /mobile-design/, /mobile-developer/, /^i18n-/, /^imagen/, /screenshots/, /avalonia/, /makepad/, /nanobanana-ppt/, /design-orchestration/] },
  { key: 'backend', label: 'Backend & APIs', patterns: [/^fastapi/, /^django/, /^flask/, /^nestjs/, /^laravel/, /^rails/, /backend/, /nodejs/, /^api-/, /graphql/, /grpc/, /microservices/, /monolith/, /cqrs/, /event-sourcing/, /saga/, /ddd/, /domain-driven/, /hexagonal/, /event-store-design/, /projection-patterns/, /workflow-orchestration-patterns/, /workflow-patterns/, /pydantic-models/, /payment-integration/, /^bun-development/, /hubspot-integration/, /salesforce-development/, /gemini-api-dev/, /senior-fullstack/] },
  { key: 'database', label: 'Database & Data', patterns: [/^sql-/, /^nosql/, /postgres/, /mysql/, /mongo/, /redis/, /database/, /prisma/, /supabase/, /neon/, /upstash/, /^data-/, /dbt/, /airflow/, /spark/, /dask/, /polars/, /pandas/, /bigquery/, /snowflake/, /vector-database/, /vector-index/, /pgvector/, /hybrid-search/, /similarity-search/, /rag-engineer/] },
  { key: 'security', label: 'Security & Pentest', patterns: [/security/, /^pentest/, /^red-team/, /^burp/, /^metasploit/, /^sqlmap/, /^ffuf/, /^nmap/, /^shodan/, /^wireshark/, /vulnerability/, /xss/, /sql-injection/, /idor/, /broken-auth/, /owasp/, /threat-modeling/, /stride/, /attack-tree/, /malware/, /reverse-engineer/, /binary-analysis/, /firmware/, /memory-forensics/, /anti-reversing/, /privilege-escalation/, /active-directory/, /windows-privilege/, /linux-privilege/, /wordpress-penetration/, /cloud-penetration/, /api-fuzzing/, /api-security/, /web-security/, /api-security-testing/, /web3-testing/, /solidity-security/, /laravel-security/, /smtp-penetration/, /ssh-penetration/, /crypto-bd/, /^auth-/, /file-path-traversal/, /file-uploads/, /memory-safety/, /top-web-vulnerabilities/] },
  { key: 'science', label: 'Ciencia & Bioinformatica', patterns: [/^sci-/] },
  { key: 'marketing-seo', label: 'Marketing, SEO & Copy', patterns: [/^seo-/, /^ad-/, /^paid-/, /copywriting/, /copy-editing/, /marketing/, /^content-/, /^email/, /cold-email/, /^launch/, /^landing/, /cro/, /form-cro/, /onboarding-cro/, /page-cro/, /paywall/, /signup-flow/, /popup-cro/, /affiliate/, /referral/, /^lead-/, /sales-automator/, /sales-enablement/, /sales-ops/, /sales-and-revenue/, /revops/, /churn/, /competitive/, /competitor/, /free-tool-strategy/, /programmatic-seo/, /geo-fundamentals/, /brand-guidelines/, /marketing-ideas/, /marketing-psychology/, /pricing-strategy/, /app-store-optimization/, /beautiful-prose/, /humanizer/, /^writing-/, /content-creator/, /content-marketer/, /content-strategy/, /social-content/] },
  { key: 'integrations', label: 'Integracoes & Automacoes', patterns: [/discord-bot/, /telegram-bot/, /telegram-mini-app/, /linkedin-cli/, /slack-bot/, /slack-gif/, /viral-generator/, /linear-claude/, /-automation$/, /zapier/, /make-automation/, /n8n/, /workflow-automation/, /asana-automation/, /notion-automation/, /slack-automation/, /gmail-automation/, /hubspot-automation/, /salesforce-automation/, /stripe-automation/, /stripe-integration/, /paypal-integration/, /plaid/, /twilio/, /sendgrid/, /postmark/, /mailchimp/, /brevo/, /klaviyo/, /convertkit/, /activecampaign/, /airtable-automation/, /algolia/, /posthog/, /amplitude-automation/, /mixpanel-automation/, /segment/, /clerk-auth/, /firebase/, /intercom/, /zendesk/, /freshdesk/, /freshservice/, /helpdesk/, /pagerduty/, /linear-automation/, /jira-automation/, /clickup/, /monday-automation/, /trello-automation/, /basecamp/, /bamboohr/, /bitbucket/, /calendly/, /cal-com/, /close-automation/, /confluence/, /coda-automation/, /changelog/, /docusign/, /dropbox/, /box-automation/, /discord-automation/, /telegram-automation/, /whatsapp/, /instagram-automation/, /tiktok-automation/, /twitter-automation/, /youtube-automation/, /linkedin-automation/, /reddit-automation/, /wrike/, /zoho-crm/, /zoom-automation/, /google-analytics/, /googlesheets/, /google-calendar/, /google-drive/, /google-drive-automation/, /outlook/, /microsoft-teams/, /one-drive/, /shopify/, /webflow/, /vercel-automation/, /render-automation/, /supabase-automation/, /notion-template/, /inngest/, /^make-/, /^canva-/, /fal-/, /hugging-face/, /^n8n-/, /zapier-make/] },
  { key: 'productivity', label: 'Produtividade & Skills Pessoais', patterns: [/office-productivity/, /docx-official/, /pdf-official/, /pptx-official/, /xlsx-official/, /notebooklm/, /obsidian/, /file-organizer/, /audio-transcriber/, /podcast-generation/, /daily-news/, /youtube-summarizer/, /deep-research/, /exa-search/, /tavily/, /firecrawl/, /search-specialist/, /context7-auto-research/, /research-engineer/, /skill-seekers/, /using-git-worktrees/, /using-neon/, /using-superpowers/, /^commit$/, /create-pr/, /github-issue-creator/, /git-pushing/, /git-advanced-workflows/, /git-pr-workflows/, /executing-plans/, /customer-support/, /last30days/, /oss-hunter/, /^development$/, /internal-comms/] },
  { key: 'claude-code', label: 'Claude Code & Meta', patterns: [/claude-code/, /claude-ally/, /claude-d3js/, /claude-scientific/, /claude-speed-reader/, /claude-win11/, /^cc-skill/, /create-agent-skill/, /create-hook/, /create-mcp/, /create-meta-prompt/, /create-plan/, /create-prompt/, /create-slash-command/, /create-subagent/, /skill-creator/, /skill-developer/, /skill-rails-upgrade/, /subagent-auditor/, /slash-command-auditor/, /mcp-builder/, /agent-manager/, /agent-framework/, /agent-memory/, /agent-orchestration/, /agent-tool-builder/, /agent-evaluation/, /agents-v2/, /hosted-agents/, /autonomous-agent/, /autonomous-agents/, /computer-use-agents/, /parallel-agents/, /dispatching-parallel/, /subagent-driven/, /prompt-engineer/, /prompt-engineering/, /prompt-library/, /prompt-caching/, /context-/, /memory-systems/, /conversation-memory/, /behavioral-modes/, /enhance-prompt/, /personal-tool-builder/, /tool-design/, /brainstorming/, /brainstorm/, /multi-agent-brainstorming/, /create-meta/, /create-plans/, /create-hooks/, /create-mcp-servers/, /create-subagents/, /create-slash-commands/, /create-agent-skills/, /dx-optimizer/, /^ecc-/, /codex-review/, /code-rabbit/, /code-review/, /^antigravity/, /^aios/, /coding-standards/, /cc-skill/] },
  { key: 'business', label: 'Business, Startup & Financas', patterns: [/andruia/, /nerdzao/, /startup/, /^business-/, /hr-pro/, /legal-advisor/, /risk-manager/, /^quant-/, /^finance/, /backtesting/, /risk-metrics/, /kpi-dashboard/, /data-storytelling/, /market-sizing/, /agentfolio/, /app-builder/, /micro-saas/, /^ab-test/, /product-manager/, /product-marketing/, /launch-strategy/, /team-collaboration/, /team-composition/, /on-call-handoff/, /receiving-code-review/, /requesting-code-review/, /^carrier-/, /customs-/, /energy-procurement/, /inventory-demand/, /production-scheduling/, /logistics-exception/, /quality-nonconformance/, /returns-reverse/, /employment-contract/, /gdpr-data/, /pci-compliance/, /churn-prevention/, /revops/, /analytics-tracking/, /ad-creative/, /address-github/, /adress-review/, /business-analyst/, /data-analyst/, /data-scientist/] },
  { key: 'languages', label: 'Linguagens de Programacao', patterns: [/^python-/, /^javascript-/, /^typescript-/, /^golang-/, /^rust-/, /^ruby-/, /^java-/, /^php-/, /^scala-/, /^kotlin-/, /^swift-/, /^c-pro/, /^cpp-/, /^csharp-/, /^julia-/, /^haskell-/, /^elixir-/, /^dart-/, /^dotnet-/, /^bash-/, /^powershell/, /^posix-shell/, /^shell-/, /python-pro/, /javascript-pro/, /typescript-pro/, /golang-pro/, /rust-pro/, /ruby-pro/, /java-pro/, /php-pro/, /scala-pro/, /cpp-pro/, /csharp-pro/, /julia-pro/, /haskell-pro/, /elixir-pro/, /bash-pro/, /sql-pro/, /django-pro/, /fastapi-pro/, /posix-shell-pro/, /linux-shell/, /modern-javascript/, /javascript-mastery/, /javascript-testing/, /typescript-advanced/, /typescript-expert/, /async-python/, /python-fastapi/, /python-patterns/, /python-performance/, /python-testing/, /python-packaging/, /python-development/, /rust-async/, /temporal-python/, /go-concurrency/, /go-playwright/, /go-rod-master/, /grpc-golang/, /dbos-golang/, /dbos-python/, /dbos-typescript/, /uv-package-manager/, /minecraft-bukkit/, /arm-cortex/, /bevy-ecs/, /godot-/, /unity-/, /unreal-engine/, /game-development/, /laravel-expert/, /nestjs-expert/, /kotlin-coroutines/, /android-jetpack/, /swiftui-expert/, /flutter-expert/, /wordpress/, /wordpress-plugin/, /wordpress-theme/, /wordpress-woocommerce/, /shopify-development/, /shopify-apps/, /moodle-/] },
  { key: 'testing-qa', label: 'Testes & QA', patterns: [/^testing-/, /^test-/, /e2e-testing/, /unit-testing/, /webapp-testing/, /playwright/, /bats-testing/, /tdd-/, /tdd-workflow/, /debugging/, /debugger/, /debug-like/, /error-debugging/, /error-diagnostics/, /error-detective/, /error-handling/, /find-bugs/, /fix-review/, /fixing/, /test-fixing/, /test-driven/, /test-automator/, /verification-before/, /clarity-gate/, /code-review/, /code-reviewer/, /codex-review/, /code-rabbit/, /performance-testing/, /performance-engineer/, /performance-profiling/, /web-performance/, /ui-visual-validator/, /screen-reader-testing/, /iterate-pr/, /wcag-audit/, /accessibility-compliance/, /lint-and-validate/, /review/, /codebase-cleanup/, /dependency-management/, /dependency-upgrade/, /framework-migration/, /legacy-modernizer/, /evaluation/, /llm-evaluation/, /agent-evaluation/] },
  { key: 'documentation', label: 'Documentacao & Escrita', patterns: [/^doc-/, /^docs-/, /documentation/, /api-documentation/, /api-documenter/, /readme/, /mermaid-expert/, /architecture-decision/, /architecture-patterns/, /c4-/, /domain-driven-design/, /wiki-/, /tutorial-engineer/, /reference-builder/, /plan-writing/, /planning-with-files/, /postmortem-writing/, /incident-runbook/, /writing-plans/, /writing-skills/, /create-plan/, /concise-planning/, /doc-coauthoring/, /design-md/, /manifest/, /openapi-spec/, /sharp-edges/, /x-article-publisher/] },
  { key: 'web3-blockchain', label: 'Web3 & Blockchain', patterns: [/blockchain/, /defi/, /nft-standards/, /web3/, /solidity/, /^plaid-fintech/] },
  { key: 'personal-dev', label: 'Soft Skills & Cultura', patterns: [/culture-index/, /infinite-gratitude/, /kaizen/, /loki-mode/, /behavioral-modes/, /conductor-/, /track-management/, /finishing-a-development/, /setup-ralph/, /code-/, /clean-code/, /superpowers-lab/, /^taste-design/] }
];

function categorize(name, folder) {
  const checkStrings = [name.toLowerCase(), (folder || '').toLowerCase()];
  for (const cat of CATEGORIES) {
    for (const pattern of cat.patterns) {
      for (const s of checkStrings) {
        if (pattern.test(s)) return cat.key;
      }
    }
  }
  return 'outros';
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = match[1];
  const result = {};
  let currentKey = null;
  let multilineBuffer = [];
  const lines = yaml.split('\n');
  for (const line of lines) {
    if (line.match(/^[a-zA-Z_][\w-]*:\s*\|/)) {
      if (currentKey && multilineBuffer.length) {
        result[currentKey] = multilineBuffer.join(' ').trim();
        multilineBuffer = [];
      }
      currentKey = line.split(':')[0].trim();
      multilineBuffer = [];
    } else if (line.match(/^[a-zA-Z_][\w-]*:/)) {
      if (currentKey && multilineBuffer.length) {
        result[currentKey] = multilineBuffer.join(' ').trim();
        multilineBuffer = [];
      }
      const colonIdx = line.indexOf(':');
      const key = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (value) {
        result[key] = value.replace(/^["']|["']$/g, '');
        currentKey = null;
      } else {
        currentKey = key;
      }
    } else if (currentKey && line.trim()) {
      multilineBuffer.push(line.trim());
    }
  }
  if (currentKey && multilineBuffer.length) {
    result[currentKey] = multilineBuffer.join(' ').trim();
  }
  return result;
}

function findSkillFiles(dir, depth = 0) {
  if (depth > 5) return [];
  if (!fs.existsSync(dir)) return [];
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...findSkillFiles(full, depth + 1));
    } else if (e.name === 'SKILL.md') {
      out.push({ path: full, type: 'skill' });
    }
  }
  return out;
}

const SKIP_FILES = new Set(['README.md', 'CHANGELOG.md', 'LICENSE.md', 'CONTRIBUTING.md', 'index.md']);

function findSubSkills(dir, depth = 0) {
  if (depth > 4) return [];
  if (!fs.existsSync(dir)) return [];
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...findSubSkills(full, depth + 1));
    } else if (e.isFile() && e.name.endsWith('.md') && e.name !== 'SKILL.md' && !SKIP_FILES.has(e.name)) {
      out.push({ path: full, type: 'sub-skill' });
    }
  }
  return out;
}

function nameFromFilename(file) {
  return path.basename(file, '.md').toLowerCase();
}

function main() {
  const skills = [];
  const categoryCount = {};
  const seen = new Set();

  for (const src of SOURCES) {
    const skillFiles = findSkillFiles(src.dir);
    const subSkillFiles = findSubSkills(src.dir);

    for (const item of skillFiles) {
      try {
        const content = fs.readFileSync(item.path, 'utf8');
        const fm = parseFrontmatter(content);
        if (!fm || !fm.name) continue;
        const folderName = path.basename(path.dirname(item.path));
        const dedup = fm.name + '::' + folderName;
        if (seen.has(dedup)) continue;
        seen.add(dedup);
        const category = categorize(fm.name, folderName);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        skills.push({
          name: fm.name,
          description: (fm.description || '').substring(0, 500),
          category,
          origin: src.origin
        });
      } catch (e) {}
    }

    for (const item of subSkillFiles) {
      try {
        const content = fs.readFileSync(item.path, 'utf8');
        const fm = parseFrontmatter(content);
        const fileName = path.basename(item.path, '.md');
        const folderName = path.basename(path.dirname(item.path));
        const name = (fm && fm.name) ? fm.name : fileName;
        const dedup = name + '::' + folderName;
        if (seen.has(dedup)) continue;
        seen.add(dedup);
        let description = '';
        if (fm && fm.description) {
          description = fm.description;
        } else {
          // pega primeira linha sem frontmatter como descricao
          const stripped = content.replace(/^---[\s\S]*?---\n/, '').trim();
          const firstPara = stripped.split('\n').find(l => l.trim() && !l.startsWith('#'));
          description = firstPara ? firstPara.trim() : '';
        }
        const category = categorize(name, folderName);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        skills.push({
          name,
          description: description.substring(0, 500),
          category,
          origin: src.origin
        });
      } catch (e) {}
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const categoryLabels = {};
  CATEGORIES.forEach(c => { categoryLabels[c.key] = c.label; });
  categoryLabels['outros'] = 'Outros';

  const output = {
    generated_at: new Date().toISOString(),
    total: skills.length,
    categories: Object.keys(categoryCount)
      .sort((a, b) => categoryCount[b] - categoryCount[a])
      .map(key => ({ key, label: categoryLabels[key] || key, count: categoryCount[key] })),
    skills
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`${skills.length} skills extraidas em ${OUTPUT}`);
  console.log('\nDistribuicao por categoria:');
  output.categories.forEach(c => console.log(`  ${c.label}: ${c.count}`));
}

main();
