// Auto-generated from cli/tokens/tokens.yml + components.yml + p31-icon-pack/icons
// DO NOT EDIT — run: node workers/design-mcp/build.mjs

export const tokens = {
  "version": "3.0-quantum",
  "metadata": {
    "name": "p31-quantum",
    "description": "P31 Labs Quantum Design System — mathematically perfect, visually breathtaking",
    "philosophy": "Everything derives from 16px × (4/3)^n, timed to 863 Hz.\nOne base. One ratio. Infinite scale.\n",
    "canonical_constants": {
      "base_unit": "16px",
      "tetrahedral_ratio": 1.3333,
      "golden_ratio": 1.618,
      "larmor_hz": 863,
      "sic_povm_overlap": 0.3333,
      "k4_vertices": 4,
      "beta_squared": 1,
      "ei_number": "42-1888158"
    }
  },
  "root": {
    "base_unit": {
      "$value": "16px",
      "$type": "dimension"
    },
    "tetrahedral_ratio": {
      "$value": 1.3333,
      "$type": "number"
    },
    "golden_ratio": {
      "$value": 1.618,
      "$type": "number"
    },
    "larmor_hz": {
      "$value": 863,
      "$type": "number"
    },
    "sic_povm_overlap": {
      "$value": 0.3333,
      "$type": "number"
    },
    "k4_vertices": {
      "$value": 4,
      "$type": "number"
    },
    "beta_squared": {
      "$value": 1,
      "$type": "number"
    }
  },
  "scale": {
    "xs": {
      "$value": "calc(var(--p31-base) * 0.75)",
      "$type": "dimension",
      "$description": "Step -1: 12px",
      "usage": "small text, compact padding"
    },
    "sm": {
      "$value": "var(--p31-base)",
      "$type": "dimension",
      "$description": "Step 0: 16px",
      "usage": "body text, base grid unit"
    },
    "md": {
      "$value": "calc(var(--p31-base) * 1.3333)",
      "$type": "dimension",
      "$description": "Step +1: 21px",
      "usage": "small headings, button heights"
    },
    "lg": {
      "$value": "calc(var(--p31-base) * 1.7777)",
      "$type": "dimension",
      "$description": "Step +2: 28px",
      "usage": "medium headings, card padding"
    },
    "xl": {
      "$value": "calc(var(--p31-base) * 2.3703)",
      "$type": "dimension",
      "$description": "Step +3: 38px",
      "usage": "large headings, modal padding"
    },
    "2xl": {
      "$value": "calc(var(--p31-base) * 3.1604)",
      "$type": "dimension",
      "$description": "Step +4: 50px",
      "usage": "hero title min, header height region"
    },
    "3xl": {
      "$value": "calc(var(--p31-base) * 4.2139)",
      "$type": "dimension",
      "$description": "Step +5: 67px",
      "usage": "display banners, major section gaps"
    },
    "4xl": {
      "$value": "calc(var(--p31-base) * 5.6186)",
      "$type": "dimension",
      "$description": "Step +6: 90px",
      "usage": "mega displays, hero section padding"
    }
  },
  "spacing": {
    "xs": {
      "$value": "clamp(var(--p31-scale-xs), 1vw, var(--p31-scale-sm))",
      "$type": "dimension",
      "usage": "tiny gaps, micro-spacing"
    },
    "sm": {
      "$value": "clamp(var(--p31-scale-sm), 1.5vw, var(--p31-scale-md))",
      "$type": "dimension",
      "usage": "small component gaps"
    },
    "md": {
      "$value": "clamp(var(--p31-scale-md), 2.5vw, var(--p31-scale-lg))",
      "$type": "dimension",
      "usage": "standard component spacing"
    },
    "lg": {
      "$value": "clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl))",
      "$type": "dimension",
      "usage": "medium section spacing"
    },
    "xl": {
      "$value": "clamp(var(--p31-scale-xl), 5vw, var(--p31-scale-2xl))",
      "$type": "dimension",
      "usage": "large section spacing"
    },
    "2xl": {
      "$value": "clamp(var(--p31-scale-2xl), 6.5vw, var(--p31-scale-3xl))",
      "$type": "dimension",
      "usage": "hero section padding"
    },
    "3xl": {
      "$value": "clamp(var(--p31-scale-3xl), 8vw, var(--p31-scale-4xl))",
      "$type": "dimension",
      "usage": "page-level spacing"
    }
  },
  "typography": {
    "base_unit": {
      "$value": "var(--p31-base)",
      "$type": "dimension"
    },
    "scale_ratio": {
      "$value": 1.3333,
      "$type": "number"
    },
    "font_family": {
      "sans": {
        "$value": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        "$type": "fontFamily"
      },
      "mono": {
        "$value": "ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
        "$type": "fontFamily"
      },
      "inter": {
        "$value": "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        "$type": "fontFamily",
        "$description": "Modern, tech-forward sans-serif for p31ca (the edgy twin)"
      },
      "atkinson": {
        "$value": "'Atkinson Hyperlegible', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        "$type": "fontFamily",
        "$description": "Accessibility-first sans-serif for phosphorus31 (the accessible twin)"
      }
    },
    "size": {
      "caption": {
        "$value": "clamp(var(--p31-scale-xs), 0.8vw, var(--p31-scale-sm))",
        "$type": "dimension",
        "usage": "meta text, footnotes"
      },
      "body": {
        "$value": "clamp(calc(var(--p31-base) * 0.95), 1vw + 0.5rem, var(--p31-scale-sm))",
        "$type": "dimension",
        "usage": "primary reading text"
      },
      "label": {
        "$value": "var(--p31-scale-sm)",
        "$type": "dimension",
        "usage": "form labels, UI text"
      },
      "h3": {
        "$value": "clamp(var(--p31-scale-md), 2vw, var(--p31-scale-lg))",
        "$type": "dimension",
        "usage": "subsection headings"
      },
      "h2": {
        "$value": "clamp(var(--p31-scale-lg), 3.5vw, var(--p31-scale-xl))",
        "$type": "dimension",
        "usage": "section headings"
      },
      "h1": {
        "$value": "clamp(var(--p31-scale-xl), 5.6vw, var(--p31-scale-2xl))",
        "$type": "dimension",
        "usage": "page headings, hero titles"
      },
      "display": {
        "$value": "clamp(var(--p31-scale-2xl), 7vw, var(--p31-scale-3xl))",
        "$type": "dimension",
        "usage": "large displays, mega text"
      }
    },
    "line_height": {
      "tight": {
        "$value": 1.1,
        "$type": "number",
        "usage": "headings"
      },
      "normal": {
        "$value": 1.6,
        "$type": "number",
        "usage": "body text"
      },
      "loose": {
        "$value": 1.8,
        "$type": "number",
        "usage": "accessible reading"
      }
    },
    "letter_spacing": {
      "tight": {
        "$value": "-0.02em",
        "$type": "string",
        "usage": "display text"
      },
      "normal": {
        "$value": "0em",
        "$type": "string",
        "usage": "body, headings"
      },
      "wide": {
        "$value": "0.05em",
        "$type": "string",
        "usage": "special emphasis"
      }
    },
    "weight": {
      "light": {
        "$value": 300,
        "$type": "number"
      },
      "normal": {
        "$value": 400,
        "$type": "number"
      },
      "medium": {
        "$value": 500,
        "$type": "number"
      },
      "semibold": {
        "$value": 600,
        "$type": "number"
      },
      "bold": {
        "$value": 700,
        "$type": "number"
      },
      "extrabold": {
        "$value": 800,
        "$type": "number"
      }
    }
  },
  "color": {
    "quantum": {
      "cyan": {
        "$value": "oklch(65% 0.18 195)",
        "$type": "color",
        "$description": "Hue 195° — primary accent",
        "usage": "primary accent, UI focus"
      },
      "violet": {
        "$value": "oklch(65% 0.18 285)",
        "$type": "color",
        "$description": "Hue 285° — secondary accent",
        "usage": "secondary accent, gradients"
      },
      "amber": {
        "$value": "oklch(65% 0.18 15)",
        "$type": "color",
        "$description": "Hue 15° — warmth, warning",
        "usage": "warning, special states"
      },
      "emerald": {
        "$value": "oklch(65% 0.18 105)",
        "$type": "color",
        "$description": "Hue 105° — success, growth",
        "usage": "success, positive states"
      }
    },
    "surface": {
      "bg": {
        "$value": "oklch(12% 0.01 240)",
        "$type": "color",
        "usage": "page background"
      },
      "card": {
        "$value": "oklch(18% 0.015 240)",
        "$type": "color",
        "usage": "card backgrounds"
      },
      "border": {
        "$value": "oklch(28% 0.02 240)",
        "$type": "color",
        "usage": "borders, dividers"
      }
    },
    "text": {
      "primary": {
        "$value": "oklch(96% 0.005 240)",
        "$type": "color",
        "usage": "primary text content"
      },
      "secondary": {
        "$value": "oklch(75% 0.01 240)",
        "$type": "color",
        "usage": "secondary text, UI labels"
      },
      "muted": {
        "$value": "oklch(65% 0.01 240)",
        "$type": "color",
        "usage": "disabled, inactive states"
      },
      "subtle": {
        "$value": "oklch(45% 0.01 240)",
        "$type": "color",
        "usage": "minimally visible hints"
      }
    },
    "semantic": {
      "success": {
        "$value": "{color.quantum.emerald}",
        "$type": "color"
      },
      "warning": {
        "$value": "{color.quantum.amber}",
        "$type": "color"
      },
      "error": {
        "$value": "oklch(65% 0.18 20)",
        "$type": "color"
      },
      "info": {
        "$value": "{color.quantum.cyan}",
        "$type": "color"
      }
    }
  },
  "animation": {
    "larmor_hz": {
      "$value": 863,
      "$type": "number"
    },
    "duration": {
      "fast": {
        "$value": "100ms",
        "$type": "duration",
        "usage": "micro-interactions, hovers"
      },
      "normal": {
        "$value": "300ms",
        "$type": "duration",
        "usage": "transitions, fades, slides"
      },
      "slow": {
        "$value": "500ms",
        "$type": "duration",
        "usage": "entrance animations, modals"
      }
    },
    "easing": {
      "smooth": {
        "$value": "cubic-bezier(0.4, 0, 0.2, 1)",
        "$type": "string",
        "usage": "default ease"
      },
      "snappy": {
        "$value": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "$type": "string",
        "usage": "bounce"
      },
      "linear": {
        "$value": "linear",
        "$type": "string",
        "usage": "no easing"
      }
    },
    "k4_vertex_pulse": {
      "duration": {
        "$value": "2000ms",
        "$type": "duration"
      },
      "easing": {
        "$value": "cubic-bezier(0.4, 0, 0.2, 1)",
        "$type": "string"
      },
      "min_radius": {
        "$value": "5px",
        "$type": "dimension"
      },
      "max_radius": {
        "$value": "7px",
        "$type": "dimension"
      },
      "stagger_offset": {
        "$value": "300ms",
        "$type": "duration"
      }
    },
    "k4_edge_draw": {
      "duration": {
        "$value": "3000ms",
        "$type": "duration"
      },
      "easing": {
        "$value": "linear",
        "$type": "string"
      },
      "delay_offset": {
        "$value": "500ms",
        "$type": "duration"
      }
    },
    "k4_orbit": {
      "duration": {
        "$value": "12000ms",
        "$type": "duration"
      },
      "easing": {
        "$value": "linear",
        "$type": "string"
      }
    }
  },
  "shadow": {
    "none": {
      "$value": "none",
      "$type": "shadow"
    },
    "xs": {
      "$value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "$type": "shadow",
      "usage": "subtle depth"
    },
    "sm": {
      "$value": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      "$type": "shadow",
      "usage": "cards, small elevation"
    },
    "md": {
      "$value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "$type": "shadow",
      "usage": "medium elevation, popovers"
    },
    "lg": {
      "$value": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      "$type": "shadow",
      "usage": "modals, dropdowns"
    },
    "glow": {
      "$value": "0 0 20px rgba(0, 240, 255, 0.4)",
      "$type": "shadow",
      "usage": "focus states, emphasis"
    }
  },
  "border": {
    "width": {
      "thin": {
        "$value": "1px",
        "$type": "dimension"
      },
      "normal": {
        "$value": "2px",
        "$type": "dimension"
      },
      "thick": {
        "$value": "3px",
        "$type": "dimension"
      }
    },
    "radius": {
      "none": {
        "$value": "0",
        "$type": "dimension"
      },
      "xs": {
        "$value": "calc(var(--p31-scale-xs) / 2)",
        "$type": "dimension"
      },
      "sm": {
        "$value": "calc(var(--p31-scale-sm) / 2)",
        "$type": "dimension"
      },
      "md": {
        "$value": "calc(var(--p31-scale-md) / 2)",
        "$type": "dimension"
      },
      "lg": {
        "$value": "calc(var(--p31-scale-lg) / 2)",
        "$type": "dimension"
      },
      "xl": {
        "$value": "calc(var(--p31-scale-xl) / 2)",
        "$type": "dimension"
      },
      "full": {
        "$value": "9999px",
        "$type": "dimension"
      }
    }
  },
  "breakpoints": {
    "mobile": {
      "$value": "0px",
      "$type": "dimension"
    },
    "tablet": {
      "$value": "768px",
      "$type": "dimension"
    },
    "desktop": {
      "$value": "1024px",
      "$type": "dimension"
    },
    "wide": {
      "$value": "1440px",
      "$type": "dimension"
    },
    "ultrawide": {
      "$value": "1920px",
      "$type": "dimension"
    }
  },
  "primitive": {
    "color": {
      "cyan": {
        "$value": "oklch(65% 0.18 195)",
        "$type": "color"
      },
      "violet": {
        "$value": "oklch(65% 0.18 285)",
        "$type": "color"
      },
      "gold": {
        "$value": "oklch(65% 0.18 15)",
        "$type": "color"
      },
      "green": {
        "$value": "oklch(65% 0.18 105)",
        "$type": "color"
      },
      "red": {
        "$value": "oklch(65% 0.18 20)",
        "$type": "color"
      },
      "iris": {
        "$value": "oklch(65% 0.18 270)",
        "$type": "color"
      },
      "void_deep": {
        "$value": "oklch(8% 0.01 240)",
        "$type": "color"
      },
      "void": {
        "$value": "oklch(10% 0.01 240)",
        "$type": "color"
      },
      "surface": {
        "$value": "oklch(15% 0.015 240)",
        "$type": "color"
      },
      "surface2": {
        "$value": "oklch(22% 0.02 240)",
        "$type": "color"
      },
      "text_primary": {
        "$value": "oklch(96% 0.005 240)",
        "$type": "color"
      },
      "text_secondary": {
        "$value": "oklch(75% 0.01 240)",
        "$type": "color"
      },
      "text_tertiary": {
        "$value": "oklch(55% 0.01 240)",
        "$type": "color"
      },
      "glass_surface": {
        "$value": "oklch(100% 0.01 240 / 0.04)",
        "$type": "color"
      },
      "glass_border": {
        "$value": "oklch(100% 0.01 240 / 0.08)",
        "$type": "color"
      },
      "glass_border_hover": {
        "$value": "oklch(100% 0.01 240 / 0.15)",
        "$type": "color"
      },
      "glass_surface_strong": {
        "$value": "oklch(100% 0.01 240 / 0.08)",
        "$type": "color"
      },
      "glass_surface_subtle": {
        "$value": "oklch(100% 0.01 240 / 0.03)",
        "$type": "color"
      }
    },
    "spacing": {
      "xs": {
        "$value": "{spacing.xs}",
        "$type": "dimension"
      },
      "sm": {
        "$value": "{spacing.sm}",
        "$type": "dimension"
      },
      "md": {
        "$value": "{spacing.md}",
        "$type": "dimension"
      },
      "lg": {
        "$value": "{spacing.lg}",
        "$type": "dimension"
      },
      "xl": {
        "$value": "{spacing.xl}",
        "$type": "dimension"
      },
      "xxl": {
        "$value": "{spacing.2xl}",
        "$type": "dimension"
      }
    },
    "radius": {
      "sm": {
        "$value": "{border.radius.sm}",
        "$type": "dimension"
      },
      "md": {
        "$value": "{border.radius.md}",
        "$type": "dimension"
      },
      "lg": {
        "$value": "{border.radius.lg}",
        "$type": "dimension"
      },
      "xl": {
        "$value": "{border.radius.xl}",
        "$type": "dimension"
      },
      "full": {
        "$value": "9999px",
        "$type": "dimension"
      }
    },
    "typography": {
      "font_sans": {
        "$value": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        "$type": "fontFamily"
      },
      "font_mono": {
        "$value": "ui-monospace, SFMono-Regular, 'Fira Code', 'Fira Mono', 'Roboto Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
        "$type": "fontFamily"
      }
    },
    "blur": {
      "subtle": {
        "$value": "8px",
        "$type": "dimension"
      },
      "standard": {
        "$value": "12px",
        "$type": "dimension"
      },
      "strong": {
        "$value": "24px",
        "$type": "dimension"
      }
    },
    "shadow": {
      "glass": {
        "$value": "0 8px 32px rgba(0,0,0,0.15)",
        "$type": "shadow"
      },
      "glow_cyan": {
        "$value": "0 0 20px rgba(0,240,255,0.25)",
        "$type": "shadow"
      },
      "glow_cyan_hover": {
        "$value": "0 0 30px rgba(0,240,255,0.4)",
        "$type": "shadow"
      }
    }
  },
  "semantic": {
    "color": {
      "background": {
        "default": "{primitive.color.void}",
        "alt": "{primitive.color.surface}"
      },
      "accent": {
        "default": "{primitive.color.cyan}",
        "variant": "{primitive.color.violet}",
        "gold": "{primitive.color.gold}",
        "green": "{primitive.color.green}",
        "red": "{primitive.color.red}",
        "iris": "{primitive.color.iris}"
      },
      "text": {
        "primary": "{primitive.color.text_primary}",
        "secondary": "{primitive.color.text_secondary}",
        "tertiary": "{primitive.color.text_tertiary}"
      }
    }
  },
  "component": {
    "glass_panel": {
      "background": "{primitive.color.glass_surface}",
      "backdrop_filter": "blur({primitive.blur.standard})",
      "webkit_backdrop_filter": "blur({primitive.blur.standard})",
      "border": "1px solid {primitive.color.glass_border}",
      "border_radius": "{primitive.radius.xl}",
      "box_shadow": "{primitive.shadow.glass}"
    },
    "header_candy": {
      "background": "rgba(57,255,20,0.12)",
      "backdrop_filter": "blur(16px)",
      "webkit_backdrop_filter": "blur(16px)",
      "border": "1px solid rgba(0,240,255,0.8)",
      "border_radius": "16px",
      "box_shadow": "0 0 30px rgba(0,240,255,0.25), inset 0 0 20px rgba(57,255,20,0.15)",
      "max_width": "1440px",
      "padding_x": "16px",
      "padding_y": "4px",
      "offset_top": "12px"
    },
    "crown_xs": {
      "width": "calc(var(--p31-base) * 2.5)",
      "height": "calc(var(--p31-base) * 2.5)"
    },
    "spoon_icon": {
      "width": "18px",
      "height": "18px",
      "gap": "calc(var(--p31-base) * 0.25)"
    },
    "glass_card": {
      "background": "{primitive.color.glass_surface}",
      "backdrop_filter": "blur({primitive.blur.standard})",
      "webkit_backdrop_filter": "blur({primitive.blur.standard})",
      "border": "1px solid {primitive.color.glass_border}",
      "border_radius": "{primitive.radius.xl}",
      "padding": "{primitive.spacing.lg}",
      "box_shadow": "{primitive.shadow.glass}",
      "border_hover": "{primitive.color.glass_border_hover}"
    },
    "glass_strong": {
      "background": "{primitive.color.glass_surface_strong}",
      "backdrop_filter": "blur({primitive.blur.strong})",
      "webkit_backdrop_filter": "blur({primitive.blur.strong})",
      "border": "1px solid rgba(255,255,255,0.12)",
      "border_radius": "{primitive.radius.xl}"
    },
    "glass_subtle": {
      "background": "{primitive.color.glass_surface_subtle}",
      "backdrop_filter": "blur({primitive.blur.subtle})",
      "webkit_backdrop_filter": "blur({primitive.blur.subtle})",
      "border": "1px solid rgba(255,255,255,0.06)",
      "border_radius": "{primitive.radius.xl}"
    },
    "btn_primary": {
      "background": "{semantic.color.accent.default}",
      "color": "{primitive.color.void}",
      "font_weight": "700",
      "padding": "{primitive.spacing.sm} {primitive.spacing.lg}",
      "border_radius": "{primitive.radius.md}",
      "font_size": "14px",
      "box_shadow": "{primitive.shadow.glow_cyan}"
    },
    "btn_secondary": {
      "background": "rgba(255,255,255,0.06)",
      "color": "{semantic.color.text.primary}",
      "font_weight": "600",
      "padding": "{primitive.spacing.sm} {primitive.spacing.lg}",
      "border_radius": "{primitive.radius.md}",
      "border": "1px solid rgba(255,255,255,0.1)",
      "font_size": "14px"
    },
    "btn_ghost": {
      "color": "{semantic.color.text.secondary}",
      "font_weight": "600",
      "padding": "{primitive.spacing.sm} {primitive.spacing.lg}",
      "border_radius": "{primitive.radius.md}",
      "font_size": "14px"
    }
  },
  "theme": {
    "light": {
      "background": {
        "default": "#F8FAFC",
        "alt": "#FFFFFF"
      },
      "text": {
        "primary": "#0F172A",
        "secondary": "rgba(15,23,42,0.6)",
        "tertiary": "rgba(15,23,42,0.3)"
      },
      "glass_surface": "rgba(0,0,0,0.03)",
      "glass_border": "rgba(0,0,0,0.08)",
      "glass_border_hover": "rgba(0,0,0,0.15)"
    }
  },
  "bounding_boxes": {
    "icon_xs": {
      "width": "calc(var(--p31-base) * 1)",
      "height": "calc(var(--p31-base) * 1)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Very small icon (status dots, inline badges)",
      "usage": "status-indicator, badge"
    },
    "icon_sm": {
      "width": "calc(var(--p31-base) * 1.3333)",
      "height": "calc(var(--p31-base) * 1.3333)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Small icon (inline with text, nav icons)",
      "usage": "nav-link-icon, button-icon"
    },
    "icon_md": {
      "width": "calc(var(--p31-base) * 2)",
      "height": "calc(var(--p31-base) * 2)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Medium icon (feature cards, section headers)",
      "usage": "feature-card-icon, section-icon"
    },
    "icon_lg": {
      "width": "calc(var(--p31-base) * 2.5)",
      "height": "calc(var(--p31-base) * 2.5)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Large icon (brand crown in header, hero icons)",
      "usage": "brand-mark, header-crown"
    },
    "icon_xl": {
      "width": "calc(var(--p31-base) * 4)",
      "height": "calc(var(--p31-base) * 4)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Extra large icon (hero crown, standalone graphic)",
      "usage": "hero-crown, feature-hero"
    },
    "icon_favicon": {
      "width": "calc(var(--p31-base) * 12)",
      "height": "calc(var(--p31-base) * 12)",
      "container_display": "block",
      "container_width": "100%",
      "container_height": "100%",
      "description": "Favicon / app icon (browser tabs, mobile home screen)",
      "usage": "favicon, app-icon, pwa-icon"
    }
  },
  "layout_containers": {
    "header": {
      "height": "calc(var(--p31-base) * 3)",
      "padding_y": "calc(var(--p31-base) * 0.25)",
      "gap": "{scale.md}",
      "align_items": "center",
      "justify_content": "space-between",
      "max_width": "1440px",
      "margin": "0 auto",
      "display": "flex",
      "description": "Primary navigation header. Fixed height. Flex container. No child component may exceed height.",
      "forbidden_child_properties": [
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",
        "margin",
        "transform: translateY",
        "position: relative",
        "top",
        "bottom"
      ],
      "allowed_child_properties": [
        "display: block",
        "width: 100%",
        "height: 100%"
      ]
    },
    "page_body": {
      "max_width": "1200px",
      "margin": "0 auto",
      "padding_x": "{scale.md}",
      "gap": "{scale.lg}",
      "description": "Main content area. Predictable padding and gaps derived from scale."
    },
    "section_hero": {
      "padding_x": "{scale.md}",
      "padding_top": "calc(var(--p31-scale-xl) * 0.5)",
      "padding_bottom": "{scale.xl}",
      "gap": "{scale.lg}",
      "max_width": "1200px",
      "margin": "0 auto",
      "description": "Hero section. Consistent spacing from tokens."
    },
    "section_features": {
      "padding_x": "{scale.md}",
      "padding_top": "{scale.xl}",
      "padding_bottom": "{scale.xl}",
      "display": "grid",
      "grid_template_columns": "repeat(auto-fill, minmax(280px, 1fr))",
      "gap": "{scale.md}",
      "max_width": "1200px",
      "margin": "0 auto",
      "description": "Feature grid. Uses grid layout with consistent gap."
    },
    "footer": {
      "padding_x": "{scale.md}",
      "padding_y": "{scale.md}",
      "border_top": "1px solid rgba(255,255,255,0.08)",
      "max_width": "1440px",
      "margin": "0 auto",
      "description": "Site footer. Bordered top, consistent padding, full-width cap."
    }
  },
  "spacing_rules": {
    "component_forbidden_properties": [
      "marginTop",
      "marginBottom",
      "marginLeft",
      "marginRight",
      "margin",
      "transform: translateY",
      "transform: translateX",
      "transform: translate",
      "position: relative",
      "position: absolute",
      "top",
      "bottom",
      "left",
      "right",
      "display: inline-block"
    ],
    "component_forbidden_description": "Components do not declare external spacing. Only templates do.",
    "template_allowed_properties": [
      "gap",
      "padding",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "paddingX",
      "paddingY",
      "align-items",
      "justify-content",
      "display: flex",
      "display: grid",
      "grid_template_columns",
      "grid_template_rows",
      "max_width",
      "margin: 0 auto"
    ],
    "template_allowed_description": "Templates control all external spacing. Components control only internal geometry.",
    "component_allowed_internal_properties": [
      "background",
      "backgroundColor",
      "border",
      "borderColor",
      "borderRadius",
      "boxShadow",
      "color",
      "fill",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "height",
      "lineHeight",
      "opacity",
      "overflow",
      "padding",
      "stroke",
      "textAlign",
      "textDecoration",
      "textTransform",
      "transition",
      "width",
      "zIndex"
    ],
    "component_allowed_description": "These properties control internal appearance only. They do not affect layout positioning."
  },
  "cascade_layers": {
    "order": [
      "reset",
      "tokens",
      "components",
      "templates",
      "overrides"
    ],
    "description": "Templates always override component styling cleanly without !important specificity wars.\nThis eliminates the need for !important hacks in Header.astro and other layout components.\n",
    "layer_definitions": {
      "reset": {
        "description": "Normalize CSS, base resets. Lowest priority.",
        "includes": "normalize.css, base.css"
      },
      "tokens": {
        "description": "Design tokens (CSS variables). Second lowest priority.",
        "includes": "tokens.css, all token files"
      },
      "components": {
        "description": "Component-specific styles. Default priority.",
        "includes": "component CSS, generated component styles"
      },
      "templates": {
        "description": "Template/layout styles. Higher priority than components.",
        "includes": "Header.astro styles, PageLayout.astro styles"
      },
      "overrides": {
        "description": "Highest priority. One-off overrides for specific pages. Use sparingly.",
        "includes": "page-specific styles, emergency fixes"
      }
    }
  },
  "svg_rules": {
    "enforce_bounding_box": true,
    "description": "All SVGs must fit inside a bounding box defined in bounding_boxes section.",
    "svgo_transform": {
      "removeViewBox": false,
      "trimToVisibleContent": true,
      "forceContainerAspect": true,
      "cleanupAttrs": true,
      "removeDoctype": true,
      "removeEmptyText": true,
      "removeEmptyContainers": true,
      "cleanupIDs": true,
      "convertShapeToPath": true,
      "moveGroupAttrsToElems": true,
      "collapseGroups": true,
      "sortAttrs": true,
      "description": "SVGO plugins to run on every SVG import. Automatically trims whitespace, tightens viewBox, and normalizes structure."
    },
    "viewBox_trimming": {
      "enabled": true,
      "padding": "2px",
      "trim_to_visible_bounds": true,
      "description": "Automatically recalculate viewBox to the visible bounding box of all paths. Removes descender whitespace."
    },
    "container_wrapping": {
      "enabled": true,
      "wrapper_display": "block",
      "wrapper_width": "100%",
      "wrapper_height": "100%",
      "description": "All SVGs are wrapped in a container that enforces the bounding box dimensions."
    }
  },
  "agent_prompt_injection": {
    "description": "This section is injected into Claude, Gemini, and Kilo prompts.",
    "claude": {
      "role": "React / Component Developer",
      "instruction": "When generating React components:\n1. Read the bounding_boxes section to know the exact dimensions of icons and SVG containers.\n2. NEVER use marginTop, marginBottom, or any forbidden property listed in spacing_rules.component_forbidden_properties.\n3. Always wrap SVGs in a container that matches the bounding box dimensions.\n4. Use internal styling only (component_allowed_internal_properties).\n5. Run your generated code through the SpatialValidator before submission.\n6. Use scale tokens (--p31-scale-*) for sizing. Derive everything from --p31-base.\n7. Use color.quantum tokens for accents, color.surface for backgrounds, color.text for typography.\n"
    },
    "gemini": {
      "role": "Layout / Template Designer",
      "instruction": "When designing page layouts and templates:\n1. Use the layout_containers section to define macro-architecture.\n2. Define slots with explicit bounding box expectations.\n3. Use only template_allowed_properties for external spacing.\n4. Understand that components cannot declare margin; spacing is your job.\n5. Respect the cascade_layers order — templates override components, not the other way around.\n6. Use scale tokens (--p31-scale-*) for spacing. Use spacing tokens (--p31-space-*) for gaps.\n7. Use typography.size tokens for font sizes. All are fluid clamp() values.\n"
    },
    "kilo": {
      "role": "Implementation / Execution Engine",
      "instruction": "When executing the build pipeline:\n1. Read the svg_rules section and run SVGO normalization on all SVG imports.\n2. Validate all components against the spacing_rules section using SpatialValidator.\n3. Fail the build if any component violates the rules.\n4. Ensure all generated code respects the cascade_layers order.\n5. Generate CSS from tokens using the export scripts in cli/tokens/.\n6. Run p31 health before deployment.\n"
    }
  },
  "examples": {
    "crown_svg": {
      "description": "Crown.svg — how it should be configured to fit icon_lg bounding box",
      "before": "<svg viewBox=\"0 0 200 200\" style={{ marginTop: '-4px' }}>  ← ❌ VIOLATION\n",
      "after": "<svg viewBox=\"0 18 200 164\" className=\"crown-svg\">  ← ✅ CLEAN\n",
      "notes": "- viewBox is trimmed to visible content (top whitespace removed)\n- No margin, marginTop, or transform hacks\n- SVG fills its 40×40 container naturally\n"
    },
    "header_example": {
      "description": "Header.astro — how to use the Header layout container",
      "code": "<div class=\"header-wrapper\">\n  <header class=\"header-container\">\n    <div class=\"header-brand-slot\">\n      <Crown />  ← Component with NO external spacing\n    </div>\n    <nav class=\"header-nav-slot\">\n      <a href=\"/\">Home</a>\n    </nav>\n    <div class=\"header-actions-slot\">\n      <SignInButton />  ← Component with NO external spacing\n    </div>\n  </header>\n</div>\n",
      "notes": "- Header container enforces height: calc(var(--p31-base) * 3) = 48px\n- All children are centered via align-items: center\n- Components have no margin, so alignment is perfect\n- No hacks needed\n"
    }
  },
  "property-overrides": {
    "$description": "Brand-specific semantic token overrides. Each brand inherits the full P31-Q token set and overrides only the values that express its unique personality.",
    "p31ca": {
      "$description": "The Forge — edgy, technical, experimental.",
      "semantic-color": {
        "primary": {
          "$value": "{color.quantum.cyan}"
        },
        "secondary": {
          "$value": "{color.quantum.violet}"
        }
      },
      "typography": {
        "font-family": "{typography.font_family.inter}"
      }
    },
    "phosphorus31": {
      "$description": "The Garden — accessible, trusted, public-facing non-profit.",
      "semantic-color": {
        "primary": {
          "$value": "{color.quantum.emerald}"
        },
        "secondary": {
          "$value": "{color.quantum.amber}"
        }
      },
      "typography": {
        "font-family": "{typography.font_family.atkinson}"
      },
      "nonprofit": {
        "trust_indicators": {
          "ein_badge": "501(c)(3) · EIN 42-1888158",
          "transparency_link": "/financials",
          "pilot_count_display": true
        },
        "conversion": {
          "cta_min_height": "48px",
          "cta_padding": "var(--p31-space-md) var(--p31-space-lg)",
          "donate_button_color": "var(--p31-color-emerald)",
          "volunteer_button_color": "var(--p31-color-amber)"
        },
        "accessibility": {
          "min_contrast_ratio": 4.5,
          "font_primary": "Atkinson Hyperlegible",
          "touch_target_min": "48px"
        }
      }
    }
  },
  "version_history": [
    {
      "version": 2,
      "date": "2026-07-23",
      "changes": [
        "Added bounding_boxes section (icon_xs → icon_xl)",
        "Added layout_containers section (header, page_body, section_hero, section_features)",
        "Added spacing_rules section with component_forbidden_properties and template_allowed_properties",
        "Added cascade_layers section with order and layer_definitions",
        "Added svg_rules section with SVGO transform specs and viewBox trimming",
        "Added agent_prompt_injection section for Claude, Gemini, and Kilo",
        "Added examples section with Crown and Header demonstrations"
      ],
      "author": "P31 Labs Engineering"
    },
    {
      "version": "3.0-quantum",
      "date": "2026-07-24",
      "changes": [
        "Added root constants (base_unit, tetrahedral_ratio, golden_ratio, larmor_hz)",
        "Added scale progression derived from 16px × (4/3)^n",
        "Migrated all colors to OKLCH perceptual color space",
        "Added spacing section with fluid clamp() values",
        "Added typography section with fluid clamp() formulas",
        "Added animation section with Larmor-derived durations",
        "Added border section with derived radius values",
        "Added breakpoints section",
        "Refactored bounding_boxes to use derived scale values",
        "Refactored layout_containers to use derived scale values",
        "Refactored component values to use token references",
        "Added usage metadata to all tokens for AI agent guidance",
        "Expanded agent_prompt_injection with quantum design patterns",
        "Migrated primitive colors to OKLCH for perceptual uniformity"
      ],
      "author": "P31 Labs Engineering"
    }
  ]
} as const;

export const components = {
  "version": "1.0",
  "components": {
    "GlassPanel": {
      "description": "Glassmorphic elevated surface with backdrop blur.",
      "css_class": "glass-panel",
      "aiGuidance": {
        "useWhen": "You need a top-level surface that separates content sections with depth.",
        "avoidWhen": "For compact inline content, use GlassCard or GlassSubtle instead.",
        "examples": [
          "Main content area wrapper",
          "Settings panel container"
        ]
      },
      "props": {
        "padding": {
          "type": "string",
          "default": "md",
          "options": [
            "sm",
            "md",
            "lg"
          ]
        }
      },
      "slots": [
        "default"
      ],
      "tokens": [
        "primitive.color.glass_surface",
        "primitive.color.glass_border",
        "primitive.color.surface2",
        "primitive.color.void_deep",
        "primitive.radius.xl",
        "primitive.radius.sm",
        "primitive.radius.lg",
        "primitive.shadow.glass",
        "primitive.spacing.xl",
        "primitive.spacing.xxl"
      ]
    },
    "GlassCard": {
      "description": "Compact glassmorphic card with padding.",
      "css_class": "glass-card",
      "aiGuidance": {
        "useWhen": "Displaying a single piece of content in a grid or list.",
        "avoidWhen": "For full-width sections, use GlassPanel instead.",
        "examples": [
          "Product card in a grid",
          "Info card in a dashboard"
        ]
      },
      "props": {
        "color": {
          "type": "string",
          "default": "accent",
          "options": [
            "accent",
            "violet",
            "gold",
            "green",
            "red"
          ]
        },
        "padding": {
          "type": "string",
          "default": "lg",
          "options": [
            "sm",
            "md",
            "lg"
          ]
        },
        "interactive": {
          "type": "boolean",
          "default": true
        }
      },
      "slots": [
        "default",
        "header"
      ],
      "tokens": [
        "primitive.color.glass_surface",
        "primitive.color.glass_border",
        "primitive.color.glass_border_hover",
        "primitive.color.surface2",
        "primitive.color.void_deep",
        "primitive.radius.xl",
        "primitive.radius.sm",
        "primitive.radius.lg",
        "primitive.radius.full",
        "primitive.shadow.glass",
        "primitive.shadow.glow_cyan_hover",
        "primitive.spacing.xs",
        "primitive.spacing.md",
        "primitive.spacing.xl",
        "primitive.spacing.xxl",
        "primitive.typography.font_sans",
        "semantic.color.background.alt",
        "semantic.color.accent.gold",
        "semantic.color.accent.red",
        "semantic.color.accent.iris"
      ]
    },
    "GlassStrong": {
      "description": "High-opacity glass surface with strong blur.",
      "css_class": "glass-strong",
      "aiGuidance": {
        "useWhen": "Overlaying on busy or high-contrast backgrounds where text must remain readable.",
        "avoidWhen": "On already-dark static backgrounds — use GlassSubtle or GlassCard instead.",
        "examples": [
          "Modal dialog backdrop",
          "Floating toolbar over starfield"
        ]
      },
      "props": {},
      "slots": [
        "default"
      ],
      "tokens": [
        "primitive.color.glass_surface_strong",
        "primitive.color.void_deep",
        "primitive.blur.strong",
        "primitive.radius.xl"
      ]
    },
    "GlassSubtle": {
      "description": "Low-opacity glass surface with subtle blur.",
      "css_class": "glass-subtle",
      "aiGuidance": {
        "useWhen": "Grouping related items without heavy visual weight.",
        "avoidWhen": "For primary content areas or high-priority information.",
        "examples": [
          "Secondary sidebar panel",
          "Input group wrapper"
        ]
      },
      "props": {},
      "slots": [
        "default"
      ],
      "tokens": [
        "primitive.color.glass_surface_subtle",
        "primitive.color.surface2",
        "primitive.blur.subtle",
        "primitive.radius.xl"
      ]
    },
    "Button": {
      "description": "Button component with primary, secondary, and ghost variants.",
      "css_class": "btn-primary",
      "aiGuidance": {
        "useWhen": "User needs to submit a form, confirm an action, or trigger a primary interaction.",
        "avoidWhen": "Navigating between pages — use a link or TetraGrid navigation item instead.",
        "examples": [
          "Submit order",
          "Save changes",
          "Confirm deletion"
        ]
      },
      "variants": [
        "btn-primary",
        "btn-secondary",
        "btn-ghost"
      ],
      "props": {
        "variant": {
          "type": "string",
          "default": "primary",
          "options": [
            "primary",
            "secondary",
            "ghost"
          ]
        },
        "size": {
          "type": "string",
          "default": "md",
          "options": [
            "sm",
            "md",
            "lg"
          ]
        }
      },
      "slots": [
        "default"
      ],
      "tokens": [
        "semantic.color.accent.default",
        "primitive.color.void",
        "primitive.color.void_deep",
        "primitive.color.surface2",
        "primitive.spacing.sm",
        "primitive.spacing.lg",
        "primitive.spacing.xl",
        "primitive.radius.md",
        "primitive.radius.sm",
        "primitive.radius.full",
        "primitive.shadow.glow_cyan",
        "primitive.typography.font_sans"
      ]
    },
    "SpoonMeter": {
      "description": "Real-time cognitive load indicator (0-5 scale).",
      "css_class": "spoon-meter",
      "aiGuidance": {
        "useWhen": "Displaying current spoon level, adjusting UI density, or triggering crisis mode.",
        "avoidWhen": "Decorative-only contexts where spoon state is irrelevant.",
        "examples": [
          "Header status bar",
          "Settings accessibility panel"
        ]
      },
      "props": {
        "current": {
          "type": "number",
          "default": 3,
          "range": [
            0,
            5
          ]
        },
        "interactive": {
          "type": "boolean",
          "default": true
        }
      },
      "slots": [],
      "tokens": [
        "semantic.color.accent.default",
        "semantic.color.accent.gold",
        "semantic.color.accent.red",
        "semantic.color.accent.iris",
        "semantic.color.text.tertiary",
        "primitive.typography.font_sans"
      ]
    },
    "TetraGrid": {
      "description": "4-column responsive grid for tetrahedral content layouts.",
      "css_class": "tetra-grid",
      "aiGuidance": {
        "useWhen": "Arranging 2-12 items in a responsive grid that collapses from 4 → 2 → 1 columns.",
        "avoidWhen": "For two-column layouts, use a custom CSS grid instead.",
        "examples": [
          "Icon gallery",
          "Feature cards",
          "Research paper list"
        ]
      },
      "props": {},
      "slots": [
        "default"
      ],
      "tokens": [
        "primitive.spacing.xs",
        "primitive.spacing.md",
        "primitive.spacing.xl",
        "primitive.spacing.xxl"
      ]
    },
    "HonestLabel": {
      "description": "Disclaimer badge for contested-science content.",
      "css_class": "honest-label",
      "aiGuidance": {
        "useWhen": "Marking content that requires scientific honesty or uncertainty disclosure.",
        "avoidWhen": "For standard status indicators, use StatusBadge instead.",
        "examples": [
          "Contested research claim",
          "Preliminary experimental result"
        ]
      },
      "props": {},
      "slots": [
        "default"
      ],
      "tokens": [
        "primitive.typography.font_mono",
        "primitive.typography.font_sans",
        "semantic.color.text.tertiary"
      ]
    },
    "StatusBadge": {
      "description": "Status indicator badge with Live/Beta/Research variants.",
      "css_class": "status-badge",
      "aiGuidance": {
        "useWhen": "Communicating deployment status, release stage, or research phase.",
        "avoidWhen": "For generic labels without status semantics.",
        "examples": [
          "Service health indicator",
          "Release stage tag",
          "Research phase marker"
        ]
      },
      "variants": [
        "status-badge-live",
        "status-badge-beta",
        "status-badge-research"
      ],
      "props": {
        "status": {
          "type": "string",
          "default": "live",
          "options": [
            "live",
            "beta",
            "research"
          ]
        }
      },
      "slots": [
        "default"
      ],
      "tokens": [
        "semantic.color.accent.green",
        "semantic.color.accent.default",
        "semantic.color.accent.variant",
        "semantic.color.accent.gold",
        "semantic.color.accent.red",
        "semantic.color.accent.iris",
        "primitive.radius.sm",
        "primitive.spacing.xs",
        "primitive.typography.font_sans"
      ]
    },
    "CrisisOverlay": {
      "description": "Full-screen breathing overlay shown when spoons=0.",
      "css_class": "crisis-overlay",
      "aiGuidance": {
        "useWhen": "User spoon level reaches 0; requires immediate calming UI with a single exit action.",
        "avoidWhen": "For non-emergency modals or informational popups.",
        "examples": [
          "Spoons depleted screen",
          "Sensory overload break"
        ]
      },
      "props": {
        "message": {
          "type": "string",
          "default": "Rest. Breathe. The mesh holds."
        },
        "buttonLabel": {
          "type": "string",
          "default": "I'm Ready"
        }
      },
      "slots": [],
      "tokens": [
        "semantic.color.background.default",
        "primitive.color.void_deep",
        "primitive.typography.font_sans"
      ]
    },
    "Starfield": {
      "description": "200-star twinkling canvas background with animation loop.",
      "css_class": "starfield",
      "aiGuidance": {
        "useWhen": "Adding ambient motion to the background of a hero or landing section.",
        "avoidWhen": "When spoons=0 or prefers-reduced-motion is active — performance and accessibility.",
        "examples": [
          "PHOS landing background",
          "Dashboard ambient layer"
        ]
      },
      "props": {
        "count": {
          "type": "number",
          "default": 200
        },
        "speed": {
          "type": "number",
          "default": 0.08
        }
      },
      "slots": [],
      "tokens": [
        "primitive.color.void_deep",
        "primitive.radius.full",
        "primitive.shadow.glow_cyan"
      ]
    },
    "ThemeToggle": {
      "description": "Dark/light theme toggle button. Persists to localStorage under p31:theme.",
      "css_class": "theme-toggle",
      "aiGuidance": {
        "useWhen": "Switching between dark and light visual themes in the header or settings.",
        "avoidWhen": "When the app is dark-only or when theme is controlled by system preference only.",
        "examples": [
          "Header theme switcher",
          "Accessibility settings"
        ]
      },
      "props": {},
      "slots": [],
      "tokens": [
        "semantic.color.background.default",
        "theme.light.background.default",
        "theme.light.background.alt",
        "theme.light.text.primary",
        "theme.light.text.secondary",
        "theme.light.text.tertiary",
        "theme.light.glass_surface",
        "theme.light.glass_border",
        "theme.light.glass_border_hover",
        "primitive.typography.font_sans"
      ]
    },
    "CandyHeader": {
      "description": "Canonical P31 candy-pill header bar with phosphorous-green glass, cyan border, and glow shadow.",
      "css_class": "candy-header",
      "aiGuidance": {
        "useWhen": "Top-of-page site navigation bar. Must use the canonical candy-pill glass styling.",
        "avoidWhen": "Inline headers within card content — use GlassCard or GlassPanel instead.",
        "examples": [
          "p31ca.org site header",
          "PHOS app shell header"
        ]
      },
      "props": {
        "brand": {
          "type": "string",
          "default": "p31ca",
          "options": [
            "p31ca",
            "phosphorus"
          ]
        }
      },
      "slots": [
        "default"
      ],
      "tokens": [
        "component.header_candy",
        "component.crown_xs",
        "component.spoon_icon",
        "primitive.color.cyan",
        "primitive.color.void"
      ]
    },
    "Crown": {
      "description": "Animated tetrahedral crown brand glyph for header and brand surfaces.",
      "css_class": "crown",
      "aiGuidance": {
        "useWhen": "Brand identity in headers, loading states, or empty states.",
        "avoidWhen": "Decorative-only contexts where brand is irrelevant.",
        "examples": [
          "Site nav brand mark",
          "App loading splash"
        ]
      },
      "props": {
        "size": {
          "type": "string",
          "default": "md",
          "options": [
            "xs",
            "sm",
            "md",
            "lg"
          ]
        },
        "brand": {
          "type": "string",
          "default": "p31ca",
          "options": [
            "p31ca",
            "phosphorus"
          ]
        }
      },
      "slots": [],
      "tokens": [
        "component.crown_xs",
        "primitive.color.cyan",
        "primitive.color.violet",
        "primitive.color.gold",
        "primitive.color.green",
        "primitive.color.iris"
      ]
    },
    "SpoonDial": {
      "description": "Icon-mode spoon meter for compact header placement, showing 5 SVG spoons with active/inactive opacity.",
      "css_class": "spoon-dial",
      "aiGuidance": {
        "useWhen": "Header spoon indicator where space is limited. Use mode=icon for compact display.",
        "avoidWhen": "Full-width settings panel — use SpoonMeter instead.",
        "examples": [
          "Site header right side",
          "Compact app bar"
        ]
      },
      "props": {
        "spoons": {
          "type": "number",
          "default": 3,
          "range": [
            0,
            5
          ]
        }
      },
      "slots": [],
      "tokens": [
        "component.spoon_icon",
        "semantic.color.accent.default",
        "primitive.color.text.tertiary"
      ]
    }
  }
} as const;

export const icons = [
  {
    "id": "k4-tetrahedron",
    "name": "K4 Tetrahedron",
    "file": "regular/k4-tetrahedron.svg",
    "description": "Foundational structure, sovereignty",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"K4 Tetrahedron animated icon\">\n  <title>K4 Tetrahedron</title>\n  <desc>A regular tetrahedron with glowing pulsing nodes representing sovereign foundational structure.</desc>\n  <style>\n    .k4-edge-p { stroke: var(--p31-accent, #00F0FF); stroke-width: 2; opacity: 0.4; stroke-dasharray: 200; stroke-dashoffset: 200; animation: edgeReveal 3s ease-out forwards; }\n    .k4-node-p { fill: var(--p31-accent, #00F0FF); }\n    .k4-node-s { fill: var(--p31-accent-violet, #A78BFA); }\n    .k4-node-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; }\n    .k4-center-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 105px; animation: centerPulse 4s infinite ease-in-out; }\n    .k4-group { transform-origin: 100px 105px; animation: slowRotate 30s infinite linear; }\n    @keyframes edgeReveal { to { stroke-dashoffset: 0; opacity: 0.7; } }\n    @keyframes centerPulse { 0%, 100% { transform: scale(0.9); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 14px var(--p31-accent, #00F0FF)); } }\n    @keyframes slowRotate { to { transform: rotate(360deg); } }\n    @media (prefers-reduced-motion: reduce) { .k4-edge-p { animation: none; stroke-dashoffset: 0; opacity: 0.5; } .k4-center-p, .k4-group { animation: none; } .k4-center-p { transform: scale(1); opacity: 0.8; } }\n  </style>\n  <g class=\"k4-group\">\n    <line x1=\"100\" y1=\"35\" x2=\"40\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"100\" y1=\"35\" x2=\"160\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"100\" y1=\"35\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"40\" y1=\"145\" x2=\"160\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"40\" y1=\"145\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"160\" y1=\"145\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <circle cx=\"100\" cy=\"35\" r=\"5\" class=\"k4-node-p\"/>\n    <circle cx=\"40\" cy=\"145\" r=\"5\" class=\"k4-node-s\"/>\n    <circle cx=\"160\" cy=\"145\" r=\"5\" class=\"k4-node-n\"/>\n    <circle cx=\"100\" cy=\"105\" r=\"10\" class=\"k4-center-p\"/>\n  </g>\n</svg>"
  },
  {
    "id": "molecule",
    "name": "Molecule / Atom",
    "file": "regular/molecule.svg",
    "description": "Bonding, quantum mechanics, care connections",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Molecule animated icon\">\n  <title>Molecule / Atom</title>\n  <desc>A central nucleus with elliptical orbits and rotating electrons representing bonding and quantum mechanics.</desc>\n  <style>\n    .mo-orb-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.35; }\n    .mo-sys { transform-origin: 100px 100px; animation: moSpin 30s infinite linear; }\n    .mo-core-p { fill: var(--p31-accent-green, #34D399); transform-origin: 100px 100px; animation: moPulse 2.5s infinite alternate ease-in-out; }\n    .mo-elec-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); }\n    @keyframes moSpin { to { transform: rotate(360deg); } }\n    @keyframes moPulse { 0% { transform: scale(0.9); filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); } 100% { transform: scale(1.12); filter: drop-shadow(0 0 14px var(--p31-accent-green, #34D399)); } }\n    @media (prefers-reduced-motion: reduce) { .mo-sys, .mo-core-p { animation: none; } .mo-core-p { transform: scale(1); opacity: 0.8; } }\n  </style>\n  <g class=\"mo-sys\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\"/>\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\" transform=\"rotate(60 100 100)\"/>\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\" transform=\"rotate(120 100 100)\"/>\n    <circle cx=\"175\" cy=\"100\" r=\"4.5\" class=\"mo-elec-n\"/>\n    <circle cx=\"62\" cy=\"35\" r=\"4.5\" class=\"mo-elec-n\"/>\n    <circle cx=\"62\" cy=\"165\" r=\"4.5\" class=\"mo-elec-n\"/>\n  </g>\n  <circle cx=\"100\" cy=\"100\" r=\"14\" class=\"mo-core-p\"/>\n</svg>"
  },
  {
    "id": "signal",
    "name": "Signal",
    "file": "regular/signal.svg",
    "description": "Coordination, communication, mesh signalling",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Signal animated icon\">\n  <title>Signal</title>\n  <desc>Radiating care signal with concentric elliptical waves representing coordination and communication in the P31 mesh.</desc>\n  <style>\n    .sg-wave { fill: none; stroke-width: 2; stroke-linecap: round; opacity: 0; }\n    .sg-wave-p { stroke: var(--p31-accent, #00F0FF); }\n    .sg-wave-s { stroke: var(--p31-accent-violet, #A78BFA); }\n    .sg-wave-n { stroke: var(--p31-text, #F5F5F7); opacity: 0.5; }\n    .sg-w1 { animation: sgRipple 4s infinite 0s; }\n    .sg-w2 { animation: sgRipple 4s infinite 0.8s; }\n    .sg-w3 { animation: sgRipple 4s infinite 1.6s; }\n    .sg-w4 { animation: sgRipple 4s infinite 2.4s; }\n    .sg-core-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: sgCore 2.5s infinite alternate ease-in-out; }\n    @keyframes sgRipple { 0% { transform: scale(0.1); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 0; } }\n    @keyframes sgCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 2px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.15); filter: drop-shadow(0 0 16px var(--p31-accent, #00F0FF)); } }\n    @media (prefers-reduced-motion: reduce) { .sg-wave, .sg-core-p { animation: none; } .sg-wave { opacity: 0.15; transform: scale(0.5); } .sg-core-p { transform: scale(1); } }\n  </style>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"20\" ry=\"50\" class=\"sg-wave sg-wave-p sg-w1\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"40\" ry=\"70\" class=\"sg-wave sg-wave-s sg-w2\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"60\" ry=\"90\" class=\"sg-wave sg-wave-n sg-w3\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"80\" ry=\"110\" class=\"sg-wave sg-wave-s sg-w4\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"10\" class=\"sg-core-p\"/>\n</svg>"
  },
  {
    "id": "mesh-node",
    "name": "Mesh Node",
    "file": "regular/mesh-node.svg",
    "description": "Mesh infrastructure, distributed nodes",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Mesh Node animated icon\">\n  <title>Mesh Node</title>\n  <desc>Interconnected nodes with streaming connections representing the distributed sovereign mesh infrastructure.</desc>\n  <style>\n    .ms-line-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.4; stroke-dasharray: 8 6; animation: msStream 15s infinite linear; }\n    .ms-line-d { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1; opacity: 0.15; }\n    .ms-node-n { fill: var(--p31-text, #F5F5F7); animation: msBlink 4s infinite alternate ease-in-out; }\n    .ms-node-n { fill: var(--p31-text, #F5F5F7); animation: msBlink 4s infinite alternate ease-in-out; }\n    .ms-center-p { fill: var(--p31-accent-red, #FB7185); transform-origin: 100px 100px; animation: msAura 2s infinite alternate ease-in-out; }\n    .nd-1 { animation-delay: 0s; }\n    .nd-2 { animation-delay: 0.5s; }\n    .nd-3 { animation-delay: 1s; }\n    .nd-4 { animation-delay: 1.5s; }\n    .nd-5 { animation-delay: 2s; }\n    @keyframes msStream { to { stroke-dashoffset: 200; } }\n    @keyframes msBlink { 0% { r: 3; opacity: 0.4; } 100% { r: 5; opacity: 1; filter: drop-shadow(0 0 5px var(--p31-text, #F5F5F7)); } }\n    @keyframes msAura { 0% { r: 9; filter: drop-shadow(0 0 4px var(--p31-accent-red, #FB7185)); } 100% { r: 12; filter: drop-shadow(0 0 20px var(--p31-accent-red, #FB7185)); } }\n    @media (prefers-reduced-motion: reduce) { .ms-line-s, .ms-node-n, .ms-center-p { animation: none; } .ms-center-p { r: 10; opacity: 0.8; } .ms-node-n { r: 4; opacity: 0.7; } }\n  </style>\n  <line x1=\"100\" y1=\"100\" x2=\"30\" y2=\"50\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"160\" y2=\"40\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"170\" y2=\"150\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"50\" y2=\"160\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"100\" y2=\"20\" class=\"ms-line-s\"/>\n  <line x1=\"30\" y1=\"50\" x2=\"100\" y2=\"20\" class=\"ms-line-d\"/>\n  <line x1=\"160\" y1=\"40\" x2=\"100\" y2=\"20\" class=\"ms-line-d\"/>\n  <line x1=\"50\" y1=\"160\" x2=\"170\" y2=\"150\" class=\"ms-line-d\"/>\n  <circle cx=\"30\" cy=\"50\" class=\"ms-node-n nd-1\"/>\n  <circle cx=\"160\" cy=\"40\" class=\"ms-node-n nd-2\"/>\n  <circle cx=\"170\" cy=\"150\" class=\"ms-node-n nd-3\"/>\n    <circle cx=\"50\" cy=\"160\" class=\"ms-node-n nd-4\"/>\n  <circle cx=\"100\" cy=\"20\" class=\"ms-node-n nd-5\"/>\n  <circle cx=\"100\" cy=\"100\" class=\"ms-center-p\"/>\n</svg>"
  },
  {
    "id": "spoon",
    "name": "Spoon",
    "file": "regular/spoon.svg",
    "description": "Cognitive capacity, spoon-aware design",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Spoon animated icon\">\n  <title>Spoon</title>\n  <desc>An elegant spoon swaying slightly with a glowing bowl, representing cognitive capacity and spoon-aware design.</desc>\n  <style>\n    .sp-group { transform-origin: 100px 30px; animation: spSway 8s infinite ease-in-out; }\n    .sp-bowl-p { fill: var(--p31-accent-iris, #818CF8); animation: spGlow 3s infinite alternate ease-in-out; }\n    .sp-handle-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 5; stroke-linecap: round; fill: none; }\n    .sp-rip { fill: none; stroke: var(--p31-accent-violet, #A78BFA); opacity: 0; transform-origin: 100px 145px; }\n    .sp-rip-1 { animation: spExpand 5s infinite ease-out; }\n    .sp-rip-2 { animation: spExpand 5s infinite ease-out; animation-delay: 2.5s; }\n    .sp-finial-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes spSway { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }\n    @keyframes spGlow { 0% { filter: drop-shadow(0 0 4px var(--p31-accent-iris, #818CF8)); opacity: 0.7; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-iris, #818CF8)); opacity: 1; } }\n    @keyframes spExpand { 0% { transform: scale(0.5); opacity: 0.8; stroke-width: 4; } 70% { transform: scale(2); opacity: 0; stroke-width: 1; } 100% { opacity: 0; } }\n    @media (prefers-reduced-motion: reduce) { .sp-group, .sp-bowl-p, .sp-rip { animation: none; } .sp-group { transform: rotate(0deg); } .sp-bowl-p { opacity: 0.8; } }\n  </style>\n  <g class=\"sp-group\">\n    <ellipse cx=\"100\" cy=\"145\" rx=\"22\" ry=\"32\" class=\"sp-rip sp-rip-1\"/>\n    <ellipse cx=\"100\" cy=\"145\" rx=\"22\" ry=\"32\" class=\"sp-rip sp-rip-2\"/>\n    <path d=\"M 100 30 Q 96 80 100 110\" class=\"sp-handle-s\"/>\n    <path d=\"M 100 110 Q 100 120 100 145\" class=\"sp-handle-s\" style=\"stroke-width:3\"/>\n    <ellipse cx=\"100\" cy=\"145\" rx=\"16\" ry=\"26\" class=\"sp-bowl-p\"/>\n    <circle cx=\"100\" cy=\"30\" r=\"6\" class=\"sp-finial-n\"/>\n  </g>\n</svg>"
  },
  {
    "id": "p31-wordmark",
    "name": "P31 Wordmark",
    "file": "regular/p31-wordmark.svg",
    "description": "Sovereign brand identity",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"P31 Wordmark animated icon\">\n  <title>P31 Wordmark</title>\n  <desc>Stylized P31 text surrounded by counter-rotating geometric rings representing sovereign brand identity.</desc>\n  <style>\n    .wm-text-p { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 64px; fill: var(--p31-accent-red, #FB7185); letter-spacing: -2px; }\n    .wm-glow { animation: wmGlow 3s infinite alternate ease-in-out; }\n    .wm-ring-o { fill: none; stroke: var(--p31-accent-red, #FB7185); stroke-width: 2; stroke-dasharray: 40 20; transform-origin: 100px 100px; animation: wmFwd 20s infinite linear; }\n    .wm-ring-i { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; stroke-dasharray: 10 10; opacity: 0.5; transform-origin: 100px 100px; animation: wmRev 15s infinite linear; }\n    .wm-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.7; }\n    @keyframes wmFwd { to { transform: rotate(360deg); } }\n    @keyframes wmRev { to { transform: rotate(-360deg); } }\n    @keyframes wmGlow { 0% { filter: drop-shadow(0 0 3px var(--p31-accent-red, #FB7185)); opacity: 0.85; } 100% { filter: drop-shadow(0 0 18px var(--p31-accent-red, #FB7185)); opacity: 1; } }\n    @media (prefers-reduced-motion: reduce) { .wm-ring-o, .wm-ring-i, .wm-glow { animation: none; } .wm-ring-o, .wm-ring-i { stroke-dashoffset: 0; } .wm-glow { opacity: 0.9; } }\n  </style>\n  <circle cx=\"100\" cy=\"100\" r=\"85\" class=\"wm-ring-o\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"72\" class=\"wm-ring-i\"/>\n  <text x=\"100\" y=\"122\" text-anchor=\"middle\" class=\"wm-text-p wm-glow\">P31</text>\n  <circle cx=\"100\" cy=\"45\" r=\"3\" class=\"wm-dot-n\"/>\n  <circle cx=\"100\" cy=\"155\" r=\"3\" class=\"wm-dot-n\"/>\n</svg>"
  },
  {
    "id": "love-heart",
    "name": "LOVE Heart",
    "file": "regular/love-heart.svg",
    "description": "Care economy, LOVE ledger",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"LOVE Heart animated icon\">\n  <title>LOVE Heart</title>\n  <desc>A geometric pulsing heart with an infinity-loop outline representing the care economy.</desc>\n  <style>\n    .lv-path-s { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 2; stroke-linecap: round; }\n    .lv-dash { stroke-dasharray: 12 16; animation: lvFlow 20s infinite linear; }\n    .lv-glow-p { fill: var(--p31-accent-violet, #A78BFA); transform-origin: 100px 100px; animation: lvBreath 4s infinite alternate ease-in-out; }\n    .lv-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes lvBreath { 0% { transform: scale(0.92); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent-violet, #A78BFA)); } 100% { transform: scale(1.04); opacity: 0.95; filter: drop-shadow(0 0 20px var(--p31-accent-violet, #A78BFA)); } }\n    @keyframes lvFlow { to { stroke-dashoffset: 400; } }\n    @media (prefers-reduced-motion: reduce) { .lv-glow-p, .lv-dash { animation: none; } .lv-glow-p { transform: scale(1); opacity: 0.8; } .lv-dash { stroke-dashoffset: 0; } }\n  </style>\n  <path d=\"M100 165 C 100 165, 20 100, 20 50 C 20 15, 70 10, 100 45 C 130 10, 180 15, 180 50 C 180 100, 100 165, 100 165 Z\" class=\"lv-path-s lv-dash\" opacity=\"0.6\"/>\n  <path d=\"M100 150 C 100 150, 40 95, 40 55 C 40 30, 65 20, 100 50 C 135 20, 160 30, 160 55 C 160 95, 100 150, 100 150 Z\" class=\"lv-glow-p\"/>\n  <circle cx=\"100\" cy=\"45\" r=\"4\" class=\"lv-dot-n\"/>\n  <circle cx=\"100\" cy=\"155\" r=\"3\" fill=\"var(--p31-accent, #00F0FF)\" opacity=\"0.6\"/>\n</svg>"
  },
  {
    "id": "863hz-resonance",
    "name": "863 Hz Resonance",
    "file": "regular/863hz-resonance.svg",
    "description": "Phosphorus-31 Larmor frequency, quantum resonance",
    "family": "regular",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-text"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"863 Hz Resonance animated icon\">\n  <title>863 Hz Resonance</title>\n  <desc>Concentric expanding rings with crossing sine waves representing the Larmor frequency of phosphorus-31.</desc>\n  <style>\n    .res-ring-p { fill: none; stroke: var(--p31-accent-gold, #FBBF24); stroke-width: 1.5; opacity: 0; transform-origin: 100px 100px; animation: ringPulse 6s infinite ease-out; }\n    .res-ring-1 { animation-delay: 0s; }\n    .res-ring-2 { animation-delay: 2s; }\n    .res-ring-3 { animation-delay: 4s; }\n    .res-wave-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 2; stroke-linecap: round; opacity: 0.5; }\n    .res-wave-1 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out; }\n    .res-wave-2 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out reverse; }\n    .res-core-p { fill: var(--p31-accent-gold, #FBBF24); transform-origin: 100px 100px; animation: coreOscillate 3s infinite alternate ease-in-out; }\n    .res-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes ringPulse { 0% { transform: scale(0.1); opacity: 1; stroke-width: 4; } 100% { transform: scale(1.05); opacity: 0; stroke-width: 1; } }\n    @keyframes waveOscillate { 0%, 100% { opacity: 0.3; transform: rotate(-3deg); } 50% { opacity: 0.7; transform: rotate(3deg); } }\n    @keyframes coreOscillate { 0% { filter: drop-shadow(0 0 2px var(--p31-accent-gold, #FBBF24)); opacity: 0.7; r: 8; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-gold, #FBBF24)); opacity: 1; r: 11; } }\n    @media (prefers-reduced-motion: reduce) { .res-ring-p { animation: none; opacity: 0.15; transform: scale(0.5); } .res-wave-1, .res-wave-2 { animation: none; opacity: 0.4; } .res-core-p { animation: none; opacity: 0.8; r: 9; } }\n  </style>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-1\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-2\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-3\"/>\n  <g class=\"res-wave-1\"><path d=\"M10 100 Q 55 40 100 100 T 190 100\" class=\"res-wave-s\"/></g>\n  <g class=\"res-wave-2\"><path d=\"M10 100 Q 55 160 100 100 T 190 100\" class=\"res-wave-s\"/></g>\n  <circle cx=\"100\" cy=\"100\" r=\"9\" class=\"res-core-p\"/>\n  <circle cx=\"100\" cy=\"50\" r=\"3\" class=\"res-dot-n\"/>\n</svg>"
  },
  {
    "id": "sovereign-crown",
    "name": "Sovereign Crown",
    "file": "advanced/sovereign-crown.svg",
    "description": "Sovereign authority, six-faceted leadership",
    "family": "advanced",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-accent-gold",
      "--p31-accent-green",
      "--p31-accent-iris",
      "--p31-accent-red"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Sovereign Crown animated icon\">\n  <title>Sovereign Crown</title>\n  <desc>A six-pointed sovereign crown with rotating accents, lighting nodes, and a radiant central jewel. 6-color palette.</desc>\n  <style>\n    .cr-crown { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }\n    .cr-c1 { fill: var(--p31-accent, #00F0FF); }\n    .cr-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .cr-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .cr-c4 { fill: var(--p31-accent-green, #34D399); }\n    .cr-c5 { fill: var(--p31-accent-iris, #818CF8); }\n    .cr-c6 { fill: var(--p31-accent-red, #FB7185); }\n    .cr-master { transition: filter 0.6s ease-in-out, opacity 0.6s ease-in-out; }\n    .cr-jewel { filter: drop-shadow(0 0 4px currentColor); transform-origin: 100px 100px; }\n    .cr-j1 { animation: crOrbit 16s infinite linear; }\n    .cr-j3 { animation: crOrbit 16s infinite linear; animation-delay: -5.33s; }\n    .cr-j5 { animation: crOrbit 16s infinite linear; animation-delay: -10.67s; }\n    .cr-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: crCore 3s infinite alternate ease-in-out; }\n    .cr-band { fill: none; stroke-width: 1.5; stroke-linecap: round; }\n    .cr-ring { fill: none; stroke-width: 1; opacity: 0.2; transform-origin: 100px 100px; }\n    .cr-b1 { stroke: var(--p31-accent, #00F0FF); animation: crBand 8s infinite linear; }\n    .cr-b2 { stroke: var(--p31-accent-violet, #A78BFA); animation: crBand 8s infinite linear reverse; }\n    .cr-b3 { stroke: var(--p31-accent-gold, #FBBF24); animation: crBand 8s infinite linear; }\n    @keyframes crOrbit { to { transform: rotate(360deg); } }\n    @keyframes crCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); filter: drop-shadow(0 0 20px var(--p31-accent, #00F0FF)); } }\n    @keyframes crBand { to { stroke-dashoffset: 400; } }\n    .cr-rotate { transform-origin: 100px 100px; animation: crRotate 30s infinite linear; }\n    @keyframes crRotate { to { transform: rotate(360deg); } }\n    .master-pulse .cr-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; opacity: 1 !important; }\n    @media (prefers-reduced-motion: reduce) { .cr-rotate, .cr-jewel, .cr-core, .cr-ring, .cr-band { animation: none; } .cr-core { r: 14; opacity: 0.9; } }\n  </style>\n  <!-- Static crown shape (stationary at top) -->\n  <g>\n    <path d=\"M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155\" class=\"cr-crown\" fill=\"none\" stroke=\"url(#crown-grad)\" stroke-width=\"2.5\"/>\n    <path d=\"M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155 Q 145 145 130 142 Q 115 139 100 139 Q 85 139 70 142 Q 55 145 40 155 Z\" fill=\"rgba(255,255,255,0.04)\"/>\n    <polygon points=\"100,19 108,38 128,38\" class=\"cr-c1\"/>\n    <polygon points=\"100,19 92,38 72,38\" class=\"cr-c2\"/>\n    <polygon points=\"70,38 78,55 92,38\" class=\"cr-c3\"/>\n    <polygon points=\"130,38 122,55 108,38\" class=\"cr-c4\"/>\n    <polygon points=\"72,38 85,60 100,58 92,38\" class=\"cr-c5\"/>\n    <polygon points=\"128,38 115,60 100,58 108,38\" class=\"cr-c6\"/>\n    <polygon points=\"100,52 108,70 100,82\" class=\"cr-c1\" opacity=\"0.7\"/>\n    <polygon points=\"100,52 92,70 100,82\" class=\"cr-c2\" opacity=\"0.7\"/>\n  </g>\n  <!-- Animated decorations (everything else moves) -->\n  <g class=\"cr-rotate\">\n    <circle cx=\"100\" cy=\"100\" r=\"88\" fill=\"none\" stroke=\"rgba(255,255,255,0.04)\" stroke-width=\"1\"/>\n    <!-- Removed outer dashed ring -->\n    <circle cx=\"100\" cy=\"100\" r=\"75\" class=\"cr-band cr-b1\" stroke-dasharray=\"60 30\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"72\" class=\"cr-band cr-b2\" stroke-dasharray=\"30 60\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"68\" class=\"cr-band cr-b3\" stroke-dasharray=\"50 50\"/>\n    <circle cx=\"100\" cy=\"38\" r=\"4.5\" class=\"cr-jewel cr-j1 cr-c3\"/>\n    <circle cx=\"130\" cy=\"38\" r=\"3.5\" class=\"cr-jewel cr-j3 cr-c6\"/>\n    <circle cx=\"144\" cy=\"75\" r=\"3\" class=\"cr-jewel cr-j5 cr-c4\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"16\" class=\"cr-core cr-master\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"11\" fill=\"none\" stroke=\"var(--p31-accent-violet, #A78BFA)\" stroke-width=\"1\" opacity=\"0.5\">\n      <animate attributeName=\"r\" from=\"11\" to=\"14\" dur=\"1.5s\" repeatCount=\"indefinite\"/>\n      <animate attributeName=\"opacity\" from=\"0.5\" to=\"0.2\" dur=\"1.5s\" repeatCount=\"indefinite\"/>\n    </circle>\n    <circle cx=\"100\" cy=\"100\" r=\"5\" fill=\"var(--p31-bg, #0A0A0F)\" opacity=\"0.9\"/>\n  </g>\n  <defs>\n    <linearGradient id=\"crown-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#00F0FF\" stop-opacity=\"0.9\"/>\n      <stop offset=\"25%\" stop-color=\"#A78BFA\" stop-opacity=\"0.9\"/>\n      <stop offset=\"50%\" stop-color=\"#FBBF24\" stop-opacity=\"0.8\"/>\n      <stop offset=\"75%\" stop-color=\"#818CF8\" stop-opacity=\"0.9\"/>\n      <stop offset=\"100%\" stop-color=\"#00F0FF\" stop-opacity=\"0.9\"/>\n    </linearGradient>\n  </defs>\n</svg>"
  },
  {
    "id": "prism-fold",
    "name": "Prism Fold",
    "file": "advanced/prism-fold.svg",
    "description": "Geometric transformation, multi-facet perspective",
    "family": "advanced",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-accent-gold",
      "--p31-accent-green",
      "--p31-accent-iris",
      "--p31-accent-red"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Prism Fold animated icon\">\n  <title>Prism Fold</title>\n  <desc>A 3D geometric hexagon with six triangular facets that unfold and refold. 6-color palette, center pivot.</desc>\n  <style>\n    .pf-facet { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }\n    .pf-c1 { fill: var(--p31-accent, #00F0FF); }\n    .pf-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .pf-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .pf-c4 { fill: var(--p31-accent-green, #34D399); }\n    .pf-c5 { fill: var(--p31-accent-iris, #818CF8); }\n    .pf-c6 { fill: var(--p31-accent-red, #FB7185); }\n    .pf-group { transform-origin: 100px 100px; animation: pfRotate 30s infinite linear; }\n    .pf-fold { transform-origin: var(--fx, 100px) var(--fy, 100px); animation: pfFold 4s infinite alternate ease-in-out; }\n    .pf-1 { --fx: 116px; --fy: 78px; animation-delay: 0s; }\n    .pf-2 { --fx: 100px; --fy: 72px; animation-delay: 0.5s; }\n    .pf-3 { --fx: 84px; --fy: 78px; animation-delay: 1s; }\n    .pf-4 { --fx: 87px; --fy: 110px; animation-delay: 1.5s; }\n    .pf-5 { --fx: 100px; --fy: 115px; animation-delay: 2s; }\n    .pf-6 { --fx: 113px; --fy: 110px; animation-delay: 2.5s; }\n    .pf-master { transition: opacity 0.4s ease, filter 0.4s ease; }\n    .pf-inner { fill: var(--p31-accent, #00F0FF); opacity: 0.1; transform-origin: 100px 100px; animation: pfInner 4s infinite alternate ease-in-out; }\n    @keyframes pfFold {\n      0% { transform: rotateX(0deg) rotateY(0deg); opacity: 0.55; stroke-width: 0.75; }\n      60% { transform: rotateX(35deg) rotateY(25deg); opacity: 1; stroke-width: 0.75; }\n      100% { transform: rotateX(25deg) rotateY(40deg); opacity: 0.55; stroke-width: 0.75; }\n    }\n    @keyframes pfInner { 0% { transform: scale(0.85); opacity: 0.05; } 100% { transform: scale(1.15); opacity: 0.16; } }\n    @keyframes pfRotate { to { transform: rotate(360deg); } }\n    @keyframes pfPulse { 0%, 100% { r: 46; opacity: 0.1; } 50% { r: 50; opacity: 0.2; } }\n    .pf-outer { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 1; opacity: 0.15; animation: pfPulse 3s infinite ease-in-out; transform-origin: 100px 100px; }\n    .master-pulse .pf-master { opacity: 0.35 !important; filter: drop-shadow(0 0 18px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .pf-group, .pf-fold, .pf-inner, .pf-master, .pf-outer { animation: none; } .pf-fold { transform: none; } .pf-inner { opacity: 0.1; } .pf-outer { opacity: 0.15; } }\n  </style>\n  <g class=\"pf-group\">\n    <circle cx=\"100\" cy=\"100\" r=\"46\" class=\"pf-outer\" stroke-dasharray=\"8 6\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"60\" class=\"pf-inner pf-master\"/>\n    <polygon points=\"100,60 120,80 100,100\" class=\"pf-facet pf-c1 pf-fold pf-1\"/>\n    <polygon points=\"100,60 100,80 80,80\" class=\"pf-facet pf-c2 pf-fold pf-2\"/>\n    <polygon points=\"80,80 100,100 80,110\" class=\"pf-facet pf-c3 pf-fold pf-3\"/>\n    <polygon points=\"100,100 80,110 100,120\" class=\"pf-facet pf-c4 pf-fold pf-4\"/>\n    <polygon points=\"100,100 100,120 120,110\" class=\"pf-facet pf-c5 pf-fold pf-5\"/>\n    <polygon points=\"100,100 120,110 120,80\" class=\"pf-facet pf-c6 pf-fold pf-6\"/>\n  </g>\n</svg>"
  },
  {
    "id": "nebula-burst",
    "name": "Nebula Burst",
    "file": "advanced/nebula-burst.svg",
    "description": "Emergence, chaos to structure, generative particles",
    "family": "advanced",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-accent-gold",
      "--p31-accent-green",
      "--p31-accent-iris",
      "--p31-accent-red"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Nebula Burst animated icon\">\n  <title>Nebula Burst</title>\n  <desc>A generative particle cloud with expanding wave rings, representing emergence and structure from chaos. 6-color palette.</desc>\n  <style>\n    .nb-ripple { fill: none; stroke-width: 1.5; stroke-linecap: round; opacity: 0; transform-origin: 100px 100px; }\n    .nb-r1 { stroke: var(--p31-accent, #00F0FF); animation: nbRipple 6s infinite ease-out; }\n    .nb-r2 { stroke: var(--p31-accent-violet, #A78BFA); animation: nbRipple 6s infinite ease-out 2s; }\n    .nb-r3 { stroke: var(--p31-accent-gold, #FBBF24); animation: nbRipple 6s infinite ease-out 4s; }\n    .nb-r4 { stroke: var(--p31-accent-green, #34D399); animation: nbRipple 6s infinite ease-out 6s; }\n    @keyframes nbRipple { 0% { transform: scale(0.05); opacity: 0.7; stroke-width: 4; } 100% { transform: scale(1); opacity: 0; stroke-width: 1; } }\n    .nb-dot { r: 2.5; animation: nbDrift var(--d, 8s) infinite alternate ease-in-out; }\n    .nb-dot:nth-child(6n+1) { fill: var(--p31-accent, #00F0FF); }\n    .nb-dot:nth-child(6n+2) { fill: var(--p31-accent-violet, #A78BFA); }\n    .nb-dot:nth-child(6n+3) { fill: var(--p31-accent-gold, #FBBF24); }\n    .nb-dot:nth-child(6n+4) { fill: var(--p31-accent-green, #34D399); }\n    .nb-dot:nth-child(6n+5) { fill: var(--p31-accent-red, #FB7185); }\n    .nb-dot:nth-child(6n+6) { fill: var(--p31-accent-iris, #818CF8); }\n    @keyframes nbDrift { 0% { transform: translate(0, 0); opacity: 0.3; } 100% { transform: translate(var(--tx, 20px), var(--ty, -20px)); opacity: 0.9; } }\n    .nb-master { transition: opacity 0.4s ease, filter 0.4s ease; }\n    .nb-cluster { transform-origin: 100px 100px; animation: nbCluster 28s infinite ease-in-out; }\n    @keyframes nbCluster { 0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(3deg) scale(1.02); } 75% { transform: rotate(-3deg) scale(0.98); } }\n    .master-pulse .nb-master { opacity: 0.9 !important; filter: drop-shadow(0 0 12px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .nb-ripple, .nb-dot, .nb-cluster { animation: none; } .nb-dot { opacity: 0.5; transform: none; } .nb-ripple { opacity: 0; } }\n  </style>\n    <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r1 nb-master\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r2\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r3\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r4\"/>\n  <g class=\"nb-cluster\">\n    <circle cx=\"100\" cy=\"40\" class=\"nb-dot\" style=\"--d:12s;--tx:15px;--ty:-10px\"/>\n    <circle cx=\"80\" cy=\"50\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:15px\"/>\n    <circle cx=\"120\" cy=\"45\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-8px\"/>\n    <circle cx=\"60\" cy=\"65\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:12px\"/>\n    <circle cx=\"140\" cy=\"60\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-12px\"/>\n    <circle cx=\"45\" cy=\"85\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"155\" cy=\"80\" class=\"nb-dot\" style=\"--d:13s;--tx:10px;--ty:-14px\"/>\n    <circle cx=\"35\" cy=\"105\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:6px\"/>\n    <circle cx=\"165\" cy=\"100\" class=\"nb-dot\" style=\"--d:14s;--tx:16px;--ty:-10px\"/>\n    <circle cx=\"40\" cy=\"125\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"160\" cy=\"120\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-6px\"/>\n    <circle cx=\"55\" cy=\"140\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"145\" cy=\"135\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-12px\"/>\n    <circle cx=\"75\" cy=\"150\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"125\" cy=\"148\" class=\"nb-dot\" style=\"--d:12s;--tx:10px;--ty:-10px\"/>\n    <circle cx=\"100\" cy=\"155\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:12px\"/>\n    <circle cx=\"90\" cy=\"35\" class=\"nb-dot\" style=\"--d:11s;--tx:8px;--ty:-15px\"/>\n    <circle cx=\"110\" cy=\"35\" class=\"nb-dot\" style=\"--d:9s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"50\" cy=\"100\" class=\"nb-dot\" style=\"--d:13s;--tx:16px;--ty:-8px\"/>\n    <circle cx=\"150\" cy=\"95\" class=\"nb-dot\" style=\"--d:7s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"95\" cy=\"60\" class=\"nb-dot\" style=\"--d:10s;--tx:12px;--ty:-12px\"/>\n    <circle cx=\"105\" cy=\"65\" class=\"nb-dot\" style=\"--d:8s;--tx:-14px;--ty:8px\"/>\n    <circle cx=\"70\" cy=\"90\" class=\"nb-dot\" style=\"--d:12s;--tx:10px;--ty:-10px\"/>\n    <circle cx=\"130\" cy=\"85\" class=\"nb-dot\" style=\"--d:6s;--tx:-8px;--ty:15px\"/>\n    <circle cx=\"85\" cy=\"115\" class=\"nb-dot\" style=\"--d:14s;--tx:14px;--ty:-6px\"/>\n    <circle cx=\"115\" cy=\"110\" class=\"nb-dot\" style=\"--d:9s;--tx:-12px;--ty:10px\"/>\n    <circle cx=\"75\" cy=\"130\" class=\"nb-dot\" style=\"--d:11s;--tx:8px;--ty:-14px\"/>\n    <circle cx=\"125\" cy=\"125\" class=\"nb-dot\" style=\"--d:7s;--tx:-10px;--ty:8px\"/>\n    <circle cx=\"100\" cy=\"75\" class=\"nb-dot\" style=\"--d:10s;--tx:15px;--ty:-10px\"/>\n    <circle cx=\"100\" cy=\"130\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:12px\"/>\n    <circle cx=\"65\" cy=\"105\" class=\"nb-dot\" style=\"--d:13s;--tx:10px;--ty:-8px\"/>\n    <circle cx=\"135\" cy=\"105\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:10px\"/>\n    <circle cx=\"90\" cy=\"90\" class=\"nb-dot\" style=\"--d:12s;--tx:8px;--ty:-12px\"/>\n    <circle cx=\"110\" cy=\"95\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"80\" cy=\"75\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-8px\"/>\n    <circle cx=\"120\" cy=\"135\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"100\" cy=\"50\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-14px\"/>\n    <circle cx=\"100\" cy=\"150\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"55\" cy=\"95\" class=\"nb-dot\" style=\"--d:14s;--tx:10px;--ty:-12px\"/>\n    <circle cx=\"145\" cy=\"100\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:10px\"/>\n    <circle cx=\"70\" cy=\"110\" class=\"nb-dot\" style=\"--d:13s;--tx:8px;--ty:-15px\"/>\n    <circle cx=\"130\" cy=\"115\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:8px\"/>\n  </g>\n</svg>"
  },
  {
    "id": "comet-orb",
    "name": "Comet Orb",
    "file": "advanced/comet-orb.svg",
    "description": "Swirling energy, harmonized orbital motion",
    "family": "advanced",
    "colors": [
      "--p31-accent",
      "--p31-accent-violet",
      "--p31-accent-gold",
      "--p31-accent-green",
      "--p31-accent-iris",
      "--p31-accent-red"
    ],
    "animated": true,
    "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Comet Orb animated icon\">\n  <title>Comet Orb</title>\n  <desc>Swirling energy orb with harmonized elliptical rings and orbiting particles. 6-color palette, 48s sync cycle.</desc>\n  <style>\n    .co-ring { fill: none; stroke-width: 1.5; stroke-linecap: round; }\n    .co-orbit-1 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }\n    .co-orbit-2 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }\n    .co-orbit-3 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }\n    .co-orbit-4 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }\n    .co-r1 { stroke: var(--p31-accent, #00F0FF); stroke-dasharray: 44 156; animation: coDash 4s infinite linear; }\n    .co-r2 { stroke: var(--p31-accent-violet, #A78BFA); stroke-dasharray: 39 141; animation: coDash 4s infinite linear; }\n    .co-r3 { stroke: var(--p31-accent-gold, #FBBF24); stroke-dasharray: 50 150; animation: coDash 4s infinite linear reverse; }\n    .co-r4 { stroke: var(--p31-accent-green, #34D399); stroke-dasharray: 27 153; animation: coDash 4s infinite linear reverse; }\n    .co-c1 { fill: var(--p31-accent, #00F0FF); }\n    .co-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .co-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .co-c4 { fill: var(--p31-accent-green, #34D399); }\n    .co-c5 { fill: var(--p31-accent-red, #FB7185); }\n    .co-c6 { fill: var(--p31-accent-iris, #818CF8); }\n    .co-particle { filter: drop-shadow(0 0 3px currentColor); }\n    .co-p1 { animation: coCw 16s infinite linear; }\n    .co-p2 { animation: coCcw 12s infinite linear; }\n    .co-p3 { animation: coCw 16s infinite linear; }\n    .co-p4 { animation: coCcw 12s infinite linear; }\n    .co-p5 { animation: coCw 16s infinite linear; animation-delay: 8s; }\n    .co-p6 { animation: coCcw 12s infinite linear; animation-delay: 6s; }\n    .co-master { transition: filter 0.6s ease-in-out; }\n    .co-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: coCore 2s infinite alternate ease-in-out; }\n    .co-trail { fill: none; stroke-width: 1; opacity: 0; }\n    .co-t1 { stroke: var(--p31-accent, #00F0FF); animation: coTrail 3s infinite ease-out; }\n    .co-t2 { stroke: var(--p31-accent-violet, #A78BFA); animation: coTrail 3s infinite ease-out; animation-delay: 1.5s; }\n    @keyframes coCw { to { transform: rotate(360deg); } }\n    @keyframes coCcw { to { transform: rotate(-360deg); } }\n    @keyframes coDash { to { stroke-dashoffset: 200; } }\n    @keyframes coCore { 0% { transform: scale(0.85); opacity: 0.8; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)); } }\n    @keyframes coTrail { 0% { opacity: 0.5; stroke-width: 2.5; } 100% { opacity: 0; stroke-width: 0; } }\n    .master-pulse .co-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .co-orbit-1, .co-orbit-2, .co-orbit-3, .co-orbit-4, .co-particle, .co-core, .co-trail, .co-ring { animation: none; } .co-ring { stroke-dashoffset: 0; opacity: 0.3; } .co-core { r: 10; } }\n  </style>\n  <g class=\"co-orbit-1\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"88\" ry=\"30\" class=\"co-ring co-r1\"/>\n    <path d=\"M 100 70 Q 140 70 185 100 Q 140 130 100 130\" class=\"co-trail co-t1\"/>\n    <circle cx=\"185\" cy=\"100\" r=\"3.5\" class=\"co-particle co-c1 co-p1\"/>\n  </g>\n  <g class=\"co-orbit-2\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"78\" ry=\"26\" class=\"co-ring co-r2\" transform=\"rotate(60 100 100)\"/>\n    <circle cx=\"51\" cy=\"27\" r=\"3\" class=\"co-particle co-c5 co-p2\"/>\n  </g>\n  <g class=\"co-orbit-3\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"66\" ry=\"22\" class=\"co-ring co-r3\" transform=\"rotate(120 100 100)\"/>\n    <path d=\"M 100 80 Q 50 80 15 100 Q 50 120 100 120\" class=\"co-trail co-t2\"/>\n    <circle cx=\"15\" cy=\"100\" r=\"4\" class=\"co-particle co-c3 co-p3\"/>\n  </g>\n  <g class=\"co-orbit-4\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"54\" ry=\"18\" class=\"co-ring co-r4\" transform=\"rotate(30 100 100)\"/>\n    <circle cx=\"158\" cy=\"64\" r=\"2.5\" class=\"co-particle co-c4 co-p4\"/>\n  </g>\n  <circle cx=\"100\" cy=\"100\" r=\"10\" class=\"co-core co-master\"/>\n  <circle cx=\"42\" cy=\"66\" r=\"3\" class=\"co-particle co-c6 co-p5\"/>\n  <circle cx=\"158\" cy=\"134\" r=\"3\" class=\"co-particle co-c2 co-p6\"/>\n</svg>"
  }
] as const;

export const iconCatalog: Record<string, { family: string; colors: string[]; animated: boolean; description: string; svg: string }> = {
    "k4-tetrahedron": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Foundational structure, sovereignty", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"K4 Tetrahedron animated icon\">\n  <title>K4 Tetrahedron</title>\n  <desc>A regular tetrahedron with glowing pulsing nodes representing sovereign foundational structure.</desc>\n  <style>\n    .k4-edge-p { stroke: var(--p31-accent, #00F0FF); stroke-width: 2; opacity: 0.4; stroke-dasharray: 200; stroke-dashoffset: 200; animation: edgeReveal 3s ease-out forwards; }\n    .k4-node-p { fill: var(--p31-accent, #00F0FF); }\n    .k4-node-s { fill: var(--p31-accent-violet, #A78BFA); }\n    .k4-node-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; }\n    .k4-center-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 105px; animation: centerPulse 4s infinite ease-in-out; }\n    .k4-group { transform-origin: 100px 105px; animation: slowRotate 30s infinite linear; }\n    @keyframes edgeReveal { to { stroke-dashoffset: 0; opacity: 0.7; } }\n    @keyframes centerPulse { 0%, 100% { transform: scale(0.9); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 14px var(--p31-accent, #00F0FF)); } }\n    @keyframes slowRotate { to { transform: rotate(360deg); } }\n    @media (prefers-reduced-motion: reduce) { .k4-edge-p { animation: none; stroke-dashoffset: 0; opacity: 0.5; } .k4-center-p, .k4-group { animation: none; } .k4-center-p { transform: scale(1); opacity: 0.8; } }\n  </style>\n  <g class=\"k4-group\">\n    <line x1=\"100\" y1=\"35\" x2=\"40\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"100\" y1=\"35\" x2=\"160\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"100\" y1=\"35\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"40\" y1=\"145\" x2=\"160\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"40\" y1=\"145\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <line x1=\"160\" y1=\"145\" x2=\"100\" y2=\"145\" class=\"k4-edge-p\"/>\n    <circle cx=\"100\" cy=\"35\" r=\"5\" class=\"k4-node-p\"/>\n    <circle cx=\"40\" cy=\"145\" r=\"5\" class=\"k4-node-s\"/>\n    <circle cx=\"160\" cy=\"145\" r=\"5\" class=\"k4-node-n\"/>\n    <circle cx=\"100\" cy=\"105\" r=\"10\" class=\"k4-center-p\"/>\n  </g>\n</svg>" },
    "molecule": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Bonding, quantum mechanics, care connections", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Molecule animated icon\">\n  <title>Molecule / Atom</title>\n  <desc>A central nucleus with elliptical orbits and rotating electrons representing bonding and quantum mechanics.</desc>\n  <style>\n    .mo-orb-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.35; }\n    .mo-sys { transform-origin: 100px 100px; animation: moSpin 30s infinite linear; }\n    .mo-core-p { fill: var(--p31-accent-green, #34D399); transform-origin: 100px 100px; animation: moPulse 2.5s infinite alternate ease-in-out; }\n    .mo-elec-n { fill: var(--p31-text, #F5F5F7); opacity: 0.9; filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); }\n    @keyframes moSpin { to { transform: rotate(360deg); } }\n    @keyframes moPulse { 0% { transform: scale(0.9); filter: drop-shadow(0 0 4px var(--p31-accent-green, #34D399)); } 100% { transform: scale(1.12); filter: drop-shadow(0 0 14px var(--p31-accent-green, #34D399)); } }\n    @media (prefers-reduced-motion: reduce) { .mo-sys, .mo-core-p { animation: none; } .mo-core-p { transform: scale(1); opacity: 0.8; } }\n  </style>\n  <g class=\"mo-sys\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\"/>\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\" transform=\"rotate(60 100 100)\"/>\n    <ellipse cx=\"100\" cy=\"100\" rx=\"75\" ry=\"25\" class=\"mo-orb-s\" transform=\"rotate(120 100 100)\"/>\n    <circle cx=\"175\" cy=\"100\" r=\"4.5\" class=\"mo-elec-n\"/>\n    <circle cx=\"62\" cy=\"35\" r=\"4.5\" class=\"mo-elec-n\"/>\n    <circle cx=\"62\" cy=\"165\" r=\"4.5\" class=\"mo-elec-n\"/>\n  </g>\n  <circle cx=\"100\" cy=\"100\" r=\"14\" class=\"mo-core-p\"/>\n</svg>" },
    "signal": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Coordination, communication, mesh signalling", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Signal animated icon\">\n  <title>Signal</title>\n  <desc>Radiating care signal with concentric elliptical waves representing coordination and communication in the P31 mesh.</desc>\n  <style>\n    .sg-wave { fill: none; stroke-width: 2; stroke-linecap: round; opacity: 0; }\n    .sg-wave-p { stroke: var(--p31-accent, #00F0FF); }\n    .sg-wave-s { stroke: var(--p31-accent-violet, #A78BFA); }\n    .sg-wave-n { stroke: var(--p31-text, #F5F5F7); opacity: 0.5; }\n    .sg-w1 { animation: sgRipple 4s infinite 0s; }\n    .sg-w2 { animation: sgRipple 4s infinite 0.8s; }\n    .sg-w3 { animation: sgRipple 4s infinite 1.6s; }\n    .sg-w4 { animation: sgRipple 4s infinite 2.4s; }\n    .sg-core-p { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: sgCore 2.5s infinite alternate ease-in-out; }\n    @keyframes sgRipple { 0% { transform: scale(0.1); opacity: 0.8; } 100% { transform: scale(1.1); opacity: 0; } }\n    @keyframes sgCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 2px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.15); filter: drop-shadow(0 0 16px var(--p31-accent, #00F0FF)); } }\n    @media (prefers-reduced-motion: reduce) { .sg-wave, .sg-core-p { animation: none; } .sg-wave { opacity: 0.15; transform: scale(0.5); } .sg-core-p { transform: scale(1); } }\n  </style>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"20\" ry=\"50\" class=\"sg-wave sg-wave-p sg-w1\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"40\" ry=\"70\" class=\"sg-wave sg-wave-s sg-w2\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"60\" ry=\"90\" class=\"sg-wave sg-wave-n sg-w3\"/>\n  <ellipse cx=\"100\" cy=\"100\" rx=\"80\" ry=\"110\" class=\"sg-wave sg-wave-s sg-w4\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"10\" class=\"sg-core-p\"/>\n</svg>" },
    "mesh-node": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Mesh infrastructure, distributed nodes", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Mesh Node animated icon\">\n  <title>Mesh Node</title>\n  <desc>Interconnected nodes with streaming connections representing the distributed sovereign mesh infrastructure.</desc>\n  <style>\n    .ms-line-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; opacity: 0.4; stroke-dasharray: 8 6; animation: msStream 15s infinite linear; }\n    .ms-line-d { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1; opacity: 0.15; }\n    .ms-node-n { fill: var(--p31-text, #F5F5F7); animation: msBlink 4s infinite alternate ease-in-out; }\n    .ms-node-n { fill: var(--p31-text, #F5F5F7); animation: msBlink 4s infinite alternate ease-in-out; }\n    .ms-center-p { fill: var(--p31-accent-red, #FB7185); transform-origin: 100px 100px; animation: msAura 2s infinite alternate ease-in-out; }\n    .nd-1 { animation-delay: 0s; }\n    .nd-2 { animation-delay: 0.5s; }\n    .nd-3 { animation-delay: 1s; }\n    .nd-4 { animation-delay: 1.5s; }\n    .nd-5 { animation-delay: 2s; }\n    @keyframes msStream { to { stroke-dashoffset: 200; } }\n    @keyframes msBlink { 0% { r: 3; opacity: 0.4; } 100% { r: 5; opacity: 1; filter: drop-shadow(0 0 5px var(--p31-text, #F5F5F7)); } }\n    @keyframes msAura { 0% { r: 9; filter: drop-shadow(0 0 4px var(--p31-accent-red, #FB7185)); } 100% { r: 12; filter: drop-shadow(0 0 20px var(--p31-accent-red, #FB7185)); } }\n    @media (prefers-reduced-motion: reduce) { .ms-line-s, .ms-node-n, .ms-center-p { animation: none; } .ms-center-p { r: 10; opacity: 0.8; } .ms-node-n { r: 4; opacity: 0.7; } }\n  </style>\n  <line x1=\"100\" y1=\"100\" x2=\"30\" y2=\"50\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"160\" y2=\"40\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"170\" y2=\"150\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"50\" y2=\"160\" class=\"ms-line-s\"/>\n  <line x1=\"100\" y1=\"100\" x2=\"100\" y2=\"20\" class=\"ms-line-s\"/>\n  <line x1=\"30\" y1=\"50\" x2=\"100\" y2=\"20\" class=\"ms-line-d\"/>\n  <line x1=\"160\" y1=\"40\" x2=\"100\" y2=\"20\" class=\"ms-line-d\"/>\n  <line x1=\"50\" y1=\"160\" x2=\"170\" y2=\"150\" class=\"ms-line-d\"/>\n  <circle cx=\"30\" cy=\"50\" class=\"ms-node-n nd-1\"/>\n  <circle cx=\"160\" cy=\"40\" class=\"ms-node-n nd-2\"/>\n  <circle cx=\"170\" cy=\"150\" class=\"ms-node-n nd-3\"/>\n    <circle cx=\"50\" cy=\"160\" class=\"ms-node-n nd-4\"/>\n  <circle cx=\"100\" cy=\"20\" class=\"ms-node-n nd-5\"/>\n  <circle cx=\"100\" cy=\"100\" class=\"ms-center-p\"/>\n</svg>" },
    "spoon": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Cognitive capacity, spoon-aware design", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Spoon animated icon\">\n  <title>Spoon</title>\n  <desc>An elegant spoon swaying slightly with a glowing bowl, representing cognitive capacity and spoon-aware design.</desc>\n  <style>\n    .sp-group { transform-origin: 100px 30px; animation: spSway 8s infinite ease-in-out; }\n    .sp-bowl-p { fill: var(--p31-accent-iris, #818CF8); animation: spGlow 3s infinite alternate ease-in-out; }\n    .sp-handle-s { stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 5; stroke-linecap: round; fill: none; }\n    .sp-rip { fill: none; stroke: var(--p31-accent-violet, #A78BFA); opacity: 0; transform-origin: 100px 145px; }\n    .sp-rip-1 { animation: spExpand 5s infinite ease-out; }\n    .sp-rip-2 { animation: spExpand 5s infinite ease-out; animation-delay: 2.5s; }\n    .sp-finial-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes spSway { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }\n    @keyframes spGlow { 0% { filter: drop-shadow(0 0 4px var(--p31-accent-iris, #818CF8)); opacity: 0.7; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-iris, #818CF8)); opacity: 1; } }\n    @keyframes spExpand { 0% { transform: scale(0.5); opacity: 0.8; stroke-width: 4; } 70% { transform: scale(2); opacity: 0; stroke-width: 1; } 100% { opacity: 0; } }\n    @media (prefers-reduced-motion: reduce) { .sp-group, .sp-bowl-p, .sp-rip { animation: none; } .sp-group { transform: rotate(0deg); } .sp-bowl-p { opacity: 0.8; } }\n  </style>\n  <g class=\"sp-group\">\n    <ellipse cx=\"100\" cy=\"145\" rx=\"22\" ry=\"32\" class=\"sp-rip sp-rip-1\"/>\n    <ellipse cx=\"100\" cy=\"145\" rx=\"22\" ry=\"32\" class=\"sp-rip sp-rip-2\"/>\n    <path d=\"M 100 30 Q 96 80 100 110\" class=\"sp-handle-s\"/>\n    <path d=\"M 100 110 Q 100 120 100 145\" class=\"sp-handle-s\" style=\"stroke-width:3\"/>\n    <ellipse cx=\"100\" cy=\"145\" rx=\"16\" ry=\"26\" class=\"sp-bowl-p\"/>\n    <circle cx=\"100\" cy=\"30\" r=\"6\" class=\"sp-finial-n\"/>\n  </g>\n</svg>" },
    "p31-wordmark": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Sovereign brand identity", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"P31 Wordmark animated icon\">\n  <title>P31 Wordmark</title>\n  <desc>Stylized P31 text surrounded by counter-rotating geometric rings representing sovereign brand identity.</desc>\n  <style>\n    .wm-text-p { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 64px; fill: var(--p31-accent-red, #FB7185); letter-spacing: -2px; }\n    .wm-glow { animation: wmGlow 3s infinite alternate ease-in-out; }\n    .wm-ring-o { fill: none; stroke: var(--p31-accent-red, #FB7185); stroke-width: 2; stroke-dasharray: 40 20; transform-origin: 100px 100px; animation: wmFwd 20s infinite linear; }\n    .wm-ring-i { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 1.5; stroke-dasharray: 10 10; opacity: 0.5; transform-origin: 100px 100px; animation: wmRev 15s infinite linear; }\n    .wm-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.7; }\n    @keyframes wmFwd { to { transform: rotate(360deg); } }\n    @keyframes wmRev { to { transform: rotate(-360deg); } }\n    @keyframes wmGlow { 0% { filter: drop-shadow(0 0 3px var(--p31-accent-red, #FB7185)); opacity: 0.85; } 100% { filter: drop-shadow(0 0 18px var(--p31-accent-red, #FB7185)); opacity: 1; } }\n    @media (prefers-reduced-motion: reduce) { .wm-ring-o, .wm-ring-i, .wm-glow { animation: none; } .wm-ring-o, .wm-ring-i { stroke-dashoffset: 0; } .wm-glow { opacity: 0.9; } }\n  </style>\n  <circle cx=\"100\" cy=\"100\" r=\"85\" class=\"wm-ring-o\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"72\" class=\"wm-ring-i\"/>\n  <text x=\"100\" y=\"122\" text-anchor=\"middle\" class=\"wm-text-p wm-glow\">P31</text>\n  <circle cx=\"100\" cy=\"45\" r=\"3\" class=\"wm-dot-n\"/>\n  <circle cx=\"100\" cy=\"155\" r=\"3\" class=\"wm-dot-n\"/>\n</svg>" },
    "love-heart": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Care economy, LOVE ledger", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"LOVE Heart animated icon\">\n  <title>LOVE Heart</title>\n  <desc>A geometric pulsing heart with an infinity-loop outline representing the care economy.</desc>\n  <style>\n    .lv-path-s { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 2; stroke-linecap: round; }\n    .lv-dash { stroke-dasharray: 12 16; animation: lvFlow 20s infinite linear; }\n    .lv-glow-p { fill: var(--p31-accent-violet, #A78BFA); transform-origin: 100px 100px; animation: lvBreath 4s infinite alternate ease-in-out; }\n    .lv-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes lvBreath { 0% { transform: scale(0.92); opacity: 0.6; filter: drop-shadow(0 0 4px var(--p31-accent-violet, #A78BFA)); } 100% { transform: scale(1.04); opacity: 0.95; filter: drop-shadow(0 0 20px var(--p31-accent-violet, #A78BFA)); } }\n    @keyframes lvFlow { to { stroke-dashoffset: 400; } }\n    @media (prefers-reduced-motion: reduce) { .lv-glow-p, .lv-dash { animation: none; } .lv-glow-p { transform: scale(1); opacity: 0.8; } .lv-dash { stroke-dashoffset: 0; } }\n  </style>\n  <path d=\"M100 165 C 100 165, 20 100, 20 50 C 20 15, 70 10, 100 45 C 130 10, 180 15, 180 50 C 180 100, 100 165, 100 165 Z\" class=\"lv-path-s lv-dash\" opacity=\"0.6\"/>\n  <path d=\"M100 150 C 100 150, 40 95, 40 55 C 40 30, 65 20, 100 50 C 135 20, 160 30, 160 55 C 160 95, 100 150, 100 150 Z\" class=\"lv-glow-p\"/>\n  <circle cx=\"100\" cy=\"45\" r=\"4\" class=\"lv-dot-n\"/>\n  <circle cx=\"100\" cy=\"155\" r=\"3\" fill=\"var(--p31-accent, #00F0FF)\" opacity=\"0.6\"/>\n</svg>" },
    "863hz-resonance": { family: "regular", colors: ["--p31-accent","--p31-accent-violet","--p31-text"], animated: true, description: "Phosphorus-31 Larmor frequency, quantum resonance", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"863 Hz Resonance animated icon\">\n  <title>863 Hz Resonance</title>\n  <desc>Concentric expanding rings with crossing sine waves representing the Larmor frequency of phosphorus-31.</desc>\n  <style>\n    .res-ring-p { fill: none; stroke: var(--p31-accent-gold, #FBBF24); stroke-width: 1.5; opacity: 0; transform-origin: 100px 100px; animation: ringPulse 6s infinite ease-out; }\n    .res-ring-1 { animation-delay: 0s; }\n    .res-ring-2 { animation-delay: 2s; }\n    .res-ring-3 { animation-delay: 4s; }\n    .res-wave-s { fill: none; stroke: var(--p31-accent-violet, #A78BFA); stroke-width: 2; stroke-linecap: round; opacity: 0.5; }\n    .res-wave-1 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out; }\n    .res-wave-2 { transform-origin: 100px 100px; animation: waveOscillate 8s infinite ease-in-out reverse; }\n    .res-core-p { fill: var(--p31-accent-gold, #FBBF24); transform-origin: 100px 100px; animation: coreOscillate 3s infinite alternate ease-in-out; }\n    .res-dot-n { fill: var(--p31-text, #F5F5F7); opacity: 0.8; }\n    @keyframes ringPulse { 0% { transform: scale(0.1); opacity: 1; stroke-width: 4; } 100% { transform: scale(1.05); opacity: 0; stroke-width: 1; } }\n    @keyframes waveOscillate { 0%, 100% { opacity: 0.3; transform: rotate(-3deg); } 50% { opacity: 0.7; transform: rotate(3deg); } }\n    @keyframes coreOscillate { 0% { filter: drop-shadow(0 0 2px var(--p31-accent-gold, #FBBF24)); opacity: 0.7; r: 8; } 100% { filter: drop-shadow(0 0 16px var(--p31-accent-gold, #FBBF24)); opacity: 1; r: 11; } }\n    @media (prefers-reduced-motion: reduce) { .res-ring-p { animation: none; opacity: 0.15; transform: scale(0.5); } .res-wave-1, .res-wave-2 { animation: none; opacity: 0.4; } .res-core-p { animation: none; opacity: 0.8; r: 9; } }\n  </style>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-1\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-2\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"res-ring-p res-ring-3\"/>\n  <g class=\"res-wave-1\"><path d=\"M10 100 Q 55 40 100 100 T 190 100\" class=\"res-wave-s\"/></g>\n  <g class=\"res-wave-2\"><path d=\"M10 100 Q 55 160 100 100 T 190 100\" class=\"res-wave-s\"/></g>\n  <circle cx=\"100\" cy=\"100\" r=\"9\" class=\"res-core-p\"/>\n  <circle cx=\"100\" cy=\"50\" r=\"3\" class=\"res-dot-n\"/>\n</svg>" },
    "sovereign-crown": { family: "advanced", colors: ["--p31-accent","--p31-accent-violet","--p31-accent-gold","--p31-accent-green","--p31-accent-iris","--p31-accent-red"], animated: true, description: "Sovereign authority, six-faceted leadership", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Sovereign Crown animated icon\">\n  <title>Sovereign Crown</title>\n  <desc>A six-pointed sovereign crown with rotating accents, lighting nodes, and a radiant central jewel. 6-color palette.</desc>\n  <style>\n    .cr-crown { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }\n    .cr-c1 { fill: var(--p31-accent, #00F0FF); }\n    .cr-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .cr-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .cr-c4 { fill: var(--p31-accent-green, #34D399); }\n    .cr-c5 { fill: var(--p31-accent-iris, #818CF8); }\n    .cr-c6 { fill: var(--p31-accent-red, #FB7185); }\n    .cr-master { transition: filter 0.6s ease-in-out, opacity 0.6s ease-in-out; }\n    .cr-jewel { filter: drop-shadow(0 0 4px currentColor); transform-origin: 100px 100px; }\n    .cr-j1 { animation: crOrbit 16s infinite linear; }\n    .cr-j3 { animation: crOrbit 16s infinite linear; animation-delay: -5.33s; }\n    .cr-j5 { animation: crOrbit 16s infinite linear; animation-delay: -10.67s; }\n    .cr-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: crCore 3s infinite alternate ease-in-out; }\n    .cr-band { fill: none; stroke-width: 1.5; stroke-linecap: round; }\n    .cr-ring { fill: none; stroke-width: 1; opacity: 0.2; transform-origin: 100px 100px; }\n    .cr-b1 { stroke: var(--p31-accent, #00F0FF); animation: crBand 8s infinite linear; }\n    .cr-b2 { stroke: var(--p31-accent-violet, #A78BFA); animation: crBand 8s infinite linear reverse; }\n    .cr-b3 { stroke: var(--p31-accent-gold, #FBBF24); animation: crBand 8s infinite linear; }\n    @keyframes crOrbit { to { transform: rotate(360deg); } }\n    @keyframes crCore { 0% { transform: scale(0.85); filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); filter: drop-shadow(0 0 20px var(--p31-accent, #00F0FF)); } }\n    @keyframes crBand { to { stroke-dashoffset: 400; } }\n    .cr-rotate { transform-origin: 100px 100px; animation: crRotate 30s infinite linear; }\n    @keyframes crRotate { to { transform: rotate(360deg); } }\n    .master-pulse .cr-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; opacity: 1 !important; }\n    @media (prefers-reduced-motion: reduce) { .cr-rotate, .cr-jewel, .cr-core, .cr-ring, .cr-band { animation: none; } .cr-core { r: 14; opacity: 0.9; } }\n  </style>\n  <!-- Static crown shape (stationary at top) -->\n  <g>\n    <path d=\"M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155\" class=\"cr-crown\" fill=\"none\" stroke=\"url(#crown-grad)\" stroke-width=\"2.5\"/>\n    <path d=\"M 40 155 Q 60 80 70 38 Q 85 18 100 19 Q 115 18 130 38 Q 140 80 160 155 Q 145 145 130 142 Q 115 139 100 139 Q 85 139 70 142 Q 55 145 40 155 Z\" fill=\"rgba(255,255,255,0.04)\"/>\n    <polygon points=\"100,19 108,38 128,38\" class=\"cr-c1\"/>\n    <polygon points=\"100,19 92,38 72,38\" class=\"cr-c2\"/>\n    <polygon points=\"70,38 78,55 92,38\" class=\"cr-c3\"/>\n    <polygon points=\"130,38 122,55 108,38\" class=\"cr-c4\"/>\n    <polygon points=\"72,38 85,60 100,58 92,38\" class=\"cr-c5\"/>\n    <polygon points=\"128,38 115,60 100,58 108,38\" class=\"cr-c6\"/>\n    <polygon points=\"100,52 108,70 100,82\" class=\"cr-c1\" opacity=\"0.7\"/>\n    <polygon points=\"100,52 92,70 100,82\" class=\"cr-c2\" opacity=\"0.7\"/>\n  </g>\n  <!-- Animated decorations (everything else moves) -->\n  <g class=\"cr-rotate\">\n    <circle cx=\"100\" cy=\"100\" r=\"88\" fill=\"none\" stroke=\"rgba(255,255,255,0.04)\" stroke-width=\"1\"/>\n    <!-- Removed outer dashed ring -->\n    <circle cx=\"100\" cy=\"100\" r=\"75\" class=\"cr-band cr-b1\" stroke-dasharray=\"60 30\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"72\" class=\"cr-band cr-b2\" stroke-dasharray=\"30 60\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"68\" class=\"cr-band cr-b3\" stroke-dasharray=\"50 50\"/>\n    <circle cx=\"100\" cy=\"38\" r=\"4.5\" class=\"cr-jewel cr-j1 cr-c3\"/>\n    <circle cx=\"130\" cy=\"38\" r=\"3.5\" class=\"cr-jewel cr-j3 cr-c6\"/>\n    <circle cx=\"144\" cy=\"75\" r=\"3\" class=\"cr-jewel cr-j5 cr-c4\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"16\" class=\"cr-core cr-master\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"11\" fill=\"none\" stroke=\"var(--p31-accent-violet, #A78BFA)\" stroke-width=\"1\" opacity=\"0.5\">\n      <animate attributeName=\"r\" from=\"11\" to=\"14\" dur=\"1.5s\" repeatCount=\"indefinite\"/>\n      <animate attributeName=\"opacity\" from=\"0.5\" to=\"0.2\" dur=\"1.5s\" repeatCount=\"indefinite\"/>\n    </circle>\n    <circle cx=\"100\" cy=\"100\" r=\"5\" fill=\"var(--p31-bg, #0A0A0F)\" opacity=\"0.9\"/>\n  </g>\n  <defs>\n    <linearGradient id=\"crown-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#00F0FF\" stop-opacity=\"0.9\"/>\n      <stop offset=\"25%\" stop-color=\"#A78BFA\" stop-opacity=\"0.9\"/>\n      <stop offset=\"50%\" stop-color=\"#FBBF24\" stop-opacity=\"0.8\"/>\n      <stop offset=\"75%\" stop-color=\"#818CF8\" stop-opacity=\"0.9\"/>\n      <stop offset=\"100%\" stop-color=\"#00F0FF\" stop-opacity=\"0.9\"/>\n    </linearGradient>\n  </defs>\n</svg>" },
    "prism-fold": { family: "advanced", colors: ["--p31-accent","--p31-accent-violet","--p31-accent-gold","--p31-accent-green","--p31-accent-iris","--p31-accent-red"], animated: true, description: "Geometric transformation, multi-facet perspective", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Prism Fold animated icon\">\n  <title>Prism Fold</title>\n  <desc>A 3D geometric hexagon with six triangular facets that unfold and refold. 6-color palette, center pivot.</desc>\n  <style>\n    .pf-facet { stroke: rgba(255,255,255,0.1); stroke-width: 0.75; stroke-linejoin: round; }\n    .pf-c1 { fill: var(--p31-accent, #00F0FF); }\n    .pf-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .pf-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .pf-c4 { fill: var(--p31-accent-green, #34D399); }\n    .pf-c5 { fill: var(--p31-accent-iris, #818CF8); }\n    .pf-c6 { fill: var(--p31-accent-red, #FB7185); }\n    .pf-group { transform-origin: 100px 100px; animation: pfRotate 30s infinite linear; }\n    .pf-fold { transform-origin: var(--fx, 100px) var(--fy, 100px); animation: pfFold 4s infinite alternate ease-in-out; }\n    .pf-1 { --fx: 116px; --fy: 78px; animation-delay: 0s; }\n    .pf-2 { --fx: 100px; --fy: 72px; animation-delay: 0.5s; }\n    .pf-3 { --fx: 84px; --fy: 78px; animation-delay: 1s; }\n    .pf-4 { --fx: 87px; --fy: 110px; animation-delay: 1.5s; }\n    .pf-5 { --fx: 100px; --fy: 115px; animation-delay: 2s; }\n    .pf-6 { --fx: 113px; --fy: 110px; animation-delay: 2.5s; }\n    .pf-master { transition: opacity 0.4s ease, filter 0.4s ease; }\n    .pf-inner { fill: var(--p31-accent, #00F0FF); opacity: 0.1; transform-origin: 100px 100px; animation: pfInner 4s infinite alternate ease-in-out; }\n    @keyframes pfFold {\n      0% { transform: rotateX(0deg) rotateY(0deg); opacity: 0.55; stroke-width: 0.75; }\n      60% { transform: rotateX(35deg) rotateY(25deg); opacity: 1; stroke-width: 0.75; }\n      100% { transform: rotateX(25deg) rotateY(40deg); opacity: 0.55; stroke-width: 0.75; }\n    }\n    @keyframes pfInner { 0% { transform: scale(0.85); opacity: 0.05; } 100% { transform: scale(1.15); opacity: 0.16; } }\n    @keyframes pfRotate { to { transform: rotate(360deg); } }\n    @keyframes pfPulse { 0%, 100% { r: 46; opacity: 0.1; } 50% { r: 50; opacity: 0.2; } }\n    .pf-outer { fill: none; stroke: var(--p31-accent, #00F0FF); stroke-width: 1; opacity: 0.15; animation: pfPulse 3s infinite ease-in-out; transform-origin: 100px 100px; }\n    .master-pulse .pf-master { opacity: 0.35 !important; filter: drop-shadow(0 0 18px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .pf-group, .pf-fold, .pf-inner, .pf-master, .pf-outer { animation: none; } .pf-fold { transform: none; } .pf-inner { opacity: 0.1; } .pf-outer { opacity: 0.15; } }\n  </style>\n  <g class=\"pf-group\">\n    <circle cx=\"100\" cy=\"100\" r=\"46\" class=\"pf-outer\" stroke-dasharray=\"8 6\"/>\n    <circle cx=\"100\" cy=\"100\" r=\"60\" class=\"pf-inner pf-master\"/>\n    <polygon points=\"100,60 120,80 100,100\" class=\"pf-facet pf-c1 pf-fold pf-1\"/>\n    <polygon points=\"100,60 100,80 80,80\" class=\"pf-facet pf-c2 pf-fold pf-2\"/>\n    <polygon points=\"80,80 100,100 80,110\" class=\"pf-facet pf-c3 pf-fold pf-3\"/>\n    <polygon points=\"100,100 80,110 100,120\" class=\"pf-facet pf-c4 pf-fold pf-4\"/>\n    <polygon points=\"100,100 100,120 120,110\" class=\"pf-facet pf-c5 pf-fold pf-5\"/>\n    <polygon points=\"100,100 120,110 120,80\" class=\"pf-facet pf-c6 pf-fold pf-6\"/>\n  </g>\n</svg>" },
    "nebula-burst": { family: "advanced", colors: ["--p31-accent","--p31-accent-violet","--p31-accent-gold","--p31-accent-green","--p31-accent-iris","--p31-accent-red"], animated: true, description: "Emergence, chaos to structure, generative particles", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Nebula Burst animated icon\">\n  <title>Nebula Burst</title>\n  <desc>A generative particle cloud with expanding wave rings, representing emergence and structure from chaos. 6-color palette.</desc>\n  <style>\n    .nb-ripple { fill: none; stroke-width: 1.5; stroke-linecap: round; opacity: 0; transform-origin: 100px 100px; }\n    .nb-r1 { stroke: var(--p31-accent, #00F0FF); animation: nbRipple 6s infinite ease-out; }\n    .nb-r2 { stroke: var(--p31-accent-violet, #A78BFA); animation: nbRipple 6s infinite ease-out 2s; }\n    .nb-r3 { stroke: var(--p31-accent-gold, #FBBF24); animation: nbRipple 6s infinite ease-out 4s; }\n    .nb-r4 { stroke: var(--p31-accent-green, #34D399); animation: nbRipple 6s infinite ease-out 6s; }\n    @keyframes nbRipple { 0% { transform: scale(0.05); opacity: 0.7; stroke-width: 4; } 100% { transform: scale(1); opacity: 0; stroke-width: 1; } }\n    .nb-dot { r: 2.5; animation: nbDrift var(--d, 8s) infinite alternate ease-in-out; }\n    .nb-dot:nth-child(6n+1) { fill: var(--p31-accent, #00F0FF); }\n    .nb-dot:nth-child(6n+2) { fill: var(--p31-accent-violet, #A78BFA); }\n    .nb-dot:nth-child(6n+3) { fill: var(--p31-accent-gold, #FBBF24); }\n    .nb-dot:nth-child(6n+4) { fill: var(--p31-accent-green, #34D399); }\n    .nb-dot:nth-child(6n+5) { fill: var(--p31-accent-red, #FB7185); }\n    .nb-dot:nth-child(6n+6) { fill: var(--p31-accent-iris, #818CF8); }\n    @keyframes nbDrift { 0% { transform: translate(0, 0); opacity: 0.3; } 100% { transform: translate(var(--tx, 20px), var(--ty, -20px)); opacity: 0.9; } }\n    .nb-master { transition: opacity 0.4s ease, filter 0.4s ease; }\n    .nb-cluster { transform-origin: 100px 100px; animation: nbCluster 28s infinite ease-in-out; }\n    @keyframes nbCluster { 0%, 100% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(3deg) scale(1.02); } 75% { transform: rotate(-3deg) scale(0.98); } }\n    .master-pulse .nb-master { opacity: 0.9 !important; filter: drop-shadow(0 0 12px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .nb-ripple, .nb-dot, .nb-cluster { animation: none; } .nb-dot { opacity: 0.5; transform: none; } .nb-ripple { opacity: 0; } }\n  </style>\n    <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r1 nb-master\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r2\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r3\"/>\n  <circle cx=\"100\" cy=\"100\" r=\"90\" class=\"nb-ripple nb-r4\"/>\n  <g class=\"nb-cluster\">\n    <circle cx=\"100\" cy=\"40\" class=\"nb-dot\" style=\"--d:12s;--tx:15px;--ty:-10px\"/>\n    <circle cx=\"80\" cy=\"50\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:15px\"/>\n    <circle cx=\"120\" cy=\"45\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-8px\"/>\n    <circle cx=\"60\" cy=\"65\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:12px\"/>\n    <circle cx=\"140\" cy=\"60\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-12px\"/>\n    <circle cx=\"45\" cy=\"85\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"155\" cy=\"80\" class=\"nb-dot\" style=\"--d:13s;--tx:10px;--ty:-14px\"/>\n    <circle cx=\"35\" cy=\"105\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:6px\"/>\n    <circle cx=\"165\" cy=\"100\" class=\"nb-dot\" style=\"--d:14s;--tx:16px;--ty:-10px\"/>\n    <circle cx=\"40\" cy=\"125\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"160\" cy=\"120\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-6px\"/>\n    <circle cx=\"55\" cy=\"140\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"145\" cy=\"135\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-12px\"/>\n    <circle cx=\"75\" cy=\"150\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"125\" cy=\"148\" class=\"nb-dot\" style=\"--d:12s;--tx:10px;--ty:-10px\"/>\n    <circle cx=\"100\" cy=\"155\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:12px\"/>\n    <circle cx=\"90\" cy=\"35\" class=\"nb-dot\" style=\"--d:11s;--tx:8px;--ty:-15px\"/>\n    <circle cx=\"110\" cy=\"35\" class=\"nb-dot\" style=\"--d:9s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"50\" cy=\"100\" class=\"nb-dot\" style=\"--d:13s;--tx:16px;--ty:-8px\"/>\n    <circle cx=\"150\" cy=\"95\" class=\"nb-dot\" style=\"--d:7s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"95\" cy=\"60\" class=\"nb-dot\" style=\"--d:10s;--tx:12px;--ty:-12px\"/>\n    <circle cx=\"105\" cy=\"65\" class=\"nb-dot\" style=\"--d:8s;--tx:-14px;--ty:8px\"/>\n    <circle cx=\"70\" cy=\"90\" class=\"nb-dot\" style=\"--d:12s;--tx:10px;--ty:-10px\"/>\n    <circle cx=\"130\" cy=\"85\" class=\"nb-dot\" style=\"--d:6s;--tx:-8px;--ty:15px\"/>\n    <circle cx=\"85\" cy=\"115\" class=\"nb-dot\" style=\"--d:14s;--tx:14px;--ty:-6px\"/>\n    <circle cx=\"115\" cy=\"110\" class=\"nb-dot\" style=\"--d:9s;--tx:-12px;--ty:10px\"/>\n    <circle cx=\"75\" cy=\"130\" class=\"nb-dot\" style=\"--d:11s;--tx:8px;--ty:-14px\"/>\n    <circle cx=\"125\" cy=\"125\" class=\"nb-dot\" style=\"--d:7s;--tx:-10px;--ty:8px\"/>\n    <circle cx=\"100\" cy=\"75\" class=\"nb-dot\" style=\"--d:10s;--tx:15px;--ty:-10px\"/>\n    <circle cx=\"100\" cy=\"130\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:12px\"/>\n    <circle cx=\"65\" cy=\"105\" class=\"nb-dot\" style=\"--d:13s;--tx:10px;--ty:-8px\"/>\n    <circle cx=\"135\" cy=\"105\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:10px\"/>\n    <circle cx=\"90\" cy=\"90\" class=\"nb-dot\" style=\"--d:12s;--tx:8px;--ty:-12px\"/>\n    <circle cx=\"110\" cy=\"95\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:14px\"/>\n    <circle cx=\"80\" cy=\"75\" class=\"nb-dot\" style=\"--d:11s;--tx:12px;--ty:-8px\"/>\n    <circle cx=\"120\" cy=\"135\" class=\"nb-dot\" style=\"--d:7s;--tx:-8px;--ty:10px\"/>\n    <circle cx=\"100\" cy=\"50\" class=\"nb-dot\" style=\"--d:10s;--tx:14px;--ty:-14px\"/>\n    <circle cx=\"100\" cy=\"150\" class=\"nb-dot\" style=\"--d:8s;--tx:-12px;--ty:8px\"/>\n    <circle cx=\"55\" cy=\"95\" class=\"nb-dot\" style=\"--d:14s;--tx:10px;--ty:-12px\"/>\n    <circle cx=\"145\" cy=\"100\" class=\"nb-dot\" style=\"--d:6s;--tx:-14px;--ty:10px\"/>\n    <circle cx=\"70\" cy=\"110\" class=\"nb-dot\" style=\"--d:13s;--tx:8px;--ty:-15px\"/>\n    <circle cx=\"130\" cy=\"115\" class=\"nb-dot\" style=\"--d:9s;--tx:-10px;--ty:8px\"/>\n  </g>\n</svg>" },
    "comet-orb": { family: "advanced", colors: ["--p31-accent","--p31-accent-violet","--p31-accent-gold","--p31-accent-green","--p31-accent-iris","--p31-accent-red"], animated: true, description: "Swirling energy, harmonized orbital motion", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"Comet Orb animated icon\">\n  <title>Comet Orb</title>\n  <desc>Swirling energy orb with harmonized elliptical rings and orbiting particles. 6-color palette, 48s sync cycle.</desc>\n  <style>\n    .co-ring { fill: none; stroke-width: 1.5; stroke-linecap: round; }\n    .co-orbit-1 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }\n    .co-orbit-2 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }\n    .co-orbit-3 { transform-origin: 100px 100px; animation: coCw 16s infinite linear; }\n    .co-orbit-4 { transform-origin: 100px 100px; animation: coCcw 12s infinite linear; }\n    .co-r1 { stroke: var(--p31-accent, #00F0FF); stroke-dasharray: 44 156; animation: coDash 4s infinite linear; }\n    .co-r2 { stroke: var(--p31-accent-violet, #A78BFA); stroke-dasharray: 39 141; animation: coDash 4s infinite linear; }\n    .co-r3 { stroke: var(--p31-accent-gold, #FBBF24); stroke-dasharray: 50 150; animation: coDash 4s infinite linear reverse; }\n    .co-r4 { stroke: var(--p31-accent-green, #34D399); stroke-dasharray: 27 153; animation: coDash 4s infinite linear reverse; }\n    .co-c1 { fill: var(--p31-accent, #00F0FF); }\n    .co-c2 { fill: var(--p31-accent-violet, #A78BFA); }\n    .co-c3 { fill: var(--p31-accent-gold, #FBBF24); }\n    .co-c4 { fill: var(--p31-accent-green, #34D399); }\n    .co-c5 { fill: var(--p31-accent-red, #FB7185); }\n    .co-c6 { fill: var(--p31-accent-iris, #818CF8); }\n    .co-particle { filter: drop-shadow(0 0 3px currentColor); }\n    .co-p1 { animation: coCw 16s infinite linear; }\n    .co-p2 { animation: coCcw 12s infinite linear; }\n    .co-p3 { animation: coCw 16s infinite linear; }\n    .co-p4 { animation: coCcw 12s infinite linear; }\n    .co-p5 { animation: coCw 16s infinite linear; animation-delay: 8s; }\n    .co-p6 { animation: coCcw 12s infinite linear; animation-delay: 6s; }\n    .co-master { transition: filter 0.6s ease-in-out; }\n    .co-core { fill: var(--p31-accent, #00F0FF); transform-origin: 100px 100px; animation: coCore 2s infinite alternate ease-in-out; }\n    .co-trail { fill: none; stroke-width: 1; opacity: 0; }\n    .co-t1 { stroke: var(--p31-accent, #00F0FF); animation: coTrail 3s infinite ease-out; }\n    .co-t2 { stroke: var(--p31-accent-violet, #A78BFA); animation: coTrail 3s infinite ease-out; animation-delay: 1.5s; }\n    @keyframes coCw { to { transform: rotate(360deg); } }\n    @keyframes coCcw { to { transform: rotate(-360deg); } }\n    @keyframes coDash { to { stroke-dashoffset: 200; } }\n    @keyframes coCore { 0% { transform: scale(0.85); opacity: 0.8; filter: drop-shadow(0 0 4px var(--p31-accent, #00F0FF)); } 100% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)); } }\n    @keyframes coTrail { 0% { opacity: 0.5; stroke-width: 2.5; } 100% { opacity: 0; stroke-width: 0; } }\n    .master-pulse .co-master { filter: drop-shadow(0 0 22px var(--p31-accent, #00F0FF)) !important; }\n    @media (prefers-reduced-motion: reduce) { .co-orbit-1, .co-orbit-2, .co-orbit-3, .co-orbit-4, .co-particle, .co-core, .co-trail, .co-ring { animation: none; } .co-ring { stroke-dashoffset: 0; opacity: 0.3; } .co-core { r: 10; } }\n  </style>\n  <g class=\"co-orbit-1\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"88\" ry=\"30\" class=\"co-ring co-r1\"/>\n    <path d=\"M 100 70 Q 140 70 185 100 Q 140 130 100 130\" class=\"co-trail co-t1\"/>\n    <circle cx=\"185\" cy=\"100\" r=\"3.5\" class=\"co-particle co-c1 co-p1\"/>\n  </g>\n  <g class=\"co-orbit-2\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"78\" ry=\"26\" class=\"co-ring co-r2\" transform=\"rotate(60 100 100)\"/>\n    <circle cx=\"51\" cy=\"27\" r=\"3\" class=\"co-particle co-c5 co-p2\"/>\n  </g>\n  <g class=\"co-orbit-3\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"66\" ry=\"22\" class=\"co-ring co-r3\" transform=\"rotate(120 100 100)\"/>\n    <path d=\"M 100 80 Q 50 80 15 100 Q 50 120 100 120\" class=\"co-trail co-t2\"/>\n    <circle cx=\"15\" cy=\"100\" r=\"4\" class=\"co-particle co-c3 co-p3\"/>\n  </g>\n  <g class=\"co-orbit-4\">\n    <ellipse cx=\"100\" cy=\"100\" rx=\"54\" ry=\"18\" class=\"co-ring co-r4\" transform=\"rotate(30 100 100)\"/>\n    <circle cx=\"158\" cy=\"64\" r=\"2.5\" class=\"co-particle co-c4 co-p4\"/>\n  </g>\n  <circle cx=\"100\" cy=\"100\" r=\"10\" class=\"co-core co-master\"/>\n  <circle cx=\"42\" cy=\"66\" r=\"3\" class=\"co-particle co-c6 co-p5\"/>\n  <circle cx=\"158\" cy=\"134\" r=\"3\" class=\"co-particle co-c2 co-p6\"/>\n</svg>" }
};

import { TOKENS_DTC } from '../../../packages/design-core/src/mcp/tokens-dtc';
import { COMPONENT_DEFS, getComponentDef, listComponents, listComponentsByCategory } from './generated/componentDefs';
export { TOKENS_DTC };
export { COMPONENT_DEFS, getComponentDef, listComponents, listComponentsByCategory };

export const CATALOG = {
  v: 2,
  generatedAt: '2026-09-15',
  components: Object.entries(COMPONENT_DEFS).map(([name, def]) => ({
    name,
    description: def.description,
    cssClass: def.css_class,
    category: def.category,
    tokens: def.tokens,
    aiGuidance: {
      useWhen: def.aiGuidance?.useWhen || [],
      avoidWhen: def.aiGuidance?.avoidWhen || [],
    },
    stories: [{ name: 'Default', link: `/storybook/?path=/story/${name.toLowerCase()}` }],
  })).concat([{
    name: 'SpoonMeter',
    description: 'Real-time cognitive load indicator — spoon-aware design',
    cssClass: 'spoon-meter',
    category: 'accessibility',
    tokens: ['semantic.color.accent.default', 'semantic.color.accent.gold', 'semantic.color.accent.red'],
    aiGuidance: { useWhen: ['spoon level display'], avoidWhen: [] },
    stories: [{ name: 'SpoonMeter', link: '/storybook/?path=/story/spoonmeter' }],
  }]),
};

export function getCatalogEntry(name: string): Record<string, any> | null {
  return CATALOG.components.find((c) => c.name === name) || null;
}
