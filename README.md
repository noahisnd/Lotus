# Stick — site

The landing page for getstick.website. Static HTML, CSS and vanilla JavaScript —
no build step, no dependencies. The design came from the `noahisnd/buzz`
repository; this branch replaces the previous Astro site with it.

## Before anything else: what must never be deleted

getstick.website is not only a landing page. Every installed copy of Stick asks
it for updates, and none of that is visible from the page itself.

| File in `public/` | Who reads it |
| --- | --- |
| `latest.json` | every installed Mac, once a day and at launch |
| `latest-windows.json` | every installed PC, once a day and at launch |
| whatever `.pkg` / `.exe` those two name | the updater, straight after reading them |

Remove any of these and updates stop — **silently**. Nothing on a customer's
machine reports a manifest that 404s; it reads as "you are up to date", and the
fleet stops moving forward without anyone noticing. They are written by the
release scripts in the product repo (`app/release-manifest.sh` and the Windows
release steps), not by hand.

`/faq` is linked from inside the app, and `/terms`, `/refunds`, `/privacy` and
`/updates` from the policy text pasted into Shopify's checkout. Those URLs are
kept working by `vercel.json` below.

## Run it

```bash
python3 scripts/serve.py        # http://localhost:4173
```

Use this rather than `python3 -m http.server`. That serves the files but ignores
`vercel.json`, so `/faq`, `/terms`, `/buy` and the rest 404 locally while working
in production — and routing is the part of this site most likely to be wrong.
`serve.py` applies the same redirects and rewrites Vercel will.

## How it deploys

`vercel.json` turns off the framework, the install and the build, and serves
`public/` as it is. Empty strings rather than `null` for the two commands: in
Vercel's schema `null` means *detect it*, which could put back the Astro build
the project dashboard still remembers.

Old URLs keep working:

| URL | Goes to |
| --- | --- |
| `/faq`, `/terms`, `/refunds`, `/privacy`, `/contact` | `pages/*.html`, same URL in the bar |
| `/buy` | `/#pricing` — the colour choice |
| `/demo` | `/#how-it-works` |
| `/story`, `/updates` | `/` for now — see below |

The redirects are temporary (307) on purpose, so that when real pages come back
browsers and search engines have not cached them away.

`www.getstick.website` is canonical: Vercel 308s the apex to it.

## The checkout

Two buttons in the pricing card, one per colour, each a Shopify cart permalink:

| Colour | Variant | |
| --- | --- | --- |
| Hot pink | `52143838298252` | `shop.getstick.website/cart/52143838298252:1` |
| Gray | `53670640615564` | `shop.getstick.website/cart/53670640615564:1` |

Two buttons because a permalink names one variant: a single "Get Stick" would
choose a colour for the buyer and never show them the other. Every other "Get
Stick" on the page scrolls to this card rather than choosing on their behalf.

The ids are Shopify's and stay put unless the product's options are
restructured — renaming Black to Gray once retired the old variant, and the
button went on linking to a cart that answered 410 with nothing on screen to
say so. After any change to the product, re-read them:

```bash
curl -s https://shop.getstick.website/products.json | python3 -m json.tool | grep -E '"(id|title)"'
```

## Cache-busting

`styles.css` and `app.js` are linked as `?v=<hash>`, the first 8 characters of
the file's MD5. Change either file and update the hash in `index.html` **and**
every file in `pages/`, or browsers keep serving the old copy:

```bash
md5 -q public/assets/styles.css | cut -c1-8
```

## What's here

```
vercel.json          routing, and no build
public/index.html    the page
public/pages/        faq, terms, refunds, privacy, contact
public/assets/       styles.css, app.js, icon, step media, the key photo
public/*.json        update manifests — see the top of this file
public/*.pkg, *.exe  the installers those manifests name
scripts/serve.py     local preview that honours vercel.json
scripts/og.py        generates og.png
```
