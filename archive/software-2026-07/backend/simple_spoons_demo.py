#!/usr/bin/env python3
"""
Simple Spoons Economy Demo - No External Dependencies
====================================================

This is a simplified version of the Spoons economy that demonstrates
the race condition protection without requiring external dependencies
like Redis, FastAPI, or Playwright.

This can be run directly to test the core race condition protection logic.
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class SpoonTransaction:
    """Represents a spoon transaction."""
    user_id: str
    action_type: str
    amount: int
    timestamp: float
    idempotency_key: str
    success: bool
    new_balance: int
    error: Optional[str] = None

class SimpleSpoonsEconomy:
    """Simple Spoons Economy with race condition protection."""
    
    def __init__(self, initial_spoons: int = 100):
        self.spoons: Dict[str, int] = {}
        self.idempotency_keys: Dict[str, float] = {}  # key -> expiration time
        self.transactions: list = []
        self.initial_spoons = initial_spoons
        self.idempotency_ttl = 5.0  # 5 seconds
        
    def get_spoons(self, user_id: str) -> int:
        """Get current spoons for user."""
        return self.spoons.get(user_id, self.initial_spoons)
    
    def _is_idempotent(self, idempotency_key: str) -> bool:
        """Check if idempotency key is valid (not expired)."""
        if idempotency_key in self.idempotency_keys:
            expiration = self.idempotency_keys[idempotency_key]
            if time.time() < expiration:
                return True
            else:
                # Key expired, remove it
                del self.idempotency_keys[idempotency_key]
        return False
    
    def _lock_idempotency(self, idempotency_key: str):
        """Lock idempotency key for TTL period."""
        self.idempotency_keys[idempotency_key] = time.time() + self.idempotency_ttl
    
    def expend_spoons(self, user_id: str, action_type: str, amount: int = 1, idempotency_key: Optional[str] = None) -> SpoonTransaction:
        """
        Atomic spoon expenditure with race condition protection.
        
        This simulates the "Resin" - atomic Lua script protection.
        """
        if idempotency_key is None:
            idempotency_key = str(uuid.uuid4())
        
        timestamp = time.time()
        
        # 1. Check Idempotency (Did they double click in the last 5 seconds?)
        if self._is_idempotent(idempotency_key):
            transaction = SpoonTransaction(
                user_id=user_id,
                action_type=action_type,
                amount=amount,
                timestamp=timestamp,
                idempotency_key=idempotency_key,
                success=False,
                new_balance=self.get_spoons(user_id),
                error="IDEMPOTENT_REJECT"
            )
            self.transactions.append(transaction)
            return transaction
        
        # 2. Lock the idempotency key for 5 seconds
        self._lock_idempotency(idempotency_key)
        
        # 3. Check Spoons Capacity (Medical Safety Check)
        current_spoons = self.get_spoons(user_id)
        if current_spoons <= 0:
            transaction = SpoonTransaction(
                user_id=user_id,
                action_type=action_type,
                amount=amount,
                timestamp=timestamp,
                idempotency_key=idempotency_key,
                success=False,
                new_balance=0,
                error="CLINICAL_HALT"
            )
            self.transactions.append(transaction)
            return transaction
        
        # 3b. Check if deduction would go below 0 (Medical Safety Hard-Stop)
        if current_spoons - amount < 0:
            transaction = SpoonTransaction(
                user_id=user_id,
                action_type=action_type,
                amount=amount,
                timestamp=timestamp,
                idempotency_key=idempotency_key,
                success=False,
                new_balance=0,
                error="CLINICAL_HALT"
            )
            self.transactions.append(transaction)
            return transaction
        
        # 4. Safely deduct and return new balance
        new_balance = current_spoons - amount
        self.spoons[user_id] = new_balance
        
        transaction = SpoonTransaction(
            user_id=user_id,
            action_type=action_type,
            amount=amount,
            timestamp=timestamp,
            idempotency_key=idempotency_key,
            success=True,
            new_balance=new_balance
        )
        self.transactions.append(transaction)
        return transaction

class RaceConditionTester:
    """Test race conditions in the Spoons economy."""
    
    def __init__(self, economy: SimpleSpoonsEconomy):
        self.economy = economy
        self.results = []
    
    async def test_quantum_double_tap(self, user_id: str, delay_ms: int = 20):
        """
        Test Quantum Double Tap: Simulates 20ms double-clicks
        This is the exact failure mode described in the requirements.
        """
        logger.info(f"🧪 Testing Quantum Double Tap for {user_id} (delay: {delay_ms}ms)")
        
        # Generate same idempotency key for both requests (simulating double-click)
        idempotency_key = str(uuid.uuid4())
        
        # Fire two requests almost simultaneously
        async def make_request(request_num: int):
            await asyncio.sleep(delay_ms / 1000)
            return self.economy.expend_spoons(
                user_id=user_id,
                action_type="POSNER_VOTE",
                amount=1,
                idempotency_key=idempotency_key
            )
        
        # Execute both requests concurrently
        start_time = time.time()
        results = await asyncio.gather(
            make_request(1),
            make_request(2)
        )
        end_time = time.time()
        
        # Analyze results
        success_count = sum(1 for r in results if r.success)
        total_deduction = sum(r.amount for r in results if r.success)
        
        test_result = {
            "test": "Quantum Double Tap",
            "user_id": user_id,
            "delay_ms": delay_ms,
            "execution_time": end_time - start_time,
            "requests_sent": 2,
            "requests_successful": success_count,
            "total_deduction": total_deduction,
            "final_balance": results[0].new_balance,
            "protection_working": success_count == 1 and total_deduction == 1
        }
        
        self.results.append(test_result)
        
        if test_result["protection_working"]:
            logger.info(f"✅ Quantum Double Tap PROTECTED: Only 1 spoon deducted despite 2 requests")
        else:
            logger.error(f"❌ Quantum Double Tap FAILED: {success_count} requests succeeded, {total_deduction} spoons deducted")
        
        return test_result
    
    async def test_rapid_fire(self, user_id: str, request_count: int = 10):
        """Test Rapid Fire: Multiple simultaneous requests."""
        logger.info(f"🧪 Testing Rapid Fire for {user_id} ({request_count} requests)")
        
        # Generate same idempotency key for all requests
        idempotency_key = str(uuid.uuid4())
        
        async def make_request(request_num: int):
            await asyncio.sleep(0.001 * request_num)  # Stagger slightly
            return self.economy.expend_spoons(
                user_id=user_id,
                action_type="POSNER_VOTE",
                amount=1,
                idempotency_key=idempotency_key
            )
        
        start_time = time.time()
        results = await asyncio.gather(*[
            make_request(i) for i in range(request_count)
        ])
        end_time = time.time()
        
        success_count = sum(1 for r in results if r.success)
        total_deduction = sum(r.amount for r in results if r.success)
        
        test_result = {
            "test": "Rapid Fire",
            "user_id": user_id,
            "request_count": request_count,
            "execution_time": end_time - start_time,
            "requests_successful": success_count,
            "total_deduction": total_deduction,
            "final_balance": results[0].new_balance,
            "protection_working": success_count == 1 and total_deduction == 1
        }
        
        self.results.append(test_result)
        
        if test_result["protection_working"]:
            logger.info(f"✅ Rapid Fire PROTECTED: Only 1 spoon deducted despite {request_count} requests")
        else:
            logger.error(f"❌ Rapid Fire FAILED: {success_count} requests succeeded, {total_deduction} spoons deducted")
        
        return test_result
    
    async def test_medical_safety(self, user_id: str):
        """Test Medical Safety: System halts at 0 spoons."""
        logger.info(f"🧪 Testing Medical Safety for {user_id}")
        
        # Set user to have only 1 spoon
        self.economy.spoons[user_id] = 1
        
        # Try to expend 2 spoons (should fail)
        result = self.economy.expend_spoons(
            user_id=user_id,
            action_type="OVERSPEND_TEST",
            amount=2
        )
        
        test_result = {
            "test": "Medical Safety",
            "user_id": user_id,
            "initial_balance": 1,
            "requested_amount": 2,
            "success": result.success,
            "final_balance": result.new_balance,
            "error": result.error,
            "protection_working": not result.success and result.error == "CLINICAL_HALT" and result.new_balance == 0
        }
        
        self.results.append(test_result)
        
        if test_result["protection_working"]:
            logger.info(f"✅ Medical Safety PROTECTED: System halted at 0 spoons")
        else:
            logger.error(f"❌ Medical Safety FAILED: {result.error} - Balance: {result.new_balance}")
        
        return test_result
    
    def print_summary(self):
        """Print test summary."""
        logger.info("")
        logger.info("📊 RACE CONDITION TEST SUMMARY")
        logger.info("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["protection_working"])
        
        for result in self.results:
            status = "✅ PASS" if result["protection_working"] else "❌ FAIL"
            logger.info(f"{status} {result['test']}: {result.get('requests_successful', 1)} successful requests")
        
        logger.info("")
        logger.info(f"TOTAL TESTS: {total_tests}")
        logger.info(f"PASSED: {passed_tests}")
        logger.info(f"FAILED: {total_tests - passed_tests}")
        
        if passed_tests == total_tests:
            logger.info("🎉 ALL TESTS PASSED - Race condition protection is working!")
        else:
            logger.error("⚠️  SOME TESTS FAILED - Race condition vulnerabilities detected!")
        
        return passed_tests == total_tests

async def main():
    """Main test execution."""
    logger.info("🧪 P31 Q-SUITE: SIMPLE RACE CONDITION DEMO")
    logger.info("=" * 60)
    logger.info("Testing race condition protection without external dependencies")
    logger.info("")
    
    # Create economy
    economy = SimpleSpoonsEconomy(initial_spoons=10)
    tester = RaceConditionTester(economy)
    
    # Test scenarios
    user_id = "test_user_123"
    
    logger.info(f"👤 Testing user: {user_id}")
    logger.info(f"💰 Initial spoons: {economy.get_spoons(user_id)}")
    logger.info("")
    
    # Run tests
    await tester.test_quantum_double_tap(user_id, delay_ms=20)
    await tester.test_rapid_fire(user_id, request_count=50)
    await tester.test_medical_safety(user_id)
    
    # Print summary
    success = tester.print_summary()
    
    # Save results
    results_file = "race_condition_test_results.json"
    with open(results_file, 'w') as f:
        json.dump({
            "test_summary": {
                "total_tests": len(tester.results),
                "passed_tests": sum(1 for r in tester.results if r["protection_working"]),
                "failed_tests": sum(1 for r in tester.results if not r["protection_working"]),
                "success_rate": f"{(sum(1 for r in tester.results if r['protection_working']) / len(tester.results) * 100):.1f}%"
            },
            "individual_results": tester.results,
            "economy_state": {
                "user_balances": economy.spoons,
                "total_transactions": len(economy.transactions)
            },
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    logger.info(f"💾 Results saved to: {results_file}")
    logger.info("")
    
    if success:
        logger.info("🎯 MISSION ACCOMPLISHED: Race condition protection verified!")
        logger.info("The 'Resin' (atomic protection) is working correctly.")
    else:
        logger.error("🚨 MISSION FAILED: Race condition vulnerabilities detected!")
        logger.error("The system needs additional protection measures.")
    
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)