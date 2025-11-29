// Shared constants for Evn

export const AUTH = {
  MAGIC_LINK_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  TOKEN_LENGTH: 32,
  TOKEN_ID_LENGTH: 16,
} as const;

export const VALIDATION = {
  MIN_GROUP_NAME_LENGTH: 1,
  MAX_GROUP_NAME_LENGTH: 100,
  INVITE_CODE_LENGTH: 6,
  INVITE_CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Avoid confusing chars (0, O, 1, I)
} as const;

export const SYNC = {
  WEBSOCKET_RECONNECT_DELAY_MS: 1000,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
  OFFLINE_QUEUE_RETRY_DELAY_MS: 5000,
} as const;

export const UI = {
  DEFAULT_EMOJI: '👥',
  DEFAULT_CURRENCY: 'USD',
  ANIMATION_DURATION_MS: 200,
} as const;

export const PRECISION = {
  CURRENCY_DECIMAL_PLACES: 2,
  BALANCE_THRESHOLD: 0.01, // Amounts below this are considered zero
} as const;
