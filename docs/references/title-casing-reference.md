# Title Casing Reference

Use for pull request titles, Markdown headings, email subjects, and other short user-visible display titles that should read like headlines. Explicit local style guides win.

## Rules

- Before reporting a draft edit complete, review user-visible Markdown headings and email subjects for title case unless an explicit local style guide says otherwise.

- Capitalize the first and last word.
- Capitalize major words: nouns, pronouns, verbs, adjectives, adverbs, and subordinating conjunctions.
- Lowercase minor words unless they are first or last: articles, coordinating conjunctions, and short prepositions.
- Preserve acronyms and intentional all-caps terms.
- Preserve exact code identifiers, package names, and command names when they must appear in a title.
- For hyphenated compounds, capitalize the first word and capitalize later words when they are major words or acronyms.

## Delivery Preflight

Before submitting a GitHub issue or pull request, run the packaged checker against the final title:

```bash
check-title-case --title "Require Title Casing for GitHub Issues and Pull Requests"
```

Pass exact code identifiers or package names with `--preserve EXACT_WORD`. After creation, read the title again with `gh issue view` or `gh pr view` and run the same check on the returned title before reporting delivery complete.

The final check command is `check-title-case --title "<final title>"`; re-read the title through GitHub after submission and run the same check again.

## Examples

- Make Packaged Skill Workflow Fallbacks Self-Contained
- Require Title Casing for PR Titles
- Fix Skill Lookup in Projects Without Local Workflows
