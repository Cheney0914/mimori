# Stage 1 true-device QA checklist

Record every result in [stage-1-device-qa-results.md](./stage-1-device-qa-results.md). Do not mark a check passed until it has been completed on the stated physical device/browser.

## iOS Safari

- [ ] **IOS-01 — Permission granted:** First launch requires language selection; Continue requests camera permission; rear camera preview appears.
- [ ] **IOS-02 — Permission recovery:** Deny permission; recovery copy and retry/browser-settings path are understandable and Camera does not crash.
- [ ] **IOS-03 — Scan and repeat:** Normal mock scan returns mug, records Kitchen, then a repeat increments only English.
- [ ] **IOS-04 — Language isolation:** Switch to Japanese, scan, and verify マグカップ starts with its own count.
- [ ] **IOS-05 — Candidate confirmation:** Preview with `MOCK_RECOGNITION_SCENARIO=ambiguous`; select a candidate and verify exactly one record is saved.
- [ ] **IOS-06 — Candidate rejection:** Tap None of these; verify no record is saved.
- [ ] **IOS-07 — Wrong object:** With an existing mug count, scan again then tap Wrong object?; only the new encounter is removed.
- [ ] **IOS-08 — Audio:** Verify English and Japanese TTS independently; if a voice is missing, the explicit fallback appears instead.
- [ ] **IOS-09 — Layout:** Check safe areas and no horizontal clipping at approximately 375px and 390px in all sheet states, including Japanese.
- [ ] **IOS-10 — Cleanup and persistence:** Exit Camera and verify the browser camera indicator clears; refresh and verify records persist.
- [ ] **IOS-11 — Offline reopen:** Visit World and one Scene online, enter airplane mode, reopen them, and verify Scan shows the offline notice.

## Android Chrome

- [ ] **AND-01 — Permission granted and rear camera:** Repeat IOS-01 on Android Chrome.
- [ ] **AND-02 — Permission denial/recovery:** Repeat IOS-02 on Android Chrome.
- [ ] **AND-03 — Scan, repeat, and language isolation:** Repeat IOS-03 and IOS-04.
- [ ] **AND-04 — Candidate and Wrong object:** Repeat IOS-05 through IOS-07.
- [ ] **AND-05 — English/Japanese TTS fallback:** Repeat IOS-08.
- [ ] **AND-06 — Layout:** Check safe areas, sheets, long Japanese text, and no horizontal clipping at 390px and 430px.
- [ ] **AND-07 — Back navigation/media cleanup:** Navigate back from Camera and Scene; verify camera indicator clears.
- [ ] **AND-08 — Refresh persistence and offline reopen:** Repeat IOS-10 and IOS-11.

## Preview setup

Normal Preview: `RECOGNITION_MODE=mock` and leave `MOCK_RECOGNITION_SCENARIO` unset.

Ambiguous Preview: set `MOCK_RECOGNITION_SCENARIO=ambiguous` only in the Vercel Preview environment. The API explicitly ignores this switch when `VERCEL_ENV=production`.
