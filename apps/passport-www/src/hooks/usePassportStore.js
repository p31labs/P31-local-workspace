import { create } from 'zustand';
;
;
const DEFAULT = { edition: '5.1', createdAt: new Date().toISOString(), actors: [{ id: 'Operator', name: 'Will', role: 'Operator / Founder' }, { id: 'Supervisor', name: 'P31 Supervisor', role: 'AI auth-offload coach' }, { id: 'Sonnet', name: 'Sonnet', role: 'Mechanic — UI, React, Python, WCD, tests' }, { id: 'DeepSeek', name: 'DeepSeek', role: 'Firmware — ESP32, C, hardware' }] };
export const usePassportStore = create((set, get) => ({ passport: DEFAULT, addActor: (a) => set(s => ({ passport: { ...s.passport, actors: [...s.passport.actors, a] } })), removeActor: (id) => set(s => ({ passport: { ...s.passport, actors: s.passport.actors.filter(a => a.id !== id) } })), exportJSON: () => JSON.stringify(get().passport, null, 2), exportMD: () => `# P31 Cognitive Passport v${get().passport.edition}\n\n${get().passport.actors.map(a => `- **${a.id}** — ${a.name}: ${a.role}`).join('\n')}\n` }));
//# sourceMappingURL=usePassportStore.js.map