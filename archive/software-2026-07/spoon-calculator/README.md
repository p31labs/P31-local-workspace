# Spoon Calculator - P31 Andromeda

A React-based personal energy management calculator for tracking spoon theory usage throughout the day.

## Features

### Core Functionality
- **Quick-tap task logging** - No forms, just buttons for fast entry
- **Color-coded capacity display** - Visual feedback on energy levels (Green/Yellow/Red/Black)
- **Mathematical model** - Implements the specified spoon calculation formula
- **Modifier system** - Stackable modifiers that affect task costs
- **Historical tracking** - View daily activity and export for medical/legal documentation

### Task Categories
- **Green (1 spoon)**: Routine tasks, passive screen time
- **Yellow (2-3 spoons)**: Phone calls, moderate cognitive work, appointments
- **Red (4-5 spoons)**: Medical exams, unfamiliar locations, confrontation
- **Black (6+ spoons)**: Court appearances, crisis events, system failures

### Modifiers (Stackable)
- Someone else drives: -1 to -2 spoons
- Familiar environment: -1 spoon
- Prep/planning done: -1 spoon
- Unexpected change: +1 spoon
- Sensory overload: +1 spoon
- Time pressure: +1 spoon

### Base Modifiers
- Sleep quality: ±2 spoons
- Calcium status: ±2 spoons
- Previous day residual: ±1 spoon

## Installation

1. Navigate to the project directory:
```bash
cd software/spoon-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Usage

### Daily Setup
1. Set your base capacity (default: 12 spoons)
2. Adjust sleep quality modifier (±2)
3. Adjust calcium status modifier (±2)

### Logging Activities
1. Click a task button to select it
2. Apply relevant modifiers using the +/- buttons
3. Click "Log Task" to record it
4. The spoon count updates automatically

### Tool Check
After logging 3 tasks, the system prompts: "What tool are you holding?" encouraging you to take a pause.

### Data Management
- **Reset Day**: Clear all activities and carry over remaining spoons as residual
- **Export Data**: Download JSON file with all daily data for medical/legal documentation

## Mathematical Model

```
remaining = base + Σ(base_modifiers) - Σ(task_cost + task_modifiers)
capacity_pct = remaining / (base + Σ(base_modifiers))
zone = GREEN if pct > 0.5, YELLOW if > 0.25, RED if > 0, BLACK if ≤ 0
```

## Data Storage

- All data stored locally in browser localStorage
- Daily history persists across sessions
- Export functionality for external documentation

## Technical Details

- **Framework**: React 19 with Vite
- **Styling**: CSS-in-JS with custom properties
- **State Management**: React hooks (useState, useEffect)
- **Responsive**: Mobile-friendly design

## Future Enhancements (Phase 2)

- Calcium tracker with supplement logging
- Symptom correlation with spoon capacity
- Integration with Spaceship Earth dashboard
- Persistent cloud storage
- Advanced analytics and trends

## License

This project is part of the P31 Andromeda ecosystem.