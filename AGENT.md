# Agent Onboarding

This repository ships with extensive API documentation under the `docs/` directory.
Before working on the application UI, make sure you understand the API surface that
the UI needs to expose.

## How to self-orient
- Start with `docs/01-introduction.md` for the platform overview.
- Read `docs/03-authentication.md` to confirm access requirements and baseline flows.
- Dive into the endpoint guides in `docs/api-*.md`, where each file name matches the action it documents.
- Keep notes on required parameters, error handling, authentication, and any rate limits the UI must respect.
- When adding or updating UI features, cross-check that every API interaction traces back to the documented behavior.

## Working guidelines
- Treat the Markdown docs as the source of truth—ask the user only when documentation is unclear or incomplete.
- Surface undocumented gaps or inconsistencies you discover while implementing features.
- Align component naming, user-facing labels, and validation messages with terminology used in the docs.
- Add follow-up documentation updates whenever UI changes require API documentation adjustments.
- **Maintain `project-manager/tasks.md` as the central project log: record pending, upcoming, and completed tasks; update the status on every change; and note the next steps in your development workflow. This file must be updated with every change, marking tasks as `[x]` (done) or `[ ]` (pending) within dedicated 'Done', 'In Progress', and 'Planned' sections.**
- Read `project-manager/general-objectives.md` before planning work to keep feature decisions aligned with the product goals.
- Follow the conventions in `project-manager/styling-guide.md` so Tailwind and Lucide usage stays consistent across the UI.