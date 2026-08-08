# Stage 2 vision evaluation

Use `/dev/vision-test` with `RECOGNITION_MODE=real`, Gemini credentials, and `VISION_PLAYGROUND_ENABLED=true` in a Preview environment. Photograph one object at a time in ordinary indoor light. Record the provider's raw JSON, then the controlled normalized concept below. Images are deliberately not collected in this repository or application. The evaluation endpoint is deliberately unavailable in production unless explicitly enabled.

`Pending` means the sample still needs a real-device, real-provider run; it is not a pass.

| Group | Object / image to capture | Vision output | Normalized concept | Correct? | Notes |
| --- | --- | --- | --- | --- | --- |
| Kitchen | mug | Pending | mug | Pending | Include a handled coffee mug. |
| Kitchen | glass | Pending | glass | Pending | Empty drinking glass. |
| Kitchen | plate | Pending | plate | Pending | Plain dinner plate. |
| Kitchen | spoon | Pending | spoon | Pending | One spoon on a plain surface. |
| Kitchen | kettle | Pending | kettle | Pending | Avoid visible brand marks. |
| Kitchen | whisk | Pending | whisk | Pending |  |
| Kitchen | spatula | Pending | spatula | Pending |  |
| Kitchen | chopping board | Pending | chopping_board | Pending |  |
| Food & drink | bottle | Pending | bottle | Pending |  |
| Food & drink | bread | Pending | bread | Pending |  |
| Food & drink | apple | Pending | apple | Pending |  |
| Food & drink | banana | Pending | banana | Pending |  |
| Workspace | keyboard | Pending | keyboard | Pending |  |
| Workspace | mouse | Pending | mouse | Pending | Test “computer mouse” normalization. |
| Workspace | notebook | Pending | notebook | Pending |  |
| Workspace | pen | Pending | pen | Pending | Test ballpoint pen normalization. |
| Workspace | book | Pending | book | Pending |  |
| Workspace | phone | Pending | phone | Pending |  |
| Home | lamp | Pending | lamp | Pending |  |
| Home | pillow | Pending | pillow | Pending |  |
| Home | remote | Pending | remote | Pending | Test “remote control” normalization. |
| Home | curtain | Pending | curtain | Pending |  |
| Bathroom | towel | Pending | towel | Pending |  |
| Bathroom | toothbrush | Pending | toothbrush | Pending |  |
| Bathroom | soap | Pending | soap | Pending |  |
| Personal | umbrella | Pending | umbrella | Pending | Test “rain umbrella” normalization. |
| Personal | wallet | Pending | wallet | Pending |  |
| Personal | shoe | Pending | shoe | Pending |  |
| Outside | bench | Pending | bench | Pending |  |
| Outside | bicycle | Pending | bicycle | Pending |  |

## Acceptance notes

- Mark a row correct only when a provider candidate maps to the expected controlled concept and its scene is sensible.
- Add aliases only for recurring common descriptions. Do not let individual provider phrasing expand the taxonomy.
- Repeat failed rows with a cleaner, single-object image before changing prompt or taxonomy.
