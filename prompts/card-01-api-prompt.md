# Card 01 · API prompt (filled in)

1. Click the **copy icon** at the top right of the grey box below and paste into a **new** AI chat.
2. Under **RULES:** paste all of `prompts/rules-api.md` (open it › **Copy raw file**).
3. Under **CHARTER:** paste your Card 01 charter JSON. Press **Enter**.

The AI answers with 1 file: tests/api/trn-01.spec.ts.

````
Write API tests for my user story.

STORY:
Card 01 · TRN-01 · Register a taxpayer
Story: As a clerk, I create a taxpayer with a mobile, so I can bill them later.
Acceptance criteria:
- AC-1: Section "1 — Create a taxpayer" shows `[full name] created — mobile [mobile].`
- AC-2: The same taxpayer details show under My Data › My taxpayers.
- AC-3: Spaces around the name are removed, both in the "created" message and in My Data.
- AC-4: A mobile that's already registered is not accepted. Error message: `already registered for this tenant`
- AC-5: Name accepts only 2–100 characters: letters, spaces, `. - '` and Ñ. Error message: `2-100 characters: letters, spaces, . - ' and Ñ only`
- AC-6: Email is optional. If typed, it needs one `@` with a dot after it, 254 characters max. Error message: `invalid email format`
- AC-7: A taxpayer created under my name-tag shows only for that name-tag. Under another name-tag, My Data shows `None yet — create one in Training setup.` and the Taxpayer lists are empty.
- AC-8: Mobile accepts only `09` + 9 digits, or `+639` + 9 digits. No spaces, no dashes. Error message: `must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX`
Example API response:
POST /api/v1/training/taxpayers {"full_name":"Ana Dela Cruz","mobile":"09013724603"}
→ 201 {"taxpayer_id":"d55f5627-8477-4a54-955c-42cb50e857b7","full_name":"Ana Dela Cruz","mobile":"09013724603","email":null,"created_at":"2026-11-02T18:22:04.959Z"}
GET /api/v1/training/taxpayers → 200 a list of rows with taxpayer_id, tenant_id, full_name, mobile, email, created_by, created_at

TESTS:
One test for each node in my charter with the status "API test".
Use the node's id, its request or steps, and its expected result, word for word.

RULES:
<paste prompts/rules-api.md here>

CHARTER:
<paste your Card 01 charter JSON here>
````
