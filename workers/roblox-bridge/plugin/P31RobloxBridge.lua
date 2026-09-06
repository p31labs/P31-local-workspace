-- P31RobloxBridge.lua
-- Roblox ModuleScript — bridges in-game events to the P31 Roblox Bridge worker.
--
-- Setup:
--   1. Place this ModuleScript in ReplicatedStorage (or ServerScriptService).
--   2. Ensure HttpService.HttpEnabled = true in Game Settings.
--   3. Require it from a Script or LocalScript:
--
--       local P31Bridge = require(game.ReplicatedStorage.P31RobloxBridge)
--       P31Bridge:init({ bridgeUrl = "https://roblox-bridge.trimtab-signal.workers.dev" })
--
--   4. Call the high-level helpers from your game logic:
--
--       P31Bridge:mintLove(player.UserId, 10, "quest_complete")
--       P31Bridge:syncPendingLove(player.UserId)
--
-- API surface (matches workers/roblox-bridge + workers/game-builder):
--   mintLove(userId, amount, reason, sessionId?)
--   queueAction(userId, sessionId, actionType)
--   getMintStatus(userId, sessionId?)
--   syncPendingLove(userId)        -- drains pending queue
--   createWorld(name, description, creatorDid?)
--   listWorlds()
--   getWorld(id)
--
-- All calls are async (return Promise via pcall + callback).

local P31RobloxBridge = {}
P31RobloxBridge.__index = P31RobloxBridge

-- ─── Configuration ────────────────────────────────────────────────────────────

P31RobloxBridge.DEFAULT_BRIDGE_URL = "https://roblox-bridge.trimtab-signal.workers.dev"
P31RobloxBridge.DEFAULT_GAME_BUILDER_URL = "https://game-builder.trimtab-signal.workers.dev/route"

-- ─── Internal helpers ─────────────────────────────────────────────────────────

local function getHttpService(): HttpService
  return game:GetService("HttpService")
end

local function getPlayers(): Players
  return game:GetService("Players")
end

function P31RobloxBridge.new(config)
  config = config or {}
  local self = setmetatable({}, P31RobloxBridge)
  self.bridgeUrl = config.bridgeUrl or P31RobloxBridge.DEFAULT_BRIDGE_URL
  self.gameBuilderUrl = config.gameBuilderUrl or P31RobloxBridge.DEFAULT_GAME_BUILDER_URL
  self.http = getHttpService()
  self.players = getPlayers()
  self._initialized = true
  return self
end

function P31RobloxBridge:init(config)
  return self:new(config)
end

local function request(self, method, url, body)
  local headers = {
    ["Content-Type"] = "application/json",
    ["Accept"] = "application/json",
  }

  local ok, result = pcall(function()
    return self.http:RequestAsync({
      Url = url,
      Method = method,
      Headers = headers,
      Body = body and self.http:JSONEncode(body) or nil,
    })
  end)

  if not ok then
    return nil, result
  end

  if not result.Success then
    return nil, result.StatusCode .. ": " .. (result.Body or "unknown error")
  end

  local decodeOk, decoded = pcall(function()
    return self.http:JSONDecode(result.Body)
  end)
  if not decodeOk then
    return decoded, "invalid JSON response"
  end

  return decoded, nil
end

-- ─── High-level API ──────────────────────────────────────────────────────────

-- Mint LOVE for a user (proxied to shadow-bridge /game/mint-love).
-- @param userId: number (Roblox UserId)
-- @param amount: number (> 0)
-- @param reason: string
-- @param sessionId: string | nil
-- @returns table | nil, string
function P31RobloxBridge:mintLove(userId, amount, reason, sessionId)
  local body = {
    userId = tostring(userId),
    amount = math.floor(amount),
    reason = reason or "roblox_mint",
    sessionId = sessionId,
  }
  return request(self, "POST", self.bridgeUrl .. "/game/mint-love", body)
end

-- Queue a LOVE reward for a game action milestone.
-- @param userId: number
-- @param sessionId: string
-- @param actionType: string — one of the EVENT_MAP keys in shadow-bridge
-- @returns table | nil, string
function P31RobloxBridge:queueAction(userId, sessionId, actionType)
  local body = {
    userId = tostring(userId),
    sessionId = sessionId,
    actionType = actionType or "block_placed",
  }
  return request(self, "POST", self.bridgeUrl .. "/game/action", body)
end

-- Read queued/pending LOVE + session state (non-consuming).
-- @param userId: number | nil
-- @param sessionId: string | nil
-- @returns table | nil, string
function P31RobloxBridge:getMintStatus(userId, sessionId)
  local url = self.bridgeUrl .. "/game/mint-status"
  local parts = {}
  if userId then table.insert(parts, "userId=" .. tostring(userId)) end
  if sessionId then table.insert(parts, "sessionId=" .. tostring(sessionId)) end
  if #parts > 0 then url = url .. "?" .. table.concat(parts, "&") end
  return request(self, "GET", url)
end

-- Drain pending LOVE events for a user (consuming).
-- @param userId: number
-- @returns table | nil, string
function P31RobloxBridge:syncPendingLove(userId)
  local body = { userId = tostring(userId) }
  return request(self, "POST", self.bridgeUrl .. "/game/pending-love", body)
end

-- Create a new game world via roblox-bridge → game-builder /route.
-- @param name: string
-- @param description: string | nil
-- @param creatorDid: string | nil
-- @returns table | nil, string
function P31RobloxBridge:createWorld(name, description, creatorDid)
  local body = {
    route = "worlds.create",
    payload = {
      name = name,
      description = description or "",
      creator_did = creatorDid,
    },
  }
  return request(self, "POST", self.gameBuilderUrl, body)
end

-- List all worlds via game-builder /route.
-- @returns table | nil, string
function P31RobloxBridge:listWorlds()
  local body = { route = "worlds.list", payload = {} }
  local result, err = request(self, "POST", self.gameBuilderUrl, body)
  if result and result.result then return result.result, nil end
  return result, err
end

-- Get a single world by id via game-builder /route.
-- @param id: string
-- @returns table | nil, string
function P31RobloxBridge:getWorld(id)
  local body = { route = "worlds.get", payload = { id = id } }
  local result, err = request(self, "POST", self.gameBuilderUrl, body)
  if result and result.result then return result.result, nil end
  return result, err
end

-- ─── Convenience: join a session (creates a DO-backed session in shadow-bridge) ─

-- Create a game session in shadow-bridge.
-- @param userId: number
-- @param sessionId: string
-- @param playerName: string | nil
-- @returns table | nil, string
function P31RobloxBridge:joinSession(userId, sessionId, playerName)
  local body = {
    userId = tostring(userId),
    sessionId = sessionId,
    playerName = playerName or "",
  }
  return request(self, "POST", self.bridgeUrl .. "/game/join", body)
end

-- ─── Module return ────────────────────────────────────────────────────────────

return P31RobloxBridge
