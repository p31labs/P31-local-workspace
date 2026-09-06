// System-wide event type extensions — WCD-M03
// These are additive. BONDING events (GameEventType) are the subset defined in events/.

export type NavStateChangeEvent = {
  type: 'NAV_STATE_CHANGE';
  payload: { from: string; to: string; timestamp: number };
};

export type BufferIngestEvent = {
  type: 'BUFFER_INGEST';
  payload: { messageId: string; voltage: number; timestamp: number };
};

export type SpoonSpendEvent = {
  type: 'SPOON_SPEND';
  payload: { amount: number; reason: string; timestamp: number };
};

export type SpoonRestoreEvent = {
  type: 'SPOON_RESTORE';
  payload: { amount: number; source: string; timestamp: number };
};

export type CalciumLoggedEvent = {
  type: 'CALCIUM_LOGGED';
  payload: { dose: number; timestamp: number };
};

export type WcdCompleteEvent = {
  type: 'WCD_COMPLETE';
  payload: { wcdId: string; timestamp: number };
};

export type SystemEvent =
  | NavStateChangeEvent
  | BufferIngestEvent
  | SpoonSpendEvent
  | SpoonRestoreEvent
  | CalciumLoggedEvent
  | WcdCompleteEvent;
