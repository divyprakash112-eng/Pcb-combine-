# NEET AARAMBH — PCB Combined Test Series

Static website for GitHub Pages.

## Files
- index.html: Homepage
- assets/css/style.css: Design and responsive layout
- assets/js/config.js: Timing settings
- assets/js/tests.js: Test schedule and availability flags
- assets/js/app.js: Countdown, cards and syllabus popup
- data/syllabus.json: Syllabus data
- tests/: Actual CBT HTML files
- planner/: Complete planner PDF

## GitHub Pages deployment
1. Create a repository named neet-aarambh-pcb.
2. Upload the contents of this project to the repository root.
3. Confirm index.html is visible at the root.
4. Open Settings > Pages.
5. Select Deploy from a branch.
6. Choose main and /(root), then Save.

## Upload a CBT
For Test 02, upload the real CBT as:
tests/test-02.html

Then open assets/js/tests.js and change Test 02's:
available: false
to:
available: true

Only enable a test after its real CBT file has been uploaded.

## Important
GitHub Pages is public static hosting. The scheduled homepage
button is not file-level security. A public CBT URL may be opened
directly before its scheduled time.
