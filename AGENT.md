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
- **Maintain `project-manager/tasks.md` as the central project log.**
    - **Upon a user request, always plan the task and add it to `project-manager/tasks.md` as `[ ] Pending` (if not already there).**
    - **Present the detailed specification/plan to the user.**
    - **Wait for user confirmation (e.g., "go for it", "proceed") before starting implementation.**
    - **After successful implementation and internal verification of the features, mark the relevant tasks in `project-manager/tasks.md` as `[x] Done`.**
    - **Do not mark a task as `[x] Done` unless it has been fully implemented and verified against the specification.**
- Read `project-manager/general-objectives.md` before planning work to keep feature decisions aligned with the product goals.
- Follow the conventions in `project-manager/styling-guide.md` so Tailwind and Lucide usage stays consistent across the UI.