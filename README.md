# Media Scanner

Scan the UPC barcode on a **cassette, vinyl record, or CD**, look it up on
[Discogs](https://www.discogs.com/), pick the exact pressing, then choose a
condition to see Discogs' suggested price and live marketplace figures.

- **Frontend:** React + Vite + TypeScript
- **Backend:** Azure Functions (Node) that proxy the Discogs API so your token
  never reaches the browser
- **Hosting:** Azure Static Web Apps (Free tier), deployed by GitHub Actions
- **No database** — everything is fetched live from Discogs

## How it works

1. **Scan / enter a UPC.** A handheld USB scanner behaves like a keyboard
   (it types the digits and presses Enter), so the input box just works. You
   can also type a code, or tap **📷 Camera** to scan with your phone.
2. **Pick the pressing.** `GET /api/discogs-search?upc=…` searches Discogs by
   barcode and returns the matching releases (there are often several pressings
   per barcode).
3. **Choose a condition.** `GET /api/discogs-release?id=…` returns full release
   details plus per-condition price suggestions and live marketplace stats
   (lowest price, copies for sale). Pick any of the eight Discogs grades to see
   the suggested price for that condition and the full price range.

## Project layout

```
.
├── api/                        Azure Functions (the SWA managed API)
│   ├── shared/discogs.js       Discogs client (token stays server-side)
│   ├── discogs-search/         GET /api/discogs-search?upc=
│   └── discogs-release/        GET /api/discogs-release?id=&curr=
├── src/                        React app
│   ├── components/             ScannerInput, CameraScanner, ResultsList,
│   │                           ReleaseDetail, ConditionPrices
│   ├── api.ts, types.ts, App.tsx, main.tsx, index.css
├── staticwebapp.config.json    SPA routing + Node 20 API runtime
├── swa-cli.config.json         Local full-stack dev via the SWA CLI
└── .github/workflows/          CI/CD to Azure Static Web Apps
```

## Local development

### Frontend only (quickest)

```bash
npm install
npm run dev          # http://localhost:5173
```

`/api` calls are proxied to `http://localhost:7071`, so start the functions in
another terminal if you want live data (`cd api && func start`).

### Full stack (frontend + functions together)

Requires the [SWA CLI](https://aka.ms/swa-cli) and
[Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local):

```bash
npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4
cp api/local.settings.json.example api/local.settings.json   # add your token
npm run start:swa    # http://localhost:4280
```

### The Discogs token

The functions read a Discogs **personal access token** from the
`DISCOGS_TOKEN` environment variable.

- **Locally:** put it in `api/local.settings.json` (git-ignored).
- **In Azure:** it's stored as an application setting on the Static Web App
  (`az staticwebapp appsettings set`), never in the repo.

Generate a token at <https://www.discogs.com/settings/developers>.

## Deployment

Pushing to `main` triggers
[`.github/workflows/azure-static-web-apps.yml`](.github/workflows/azure-static-web-apps.yml),
which builds the Vite app and the functions and deploys them to the
`mediascanner-swa` Static Web App.

The deployment requires one GitHub repository secret,
`AZURE_STATIC_WEB_APPS_API_TOKEN` (the SWA deployment token), and one Azure
app setting, `DISCOGS_TOKEN`.

### Re-creating the Azure resources

```bash
az group create --name mediascanner-rg --location eastus2

az staticwebapp create \
  --name mediascanner-swa \
  --resource-group mediascanner-rg \
  --sku Free \
  --location eastus2

# Wire the deployment token into GitHub
TOKEN=$(az staticwebapp secrets list --name mediascanner-swa \
  --query "properties.apiKey" -o tsv)
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$TOKEN" \
  --repo suedepop/media-scanner

# Provide the Discogs token to the functions at runtime
az staticwebapp appsettings set --name mediascanner-swa \
  --setting-names DISCOGS_TOKEN=<your-token>
```

## Notes & limits

- Discogs allows ~60 authenticated requests/minute — fine for personal use.
- Price suggestions come from Discogs and are **guidance only**, not live
  listing prices. The "Lowest for sale" figure is the current marketplace
  minimum.
- A barcode can match several pressings/regions; that's why you choose the
  exact release before pricing.
