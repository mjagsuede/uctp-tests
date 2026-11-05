# UCTP screen stories (web), Cards 01–20

## UCTP in 1 minute

UCTP is a practice copy of a **city treasurer's office** (made-up data). Think of the counter at City Hall where people pay their taxes:

1. A **clerk** registers the **taxpayer** (name, mobile).
2. The clerk makes a **bill**: a property tax bill (land and buildings, two lines: Basic and SEF) or a business tax or fee bill.
3. A **cashier** takes the payment at the counter (the **POS**) and prints an **Official Receipt**.
4. The taxpayer can look up what they owe on the **citizen portal**.
5. **My data** lists everything you made, only for your name-tag.

You don't need to know tax law. Each story below says exactly what you click and what you must see.

## How to read a screen story

- `›` means "click". Every path starts on the **Home** page.
- Text in `code` or "quotes" is **exactly** what the screen shows: use it as your expected result.
- Each story has 5 parts. Each part becomes one branch of your charter: **1** → Upon page load, **2** → Element validations, **3** → Functional validations, **4** → the page where you check it, **5** → API test or Manual nodes.
- "What the screen does today" + "Open question" = something the screen does that the story doesn't explain. A tester writes it down and asks. They don't guess.

Checked on staging `https://city-treasurer-staging.aiqe.pro` on Nov 4, 2026 (about 00:45 Manila), from the page code and real answers of the site.

---



**Read this first (true for every card below)**

- Every path starts on Home. `›` means "click". Training setup is **one long page** with sections 1 to 5; My data is **one long page** with the headings My taxpayers, My bills, My tellers, My approver, My receipts. "Section 2" or "My bills" means: scroll to that heading.
- On your first visit a box "Your name" opens. Type your whole name-tag (for example `Ana-4821`) and click **Save**. The top bar then shows `You are: Ana-4821`.
- The band at the top of every page says `TRAINING — made-up data only`.
- **One message at a time.** When you click a Create button, the screen shows only the **first** rule that is broken, under its field. Fix it, click again, and the next one shows.
- **Old result box stays.** If a create worked and the next click fails, the green result box of the earlier success is still on the screen, next to the new error message (the page does not clear it). Reload the page to start clean.
- Money on Training setup and My data has no peso sign and no comma (`20000.00`), except the section 3 result box (`₱1850.00`). The Assessment page uses `₱2,600.00`.

---

## Card 01 · TRN-01 · Register a taxpayer with a local mobile (on the screen)

**Story.** As a treasury clerk, I want to register a taxpayer with a local mobile number, so that I can bill them later.

**Where.** Home › Create my data › section "1 — Create a taxpayer" › Create taxpayer. Then top bar › My data › My taxpayers (or Home › See my data › My taxpayers).

**Before you start.** Nothing (only your name-tag in the top bar).

### 1. When the screen opens (upon page load)
- Page heading `Training setup`, with the line "Create the data you will use in class — everything here is fictional and yours only."
- Top bar: `You are: <your name-tag>` and a `Change` link.
- Section heading `1 — Create a taxpayer`.
- `Full name` – text box, empty.
- `Mobile (09XXXXXXXXX)` – text box, empty.
- `Email (optional)` – text box, empty.
- `Create taxpayer` – button.
- No result box and no error text yet.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Full name | Required. 2 to 100 characters after the spaces at the start and end are removed. Only letters, spaces, `.` `-` `'` and Ñ/ñ. | `2-100 characters: letters, spaces, . - ' and Ñ only` |
| Mobile (09XXXXXXXXX) | Required. `09` + 9 digits, or `+639` + 9 digits. Nothing else (no spaces, no dashes). | `must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX` |
| Mobile (09XXXXXXXXX) | One mobile per city: a mobile already registered by anyone is refused. | `already registered for this tenant` |
| Email (optional) | May stay blank. If typed: one `@`, a dot after it, at most 254 characters. | `invalid email format` |

Checked order when several fields are wrong: Full name first, then Mobile, then Email.

### 3. What must happen (functional validations)
- AC-1: Click **Create taxpayer** with a good name and mobile: a result box appears: `<full name> created — mobile <mobile>.`
- AC-2: The name in the result box has no spaces at the start or end, even if you typed them.
- AC-3: The mobile in the result box is exactly the 09 number you typed.
- AC-4: The result box has two buttons: `Create a property tax bill for this taxpayer` and `Create a business tax or fee bill`.
- AC-5: When a rule is broken, no new taxpayer is made and the message shows under that field.
- AC-6: The new taxpayer appears in the `Taxpayer (only yours are listed)` lists of sections 2 and 3 as `<full name> (<mobile>)`.

### 4. Where you check it (the validate story)
- Top bar › My data. Page heading `My data`, line "Everything created under your name. Another name — even the same name typed again — sees nothing here."
- Heading `My taxpayers`: a table with columns `Name` | `Mobile` | `Email`.
- Your row: `<full name>` | `<09 mobile>` | `—` (a dash when you gave no email).
- Another name-tag (top bar › Change › a new name › Save) sees under My taxpayers: `None yet — create one in Training setup.`

### 5. Not on this screen
- API only: the `taxpayer_id` and `created_at`; `GET /api/v1/training/taxpayers/{taxpayer_id}` for another user → 404 `{"detail":"Not Found"}`; a call with no `X-User-ID` → 422 `{"detail":{"X-User-ID":"required header"}}` (the screen always sends your name-tag).
- Manual (needs judgment): is the message clear to a clerk; is the label "Mobile (09XXXXXXXXX)" clear when +63 is also accepted; field order and layout.
- Open questions: when two fields are wrong, only one message shows. Is that the wanted behavior? The old result box stays after a failed try (see top). Is that wanted?

---

## Card 02 · TRN-01 · Register a taxpayer with a +63 mobile and email (on the screen)

**Story.** As a treasury clerk, I want to register a taxpayer with a +63 mobile and an email, so that the record holds every contact the taxpayer gives.

**Where.** Home › Create my data › section "1 — Create a taxpayer" › Create taxpayer. Then top bar › My data › My taxpayers (Email column).

**Before you start.** Nothing (only your name-tag in the top bar).

### 1. When the screen opens (upon page load)
- Page heading `Training setup`; top bar `You are: <your name-tag>`.
- Section heading `1 — Create a taxpayer`.
- `Full name` – text box, empty.
- `Mobile (09XXXXXXXXX)` – text box, empty.
- `Email (optional)` – text box, empty.
- `Create taxpayer` – button.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Full name | Required. 2 to 100 characters after the end spaces are removed. Letters, spaces, `.` `-` `'`, Ñ and ñ. | `2-100 characters: letters, spaces, . - ' and Ñ only` |
| Mobile (09XXXXXXXXX) | `+639` + 9 digits is accepted and saved as `09` + the same 9 digits. No spaces inside. | `must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX` |
| Mobile (09XXXXXXXXX) | The duplicate check uses the saved 09 form, so `+639…` and `09…` of the same number count as one. | `already registered for this tenant` |
| Email (optional) | Blank = no email. If typed: one `@`, a dot after it, at most 254 characters. | `invalid email format` |

### 3. What must happen (functional validations)
- AC-1: Create with a `+639…` mobile: the result box says `<full name> created — mobile 09…` (the 09 form, not what you typed).
- AC-2: A name with Ñ or ñ is kept as typed in the result box.
- AC-3: The result box does not show the email (it shows only name and mobile).
- AC-4: The same number typed again in the other form is refused: `already registered for this tenant` under Mobile.
- AC-5: A wrong email is refused: `invalid email format` under Email, and no taxpayer is made.

### 4. Where you check it (the validate story)
- Top bar › My data › heading `My taxpayers`, columns `Name` | `Mobile` | `Email`.
- Your row: `<full name>` | `09…` (never `+63…`) | `<the email you typed>`.
- A taxpayer made with the Email box blank shows `—` in the Email column.
- Another name-tag sees `None yet — create one in Training setup.`

### 5. Not on this screen
- API only: `GET /api/v1/training/taxpayers` returns only your taxpayers, each with `created_by` = your name-tag; with another X-User-ID it returns `[]`. The email itself is only on My data and in the API (not in the result box).
- Manual (needs judgment): does a clerk understand that +63 becomes 09; is it clear which field the duplicate message is about.
- Open questions: the label says `Mobile (09XXXXXXXXX)` but +639 is accepted: should the label say both?

---

## Card 03 · TRN-02 · Create an industrial property tax bill for this year (on the screen)

**Story.** As a treasury clerk, I want to create a real property tax bill for an industrial property this year, so that the city can collect its Basic and SEF (Special Education Fund) tax.

**Where.** Home › Create my data › section "2 — Create a property tax bill" › Create property tax bill. Then top bar › My data › My bills › details.

**Before you start.** One taxpayer of your own. Make it in section 1 (Card 01 steps), then click **Create a property tax bill for this taxpayer** in the result box: it picks that taxpayer in section 2 and scrolls there.

### 1. When the screen opens (upon page load)
- Section heading `2 — Create a property tax bill`.
- `Taxpayer (only yours are listed)` – drop-down list. First option `— pick a taxpayer —` (selected); then one option per taxpayer of yours: `<full name> (<mobile>)`.
- `PIN (NNN-NN-NNN-NNN-NNN)` – text box, empty.
- `Property class` – drop-down list: `RESIDENTIAL` (selected), `COMMERCIAL`, `AGRICULTURAL`, `INDUSTRIAL`.
- `Assessed value (₱)` – text box, empty.
- `Tax year` – text box, prefilled `2026`.
- `Create property tax bill` – button.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required: pick one of your taxpayers. | **None.** The screen shows no message anywhere and makes no bill (see section 5). |
| PIN (NNN-NN-NNN-NNN-NNN) | Required. 3-2-3-3-3 digits with dashes. | `must match NNN-NN-NNN-NNN-NNN` |
| PIN (NNN-NN-NNN-NNN-NNN) | One PIN per city: a PIN already used by anyone is refused. | `already taken for this tenant` |
| Property class | One of the 4 options in the list. | (the list allows only valid options) |
| Assessed value (₱) | Required. Digits only, with a dot and at most 2 decimals (no commas, no ₱). | `must be a positive amount with at most 2 decimals` |
| Assessed value (₱) | More than 0. | `must be greater than 0` |
| Assessed value (₱) | At most 999999999.99. | `must not exceed 999999999.99` |
| Tax year | A whole number from 2020 to 2031. | `must be 2020..2031` |
| Tax year | Must be a whole number (not blank, no letters, no decimals). | **None.** The screen shows no message anywhere and makes no bill (see section 5). |

### 3. What must happen (functional validations)
- AC-1: INDUSTRIAL (and COMMERCIAL): Basic = 2% of the assessed value; SEF = 1% of the assessed value.
- AC-2: Card example: INDUSTRIAL, Assessed value `1000000.00`, Tax year `2026` → result box `Bill <PIN> created:` with two rows: `RPT` `20000.00` and `RPT_SEF` `10000.00`.
- AC-3: The result box has three buttons: `See the assessment (what's due today)`, `Collect at the cashier (POS)`, `Find it in the citizen portal`.
- AC-4: Both lines (RPT and RPT_SEF) start OPEN.
- AC-5: A broken rule makes no bill; the message shows under its field.

### 4. Where you check it (the validate story)
- Top bar › My data › heading `My bills`. One row per bill: `RPT <PIN>` | `INDUSTRIAL 2026` | `1000000.00` | `OPEN` | `details`. (The amount in the row is the **assessed value**, not the tax.)
- Click `details`: a panel `Receivables:` with two lines: `<first 8 characters of the id> RPT — 20000.00 (OPEN)` and `<8 characters> RPT_SEF — 10000.00 (OPEN)`.
- Under it, for each line: buttons `Assessment`, `Collect at POS`, `Find in portal` (so two of each; the RPT line comes first).
- My bills is not sorted by date: find your row by its PIN.
- Another name-tag sees under My bills: `None yet.`

### 5. Not on this screen
- API only: `bill_id`, `receivable_id`s, `due_date` (`2026-12-31`), `tax_year`; another user's `GET /api/v1/training/rpt-bills/{bill_id}` → 404 `{"detail":"Not Found"}`.
- Manual (needs judgment): is it clear that the My bills amount is the assessed value and not the tax due; layout of the two-line result.
- What the screen does today: with no taxpayer picked, the API answers 404 `{"detail":"Not Found"}`; with Tax year blank or not a whole number, the API answers 422 with a list (`Input should be a valid integer, unable to parse string as an integer`). Section 2 has no place that shows either answer, so the click seems to do nothing. Open question: what message should the clerk see?

---

## Card 04 · TRN-02 · Create a commercial property tax bill for next year (on the screen)

**Story.** As a treasury clerk, I want to create next year's property tax bill for a commercial property, so that the taxpayer can pay ahead.

**Where.** Home › Create my data › section "2 — Create a property tax bill" › Property class `COMMERCIAL` › Tax year `2027` › Create property tax bill. Then top bar › My data › My bills › details.

**Before you start.** One taxpayer of your own (section 1, then **Create a property tax bill for this taxpayer**).

### 1. When the screen opens (upon page load)
- Section heading `2 — Create a property tax bill`.
- `Taxpayer (only yours are listed)` – drop-down list, `— pick a taxpayer —` selected, then `<full name> (<mobile>)` for each of yours.
- `PIN (NNN-NN-NNN-NNN-NNN)` – text box, empty.
- `Property class` – drop-down list: `RESIDENTIAL` (selected), `COMMERCIAL`, `AGRICULTURAL`, `INDUSTRIAL`.
- `Assessed value (₱)` – text box, empty.
- `Tax year` – **text box** (not a list), prefilled `2026`. You type 2027 over it.
- `Create property tax bill` – button.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required. | **None** (no message anywhere; see Card 03 section 5). |
| PIN (NNN-NN-NNN-NNN-NNN) | NNN-NN-NNN-NNN-NNN; one per city. | `must match NNN-NN-NNN-NNN-NNN` / `already taken for this tenant` |
| Property class | One of the 4 options (capital letters only in the list). | (the list allows only valid options) |
| Assessed value (₱) | More than 0, at most 2 decimals, at most 999999999.99. | `must be greater than 0` / `must be a positive amount with at most 2 decimals` / `must not exceed 999999999.99` |
| Tax year | From 2020 to this year + 5 (2031). | `must be 2020..2031` |
| Tax year | A whole number. | **None** (no message anywhere; see Card 03 section 5). |

### 3. What must happen (functional validations)
- AC-1: The bill is saved with class COMMERCIAL and tax year 2027.
- AC-2: COMMERCIAL: Basic = 2% and SEF = 1% of the assessed value.
- AC-3: Card example: COMMERCIAL, Assessed value `300000.00`, Tax year `2027` → result box `Bill <PIN> created:` with rows `RPT` `6000.00` and `RPT_SEF` `3000.00`.
- AC-4: A tax year outside 2020–2031 makes no bill and shows `must be 2020..2031` under Tax year.
- AC-5: The due date is 2027-12-31 (not shown on any screen; see section 5).

### 4. Where you check it (the validate story)
- Top bar › My data › `My bills`: row `RPT <PIN>` | `COMMERCIAL 2027` | `300000.00` | `OPEN` | `details`.
- `details`: `Receivables:` `<8 characters> RPT — 6000.00 (OPEN)` and `<8 characters> RPT_SEF — 3000.00 (OPEN)`, with `Assessment`, `Collect at POS`, `Find in portal` for each line.
- Another name-tag sees `None yet.` under My bills.

### 5. Not on this screen
- API only: `due_date` `2027-12-31` (My bills, details and the Assessment page do not show a due date); `property_class` saved in capitals when the API gets `commercial` (the screen list has capitals only); `GET /api/v1/training/rpt-bills` row fields.
- Manual (needs judgment): Tax year is a free text box with no hint of the allowed range: is that clear?
- Open questions: the validate story asks to see the **due date** in My bills, but no screen shows it. Should My bills show it? (The Assessment page for the RPT line shows `TAX YEAR 2027` and, when checked on Nov 3, a 20% discount `₱6,000.00, ₱0.00, ₱1,200.00`; that is Card 09's subject.)

---

## Card 05 · TRN-03 · Create a business tax bill (on the screen)

**Story.** As a treasury clerk, I want to create a business tax bill, so that the cashier can collect it.

**Where.** Home › Create my data › section "3 — Create a business tax or fee bill" › Create bill. Then top bar › My data › My bills.

**Before you start.** One taxpayer of your own. Make it in section 1, then click **Create a business tax or fee bill** in the result box: it picks that taxpayer in section 3 and scrolls there.

### 1. When the screen opens (upon page load)
- Section heading `3 — Create a business tax or fee bill`.
- `Taxpayer (only yours are listed)` – drop-down list, `— pick a taxpayer —` selected, then `<full name> (<mobile>)` for each of yours.
- `Type` – drop-down list: `BUSINESS` (selected), `FEE`.
- `Reference` – text box, empty.
- `Description` – text box, empty.
- `Amount (₱)` – text box, empty.
- `Due date` – text box, empty, grey hint `YYYY-MM-DD`.
- `Create bill` – button.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required. | **None.** No message anywhere, no bill (see section 5). |
| Type | BUSINESS or FEE (the list allows only these). | (no message place under Type) |
| Reference | Required. 1 to 100 characters after the end spaces are removed. | `1-100 characters` |
| Reference | One reference per city. | `already taken for this tenant` |
| Description | Optional. No rule on screen. | (no message place under Description) |
| Amount (₱) | Required. Digits with a dot, at most 2 decimals (no commas, no ₱, no minus). | `must be a positive amount with at most 2 decimals` |
| Amount (₱) | More than 0. | `must be greater than 0` |
| Amount (₱) | At most 999999999.99. | `must not exceed 999999999.99` |
| Due date | Required. A real calendar date written YYYY-MM-DD. | `must be a valid ISO date (YYYY-MM-DD)` |

Checked order when several fields are wrong: Reference, then Amount, then Due date. A missing Taxpayer is checked after Reference (its place against Amount and Due date: check on screen).

### 3. What must happen (functional validations)
- AC-1: Card example: Type `BUSINESS`, Amount `1850.00` → result box `BUSINESS bill <reference> for ₱1850.00.`
- AC-2: An amount with one decimal is saved with two (`1850.5` shows `₱1850.50`).
- AC-3: The result box has three buttons: `See the assessment (what's due today)`, `Collect at the cashier (POS)`, `Find it in the citizen portal`.
- AC-4: The bill starts OPEN for payment.
- AC-5: A broken rule makes no bill; the message shows under its field.

### 4. Where you check it (the validate story)
- Top bar › My data › `My bills`: row `Business <reference>` | (empty cell) | `1850.00` | `OPEN` | `details`. The description is not shown anywhere on My data.
- `details`: `Receivables:` `<8 characters> BUSINESS — 1850.00 (OPEN)`, with buttons `Assessment`, `Collect at POS`, `Find in portal`.
- Another name-tag sees `None yet.` under My bills.

### 5. Not on this screen
- API only: `description`, `due_date`, `bill_id`, `receivable_id`; another user's `GET /api/v1/training/bills/{bill_id}` → 404 `{"detail":"Not Found"}`. A blank Description is saved as `null`.
- Manual (needs judgment): is `₱1850.00` (no comma) OK in the result box when other pages show `₱1,850.00`; is it fine that the description never shows.
- What the screen does today: with no taxpayer picked (and every other field good), the API answers 404 `{"detail":"Not Found"}` and section 3 shows nothing. Open question: what message should show? ASK-11: Description has no length limit.

---

## Card 06 · TRN-03 · Create a past-due fee bill (on the screen)

**Story.** As a treasury clerk, I want to create a fee bill that is already past due, so that I can see the late interest.

**Where.** Home › Create my data › section "3 — Create a business tax or fee bill" › Type `FEE` › Create bill. Then top bar › My data › My bills › details › Assessment. (Or, right after creating: result box › See the assessment (what's due today).)

**Before you start.** One taxpayer of your own (section 1, then **Create a business tax or fee bill**).

### 1. When the screen opens (upon page load)
- Training setup, section heading `3 — Create a business tax or fee bill`; fields as on Card 05: `Taxpayer (only yours are listed)` (list), `Type` (list: `BUSINESS` selected, `FEE`), `Reference`, `Description`, `Amount (₱)`, `Due date` (hint `YYYY-MM-DD`); button `Create bill`.
- Assessment page (opens in the same tab): band `SPECIMEN — NOT AN OFFICIAL STATEMENT`; lines `Republic of the Philippines`, `CITY OF TAGAYTAY / PROVINCE OF CAVITE`, `Office of the City Treasurer`; title `STATEMENT OF ACCOUNT`.
- Assessment page boxes: `Acct No.` `—`; `SOA No.` `SOA-<year>-<month>-<first 8 characters of the line id, capitals>`; `Date` (today, Manila); `Declared Owner` = your taxpayer's full name; `Contact` = the mobile, masked except the last 4 digits (`*******4567`); `Address` `—`.
- Assessment table columns: `LOCATION / PIN / AREA / UNIT`, `ARPN / PREV ARPN`, `ASSESSED VALUE`, `BASIC (Principal, Penalty, Discount)`, `SEF (Principal, Penalty, Discount)`, `IDLE LAND TAX`, `TOTAL`, `TAX YEAR`, `FULL / QTR(S)`.
- Below: `TOTAL DUE` with the amount; `This Statement is valid until <last day of this month>`; `Last Payment: none on record.`; signature lines `OIC - Land Tax Division` and `City Treasurer`; button `Print`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Type | Pick `FEE` from the list. | (no message place under Type) |
| Due date | Required. A real calendar date written YYYY-MM-DD (a day that does not exist, or another order such as DD/MM/YYYY, is refused). A date in the past is allowed. | `must be a valid ISO date (YYYY-MM-DD)` |
| Reference, Amount (₱), Taxpayer | Same rules and messages as Card 05. | as Card 05 |

### 3. What must happen (functional validations)
- AC-1: A FEE bill with a due date in the past is created: result box `FEE bill <reference> for ₱<amount>.`
- AC-2: The bill keeps its base amount; the late interest is not added to the bill itself.
- AC-3: The Assessment page adds late interest: 2% of the amount for each month late; any part of a month counts as a month; at most 36 months; no surcharge (rule from the card's charter).
- AC-4: Card example: Amount `2500.00`, Due date `2026-09-30`, checked on Nov 3, 2026 → BASIC cell `₱2,500.00, ₱100.00, ₱0.00`, TOTAL `₱2,600.00`, TOTAL DUE `₱2,600.00`.
- AC-5: The Assessment row shows `<reference> / — / — / —`, SEF `—`, TAX YEAR `2026`, `FULL`.
- AC-6: An invalid date makes no bill and shows the due date message under Due date.

### 4. Where you check it (the validate story)
- Top bar › My data › `My bills`: row `Fee <reference>` | (empty cell) | `2500.00` | `OPEN` | `details`.
- `details`: `<8 characters> FEE — 2500.00 (OPEN)`; click `Assessment`.
- Assessment page: `Declared Owner` = your taxpayer; `TOTAL DUE` = today's total (₱2,600.00 for the card example in November 2026).
- Another name-tag sees `None yet.` under My bills.

### 5. Not on this screen
- API only: `due_date` (no screen shows the due date of a fee bill), `GET /api/v1/training/bills/{bill_id}` → `amount` `2500.00`, `status` `OPEN`; another user → 404 `{"detail":"Not Found"}`.
- Manual (needs judgment): the TOTAL DUE changes with today's month, so a check must use the class day's figure. Is a 2% monthly interest right for a fee? (ASK-6). The page puts fee interest under the column `BASIC (Principal, Penalty, Discount)`, a property-tax word: clear to a clerk?
- Open questions: the Assessment page opens with no name-tag at all (status 200 with no `X-User-ID`) and shows the owner's name (the mobile is masked). Anyone with the link can see it. Is that intended?

---

## Card 07 · TRN-04 · Create my teller and OR (Official Receipt) booklets (on the screen)

**Story.** As a cashier, I want my own teller with my own Official Receipt booklets, so that my receipts never use another teller's numbers.

**Where.** Home › Create my data › section "4 — Create my teller" › Create my teller. Then top bar › My data › My tellers.

**Before you start.** Nothing (only your name-tag in the top bar).

### 1. When the screen opens (upon page load)
- Section heading `4 — Create my teller`.
- `Display name` – text box, empty.
- `Create my teller` – button.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message under the field when broken |
|---|---|---|
| Display name | Required. 2 to 100 characters after the end spaces are removed (digits allowed). | `2-100 characters` |

### 3. What must happen (functional validations)
- AC-1: Click **Create my teller** with a good name: result box `Teller <first 8 characters of the teller id> created. AF 51 booklet: <start>–<end> · AF 56 booklet: <start>–<end>`.
- AC-2: Each booklet holds 50 numbers: end = start + 49.
- AC-3: The numbers come from the server; you never type them. They differ between runs and sites.
- AC-4: A new teller's booklets start after every booklet already given out (no number is shared with another teller).
- AC-5: The result box has a button `Open POS as this teller`.
- AC-6: A broken name rule makes no teller and shows `2-100 characters` under Display name.

### 4. Where you check it (the validate story)
- Top bar › My data › heading `My tellers`: table columns `Name` | `AF 51 booklet` | `AF 56 booklet` | (button column).
- Your row: `<display name>` | `<start>–<end>` | `<start>–<end>` | `Open POS as this teller`. The ranges match the result box.
- Your newest teller is the first row. (Collect at POS always opens the POS as this newest teller.)
- Another name-tag sees under My tellers: `None yet.`

### 5. Not on this screen
- API only: the full `teller_id`; `GET /api/v1/offline/block-status?teller_id=<id>` → for AF_51 and AF_56: `station_label` `TRAINING`, `consumed` 0, `remaining` 50, `next_available` = `serial_start`, `exhausted` false; another X-User-ID's `GET /api/v1/training/tellers` → `[]`.
- Manual (needs judgment): that two tellers never share numbers needs two tellers made one after the other (a classmate may take the numbers in between); a used-up booklet needs 50 receipts: don't do it on the shared site.
- Open questions: the AF 51 and AF 56 booklets of one teller carry the **same** numbers (on Nov 3 both were `111501–111550`). "Never overlap" holds per form type only. Is that intended?


---



**Read this first: amounts that depend on the date.** The Teller POS and the Assessment page price **today**. The amounts below are the **November 2026** ones. They change on the 1st of each month (Cards 08, 10, 13). Card 09 stays the same up to 2027-01-31. Cards 11, 12 and 14 do not change before their due date, 2026-12-31. The site uses the **UTC date**, which is 8 hours behind Manila. Between 00:00 and 08:00 Manila time the screens still show yesterday's date. For example, the Assessment page showed `Date 2026-11-03` at 00:45 on Nov 4 in Manila.

**Words used below.** "Line" means one part of a bill. A property tax bill has two lines: `RPT` (Basic tax) and `RPT_SEF` (SEF tax). A business or fee bill has one line. On My data, **details** opens the panel with one set of buttons per line: `Assessment`, `Collect at POS`, `Find in portal`. The first set is for the first line.

---

## Card 08 · RPT-02d · Full-year assessment of this year's tax (on the screen)

**Story.** As a treasury clerk, I want the full-year assessment of this year's tax, so that late quarters get interest and the last quarter gets its discount.

**Where.** Create: Home › Create my data › section "2 — Create a property tax bill" › Create property tax bill. Check: Home › See my data › My bills › details › Assessment (first one = RPT line; second one = RPT_SEF line). Full year on a chosen date: API only.

**Before you start.** A taxpayer of your own. Make one on Home › Create my data › section "1 — Create a taxpayer" › Create taxpayer, then click **Create a property tax bill for this taxpayer** (it picks the taxpayer in section 2 for you). Story values: RESIDENTIAL, assessed value 512000.00, tax year 2026, a new PIN.

### 1. When the screen opens (upon page load)
Training setup page (heading `Training setup`), section heading `2 — Create a property tax bill`:
- `Taxpayer (only yours are listed)`: list. Default `— pick a taxpayer —`. Each option reads `<Full name> (<mobile>)`, for example `Ana Dela Cruz (09080045317)`.
- `PIN (NNN-NN-NNN-NNN-NNN)`: text box, empty.
- `Property class`: list with `RESIDENTIAL`, `COMMERCIAL`, `AGRICULTURAL`, `INDUSTRIAL`. Default `RESIDENTIAL`.
- `Assessed value (₱)`: text box, empty.
- `Tax year`: text box, prefilled `2026`.
- Button `Create property tax bill`.

Assessment page (`/soa/<line id>`), one page per line:
- Note at the top: `REPLICA aligned to Tagaytay City's Statement of Account. …`; stamp `SPECIMEN — NOT AN OFFICIAL STATEMENT`.
- Headings: `Republic of the Philippines`, `CITY OF TAGAYTAY / PROVINCE OF CAVITE`, `Office of the City Treasurer`, `STATEMENT OF ACCOUNT`.
- Top table: `Acct No.` `—`, `SOA No.` `SOA-<YYYY>-<MM>-<first 8 characters of the line id, upper case>`, `Date` (today, Manila), `Declared Owner` (taxpayer name), `Contact` (mobile, masked except the last 4 digits), `Address` `—`.
- Line table columns: `LOCATION / PIN / AREA / UNIT`, `ARPN / PREV ARPN`, `ASSESSED VALUE`, `BASIC (Principal, Penalty, Discount)`, `SEF (Principal, Penalty, Discount)`, `IDLE LAND TAX`, `TOTAL`, `TAX YEAR`, `FULL / QTR(S)`.
- `TOTAL DUE` with the amount; `This Statement is valid until November 30, 2026`; `Last Payment: none on record.`; signature blocks `OIC - Land Tax Division` and `City Treasurer`; button `Print`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required; one of your own taxpayers | No message appears. The API answers 404 `Not Found`, and section 2 has no place to show it |
| PIN (NNN-NN-NNN-NNN-NNN) | Required; 3-2-3-3-3 digits with dashes | `must match NNN-NN-NNN-NNN-NNN` (under PIN) |
| PIN (NNN-NN-NNN-NNN-NNN) | One bill per PIN for the whole city (all students share it) | `already taken for this tenant` (under PIN) |
| Property class | One of the 4 in the list | (the list allows only these 4) |
| Assessed value (₱) | A positive amount, at most 2 decimals | `must be a positive amount with at most 2 decimals` |
| Assessed value (₱) | Greater than 0 | `must be greater than 0` |
| Assessed value (₱) | At most 999999999.99 | `must not exceed 999999999.99` |
| Tax year | A whole year from 2020 to 2031 | `must be 2020..2031` (under Tax year) |
| Tax year | Must be a number | No message appears. The API answers 422 with a list, and the screen does not show it |

The screen shows only one field message at a time. With several fields wrong, the PIN message came first (check on screen for the others).

### 3. What must happen (functional validations)
- AC-1 After Create, a box shows `Bill <PIN> created:` with the rows `RPT 7680.00` and `RPT_SEF 5120.00`.
- AC-2 RESIDENTIAL Basic tax is 1.5% of the assessed value; SEF is 1%.
- AC-3 The box has the buttons `See the assessment (what's due today)`, `Collect at the cashier (POS)` and `Find it in the citizen portal`.
- AC-4 The year is split into 4 quarters, each with its own due date: Mar 31, Jun 30, Sep 30, Dec 31.
- AC-5 A quarter paid after its due date gets 2% interest a month.
- AC-6 The months are counted from the quarter's first month to the payment month, both included.
- AC-7 Interest stops at 36 months (72%).
- AC-8 A quarter paid on or before its due date gets 10% off.
- AC-9 Basic and SEF are priced separately. Each has its own Assessment page.
- AC-10 RPT line Assessment page, November: BASIC `₱7,680.00, ₱921.60, ₱192.00`; TOTAL `₱8,409.60`; TOTAL DUE `₱8,409.60`.
- AC-11 RPT_SEF line Assessment page, November: SEF `₱5,120.00, ₱614.40, ₱128.00`; TOTAL DUE `₱5,606.40`.
- AC-12 Both Assessment pages show `TAX YEAR` `2026` and `FULL / QTR(S)` `FULL`.
- AC-13 The full year paid on 2026-10-19 costs 13824.00 (API).
- AC-14 The full year paid on 2026-11-03 costs 14016.00 (API). This is the sum of the two November screens.
- AC-15 Wrong tax years or dates are refused (API, section 5).

### 4. Where you check it (the validate story)
- Home › See my data › My bills: the row reads `RPT <PIN>` | `RESIDENTIAL 2026` | `512000.00` | `OPEN` | `details`. The amount column holds the **assessed value**, not the tax. The table has no column headings.
- details: `Receivables:` then `<8 characters> RPT — 7680.00 (OPEN)` and `<8 characters> RPT_SEF — 5120.00 (OPEN)`.
- First `Assessment` button: RPT page (AC-10). Second `Assessment` button: SEF page (AC-11).
- Another name-tag: their My bills shows `None yet.` and your bill does not appear.

### 5. Not on this screen
- **API only:** a chosen payment date (`GET /api/v1/rpt/assessment?pin=&tax_year=2026&payment_date=`); each quarter's `months_late`, `rate_bps` and interest; `discount_withheld_reason` (`null`); `mode` `CURRENT_YEAR`. Query rules and messages: `tax_year` not a year → 400 `tax_year must be a year or a comma-separated list of years`; outside 2000–2100 → 400 `tax_year out of range`; repeated → 400 `duplicate tax years`; no bill that year → 404 `no RPT receivables for that PIN and tax year`; `payment_date` not a real date or missing → 422 list with `loc` `["query","payment_date"]`.
- **Manual (needs judgment):** Is "Penalty" the right word for interest on the page? The `ASSESSED VALUE` column shows `—` even though the bill has one. The page top bar highlights `Citizen portal` as the current page.
- **Open questions:** The Assessment page opens for anyone who has its link. It needs no name-tag and shows the owner's name (the mobile is masked). Is that intended (see Card 20)?

---

## Card 09 · RPT-02c · Advance-payment discount on next year's tax (on the screen)

**Story.** As a treasury clerk, I want the assessment of next year's tax paid now, so that the 20% advance discount shows.

**Where.** Create: Home › Create my data › section "2 — Create a property tax bill" › Tax year `2027` › Create property tax bill. Check: Home › See my data › My bills › details › Assessment. Chosen date: API only.

**Before you start.** A taxpayer of your own (section 1 › Create taxpayer › **Create a property tax bill for this taxpayer**). Story values: RESIDENTIAL, assessed value 512000.00, tax year 2027, a new PIN.

### 1. When the screen opens (upon page load)
- Section 2 is the same as Card 08: `Taxpayer (only yours are listed)` (default `— pick a taxpayer —`), `PIN (NNN-NN-NNN-NNN-NNN)` (empty), `Property class` (default `RESIDENTIAL`), `Assessed value (₱)` (empty), `Tax year` (prefilled `2026`: change it to `2027`), button `Create property tax bill`.
- The Assessment page is laid out as in Card 08. `TAX YEAR` shows `2027`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required; one of yours | No message appears (API 404 `Not Found`) |
| PIN (NNN-NN-NNN-NNN-NNN) | Required; NNN-NN-NNN-NNN-NNN; one bill per PIN | `must match NNN-NN-NNN-NNN-NNN` / `already taken for this tenant` |
| Assessed value (₱) | Positive, at most 2 decimals, at most 999999999.99 | `must be a positive amount with at most 2 decimals` / `must be greater than 0` / `must not exceed 999999999.99` |
| Tax year | A whole year from 2020 to 2031 | `must be 2020..2031` |
| Tax year | Must be a number | No message appears (API 422 list) |

### 3. What must happen (functional validations)
- AC-1 After Create, the box shows `Bill <PIN> created:` with `RPT 7680.00` and `RPT_SEF 5120.00`.
- AC-2 Paying the whole of 2027 on or before 2027-01-31 gives 20% off Basic and 20% off SEF.
- AC-3 The two discounts are on separate lines.
- AC-4 RPT line Assessment page: BASIC `₱7,680.00, ₱0.00, ₱1,536.00`; TOTAL DUE `₱6,144.00`.
- AC-5 RPT_SEF line Assessment page: SEF `₱5,120.00, ₱0.00, ₱1,024.00`; TOTAL DUE `₱4,096.00`.
- AC-6 These amounts stay the same any day up to 2027-01-31.
- AC-7 On 2027-01-31 (the cutoff day) the 20% still applies: total 10240.00 (API).
- AC-8 From 2027-02-01 the 20% is gone. Each quarter is priced as in Card 08 (10% off before its own due date): total 11520.00 (API).
- AC-9 The 20% and the 10% never stack.

### 4. Where you check it (the validate story)
- Home › See my data › My bills: row `RPT <PIN>` | `RESIDENTIAL 2027` | `512000.00` | `OPEN` | `details`.
- details: `<8 characters> RPT — 7680.00 (OPEN)`, `<8 characters> RPT_SEF — 5120.00 (OPEN)`.
- First `Assessment`: AC-4. Second `Assessment`: AC-5.
- Another name-tag: `None yet.` in My bills.

### 5. Not on this screen
- **API only:** the advance answer (`mode` `ADVANCE`, `cutoff` `2027-01-31`, `discount_eligible` true, `discount_basic` 1536.00, `discount_sef` 1024.00, `net_basic` 6144.00, `net_sef` 4096.00, `total_due` 10240.00, `discount_withheld_reason` null). This answer has a different shape from Card 08's: it has `paid_on` instead of `payment_date`, and no `pin`, `quarters` or `totals`. Other API-only checks: the cutoff day and the day after; `tax_year` 2027,2027 → 400 `duplicate tax years`; 2027,2028 → 404 `no RPT receivables for that PIN and tax year`; 2101 → 400 `tax_year out of range`.
- **Manual (needs judgment):** The page says "Penalty" `₱0.00` with a discount. Is that clear to a taxpayer?
- **Open questions:** The rule "no 20% while an earlier year of the same PIN is unpaid" (`discount_withheld_reason`) cannot be set up on training data (ASK-D2b, ASK-12). The story says "From 2027-02-01 the discount is gone", but a 10% discount for each quarter remains (AC-8).

---

## Card 10 · RPT-01b · Late interest on last year's unpaid tax (on the screen)

**Story.** As a treasury clerk, I want the assessment of last year's unpaid tax, so that every quarter gets interest from its own start month.

**Where.** Create: Home › Create my data › section "2 — Create a property tax bill" › Tax year `2025` › Create property tax bill. Check: Home › See my data › My bills › details › Assessment. Chosen date: API only.

**Before you start.** A taxpayer of your own (section 1 › Create taxpayer › **Create a property tax bill for this taxpayer**). Story values: AGRICULTURAL, assessed value 400000.00, tax year 2025, a new PIN.

### 1. When the screen opens (upon page load)
- Section 2 is the same as Card 08. `Property class` defaults to `RESIDENTIAL` (pick `AGRICULTURAL`). `Tax year` is prefilled `2026` (change it to `2025`).
- The Assessment page is laid out as in Card 08. `TAX YEAR` shows `2025`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Taxpayer (only yours are listed) | Required; one of yours | No message appears (API 404 `Not Found`) |
| PIN (NNN-NN-NNN-NNN-NNN) | Required; NNN-NN-NNN-NNN-NNN; one bill per PIN | `must match NNN-NN-NNN-NNN-NNN` / `already taken for this tenant` |
| Property class | One of the 4 in the list | (the list allows only these 4) |
| Assessed value (₱) | Positive, at most 2 decimals, at most 999999999.99 | `must be a positive amount with at most 2 decimals` / `must be greater than 0` / `must not exceed 999999999.99` |
| Tax year | A whole year from 2020 to 2031 | `must be 2020..2031` |
| Tax year | Must be a number | No message appears (API 422 list) |

### 3. What must happen (functional validations)
- AC-1 After Create, the box shows `Bill <PIN> created:` with `RPT 6000.00` and `RPT_SEF 4000.00`.
- AC-2 AGRICULTURAL Basic tax is 1.5% of the assessed value; SEF is 1%.
- AC-3 Every quarter of 2025 is late.
- AC-4 Each quarter's interest counts from its own first month (Jan, Apr, Jul, Oct 2025) to the payment month, both included, at 2% a month.
- AC-5 Interest stops at 36 months (72%).
- AC-6 A late year gets no discount.
- AC-7 RPT line Assessment page, November: BASIC `₱6,000.00, ₱2,220.00, ₱0.00`; TOTAL DUE `₱8,220.00`.
- AC-8 RPT_SEF line Assessment page, November: SEF `₱4,000.00, ₱1,480.00, ₱0.00`; TOTAL DUE `₱5,480.00`.
- AC-9 The amounts grow on the 1st of each month until the 36-month cap.
- AC-10 Paid on 2026-10-19, the total is 13500.00 (API).
- AC-11 Paid on 2026-11-03, the total is 13700.00 (API). This is the sum of the two November screens.

### 4. Where you check it (the validate story)
- Home › See my data › My bills: row `RPT <PIN>` | `AGRICULTURAL 2025` | `400000.00` | `OPEN` | `details`.
- details: `<8 characters> RPT — 6000.00 (OPEN)`, `<8 characters> RPT_SEF — 4000.00 (OPEN)`.
- First `Assessment`: AC-7. Second `Assessment`: AC-8.
- Another name-tag: `None yet.` in My bills.

### 5. Not on this screen
- **API only:** quarter by quarter, `months_late` and `rate_bps` (for example, Q1 is 22 months on 2026-10-19 and 23 months on 2026-11-03); every quarter's `discount_basic`/`discount_sef` `0.00`. The 36-month cap shows only in the API: on a 2023 bill `months_late` keeps counting (47) but `rate_bps` stops at 7200. Query messages are as in Card 08.
- **Manual (needs judgment):** The page puts interest under "Penalty". The API calls this prior-year bill `mode` `CURRENT_YEAR`. Is that the right name?
- **Open questions:** None new. The 36-month cap needs a second bill with tax year 2023, which Training setup accepts (2020–2031).

---

## Card 11 · CSH-01 · Order of Payment priced today (on the screen)

**Story.** As a cashier, I want an Order of Payment for a bill, so that the POS (point of sale) knows what the taxpayer must pay today.

**Where.** Home › See my data › My bills › details › Collect at POS. The Teller POS opens with the Order of Payment loaded. **Do not tender.** Read the Assessment panel.

**Before you start.** Make these on Home › Create my data:
- A taxpayer (section 1).
- A BUSINESS bill (section 3: Type `BUSINESS`, Reference e.g. `CNN-TTTT-1`, Amount `2000.00`, Due date `2026-12-31`).
- Your teller (section "4 — Create my teller" › Create my teller). Collect at POS opens the POS as your **newest** teller.

### 1. When the screen opens (upon page load)
My data › My bills › details panel:
- `Receivables:` `<8 characters> BUSINESS — 2000.00 (OPEN)`.
- Buttons `Assessment`, `Collect at POS`, `Find in portal`.

Teller POS (after Collect at POS):
- Heading `Teller POS`; `TAGAYTAY`; `Teller: <first 8 characters of your teller ID>`; `F2 lookup · F8 tender · Enter submit`.
- `Order of Payment No.`: text box, filled with `OP-<YYYYMMDD>-<8 characters>` (placeholder `OP-YYYYMMDD-XXXXXXXX`). The date part is today's Manila date.
- Button `Load (Enter)`.
- Panel heading `Assessment`, with `Base`, `Interest (<n> months)`, `Discount`, `Surcharge`, `Total due today`, `Printed total`, `Delta`.
- Panel heading `Tender`, with `Type` (`Cash` / `Cheque`, default `Cash`), `Amount` (prefilled with Total due today), `OR serial` (empty, placeholder `auto`), `Payor` (`WALK-IN`), and button `Tender & Print (Enter)` (disabled until the bill lock is ready).

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Order of Payment No. | Must be an existing OP number | `Order of Payment not found.` |
| Order of Payment No. | Blank | Nothing happens (no message) |
| Order of Payment No. | The bill is locked by another teller | `Receivable already locked by another transaction.` (the panels disappear) |
| (Collect at POS) | The line must not be PAID | The button is hidden on a PAID line. If the OP cannot be made, a browser alert says `Could not create the Order of Payment (<status code>).` |

### 3. What must happen (functional validations)
- AC-1 Clicking Collect at POS makes a new Order of Payment for that line.
- AC-2 The POS opens as your newest teller, with the OP number filled in.
- AC-3 Loading the OP re-prices the bill with today's date.
- AC-4 Loading the OP locks the bill for 30 minutes for your teller.
- AC-5 `Tender & Print (Enter)` stays disabled until the lock is ready.
- AC-6 The panel shows `Base` `2000.00`.
- AC-7 The panel shows `Interest (0 months)` `0.00`.
- AC-8 The panel shows `Discount` `0.00` and `Surcharge` `0.00`.
- AC-9 The panel shows `Total due today` `2000.00` and `Printed total` `2000.00`.
- AC-10 The panel shows `Delta` `0.00`.
- AC-11 The warning `— penalties accrued since OP printing, teller must acknowledge` is hidden when no acknowledgement is needed.
- AC-12 `Amount` is prefilled with `2000.00`.
- AC-13 A second Collect at POS on the same bill by your same teller makes a new OP number and reuses your own lock. The panels load again.
- AC-14 A PAID line has no `Collect at POS` button.

AC-6 to AC-12 stay the same until the due date, 2026-12-31.

### 4. Where you check it (the validate story)
- On the POS itself: the `Assessment` panel (AC-6 to AC-11) and the header `Teller: …` (compare it with Home › See my data › My tellers, where your newest teller is listed first).
- The bill stays `OPEN` in My bills, because nothing was tendered.
- Another name-tag: their My bills shows `None yet.` and your bill does not appear.

### 5. Not on this screen
- **API only:** the OP answer (`op_id`, `op_number`, `printed_total` "2000.00"); the recompute fields (`months_delinquent` 0, `recomputed_total`, `delta`, `requires_acknowledgement` false, `discount_withheld_reason` null); the lock key `pos:<teller_id>:<op_number>`; recompute of an unknown OP → 404 `order of payment not found`; OP for a PAID line → 409 `receivable is PAID`; OP for an unknown line → 404 `receivable not found`.
- **Manual (needs judgment):** Is it clear which teller you are? The header shows only 8 characters, and My tellers shows the display name. Each click makes a new OP number: is that expected?
- **Open questions:** A non-zero Delta (the warning) needs an OP printed on an earlier day, so it cannot be made in class.

---

## Card 12 · CSH-01 · Full cash payment with an AF 51 receipt (on the screen)

**Story.** As a cashier, I want to take a full cash payment for a business bill, so that the taxpayer gets an AF 51 Official Receipt.

**Where.** Home › See my data › My bills › details › Collect at POS › Type `Cash` › Tender & Print (Enter). Then the POS button `Back to My data` › My receipts; My bills.

**Before you start.** A taxpayer (section 1). A BUSINESS bill (section 3: Reference e.g. `CNN-TTTT-1`, Amount `1850.00`, Due date `2026-12-31`). Your teller (section 4). Without a teller, the POS shows `You have no teller yet, so this payment would use the shared demo teller and its OR numbers, and the receipt would not show in My receipts.` and a button `Create my teller`.

### 1. When the screen opens (upon page load)
Teller POS after Collect at POS:
- Header `Teller POS`, `TAGAYTAY`, `Teller: <8 characters>`, `F2 lookup · F8 tender · Enter submit`.
- `Order of Payment No.` filled with `OP-…`; button `Load (Enter)`.
- `Assessment` panel: `Base` `1850.00`, `Interest (0 months)` `0.00`, `Discount` `0.00`, `Surcharge` `0.00`, `Total due today` `1850.00`, `Printed total` `1850.00`, `Delta` `0.00`.
- `Tender` panel: `Type` list (`Cash`, `Cheque`; default `Cash`); `Amount` prefilled `1850.00`; `OR serial` empty, placeholder `auto`; `Payor` `WALK-IN`; button `Tender & Print (Enter)` (disabled until the lock is ready).

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Type | `Cash` or `Cheque` (list) | (the list allows only these 2) |
| Amount | A peso amount | `tender.amount must be a peso amount, e.g. 10000.00` |
| Amount | Must equal the locked amount (Total due today) | `tender <typed> does not match locked amount 1850.00` (e.g. `tender 1800.00 does not match locked amount 1850.00`) |
| OR serial | Optional. Blank = the next number in your own AF 51 booklet | A number outside your booklet: `serial <n> is outside any active AF_51 block assigned to this teller` |
| Payor | Optional, default `WALK-IN` | (check on screen) |

Messages show in red next to the `Tender & Print (Enter)` button.

### 3. What must happen (functional validations)
- AC-1 A full cash tender shows a panel `Posted` with `Official Receipt issued.`
- AC-2 The `Posted` panel has the link `Open AF 51 print view`.
- AC-3 The `Posted` panel has the buttons `Print receipt`, `Request a void`, `Back to My data` and `Next transaction (F2)`.
- AC-4 The receipt is an AF 51 Official Receipt.
- AC-5 Its number is the first unused number of your own AF 51 booklet (your first receipt = your booklet start).
- AC-6 The bill turns PAID.
- AC-7 Tendering the same bill a second time is refused: `intent already settled — receipts are issued exactly once`.
- AC-8 A wrong amount is refused and no receipt is made.

The amounts on this card do not change before the due date, 2026-12-31.

### 4. Where you check it (the validate story)
- Back to My data › My receipts: row `AF_51-<serial, 7 digits>` | `WALK-IN` | `1850.00` | `ISSUED` | `details`. The serial is padded with zeros, for example `AF_51-0111501`.
- My receipts › details: `Issued <date and time>` (Manila time, in the form `2026-11-04 00:47`), buttons `Print receipt` and `Request a void`.
- My bills: row `Business <your reference>` | (empty) | `1850.00` | `PAID` | `details`.
- My bills › details: `<8 characters> BUSINESS — 1850.00 (PAID)`. Buttons `Assessment` and `Find in portal` show; `Collect at POS` does **not**.
- My bills › details › Assessment: TOTAL DUE `₱0.00`; `Last Payment: PIN: <your reference>, Yr & Term: 2026 / FULL, OR Number: <7-digit serial>, OR Date: <Manila date>, Amount: ₱1,850.00`.
- Another name-tag: their My receipts shows `None yet — collect a payment at the POS.`

### 5. Not on this screen
- **API only:** the receipt fields `form_type` "AF_51", `payment_mode` "CASH", line `account_code` "TBD-RCA-2015-009", `fund_code` "GENERAL_FUND", `amount_applied`, `subject_ref_id`; tender type other than CASH/CHECK → 400 `tender_type must be CASH or CHECK`; a lock older than 30 minutes → 409 `intent is EXPIRED`; OP on the paid line → 409 `receivable is PAID`.
- **Manual (needs judgment):** The print view layout. On the Assessment page, `Last Payment` labels the business reference as `PIN:`.
- **Open questions:** The `Tender` panel stays on the screen after posting. Is a second click expected to only show the 409 message?

---

## Card 13 · CSH-01 · Cash payment of the Basic tax line, AF 56 (on the screen)

**Story.** As a cashier, I want to take a cash payment for the Basic line of a property tax bill, so that the taxpayer gets an AF 56 receipt.

**Where.** Home › See my data › My bills › details › **first** `Collect at POS` (the RPT line) › Tender & Print (Enter). Then `Back to My data` › My receipts; My bills › details › Assessment.

**Before you start.** A taxpayer (section 1). A property tax bill (section 2: RESIDENTIAL, assessed value 200000.00, tax year 2026, a new PIN). Your teller (section 4).

### 1. When the screen opens (upon page load)
- My bills › details: `<8 characters> RPT — 3000.00 (OPEN)`, `<8 characters> RPT_SEF — 2000.00 (OPEN)`, then one set of buttons per line: `Assessment`, `Collect at POS`, `Find in portal` (RPT first, RPT_SEF second).
- Teller POS, `Assessment` panel for the RPT line only, November: `Base` `3000.00`, `Interest (11 months)` `360.00`, `Discount` `75.00`, `Surcharge` `0.00`, `Total due today` `3285.00`, `Printed total` `3285.00`, `Delta` `0.00`.
- `Tender` panel as in Card 12: `Type` `Cash`, `Amount` prefilled `3285.00`, `OR serial` placeholder `auto`, `Payor` `WALK-IN`, button `Tender & Print (Enter)`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Type | `Cash` or `Cheque` | (the list allows only these 2) |
| Amount | A peso amount equal to the locked amount (Total due today) | `tender <typed> does not match locked amount 3285.00` / `tender.amount must be a peso amount, e.g. 10000.00` |
| OR serial | Optional; blank = next number in your own AF 56 booklet | (check on screen) |
| Payor | Optional, default `WALK-IN` | (check on screen) |

### 3. What must happen (functional validations)
- AC-1 The first `Collect at POS` loads the RPT (Basic) line only.
- AC-2 A payment of only the RPT line is printed on an AF 56 receipt.
- AC-3 The `Posted` panel shows `Official Receipt issued.` and the link `Open AF 56 print view`.
- AC-4 The receipt number is the first unused number of your own AF 56 booklet.
- AC-5 The RPT line turns PAID.
- AC-6 The RPT_SEF line stays OPEN.
- AC-7 The bill stays OPEN in My bills until both lines are PAID.
- AC-8 The paid RPT line no longer has a `Collect at POS` button.
- AC-9 The SEF line can still be collected on its own.

The November amounts are AC-1's panel above. In October it was 10 months, `315.00`, `3240.00`.

### 4. Where you check it (the validate story)
- My receipts: row `AF_56-<serial, 7 digits>` | `WALK-IN` | `3285.00` | `ISSUED` | `details`.
- My bills: row `RPT <PIN>` | `RESIDENTIAL 2026` | `200000.00` | `OPEN` | `details`.
- My bills › details: `<8 characters> RPT — 3000.00 (PAID)`, `<8 characters> RPT_SEF — 2000.00 (OPEN)`. The RPT button set shows only `Assessment` and `Find in portal`, so the **first** `Collect at POS` on the page is now the SEF line.
- First `Assessment` (RPT line): BASIC `₱3,000.00, ₱0.00, ₱0.00`, TOTAL `₱0.00`, TOTAL DUE `₱0.00`; `Last Payment: PIN: <PIN>, Yr & Term: 2026 / FULL, OR Number: <7-digit serial>, OR Date: <Manila date>, Amount: ₱3,285.00`.
- Second `Assessment` (SEF line), November: SEF `₱2,000.00, ₱240.00, ₱50.00`, TOTAL DUE `₱2,190.00`, `Last Payment: none on record.`
- Another name-tag: their My receipts shows `None yet — collect a payment at the POS.`

### 5. Not on this screen
- **API only:** `form_type` "AF_56", `serial_number` = your `af56_block.start`, line `receivable_type` "RPT"; status of each line from `GET /api/v1/training/rpt-bills/{bill_id}`; locking the paid RPT line again with a new key → 409 `receivable <id> is already PAID`; OP on it → 409 `receivable is PAID`.
- **Manual (needs judgment):** The panel says `Interest (11 months)`, but the 360.00 covers Q1, Q2 and Q3 (11, 8 and 5 months): only Q1's count shows. After payment, the RPT Assessment page still shows the principal `₱3,000.00` with TOTAL `₱0.00`.
- **Open questions:** Can one receipt cover both the Basic and SEF lines? A used-up AF 56 booklet (50 receipts) cannot be tried in class.

---

## Card 14 · CSH-01 · Cheque payment held until it clears (on the screen)

**Story.** As a cashier, I want to accept a cheque, so that the receipt is held until the bank clears it.

**Where.** Home › See my data › My bills › details › Collect at POS › Type `Cheque` › Cheque No. › Bank › Tender & Print (Enter). Clearing: API only (`POST /api/v1/receipts/{receipt_id}/clear-cheque`). Then Home › See my data › My receipts; My bills.

**Before you start.** A taxpayer (section 1). A FEE bill (section 3: Type `FEE`, Reference e.g. `CNN-TTTT-1`, Amount `750.00`, Due date `2026-12-31`). Your teller (section 4).

### 1. When the screen opens (upon page load)
- Teller POS `Assessment` panel: `Base` `750.00`, `Interest (0 months)` `0.00`, `Discount` `0.00`, `Surcharge` `0.00`, `Total due today` `750.00`, `Printed total` `750.00`, `Delta` `0.00`.
- `Tender` panel: `Type` (default `Cash`), `Amount` prefilled `750.00`, `OR serial` (placeholder `auto`), `Payor` `WALK-IN`, button `Tender & Print (Enter)`.
- `Cheque No.` and `Bank` (both empty) show **only** when Type is `Cheque`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Type | `Cash` or `Cheque` | (the list allows only these 2) |
| Cheque No. | Required for a cheque | `cheque_number is required for CHECK tenders` |
| Bank | Optional text | (none) |
| Amount | Must equal the locked amount | `tender <typed> does not match locked amount 750.00` |
| OR serial | Optional; blank = next number in your own AF 51 booklet | `serial <n> is outside any active AF_51 block assigned to this teller` |

### 3. What must happen (functional validations)
- AC-1 A cheque tender posts a receipt with status ON_HOLD.
- AC-2 The `Posted` panel shows `Official Receipt issued.` and `Open AF 51 print view`, even though the receipt is on hold.
- AC-3 The receipt keeps the cheque number and bank.
- AC-4 The bill stays OPEN while the cheque is held.
- AC-5 A second tender on the held cheque is refused: `intent has a cheque on hold (OR <serial>) — clear or void it first`.
- AC-6 After bank clearing, the receipt turns ISSUED.
- AC-7 After bank clearing, the bill turns PAID.
- AC-8 Clearing the same cheque twice is refused.

The amounts on this card do not change before the due date, 2026-12-31.

### 4. Where you check it (the validate story)
- Before clearing, My receipts: row `AF_51-<serial, 7 digits>` | `WALK-IN` | `750.00` | `ON_HOLD` | `details`. details has `Print receipt` and `Request a void`.
- Before clearing, My bills: row `Fee <your reference>` | (empty) | `750.00` | `OPEN`; details `<8 characters> FEE — 750.00 (OPEN)`, and `Collect at POS` still shows. Assessment TOTAL DUE `₱750.00`, `Last Payment: none on record.`
- After clearing (API), reload My data: the receipt row shows `ISSUED`; the bill row shows `PAID` and `Collect at POS` is gone.
- Print view (`Print receipt`): `OFFICIAL RECEIPT (AF 51)`, `Payment Type` `CHECK`, `Bank` `<your bank>`, `Check No.` `<your number>`, `Status` `ISSUED` after clearing (before clearing: check on screen).
- Another name-tag: their My receipts shows `None yet — collect a payment at the POS.`

### 5. Not on this screen
- **API only:** clearing (`POST /api/v1/receipts/{receipt_id}/clear-cheque`, no body → 200 `status` "ISSUED"); clear twice → 409 `receipt is ISSUED / CHECK — nothing to clear`; clear a cash receipt → 409 `receipt is ISSUED / CASH — nothing to clear`; unknown receipt → 404 `receipt not found`; a new lock on the held bill → 409 `receivable <id> already locked by intent <id> …`; the receipt fields `payment_mode` "CHECK", `cheque_number`, `cheque_bank`; the FEE line's `fund_code` "TRUST_FUND".
- **Manual (needs judgment):** The POS says `Official Receipt issued.` for a cheque that is only on hold. Will a cashier hand it over as a final receipt? The labels are spelled `Cheque No.` on the POS but `Check No.` on the print view.
- **Open questions:** There is no screen for bank clearing. A bounced cheque (void of an ON_HOLD receipt) belongs to Card 16.


---



**Dates.** Every date and time on the screens is Manila time: the Order of Payment number, "Issued" in My receipts, and "Date" on the receipt print view (fixed on staging Nov 4, 01:24 Manila). The portal and POS amounts follow today's date. Each card says which amounts do.

**Money.** The POS, Training setup and My data show plain numbers (`3000.00`). The portal and the receipt print view show pesos (`₱2,737.50`). The Training setup result box for a bill shows `₱` plus the plain number (`₱999.00`).

---

## Card 15 · CSH-04 · Close my shift with a Teller RCD (on the screen)

**Story.** As a cashier, I want to close my shift with a Report of Collections and Deposits (RCD), so that my declared cash matches my receipts.

**Where.** No screen has the RCD. On the screen you can do the payment and see the receipt the RCD counts:
Home › See my data › My bills › `details` › Collect at POS › Tender & Print (Enter) › Back to My data › My receipts › `details`.
The RCD itself is API only (`POST /api/v1/shift-close/teller-rcd`).

**Before you start.** On Training setup (Home › Create my data):
1. Section "1 — Create a taxpayer" › Create taxpayer.
2. In the result box, click "Create a business tax or fee bill". Section 3: Type BUSINESS, Amount 3000.00, Due date 2026-12-31 › Create bill.
3. Section "4 — Create my teller" › Display name › Create my teller.

### 1. When the screen opens (upon page load)
**Teller POS** (opened by Collect at POS):
- Heading "Teller POS". Next to it: `TAGAYTAY`, `Teller: <first 8 characters of your newest teller ID>`, and the hint "F2 lookup · F8 tender · Enter submit".
- Field "Order of Payment No." is already filled with the new OP number `OP-<YYYYMMDD>-<8 characters>`. The date part is today's Manila date. Next to it: button "Load (Enter)".
- Panel "Assessment" shows these rows in order: Base `3000.00`, Interest (0 months) `0.00`, Discount `0.00`, Surcharge `0.00`, **Total due today** `3000.00`, Printed total `3000.00`, Delta `0.00`. These amounts stay the same until the due date (2026-12-31).
- Panel "Tender":
  - Type: a list, Cash by default; the options are Cash and Cheque.
  - Amount: filled with `3000.00`.
  - OR serial: blank, placeholder "auto".
  - Payor: `WALK-IN`.
  - Button "Tender & Print (Enter)". It stays disabled until the bill lock is ready.
- If you have no teller: "You have no teller yet, so this payment would use the shared demo teller and its OR numbers, and the receipt would not show in My receipts." with a button "Create my teller".

**My data › My receipts** (after the payment):
- A row with 5 cells: `AF_51-<serial, 7 digits>` | `WALK-IN` | `3000.00` | `ISSUED` | `details`.
- `details` opens: `Issued <date and time, Manila, e.g. 2026-11-04 00:46>`, button "Print receipt", button "Request a void".

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Order of Payment No. | must be an existing OP | "Order of Payment not found." |
| Order of Payment No. | the bill must not be locked by another teller | "Receivable already locked by another transaction." |
| Type | Cash or Cheque (list only) | — |
| Amount | must equal the locked amount (3000.00) | `tender <amount> does not match locked amount 3000.00` |
| Amount | a peso amount | "tender.amount must be a peso amount, e.g. 10000.00" (from the Card 12 charter; check on screen) |
| OR serial | optional; blank = the next number in your own AF 51 booklet | `serial <n> is outside any active AF_51 block assigned to this teller` |
| Payor | optional; default `WALK-IN` | — |

### 3. What must happen (functional validations)
- AC-1 Collect at POS opens the POS as your newest teller, with the OP already loaded.
- AC-2 Total due today is 3000.00 and Delta is 0.00.
- AC-3 Tender & Print (Enter) shows the panel "Posted" with "Official Receipt issued." and the link "Open AF 51 print view".
- AC-4 The Posted panel has these buttons: Print receipt, Request a void, Back to My data, Next transaction (F2).
- AC-5 The receipt number is the next free number in your teller's AF 51 booklet.
- AC-6 My receipts shows the receipt as ISSUED for 3000.00.
- AC-7 My bills shows the bill as PAID, and "Collect at POS" no longer shows for it.
- AC-8 The date part of "Issued" (Manila) is the `shift_date` the RCD needs.

### 4. Where you check it (the validate story)
- Home › See my data › My receipts: row `AF_51-<serial>` | `WALK-IN` | `3000.00` | `ISSUED`. Click `details` to see "Issued …".
- Home › See my data › My bills: row `Business <reference>` | (blank) | `3000.00` | `PAID`.
- Print receipt (it opens in a new tab): "OFFICIAL RECEIPT (AF 51)", "SPECIMEN — NOT AN OFFICIAL RECEIPT", `Date <Manila date>`, `O.R. No. <7 digits>`, `Received from WALK-IN`, `Total Tax Due / Amount Received ₱3,000.00`, `Payment Type CASH`, `Status ISSUED`.
- Another name-tag sees "None yet — collect a payment at the POS." under My receipts.

### 5. Not on this screen
- **API only (the whole RCD).**
  - `POST /api/v1/shift-close/teller-rcd` takes `teller_id`, `shift_date` (YYYY-MM-DD), `cash_declared`, `cheque_declared` and an optional `variance_reason`.
  - The answer holds cash_expected, cheque_expected, cash_variance, cheque_variance, or_count, void_count, serial_first, serial_last, `rcd_number` `RCD-<shift_date>-<8 characters>`, and status READY or OPEN.
  - Only one RCD per teller per date: a second one gets 409 `teller RCD already exists for <date>`.
  - Expected cash counts only your ISSUED cash receipts on that date. Voided receipts count only in `void_count`.
  - A bad date gets 422 "Value error, must be a date in YYYY-MM-DD form, e.g. 2026-10-28". A bad amount gets 422 "Value error, must be a peso amount, e.g. 10000.00". An unknown RCD gets 404 `teller RCD not found`. (All three re-checked Nov 4.)
  - Reading it back: `GET /api/v1/shift-close/teller-rcd/{rcd_id}`.
- **Not visible anywhere on the screen.** The full `teller_id` (the POS shows 8 characters; My tellers shows only the name and booklets) and the `receipt_id`. Get them from `GET /api/v1/training/tellers` or `GET /api/v1/training/receipts`.
- **Manual (needs judgment).** The print view layout.
- **Open questions.**
  - The charter says "Upon page load: ASK: no screen". No RCD screen exists.
  - Fixed on staging Nov 4: an unknown teller_id gets 404 `{"detail":"teller not found"}`; a negative cash_declared or cheque_declared gets 422 `must not be negative (0.00 when nothing was collected)`; 0.00 is accepted. Ignore `RCD-2026-11-04-981F66D3` (a trainer check on the seeded teller) if you see it.

---

## Card 16 · CSH-05 · Void a receipt with Treasurer approval (on the screen)

**Story.** As a cashier, I want to request a void of a receipt, so that the treasurer can reverse a payment I took by mistake.

**Where.** Three places:
- From My data: Home › See my data › My receipts › `details` › Request a void.
- On the POS, right after a payment: Request a void › "Reason for the void" › Send void request.
- Your approver: Home › Create my data › section "5 — Create my approver" › Create my approver › Copy.

There is no approve screen. You approve or reject in the top bar's API docs. Then check Home › See my data › My receipts and My bills.

**Before you start.**
- A taxpayer (section 1), a BUSINESS bill of 1200.00 due 2026-12-31 (section 3) and your teller (section 4).
- One cash payment: My bills › `details` › Collect at POS › Tender & Print (Enter).
- Your approver (section 5).

### 1. When the screen opens (upon page load)
**My data › My receipts**
- Row: `AF_51-<serial, 7 digits>` | `WALK-IN` | `1200.00` | `ISSUED` | `details`.
- `details` shows: `Issued <date and time, Manila>`, button "Print receipt", button "Request a void". "Request a void" shows only when the status is ISSUED or ON_HOLD.

**Teller POS, panel "Posted"** (right after a payment)
- "Official Receipt issued." with the link "Open AF 51 print view".
- Buttons: Print receipt, Request a void, Back to My data, Next transaction (F2).
- After you click Request a void, a row appears: field "Reason for the void" (blank), button "Send void request".

**Training setup › section "5 — Create my approver"**
- Hint: "Your own City Treasurer for approving or rejecting void requests on receipts your tellers issued. One per student — clicking again shows the one you have."
- Field "Display name (optional)", blank.
- Button "Create my approver".

**My data › My approver**
- Table Name | Approver ID, with a Copy button on each row.
- With no approver yet: "None yet — create one in Training setup (step 5)."

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Reason for the void (POS) | required, not blank (spaces only count as blank) | "A reason is required." |
| Request a void (My data) | no field: the screen sends the reason "training — requested by <your name>" (the name part only, without the tag) and the receipt's teller | — |
| Display name (optional) (section 5) | blank = "<your name-tag> Treasurer"; otherwise 2–60 characters | "2-60 characters" (re-checked Nov 4 with "A") |

### 3. What must happen (functional validations)
- AC-1 Request a void (My data) shows "Void requested — waiting for treasurer approval."
- AC-2 Send void request (POS) shows "Void requested — waiting for treasurer approval.", and the "Request a void" button goes away.
- AC-3 A second request on the same receipt while one is pending shows "a void request is already PENDING for this receipt".
- AC-4 After the request, the receipt row still says ISSUED. The status changes only after approval.
- AC-5 Create my approver the first time shows "Approver <your name-tag> Treasurer created." with "Approver ID: <id>" and a Copy button.
- AC-6 Create my approver again shows "(you already had this one)." with the same Approver ID.
- AC-7 Copy shows "Copied." If the browser can't copy, it shows "Select the ID and copy it."
- AC-8 After your approver approves, My receipts shows the receipt as VOIDED, and "Request a void" no longer shows for it.
- AC-9 After the approval, My bills shows the bill as OPEN again, and "Collect at POS" shows again.
- AC-10 After a reject, the receipt stays ISSUED, and a new void request is allowed.

### 4. Where you check it (the validate story)
- Home › See my data › My receipts: row `AF_51-<serial>` | `WALK-IN` | `1200.00` | `VOIDED`.
- Home › See my data › My bills: row `Business <reference>` | (blank) | `1200.00` | `OPEN`.
- Print receipt: `Status VOIDED` (checked Nov 4 after an approval).
- Home › See my data › My approver: your approver's name and ID, with Copy.
- Another name-tag sees "None yet — collect a payment at the POS." under My receipts and "None yet — create one in Training setup (step 5)." under My approver.

### 5. Not on this screen
- **API only.**
  - Approve or reject: `POST /api/v1/receipts/{receipt_id}/void-requests/{void_request_id}/approve` (or `/reject`) with `{"approver_id":"<yours>"}`. Approving returns status VOIDED and `reversals` `amount_restored` "1200.00".
  - The `void_request_id` never shows on the screen. Request the void in API docs to get it.
  - The `receipt_id` and `teller_id` are not on the screen either: `GET /api/v1/training/receipts`.
  - The PENDING status of a request shows only in the API answer.
  - API messages: blank reason gets 400 `a void reason is required`. A teller as approver gets 403 `only the City_Treasurer can approve a void`. Approving again gets 409 `receipt is already VOIDED`. An unknown request gets 404 `void request not found`.
- **Manual (needs judgment).**
  - The "Void requested …" note lives only in the page. After a reload it is gone, and the row still says ISSUED. Is that clear enough for a cashier?
  - The My data button sends a fixed reason. The cashier cannot type one there.
- **Open questions.** The section 5 message uses a hyphen, "2-60 characters". The name dialog (Card 20) uses an en dash and a full stop, "2–60 characters.".

---

## Card 17 · CSH-04 · Explain a cash shortage in my RCD (on the screen)

**Story.** As a cashier, I want to close my shift with less cash than my receipts, so that the shortage is recorded.

**Where.** No screen has the RCD or the explanation. On the screen you can do the payment and see the receipt:
Home › See my data › My bills › `details` › Collect at POS › Tender & Print (Enter) › Back to My data › My receipts › `details`.
The RCD and the explanation are API only.

**Before you start.** On Training setup (Home › Create my data):
1. Section 1: a taxpayer › Create taxpayer.
2. "Create a business tax or fee bill" › section 3: **Type FEE**, Amount 500.00, Due date 2026-12-31 › Create bill.
3. Section 4: Create my teller.

### 1. When the screen opens (upon page load)
**Teller POS** (opened by Collect at POS):
- Heading "Teller POS", `TAGAYTAY`, `Teller: <8 characters>`, "F2 lookup · F8 tender · Enter submit".
- "Order of Payment No." filled with `OP-<YYYYMMDD>-<8 characters>` (today's Manila date). Button "Load (Enter)".
- Panel "Assessment": Base `500.00`, Interest (0 months) `0.00`, Discount `0.00`, Surcharge `0.00`, **Total due today** `500.00`, Printed total `500.00`, Delta `0.00`. These amounts stay the same until the due date (2026-12-31).
- Panel "Tender": Type Cash (options Cash, Cheque), Amount `500.00`, OR serial blank (placeholder "auto"), Payor `WALK-IN`, button "Tender & Print (Enter)" (disabled until the lock is ready).

**My data › My receipts** (after the payment):
- Row `AF_51-<serial>` | `WALK-IN` | `500.00` | `ISSUED` | `details`. `details` shows `Issued <date and time, Manila>`.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Amount | must equal the locked amount (500.00) | `tender <amount> does not match locked amount 500.00` |
| OR serial | optional; blank = next in your AF 51 booklet | `serial <n> is outside any active AF_51 block assigned to this teller` |
| Order of Payment No. | must exist | "Order of Payment not found." |

On the screen the POS always takes the full amount. You can't make a shortage on the screen: the shortage is the declared cash in the RCD (API).

### 3. What must happen (functional validations)
- AC-1 Tender & Print (Enter) shows "Official Receipt issued." and "Open AF 51 print view".
- AC-2 My receipts shows the receipt as ISSUED for 500.00.
- AC-3 My bills shows the row `Fee <reference>` with status PAID.
- AC-4 The date part of "Issued" (Manila) is the `shift_date` the RCD needs.

### 4. Where you check it (the validate story)
- Home › See my data › My receipts: row `AF_51-<serial>` | `WALK-IN` | `500.00` | `ISSUED`.
- Home › See my data › My bills: row `Fee <reference>` | (blank) | `500.00` | `PAID`.
- Another name-tag sees "None yet — collect a payment at the POS." under My receipts.

### 5. Not on this screen
- **API only (the shortage).**
  - Create the RCD with `cash_declared` "450.00". The answer has cash_expected "500.00", cash_variance "-50.00" (declared minus expected), status OPEN and variance_reason null.
  - Explain it: `POST …/teller-rcd/{rcd_id}/explain` `{"variance_reason":"…"}` → READY. cash_variance stays "-50.00".
  - Explaining again gets 409 `teller RCD is READY — nothing to explain`.
  - An empty reason gets 422 with loc `["body","variance_reason"]` and type `string_too_short` (re-checked Nov 4: msg "String should have at least 1 character").
  - More cash than expected with a reason at create → READY, cash_variance "50.00".
  - Reading it back: `GET /api/v1/shift-close/teller-rcd/{rcd_id}`.
- **Not visible on the screen.** The full teller_id and the receipt_id: `GET /api/v1/training/tellers`, `GET /api/v1/training/receipts`.
- **Manual (needs judgment).** Whether a supervisor would find the shortage anywhere: no screen lists RCDs.
- **Open questions.** The charter says "Upon page load: ASK: no screen". No RCD screen exists.

---

## Card 18 · CSH-06a · Portal lookup shows a masked name (on the screen)

**Story.** As a taxpayer, I want to look up my balance with my PIN (Property Index Number) and mobile, so that I see what I owe without showing my full name.

**Where.** Home › Create my data › section "1 — Create a taxpayer" › Create taxpayer › Create a property tax bill for this taxpayer › section 2 › Create property tax bill › Find it in the citizen portal › Tax Declaration / PIN › Registered mobile › Look up.
Or Home › Open portal.

**Before you start.**
- Section 1: Full name "Maria Santos", a made-up mobile 09 + 9 digits › Create taxpayer.
- Section 2 (taxpayer already picked by the button): PIN, Property class RESIDENTIAL, Assessed value (₱) 100000.00, Tax year 2026 › Create property tax bill.

### 1. When the screen opens (upon page load)
**Training setup, section 2, after Create property tax bill:**
- Result box "Bill <PIN> created:" with 2 rows: `RPT` `1500.00`, `RPT_SEF` `1000.00`.
- Buttons: "See the assessment (what's due today)", "Collect at the cashier (POS)", "Find it in the citizen portal".

**Citizen portal:**
- Banner "TRAINING — made-up data only". Heading "City of Tagaytay — Online Payment" with `TAGAYTAY`.
- Panel "Look up your balance": field "Tax Declaration / PIN" (blank), field "Registered mobile" (blank), button "Look up".
- "Find it in the citizen portal" opens the portal with both fields blank. You type the PIN and mobile yourself.

**After Look up:**
- Panel "Taxpayer Account Details": `Name: M**** S*****`.
- Text: "To see your full name on this record, prove it's you — we'll email a one-time code to the email address on file." Button "Email me a verification code".
- Table Type | Period | Due date | Balance today:
  - `RPT` | `2026` | `2026-12-31` | `₱1,642.50`
  - `RPT_SEF` | `2026` | `2026-12-31` | `₱1,095.00`
- Footer `TOTAL DUE TODAY` `₱2,737.50`.
- Button "Pay via Landbank Link.Biz". **Never click it.**
- The three balances depend on today's date. The figures above are from Nov 4, 2026 (the card says Nov 3–6; ₱2,700.00 in October).

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Tax Declaration / PIN | required; must match a PIN with an open bill | "No outstanding record found for those details." |
| Registered mobile | required; must match exactly as stored (09…) | "No outstanding record found for those details." |
| Registered mobile | the +639… form is not matched | "No outstanding record found for those details." |
| Both blank | — | "No outstanding record found for those details." (the API gives 404 for blank values, checked Nov 4) |

### 3. What must happen (functional validations)
- AC-1 The right PIN and mobile show "Taxpayer Account Details".
- AC-2 The name shows masked: each word keeps its first letter and the rest become `*` → `M**** S*****`.
- AC-3 The full name "Maria Santos" shows nowhere on the page before the code is verified.
- AC-4 The table has 2 rows, RPT and RPT_SEF, Period 2026, Due date 2026-12-31.
- AC-5 TOTAL DUE TODAY equals the sum of the two "Balance today" amounts.
- AC-6 A wrong mobile shows "No outstanding record found for those details."
- AC-7 A wrong PIN shows the very same text.
- AC-8 Money shows as pesos with a comma and 2 decimals (`₱2,737.50`).

### 4. Where you check it (the validate story)
- Home › Open portal › Tax Declaration / PIN › Registered mobile › Look up: `Name: M**** S*****`, and `TOTAL DUE TODAY ₱2,737.50` (Nov 4).
- Home › See my data › My bills:
  - Row `RPT <PIN>` | `RESIDENTIAL 2026` | `100000.00` | `OPEN`. The amount cell is the assessed value.
  - `details` shows `RPT — 1500.00 (OPEN)` and `RPT_SEF — 1000.00 (OPEN)`, and each line has the buttons Assessment, Collect at POS and Find in portal.
- Another name-tag: the portal still finds the bill with the same PIN and mobile, because the portal is not tied to a name-tag. My bills is empty for that name-tag ("None yet.").

### 5. Not on this screen
- **API only.**
  - `GET /api/v1/portal/lookup` returns `masked_name` and no `full_name`.
  - No X-Tenant-ID gets 400 `missing X-Tenant-ID header`.
  - A made-up token gets 401 `session expired; verify your identity again`. On the screen this shows only as "Your verified session expired; please verify again." after a verified session ends.
- **Manual (needs judgment).** Does the masked name still let a taxpayer recognize their own record? The layout of the result.
- **Do not touch.** "Pay via Landbank Link.Biz" locks the bill for 30 minutes (known label issue).
- **Open questions.** None new.

---

## Card 19 · CSH-06b · Emailed code unlocks my full name (on the screen)

**Story.** As a taxpayer, I want a one-time code emailed to me, so that I can prove who I am on the portal.

**Where.** Home › Create my data › section 1 (Email = your **real** email) › Create taxpayer › Create a property tax bill for this taxpayer › section 2 › Create property tax bill › Find it in the citizen portal › Tax Declaration / PIN › Registered mobile › Look up › Email me a verification code › open your email › 6-digit code › Verify.

**Before you start.**
- Taxpayer 1: section 1 with Full name, a made-up mobile and your real email. Then section 2: RESIDENTIAL, Assessed value (₱) 120000.00, Tax year 2026.
- Taxpayer 2: Email blank, with its own bill (for the "no email" rule).

### 1. When the screen opens (upon page load)
**Training setup, section 1:**
- Fields: "Full name" (blank), "Mobile (09XXXXXXXXX)" (blank), "Email (optional)" (blank). Button "Create taxpayer".
- Result: "<full name> created — mobile <mobile>." with buttons "Create a property tax bill for this taxpayer" and "Create a business tax or fee bill".

**Training setup, section 2:**
- "Taxpayer (only yours are listed)": a list, first option "— pick a taxpayer —".
- "PIN (NNN-NN-NNN-NNN-NNN)" (blank).
- "Property class": a list, RESIDENTIAL by default; the options are RESIDENTIAL, COMMERCIAL, AGRICULTURAL, INDUSTRIAL.
- "Assessed value (₱)" (blank).
- "Tax year": `2026`.
- Button "Create property tax bill". After it: "Find it in the citizen portal".

**Portal, after Look up:**
- `Name: <masked name>` (e.g. `A** D*** C***` for "Ana Dela Cruz").
- Text "To see your full name on this record, prove it's you — we'll email a one-time code to the email address on file."
- Button "Email me a verification code".
- The balance table and "TOTAL DUE TODAY" (amounts depend on today's date).

**After Email me a verification code:**
- The button text changes to "Code sent — enter it below", and the button is disabled.
- Text "We sent a code to <masked email>. It expires in 10 minutes."
- Field with placeholder "6-digit code" (at most 6 characters can be typed). Button "Verify".

**After Verify with the right code:**
- `Name: <full name>` with "✓ identity verified".
- The verification text, the button and the code field are gone.

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Email (optional) (section 1) | optional; an address like x@y.z | "invalid email format" (from Card 02's charter) |
| Email me a verification code | the record must have an email on file | "We have no email address on file for this record. Please visit the City Treasurer's Office." (re-checked Nov 4) |
| Email me a verification code | uses the PIN and mobile in the fields now; they must match | "no outstanding record found for those details" (lower case, no full stop: the API text) |
| Email me a verification code | a new code only after 60 seconds (only possible after another Look up) | `verification code already sent; retry in <n>s` |
| Email me a verification code | at most 3 codes per taxpayer per hour | "too many verification codes sent; try again later" |
| 6-digit code | the code from the email | "incorrect code" |
| 6-digit code | 4 to 10 characters on the API; the field stops at 6 | the API answers 422 with a list. The screen likely shows "[object Object]" (check on screen) |
| 6-digit code | the code lives 10 minutes | "challenge expired; request a new code" |
| 6-digit code | 5 wrong codes lock it | "challenge locked after too many failed attempts" |

### 3. What must happen (functional validations)
- AC-1 Email me a verification code sends one code to the email on file.
- AC-2 The screen shows the masked email, not the full address.
- AC-3 The email comes from "City Treasury Training (staging)" (from the card; check in your inbox).
- AC-4 The right code shows the full name and "✓ identity verified".
- AC-5 A wrong code keeps the masked name and shows "incorrect code".
- AC-6 A record with no email shows the "We have no email address on file …" message, and no code is sent.
- AC-7 A verified session lasts 30 minutes. After that, Look up shows "Your verified session expired; please verify again."

### 4. Where you check it (the validate story)
- Portal › Look up › Email me a verification code › code › Verify: `Name:` with the full name and "✓ identity verified".
- Look up again within 30 minutes on the same page: still the full name (the page keeps the token).
- Reload the page and Look up: the masked name again (the token is lost on reload).
- Home › See my data › My taxpayers: row `<full name>` | `<mobile>` | `<your email>`. Taxpayer 2 shows `—` in Email.

### 5. Not on this screen
- **API only.**
  - The `challenge_id`, `expires_at` and token never show on the screen.
  - `GET /api/v1/portal/lookup?…&token=` gives `full_name` and `"identity_verified":true`.
  - Verifying a used code gets 409 `challenge already verified`. On the screen the code field is gone after success, so you can't send it again there.
  - An unknown challenge gets 404 `challenge not found` (re-checked Nov 4).
  - A code longer than 10 characters gets 422 `string_too_long`. The screen field stops at 6.
- **Manual (needs judgment).**
  - Reading the email and typing the code: a script cannot read your inbox.
  - The limits (60 s, 3 an hour, 5 wrong codes) use up codes. Do them once, at the end.
- **Open questions.**
  - A code shorter than 4 characters, or an empty one, gets a 422 list from the API (checked Nov 4: "String should have at least 4 characters"). The page puts that list straight into the text, so it likely shows "[object Object]". Check on screen.
  - The page has a "DEMO ONLY (otp_dev_reveal flag): your code is …" line. It should not appear on staging (check on screen).
  - Changing the mobile after Look up and then clicking "Email me a verification code" sends the new values. The error is the lower-case API text, not the Look up text.

---

## Card 20 · NAV-05 · My data stays mine (on the screen)

**Story.** As a student, I want my taxpayer and bill saved under my own name, so that nobody else sees or changes them.

**Where.**
- Create: Home › Create my data › section "1 — Create a taxpayer" › Create taxpayer › Create a business tax or fee bill › section 3 › Create bill.
- Check: Home › See my data.
- Switch name: top bar "Change" › "Your name" › Save. My data is now empty. Then "Change" › your old `Name-1234` › Save.

**Before you start.** Nothing. You make the taxpayer and bill in this card. Write down your whole name-tag from the top bar first.

### 1. When the screen opens (upon page load)
**First visit (no name yet):**
- Dialog "Your name" opens by itself.
- Text: "Used to label your training data. 2–60 characters. Type `Name-1234` to continue your existing data from another browser."
- One text box, blank, placeholder "e.g. Ana". Button "Save".
- The dialog has no Cancel or close button.

**Top bar:**
- "You are: <name>-<4 digits>" and a link "Change".
- With no name yet: "not identified — set your name".

**Change:**
- The same "Your name" dialog, already filled with your current name. The tag is not included.

**My data:**
- Heading "My data".
- Hint "Everything created under your name. Another name — even the same name typed again — sees nothing here."
- Sections in this order: My taxpayers, My bills, My tellers, My approver, My receipts.
- My taxpayers is a table Name | Mobile | Email. Each bill row shows: kind and reference | detail | amount | status | `details`.

**Empty texts:**
- My taxpayers: "None yet — create one in Training setup."
- My bills: "None yet."
- My tellers: "None yet."
- My approver: "None yet — create one in Training setup (step 5)."
- My receipts: "None yet — collect a payment at the POS."

**Training setup, section 3:**
- "Taxpayer (only yours are listed)": first option "— pick a taxpayer —", then each of your taxpayers as "<full name> (<mobile>)".
- "Type": a list, BUSINESS by default; the options are BUSINESS and FEE.
- "Reference" (blank). "Description" (blank). "Amount (₱)" (blank). "Due date" (blank, placeholder "YYYY-MM-DD").
- Button "Create bill".

### 2. Rules for each field (element validations)
| Field (label on screen) | Rule | Message on screen when broken |
|---|---|---|
| Your name | 2–60 characters after trimming spaces; the box takes at most 60 | "2–60 characters." |
| Your name | `<name>-<4 digits>` with a name of 2+ characters = continue that name-tag exactly as typed | — |
| Your name | the same name as now (no tag) = nothing changes, the dialog closes | — |
| Your name | any other name = a new random 4-digit tag, and the page reloads | — |
| Your name | the name-tag must match letter case exactly (`ana-4821` is not `Ana-4821`) | no message: My data is just empty |
| Full name (section 1) | 2–100 characters: letters, spaces, . - ' Ñ ñ | "2-100 characters: letters, spaces, . - ' and Ñ only" |
| Mobile (09XXXXXXXXX) | 09 + 9 digits or +639 + 9 digits | "must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX" |
| Mobile (09XXXXXXXXX) | one mobile per tenant | "already registered for this tenant" |
| Taxpayer (only yours are listed) (section 3) | required | **nothing shows** (the API answers 404 `Not Found`, and section 3 has no place for that message; checked Nov 4) |
| Reference | 1–100 characters; one per tenant | "1-100 characters" / "already taken for this tenant" |
| Amount (₱) | more than 0, at most 2 decimals, at most 999999999.99 | "must be greater than 0" / "must be a positive amount with at most 2 decimals" / "must not exceed 999999999.99" |
| Due date | YYYY-MM-DD, a real calendar date | "must be a valid ISO date (YYYY-MM-DD)" |

The screen shows one field error at a time: the API returns only the first broken field (checked Nov 4 with a blank form).

### 3. What must happen (functional validations)
- AC-1 Create taxpayer shows "<full name> created — mobile <mobile>."
- AC-2 Create bill shows "BUSINESS bill <reference> for ₱999.00."
- AC-3 My data under your name-tag shows your taxpayer row and your bill row.
- AC-4 After Change to a new name, the top bar shows the new name with a new 4-digit tag.
- AC-5 Under the new name, My taxpayers shows "None yet — create one in Training setup."
- AC-6 Under the new name, My bills and My tellers show "None yet."
- AC-7 Under the new name, the Training setup taxpayer lists show only "— pick a taxpayer —".
- AC-8 Change › your old `Name-1234` › Save brings your rows back, and the top bar says "You are: Name-1234".
- AC-9 While the lists load, or if they fail, "None yet" never shows. A failed list shows "Could not load your taxpayers (the API returned an error). Nothing is hidden — reload to try again." (and the same for bills, tellers, approver, receipts).

### 4. Where you check it (the validate story)
- As you: Home › See my data.
  - My taxpayers row `<full name>` | `<mobile>` | `—`.
  - My bills row `Business <reference>` | (blank) | `999.00` | `OPEN`.
- As the new name: the same page shows only the empty texts from section 1.
- Back as you (`Name-1234`): the same rows as before.
- Another name-tag never sees your rows, and cannot pick your taxpayer in Training setup.

### 5. Not on this screen
- **API only.**
  - Another X-User-ID (`<you>-probe`) gets 200 `[]` on the taxpayers, bills/all, tellers, receipts and approvers lists.
  - Reading your taxpayer or bill as the probe gets 404 `{"detail":"Not Found"}`, the same as a missing ID.
  - Your name-tag in lower case also gets 404.
  - No X-User-ID gets 422 `{"detail":{"X-User-ID":"required header"}}`.
  - The probe adding a bill to your taxpayer gets 404 `Not Found`.
  - All re-checked Nov 4.
- **Not visible on the screen.**
  - `created_by` and the record IDs.
  - The name-tag is kept only in this browser (local storage). A new browser asks again.
- **Manual (needs judgment).**
  - The dialog cannot be closed without saving.
  - Does the hint "even the same name typed again — sees nothing here" make sense? Change with the same name keeps your tag and data. Only a new browser, or a name typed after a different one, gets a new tag.
- **Open questions.**
  - A name-tag whose name part is 1 character (e.g. `A-1234`) is not treated as a name-tag. It becomes a new name `A-1234` with its own new tag.
  - The receipt print view (`/receipts/{receipt_id}/print`) opens without any name-tag (200 with no headers, checked Nov 4). It is not owner-scoped; the card says cashiering calls are not owner-scoped (trainer note).


---

