# Life OS — Improvement Studio master prompt

Act as a senior product designer and full-stack engineer working inside my existing Life OS project. Build and refine a beautiful, fully working **Improvement Studio** that helps me reflect, collect useful ideas, and turn them into small actions.

Read AGENTS.md, the project documentation, and the installed framework guides first. Reuse the existing Next.js, TypeScript, Tailwind, shadcn/ui, Lucide, Prisma, SQLite, and authentication patterns. Keep the application running on port 8090.

## Product experience

Create a dedicated `/improvement` page, accessible from Life OS navigation. Use the headline “A little better, every day.” Organize the experience into **My notes**, **Suggestions**, and **Action plan**.

- Notes: create, edit, pin, search, filter, and delete reflections with a title, detailed notes, and a life area. Include Mindset, Learning, Productivity, Wellbeing, and Career. Confirm deletion and preserve unsaved content if saving fails.
- Suggestions: provide a curated collection of practical experiments, with a category, estimated time, a clear next step, and a short explanation. Let me add suggestions to my action plan and clearly indicate ones already added. Label curated ideas honestly; never present them as AI analysis or personalized findings.
- Action plan: turn a reflection into an action, add my own steps, mark them complete, reopen them, and edit or delete them. Keep completion and progress metrics based on actual saved data.
- Reflection prompt: offer a thoughtful starting question such as “What’s one thing you could make a little easier tomorrow?” Open a prefilled, editable note when selected.
- Progress: show reflections captured, open actions, completed actions, and a completion bar. Use meaningful empty states for a new account.

## Visual direction

Create a calm, polished editorial interface with a deep forest-green hero, pale lime accents, warm cream reflection cards, white content surfaces, fine borders, generous spacing, and rounded corners. Use crisp typography, restrained icons, clear hierarchy, and subtle hover and focus states. Build an attractive desktop layout with a secondary reflection column that stacks naturally on smaller screens. Keep controls usable on narrow phones and avoid horizontal overflow. Respect reduced-motion preferences. Use accessible contrast, descriptive labels, keyboard-operable controls, and properly managed dialog focus.

## Engineering and quality

Persist entries in SQLite through authenticated API routes. Scope every read, update, and deletion to the signed-in user. Validate types, categories, title length, and note length on the server. Display loading, error, retry, pending-save, and success states. Never invent progress or seed fake personal notes. Prevent duplicate submissions and avoid silently dropping failed changes. Apply schema changes without deleting existing data.

Verify creation, reload persistence, editing, pinning, filtering, note-to-action conversion, suggestion adoption, completion/reopening, and deletion. Test malformed requests, signed-out access, and access across two accounts. Run relevant lint and TypeScript checks, distinguish pre-existing failures, and inspect desktop and mobile layouts when a browser is available. Finish with the preview URL, a concise explanation of delivered behavior, and any genuine limitations.

Potential future extensions, only when explicitly requested: weekly reviews, user-set priorities and due dates, links between reflections and existing goals, and personalized suggestions grounded in real tracker data. Do not add paid AI services or expose private notes to external services without an explicit request.
