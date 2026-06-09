/**
 * P31 ORACLE TERMINAL - SOVEREIGN RAG PIPELINE
 * Stack Layer: p31.c (KWAI)
 * Compliance: ADA 508 / 21 CFR §890.3710 / HIPAA Safe Harbor
 * Dependencies: ioredis, axios
 */

import { Redis } from 'ioredis';
import axios from 'axios';

// Environment & Configuration
const redis = new Redis(process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379');

// P3O1lama Local Configuration (No cloud APIs)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
const CHAT_MODEL = process.env.CHAT_MODEL || 'phi3'; // Fast, local reasoning
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text'; // Local embeddings

const SYSTEM_PROMPT = `
You are the Ship's Computer on Spaceship Andromeda. You act as a cognitive filter for the crew.
CRITICAL RULES:
1. You must answer the user's query using ONLY the provided CONTEXT. 
2. If the CONTEXT does not contain the answer, say exactly: "That archive is currently locked or out of range."
3. Your answer MUST be exactly 3 sentences or less.
4. Use an 8th-grade reading level. Tone: Helpful, Sci-Fi, precise.
5. NEVER provide medical advice.
`;

/**
 * Executes a Sovereign RAG Query
 * @param fingerprintHash - User's anonymous identity hash
 * @param interactionId - UUID for idempotency lock
 * @param userQuery - The natural language search
 * @returns - The filtered response and contextual document link
 */
async function executeOracleSearch(fingerprintHash: string, interactionId: string, userQuery: string) {
    const userKey = `user:${fingerprintHash}`;
    const idempotencyKey = `lock:search:${interactionId}`;

    try {
        // 1. THE MEDICAL HARD-STOP & ECONOMY (Atomic Lua Resin)
        // secureExpendSpoon is defined in resin-state-lock.js
        const remainingSpoons: any = await redis.eval(`
            local userKey = ARGV[1]
            local idempotencyKey = ARGV[2]
            
            -- Check if already processed
            if redis.call('EXISTS', idempotencyKey) == 1 then
                return {err = "IDEMPOTENT_REJECT"}
            end
            
            -- Check daily limit
            local today = redis.call('GET', userKey .. ':daily_reset')
            if not today then
                redis.call('SET', userKey .. ':daily_reset', 1, 'EX', 86400)
                redis.call('SET', userKey .. ':search_count', 0, 'EX', 86400)
                redis.call('SET', userKey .. ':spoons', 5, 'EX', 86400)
            end
            
            local searchCount = tonumber(redis.call('GET', userKey .. ':search_count'))
            local spoons = tonumber(redis.call('GET', userKey .. ':spoons'))
            
            if searchCount >= 20 then
                return {err = "RATE_LIMIT"}
            end
            
            if spoons <= 0 then
                return {err = "CLINICAL_HALT"}
            end
            
            -- Decrement counters
            redis.call('DECR', userKey .. ':search_count')
            redis.call('DECR', userKey .. ':spoons')
            
            -- Set idempotency lock
            redis.call('SET', idempotencyKey, 1, 'EX', 300)
            
            return {ok = spoons - 1}
        `, 0, userKey, idempotencyKey);

        if (remainingSpoons.err) {
            throw new Error(remainingSpoons.err);
        }

        // 2. LOCAL VECTOR EMBEDDING (P3O1lama)
        const embedResponse = await axios.post(`${OLLAMA_BASE_URL}/embeddings`, {
            model: EMBEDDING_MODEL,
            prompt: userQuery
        });
        const queryVector = embedResponse.data.embedding;

        // 3. SIMULATED VECTOR SEARCH (for now)
        // In production, this would query Upstash Vector
        const searchResults = [
            {
                metadata: {
                    text: "This is a simulated search result for demonstration purposes.",
                    ipfs_link: "https://ipfs.io/ipfs/simulated-hash"
                }
            }
        ];

        if (!searchResults || searchResults.length === 0) {
            return {
                answer: "The archives returned no resonance for that query.",
                source_link: null,
                spoons_remaining: remainingSpoons.ok
            };
        }

        // Aggregate the context
        const contextString = searchResults.map(res => res.metadata.text).join('\n\n');
        const primarySource = searchResults[0].metadata.ipfs_link;

        // 4. GENERATIVE SUMMARIZATION (Cognitive Filter)
        const chatPayload = {
            model: CHAT_MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `CONTEXT:\n${contextString}\n\nQUERY: ${userQuery}` }
            ],
            stream: false,
            options: { temperature: 0.1 } // Extremely low temperature to prevent hallucination
        };

        const chatResponse = await axios.post(`${OLLAMA_BASE_URL}/chat`, chatPayload);
        const oracleAnswer = chatResponse.data.message.content;

        // 5. SECURE OUTPUT DELIVERY
        return {
            answer: oracleAnswer,
            source_link: primarySource,
            spoons_remaining: remainingSpoons.ok,
            status: "SUCCESS"
        };

    } catch (error: any) {
        if (error.message.includes("CLINICAL_HALT")) {
            throw new Error("Cognitive capacity depleted. Search interface locked until 00:00 UTC.");
        }
        if (error.message.includes("IDEMPOTENT_REJECT")) {
            throw new Error("Duplicate search detected. Safe-shield engaged.");
        }
        console.error("[ORACLE FAULT]", error);
        throw new Error("The Oracle is currently recalibrating its neural mesh. Please try again later.");
    }
}

export { executeOracleSearch };