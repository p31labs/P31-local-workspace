--[[
  Portal.lua — Exit Door → Cognitive Passport DID Binding
  P31 Labs, Inc. | EIN 42-1888158 | AGPL-3.0

  Detects when a player approaches the exit portal in the Roblox world.
  Triggers a PLAYER_JOIN event via HttpService to the Shadow Bridge,
  initiating the Cognitive Passport DID binding flow.

  Architecture:
    Portal.Touched → HttpService:PostAsync → shadow-bridge:/game/join
                                           → shadow-bridge:/game/auth/spawn

  R15 Compliance: Uses GetBoundingBox() for avatar spatial validation.
]]--

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

-- ── Configuration ──────────────────────────────────────────────────────
local SHADOW_BRIDGE = "https://shadow-bridge.trimtab-signal.workers.dev"
local PORTAL_COOLDOWN = 5  -- seconds between portal activations per player

-- Enable HTTP
HttpService.HttpEnabled = true

-- Cooldown tracker
local cooldowns = {}

-- ── Portal Part ────────────────────────────────────────────────────────
local portal = workspace:FindFirstChild("ExitPortal")
if not portal then
    portal = Instance.new("Part")
    portal.Name = "ExitPortal"
    portal.Size = Vector3.new(12, 10, 2)
    portal.Anchored = true
    portal.CanCollide = false
    portal.Transparency = 0.6
    portal.BrickColor = BrickColor.new("Bright violet")
    portal.Material = Enum.Material.Neon
    portal.Parent = workspace

    -- Add glow effect
    local light = Instance.new("PointLight")
    light.Brightness = 2
    light.Range = 20
    light.Color = Color3.fromRGB(138, 43, 226)
    light.Parent = portal

    -- Billboard label
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(10, 0, 2, 0)
    billboard.StudsOffset = Vector3.new(0, 5, 0)
    billboard.Parent = portal

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "✦ P31 PORTAL ✦\nEnter to bind Cognitive Passport"
    label.TextColor3 = Color3.fromRGB(200, 162, 255)
    label.TextScaled = true
    label.Font = Enum.Font.SciFi
    label.Parent = billboard
end

-- ── Portal Animation ───────────────────────────────────────────────────
local function pulsePortal()
    local tweenInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
    local goal = { Size = portal.Size + Vector3.new(0.5, 0.5, 0.5) }
    local tween = TweenService:Create(portal, tweenInfo, goal)
    tween:Play()
end

RunService.Heartbeat:Connect(function()
    portal.CFrame = portal.CFrame * CFrame.Angles(0, 0.01, 0)
end)

pulsePortal()

-- ── Portal Activation ──────────────────────────────────────────────────
local function onPortalTouched(player, character)
    if not player or not character then return end

    -- Cooldown check
    local now = os.time()
    local userId = player.UserId
    if cooldowns[userId] and now - cooldowns[userId] < PORTAL_COOLDOWN then
        return
    end
    cooldowns[userId] = now

    local sessionId = "portal_" .. tostring(now) .. "_" .. tostring(userId)

    -- R15 compliance: get bounding box
    local r15Height = 5
    pcall(function()
        local _, size = character:GetBoundingBox()
        r15Height = size.Y or 5
    end)

    -- Send spawn/auth to Shadow Bridge
    local spawnPayload = HttpService:JSONEncode({
        userId = tostring(userId),
        sessionId = sessionId,
        position = {
            x = math.floor(character:GetPivot().Position.X),
            y = math.floor(character:GetPivot().Position.Y + r15Height),
            z = math.floor(character:GetPivot().Position.Z),
        },
    })

    local spawnSuccess, spawnResult = pcall(function()
        return HttpService:PostAsync(SHADOW_BRIDGE .. "/game/auth/spawn", spawnPayload)
    end)

    -- Send join event
    local joinPayload = HttpService:JSONEncode({
        userId = tostring(userId),
        playerName = player.Name,
        sessionId = sessionId,
        avatarId = "R15_" .. player.UserId,
    })

    local joinSuccess, joinResult = pcall(function()
        return HttpService:PostAsync(SHADOW_BRIDGE .. "/game/join", joinPayload)
    end)

    if joinSuccess and spawnSuccess then
        print("✨ Portal activated | " .. player.Name .. " | Session: " .. sessionId)
        print("   R15 Height: " .. r15Height .. " studs")

        -- Visual feedback
        local flash = Instance.new("ParticleEmitter")
        flash.Texture = "rbxassetid://123456789"
        flash.Rate = 1000
        flash.Lifetime = NumberRange.new(0.3, 0.8)
        flash.Speed = NumberRange.new(5, 10)
        flash.Parent = portal
        task.delay(2, function() flash:Destroy() end)

        -- Notify player
        local notification = Instance.new("Message")
        notification.Text = "🔷 Cognitive Passport bound! DID: p31:user:" .. tostring(userId)
        notification.Parent = player.PlayerGui
        task.delay(5, function() notification:Destroy() end)
    else
        warn("❌ Portal failed for " .. player.Name)
        if not joinSuccess then warn("   Join: " .. tostring(joinResult)) end
        if not spawnSuccess then warn("   Spawn: " .. tostring(spawnResult)) end
    end
end

-- ── Touch Detection ────────────────────────────────────────────────────
portal.Touched:Connect(function(hit)
    local character = hit.Parent
    if not character then return end
    local player = Players:GetPlayerFromCharacter(character)
    if not player then return end
    onPortalTouched(player, character)
end)

-- Alternative: proximity-based detection
RunService.Heartbeat:Connect(function()
    local now = os.time()
    for _, player in ipairs(Players:GetPlayers()) do
        if cooldowns[player.UserId] and now - cooldowns[player.UserId] < PORTAL_COOLDOWN then
            continue
        end
        local character = player.Character
        if not character then continue end
        local dist = (character:GetPivot().Position - portal.Position).Magnitude
        if dist < 15 then
            onPortalTouched(player, character)
        end
    end
end)

print("🚪 Portal.lua active — Shadow Bridge: " .. SHADOW_BRIDGE)
print("   Exit portal → Cognitive Passport DID binding ready")
