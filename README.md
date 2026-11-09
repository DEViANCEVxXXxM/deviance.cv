<!--
  ██████╗ ███████╗██╗   ██╗██╗ █████╗ ███╗   ██╗ ██████╗███████╗
  ██╔══██╗██╔════╝██║   ██║██║██╔══██╗████╗  ██║██╔════╝██╔════╝
  ██║  ██║█████╗  ██║   ██║██║███████║██╔██╗ ██║██║     █████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝██║██╔══██║██║╚██╗██║██║     ██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██║██║  ██║██║ ╚████║╚██████╗███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
  .CV
-->

# `[SYS://DEVIANCE.CV]`

> **RAW. EXPOSED. LOAD-BEARING.**
> A personal portfolio / CV built like a machine—no soft edges, no hidden wiring.

```
+---------------------------------------------------------------+
|  PROJECT : DEVIANCE.CV                                        |
|  TYPE    : STATIC SITE / PORTFOLIO / CV                       |
|  STATUS  : [ OPEN TO WORK ]                                   |
|  OWNER   : NIKITA REPRINTSEV / TASHKENT, UZ                   |
|  COORD   : 41.3038° N / 69.2418° E / UTC+05                   |
|  REF     : CV-26/01                                           |
|  STACK   : HTML / CSS / JAVASCRIPT (NO FRAMEWORK)             |
+---------------------------------------------------------------+
```

---

## `>> ACCESS`

**Local preview** (some embedded pages require HTTP, not `file://`):

```bash
python -m http.server
# then open http://localhost:8000
```

The site ships with three embedded pages that will not render correctly from a raw file system:

- `pages/disc-viz.html`
- `pages/slab-field.html`
- `pages/game-snk.html`

---

## `>> FILE_TREE`

```
deviance.cv/
├── assets/
├── pages/
│   ├── disc-viz.html
│   ├── game-snk.html
│   └── slab-field.html
├── scripts/
│   ├── boot.js
│   ├── console.js
│   ├── contact-fx.js
│   ├── deco.js
│   ├── hero-fx.js
│   ├── menu-fx.js
│   ├── page-modules.js
│   ├── pages-router.js
│   ├── topbar-fx.js
│   └── ui.js
├── styles/
│   ├── deco.css
│   ├── main.css
│   ├── overlays.css
│   └── page.css
├── favicon.ico
├── index.html
└── README.md
```

---

## `>> MODULES`

| MODULE | FUNCTION | LOCATION |
|---|---|---|
| **HERO** | Landing / identity block | `index.html` |
| **WORK** | Experience log | `index.html` |
| **STACK** | Capabilities matrix | `index.html` |
| **PROJECTS** | Selected cases | `index.html` |
| **ABOUT** | Dossier | `index.html` |
| **DISC//VIZ** | Embedded visual page | `pages/disc-viz.html` |
| **SLAB FIELD** | Embedded visual page | `pages/slab-field.html` |
| **GAME//SNK** | Embedded game page | `pages/game-snk.html` |
| **CONSOLE** | System-style UI layer | `scripts/console.js` |
| **CONTACT-FX** | Contact interaction FX | `scripts/contact-fx.js` |

---

## `>> DESIGN_NOTES`

This is **cyberbrutalism** in practice:

- **Structure is visible.** Grid lines, section numbers, and system prompts are part of the interface.
- **Type is massive and raw.** Mono, uppercase, no apology.
- **Glitch is intentional.** UI elements behave like broken system output—decoratively repurposed.
- **No framework. No padding.** HTML, CSS, JS shipped directly.
- **ASCII and pixel logic.** Embraced over polish.

---

## `>> RUN / DEPLOY`

1. Clone the repository.
2. Serve the root directory with any static HTTP server.
3. Open the assigned port.
4. **Do not** open `index.html` directly via `file://` if you want embedded modules to function.

```bash
git clone https://github.com/DEViANCEVxXXxM/deviance.cv.git
cd deviance.cv
python -m http.server 8000
```

---

## `>> CONTACT`

```
+---------------------------------------------------------------+
|  MAIL   : deviancevxxxxm@gmail.com                            |
|  LOC    : TASHKENT / UTC+05                                   |
|  STATUS : OPEN TO WORK                                        |
|  © 2026 DEVIANCE                                              |
+---------------------------------------------------------------+
```

---

```
[END OF README]
[RETURN 0]
```
