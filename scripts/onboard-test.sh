#!/bin/bash
# Real-user onboarding test — registers a parent, creates room, sends packet
# Usage: ./scripts/onboard-test.sh

set -e

K4_URL="${K4_URL:-https://k4-cage.trimtab-signal.workers.dev}"
TEST_SUFFIX=$(date +%s | sha256sum | head -c 8)

echo "🧪 P31 Onboarding Test (real D1/KV)"
echo "=================================="

# 1. Register parent
echo "1. Registering parent..."
PARENT_RESP=$(curl -s -X POST "$K4_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"did\": \"did:key:z${TEST_SUFFIX}parent\",
    \"nodeType\": \"PARENT_A\",
    \"displayName\": \"Test-Parent-${TEST_SUFFIX}\",
    \"ed25519PublicKey\": \"test-ed25519-${TEST_SUFFIX}\",
    \"mldsa65PublicKey\": \"test-mldsa65-${TEST_SUFFIX}\"
  }")
PARENT_API_KEY=$(echo "$PARENT_RESP" | jq -r '.apiKey')
echo "   ✅ Parent API Key: ${PARENT_API_KEY:0:20}..."

# 2. Register child
echo "2. Registering child..."
CHILD_RESP=$(curl -s -X POST "$K4_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"did\": \"did:key:z${TEST_SUFFIX}child\",
    \"nodeType\": \"CHILD\",
    \"displayName\": \"Test-Child-${TEST_SUFFIX}\",
    \"ed25519PublicKey\": \"test-ed25519-child-${TEST_SUFFIX}\",
    \"mldsa65PublicKey\": \"test-mldsa65-child-${TEST_SUFFIX}\"
  }")
CHILD_API_KEY=$(echo "$CHILD_RESP" | jq -r '.apiKey')
echo "   ✅ Child API Key: ${CHILD_API_KEY:0:20}..."

# 3. Create BONDING room
echo "3. Creating BONDING room..."
ROOM_RESP=$(curl -s -X POST "$K4_URL/bonding/room" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARENT_API_KEY" \
  -d "{
    \"payload\": {
      \"childDid\": \"did:key:z${TEST_SUFFIX}child\",
      \"mode\": \"seed\"
    }
  }")
ROOM_ID=$(echo "$ROOM_RESP" | jq -r '.roomId')
echo "   ✅ Room ID: $ROOM_ID"

# 4. Join room as child
echo "4. Joining room as child..."
JOIN_RESP=$(curl -s -X POST "$K4_URL/bonding/room/${ROOM_ID}/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CHILD_API_KEY" \
  -d "{\"childDid\": \"did:key:z${TEST_SUFFIX}child\"}")
JOIN_STATUS=$(echo "$JOIN_RESP" | jq -r '.joined')
echo "   ✅ Joined: $JOIN_STATUS"

# 5. Send packet
echo "5. Sending packet..."
PACKET_RESP=$(curl -s -X POST "$K4_URL/packet" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARENT_API_KEY" \
  -d "{
    \"edgeId\": \"edge-did:key:z${TEST_SUFFIX}parent-did:key:z${TEST_SUFFIX}child\",
    \"senderDid\": \"did:key:z${TEST_SUFFIX}parent\",
    \"category\": \"LOGISTICS\",
    \"action\": \"PROPOSE\",
    \"objectId\": \"test-${TEST_SUFFIX}\",
    \"payload\": {\"text\": \"Test packet from onboard test.\"},
    \"nspMode\": true,
    \"impedanceContribution\": -0.05
  }")
PACKET_ID=$(echo "$PACKET_RESP" | jq -r '.packetId')
echo "   ✅ Packet ID: $PACKET_ID"

echo ""
echo "✅ Onboarding test complete."
echo "   Test DIDs: did:key:z${TEST_SUFFIX}parent, did:key:z${TEST_SUFFIX}child"
echo "   Room ID: $ROOM_ID"
echo "   Packet ID: $PACKET_ID"
echo ""
echo "⚠️  Cleanup: Delete test DIDs from D1 manually or via admin endpoint."
