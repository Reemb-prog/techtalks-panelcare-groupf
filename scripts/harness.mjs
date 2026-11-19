#!/usr/bin/env node
/** PanelCare branch/sprint guard. Zero npm dependencies. No Jira or deployment writes. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const team = readJson('config/team.json');
const sprints = readJson('config/sprints.json').sprints;
const work = readJson('config/work-items.json');
const byId = new Map(work.map((item) => [item.id, item]));
const members = new Set(team.members.map((member) => member.slug));
const commands = ['validate', 'member', 'list', 'start', 'plan', 'status', 'check'];

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
  if (item.sprint !== 'S' + match[1] || item.owner !== match[2]) fail('Branch sprint or owner disagrees with work item: ' + id);
  const local = readLocalMember();
  if (local && !process.env.CI && local !== item.owner) fail('This clone is set to ' + local + ', but branch belongs to ' + item.owner);
  return item;
}
function validate() {
  const problems = [];
  if (members.size !== 4 || team.members.length !== 4) problems.push('Expected exactly four unique team members');
  if (sprints.length !== 3) problems.push('Expected S1/S2/S3 baseline');
  const sprintMap = new Map(sprints.map((item) => [item.id, item]));
  for (const [index, sprint] of sprints.entries()) {
    if (sprint.id !== 'S' + (index + 1)) problems.push('Unexpected sprint order: ' + sprint.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sprint.start) || !/^\d{4}-\d{2}-\d{2}$/.test(sprint.end)) problems.push('Invalid sprint dates: ' + sprint.id);
    if (sprint.end < sprint.start) problems.push('Sprint end precedes start: ' + sprint.id);
    if (index && sprints[index - 1].end >= sprint.start) problems.push('Overlapping sprints: ' + sprint.id);
  }
  if (work.length !== byId.size) problems.push('Duplicate local work item IDs');
  for (const item of work) {
    if (!/^PC-S[1-3]-\d{2}$/.test(item.id)) problems.push('Malformed task ID: ' + item.id);
    if (!sprintMap.has(item.sprint) || !item.id.includes(item.sprint)) problems.push('Task has unknown/mismatched sprint: ' + item.id);
    if (!members.has(item.owner) || !members.has(item.reviewer) || item.owner === item.reviewer) problems.push('Invalid human ownership/reviewer: ' + item.id);
    if (!Number.isInteger(item.startDay) || !Number.isInteger(item.prDay) || item.startDay < 1 || item.prDay > 10 || item.prDay < item.startDay) problems.push('Bad start/PR day: ' + item.id);
    if (!Array.isArray(item.paths) || !item.paths.length) problems.push('Missing file paths: ' + item.id);
    if (!Array.isArray(item.acceptance) || item.acceptance.length < 2) problems.push('Insufficient acceptance: ' + item.id);
    for (const dep of item.dependsOn || []) {
      if (!byId.has(dep)) problems.push('Unknown dependency ' + dep + ' from ' + item.id);
      else if (Number(byId.get(dep).sprint.slice(1)) > Number(item.sprint.slice(1))) problems.push('Forward-sprint dependency ' + dep);
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
  for (const required of ['CLAUDE.md', 'docs/ROADMAP.md', 'docs/JIRA_PLAYBOOK.md', 'docs/DESIGN_BLUEPRINT.md', 'docs/CONTRACTS.md', 'docs/HOSTING_COSTS.md', 'docs/QUALITY_SECURITY.md', 'prompts/CLAUDE_JIRA_BOOTSTRAP.md']) {
    if (!fs.existsSync(path.join(root, required))) problems.push('Missing harness file: ' + required);
  }
  if (problems.length) fail(problems.join('\n'));
  console.log('Harness VALID: ' + members.size + ' members, ' + sprints.length + ' sprints, ' + work.length + ' tasks, no missing references or dependency cycles.');
}
function list(sprint) {
  if (sprint && !sprints.some((item) => item.id === sprint)) fail('Unknown sprint: ' + sprint);
  for (const item of work.filter((value) => !sprint || value.sprint === sprint)) {
    console.log([item.id, item.owner, 'D' + item.startDay + '→PR D' + item.prDay, item.title, 'blocks:' + (item.dependsOn.join(',') || 'none')].join(' | '));
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
    'Jira key: TO CONFIRM | Draft PR: TO CONFIRM | Planned review-ready day: D' + item.prDay,
    'Plan review: Pending | Approver: TO CONFIRM | Date: TO CONFIRM', '',
    '## Goal and scope', item.title, '',
    '## Dependencies to confirm merged', item.dependsOn.join(', ') || '(none)', '',
    '## Allowed paths', ...item.paths.map((value) => '* ' + value), '',
    '## Implementation plan (complete and review BEFORE coding)', '',
    '1. Read existing code, contracts and approved design. Name exact files/components to edit.',
    '2. Record desktop/mobile sections and image provenance if UI; data/role boundaries if backend.',
    '3. Walk through error, empty, retry, denied, concurrency and rollback cases.',
    '4. Challenge assumptions and revise plan; request human review and actual Jira signoff.', '',
    '## Acceptance criteria', ...item.acceptance.map((value) => '* [ ] ' + value), '',
    '## Tests and evidence', 'Intended: ' + item.test,
    'Actual commands, date, environment and result (Passed/Failed/Not run/Blocked): NOT RUN',
    'Screenshot/log link: NOT CAPTURED', '',
    '## Risk, security and UX review',
    'Unknowns / mitigations / Impeccable critique if UI: TO COMPLETE', '',
    '## Handoff', 'Status: Planned | Files changed: none | Next step: obtain plan review', ''
  ].join('\n');
  fs.writeFileSync(target, contents);
  console.log('Created ' + path.relative(root, target) + '. Human approval required before implementation.');
}
function status() {
  const branch = currentBranch();
  console.log('Branch: ' + (branch || '(no active Git branch)'));
  if (branch === 'main' || !branch) {
    console.log('No task selected. Run validate/list, confirm Jira readiness, set member and start a branch.');
    return;
  }
  const item = taskFromBranch();
  console.log('Task: ' + item.id + ' | ' + item.title);
  console.log('Sprint ' + item.sprint + ' | owner ' + item.owner + ' | reviewer ' + item.reviewer + ' | PR day ' + item.prDay);
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
function check(base) {
  assertRepository();
  const item = taskFromBranch();
  const plan = path.join(root, 'worklogs', item.id, 'plan.md');
  if (!fs.existsSync(plan)) fail('Missing worklog plan. Run node scripts/harness.mjs plan and obtain human review.');
  const files = changedFiles(base);
  const allowed = [...item.paths, 'worklogs/' + item.id + '/'];
  const invalid = files.filter((file) => !allowed.some((prefix) => file === prefix || (prefix.endsWith('/') && file.startsWith(prefix))));
  if (invalid.length) fail('Files outside task scope:\n' + invalid.map((file) => '  ' + file).join('\n') + '\nRequest a scoped shared PR or lead-approved task change.');
  console.log('Branch/sprint/owner CHECK OK for ' + item.id + '. Changed paths: ' + files.length + '.');
  console.log('Reminder: manual Jira dependency confirmation, plan approval, reviewer and actual test evidence are not machine-verified.');
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
}
