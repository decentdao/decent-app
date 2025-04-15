# Decent Interface

## Local Development

Clone the repository

```shell
$ git clone git@github.com:decentdao/decent-interface.git
```

Change to application's `Node.js` version

```shell
$ nvm use
```

Install the dependencies

```shell
$ npm install
```

Running development environment

```shell
$ npm run dev
```

### Cloudflare Pages functions

We're using Cloudflare Pages functions for retrieving various off-chain data.
Currently it's being used to fetch abstract `address`'s ERC-20, ERC-721 and DeFi balances through `Moralis`.
It is crucial to have Cloudflare Pages functions running locally to work with anything related to DAO treasury, for instance

- Treasury page
- Payments feature

### Environment Variables

The application uses two sets of environment variables:

1. **Functions Environment Variables** (`.dev.vars`)

   - Copy `.dev.vars.example` to `.dev.vars` for local development
   - Contains variables needed for Cloudflare Pages Functions (e.g., Moralis API key)
   - In production, these need to be manually configured as "secrets" in the Cloudflare Dashboard

2. **Application Environment Variables** (`.env.local`)
   - Copy `.env` to `.env.local` for local development
   - Contains Vite-injected variables for the React application
   - In production, these also need to be manually configured as "secrets" in the Cloudflare Dashboard

## Localization

### API Key

Obtain your API key from https://www.deepl.com/pro-api?cta=header-pro-api
Set it to VITE_APP_DEEPL_API_KEY in .env.local

### Setup

npm install axios

### Localize

Run `node scripts/localize.js`

Only new strings are automatically translated.
Translations can be manually updated, based on professional reviews or community feedback.
The script does not modify existing translations.

### Localization Verifications

Run `node scripts/localization_verify.js`

This script is also used by Git Action as a precheck at merge.

## Feature flags

### Setup

Start with adding a new Feature Flag to the app. In https://github.com/decentdao/decent-interface/src/helpers/featureFlags.ts, Add a flag.

```typescript
export const FEATURE_FLAGS = ['flag_dev', 'flag_feature_a'] as const;
```

### Remote Configuration

Two Firebase projects were set up. "DecentDAO" for production, and "DecentDAO Develop" for development.

During develop, set the feature flag to "on" on "DecentDAO Develop".

After the feature is completed, tested, and ready to release, set the flag to "on" on "DecentDAO".

### Usage

In consumer of the flag, use the useFeatureFlag hook

```typescript
import useFeatureFlag from '../../helpers/environmentFeatureFlags';

const featureAEnabled = useFeatureFlag('flag_feature_a');
```

### Injecting flags via your environment

During development, add a flag environment variable in your (local) .env(.local) file. It must be a string value of "ON" or "OFF". The syntax of the environment variable is `VITE_APP_<FLAG_NAME>`.

```shell
VITE_APP_FLAG_FEATURE_A="ON"
```

You can also set the flag in the URL with a query param. Notice how the `VITE_APP_` prefix is omitted and the flag name in the query param matches the name you gave it in code:

```shell
http://localhost:3000/?flag_feature_a=on
```

### Testing

Override the flag value by adding query params to the URL. Notice how the `VITE_APP_` prefix is omitted and the flag name is in lowercase:

```
https://app.decentdao.org?flag_feature_a=on
```

From then, the flag holds the value from the URL param until app is refreshed

### Deployment and after

Deployment can ship with the flag turned off in .env file.

Change the value in .env file after the feature is completed and thouroughly tested.

Once code under the feature flag has been proven reliable, remove the feature flag and dead code from code base.

## Subgraph

We're using `Subgraph` to index certain "metadata" events to simplify data fetching from application site.
Repository, that implements mapping located [here](https://github.com/decentdao/decent-subgraph).

If you updated mapping and deployed new version - you might need to rebuild `Subgraph` artifacts. Use command below.

Build Subgraph artifacts

```shell
$ npm run graphql:build
```

## Deployment Notes

This app is deployed on Cloudflare Pages with the following configuration:

- Production deployment (tracking `main` branch): https://app.new.decentdao.org
- All other branches get preview deployments at: https://branch-name.decent-interface.pages.dev
