# bf-site

The Better Files landing page: https://bf.aipdv.com

The app: https://github.com/aipdv/better-files

## Build

Astro, static output. The site ships no JavaScript of its own. The only script is the Cloudflare Web Analytics beacon (no cookies).

```sh
npm ci
npm run build    # writes dist/
npm run preview  # serves dist/ on http://localhost:4321
```

## Deploy

Cloudflare Pages, project `better-files`, custom domain `bf.aipdv.com`.

```sh
cf pages deploy dist
```

## Privacy page

`src/pages/privacy.md` is a copy of `PRIVACY.md` from the app repo. When that file changes, copy it again. Keep the `email_off` markers around the email address and the site-only section at the end.
