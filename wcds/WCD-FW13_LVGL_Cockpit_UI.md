# WCD-FW13: LVGL Cockpit UI + Theme Mirror
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: DeepSeek

---

## Objective

Build the Node Zero display UI as a miniature physical cockpit that mirrors Spaceship Earth state and adapts to the Polymorphic Skin Engine. The coherence arc is the centerpiece — color-gradient sweep that pulses at resonance lock. Gray Rock: static monochrome, zero animation, raw facts.

---

## Cockpit UI Layout

```
┌─────────────────────────────────────────────────┐
│  🜔 NODE ZERO                    📡 🔋 45%    │  <- Status bar
├─────────────────────────────────────────────────┤
│                                                 │
│            ╭───────────────╮                   │
│           │   COHERENCE    │                   │  <- Coherence Arc
│           │      0.87      │                   │     (172.35 Hz pulse)
│            ╰───────────────╯                   │
│                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │ SPOONS  │   │  ROOM   │   │ THEME   │      │  <- Info cards
│  │   12    │   │Observ.  │   │ Quantum │      │
│  └─────────┘   └─────────┘   └─────────┘      │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [🎤 Sorcery]  [🔊 Audio]  [⚙ Settings] │   │  <- Action buttons
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │  <- Spoons bar
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Theme System

### Available Themes (from Spaceship Earth)

| Theme | Description | Colors |
|-------|-------------|--------|
| `default` | P31 default | Phosphor Green (#00FF88), Quantum Cyan (#00D4FF) |
| `quantum` | Full spectrum | Quantum Violet (#7A27FF), Cyan |
| `gray_rock` | Monochrome, zero animation | Grays only, raw facts |
| `solar` | Warm tones | Calcium Amber (#F59E0B), Orange |
| `ocean` | Cool tones | Blues, teals |
| `kids` | Bright, simple | Primary colors, large text |

### Theme Colors (P31 Brand)

```c
// From cognitive-passport.md
#define COLOR_PHOSPHOR_GREEN   0x00FF88
#define COLOR_QUANTUM_CYAN     0x00D4FF
#define COLOR_QUANTUM_VIOLET   0x7A27FF
#define COLOR_PHOSPHOR_ORANGE  0xFF6600
#define COLOR_CALCIUM_AMBER    0xF59E0B
#define COLOR_DANGER_RED       0xEF4444
#define COLOR_VOID             0x050510
#define COLOR_TEXT_PRIMARY     0xE8ECF4

// Axis colors
#define COLOR_BODY_AXIS        0xFF9944   // Health, cognition
#define COLOR_MESH_AXIS        0x44AAFF   // People, community
#define COLOR_FORGE_AXIS       0x44FFAA   // Products, code
#define COLOR_SHIELD_AXIS      0xFF4466   // Legal, protection
```

---

## Tasks

### FW13.1 — Coherence Arc Widget

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/ui_cockpit.cpp` (create)

```c
#include "lvgl.h"
#include <math.h>

static const char *TAG = "COCKPIT";

#define COHERENCE_ARC_RADIUS   80
#define COHERENCE_ARC_WIDTH     20

// Current state
static float current_coherence = 0.0f;
static uint8_t current_spoons = 100;
static char current_room[32] = "observatory";
static char current_theme[32] = "default";

// LVGL objects
static lv_obj_t *coherence_arc = NULL;
static lv_obj_t *coherence_label = NULL;
static lv_obj_t *spoons_label = NULL;
static lv_obj_t *spoons_bar = NULL;
static lv_obj_t *room_label = NULL;
static lv_obj_t *theme_label = NULL;
static lv_obj_t *battery_label = NULL;
static lv_obj_t *ble_status_label = NULL;

// Colors based on theme
static lv_color_t primary_color = lv_color_hex(0x00FF88);
static lv_color_t bg_color = lv_color_hex(0x050510);

// Convert coherence to arc angle (0-360)
static uint16_t coherence_to_angle(float coherence) {
    return (uint16_t)(coherence * 360.0f);
}

// Get color based on coherence level
static lv_color_t get_coherence_color(float coherence) {
    if (coherence < 0.3f) {
        return lv_color_hex(0xEF4444);  // Red - danger
    } else if (coherence < 0.6f) {
        return lv_color_hex(0xF59E0B);  // Amber - warning
    } else if (coherence < 0.85f) {
        return lv_color_hex(0x00D4FF);  // Cyan - good
    } else {
        return lv_color_hex(0x00FF88);  // Green - excellent
    }
}

// Create coherence arc widget
static void create_coherence_arc(lv_obj_t *parent) {
    // Arc background
    coherence_arc = lv_arc_create(parent);
    lv_obj_set_size(coherence_arc, COHERENCE_ARC_RADIUS * 2, COHERENCE_ARC_RADIUS * 2);
    lv_arc_set_rotation(coherence_arc, 270);
    lv_arc_set_bg_angles(coherence_arc, 0, 360);
    lv_arc_set_angles(coherence_arc, 0, 0);  // Start at 0
    lv_obj_set_style_arc_color(coherence_arc, lv_color_hex(0x333333), LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(coherence_arc, COHERENCE_ARC_WIDTH, LV_PART_INDICATOR);
    lv_obj_center(coherence_arc);
    
    // Coherence value label
    coherence_label = lv_label_create(parent);
    lv_label_set_text_fmt(coherence_label, "%.2f", current_coherence);
    lv_obj_set_style_text_font(coherence_label, &lv_font_montserrat_32, 0);
    lv_obj_set_style_text_color(coherence_label, primary_color, 0);
    lv_obj_center(coherence_label);
}

// Update coherence display
void lvgl_update_coherence(float coherence) {
    current_coherence = coherence;
    
    if (coherence_arc && coherence_label) {
        uint16_t angle = coherence_to_angle(coherence);
        lv_arc_set_angles(coherence_arc, 0, angle);
        
        lv_label_set_text_fmt(coherence_label, "%.2f", coherence);
        lv_obj_set_style_text_color(coherence_label, get_coherence_color(coherence), 0);
        
        // Pulse animation at high coherence
        if (coherence >= 0.95f) {
            // Trigger visual pulse - handled in FW13.3
        }
    }
}
```

---

### FW13.2 — Spoons Bar + Room/Theme Display

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/ui_cockpit.cpp`

```c
// Create spoons bar
static void create_spoons_bar(lv_obj_t *parent) {
    // Spoons label
    spoons_label = lv_label_create(parent);
    lv_label_set_text_fmt(spoons_label, "Spoons: %d", current_spoons);
    lv_obj_set_style_text_font(spoons_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(spoons_label, COLOR_CALCIUM_AMBER, 0);
    lv_obj_align(spoons_label, LV_ALIGN_TOP_LEFT, 10, 120);
    
    // Spoons progress bar
    spoons_bar = lv_bar_create(parent);
    lv_obj_set_size(spoons_bar, 200, 20);
    lv_bar_set_range(spoons_bar, 0, 100);
    lv_bar_set_value(spoons_bar, current_spoons, LV_ANIM_OFF);
    lv_obj_align(spoons_bar, LV_ALIGN_TOP_LEFT, 10, 140);
    
    // Style for spoons bar
    lv_obj_set_style_bg_color(spoons_bar, lv_color_hex(0x333333), LV_PART_INDICATOR);
    lv_obj_set_style_bg_color(spoons_bar, COLOR_CALCIUM_AMBER, LV_PART_INDICATOR);
}

// Create room/theme display
static void create_room_theme_display(lv_obj_t *parent) {
    // Room display
    room_label = lv_label_create(parent);
    lv_label_set_text_fmt(room_label, "Room: %s", current_room);
    lv_obj_set_style_text_font(room_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(room_label, COLOR_MESH_AXIS, 0);
    lv_obj_align(room_label, LV_ALIGN_TOP_RIGHT, -10, 120);
    
    // Theme display
    theme_label = lv_label_create(parent);
    lv_label_set_text_fmt(theme_label, "Theme: %s", current_theme);
    lv_obj_set_style_text_font(theme_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(theme_label, COLOR_QUANTUM_VIOLET, 0);
    lv_obj_align(theme_label, LV_ALIGN_TOP_RIGHT, -10, 140);
}

// Update spoons display
void lvgl_update_spoons(uint8_t spoons) {
    current_spoons = spoons;
    
    if (spoons_label) {
        lv_label_set_text_fmt(spoons_label, "Spoons: %d", spoons);
    }
    if (spoons_bar) {
        lv_bar_set_value(spoons_bar, spoons, LV_ANIM_OFF);
        
        // Color based on spoon level
        lv_color_t bar_color;
        if (spoons < 10) {
            bar_color = lv_color_hex(0xEF4444);  // Red
        } else if (spoons < 30) {
            bar_color = lv_color_hex(0xF59E0B);  // Amber
        } else {
            bar_color = lv_color_hex(0x44FFAA);  // Green
        }
        lv_obj_set_style_bg_color(spoons_bar, bar_color, LV_PART_INDICATOR);
    }
}

// Update room display
void lvgl_update_room(const char* room) {
    strncpy(current_room, room, sizeof(current_room) - 1);
    current_room[sizeof(current_room) - 1] = '\0';
    
    if (room_label) {
        lv_label_set_text_fmt(room_label, "Room: %s", room);
    }
}
```

---

### FW13.3 — Theme Engine + Gray Rock Mode

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/ui_theme.cpp`

```c
#include <string.h>

// Theme configuration
typedef struct {
    const char *name;
    lv_color_t primary;
    lv_color_t secondary;
    lv_color_t background;
    lv_color_t text;
    bool animations_enabled;
} theme_config_t;

static theme_config_t themes[] = {
    {"default",  lv_color_hex(0x00FF88), lv_color_hex(0x00D4FF), lv_color_hex(0x050510), lv_color_hex(0xE8ECF4), true},
    {"quantum",  lv_color_hex(0x7A27FF), lv_color_hex(0x00D4FF), lv_color_hex(0x0B0F19), lv_color_hex(0xE8ECF4), true},
    {"gray_rock",lv_color_hex(0x888888), lv_color_hex(0x666666), lv_color_hex(0x1A1A1A), lv_color_hex(0xCCCCCC), false},  // No animations!
    {"solar",    lv_color_hex(0xF59E0B), lv_color_hex(0xFF6600), lv_color_hex(0x1A1400), lv_color_hex(0xE8ECF4), true},
    {"ocean",    lv_color_hex(0x00D4FF), lv_color_hex(0x0077B6), lv_color_hex(0x001A2E), lv_color_hex(0xE8ECF4), true},
    {"kids",     lv_color_hex(0xFF6B6B), lv_color_hex(0x4ECDC4), lv_color_hex(0x2D1B4E), lv_color_hex(0xFFFFFF), true},
};

static theme_config_t *current_theme_config = &themes[0];
static bool gray_rock_mode = false;

// Apply theme to all UI elements
void theme_apply(const char *theme_name) {
    // Find theme
    for (size_t i = 0; i < sizeof(themes) / sizeof(themes[0]); i++) {
        if (strcmp(themes[i].name, theme_name) == 0) {
            current_theme_config = &themes[i];
            break;
        }
    }
    
    // Check for Gray Rock mode
    gray_rock_mode = (strcmp(theme_name, "gray_rock") == 0);
    
    // Update primary color globally
    primary_color = current_theme_config->primary;
    
    // Disable all animations in Gray Rock mode
    if (gray_rock_mode) {
        lv_anim_set_duration(&lv_anim_t, 0);
        // All transitions become instant
    }
    
    ESP_LOGI(TAG, "Theme applied: %s (animations: %s)", 
              theme_name, 
              gray_rock_mode ? "DISABLED" : "enabled");
}

// Update theme display
void lvgl_update_theme(const char* theme) {
    strncpy(current_theme, theme, sizeof(current_theme) - 1);
    current_theme[sizeof(current_theme) - 1] = '\0';
    
    // Apply theme
    theme_apply(theme);
    
    if (theme_label) {
        lv_label_set_text_fmt(theme_label, "Theme: %s", theme);
    }
}

// Gray Rock mode check
bool theme_is_gray_rock(void) {
    return gray_rock_mode;
}

// Get current primary color
lv_color_t theme_get_primary_color(void) {
    return current_theme_config->primary;
}
```

---

### FW13.4 — Status Bar (BLE + Battery)

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/ui_cockpit.cpp`

```c
// Status bar component
static lv_obj_t *status_bar = NULL;

static void create_status_bar(lv_obj_t *parent) {
    status_bar = lv_obj_create(parent);
    lv_obj_set_size(status_bar, LV_PCT(100), 30);
    lv_obj_set_pos(status_bar, 0, 0);
    lv_obj_set_style_bg_color(status_bar, lv_color_hex(0x111111), 0);
    lv_obj_set_style_border_width(status_bar, 0, 0);
    
    // Title
    lv_obj_t *title = lv_label_create(status_bar);
    lv_label_set_text(title, "🜔 NODE ZERO");
    lv_obj_set_style_text_color(title, lv_color_hex(0x00FF88), 0);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_14, 0);
    lv_obj_align(title, LV_ALIGN_LEFT_MID, 10, 0);
    
    // BLE status indicator
    ble_status_label = lv_label_create(status_bar);
    lv_label_set_text(ble_status_label, "📡");  // Disconnected
    lv_obj_set_style_text_color(ble_status_label, lv_color_hex(0x666666), 0);
    lv_obj_align(ble_status_label, LV_ALIGN_RIGHT_MID, -50, 0);
    
    // Battery level
    battery_label = lv_label_create(status_bar);
    lv_label_set_text_fmt(battery_label, "🔋 45%%");
    lv_obj_set_style_text_color(battery_label, lv_color_hex(0x00FF88), 0);
    lv_obj_align(battery_label, LV_ALIGN_RIGHT_MID, -10, 0);
}

// Update BLE status
void lvgl_update_ble_status(bool connected) {
    if (ble_status_label) {
        if (connected) {
            lv_label_set_text(ble_status_label, "📡");  // Connected
            lv_obj_set_style_text_color(ble_status_label, lv_color_hex(0x00FF88), 0);
        } else {
            lv_label_set_text(ble_status_label, "📡");  // Same icon, different color
            lv_obj_set_style_text_color(ble_status_label, lv_color_hex(0x666666), 0);
        }
    }
}

// Update battery level
void lvgl_update_battery(uint8_t percent) {
    if (battery_label) {
        lv_label_set_text_fmt(battery_label, "🔋 %d%%", percent);
        
        // Color based on level
        lv_color_t color;
        if (percent < 20) {
            color = lv_color_hex(0xEF4444);  // Red
        } else if (percent < 50) {
            color = lv_color_hex(0xF59E0B);  // Amber
        } else {
            color = lv_color_hex(0x00FF88);  // Green
        }
        lv_obj_set_style_text_color(battery_label, color, 0);
    }
}
```

---

### FW13.5 — Main Cockpit Screen Assembly

**Action**: MODIFY  
**File**: `firmware/maker-variant/main/main.cpp`

```c
// Add to app_main after display_manager_init:
void create_cockpit_screen(void) {
    // Create base screen
    lv_obj_t *screen = lv_scr_act();
    lv_obj_set_style_bg_color(screen, bg_color, 0);
    
    // Create status bar
    create_status_bar(screen);
    
    // Create coherence arc
    create_coherence_arc(screen);
    
    // Create spoons bar
    create_spoons_bar(screen);
    
    // Create room/theme display
    create_room_theme_display(screen);
    
    // Create action buttons (placeholder for FW14)
    // ...
}
```

---

## Deliverables

- [ ] Coherence arc widget (0-1.0, color gradient, pulses at 172.35 Hz at resonance)
- [ ] Spoons bar (0-100, color coded)
- [ ] Room display (text, updates via BLE)
- [ ] Theme display + application
- [ ] Gray Rock mode (monochrome, zero animations, raw facts only)
- [ ] Status bar (BLE status + battery)
- [ ] Theme sync from Spaceship Earth via BLE
- [ ] `idf.py build` succeeds

---

## Dependencies

- **Prerequisites**: FW10 (display works), FW12 (BLE receives theme)
- **Blocked by**: None
- **Blocks**: FW14 (Sorcery UI integration)

---

## Acceptance Criteria

1. Writing coherence from Web Bluetooth updates the arc angle + color
2. Writing spoons from Web Bluetooth updates the bar
3. Writing theme from Web Bluetooth changes all colors + enables/disables animations
4. Gray Rock mode shows no animations, grayscale colors only
5. Battery updates every 10 seconds
6. BLE connection status visible in status bar

---

## Agent Assignment

**Primary**: DeepSeek (LVGL UI, ESP32 display)  
**Support**: Sonnet/CC (theme design, testing)  
**Verification**: Opus (visual verification on physical hardware)
