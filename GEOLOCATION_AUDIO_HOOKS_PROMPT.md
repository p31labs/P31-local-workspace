# Deep Research Prompt: GPS Geofencing and Audio Synthesis for Proximity-Based Experience

## Context
We're building a phygital experience for the BONDING PWA where users can "ground" themselves at specific physical locations. We need two React hooks:
1. `useGeolocationTracking` - GPS tracking with Haversine distance calculation
2. `useFrequencySynthesis` - Web Audio API generating the Phosphorus-31 Larmor frequency (863 Hz)

## Research Questions

### 1. Geolocation API and Accuracy
- What is the current state of the navigator.geolocation API across browsers?
- How accurate is GPS on mobile devices (iOS Safari vs Android Chrome)?
- What is the typical accuracy variation and how should we handle it?
- Are there battery/performance implications for continuous geolocation watching?

### 2. Haversine Formula Implementation
- What is the correct formula for calculating distance between two lat/long points?
- What is the expected accuracy in meters at different distances?
- Are there edge cases (poles, date line crossing) that need handling?

### 3. Web Audio API for Frequency Generation
- How do you generate a pure sine wave oscillator in Web Audio API?
- What is the proper way to handle AudioContext initialization after user gesture?
- How do you implement frequency modulation based on external input?
- How do you prevent audio clicks/pops when starting/stopping?

### 4. Browser Autoplay Policies
- What are the current browser autoplay restrictions?
- How should we initialize AudioContext on user interaction?
- Are there iOS-specific considerations?

### 5. Larmor Frequency (863 Hz)
- What is the Phosphorus-31 Larmor frequency in Earth's magnetic field?
- How does proximity affect frequency generation in this context?
- What are the perceptual characteristics of 863 Hz?

## Expected Deliverable
A technical implementation guide with:
1. Working code examples for both hooks
2. Edge case handling
3. Browser compatibility notes
4. Performance optimization suggestions

## Constraints
- Must work in modern browsers (Chrome, Safari, Firefox)
- Must handle permission denials gracefully
- Must follow React best practices (useEffect cleanup)
- Must be mobile-friendly