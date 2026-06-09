-- Seed real legal deadlines from Johnson v. Johnson, 2025CV936
-- Case context from Cognitive Passport v2.5

INSERT OR IGNORE INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata) VALUES
  ('seed-psych-eval', 'Court-Ordered Psych Eval', 'Ordered March 18 by Judge Scarlett. At Will expense. Must identify competent evaluator who can distinguish AuDHD from bipolar mania.', '2026-04-30', 'legal', 'critical', 'pending', '[14,7,3,1]', '{"caseNumber":"2025CV936","court":"Camden County Superior Court","filingType":"psych_eval","notes":"Evaluator must understand AuDHD vs mania differential. HypoPT neurological symptoms can mimic psychiatric conditions."}'),

  ('seed-phone-calls', 'Phone Calls 2x/Week', 'Court-ordered March 18. First authorized contact since Feb 5. 2 phone calls per week with children.', '2026-04-01', 'legal', 'high', 'in_progress', '[7,3,1]', '{"caseNumber":"2025CV936","court":"Camden County Superior Court","filingType":"compliance","notes":"Ongoing obligation. Log every call attempt and completion."}'),

  ('seed-supervised-visits', 'Supervised Visits', 'Court-ordered March 18. First supervised visit authorization. Coordinate with supervisor.', '2026-04-07', 'legal', 'high', 'pending', '[7,3,1]', '{"caseNumber":"2025CV936","court":"Camden County Superior Court","filingType":"compliance","notes":"Schedule first supervised visit. Document everything."}'),

  ('seed-transcript', 'Court Reporter Transcript (Mar 18)', 'Same reporter as Feb 5 hearing. $75. Needed for ADA violation documentation — paramedic request ignored.', '2026-04-04', 'legal', 'high', 'pending', '[7,3,1]', '{"caseNumber":"2025CV936","court":"Camden County Superior Court","filingType":"document","notes":"Event 5 in ADA chain. Paramedic requested and ignored. Transcript is OQE."}'),

  ('seed-ada-complaint', 'ADA Title II Complaint Prep', 'Five documented events of deliberate indifference. Pattern established across 5 hearings. Prepare formal complaint or motion.', '2026-04-15', 'legal', 'high', 'pending', '[14,7,3,1]', '{"caseNumber":"2025CV936","court":"Camden County Superior Court","filingType":"motion","notes":"Events: (1) ADA request sanctions, (2) metabolic crisis ignored, (3-4) per v2.3, (5) paramedic ignored Mar 18."}'),

  ('seed-fers-followup', 'FERS Disability Follow-up', 'Eric Violette at OCHR Norfolk responded Feb 25. Needs follow-up if no movement. Filing deadline ~Sep 30, 2026.', '2026-04-10', 'legal', 'medium', 'pending', '[14,7,3,1]', '{"caseNumber":"N/A","court":"OPM/OCHR","filingType":"administrative","notes":"SF-3112A/B/C complete. Need SF-3112D/E from agency and SF-3107. Nuclear option: file direct to OPM Boyers PA per BAL 20-103."}'),

  ('seed-ssa-followup', 'SSA Disability Determination', 'Both consultative exams complete (Feb 20 telehealth psych, Feb 26 in-person physical). Awaiting determination.', '2026-04-30', 'legal', 'medium', 'pending', '[14,7,3,1]', '{"caseNumber":"N/A","court":"SSA","filingType":"administrative","notes":"Positive results from both exams reported. Follow up if no determination by end of April."}'),

  ('seed-gao-followup', 'Georgia Advocacy Office Follow-up', 'Contacted March 10 via thegao.org/advocacy-request/. Reframed from divorce to ADA Title II access-to-courts. Status unknown.', '2026-04-05', 'legal', 'medium', 'pending', '[7,3,1]', '{"caseNumber":"2025CV936","court":"GAO","filingType":"advocacy","notes":"Follow up on advocacy request status."}');

-- Seed alerts for the most urgent deadlines
INSERT OR IGNORE INTO alerts (id, deadline_id, type, scheduled_for, status, message) VALUES
  (hex(randomblob(16)), 'seed-transcript', 'email', '2026-03-29T07:00:00Z', 'scheduled', 'REMINDER: Court reporter transcript ($75) — Mar 18 hearing. ADA Event 5 evidence.'),
  (hex(randomblob(16)), 'seed-gao-followup', 'email', '2026-04-01T07:00:00Z', 'scheduled', 'REMINDER: Follow up with Georgia Advocacy Office on ADA complaint.'),
  (hex(randomblob(16)), 'seed-supervised-visits', 'email', '2026-04-03T07:00:00Z', 'scheduled', 'REMINDER: Schedule first supervised visit. Court-ordered Mar 18.'),
  (hex(randomblob(16)), 'seed-fers-followup', 'email', '2026-04-06T07:00:00Z', 'scheduled', 'REMINDER: Follow up with Eric Violette at OCHR Norfolk on FERS disability.');