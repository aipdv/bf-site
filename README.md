# bf-site

The Better Files landing page: https://bf.aipdv.com

The app: https://github.com/aipdv/better-files

## Build

Astro, static output. GSAP (ScrollSmoother, ScrollTrigger, ScrollToPlugin, SplitText) runs the page motion in `src/scripts/motion.ts`. Motion that the visitor drives (smooth scroll, link glides, the hero phone that shrinks on scroll, reveals, the video) runs for everyone. Motion that runs by itself (the hero rise-in, the phone typing loop) stops under `prefers-reduced-motion`. The demo video is a YouTube embed (`src/components/YouTube.astro`). The other script is the Cloudflare Web Analytics beacon (no cookies).

```sh
npm ci
npm run build    # writes dist/
npm run preview  # serves dist/ on http://localhost:4321
```

## Deploy

Cloudflare Pages, project `better-files`, custom domain `bf.aipdv.com`.

A merge to `main` deploys by itself: `.github/workflows/deploy.yml` builds and runs wrangler. Pull requests only build. A daily scheduled run also deploys `main`, so the changelog page (fetched from the GitHub API at build time) picks up new app releases. The workflow uses the repo secrets `CLOUDFLARE_API_TOKEN` (Pages Write only, token "bf-site GitHub deploy") and `CLOUDFLARE_ACCOUNT_ID`.

Manual deploy, if Actions is down. The `cf` CLI cannot deploy to Pages, so use wrangler without adding it to the project:

```sh
npm run build
npx wrangler pages deploy dist --project-name better-files --branch main
```

## Release videos

Put a YouTube link in the GitHub release notes. The /changelog page embeds the first `youtu.be/ID` or `youtube.com/watch?v=ID` link it finds. A thumbnail link works on GitHub too:

```md
[![Watch the video](https://img.youtube.com/vi/ID/hqdefault.jpg)](https://youtu.be/ID)
```

To change the home page demo, change the `id` on `<YouTube>` in `src/pages/index.astro`.

## Privacy page

`src/pages/privacy.md` is a copy of `PRIVACY.md` from the app repo. When that file changes, copy it again. Keep the `email_off` markers around the email address and the site-only section at the end.
