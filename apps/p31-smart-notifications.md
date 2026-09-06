# P31 Smart Notifications — Practical Design

## Philosophy

Smart notifications are **helpful reminders, not nagging alerts**. They respect cognitive load and help people stay on track without adding stress.

Key principle: **The user should never feel like the app is controlling them.**

---

## Notification Categories

### 1. **Health & Wellness**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Medication reminder | Time-of-day, routine history | Gentle, factual | "⏰ Time for your morning meds (Vitamin D, L-theanine). Take with food." |
| Hydration check | 2 hours since last logged | Soft nudge | "💧 Haven't logged water in a while. How are you doing?" |
| Movement break | 90 min focused time | Encouraging | "☕ You've been focused for 90 minutes. A 10-minute break helps. Walk, stretch, whatever feels good." |
| Sleep pattern check | Evening (configurable) | Calm | "🌙 You usually wind down around 10pm. What time works for you tonight?" |
| Stress signal (opt-in) | Based on interaction patterns | Grounding | "🧘 You seem more rushed than usual. Want a 2-minute breathing exercise?" |

### 2. **Social & Connection**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Message received | Async (BONDING, offline mesh) | Matter-of-fact | "👤 Bash sent you a message (when ready)" |
| Someone online | Friend/family status change (opt-in) | Warm | "💚 Mom just came online. No pressure to respond." |
| Connection reminder | 1+ week since contact | Gentle prompt | "👨‍👩‍👧 You haven't checked in with Willow's school in a week. Something on your mind?" |
| Discord unread | New message in watched channel | Neutral | "💬 3 new messages in #support. Read when you're ready." |

### 3. **Task & Routine**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Routine check | Morning/evening (configurable) | Warm | "☀️ Morning routine: Did you eat, take meds, move a bit?" |
| Calendar event | 15 min before (customizable) | Factual | "📅 Your FERS appointment is in 15 minutes. Zoom link: [...]" |
| Deadline approaching | 48h, 24h, 6h before | Escalating urgency | "⏳ Grant application due tomorrow at 5pm. You're 80% done. Want to finish today?" |
| Decision needed | Item in parking lot for 3+ days | Gently directive | "🚗 You've been parking 'update custody hearing notes' for 4 days. Need help?" |

### 4. **BONDING-Specific**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Bash online | When he logs in (during custody windows) | Excited but chill | "🎮 Bash is in BONDING. Want to build something together?" |
| New molecule completed | When a kid finishes a formula | Celebratory | "✨ Willow just built H₂O! She's learning." |
| Custody window open | Scheduled interaction time | Neutral reminder | "👨‍👧‍👦 Custody window: 3-6pm. BONDING is ready." |
| Long time since played | 2+ weeks since last session | Nostalgic | "🧪 It's been a while since you and Bash built molecules together. Miss it?" |

### 5. **Grant & Fundraising**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Deadline tracking | NLnet NGI Zero (Aug 1), ASAN (Jul 31) | Factual | "📝 ASAN grant due in 3 days. Do you need help with final edits?" |
| Donation milestone | $X raised toward goal | Encouraging | "💚 Thanks to 47 supporters, we hit $8,000 in monthly commitments. We can hire one person now." |
| Ko-fi supporter | New donation received | Grateful | "🙏 Someone just donated $25 monthly to support P31 Labs. Their name is [...]" |

### 6. **Research & Publication**

| Notification | Trigger | Tone | Example |
|--------------|---------|------|---------|
| Paper ready to review | New draft uploaded | Neutral | "📄 New draft: BONDING Multiplayer Evaluation. Ready for your feedback." |
| Citation alert | Someone cited P31 research | Exciting | "📚 Your paper was cited in a new study about neurodivergent education." |
| Zenodo published | Paper went live | Celebratory | "✨ 'BONDING: A Neurodivergent-First Game' is now on Zenodo with DOI" |

---

## Design Rules

### Rule 1: **Permission is Mandatory**

Users opt-in to every notification type. No dark patterns.

```
☐ Medication reminders
☐ Movement breaks
☐ Social messages
☐ Task reminders
☐ BONDING activity (high priority)
☐ Grant deadlines
```

### Rule 2: **Timing Matters**

- **Morning:** Health reminders, routine checks
- **Afternoon:** Movement breaks, deadline escalation
- **Evening:** Wind-down prompts, gratitude (donations, milestones)
- **Night:** None (unless explicitly opted-in)

### Rule 3: **No Badges or Sound by Default**

- Notifications appear in-app by default
- Optional: Desktop notifications (user can enable)
- Optional: Sound (disabled by default, user can enable)
- Badge count shows unread notifications (not a nag)

### Rule 4: **Tone is Consistent Across All Types**

- Warm, not corporate
- Factual, not manipulative
- Offer choice, never demand
- Acknowledge user agency ("when you're ready," "no pressure")

### Rule 5: **Dismissal is Easy**

- One-tap close
- "Snooze 1 hour" option
- "Don't show again" option
- No guilt-tripping ("Are you sure you don't want this reminder?")

---

## Notification Anatomy

### Standard Format

```
[ICON] [TITLE]
[BODY TEXT]
[ACTION] [DISMISS]
```

### Example 1: Medication Reminder

```
⏰ Time for your morning meds
Vitamin D, L-theanine. Take with food.

[OK, MARKED] [DISMISS]
```

### Example 2: Movement Break

```
☕ You've been focused for 90 minutes
A 10-minute break helps. Walk, stretch, whatever feels good.

[TAKE BREAK] [SNOOZE 30M] [DISMISS]
```

### Example 3: Social Message

```
👤 Bash sent you a message
"Are you free to play BONDING?"

[OPEN] [SNOOZE] [DISMISS]
```

### Example 4: Grant Deadline

```
📝 ASAN Teighlor McGee grant due in 3 days
Your draft is 90% done. Want to finalize this today?

[VIEW DRAFT] [SNOOZE] [DISMISS]
```

---

## Smart Notification Logic

### Medication Reminders

```javascript
if (userTimeOfDay === timeForMed && !alreadyTakenToday) {
  showNotification({
    title: "Time for your meds",
    body: getMedList(),
    actions: ["Mark Taken", "Snooze 30m"],
  });
}
```

### Movement Breaks

```javascript
if (focusTimeInMinutes >= 90 && !breakTakenInLastHour) {
  showNotification({
    title: "You've been focused for 90 minutes",
    body: "A 10-minute break helps. Walk, stretch, whatever feels good.",
    actions: ["Take Break", "Snooze 30m"],
  });
}
```

### BONDING Availability

```javascript
if (bashIsOnline && withinCustodyWindow() && userNotInGame) {
  showNotification({
    title: "Bash is in BONDING",
    body: "Want to build something together?",
    actions: ["Join Game", "Snooze 1h"],
    priority: "high", // Shows as badge
  });
}
```

### Grant Deadline Escalation

```javascript
const daysUntil = calculateDaysUntil(deadline);

if (daysUntil === 3) {
  showNotification({ icon: "📝", urgency: "normal" });
} else if (daysUntil === 1) {
  showNotification({ icon: "⏳", urgency: "elevated" });
} else if (daysUntil === 0) {
  showNotification({ 
    icon: "🚨", 
    urgency: "high",
    actions: ["FINISH NOW"] 
  });
}
```

---

## Personalization

### Frequency Control

```
Morning reminders: [ Every day ] [ Weekdays only ] [ Weekends only ] [ Never ]
Movement breaks: [ Every 90m ] [ Every 2h ] [ Never ]
Social alerts: [ Instant ] [ Once per hour ] [ Once per day ] [ Never ]
Task reminders: [ 1 day before ] [ 6h before ] [ 1h before ] [ Never ]
```

### Time Blocking

```
Do Not Disturb: 9pm - 7am (customizable)
Focus Mode: Disable movement breaks during this window
Availability: Show when I'm free to receive notifications
```

### Escalation Strategy

```
First attempt: Soft notification (in-app only)
After 2 hours: Desktop notification (if enabled)
After 4 hours: Bell icon badge (mild visual reminder)
After 1 day: Show as overdue (for critical tasks only)
```

---

## What NOT to Do

❌ **Gamification badges** ("You've logged meds 30 days in a row!")
❌ **Phantom vibrations** (notifications you don't remember opting into)
❌ **Urgency inflation** (everything marked "urgent")
❌ **Social proof** ("10 of your friends logged meds today")
❌ **Streak breaking** ("You'll lose your 30-day streak if you miss today")
❌ **Guilt** ("We notice you haven't...")
❌ **Behavioral nudging** ("Most people take breaks after 60 minutes")
❌ **Dark patterns** (hiding the "disable" option)

---

## Metrics That Matter

**NOT USEFUL:**
- Notification click-through rate
- Push notification opens
- Notification frequency
- Days with notification streaks

**USEFUL:**
- Did the user take the action? (e.g., did they take meds when reminded?)
- Did they disable the notification? (Collect feedback)
- Did they change the frequency? (Means it's not working for them)
- User satisfaction (simple 1-5 survey: "Was this helpful?")

---

## Implementation Checklist

- [ ] All notifications have an opt-out button
- [ ] User can customize frequency for each type
- [ ] No sound by default
- [ ] No badge on app icon (except BONDING when Bash is online)
- [ ] Notifications respect system Do Not Disturb settings
- [ ] User can set time windows (e.g., no notifications 9pm-7am)
- [ ] One-tap dismiss (no second confirmation)
- [ ] Snooze options available for all notifications
- [ ] Tone is consistent across all notifications
- [ ] No guilt, urgency inflation, or dark patterns
- [ ] Data logged: notification sent, action taken (or dismissed)
- [ ] User can export their notification history

---

## Tone Examples

### ✅ Good Notification Tone

- "Your meds are ready" (factual)
- "Want to take a break?" (offering, not commanding)
- "Bash is online" (informational)
- "You've been focused for 90 minutes" (observational)
- "When you're ready, check your messages" (no rush)

### ❌ Bad Notification Tone

- "Don't forget to take your meds!" (naggy)
- "Stop scrolling and take a break!" (controlling)
- "Bash MISSES you! Come play now!" (manipulative)
- "You've been lazy for 90 minutes" (guilt)
- "Your streak is in danger!" (artificial urgency)

---

## Future Enhancements

- **AI-powered timing:** Learn when user is most receptive to notifications
- **Context awareness:** Don't interrupt during focus sessions or family time
- **Conversation format:** Multi-turn notifications ("How's your mood?" → "Want to talk?")
- **Offline queueing:** Notifications stack and deliver when user comes online
- **Network effects:** "Bash also just took his meds" (peer support, opt-in)

---

Remember: **Notifications are for the user, not for us.** They should make the user's life easier, not our engagement metrics look better.
