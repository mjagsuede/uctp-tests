# Card 01 · TRN-01 · Register a taxpayer

**Story.** As a clerk, I create a taxpayer with a mobile, so I can bill them later.

**Where on the screen.** Home › **Create my data** › section **1 — Create a taxpayer**: Full name, Mobile (09XXXXXXXXX), Email (optional), button **Create taxpayer**. Then top bar › **My data** › **My taxpayers**.

**API.** `POST /api/v1/training/taxpayers` (create), `GET /api/v1/training/taxpayers/{taxpayer_id}` (see one), `GET /api/v1/training/taxpayers` (my list).

## Acceptance criteria

- **AC-1:** Section "1 — Create a taxpayer" shows `[full name] created — mobile [mobile].`
- **AC-2:** The same taxpayer details show under My Data › My taxpayers.
- **AC-3:** Spaces around the name are removed, both in the "created" message and in My Data.
- **AC-4:** A mobile that's already registered is not accepted. Error message: `already registered for this tenant`
- **AC-5:** Name accepts only 2–100 characters: letters, spaces, `. - '` and Ñ. Error message: `2-100 characters: letters, spaces, . - ' and Ñ only`
- **AC-6:** Email is optional. If typed, it needs one `@` with a dot after it, 254 characters max. Error message: `invalid email format`
- **AC-7:** A taxpayer created under my name-tag shows only for that name-tag. Under another name-tag, My Data shows `None yet — create one in Training setup.` and the Taxpayer lists are empty.
- **AC-8:** Mobile accepts only `09` + 9 digits, or `+639` + 9 digits. No spaces, no dashes. Error message: `must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX`

## Example API responses

```
POST /api/v1/training/taxpayers {"full_name":"Ana Dela Cruz","mobile":"09013724603"}
→ 201 {"taxpayer_id":"d55f5627-8477-4a54-955c-42cb50e857b7","full_name":"Ana Dela Cruz","mobile":"09013724603","email":null,"created_at":"2026-11-02T18:22:04.959Z"}

POST /api/v1/training/taxpayers {"full_name":"Ana Dela Cruz","mobile":"0917123456"}
→ 422 {"detail":{"mobile":"must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX"}}

GET /api/v1/training/taxpayers
→ 200 [{"taxpayer_id":"…","tenant_id":"TAGAYTAY","full_name":"Ana Dela Cruz","mobile":"09013724603","email":null,"created_by":"Ana-4821","created_at":"…"}]
```

The reference charter for this story is `charters/card-01-charter.json`: 34 API tests (A), 9 web tests (W) and 6 integration tests (I).
