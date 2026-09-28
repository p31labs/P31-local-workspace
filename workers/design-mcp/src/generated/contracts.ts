// Auto-generated from dist/index.js (known-good bundle, 2026-09-11)
// DO NOT EDIT — regenerated from the deployed bundle snapshot.

export const COMPONENT_CONTRACTS: Record<string, any> = {
  "artifact-pane": {
    "component": "ArtifactPane",
    "system": "p31-portals/chat",
    "semantic_parts": [
      "root",
      "header",
      "tabs",
      "body",
      "footer"
    ],
    "token_contract": {
      "surface": [
        "surface.default",
        "border.glass"
      ],
      "space": [
        "space.1",
        "space.2",
        "space.3",
        "space.4"
      ]
    },
    "required_aria": [
      "aria-label on tabs",
      "aria-pressed on tab buttons"
    ],
    "interaction_states": [
      "default",
      "loading",
      "error"
    ],
    "spoon_contract": {
      "loading_overlay": "glass surface, blur 16px, z-index 10",
      "error_dismiss": "keyboard accessible, aria-label=Dismiss"
    },
    "forbidden_patterns": [
      "glass pane background",
      "backdrop-filter on content",
      "inline layout styles"
    ]
  },
  "button": {
    "component": "Button",
    "system": "design-core/compositions",
    "semantic_parts": [
      "root",
      "label",
      "icon"
    ],
    "token_contract": {
      "color": [
        "color.semantic.action.primary",
        "color.semantic.action.primaryHover",
        "color.semantic.text",
        "color.semantic.textSecondary"
      ],
      "space": [
        "space.1",
        "space.2",
        "space.3",
        "space.4"
      ],
      "radius": [
        "radius.sm",
        "radius.md",
        "radius.full"
      ],
      "typography": [
        "scale.xs",
        "scale.sm",
        "scale.md"
      ]
    },
    "required_aria": [
      "aria-pressed when toggleable",
      "aria-disabled when disabled",
      "aria-label when icon-only"
    ],
    "interaction_states": [
      "default",
      "hover",
      "focus-visible",
      "active",
      "disabled",
      "loading"
    ],
    "spoon_contract": {
      "min_touch_target": "44px",
      "focus_ring": "required",
      "motion_reduce": "prefers-reduced-motion respected"
    },
    "forbidden_patterns": [
      "inline style={{}}",
      "hardcoded hex",
      "arbitrary spacing",
      "emoji-as-icon"
    ]
  },
  "chat-composer": {
    "component": "ChatComposer",
    "system": "p31-portals/chat",
    "semantic_parts": [
      "root",
      "input",
      "actions",
      "status"
    ],
    "token_contract": {
      "surface": [
        "surface.default",
        "border.glass"
      ],
      "space": [
        "space.2",
        "space.3",
        "space.4"
      ],
      "typography": [
        "scale.sm",
        "scale.md"
      ]
    },
    "required_aria": [
      "aria-label on textarea",
      "aria-busy when streaming",
      "aria-live on status"
    ],
    "interaction_states": [
      "default",
      "focused",
      "disabled",
      "streaming"
    ],
    "spoon_contract": {
      "min_touch_target": "44px",
      "stop_button_primary": "variant=primary when generating",
      "auto_scroll": "three-state: anchored / drifted / jumped-back"
    },
    "forbidden_patterns": [
      "inline style on input",
      "emoji in actions",
      "ghost stop button during streaming"
    ]
  },
  "chat-message": {
    "component": "ChatMessage",
    "system": "p31-portals/chat",
    "semantic_parts": [
      "root",
      "bubble",
      "content",
      "tools",
      "timestamp"
    ],
    "token_contract": {
      "color": [
        "color.semantic.text",
        "color.semantic.textSecondary",
        "color.semantic.textTertiary"
      ],
      "space": [
        "space.1",
        "space.2",
        "space.3"
      ],
      "typography": [
        "scale.xs",
        "scale.sm"
      ]
    },
    "required_aria": [
      "role=log on transcript",
      "aria-live=polite",
      "aria-atomic=false",
      "aria-busy during streaming"
    ],
    "interaction_states": [
      "default",
      "streaming"
    ],
    "ownership": {
      "user": "right-aligned bubble, max-width 75%",
      "assistant": "full-width content, max-width 70ch, no bubble chrome"
    },
    "spoon_contract": {
      "timestamp_visibility": "always visible, never hover-gated",
      "streaming_cursor": "aria-hidden, blink animation respects prefers-reduced-motion"
    },
    "forbidden_patterns": [
      "assistant in bubble",
      "narrow column for markdown",
      "emoji timestamps"
    ]
  },
  "glass-panel": {
    "component": "GlassPanel",
    "system": "design-core/compositions",
    "semantic_parts": [
      "root",
      "content"
    ],
    "token_contract": {
      "surface": [
        "surface.glass.subtle",
        "surface.glass.panel",
        "surface.glass.strong"
      ],
      "border": [
        "border.glass",
        "border.glass.hover"
      ],
      "backdrop": [
        "backdrop.blur.sm",
        "backdrop.blur.md",
        "backdrop.blur.lg"
      ],
      "space": [
        "space.2",
        "space.3",
        "space.4",
        "space.6"
      ]
    },
    "required_aria": [
      "none required for decorative glass"
    ],
    "interaction_states": [
      "default",
      "hover"
    ],
    "spoon_contract": {
      "glass_usage_limit": "3-5 active glass surfaces per viewport",
      "content_legibility": "WCAG AA 4.5:1 against composited backdrop",
      "reduced_transparency": "backdrop-filter: none when prefers-reduced-transparency"
    },
    "forbidden_patterns": [
      "glass on content surfaces",
      "blur > 20px",
      "fill opacity > 25%",
      "cyan glow borders"
    ]
  }
};
