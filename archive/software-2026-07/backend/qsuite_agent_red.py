#!/usr/bin/env python3
"""
P31 Q-Suite: AGENT RED (Headless Chaos Node)
============================================

Objective: Break the Spoons Economy via Async Race Conditions

This script bombards the API at the millisecond level, testing race conditions,
multi-sig simultaneous drops, and Redis atomic failures.

Vector: Direct Node.js API hits to http://localhost:3001/api/shelter/brain/expend
Target: p31.c (KWAI) and Upstash Redis

The Crack: "The Spoon Race Condition." What happens if a user clicks 
[Contribute Ion] twice within 20 milliseconds? Does the Node.js event loop 
process both reads before the write, dropping the user below 0 Spoons and 
violating the 21 CFR §890.3710 safety cutoff?

Compliance: ISO 13485:2016 (Post-Market Clinical Follow-up)
"""

import asyncio
import aiohttp
import json
import logging
import time
import uuid
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
TARGET_URL = 'http://localhost:3001/api/shelter/brain/expend'
TEST_FINGERPRINT = 'q_suite_test_user_001'
NUM_CONCURRENT_REQUESTS = 100
RACE_CONDITION_DELAY_MS = 20

@dataclass
class TestResult:
    """Result of a single test request."""
    success: bool
    status: str
    spoons_remaining: float
    response_time_ms: float
    error_message: str = None

class AgentRed:
    """Agent RED: Headless Chaos Node for race condition testing."""
    
    def __init__(self, target_url: str = TARGET_URL, fingerprint: str = TEST_FINGERPRINT):
        self.target_url = target_url
        self.fingerprint = fingerprint
        self.session = None
        
    async def __aenter__(self):
        """Initialize HTTP session."""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up HTTP session."""
        if self.session:
            await self.session.close()
    
    async def quantum_double_tap(self) -> List[TestResult]:
        """
        CRITICAL TEST: The Spoon Race Condition
        
        Scenario: User double-clicks [Contribute Ion] within 20 milliseconds
        Expected: Only 1 spoon deducted (idempotent)
        Vulnerable: Both requests read "12 spoons", both deduct, result = 10
        
        This test simulates the exact failure mode described in the
        medical safety mandate (21 CFR §890.3710).
        """
        logger.info('[AGENT RED] Initiating Quantum Double-Tap (Simultaneous Requests)...')
        
        # We fire two requests at the exact same millisecond without awaiting the first.
        # If the backend uses standard GET then SET, both will read "12 spoons", 
        # both will subtract 1, and the result will be 10 instead of 11. Or worse, 
        # it will bypass the 0 Spoon hard-stop.
        
        start_time = time.time()
        
        # Create two simultaneous requests
        req1 = self._make_expend_request(idempotency_key=None)  # Intentionally bypassing safe guards
        req2 = self._make_expend_request(idempotency_key=None)
        
        # Execute both requests simultaneously
        results = await asyncio.gather(req1, req2, return_exceptions=True)
        
        # Process results
        test_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                test_results.append(TestResult(
                    success=False,
                    status="ERROR",
                    spoons_remaining=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(result)
                ))
            else:
                test_results.append(result)
        
        # Log results
        spoons_values = [r.spoons_remaining for r in test_results if r.success]
        if spoons_values:
            logger.info(f'[CRACK DETECTED] Both requests succeeded. Spoons: {spoons_values}')
            if min(spoons_values) < 11:
                logger.error(f'[FATAL] The 21 CFR §890.3710 hard-stop failed. User exhausted bandwidth.')
            else:
                logger.info('[SHIELD HOLDING] System correctly handled the race condition.')
        
        return test_results
    
    async def rapid_fire_stress_test(self, num_requests: int = NUM_CONCURRENT_REQUESTS) -> List[TestResult]:
        """
        STRESS TEST: Rapid-fire spoon deductions
        
        In a vulnerable system, this would drain all spoons instantly.
        The Resin fix must prevent spoons from going below 0.
        """
        logger.info(f'[AGENT RED] Initiating Rapid-Fire Stress Test ({num_requests} requests)...')
        
        start_time = time.time()
        
        # Fire multiple simultaneous deductions
        tasks = []
        for i in range(num_requests):
            # Add small delay to simulate real-world timing variations
            await asyncio.sleep(0.001)  # 1ms delay between requests
            tasks.append(self._make_expend_request())
        
        # Execute all requests
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        test_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                test_results.append(TestResult(
                    success=False,
                    status="ERROR",
                    spoons_remaining=0.0,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(result)
                ))
            else:
                test_results.append(result)
        
        # Analyze results
        spoons_values = [r.spoons_remaining for r in test_results if r.success]
        if spoons_values:
            min_spoons = min(spoons_values)
            max_spoons = max(spoons_values)
            logger.info(f'Rapid-fire test completed. Spoons range: {min_spoons} - {max_spoons}')
            
            if min_spoons < 0:
                logger.error(f'[CRITICAL] Spoons went below 0! System is vulnerable.')
            elif min_spoons == 12.0:
                logger.warning(f'[WARNING] No spoons were deducted. System may be blocking all requests.')
            else:
                logger.info(f'[SHIELD HOLDING] System correctly limited spoon expenditure.')
        
        return test_results
    
    async def interleaved_read_write_test(self) -> List[TestResult]:
        """
        TEST: Read-modify-write race condition
        
        This is the classic race condition:
        1. Thread A reads spoons = 5
        2. Thread B reads spoons = 5  
        3. Thread A writes spoons = 4
        4. Thread B writes spoons = 4
        Result: 2 deductions, but spoons = 4 (not 3)
        """
        logger.info('[AGENT RED] Initiating Interleaved Read-Write Test...')
        
        # First, reset spoons to a known state
        await self._reset_spoons()
        
        # Get initial spoons
        initial_spoons = await self._get_spoons()
        logger.info(f'Initial spoons: {initial_spoons}')
        
        # Simulate read-modify-write race
        results = []
        for i in range(10):
            # Read current value
            current = await self._get_spoons()
            # Simulate processing delay (allows interleaving)
            await asyncio.sleep(0.001)  # 1ms delay
            # Make request with the read value as context
            result = await self._make_expend_request(context_spoons=current)
            results.append(result)
        
        final_spoons = await self._get_spoons()
        logger.info(f'Final spoons after 10 operations: {final_spoons}')
        logger.info(f'Expected: {initial_spoons - 10}, Actual: {final_spoons}')
        
        if final_spoons == initial_spoons - 10:
            logger.info('[SHIELD HOLDING] Atomic operations working correctly.')
        else:
            logger.error(f'[CRACK DETECTED] Race condition present. Expected {initial_spoons - 10}, got {final_spoons}')
        
        return results
    
    async def idempotency_test(self) -> List[TestResult]:
        """
        TEST: Idempotency key protection
        
        Verify that duplicate requests with the same idempotency key
        are properly rejected.
        """
        logger.info('[AGENT RED] Initiating Idempotency Test...')
        
        # Reset spoons
        await self._reset_spoons()
        initial_spoons = await self._get_spoons()
        
        # Use the same idempotency key for multiple requests
        duplicate_key = str(uuid.uuid4())
        
        # Make multiple requests with the same key
        tasks = []
        for i in range(5):
            tasks.append(self._make_expend_request(idempotency_key=duplicate_key))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        test_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                test_results.append(TestResult(
                    success=False,
                    status="ERROR",
                    spoons_remaining=0.0,
                    response_time_ms=0,
                    error_message=str(result)
                ))
            else:
                test_results.append(result)
        
        final_spoons = await self._get_spoons()
        logger.info(f'Initial spoons: {initial_spoons}, Final spoons: {final_spoons}')
        logger.info(f'Expected deduction: 1 spoon (due to idempotency), Actual: {initial_spoons - final_spoons}')
        
        # Count successful deductions
        successful_deductions = sum(1 for r in test_results if r.success and r.status == "APPROVED")
        ignored_deductions = sum(1 for r in test_results if r.success and r.status == "IGNORED")
        
        logger.info(f'Successful deductions: {successful_deductions}, Ignored: {ignored_deductions}')
        
        if successful_deductions == 1 and ignored_deductions == 4:
            logger.info('[SHIELD HOLDING] Idempotency protection working correctly.')
        else:
            logger.error(f'[CRACK DETECTED] Idempotency protection failed.')
        
        return test_results
    
    async def _make_expend_request(self, idempotency_key: str = None, context_spoons: float = None) -> TestResult:
        """Make a single spoon expenditure request."""
        start_time = time.time()
        
        payload = {
            "fingerprint_hash": self.fingerprint,
            "action_type": "POSNER_VOTE",
            "idempotency_key": idempotency_key
        }
        
        try:
            async with self.session.patch(self.target_url, json=payload) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    return TestResult(
                        success=True,
                        status=data.get('status', 'UNKNOWN'),
                        spoons_remaining=data.get('spoons_remaining', 0.0),
                        response_time_ms=response_time
                    )
                elif response.status == 429:
                    # Rate limited - this is actually good for race condition protection
                    return TestResult(
                        success=True,
                        status="RATE_LIMITED",
                        spoons_remaining=12.0,  # No change due to rate limiting
                        response_time_ms=response_time
                    )
                elif response.status == 409:
                    # Conflict - duplicate request detected
                    data = await response.json()
                    return TestResult(
                        success=True,
                        status="IGNORED",
                        spoons_remaining=data.get('spoons_remaining', 12.0),
                        response_time_ms=response_time,
                        error_message=data.get('message', 'Duplicate request')
                    )
                else:
                    error_text = await response.text()
                    return TestResult(
                        success=False,
                        status=f"HTTP_{response.status}",
                        spoons_remaining=0.0,
                        response_time_ms=response_time,
                        error_message=error_text
                    )
                    
        except Exception as e:
            return TestResult(
                success=False,
                status="CONNECTION_ERROR",
                spoons_remaining=0.0,
                response_time_ms=(time.time() - start_time) * 1000,
                error_message=str(e)
            )
    
    async def _get_spoons(self) -> float:
        """Get current spoons for the test user."""
        try:
            async with self.session.get(f'http://localhost:3001/spoons/{self.fingerprint}') as response:
                if response.status == 200:
                    data = await response.json()
                    return float(data.get('spoons', 0.0))
                else:
                    return 12.0  # Default if user not found
        except:
            return 12.0
    
    async def _reset_spoons(self):
        """Reset spoons to baseline for testing."""
        try:
            async with self.session.post(f'http://localhost:3001/spoons/reset/{self.fingerprint}') as response:
                await response.json()
        except:
            pass

async def run_q_suite():
    """Run the complete Q-Suite Agent RED tests."""
    logger.info('🧪 P31 Q-SUITE: AGENT RED - Starting Race Condition Tests')
    logger.info('Compliance: ISO 13485:2016 (Post-Market Clinical Follow-up)')
    
    async with AgentRed() as agent:
        # Test 1: Quantum Double Tap
        logger.info('\n=== TEST 1: Quantum Double Tap ===')
        results1 = await agent.quantum_double_tap()
        
        # Test 2: Rapid Fire Stress Test
        logger.info('\n=== TEST 2: Rapid Fire Stress Test ===')
        results2 = await agent.rapid_fire_stress_test()
        
        # Test 3: Interleaved Read-Write
        logger.info('\n=== TEST 3: Interleaved Read-Write ===')
        results3 = await agent.interleaved_read_write_test()
        
        # Test 4: Idempotency Protection
        logger.info('\n=== TEST 4: Idempotency Protection ===')
        results4 = await agent.idempotency_test()
        
        # Summary
        logger.info('\n=== Q-SUITE AGENT RED RESULTS SUMMARY ===')
        
        all_results = results1 + results2 + results3 + results4
        successful = sum(1 for r in all_results if r.success)
        failed = len(all_results) - successful
        
        logger.info(f'Total requests: {len(all_results)}')
        logger.info(f'Successful: {successful}')
        logger.info(f'Failed: {failed}')
        
        # Check for critical vulnerabilities
        spoons_values = [r.spoons_remaining for r in all_results if r.success and r.spoons_remaining is not None]
        if spoons_values:
            min_spoons = min(spoons_values)
            if min_spoons < 0:
                logger.critical(f'🚨 CRITICAL VULNERABILITY: Spoons went below 0 ({min_spoons})')
                logger.critical('The 21 CFR §890.3710 medical safety hard-stop has been bypassed!')
            elif min_spoons >= 11:
                logger.info('✅ PASS: All race condition protections are working correctly')
            else:
                logger.warning(f'⚠️  WARNING: Potential race condition detected (min spoons: {min_spoons})')
        
        logger.info('\n🧪 P31 Q-SUITE: AGENT RED - Testing Complete')
        return all_results

if __name__ == "__main__":
    asyncio.run(run_q_suite())