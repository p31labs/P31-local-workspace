# phosphorus31.org — Ring D + universal canon

Ring D is **connected** to P31 through the same [`p31-universal-canon.json`](./p31-universal-canon.json): shared fonts, spacing, motion, and **identical brand accent hexes**. It should **not** look like p31ca: use the **org** appearance (light surfaces, ink-forward type).

## Opt in (static HTML)

1. Load the same stylesheet the hub generates (copy `p31-style.css` from `p31ca/public/` in your deploy pipeline, or fetch a published URL once you host it).
2. On the document root:

```html
<html lang="en" data-p31-appearance="org">
```

Default is **hub** (dark) when the attribute is omitted — so p31ca needs no change.

## Optional: match system light/dark

```html
<html lang="en" data-p31-appearance="auto">
```

When the user’s OS prefers light, org tokens apply; you still need the same `p31-style.css` (includes the `@media (prefers-color-scheme: light)` block).

## Minimal toggle (localStorage)

```html
<button type="button" id="p31-theme-toggle">Theme</button>
<script>
  (function () {
    var k = "p31-appearance";
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem(k); } catch (e) {}
    if (saved === "org" || saved === "hub" || saved === "auto") {
      root.setAttribute("data-p31-appearance", saved);
    }
    var btn = document.getElementById("p31-theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = root.getAttribute("data-p31-appearance") || "hub";
      var next = cur === "org" ? "hub" : "org";
      root.setAttribute("data-p31-appearance", next);
      try { localStorage.setItem(k, next); } catch (e) {}
    });
  })();
</script>
```

Use **hub** on org only if you intentionally want the technical dark shell on a subset of pages.

## See also

- [DESIGN-TOKENS-REFERENCE.md](./DESIGN-TOKENS-REFERENCE.md) — generated tables for org vs hub color roles and all `--p31-*` variables.

## JSON editing

Change **only** `p31-universal-canon.json`, then from P31 home run `npm run apply:p31-style` and redeploy hub CSS (and your org copy, if not using the same deployed file).
