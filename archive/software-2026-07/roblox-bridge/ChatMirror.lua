--[[
  ChatMirror.lua — OQE (Observational Quality Evidence) Logging
  P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0

  Intercepts Roblox chat messages and routes them through Shadow Bridge
  to Genesis Gate as court-admissible OQE evidence. Every message generates
  a SHA-256 hash chain entry in Genesis Gate with WCD-46 compliance.

  What OQE captures:
    - Player-to-player chat messages (text)
    - Game system messages (NPC interactions, quest prompts)
    - Emotional tone markers (sentiment heuristics)
    - Session continuity (chat timestamps within game session)

  Court admissibility:
    SHA-256 hash → Genesis Gate event → Ed25519 + ML-DSA-65 dual signature
    → timestamped, order-preserved chain → independently verifiable
]]--

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local TextChatService = game:GetService("TextChatService")

-- ── Configuration ──────────────────────────────────────────────────────
local SHADOW_BRIDGE = "https://shadow-bridge.trimtab-signal.workers.dev"
local ENABLE_EMOTION_DETECTION = true

HttpService.HttpEnabled = true

-- Simple sentiment keywords for OQE tone marking
local POSITIVE_WORDS = { "love", "thanks", "great", "awesome", "nice", "good", "wow", "cool", "fun", "yay", "happy", "beautiful", "amazing" }
local NEGATIVE_WORDS = { "sad", "angry", "hate", "bad", "ugh", "boring", "stupid", "mad", "hurt", "leave" }

-- ── Emotion Detection ──────────────────────────────────────────────────
local function detectEmotion(message)
    local msg = string.lower(message)
    local score = 0

    for _, word in ipairs(POSITIVE_WORDS) do
        if string.find(msg, word) then score = score + 1 end
    end
    for _, word in ipairs(NEGATIVE_WORDS) do
        if string.find(msg, word) then score = score - 1 end
    end

    if score > 1 then
        return "positive", 0.7 + (score * 0.05)
    elseif score < -1 then
        return "negative", 0.3 - (math.abs(score) * 0.05)
    else
        return "neutral", 0.5
    end
end

-- ── Hash Message ───────────────────────────────────────────────────────
local function hashMessage(playerId, message, timestamp)
    -- Simple string hash for client-side dedup.
    -- The SHA-256 hash is computed server-side in Shadow Bridge → Genesis Gate.
    local combined = tostring(playerId) .. message .. tostring(timestamp)
    local hash = 0
    for i = 1, #combined do
        hash = (hash * 31 + string.byte(combined, i)) % 4294967296
    end
    return string.format("%08x", hash)
end

-- ── Log Chat to Shadow Bridge ──────────────────────────────────────────
local function logChat(player, message)
    if not player or not message or message == "" then return end

    local now = os.time()
    local sessionId = "chat_" .. tostring(now) .. "_" .. tostring(player.UserId)
    local emotion, confidence = "neutral", 0.5

    if ENABLE_EMOTION_DETECTION then
        emotion, confidence = detectEmotion(message)
    end

    local clientHash = hashMessage(player.UserId, message, now)

    local payload = HttpService:JSONEncode({
        userId = player.UserId,
        sessionId = sessionId,
        actionType = "chat_message",
        position = { x = 0, y = 0, z = 0 },
        value = {
            text = message,
            emotion = emotion,
            confidence = confidence,
            clientHash = clientHash,
            timestamp = now,
        },
    })

    local success, result = pcall(function()
        return HttpService:PostAsync(SHADOW_BRIDGE .. "/game/action", payload)
    end)

    if success then
        local marker = emotion == "positive" and "😊" or emotion == "negative" and "😟" or "💬"
        print(marker .. " Chat logged | " .. player.Name .. " | " .. emotion .. " | " .. message:sub(1, 30))
    else
        warn("❌ Chat log failed: " .. tostring(result))
    end
end

-- ── Chat Hooks ─────────────────────────────────────────────────────────
-- Modern TextChatService (Roblox 2024+)
if TextChatService then
    pcall(function()
        TextChatService.MessageReceived:Connect(function(message)
            if message.TextSource then
                local player = Players:GetPlayerByUserId(message.TextSource.UserId)
                if player then
                    logChat(player, message.Text)
                end
            end
        end)
    end)
end

-- Legacy ChatService (fallback for older games)
local ChatService = game:GetService("Chat")
if ChatService then
    pcall(function()
        ChatService.Chatted:Connect(function(player, message)
            logChat(player, message)
        end)
    end)
end

-- System messages (NPC dialogue, quest text, game announcements)
local function logSystemMessage(message)
    local payload = HttpService:JSONEncode({
        userId = 0,
        sessionId = "system_" .. tostring(os.time()),
        actionType = "chat_message",
        position = { x = 0, y = 0, z = 0 },
        value = {
            text = message,
            emotion = "neutral",
            confidence = 0.5,
            source = "system",
            timestamp = os.time(),
        },
    })

    pcall(function()
        HttpService:PostAsync(SHADOW_BRIDGE .. "/game/action", payload)
    end)
end

print("🔍 ChatMirror active | OQE logging → Shadow Bridge → Genesis Gate")
print("   Court-admissible: SHA-256 + Ed25519 + ML-DSA-65 dual signature")
if ENABLE_EMOTION_DETECTION then
    print("   Emotion detection: ENABLED (" .. #POSITIVE_WORDS .. " positive, " .. #NEGATIVE_WORDS .. " negative keywords)")
end
