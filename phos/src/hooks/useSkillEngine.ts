import { useState, useEffect, useCallback } from 'react';

const DEFAULT_SKILLS = [
  {
    skill_id: 'sensory_gray_rock',
    version: 1,
    domain: 'somatic',
    trigger: { type: 'spoon_drop', threshold: 1, context: [] },
    action: { type: 'ui_override', payload: { css_class: 'gray-rock-mode', animation_duration: 0.01, contrast: 'low', monochrome: true } },
    xp_reward: 25,
    guardian_unlock: 'shield_tier',
  },
  {
    skill_id: 'sensory_breathing_guide',
    version: 1,
    domain: 'somatic',
    trigger: { type: 'spoon_drop', threshold: 2, context: [] },
    action: { type: 'audio_cue', payload: { frequency: 0.1, pattern: 'larmor_fade', text_fallback: 'Breathe in… and out.' } },
    xp_reward: 15,
    guardian_unlock: null,
  },
  {
    skill_id: 'executive_task_fracture',
    version: 1,
    domain: 'executive',
    trigger: { type: 'hesitation', threshold: 45, context: ['no_input'] },
    action: { type: 'akinator_prompt', payload: { prompt: 'Are we stuck on starting, or stuck on deciding?', follow_up: 'Just one tiny step. What\'s the smallest thing you could do right now?' } },
    xp_reward: 30,
    guardian_unlock: null,
  },
  {
    skill_id: 'guardian_voice_affirmation',
    version: 1,
    domain: 'guardian',
    trigger: { type: 'guardian_unlock', threshold: 30, context: [] },
    action: { type: 'tts_phrase', payload: { phrase: 'You\'re doing great. Keep going.' } },
    xp_reward: 0,
    guardian_unlock: 'sparkle_tier',
  },
  {
    skill_id: 'transition_bridge',
    version: 1,
    domain: 'companion',
    trigger: { type: 'task_transition', threshold: 0, context: ['high_dopamine_to_high_friction'] },
    action: { type: 'akinator_game', payload: { duration: 180, style: 'low_stakes', prompt: 'Quick brain reset before we switch tasks.' } },
    xp_reward: 20,
    guardian_unlock: null,
  },
];

export type Skill = typeof DEFAULT_SKILLS[number];
export type SkillAction = Skill['action'];

export function useSkillEngine(childId: string | undefined) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggered, setTriggered] = useState<SkillAction | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      const url = childId ? `/api/skills?child_id=${encodeURIComponent(childId)}` : '/api/skills';
      const res = await fetch(url);
      const data = (await res.json()) as Skill[];
      setSkills(Array.isArray(data) ? data : DEFAULT_SKILLS);
    } catch {
      setSkills(DEFAULT_SKILLS);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const triggerSkill = useCallback(async (skill: Skill) => {
    try {
      const body: Record<string, unknown> = { skill_id: skill.skill_id };
      if (childId) body.child_id = childId;
      const res = await fetch('/api/skills/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { action?: SkillAction };
      if (data?.action) setTriggered(data.action);
    } catch {
      setTriggered(skill.action);
    }
  }, [childId]);

  const applyAction = useCallback((action: SkillAction) => {
    const el = document.body;
    switch (action.type) {
      case 'ui_override': {
        const { css_class } = action.payload;
        Object.values(action.payload).forEach((val) => {
          if (typeof val === 'string') el.classList.add(val);
        });
        break;
      }
      case 'audio_cue': {
        const { text_fallback } = action.payload;
        if (text_fallback) {
          if (!window.speechSynthesis) return;
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text_fallback);
          u.rate = 0.85;
          u.pitch = 1.1;
          window.speechSynthesis.speak(u);
        }
        break;
      }
      case 'tts_phrase': {
        const { phrase } = action.payload;
        if (!window.speechSynthesis || !phrase) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(phrase);
        u.rate = 0.85;
        u.pitch = 1.1;
        window.speechSynthesis.speak(u);
        break;
      }
      case 'akinator_prompt':
      case 'akinator_game':
      case 'guardian_animation':
        setTriggered(action);
        break;
      default:
        break;
    }
  }, []);

  return {
    skills,
    loading,
    triggered,
    triggerSkill,
    applyAction,
    refetch: fetchSkills,
  };
}

export default useSkillEngine;
