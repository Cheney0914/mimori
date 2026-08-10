# Stage 2 vision evaluation results

Use this as the shareable, manual record of real-provider evaluation. Browser-local results from `/dev/vision-test` are intentionally not synchronised here, and no images are stored in either place.

## PRELIMINARY MVP MODEL DECISION

Primary: `gemini-3.5-flash-lite`

The current five-image comparison showed the same successful semantic recognition as Gemini 3.1 Flash-Lite with lower observed average latency. It is also much less expensive than Gemini 3.6 Flash, which encountered quota/rate-limit failures during evaluation. This task has not yet shown a quality advantage that requires Gemini 3.6 Flash. Revisit this preliminary choice after the full concept evaluation.

| Object | Expected Concept | Vision Output | Normalized Concept | English | Japanese | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mug | mug | Pending | Pending | Pending | Pending | Pending | Handled coffee mug. |
| glass | glass | Pending | Pending | Pending | Pending | Pending | Empty drinking glass. |
| plate | plate | Pending | Pending | Pending | Pending | Pending | Plain dinner plate. |
| spoon | spoon | Pending | Pending | Pending | Pending | Pending | One spoon on a plain surface. |
| kettle | kettle | Pending | Pending | Pending | Pending | Pending | Avoid visible brand marks. |
| whisk | whisk | Pending | Pending | Pending | Pending | Pending | — |
| spatula | spatula | Pending | Pending | Pending | Pending | Pending | — |
| chopping board | chopping_board | Pending | Pending | Pending | Pending | Pending | — |
| bottle | bottle | Pending | Pending | Pending | Pending | Pending | — |
| bread | bread | Pending | Pending | Pending | Pending | Pending | — |
| apple | apple | Pending | Pending | Pending | Pending | Pending | — |
| banana | banana | Pending | Pending | Pending | Pending | Pending | — |
| keyboard | keyboard | Pending | Pending | Pending | Pending | Pending | — |
| mouse | mouse | Pending | Pending | Pending | Pending | Pending | Test computer mouse alias. |
| notebook | notebook | Pending | Pending | Pending | Pending | Pending | — |
| pen | pen | Pending | Pending | Pending | Pending | Pending | Test ballpoint pen alias. |
| book | book | Pending | Pending | Pending | Pending | Pending | — |
| phone | phone | Pending | Pending | Pending | Pending | Pending | — |
| lamp | lamp | Pending | Pending | Pending | Pending | Pending | — |
| pillow | pillow | Pending | Pending | Pending | Pending | Pending | — |
| remote | remote | Pending | Pending | Pending | Pending | Pending | Test remote control alias. |
| curtain | curtain | Pending | Pending | Pending | Pending | Pending | — |
| towel | towel | Pending | Pending | Pending | Pending | Pending | — |
| toothbrush | toothbrush | Pending | Pending | Pending | Pending | Pending | — |
| soap | soap | Pending | Pending | Pending | Pending | Pending | — |
| umbrella | umbrella | Pending | Pending | Pending | Pending | Pending | Test rain umbrella alias. |
| wallet | wallet | Pending | Pending | Pending | Pending | Pending | — |
| shoe | shoe | Pending | Pending | Pending | Pending | Pending | — |
| bench | bench | Pending | Pending | Pending | Pending | Pending | — |
| bicycle | bicycle | Pending | Pending | Pending | Pending | Pending | — |
