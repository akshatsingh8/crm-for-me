# CRM design system

This is an internal tool for real estate lead work. The interface should make names, next actions, and status easy to scan during a busy day. Keep decoration quiet and let the lead data carry the page.

## Visual direction

- Background `#f5f7f5`, white surfaces, border `#dce4df`.
- Primary text `#202d2b`, secondary text `#62716d`.
- Deep green `#176252` for active navigation, primary actions, links, and chart emphasis. Reserve red for errors and destructive actions, warm sand for reminders.
- Use one system sans stack, compact headings, regular body copy, and small uppercase labels sparingly. Avoid gradients, glowing shadows, and decorative illustrations.
- Cards have subtle borders, 10px corners, and almost invisible shadows. Inputs and buttons use a consistent 42px minimum touch height.

## Layout rules

- Desktop: persistent 244px sidebar; page content capped near 1320px with generous edges.
- Tablet: top navigation with horizontal scrolling; analytics panels collapse before content becomes cramped.
- Mobile: two-row header with a scrollable nav, one-column forms and lead cards, full-width contact actions, and 16px form controls to prevent iOS zoom.
- Dense data can scroll sideways when preserving columns matters, as in the import preview and requirement matrix. The lead directory becomes labeled cards on narrow screens.
- Check at 320px, 390px, 768px, and wide desktop widths. Keep keyboard focus visible and respect reduced motion.

## Review checklist

1. No page-level horizontal overflow.
2. Primary actions and the current navigation item remain easy to find.
3. Every form field, modal, and call action remains usable with touch and keyboard.
4. Text wraps cleanly for long names, emails, notes, and locations.
