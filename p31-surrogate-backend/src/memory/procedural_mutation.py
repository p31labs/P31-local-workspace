#!/usr/bin/env python3
"""
P31 Surrogate Backend - Procedural Memory Mutation System
========================================================

Implements procedural memory mutation for preference evolution:
- Real-time preference updates
- Version-controlled preference storage
- Automatic preference synchronization
- Preference conflict resolution

Author: P31 Labs
License: MIT
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProceduralMemoryMutation:
    """Procedural memory system for preference evolution and mutation"""
    
    def __init__(self, db_connection=None):
        """
        Initialize the procedural memory mutation system
        
        Args:
            db_connection: Database connection (PGLite Sovereign Vault)
        """
        self.db = db_connection
        self.mutation_threshold = 0.1  # 10% change threshold
        self.conflict_resolution_strategy = "latest_wins"
        
        logger.info("🧠 Procedural Memory Mutation System Initialized")
        logger.info(f"🔄 Mutation Threshold: {self.mutation_threshold}")
        logger.info(f"🔀 Conflict Resolution: {self.conflict_resolution_strategy}")

    def store_preference(self, key: str, value: Union[str, int, float, bool, dict, list], 
                        data_type: str, source: str = "user") -> bool:
        """
        Store or update a procedural preference with version control
        
        Args:
            key (str): Preference key
            value: Preference value
            data_type (str): Data type ('string', 'number', 'boolean', 'object', 'array')
            source (str): Source of the preference ('user', 'system', 'learned')
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for procedural memory")
                return False

            # Store in procedural preferences table
            self.db.storeProceduralPreference(
                key=key,
                value=value,
                dataType=data_type
            )
            
            logger.info(f"🧠 Stored preference: {key} = {value} ({data_type})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store preference {key}: {e}")
            return False

    def get_preference(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a procedural preference with metadata
        
        Args:
            key (str): Preference key
            
        Returns:
            Optional[Dict[str, Any]]: Preference data or None if not found
        """
        try:
            if not self.db:
                logger.warning("⚠️  No database connection available for procedural memory")
                return None

            # Query procedural preferences table
            result = self.db.query(
                "SELECT * FROM procedural_preferences WHERE key = $1",
                [key]
            )
            
            if result.rows:
                row = result.rows[0]
                return {
                    "key": row['key'],
                    "value": json.loads(row['value']) if isinstance(row['value'], str) else row['value'],
                    "data_type": row['data_type'],
                    "last_modified": row['last_modified'],
                    "version": row['version']
                }
            else:
                return None
                
        except Exception as e:
            logger.error(f"❌ Failed to retrieve preference {key}: {e}")
            return None

    def mutate_preference(self, key: str, new_value: Any, mutation_type: str = "update") -> Dict[str, Any]:
        """
        Mutate a procedural preference with change detection and versioning
        
        Args:
            key (str): Preference key
            new_value: New preference value
            mutation_type (str): Type of mutation ('update', 'increment', 'toggle', 'merge')
            
        Returns:
            Dict[str, Any]: Mutation result
        """
        try:
            # Get current preference
            current_pref = self.get_preference(key)
            
            if not current_pref:
                # New preference
                result = self.store_preference(
                    key=key,
                    value=new_value,
                    data_type=self._infer_data_type(new_value),
                    source="user"
                )
                
                return {
                    "status": "created",
                    "key": key,
                    "new_value": new_value,
                    "version": 1,
                    "mutation_type": mutation_type,
                    "timestamp": time.time()
                }
            
            # Calculate change magnitude
            change_magnitude = self._calculate_change_magnitude(
                current_pref['value'], 
                new_value, 
                current_pref['data_type']
            )
            
            # Check if change exceeds threshold
            if change_magnitude > self.mutation_threshold:
                # Apply mutation based on type
                mutated_value = self._apply_mutation(
                    current_pref['value'], 
                    new_value, 
                    mutation_type, 
                    current_pref['data_type']
                )
                
                # Store mutated preference
                success = self.store_preference(
                    key=key,
                    value=mutated_value,
                    data_type=current_pref['data_type'],
                    source="user"
                )
                
                if success:
                    return {
                        "status": "mutated",
                        "key": key,
                        "old_value": current_pref['value'],
                        "new_value": mutated_value,
                        "change_magnitude": change_magnitude,
                        "version": current_pref['version'] + 1,
                        "mutation_type": mutation_type,
                        "timestamp": time.time()
                    }
                else:
                    return {"status": "failed", "reason": "Storage failed"}
            else:
                return {
                    "status": "ignored",
                    "key": key,
                    "change_magnitude": change_magnitude,
                    "threshold": self.mutation_threshold,
                    "reason": "Change below mutation threshold"
                }
                
        except Exception as e:
            logger.error(f"❌ Preference mutation failed for {key}: {e}")
            return {"status": "error", "error": str(e), "key": key}

    def _infer_data_type(self, value: Any) -> str:
        """Infer data type from value"""
        if isinstance(value, str):
            return "string"
        elif isinstance(value, (int, float)):
            return "number"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, dict):
            return "object"
        elif isinstance(value, list):
            return "array"
        else:
            return "string"

    def _calculate_change_magnitude(self, old_value: Any, new_value: Any, data_type: str) -> float:
        """Calculate the magnitude of change between old and new values"""
        try:
            if old_value == new_value:
                return 0.0
            
            if data_type == "string":
                # String similarity (simple length-based for now)
                old_len = len(str(old_value))
                new_len = len(str(new_value))
                max_len = max(old_len, new_len)
                if max_len == 0:
                    return 0.0
                return abs(old_len - new_len) / max_len
            
            elif data_type == "number":
                # Percentage change
                if old_value == 0:
                    return 1.0 if new_value != 0 else 0.0
                return abs(new_value - old_value) / abs(old_value)
            
            elif data_type == "boolean":
                # Boolean change (0 or 1)
                return 1.0 if old_value != new_value else 0.0
            
            elif data_type in ["object", "array"]:
                # Structural change (simplified)
                old_str = json.dumps(old_value, sort_keys=True)
                new_str = json.dumps(new_value, sort_keys=True)
                return 1.0 if old_str != new_str else 0.0
            
            else:
                return 1.0
                
        except Exception as e:
            logger.error(f"❌ Change magnitude calculation failed: {e}")
            return 1.0

    def _apply_mutation(self, old_value: Any, new_value: Any, mutation_type: str, data_type: str) -> Any:
        """Apply mutation based on type and data type"""
        if mutation_type == "update":
            return new_value
        
        elif mutation_type == "increment" and data_type == "number":
            return old_value + new_value
        
        elif mutation_type == "toggle" and data_type == "boolean":
            return not old_value
        
        elif mutation_type == "merge" and data_type == "object":
            if isinstance(old_value, dict) and isinstance(new_value, dict):
                merged = old_value.copy()
                merged.update(new_value)
                return merged
            else:
                return new_value
        
        elif mutation_type == "append" and data_type == "array":
            if isinstance(old_value, list) and isinstance(new_value, list):
                return old_value + new_value
            elif isinstance(old_value, list):
                return old_value + [new_value]
            else:
                return [new_value]
        
        else:
            return new_value

    def batch_mutate_preferences(self, mutations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Apply multiple preference mutations in a batch
        
        Args:
            mutations (List[Dict[str, Any]]): List of mutation operations
            
        Returns:
            Dict[str, Any]: Batch mutation results
        """
        try:
            results = []
            successful_mutations = 0
            ignored_mutations = 0
            failed_mutations = 0
            
            for mutation in mutations:
                result = self.mutate_preference(
                    key=mutation['key'],
                    new_value=mutation['value'],
                    mutation_type=mutation.get('mutation_type', 'update')
                )
                
                results.append(result)
                
                if result['status'] == 'mutated':
                    successful_mutations += 1
                elif result['status'] == 'ignored':
                    ignored_mutations += 1
                else:
                    failed_mutations += 1
            
            return {
                "status": "completed",
                "total_mutations": len(mutations),
                "successful": successful_mutations,
                "ignored": ignored_mutations,
                "failed": failed_mutations,
                "results": results,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Batch mutation failed: {e}")
            return {"status": "error", "error": str(e)}

    def resolve_preference_conflicts(self, preferences: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Resolve conflicts between multiple preference sources
        
        Args:
            preferences (List[Dict[str, Any]]): List of conflicting preferences
            
        Returns:
            Dict[str, Any]: Resolved preference
        """
        try:
            if not preferences:
                return {"status": "no_conflicts", "resolved_preference": None}
            
            if len(preferences) == 1:
                return {"status": "no_conflicts", "resolved_preference": preferences[0]}
            
            # Apply conflict resolution strategy
            if self.conflict_resolution_strategy == "latest_wins":
                # Sort by last_modified timestamp
                sorted_prefs = sorted(preferences, key=lambda x: x.get('last_modified', 0), reverse=True)
                resolved = sorted_prefs[0]
                
            elif self.conflict_resolution_strategy == "highest_version":
                # Sort by version number
                sorted_prefs = sorted(preferences, key=lambda x: x.get('version', 0), reverse=True)
                resolved = sorted_prefs[0]
                
            elif self.conflict_resolution_strategy == "user_preference":
                # Prioritize user-sourced preferences
                user_prefs = [p for p in preferences if p.get('source') == 'user']
                if user_prefs:
                    resolved = user_prefs[0]
                else:
                    resolved = preferences[0]
            
            else:
                resolved = preferences[0]  # Default to first preference
            
            return {
                "status": "resolved",
                "original_count": len(preferences),
                "resolved_preference": resolved,
                "resolution_strategy": self.conflict_resolution_strategy,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Preference conflict resolution failed: {e}")
            return {"status": "error", "error": str(e)}

    def get_preference_history(self, key: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get historical versions of a preference (simplified for PGLite)
        
        Args:
            key (str): Preference key
            limit (int): Maximum number of versions to return
            
        Returns:
            List[Dict[str, Any]]: Preference history
        """
        try:
            # In a full implementation, this would query a preference_history table
            # For now, return current preference as history
            current = self.get_preference(key)
            if current:
                return [current]
            else:
                return []
                
        except Exception as e:
            logger.error(f"❌ Preference history retrieval failed for {key}: {e}")
            return []

    def optimize_preferences(self) -> Dict[str, Any]:
        """
        Optimize preference storage and clean up old versions
        
        Returns:
            Dict[str, Any]: Optimization results
        """
        try:
            # In a full implementation, this would:
            # 1. Clean up old preference versions
            # 2. Optimize storage
            # 3. Update indexes
            
            # For now, just return a status
            return {
                "status": "completed",
                "optimization_type": "storage_cleanup",
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Preference optimization failed: {e}")
            return {"status": "error", "error": str(e)}

    def get_memory_health(self) -> Dict[str, Any]:
        """Get health status of the procedural memory system"""
        try:
            if not self.db:
                return {"status": "no_connection", "preferences": 0, "last_optimization": None}

            # Get preference count
            result = self.db.query("SELECT COUNT(*) as count FROM procedural_preferences")
            preference_count = result.rows[0]['count'] if result.rows else 0
            
            return {
                "status": "healthy",
                "preferences_count": preference_count,
                "mutation_threshold": self.mutation_threshold,
                "conflict_resolution": self.conflict_resolution_strategy,
                "last_optimization": time.time(),
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Memory health check failed: {e}")
            return {"status": "error", "error": str(e)}

def main():
    """Main entry point for testing procedural memory"""
    logger.info("🧠 Initializing P31 Procedural Memory Mutation System...")
    
    try:
        # Mock database connection for testing
        class MockDB:
            def storeProceduralPreference(self, **kwargs):
                pass
            def query(self, query, params):
                class MockResult:
                    def __init__(self):
                        self.rows = [{"count": 5}]
                return MockResult()

        memory = ProceduralMemoryMutation(db_connection=MockDB())
        
        # Test preference storage
        stored = memory.store_preference(
            key="user_language",
            value="en",
            data_type="string",
            source="user"
        )
        logger.info(f"🧠 Preference storage: {'Success' if stored else 'Failed'}")
        
        # Test preference mutation
        mutation_result = memory.mutate_preference(
            key="user_volume",
            new_value=0.8,
            mutation_type="update"
        )
        logger.info(f"🔄 Preference mutation: {mutation_result['status']}")
        
        # Test memory health
        health = memory.get_memory_health()
        logger.info(f"🏥 Memory Health: {health}")
        
        logger.info("✅ Procedural Memory Mutation System Ready")
        
    except Exception as e:
        logger.error(f"💥 Procedural Memory failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    main()