#!/usr/bin/env python3
"""
P31 Surrogate Backend - Catcher's Mitt Middleware
===============================================

Implements the Cognitive Shield using Redis Streams with:
- 60-second mandatory batching window
- Impedance Matching logic with No-Raw-Text protocol
- Voltage Scoring algorithm based on Dependency Distance
- Energy classification: Low (0-30%), Moderate (30-70%), High (70-100%)

Author: P31 Labs
License: MIT
"""

import os
import time
import json
import logging
import redis
from typing import Dict, Any, Tuple
from litellm import completion

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CatchersMitt:
    """Cognitive Shield middleware implementing Catcher's Mitt pattern"""
    
    def __init__(self):
        # Configure LiteLLM proxy pointing to local mesh
        os.environ["OPENAI_API_BASE"] = os.getenv("LITELLM_PROXY_URL", "http://localhost:4000/v1")
        os.environ["OPENAI_API_KEY"] = os.getenv("LITELLM_API_KEY", "sk-local-proxy-key")
        
        # Initialize Redis connection
        self.redis_client = redis.Redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True
        )
        
        # Stream names
        self.incoming_stream = "incoming_comms"
        self.sanitized_stream = "sanitized_comms"
        
        # Voltage scoring thresholds
        self.low_energy_threshold = 30
        self.moderate_energy_threshold = 70
        
        logger.info("🎯 Catcher's Mitt Initialized")
        logger.info(f"📡 Incoming Stream: {self.incoming_stream}")
        logger.info(f"📡 Sanitized Stream: {self.sanitized_stream}")
        logger.info(f"⚡ Voltage Thresholds: Low ≤{self.low_energy_threshold}%, Moderate ≤{self.moderate_energy_threshold}%")

    def calculate_voltage_score(self, text: str) -> int:
        """
        Calculate voltage score based on Dependency Distance (DD)
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            int: Voltage score (0-100)
        """
        try:
            # Simple DD approximation: sentence complexity and length
            words = text.split()
            if not words:
                return 0
                
            # Base score from text length and complexity
            base_score = min(len(words) * 0.5, 80)
            
            # Add complexity bonus for nested structures
            complexity_bonus = 0
            if any(char in text for char in ['(', '[', '{', ':', ';']):
                complexity_bonus += 10
            if any(word in text.lower() for word in ['because', 'therefore', 'however', 'although']):
                complexity_bonus += 5
                
            # Calculate final score
            voltage_score = min(int(base_score + complexity_bonus), 100)
            
            logger.debug(f"⚡ Voltage calculation: '{text[:50]}...' -> {voltage_score}%")
            return voltage_score
            
        except Exception as e:
            logger.error(f"❌ Voltage calculation failed: {e}")
            return 50  # Default medium voltage

    def categorize_energy(self, score: int) -> str:
        """
        Categorize energy level based on voltage score
        
        Args:
            score (int): Voltage score (0-100)
            
        Returns:
            str: Energy category with emoji
        """
        if score <= self.low_energy_threshold:
            return "LOW"
        elif score <= self.moderate_energy_threshold:
            return "MODERATE"
        else:
            return "HIGH"

    def execute_impedance_matching(self, raw_payload: str) -> str:
        """
        Execute Impedance Matching via No-Raw-Text protocol
        
        Args:
            raw_payload (str): Original unprocessed text
            
        Returns:
            str: BLUF (Bottom Line Up Front) facts only
        """
        try:
            # Construct prompt for BLUF extraction
            prompt = f"""ACT AS COGNITIVE BRIDGE. STRIP EMOTION AND URGENCY. EXTRACT ONLY ACTIONABLE BLUF FACTS.

CRITICAL: Return ONLY the essential facts in 1-3 bullet points. No explanations, no context, no emotional language.

RAW PAYLOAD:
{raw_payload}

BLUF FACTS:"""

            # Call local LLM via LiteLLM
            response = completion(
                model="hosted_vllm/llama3-local",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,  # Deterministic output
                max_tokens=200
            )
            
            bluf_fact = response.choices[0].message.content.strip()
            
            logger.info(f"🔧 Impedance Matching: '{raw_payload[:50]}...' -> '{bluf_fact[:50]}...'")
            return bluf_fact
            
        except Exception as e:
            logger.error(f"❌ Impedance Matching failed: {e}")
            # FAIL-CLOSED: Do not pass raw text through if LLM unavailable
            # This prevents data leaks when the cognitive shield is down
            return None

    def process_message(self, message_id: str, message_data: Dict[str, Any]) -> None:
        """
        Process a single message through the Catcher's Mitt
        
        Args:
            message_id (str): Redis stream message ID
            message_data (Dict[str, Any]): Message payload
        """
        try:
            raw_text = message_data.get('payload', '')
            if not raw_text:
                logger.warning(f"⚠️  Empty payload in message {message_id}")
                return

            # Calculate voltage score
            voltage_score = self.calculate_voltage_score(raw_text)
            energy_tier = self.categorize_energy(voltage_score)
            
            # Execute impedance matching
            bluf_fact = self.execute_impedance_matching(raw_text)
            
            # FAIL-CLOSED: If impedance matching failed (LLM unavailable), do NOT process
            # This ensures no raw data leaks when cognitive shield is down
            if bluf_fact is None:
                logger.warning(f"⚠️  BLOCKED message {message_id}: Cognitive shield unavailable")
                # Do not acknowledge - message stays in queue for retry
                return
            
            # Create processed payload with correct schema
            processed_payload = {
                "message_id": message_id,
                "bluf_summary": bluf_fact,
                "voltage_score": voltage_score,
                "tier": energy_tier,
                "raw_sequestered": True if energy_tier == "HIGH" else False,
                "processing_timestamp": time.time(),
                "source_system": "catchers_mitt"
            }
            
            # Push to sanitized stream
            result = self.redis_client.xadd(self.sanitized_stream, {"payload": json.dumps(processed_payload)})
            
            # Acknowledge original message
            self.redis_client.xdel(self.incoming_stream, message_id)
            
            logger.info(f"✅ Processed message {message_id}: {energy_tier} ({voltage_score}%)")
            logger.debug(f"📝 BLUF: {bluf_fact[:100]}...")
            
        except Exception as e:
            logger.error(f"❌ Message processing failed for {message_id}: {e}")

    def catchers_mitt_loop(self) -> None:
        """
        Main processing loop for Catcher's Mitt
        
        - Reads from Redis Stream
        - Enforces 60-second batching window
        - Processes messages through impedance matching
        - Outputs to sanitized stream
        """
        logger.info("🔄 Starting Catcher's Mitt Processing Loop")
        
        while True:
            try:
                # Read from incoming stream with 1-second timeout
                messages = self.redis_client.xread(
                    {self.incoming_stream: "0"}, 
                    count=10, 
                    block=1000
                )
                
                if messages:
                    logger.info(f"📥 Received {len(messages[0][1])} messages for processing")
                    
                    # Enforce mandatory 60-second batching window
                    logger.info("⏳ Enforcing 60-second batching window...")
                    time.sleep(60)
                    
                    # Process each message
                    for stream, msgs in messages:
                        for msg_id, msg_data in msgs:
                            self.process_message(msg_id, msg_data)
                            
                # Small delay to prevent CPU spinning
                time.sleep(0.1)
                
            except KeyboardInterrupt:
                logger.info("🛑 Catcher's Mitt shutting down...")
                break
            except Exception as e:
                logger.error(f"❌ Processing loop error: {e}")
                time.sleep(1)  # Brief delay before retry

    def health_check(self) -> Dict[str, Any]:
        """Return health status of Catcher's Mitt"""
        try:
            # Check Redis connection
            redis_status = self.redis_client.ping()
            
            # Get stream lengths
            incoming_length = self.redis_client.xlen(self.incoming_stream)
            sanitized_length = self.redis_client.xlen(self.sanitized_stream)
            
            return {
                "status": "healthy" if redis_status else "unhealthy",
                "incoming_queue_length": incoming_length,
                "sanitized_queue_length": sanitized_length,
                "voltage_thresholds": {
                    "low": self.low_energy_threshold,
                    "moderate": self.moderate_energy_threshold
                },
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return {"status": "error", "error": str(e)}

def main():
    """Main entry point for Catcher's Mitt"""
    logger.info("🎯 Initializing P31 Catcher's Mitt...")
    
    try:
        mitt = CatchersMitt()
        
        # Perform initial health check
        health = mitt.health_check()
        logger.info(f"🏥 Health Status: {health}")
        
        # Start processing loop
        mitt.catchers_mitt_loop()
        
    except Exception as e:
        logger.error(f"💥 Catcher's Mitt failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    main()