# Review checklist: before you commit the AI's tests

You review the AI's code the way a teammate would. The AI is fast, not careful: you are the tester.

## 1 · Expected results
- [ ] Every expected result is the charter's, **word for word** (status code and message). Not the AI's words ("Taxpayer created successfully").
- [ ] The test checks the **body** too, not only the status code.
- [ ] No expected result was changed to make a test pass.

## 2 · Checks
- [ ] One test per charter node, named with the node's id (A1, W1, I1 ...).
- [ ] Each test makes its own data (`newMobile()`), never a typed-in mobile that must be new.
- [ ] No site address and no name-tag inside a test (they are in `config/environment.js`).
- [ ] Web and integration tests click buttons and links the way a clerk does; no fixed waits.
- [ ] Integration tests use **both** the API and the screen in each test.

## 3 · Missing tests
- [ ] Every AC has at least one test. Every "refused" AC has a − test.
- [ ] Limits are tested on both sides: the last value that works and the first that doesn't (2 and 1 letters, 100 and 101).
- [ ] Compare with the team's files (`trn-01.spec.ts` in tests/api, tests/web, tests/integration): a test they have and you don't?

## 4 · The run
- [ ] CI ran your files: the Actions log lists them.
- [ ] Red? Read **why**. Our test is wrong: fix the test. The app is wrong: keep it red and report it.

Write what you found in the pull request review: the id, what's wrong, what it should be.
