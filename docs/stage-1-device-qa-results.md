# Stage 1 true-device QA results

Do not replace **Not run** until a physical-device test has been executed. Use one row per checklist ID and device.

| ID | Device/browser | Test flow | Expected | Actual | Severity | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IOS-01 | Not run | Permission granted | Rear camera preview appears after language selection | — | Blocker | Not run | — |
| IOS-02 | Not run | Permission denial/recovery | Recovery is clear; retry does not crash | — | Major | Not run | — |
| IOS-03 | Not run | Scan and repeat | Kitchen record increments once per scan | — | Blocker | Not run | — |
| IOS-04 | Not run | English/Japanese isolation | Japanese count is independent | — | Major | Not run | — |
| IOS-05 | Not run | Candidate selection | One selected candidate saves exactly once | — | Major | Not run | — |
| IOS-06 | Not run | None of these | No record is saved | — | Major | Not run | — |
| IOS-07 | Not run | Wrong object | Only current encounter is undone | — | Major | Not run | — |
| IOS-08 | Not run | English/Japanese TTS | Voice plays or fallback is explicit | — | Major | Not run | — |
| IOS-09 | Not run | 375/390 layout and safe area | No clipping or horizontal overflow | — | Major | Not run | — |
| IOS-10 | Not run | Exit cleanup and refresh | Camera releases; IndexedDB persists | — | Major | Not run | — |
| IOS-11 | Not run | Offline reopen | Visited World/Scene reopen; scan blocked | — | Major | Not run | — |
| AND-01 | Not run | Permission/rear camera | Rear preview appears | — | Blocker | Not run | — |
| AND-02 | Not run | Permission recovery | Recovery is clear and works | — | Major | Not run | — |
| AND-03 | Not run | Scan/repeat/isolation | Counts are correct and isolated | — | Blocker | Not run | — |
| AND-04 | Not run | Candidate/Wrong object | Confirmation and undo are safe | — | Major | Not run | — |
| AND-05 | Not run | TTS fallback | Voice or explicit fallback | — | Major | Not run | — |
| AND-06 | Not run | 390/430 layout | No clipping or horizontal overflow | — | Major | Not run | — |
| AND-07 | Not run | Back navigation/cleanup | Camera releases | — | Major | Not run | — |
| AND-08 | Not run | Persistence/offline | Data persists; visited pages reopen | — | Major | Not run | — |
