# Update the charter with the test run

After CI runs, the charter should say what happened: which tests passed, which failed and why. The AI does the typing; you check it.

1. In **Actions**, open the newest run. Scroll down to **Artifacts** and download **test-run-summary**. Unzip it: `summary.json`.
2. Click the **copy icon** at the top right of the grey box below and paste into a **new** AI chat.
3. Under **RESULTS:** paste all of `summary.json`. Under **CHARTER:** paste your charter JSON. Press **Enter**.
4. Save the AI's JSON as `card-01-charter-run.json`. In Charter360, open your charter › **Import** › choose that file. Green nodes passed, red failed, yellow aren't automated yet. (Wrong? **Undo**.)

```
Update my test charter with the results of my test run.

RESULTS:
<paste summary.json here>

DO THIS:
1. Each result has an "id" (A1, W1, I1 ...). Find the charter node whose text starts with that id.
   - All results for that id PASS: set the node's "highlight" to "green".
   - Any result for that id FAIL: set "highlight" to "red".
   - Set the node's "note" to one line: "Run <YYYY-MM-DD of ranAt> · PASS" or "Run <YYYY-MM-DD of ranAt> · FAIL: <why, at most 200 characters>".
2. A node with the status "API test", "UI journey" or "Integration" that has no result: "highlight" "yellow", "note" "Not automated yet".
3. Add one new node as the FIRST child of the root: "id" "run1" (or "run2", "run3" ... if that id is taken), "statusId" null, "highlight" null, "note" "", "collapsed" false, "children" [], and the text:
   "Test run <YYYY-MM-DD of ranAt>: <passed> passed, <failed> failed · <run>"
4. Change nothing else: the same ids, texts, statuses and order. Idea, Manual and heading nodes stay as they are. Keep the "settings" as they are.

Reply with the whole charter JSON in one code block. Then list the failed tests, one line each: the id, why it failed, and whether the test or the app looks wrong.

CHARTER:
<paste your charter JSON here>
```
