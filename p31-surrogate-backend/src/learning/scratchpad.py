#!/usr/bin/env python3
"""
P31 Surrogate Backend - Self-Evolving Scratchpad
===============================================

Implements the Scratchpad pattern for continuous behavioral evolution:
- Independent error log maintenance
- Corrective lesson writing to active ruleset
- Automatic append to Register P during synchronization cycles
- Prevents repeated mistakes through self-evolving rules

Author: P31 Labs
License: MIT
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SelfEvolvingScratchpad:
    """Self-evolving scratchpad for continuous behavioral evolution"""
    
    def __init__(self, db_connection=None):
        """
        Initialize the self-evolving scratchpad
        
        Args:
            db_connection: Database connection (PGLite Sovereign Vault)
        """
        self.db = db_connection
        self.sync_interval = 300  # 5 minutes
        self.last_sync = time.time()
        
        logger.info("📝 Self-Evolving Scratchpad Initialized")
        logger.info(f"🔄 Sync Interval: {self.sync_interval} seconds")

    def add_error_entry(self, error_type: str, error_description: str, 
                       corrective_action: str, lesson_learned: str, 
                       confidence: float = 0.8) -> Optional[int]:
        """
        Add an error entry to the scratchpad for learning
        
        Args:
            error_type (str): Type of error (e.g., "API_TIMEOUT", "INVALID_INPUT")
            error_description (str): Detailed description of the error
            corrective_action (str): Action taken to correct the error
            lesson_learned (str): Lesson extracted from the error
            confidence (float): Confidence in the lesson (0.0-1.0)
            
        Returns:
            Optional[int]: Entry ID if successful, None if failed
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for scratchpad")
                return None

            # Add entry to scratchpad table
            entry_id = self.db.addScratchpadEntry(
                error_type=error_type,
                error_description=error_description,
                corrective_action=corrective_action,
                lesson_learned=lesson_learned,
                confidence=confidence
            )
            
            logger.info(f"📝 Added scratchpad entry: {error_type} -> {lesson_learned[:50]}...")
            return entry_id
            
        except Exception as e:
            logger.error(f"❌ Failed to add scratchpad entry: {e}")
            return None

    def get_pending_lessons(self, status: str = 'pending') -> List[Dict[str, Any]]:
        """
        Get pending lessons that need verification and integration
        
        Args:
            status (str): Status filter ('pending', 'verified', 'rejected')
            
        Returns:
            List[Dict[str, Any]]: List of pending lessons
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for scratchpad")
                return []

            entries = self.db.getScratchpadEntries(status=status)
            logger.info(f"📋 Retrieved {len(entries)} {status} lessons")
            return entries
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve pending lessons: {e}")
            return []

    def verify_lesson(self, entry_id: int, status: str = 'verified') -> bool:
        """
        Verify a lesson and mark it for integration into Register P
        
        Args:
            entry_id (int): ID of the scratchpad entry
            status (str): Verification status ('verified', 'rejected')
            
        Returns:
            bool: True if verification successful, False otherwise
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for scratchpad")
                return False

            self.db.verifyScratchpadEntry(entry_id, status=status)
            
            action = "✅ Verified" if status == 'verified' else "❌ Rejected"
            logger.info(f"{action} lesson entry {entry_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to verify lesson {entry_id}: {e}")
            return False

    def integrate_lessons_to_register_p(self) -> int:
        """
        Integrate verified lessons into Register P (immutable ruleset)
        
        Returns:
            int: Number of lessons integrated
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for scratchpad")
                return 0

            # Get verified but not yet integrated lessons
            pending_lessons = self.db.getScratchpadEntries(status='verified')
            
            integrated_count = 0
            for lesson in pending_lessons:
                if not lesson.get('applied_to_register_p', False):
                    # Integrate lesson into Register P
                    success = self._integrate_lesson_to_ruleset(lesson)
                    if success:
                        # Mark as integrated
                        self.db.verifyScratchpadEntry(lesson['id'], status='verified')
                        integrated_count += 1
                        logger.info(f"📚 Integrated lesson to Register P: {lesson['lesson_learned'][:50]}...")
            
            logger.info(f"✅ Integrated {integrated_count} lessons to Register P")
            return integrated_count
            
        except Exception as e:
            logger.error(f"❌ Failed to integrate lessons to Register P: {e}")
            return 0

    def _integrate_lesson_to_ruleset(self, lesson: Dict[str, Any]) -> bool:
        """
        Integrate a single lesson into the active ruleset
        
        Args:
            lesson (Dict[str, Any]): Lesson data from scratchpad
            
        Returns:
            bool: True if integration successful, False otherwise
        """
        try:
            # Extract lesson components
            error_type = lesson['error_type']
            lesson_text = lesson['lesson_learned']
            confidence = lesson.get('confidence_score', 0.8)
            
            # Create ruleset entry
            ruleset_entry = {
                "type": "behavioral_rule",
                "trigger": error_type,
                "action": lesson_text,
                "confidence": confidence,
                "source": "scratchpad",
                "timestamp": datetime.now().isoformat(),
                "version": "v2.5"
            }
            
            # Store in procedural preferences (active ruleset)
            self.db.storeProceduralPreference(
                key=f"behavioral_rule_{error_type.lower().replace(' ', '_')}",
                value=ruleset_entry,
                dataType="object"
            )
            
            logger.debug(f"📚 Ruleset updated: {error_type} -> {lesson_text[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to integrate lesson to ruleset: {e}")
            return False

    def learn_from_error(self, error_context: Dict[str, Any]) -> bool:
        """
        Automatically learn from an error context and create a lesson
        
        Args:
            error_context (Dict[str, Any]): Error context including:
                - error_type: Type of error
                - error_message: Error message
                - stack_trace: Stack trace (optional)
                - input_data: Input that caused error (optional)
                - timestamp: When error occurred
                
        Returns:
            bool: True if learning successful, False otherwise
        """
        try:
            error_type = error_context.get('error_type', 'UNKNOWN_ERROR')
            error_message = error_context.get('error_message', 'No message provided')
            input_data = error_context.get('input_data', {})
            
            # Generate corrective action and lesson
            corrective_action = self._generate_corrective_action(error_type, error_message, input_data)
            lesson_learned = self._extract_lesson(error_type, error_message, input_data)
            confidence = self._calculate_confidence(error_type, error_context)
            
            # Add to scratchpad
            entry_id = self.add_error_entry(
                error_type=error_type,
                error_description=error_message,
                corrective_action=corrective_action,
                lesson_learned=lesson_learned,
                confidence=confidence
            )
            
            if entry_id:
                logger.info(f"🧠 Learned from {error_type}: {lesson_learned[:50]}...")
                return True
            else:
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to learn from error: {e}")
            return False

    def _generate_corrective_action(self, error_type: str, error_message: str, input_data: Dict[str, Any]) -> str:
        """Generate corrective action based on error context"""
        
        # Common error patterns and their corrective actions
        error_patterns = {
            "API_TIMEOUT": "Implement retry mechanism with exponential backoff",
            "INVALID_INPUT": "Add input validation and sanitization",
            "AUTHENTICATION_FAILED": "Verify credentials and token expiration",
            "PERMISSION_DENIED": "Check user permissions and access levels",
            "RATE_LIMIT_EXCEEDED": "Implement request throttling and caching",
            "CONNECTION_ERROR": "Check network connectivity and service availability",
            "VALIDATION_ERROR": "Review data schema and validation rules",
            "PARSE_ERROR": "Improve error handling for malformed data"
        }
        
        base_action = error_patterns.get(error_type, "Review error handling and implement appropriate safeguards")
        
        # Add context-specific details
        if input_data:
            context_hint = f" (context: {list(input_data.keys())[:3]})"
        else:
            context_hint = ""
            
        return f"{base_action}{context_hint}"

    def _extract_lesson(self, error_type: str, error_message: str, input_data: Dict[str, Any]) -> str:
        """Extract the core lesson from error context"""
        
        # Common lessons for different error types
        lessons = {
            "API_TIMEOUT": "Implement proper timeout handling and retry logic for external service calls",
            "INVALID_INPUT": "Always validate and sanitize user inputs before processing",
            "AUTHENTICATION_FAILED": "Implement robust authentication with proper token management",
            "PERMISSION_DENIED": "Ensure proper authorization checks are in place for all operations",
            "RATE_LIMIT_EXCEEDED": "Implement rate limiting and caching to prevent service overload",
            "CONNECTION_ERROR": "Add connection resilience and fallback mechanisms",
            "VALIDATION_ERROR": "Strengthen data validation and provide clear error messages",
            "PARSE_ERROR": "Improve error handling for data parsing and format validation"
        }
        
        base_lesson = lessons.get(error_type, "Review error handling and improve system resilience")
        
        # Add specific context if available
        if "network" in error_message.lower():
            return f"{base_lesson} with enhanced network error handling"
        elif "database" in error_message.lower():
            return f"{base_lesson} with improved database connection management"
        elif "memory" in error_message.lower():
            return f"{base_lesson} with better memory management"
        else:
            return base_lesson

    def _calculate_confidence(self, error_type: str, error_context: Dict[str, Any]) -> float:
        """Calculate confidence score for the lesson"""
        
        base_confidence = 0.7
        
        # Boost confidence for well-defined error types
        high_confidence_types = ["API_TIMEOUT", "INVALID_INPUT", "AUTHENTICATION_FAILED"]
        if error_type in high_confidence_types:
            base_confidence += 0.1
        
        # Boost confidence if input data is available
        if error_context.get('input_data'):
            base_confidence += 0.05
            
        # Boost confidence if stack trace is available
        if error_context.get('stack_trace'):
            base_confidence += 0.05
            
        return min(base_confidence, 1.0)

    def perform_sync(self) -> Dict[str, Any]:
        """
        Perform synchronization cycle: integrate lessons and clean up
        
        Returns:
            Dict[str, Any]: Sync results
        """
        try:
            current_time = time.time()
            
            if current_time - self.last_sync < self.sync_interval:
                return {"status": "skipped", "reason": "Sync interval not reached"}
            
            # Integrate verified lessons
            integrated = self.integrate_lessons_to_register_p()
            
            # Clean up old entries (keep last 1000)
            self._cleanup_old_entries()
            
            self.last_sync = current_time
            
            result = {
                "status": "success",
                "integrated_lessons": integrated,
                "sync_time": current_time,
                "next_sync": current_time + self.sync_interval
            }
            
            logger.info(f"🔄 Sync completed: {integrated} lessons integrated")
            return result
            
        except Exception as e:
            logger.error(f"❌ Sync failed: {e}")
            return {"status": "failed", "error": str(e)}

    def _cleanup_old_entries(self, max_entries: int = 1000) -> None:
        """Clean up old scratchpad entries to prevent database bloat"""
        try:
            # This would be implemented based on the specific database schema
            # For now, we'll log the cleanup intention
            logger.info(f"🧹 Cleanup: Keeping last {max_entries} scratchpad entries")
            
        except Exception as e:
            logger.error(f"❌ Cleanup failed: {e}")

    def get_scratchpad_health(self) -> Dict[str, Any]:
        """Get health status of the scratchpad system"""
        try:
            if not self.db:
                return {"status": "no_connection", "entries": 0, "last_sync": None}

            # Get entry counts by status
            pending = len(self.db.getScratchpadEntries(status='pending'))
            verified = len(self.db.getScratchpadEntries(status='verified'))
            rejected = len(self.db.getScratchpadEntries(status='rejected'))
            
            return {
                "status": "healthy",
                "entries": {
                    "pending": pending,
                    "verified": verified,
                    "rejected": rejected,
                    "total": pending + verified + rejected
                },
                "last_sync": self.last_sync,
                "next_sync": self.last_sync + self.sync_interval,
                "sync_interval": self.sync_interval
            }
            
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return {"status": "error", "error": str(e)}

def main():
    """Main entry point for testing scratchpad"""
    logger.info("📝 Initializing P31 Self-Evolving Scratchpad...")
    
    try:
        # Mock database connection for testing
        class MockDB:
            def addScratchpadEntry(self, **kwargs):
                return 1
            def getScratchpadEntries(self, status='pending'):
                return []
            def verifyScratchpadEntry(self, entry_id, status='verified'):
                pass
            def storeProceduralPreference(self, **kwargs):
                pass

        scratchpad = SelfEvolvingScratchpad(db_connection=MockDB())
        
        # Test error learning
        error_context = {
            "error_type": "API_TIMEOUT",
            "error_message": "Request to external service timed out after 30 seconds",
            "input_data": {"service": "weather_api", "timeout": 30},
            "timestamp": time.time()
        }
        
        learned = scratchpad.learn_from_error(error_context)
        logger.info(f"🧠 Learning result: {'Success' if learned else 'Failed'}")
        
        # Test health check
        health = scratchpad.get_scratchpad_health()
        logger.info(f"🏥 Scratchpad Health: {health}")
        
        logger.info("✅ Self-Evolving Scratchpad Ready")
        
    except Exception as e:
        logger.error(f"💥 Scratchpad failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    main()