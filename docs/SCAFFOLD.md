# First Next.js scaffold without overwriting harness files

Assigned task: PC-S1-01, Reem. This harness archive intentionally contains no \`package.json\`; the code has not been generated yet and app checks cannot run. In the approved S1 first PR, initialize the app with official stable \`create-next-app\` tooling using **npm**, TypeScript, App Router, Tailwind CSS, ESLint and \`src/\` layout.

**Important:** Do not run \`create-next-app .\` directly over this nonempty harness directory, because the CLI may refuse to initialize or collide with existing files. Use a temporary sibling folder *outside the repository*. Review the generated tree, then copy **only** the generated project files that do not overwrite tracked harness files. Never overwrite CLAUDE.md, AGENTS.md, README.md, .gitignore, .github, docs, prompts or config automatically.

Example approach for a Bash terminal:

1. Choose a safe temporary directory with \`mktemp -d\` and keep its exact path.
2. Run \`npx create-next-app@latest <temporary-directory>/panelcare-app --typescript --eslint --tailwind --app --src-dir --use-npm --import-alias "@/*"\`. Inspect the version/license before accepting installation, and use the team's approved stable release.
3. Copy only app-owned paths such as \`src/\`, \`public/\`, \`package.json\`, \`package-lock.json\`, \`tsconfig.json\`, \`next.config.ts\`, \`postcss.config.mjs\`, \`eslint.config.mjs\` into the repository, after checking for conflicts with the harness.
4. Add appropriate supported Vitest and Playwright dependencies, plus app scripts \`lint\`, \`typecheck\`, \`test\`, \`build\`, \`test:e2e\` with a small meaningful test; commit the npm lockfile.
5. Run \`node scripts/harness.mjs check\`, \`node scripts/ci.mjs\`, a local render/screenshot, then open a reviewed small PR by S1 D2.

No remote install script runs automatically when members clone this repository. Revalidate the supported Node LTS version and selected Next.js stable version on scaffold day; the harness currently tests under Node 22 and 24.
