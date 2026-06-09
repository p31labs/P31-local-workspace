# POCKET CARD MAINTENANCE — Claude Code Instructions
## File: `pocket-card.html` (repo root)

---

## What It Is
Single-file mobile-first HTML operational reference. No build step, no dependencies.
Opens in any browser. Checkboxes persist via localStorage. Print-friendly CSS included.

## P31 Brand Colors (match brand.js)
```
coral:  #D94F3B   (primary accent, headings, top bar)
teal:   #2A9D8F   (success/secondary)
dark:   #0a0a14   (background)
```

## How to Update

### When a CWP closes:
Move the item from the active section to "COMPLETED TODAY" (or archive section).
Change `<div class="check">` to `<div class="check done">` and add `checked disabled` to the input.

### When a new deadline is discovered:
Add to KEY DATES section. Format:
```html
<div class="item"><span class="val red">Mon DD</span> <span class="label" style="display:inline">Description</span></div>
```
Colors: `red` = this week, `yellow` = this month, no class = later.

### When a grant dies:
Add `struck` class to the val and wrap the label in `<span style="text-decoration:line-through">`.
Add `<span class="badge dead">DEAD — REASON</span>`.

### When a new endpoint deploys:
Add to FLEET grid:
```html
<a href="https://URL" target="_blank"><span class="dot new"></span>Name</a>
```
Dots: `.on` = green (live), `.pending` = yellow, `.new` = coral (just deployed).
Update the fleet count in the section header and footer.
After ~1 day, change `.new` to `.on`.

### When waiting-on-others items resolve:
Move from PENDING EXTERNAL to COMPLETED or update status inline.

### When financial numbers change:
Update the FINANCIAL card. Keep all numbers approximate with `~` prefix.

### Date stamp:
Always update the `.sub` line and the `.footer` with the current date/time.

## Badge Classes
```html
<span class="badge sent">SENT</span>       <!-- green -->
<span class="badge review">IN REVIEW</span> <!-- yellow -->
<span class="badge dead">DEAD</span>        <!-- red -->
<span class="badge new">NEW</span>          <!-- coral -->
```

## Quick Copy Section
Each item uses `onclick="navigator.clipboard.writeText('VALUE')"`.
When a new identifier is issued (UEI, control number, etc.), add a row.

## Testing
Open in browser. Verify:
1. Top gradient bar renders (coral → teal → purple)
2. Checkboxes save state on reload
3. Copy buttons work (tap, check clipboard)
4. Fleet links open in new tabs
5. Print preview shows white background with readable text

## When to Regenerate vs Edit
- **Edit**: Single value changes (EIN, dates, status badges)
- **Regenerate**: Major restructuring (new sections, layout changes)
- **Never change**: The K₄ SVG topology diagram (unless vertex structure changes)

## Deployment
Just commit to repo. It's a static file. Can also be served as a Cloudflare Pages asset.
Optional: add to Carrie Agent as a tab for mobile operator access.
