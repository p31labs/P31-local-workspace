/**
 * P31 ORACLE TERMINAL - ATOMIC SPOON ECONOMY LOCK
 * Stack Layer: p31.c (KWAI)
 * Compliance: HIPAA Safe Harbor / Medical Device Safety
 * Purpose: Prevents cognitive overload by enforcing Spoon-based search limits
 */

import { Redis } from 'ioredis';

// Environment Configuration
const redis = new Redis(process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379');

// Lua Script for Atomic Spoon Deduction
const SECURE_EXPEND_SPOON_LUA = `
-- Atomic Spoon Deduction with Clinical Safety Checks
-- KEYS[1]: user key (e.g., "user:abc123")
-- KEYS[2]: idempotency lock key (e.g., "lock:search:uuid")
-- ARGV[1]: current timestamp
-- ARGV[2]: lock expiration in seconds (default: 300s / 5 minutes)
-- ARGV[3]: daily reset timestamp (00:00 UTC)

local userKey = KEYS[1]
local lockKey = KEYS[2]
local now = tonumber(ARGV[1])
local lockExpiry = tonumber(ARGV[2]) or 300
local dailyReset = tonumber(ARGV[3]) or (now - (now % 86400) + 86400) -- Next midnight UTC

-- 1. Check Idempotency Lock (Prevent duplicate rapid searches)
local existingLock = redis.call('GET', lockKey)
if existingLock then
    return {0, "IDEMPOTENT_REJECT", "Duplicate search detected. Safe-shield engaged."}
end

-- 2. Set Idempotency Lock (300 second expiration)
redis.call('SET', lockKey, now, 'EX', lockExpiry)

-- 3. Get Current User State
local userData = redis.call('HMGET', userKey, 'spoons', 'last_reset', 'search_count')
local currentSpoons = tonumber(userData[1]) or 5
local lastReset = tonumber(userData[2]) or 0
local searchCount = tonumber(userData[3]) or 0

-- 4. Daily Spoon Reset Logic
if now >= dailyReset or lastReset < (now - 86400) then
    currentSpoons = 5
    lastReset = dailyReset
    redis.call('HMSET', userKey, 'spoons', currentSpoons, 'last_reset', lastReset, 'search_count', 0)
    redis.call('EXPIRE', userKey, 604800) -- 7 day expiration
end

-- 5. Clinical Safety Check (Prevent cognitive overload)
if currentSpoons <= 0 then
    return {0, "CLINICAL_HALT", "Cognitive capacity depleted. Search interface locked until 00:00 UTC."}
end

-- 6. Rate Limiting Check (Maximum 20 searches per day)
if searchCount >= 20 then
    return {0, "RATE_LIMIT", "Daily search limit reached. Please rest and try again tomorrow."}
end

-- 7. Deduct Spoon and Update State
currentSpoons = currentSpoons - 1
searchCount = searchCount + 1

redis.call('HMSET', userKey, 
    'spoons', currentSpoons, 
    'last_reset', lastReset, 
    'search_count', searchCount,
    'last_search', now
)

redis.call('EXPIRE', userKey, 604800) -- 7 day expiration

-- 8. Return Success with Updated Spoon Count
return {1, "SUCCESS", currentSpoons}
`;

/**
 * Securely deducts 1 Spoon from user's balance with atomic operations
 * @param userKey - Redis key for user (e.g., "user:abc123")
 * @param interactionId - UUID for idempotency (e.g., "lock:search:uuid")
 * @returns - Remaining spoons after deduction
 * @throws - If clinical halt, rate limit, or idempotency violation occurs
 */
async function secureExpendSpoon(userKey: string, interactionId: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const lockKey = `lock:${interactionId}`;
    
    try {
        const result: any = await redis.eval(
            SECURE_EXPEND_SPOON_LUA,
            2, // Number of keys
            userKey,
            lockKey,
            now,
            300, // 5 minute lock expiry
            now - (now % 86400) + 86400 // Next midnight UTC for daily reset
        );

        const success = result[0] === 1;
        const status = result[1];
        const message = result[2];

        if (!success) {
            throw new Error(message);
        }

        return parseInt(message, 10); // Return remaining spoons

    } catch (error: any) {
        if (error.message.includes("CLINICAL_HALT") || 
            error.message.includes("RATE_LIMIT") || 
            error.message.includes("IDEMPOTENT_REJECT")) {
            throw error;
        }
        
        console.error("[SPOON LOCK ERROR]", error);
        throw new Error("Spoon economy system temporarily unavailable. Please try again in 30 seconds.");
    }
}

/**
 * Gets current user state without modifying it
 * @param userKey - Redis key for user
 * @returns - User state with spoons, search count, etc.
 */
async function getUserState(userKey: string): Promise<{
    spoons: number;
    searchCount: number;
    lastReset: number;
    lastSearch: number;
}> {
    try {
        const userData = await redis.hmget(userKey, 'spoons', 'search_count', 'last_reset', 'last_search');
        
        return {
            spoons: parseInt(userData[0] || '5', 10),
            searchCount: parseInt(userData[1] || '0', 10),
            lastReset: parseInt(userData[2] || '0', 10),
            lastSearch: parseInt(userData[3] || '0', 10)
        };
    } catch (error: any) {
        console.error("[USER STATE ERROR]", error);
        return {
            spoons: 5,
            searchCount: 0,
            lastReset: 0,
            lastSearch: 0
        };
    }
}

/**
 * Manually resets user's daily spoon allocation (for testing or admin use)
 * @param userKey - Redis key for user
 * @returns - Promise that resolves when reset is complete
 */
async function resetDailySpoons(userKey: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const nextReset = now - (now % 86400) + 86400;
    
    try {
        await redis.hmset(userKey, {
            spoons: 5,
            search_count: 0,
            last_reset: nextReset,
            last_search: 0
        });
        await redis.expire(userKey, 604800); // 7 day expiration
    } catch (error: any) {
        console.error("[RESET ERROR]", error);
        throw new Error("Failed to reset daily spoons.");
    }
}

export { secureExpendSpoon, getUserState, resetDailySpoons };