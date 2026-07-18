# Stage 2 real vision test plan

Record each real-provider result before claiming accuracy. Do not store test images or provider payloads in this document.

| Case | Expected result | Actual | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| Mug | English `mug`; Japanese `マグカップ`; Kitchen | — | Not run | — |
| Keyboard | Common keyboard term; Work & Study | — | Not run | — |
| Umbrella | Common umbrella term; Clothing & Personal | — | Not run | — |
| Towel | Common towel term; Bathroom | — | Not run | — |
| Bottle | Common bottle term; Food & Drink | — | Not run | — |
| Mug vs cup | Confirmed result only when clear; otherwise candidate sheet | — | Not run | — |
| Glass vs mug | No over-confident merge; candidate sheet when uncertain | — | Not run | — |
| Multiple objects | No incorrect auto-save; error or candidate confirmation | — | Not run | — |
| Partially visible object | Clear error or candidate confirmation | — | Not run | — |
| Unusual object | No uncontrolled concept creation | — | Not run | — |
| Network failure | Safe user-facing error; Camera remains usable | — | Not run | — |
| Provider timeout | Timeout state appears; retry works | — | Not run | — |
| Invalid provider JSON | Safe user-facing error; no save | — | Not run | — |

## Setup

Use `RECOGNITION_MODE=real`, `VISION_PROVIDER=openai_compatible`, `VISION_API_BASE_URL`, `VISION_API_KEY`, and `VISION_MODEL` only in a secure server environment. Use temporary, non-personal test imagery and never paste provider responses containing image data into QA records.
