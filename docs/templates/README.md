# Templates

Reusable output and implementation templates live here.

Templates are not procedures. They are copyable end-state shapes referenced by workflows.

## Template Contents

A useful template includes:

1. When to use it.
2. Required placeholders.
3. The copyable template body.
4. A short verification checklist.

## Naming and Structure

Use `noun-template.md` or `domain-noun-template.md` for standalone templates. Use a named subdirectory when a stack or pattern needs a family of related templates.

Examples:

- `bin/`
- `backend/express-light-rail/`
- `frontend/`
- `prompt-improvement-template.md`
- `backward-reasoning-plan-template.md`

Template families should include their own `README.md` that lists the focused templates and when to use the family.

Keep project-specific names out of generic templates unless the file is intentionally scoped to that project.
