# Your prompt: 4 short parts

The same prompt writes API tests, web tests and integration tests. You change **one word** at the top, write **one line** for the tests, and paste three things.

```
Write <API | web | integration> tests for my user story.

STORY:
<paste your story and its acceptance criteria>

TESTS:
One test for each node in my charter with the status "<API test | UI journey | Integration>".
Use the node's id, its request or steps, and its expected result, word for word.

RULES:
<paste prompts/rules-api.md, rules-web.md or rules-integration.md>

CHARTER:
<paste the JSON you downloaded from Charter360>
```

## What each part is for

| Part | It tells the AI | Who writes it | Changes for the next story? |
|---|---|---|---|
| first line | what kind of tests | you: one word | sometimes |
| **STORY** | what the clerk does and must see | the BA (you paste it) | yes |
| **TESTS** | which charter nodes to automate | you: one word (the status) | sometimes |
| **RULES** | how **our team** writes tests: files, helpers, one example | the team, once | no (only at a new company) |
| **CHARTER** | the tests: ids, inputs, expected results | you, in Charter360 | yes |

Why it's short: the **how** (helpers, file names, style) never changes, so it lives in a rules file. The **what** (story and charter) is yours.

| Kind | Status in the charter | Rules file | The AI gives you |
|---|---|---|---|
| API | API test (green) | `rules-api.md` | `tests/api/<story-id>.spec.ts` (e.g. `trn-02.spec.ts`) |
| web | UI journey (blue) | `rules-web.md` | `tests/web/<story-id>.spec.ts` |
| integration | Integration (purple) | `rules-integration.md` | `tests/integration/<story-id>.spec.ts` |

Card 01, filled in: `card-01-api-prompt.md`, `card-01-web-prompt.md`, `card-01-integration-prompt.md`.
After the run: `update-charter-prompt.md`. Before you commit: `review-checklist.md`.
