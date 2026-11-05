# UCTP tests starter

A small test project, set up the way a test team keeps one at work:

- the story, the charter, the prompt and the tests live together in Git
- a teammate reviews every change (a pull request)
- CI runs every test on every change and shows **green** (all passed) or **red** (a test failed)

Site under test: `https://city-treasurer-staging.aiqe.pro` (training copy, made-up data). Sections 1 to 5 are done on the GitHub website, with nothing to install. For Session 6 you also run the tests on your laptop: see **Before class: setup**.

## What is in this project

```
uctp-tests/
├── config/environment.js      the site and your name-tag, per environment (the only file you change)
├── helpers/api.ts             api() and new test data, written once
├── helpers/web.ts             signIn(), messageUnder() and api() for web and integration tests, written once
├── tests/
│   ├── api/                   API tests, split by type
│   │   └── trn-01.spec.ts                 API tests (Playwright, no browser), one file per story
│   ├── web/
│   │   └── trn-01.spec.ts                 web tests (Playwright) for the same story
│   └── integration/
│       └── trn-01.spec.ts                 the API and the screen agree
├── stories/                   the user stories and their acceptance criteria
├── charters/                  the test charters (JSON from Charter360) and <charter>.files.json: the test files saved with each one (RUN runs only those)
├── prompts/                   your 4-part prompt, our project rules, the charter-update prompt, the review checklist
├── scripts/summary.js         joins all reports into reports/summary.json
├── scripts/doctor.mjs         npm run doctor: is this laptop ready?
├── runner/                    npm run runner (for Charter360's RUN) and npm run test:watch
├── test-runs/                 the reports: <date>/<story> - <date time>/ (one folder per run: the .html report, .json, screenshots); index.html lists them
├── setup-mac.sh, setup-windows.ps1   install what's missing, before class
├── .claude/skills/qe/SKILL.md the QE skill your AI uses
├── reports/                   the results of each run (CI keeps them for you)
├── package.json               how to run them: npm run test:api, test:web, test:integration
└── .github/workflows/tests.yml   the CI: runs all tests on every change
```

The worked example is **Card 01 · Register a taxpayer**: 34 API tests (A), 9 web tests (W) and 6 integration tests (I) for the same story, all from `charters/card-01-charter.json`.

## 1 · Make your own copy

1. Sign in to GitHub (no account yet? https://github.com/signup, then confirm the email GitHub sends you).
2. On this page, at the top right, click the green button **Use this template**, then **Create a new repository**.
3. **Repository name:** `uctp-tests`. Choose **Public**. Click **Create repository**.

You are now on **your** copy: the address is `github.com/<your-username>/uctp-tests`. Do every next step there.

## 2 · Put in your name-tag (1 file)

Using Charter360? Type your name-tag in **Environment settings** (the gear) instead: RUN passes it to the tests (`UCTP_NAME_TAG`), so this file can stay as it is.

Your name-tag is in the top bar of the UCTP site: `You are: Ana-4821` means `Ana-4821`.

1. Click the **`config`** folder › **`environment.js`**. At the top right of the file, click the **pencil icon** (Edit this file).
2. On the line `const ME = process.env.UCTP_NAME_TAG || 'Ana-4821';` change `Ana-4821` to your name-tag. Keep the quotes.
3. Click the green **Commit changes...** button (top right), then **Commit changes** in the box.

## 3 · Watch it run

1. At the top of your repository, click the **Actions** tab.
2. Click the newest run (top of the list). You see four jobs: **API tests (Node)**, **Web tests (Playwright)**, **Integration tests (API + screen)** and **Test run summary**.
3. Wait about 2 minutes. A **green check** means every test passed. A **red X** means a test failed: click the job, then the red step, to read which test and why.
4. The results: the run page shows a table of every test (id, result, why it failed). Scroll down to **Artifacts**: **test-run-summary** (`summary.json`, one row per test: give it to the AI to update your charter), **api-report** (one file per API test file), **web-report** and **integration-report** (download, unzip, open `html/index.html`).

## 4 · Add your tests the team way (a pull request)

At work nobody adds a test straight to the main branch: you propose it, a teammate reviews it, CI runs it, then it is merged.

1. Open the folder **`tests`** › **`api`** (or **`web`**, or **`integration`**). Click **Add file** (top right) › **Create new file**.
2. Type the file name the AI gave you: one file per story and type, for example `trn-02.spec.ts` in `tests/api`, `tests/web` or `tests/integration`. Files must end in `.spec.ts`.
3. Paste the AI's code.
4. Click **Commit changes...**. In the box, choose **Create a new branch for this commit and start a pull request**. Name the branch, for example `card-02-api`. Click **Propose changes**.
5. On the next page click **Create pull request**.
6. Wait for the checks at the bottom of the pull request: green or red.
7. **Review:** send the pull request link to your seatmate. They open the **Files changed** tab and check:
   the checklist in `prompts/review-checklist.md`: expected results, checks, missing tests.

   They click **Review changes**, write what they found, and click **Submit review**.
8. Fix what the review found (open the file in the pull request, pencil icon, commit to the same branch). When the checks are green, click **Merge pull request** › **Confirm merge**.

Keep the story, the charter and the prompt with the test: add them the same way to **`stories`**, **`charters`** (**Add file** › **Upload files**) and **`prompts`**.

## 5 · When it is red

- Read the failed test's name and message in the Actions log first.
- **Our test was wrong** (a typo, an expected value not from the charter): fix the test and commit again.
- **The app is wrong** (the charter says one thing, the site does another): don't change the test to match the bug. Log the bug.
- To run again without changing anything: **Actions** tab › **UCTP tests** (left) › **Run workflow** › **Run workflow**.

## Before class: setup (Session 6)

Do this once, before class, on the laptop you bring. It takes about 15 minutes and downloads about 500 MB.
If your laptop blocks installs, do it with your IT admin.

1. Get your copy of this repo on your laptop (in a terminal: `git clone https://github.com/<your-username>/uctp-tests.git`, then `cd uctp-tests`).
2. Run the setup script. It installs only what is missing (Git, Node.js, Chrome, Firefox, the test browsers) and is safe to run twice.
   - **Mac** (Terminal): `bash setup-mac.sh`
   - **Windows** (PowerShell): `powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1`
3. It ends with `npm run doctor`. Every line must be ✅. Each ❌ line says how to fix it; fix it, then run `npm run doctor` again.

## Start the runner by itself (optional)

So you don't have to type `npm run runner` every time:

```
npm run autostart
```

It starts at login from now on (Mac and Windows) and keeps the same pairing code. To stop that: `npm run autostart:off`.

## Charter360 with your own Claude plan (optional)

If you have a Claude Pro or Max plan and Claude Code on this laptop, Charter360 › My AI › **Claude Code (my Claude plan)** can use it instead of an API key. It's off by default. Turn it on only for yourself:

```
CHARTER360_CLAUDE_CODE=1 npm run runner
```

It uses the Claude account signed in on this laptop, and only your browser (with your pairing code) can reach your runner. Never share your plan: each person uses their own. Turn off "Help improve Claude" in claude.ai › Settings › Privacy.

## Run your tests

- **From Charter360:** in your `uctp-tests` folder run `npm run runner` and keep that window open. It prints a 6-digit pairing code. In Charter360 open **Environment settings**, type the code, then press **RUN**.
- **From the terminal (no Charter360):** `npm run test:watch`.

Both do the same run: API tests once, then the web and integration tests in Chrome, then in Firefox. Each browser opens **one window** and every test is a **new tab** in it. The Chrome window stays open after the run so you can click through the tabs and see what each test did; close it yourself (`npm run test:watch`: press Ctrl+C; the runner closes it at the next RUN) (a failing test is re-run up to 3 times; a pass on a re-run shows as **Flaky**). The report opens in Chrome, and everything is saved in one folder per run, `test-runs/<date>/<SUT> - <story ID> <story name> - <date time>/` (the `.html` report, the `.json` and the screenshots), committed and pushed so CI runs too.

Writing web tests: the site shows a **"Your name"** dialog on the first visit that blocks every page; start each web or integration test with `await signIn(page)` (in `helpers/web.ts`, used in `test.beforeEach`), which fills it in.

**Your reports as a web page (GitHub Pages).** Once, in your repo on GitHub: **Settings › Pages › Source: GitHub Actions**. After each pushed run, the list of runs is at `https://<your-username>.github.io/uctp-tests/` (newest first); each report has a **Download PDF** button.

Test ids: **A** = API, **W** = web, **I** = integration. Every test is named `<id> · <AC> · <what the test does, with its data>`, the same as its charter line, for example `A12 · AC-5 · refuse the full name "A" (1 letter)`.

## Run single suites (optional)

`npm run test:api`, `npm run test:web`, `npm run test:integration`. `npm run summary` writes `reports/summary.json`. To test another site: `BASE_URL=https://… npm run test:api`.
