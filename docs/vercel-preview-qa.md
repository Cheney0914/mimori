# Vercel Preview setup for Stage 1 device QA

This project has no committed Vercel project link or CLI credentials. Link it to the intended Vercel project before deploying; do not commit `.vercel/` or tokens.

## Required Preview variables

Set these in **Vercel Project Settings → Environment Variables**, scoped to **Preview** only:

| Variable | Value | Purpose |
| --- | --- | --- |
| `RECOGNITION_MODE` | `mock` | Keeps all Preview recognition deterministic and provider-free. |
| `MOCK_RECOGNITION_SCENARIO` | *(unset)* | Normal QA preview: returns confirmed mug / マグカップ. |

For a separate ambiguous QA Preview, set `MOCK_RECOGNITION_SCENARIO=ambiguous` for a dedicated preview branch, then deploy that branch. Do not set it for Production. The API also ignores this flag whenever Vercel sets `VERCEL_ENV=production`.

## Deploy a Preview

1. In Vercel, import/link this repository and use the detected Next.js preset.
2. Add the Preview variables above.
3. Push a non-production branch or open a pull request. Vercel creates a Preview URL automatically.
4. Open `<preview-url>/onboarding` for fresh-entry QA; use `<preview-url>/camera`, `/world`, or `/scene/kitchen` for targeted checks.
5. For the ambiguous suite, deploy the branch that has the Preview-only `MOCK_RECOGNITION_SCENARIO=ambiguous` override and record that URL in the QA results file.

CLI alternative after authenticating locally:

```bash
vercel link
vercel env add RECOGNITION_MODE preview
vercel deploy
```

## Preview deployment notes

- Vercel Preview URLs are HTTPS, so `getUserMedia` can request a camera. Test on the real Preview URL, not a LAN HTTP address.
- `/sw.js` has root scope and `Cache-Control: no-cache`; it calls `skipWaiting()` and `clients.claim()` to reduce stale-worker windows. Close/reopen the tab after a deployment before testing offline behavior.
- The worker never caches `POST /api/recognize`; it caches app shell/static GET responses and navigation responses after they have been visited online.
- IndexedDB is per-origin. Preview deployments use different origins, so records do not carry between Preview URLs or into Production.
- Dynamic Scene routes are cached only after the specific scene URL is visited online. Offline recognition is intentionally unsupported.
