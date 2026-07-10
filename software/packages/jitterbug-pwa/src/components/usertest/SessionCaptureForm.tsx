import React, { useState } from 'react';
import { useUserTest } from '../../hooks/useUserTest';

export default function SessionCaptureForm() {
  const { data } = useUserTest('participants');
  const participants = Array.isArray(data) ? data : [];
  const { mutate } = useUserTest('sessions');
  const [form, setForm] = useState({
    participant_id: '', phase: 1, format: 'remote',
    spoons_start: 3, spoons_end: 3, payment_amount: 25, notes: '',
  });
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await mutate('POST', {
        ...form,
        participant_id: Number(form.participant_id),
        payment_amount: Number(form.payment_amount),
      });
      setStatus('saved');
    } catch (err: any) {
      setStatus(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel p-4 space-y-3">
      <h2 className="text-sm font-semibold text-quantum-cyan">Log Session</h2>
      <select
        value={form.participant_id}
        onChange={(e) => setForm({ ...form, participant_id: e.target.value })}
        aria-label="Participant"
        className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white"
      >
        <option value="">Select participant…</option>
        {participants.map((p: any) => (
          <option key={p.id} value={p.id}>{p.pseudonym}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <label className="text-xs text-cloud flex-1">Phase
          <input type="number" min={1} max={5} value={form.phase}
            onChange={(e) => setForm({ ...form, phase: Number(e.target.value) })}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white" />
        </label>
        <label className="text-xs text-cloud flex-1">Format
          <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white">
            <option value="remote">remote</option>
            <option value="in-person">in-person</option>
            <option value="async">async</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <label className="text-xs text-cloud flex-1">Spoons start
          <input type="number" min={1} max={5} value={form.spoons_start}
            onChange={(e) => setForm({ ...form, spoons_start: Number(e.target.value) })}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white" />
        </label>
        <label className="text-xs text-cloud flex-1">Spoons end
          <input type="number" min={1} max={5} value={form.spoons_end}
            onChange={(e) => setForm({ ...form, spoons_end: Number(e.target.value) })}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white" />
        </label>
        <label className="text-xs text-cloud flex-1">Pay ($)
          <input type="number" value={form.payment_amount}
            onChange={(e) => setForm({ ...form, payment_amount: Number(e.target.value) })}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded px-2 text-white" />
        </label>
      </div>
      <button type="submit"
        className="min-h-[48px] w-full bg-quantum-cyan text-black font-semibold rounded">
        Save Session
      </button>
      {status && <p className="text-xs text-cloud">{status}</p>}
    </form>
  );
}
