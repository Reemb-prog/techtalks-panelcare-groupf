#!/usr/bin/env node
/** PanelCare branch/sprint guard. Zero npm dependencies. No Jira or deployment writes. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const team = readJson('config/team.json');
const sprintConfig = readJson('config/sprints.json');
const sprints = sprintConfig.sprints;
const work = readJson('config/work-items.json');
const byId = new Map(work.map((item) => [item.id, item]));
const members = new Set(team.members.map((member) => member.slug));
const commands = ['validate', 'member', 'list', 'start', 'plan', 'status', 'check', 'test'];
// Testing policy helpers (docs/TESTING.md, D12).
const isTestFile = (file) => /^src\/.*\.(test\.tsx?|spec\.ts)$/.test(file);
const isE2eSpec = (file) => /^src\/.*\.spec\.ts$/.test(file);
const isSourceFile = (file) => /^src\/.*\.tsx?$/.test(file) && !file.endsWith('.d.ts');
const isBehaviorFile = (file) => isSourceFile(file) && !isTestFile(file) && !file.startsWith('src/types/') && !file.includes('/fixtures/');
const E2E_SPEC_DIR = /^src\/app\/__e2e__\/[^/]+\.spec\.ts$/;
const FULL_UNIT_TRIGGERS = ['package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts'];
const UI_PREFIXES = ['src/app/', 'src/components/', 'src/features/', 'src/styles/', 'playwright.config.ts'];
const sprintNumber = (value) => (value ? Number(value.slice(1)) : Infinity);
const coversPath = (prefix, file) => file === prefix || (prefix.endsWith('/') && file.startsWith(prefix));
const ownsPath = (item, file) => item.paths.some((prefix) => coversPath(prefix, file)) && !(item.excludePaths || []).some((prefix) => coversPath(prefix, file));

function fail(message) {
  console.error('ERROR: ' + message);
  process.exit(1);
}
function runGit(args, optional = false) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (optional) return null;
    fail('Git command failed: git ' + args.join(' ') + '. ' + (error.stderr?.toString().trim() || error.message));
  }
}
function assertRepository() {
  const top = runGit(['rev-parse', '--show-toplevel'], true);
  if (!top || path.resolve(top) !== root) fail('Initialize Git with this harness at the repository root first.');
}
function currentBranch() {
  return process.env.GITHUB_HEAD_REF || runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], true) || '';
}
function readLocalMember() {
  const file = path.join(root, '.harness-local.json');
  if (process.env.PANELCARE_MEMBER) return process.env.PANELCARE_MEMBER;
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')).member;
}
function taskFromBranch() {
  const branch = currentBranch();
  const match = /^s(\d+)\/([a-z]+)\/(pc-s\d+-\d{2})$/.exec(branch);
  if (!match) fail('Expected a task branch sN/member/pc-sN-XX. Current: ' + (branch || '(detached HEAD)'));
  const id = match[3].toUpperCase();
  const item = byId.get(id);
  if (!item) fail('No configured work item: ' + id);
  if (item.deferred) fail(id + ' is deferred to the backlog; the lead must re-plan it in Jira and config first.');
  if (item.sprint !== 'S' + match[1] || item.owner !== match[2]) fail('Branch sprint or owner disagrees with work item: ' + id);
  const local = readLocalMember();
  if (local && !process.env.CI && local !== item.owner) fail('This clone is set to ' + local + ', but branch belongs to ' + item.owner);
  return item;
}
function validate() {
  const problems = [];
  if (members.size !== 4 || team.members.length !== 4) problems.push('Expected exactly four unique team members');
  if (!sprints.length) problems.push('No sprints configured');
  const sprintMap = new Map(sprints.map((item) => [item.id, item]));
  for (const [index, sprint] of sprints.entries()) {
    if (sprint.id !== 'S' + (index + 1)) problems.push('Unexpected sprint order: ' + sprint.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sprint.start) || !/^\d{4}-\d{2}-\d{2}$/.test(sprint.end)) problems.push('Invalid sprint dates: ' + sprint.id);
    if (sprint.end < sprint.start) problems.push('Sprint end precedes start: ' + sprint.id);
    if (index && sprints[index - 1].end >= sprint.start) problems.push('Overlapping sprints: ' + sprint.id);
    if (!Number.isInteger(sprint.calendarDays || sprint.workingDays)) problems.push('Sprint needs calendarDays or workingDays: ' + sprint.id);
  }
  if (work.length !== byId.size) problems.push('Duplicate local work item IDs');
  for (const item of work) {
    if (!/^PC-S[1-3]-\d{2}$/.test(item.id)) problems.push('Malformed task ID: ' + item.id);
    if (item.jiraKey !== undefined && !/^[A-Z][A-Z0-9]+-\d+$/.test(item.jiraKey)) problems.push('Malformed Jira key: ' + item.id);
    if (item.deferred) {
      if (item.sprint !== null || item.startDay !== null || item.prDay !== null) problems.push('Deferred task must have null sprint/startDay/prDay: ' + item.id);
    } else {
      const sprint = sprintMap.get(item.sprint);
      // A task may be re-planned into an earlier sprint than its ID (e.g. PC-S3-07 in S2), never a later one.
      if (!sprint || sprintNumber(item.sprint) > Number(item.id.slice(4, 5))) problems.push('Task has unknown/mismatched sprint: ' + item.id);
      const maxDay = sprint ? sprint.calendarDays || sprint.workingDays : 0;
      if (!Number.isInteger(item.startDay) || !Number.isInteger(item.prDay) || item.startDay < 1 || item.prDay > maxDay || item.prDay < item.startDay) problems.push('Bad start/PR day: ' + item.id);
    }
    if (!members.has(item.owner) || !members.has(item.reviewer) || item.owner === item.reviewer) problems.push('Invalid human ownership/reviewer: ' + item.id);
    if (!Array.isArray(item.paths) || !item.paths.length) problems.push('Missing file paths: ' + item.id);
    if (!Array.isArray(item.acceptance) || item.acceptance.length < 2) problems.push('Insufficient acceptance: ' + item.id);
    for (const dep of item.dependsOn || []) {
      if (!byId.has(dep)) problems.push('Unknown dependency ' + dep + ' from ' + item.id);
      else if (sprintNumber(byId.get(dep).sprint) > sprintNumber(item.sprint)) problems.push('Forward-sprint or deferred dependency ' + dep + ' from ' + item.id);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const traverse = (id) => {
    if (visiting.has(id)) { problems.push('Dependency cycle at ' + id); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id)?.dependsOn || []) if (byId.has(dep)) traverse(dep);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of byId.keys()) traverse(id);
  for (const [absorbed, into] of Object.entries(sprintConfig.absorbed || {})) {
    if (byId.has(absorbed)) problems.push('Absorbed task still configured separately: ' + absorbed);
    if (!byId.get(into)?.absorbs?.includes(absorbed)) problems.push('Absorbing task does not list ' + absorbed + ': ' + into);
  }
  // Parallel tasks (same sprint, overlapping day windows, no dependency path) must not own the same files.
  const ancestors = (id, seen = new Set()) => {
    for (const dep of byId.get(id)?.dependsOn || []) if (!seen.has(dep)) { seen.add(dep); ancestors(dep, seen); }
    return seen;
  };
  const overlap = (a, b) => [...a.paths.filter((p) => ownsPath(b, p)), ...a.paths.filter((p) => b.paths.some((q) => coversPath(p, q) && ownsPath(a, q) && ownsPath(b, q)))];
  const scheduled = work.filter((item) => !item.deferred);
  for (const [i, a] of scheduled.entries()) {
    for (const b of scheduled.slice(i + 1)) {
      if (a.sprint !== b.sprint || a.prDay < b.startDay || b.prDay < a.startDay) continue;
      if (ancestors(a.id).has(b.id) || ancestors(b.id).has(a.id)) continue;
      const shared = new Set([...overlap(a, b), ...overlap(b, a)]);
      if (shared.size) problems.push('Parallel path overlap ' + a.id + ' / ' + b.id + ': ' + [...shared].join(', '));
    }
  }
  for (const required of ['CLAUDE.md', 'docs/ROADMAP.md', 'docs/JIRA_PLAYBOOK.md', 'docs/DESIGN_BLUEPRINT.md', 'docs/CONTRACTS.md', 'docs/HOSTING_COSTS.md', 'docs/QUALITY_SECURITY.md', 'docs/TESTING.md', 'prompts/CLAUDE_JIRA_BOOTSTRAP.md']) {
    if (!fs.existsSync(path.join(root, required))) problems.push('Missing harness file: ' + required);
  }
  if (problems.length) fail(problems.join('\n'));
  const deferred = work.filter((item) => item.deferred).length;
  console.log('Harness VALID: ' + members.size + ' members, ' + sprints.length + ' sprints, ' + work.length + ' tasks (' + deferred + ' deferred), no missing references, dependency cycles or parallel path overlaps.');
}
function list(sprint) {
  if (sprint && sprint !== 'backlog' && !sprints.some((item) => item.id === sprint)) fail('Unknown sprint: ' + sprint + ' (use a sprint ID or backlog)');
  const matches = (value) => !sprint || (sprint === 'backlog' ? value.deferred : value.sprint === sprint);
  for (const item of work.filter(matches)) {
    const when = item.deferred ? 'DEFERRED' : item.sprint + ' D' + item.startDay + '→PR D' + item.prDay;
    console.log([item.id, item.jiraKey || '-', item.owner, when, item.title, 'blocks:' + (item.dependsOn.join(',') || 'none')].join(' | '));
  }
}
function setMember(member) {
  if (!members.has(member)) fail('Unknown member. Choose: ' + Array.from(members).join(', '));
  const file = path.join(root, '.harness-local.json');
  fs.writeFileSync(file, JSON.stringify({ member }, null, 2) + '\n', { flag: 'w' });
  console.log('This clone is assigned to ' + member + '. The local identity file is gitignored.');
}
function start(id) {
  assertRepository();
  const item = byId.get((id || '').toUpperCase());
  if (!item) fail('Unknown work item ID: ' + id);
  if (item.deferred) fail(item.id + ' is deferred to the backlog; the lead must re-plan it in Jira and config first.');
  const member = readLocalMember();
  if (!member) fail('Run node scripts/harness.mjs member <slug> first.');
  if (member !== item.owner) fail('Task ' + item.id + ' belongs to ' + item.owner + ', not ' + member + '. Ask lead to change Jira and config in reviewed PR.');
  if (currentBranch() !== 'main') fail('Start from main, after git pull --ff-only origin main.');
  if (runGit(['status', '--porcelain'])) fail('Working tree has changes; stash or commit intentionally before branching.');
  const branch = item.sprint.toLowerCase() + '/' + member + '/' + item.id.toLowerCase();
  if (runGit(['branch', '--list', branch])) fail('Branch already exists: ' + branch);
  console.log('Dependencies to confirm merged in Jira: ' + (item.dependsOn.join(', ') || '(none)'));
  runGit(['switch', '-c', branch]);
  console.log('Created branch: ' + branch + '. Next: node scripts/harness.mjs plan');
}
function writePlan() {
  assertRepository();
  const item = taskFromBranch();
  const dir = path.join(root, 'worklogs', item.id);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, 'plan.md');
  if (fs.existsSync(target)) {
    console.log('Already exists: ' + path.relative(root, target) + '. Review and update it; no overwrite.');
    return;
  }
  const contents = [
    '# ' + item.id + ': ' + item.title, '',
    'Sprint: ' + item.sprint + ' | Owner: ' + item.owner + ' | Reviewer: ' + item.reviewer,
    'Jira key: ' + (item.jiraKey || 'TO CONFIRM') + ' | Draft PR: TO CONFIRM | Planned start D' + item.startDay + ', review-ready day: D' + item.prDay,
    'Plan review: Pending | Approver: TO CONFIRM | Date: TO CONFIRM', '',
    '## Goal and scope', item.title, '',
    '## Dependencies to confirm merged', item.dependsOn.join(', ') || '(none)', '',
    ...(item.absorbs ? ['Absorbs original items: ' + item.absorbs.join(', '), ''] : []),
    '## Allowed paths', ...item.paths.map((value) => '* ' + value),
    ...(item.excludePaths ? ['', 'Excluded (owned by other tasks):', ...item.excludePaths.map((value) => '* ' + value)] : []), '',
    '## Implementation plan (complete and review BEFORE coding)', '',
    '1. Read existing code, contracts and approved design. Name exact files/components to edit.',
    '2. Record desktop/mobile sections and image provenance if UI; data/role boundaries if backend.',
    '3. Walk through error, empty, retry, denied, concurrency and rollback cases.',
    '4. Challenge assumptions and revise plan; request human review and actual Jira signoff.', '',
    '## Acceptance criteria', ...item.acceptance.map((value) => '* [ ] ' + value), '',
    ...(item.deferredScope ? ['## Deferred from this item (do not implement)', ...item.deferredScope.map((value) => '* ' + value), ''] : []),
    ...(item.risk ? ['## Known schedule risk', item.risk, ''] : []),
    '## Tests (docs/TESTING.md: lowest layer that catches the bug; happy, misuse and error paths)',
    'Task test hint: ' + item.test,
    '* Unit: TO PLAN (rules/functions and the cases each covers)',
    '* Integration: TO PLAN (adapter/handler/DB behaviors, or "none: <reason>")',
    '* E2E: TO PLAN (screens/journeys and states, or "none: <reason>")',
    '* Skipped paths, with one-line reason: none',
    '', '## Evidence (Passed/Failed/Not run/Blocked; never claim an unexecuted check)',
    'Affected run, node scripts/harness.mjs test: NOT RUN',
    'Full run before review, node scripts/ci.mjs: NOT RUN',
    'Manual checks (UI 375/768/1440, keyboard) and screenshot/log link: NOT CAPTURED', '',
    '## Risk, security and UX review',
    'Unknowns / mitigations / Impeccable critique if UI: TO COMPLETE', '',
    '## Developer review guide (assistant updates after every run; see CLAUDE.md)',
    'Review next (file:line and what to check): TO COMPLETE',
    'Developer to fill or decide: TO COMPLETE', '',
    '## Handoff', 'Status: Planned | Files changed: none | Next step: obtain plan review', ''
  ].join('\n');
  fs.writeFileSync(target, contents);
  console.log('Created ' + path.relative(root, target) + '. Complete it; human approval is required before coding only for decision-level tasks (CLAUDE.md, D11).');
}
function status() {
  const branch = currentBranch();
  console.log('Branch: ' + (branch || '(no active Git branch)'));
  if (branch === 'main' || !branch) {
    console.log('No task selected. Run validate/list, confirm Jira readiness, set member and start a branch.');
    return;
  }
  if (/^lead\/[a-z0-9-]+$/.test(branch)) {
    console.log('Lead governance branch: docs, config and harness only (no src/). Shared progress/handoff updates belong here.');
    return;
  }
  const item = taskFromBranch();
  console.log('Task: ' + item.id + (item.jiraKey ? ' (' + item.jiraKey + ')' : '') + ' | ' + item.title);
  console.log('Sprint ' + item.sprint + ' | owner ' + item.owner + ' | reviewer ' + item.reviewer + ' | start D' + item.startDay + ' | PR day D' + item.prDay);
  console.log('Dependencies (check actual Jira state): ' + (item.dependsOn.join(', ') || 'none'));
  console.log('Plan path: worklogs/' + item.id + '/plan.md');
}
function changedFiles(base) {
  const candidates = new Set();
  const knownBase = base || (runGit(['rev-parse', '--verify', 'origin/main'], true) ? 'origin/main' : 'main');
  const diff = runGit(['diff', '--name-only', '--diff-filter=ACMRT', knownBase + '...HEAD'], true);
  if (diff === null) fail('Missing Git base ' + knownBase + '. Fetch origin/main before PR checking.');
  for (const line of diff.split('\n')) if (line) candidates.add(line);
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMRT'], true) || '';
  for (const line of unstaged.split('\n')) if (line) candidates.add(line);
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMRT'], true) || '';
  for (const line of staged.split('\n')) if (line) candidates.add(line);
  const untracked = runGit(['ls-files', '--others', '--exclude-standard'], true) || '';
  for (const line of untracked.split('\n')) if (line) candidates.add(line);
  return Array.from(candidates).sort();
}
function checkLeadBranch(branch, base) {
  const appCode = changedFiles(base).filter((file) => file.startsWith('src/'));
  if (appCode.length) fail('Lead branch ' + branch + ' may not change app code; use a task branch:\n' + appCode.map((file) => '  ' + file).join('\n'));
  console.log('Lead branch CHECK OK for ' + branch + ': governance/docs/config only. Lead PRs still need a non-author reviewer.');
}
function check(base) {
  assertRepository();
  const branch = currentBranch();
  if (/^lead\/[a-z0-9-]+$/.test(branch)) return checkLeadBranch(branch, base);
  const item = taskFromBranch();
  const plan = path.join(root, 'worklogs', item.id, 'plan.md');
  if (!fs.existsSync(plan)) fail('Missing worklog plan. Run node scripts/harness.mjs plan and obtain human review.');
  const files = changedFiles(base);
  const worklog = 'worklogs/' + item.id + '/';
  // E2E specs live in one shared folder; any task may add or edit its own screen's spec there (docs/TESTING.md).
  const invalid = files.filter((file) => !coversPath(worklog, file) && !ownsPath(item, file) && !E2E_SPEC_DIR.test(file));
  if (invalid.length) fail('Files outside task scope:\n' + invalid.map((file) => '  ' + file).join('\n') + '\nRequest a scoped shared PR or lead-approved task change.');
  const behavior = files.filter(isBehaviorFile);
  if (behavior.length && !files.some(isTestFile) && !/^Test exemption:\s*\S/m.test(fs.readFileSync(plan, 'utf8'))) {
    fail('Behavior files changed without any test change (docs/TESTING.md):\n' + behavior.map((file) => '  ' + file).join('\n') +
      '\nAdd tests, or add a line "Test exemption: <reason>" to ' + path.relative(root, plan) + ' for the reviewer to judge.');
  }
  console.log('Branch/sprint/owner CHECK OK for ' + item.id + '. Changed paths: ' + files.length + '.');
  console.log('Reminder: manual Jira dependency confirmation, plan approval, reviewer and actual test evidence are not machine-verified.');
}

function runNode(label, args) {
  console.log('\nRUN (' + label + '): node ' + args.join(' '));
  try {
    execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}
/** Runs only the tests the branch's changes can affect (docs/TESTING.md). Full suite: node scripts/ci.mjs. */
function affectedTests(options) {
  assertRepository();
  if (!fs.existsSync(path.join(root, 'node_modules'))) fail('Run npm ci first.');
  const files = changedFiles(options.base);
  const sources = files.filter(isSourceFile).filter((file) => !isE2eSpec(file));
  const fullUnit = files.some((file) => FULL_UNIT_TRIGGERS.includes(file));
  const uiChanged = files.some((file) => UI_PREFIXES.some((prefix) => coversPath(prefix, file)) || isE2eSpec(file));
  const runE2e = options.e2e === true || (options.e2e !== false && uiChanged);
  console.log('Changed files: ' + files.length + ' | source for Vitest: ' + sources.length + (fullUnit ? ' | shared config changed: full Vitest' : '') + ' | E2E: ' + (runE2e ? 'yes' : 'no'));
  const results = [];
  const vitest = 'node_modules/vitest/vitest.mjs';
  if (fullUnit) results.push(['unit/integration (full)', runNode('full', [vitest, 'run'])]);
  else if (sources.length) results.push(['unit/integration (related)', runNode('related', [vitest, 'related', '--run', '--passWithNoTests', ...sources])]);
  else console.log('Vitest: NOT RUN, no runtime source or test files changed.');
  if (runE2e) {
    const ok = runNode('e2e', ['node_modules/@playwright/test/cli.js', 'test']);
    if (!ok) console.log('If browsers are missing, run: npx playwright install chromium (then record Blocked or rerun).');
    results.push(['e2e (Playwright)', ok]);
  } else if (uiChanged) console.log('E2E: SKIPPED by --no-e2e although UI files changed. Run it before review.');
  console.log('\n' + (results.length ? results.map(([name, ok]) => (ok ? 'PASSED ' : 'FAILED ') + name).join('\n') : 'Nothing to run.'));
  console.log('Before review, run the full suite once: node scripts/ci.mjs');
  if (results.some(([, ok]) => !ok)) process.exit(1);
}

const [command, arg, extra, other] = process.argv.slice(2);
if (!commands.includes(command)) fail('Usage: node scripts/harness.mjs ' + commands.join('|'));
switch (command) {
  case 'validate': validate(); break;
  case 'member': setMember(arg); break;
  case 'list': list(arg); break;
  case 'start': start(arg); break;
  case 'plan': writePlan(); break;
  case 'status': status(); break;
  case 'check':
    if (arg && arg !== '--base') fail('Usage: check [--base origin/main]');
    if (arg === '--base' && (!extra || other)) fail('Usage: check [--base origin/main]');
    check(extra);
    break;
  case 'test': {
    const flags = process.argv.slice(3);
    const options = {};
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i] === '--e2e') options.e2e = true;
      else if (flags[i] === '--no-e2e') options.e2e = false;
      else if (flags[i] === '--base' && flags[i + 1]) options.base = flags[(i += 1)];
      else fail('Usage: test [--base origin/main] [--e2e | --no-e2e]');
    }
    affectedTests(options);
    break;
  }
}
