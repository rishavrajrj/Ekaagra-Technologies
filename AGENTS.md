<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Development Workflow & Engineering Standards

## 1. Structured Development Lifecycle
Follow this structured workflow for all feature work, refactors, and bug fixes:
1. **Requirements**: Thoroughly understand the requirements, constraints, and scope before modifying code.
2. **Planning**: Use GSD (`/gsd-plan-phase`, `/gsd-quick`, or Antigravity planning) to structure the work into clear, isolated tasks.
3. **Task Decomposition**: Break complex tasks into small, self-contained increments with clear verification criteria.
4. **Implementation**:
   - Inspect existing code and file context before making any modifications.
   - Reuse existing components, hooks, schemas, and utility functions in `src/lib/` and `src/components/`.
   - Avoid unnecessary rewrites or architectural departures.
   - Preserve established UI/UX patterns (Tailwind CSS, design system, layout conventions).
   - Maintain business logic consistency across onboarding, pricing, and administrative portals.
   - Explicitly handle edge cases, null/undefined checks, and boundary values.
5. **Testing & Validation**:
   - Run `npm run lint` (`tsc --noEmit`) to verify strict TypeScript compliance.
   - Run `npm test` to ensure existing domain unit tests pass with zero regressions.
   - Run targeted script tests in `scripts/` when changing domain or campus logic.
6. **Code Review**:
   - Review the diff against repository standards and CodeRabbit configuration (`.coderabbit.yaml`).
   - Fix all valid review findings, typing flaws, or logic regressions.
7. **Completion**:
   - Verify that all acceptance criteria are met and no untracked regressions remain.

## 2. Code Safety Guardrails
- **No Speculative Changes**: Do not delete existing files or rewrite functioning subsystems unless explicitly requested.
- **Database & RLS Safety**: Do not modify Supabase database migrations or schemas without clear necessity and backwards compatibility.
- **Secret Hygiene**: Never commit environment variables, API keys, service role secrets, or private credentials.

