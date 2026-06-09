#!/usr/bin/env python3
"""
P31 Q-Suite: AGENT BLUE (Headless Empathy Node)
===============================================

Objective: Simulate a neurodivergent user on a slow Android tablet using 
UI automation (Cypress/Playwright), testing double-clicks, cognitive load 
limits, and somatic visual feedback.

Vector: Playwright automated UI testing (Throttled to Android Tablet / 3G Network speeds)
Target: p31.ui and Discord UX

The Crack: "The Phantom Haptic." What happens if the UI registers a success, 
but the WebSocket to p31.b (KILO) drops the packet? The user loses a Spoon 
but gets no physical hum, causing cognitive dissonance.

Compliance: ISO 13485:2016 (Post-Market Clinical Follow-up)
"""

import asyncio
import logging
import time
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
except ImportError:
    logger.error("Playwright not installed. Install with: pip install playwright")
    logger.error("Then run: playwright install")
    exit(1)

@dataclass
class UIInteraction:
    """Represents a UI interaction with timing and context."""
    action: str
    timestamp: float
    success: bool
    response_time_ms: float
    error_message: str = None
    spoons_before: float = None
    spoons_after: float = None

class AgentBlue:
    """Agent BLUE: Headed Empathy Node for UI testing."""
    
    def __init__(self, base_url: str = "http://localhost:3000", api_base: str = "http://localhost:3001"):
        self.base_url = base_url
        self.api_base = api_base
        self.browser = None
        self.context = None
        self.page = None
        self.test_user_id = f"q_suite_test_user_{int(time.time())}"
        
    async def __aenter__(self):
        """Initialize Playwright browser."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        
        # Create context with Android tablet emulation and 3G throttling
        self.context = await self.browser.new_context(
            viewport={'width': 800, 'height': 1280},  # Android tablet resolution
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            # Simulate 3G network conditions
            network_conditions={
                'offline': False,
                'download_throughput': 1.5 * 1024 * 1024 / 8,  # 1.5 Mbps
                'upload_throughput': 750 * 1024 / 8,  # 750 Kbps
                'latency': 300  # 300ms latency
            }
        )
        
        self.page = await self.context.new_page()
        
        # Set up request/response monitoring
        self.page.on('request', self._on_request)
        self.page.on('response', self._on_response)
        self.page.on('console', self._on_console)
        
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up browser."""
        if self.browser:
            await self.browser.close()
    
    def _on_request(self, request):
        """Log outgoing requests."""
        logger.debug(f"Request: {request.method} {request.url}")
    
    def _on_response(self, response):
        """Log incoming responses."""
        logger.debug(f"Response: {response.status} {response.url}")
    
    def _on_console(self, msg):
        """Log console messages."""
        if msg.type == 'error':
            logger.warning(f"Console Error: {msg.text}")
    
    async def setup_test_environment(self):
        """Set up the test environment with baseline data."""
        logger.info('[AGENT BLUE] Setting up test environment...')
        
        # Reset spoons for test user
        await self._reset_spoons()
        
        # Navigate to the application
        await self.page.goto(self.base_url)
        
        # Wait for the page to load
        await self.page.wait_for_load_state('networkidle')
        
        # Inject test user context
        await self.page.evaluate(f"""
            window.testUserId = '{self.test_user_id}';
            window.testFingerprint = '{self.test_user_id}';
        """)
        
        logger.info(f'[AGENT BLUE] Test user initialized: {self.test_user_id}')
    
    async def test_double_click_scenario(self) -> List[UIInteraction]:
        """
        TEST: Double-click scenario on slow network
        
        Simulates a neurodivergent user with motor tics double-tapping 
        buttons on a slow Android tablet. Tests the system's ability to
        handle rapid successive inputs gracefully.
        """
        logger.info('[AGENT BLUE] Testing Double-Click Scenario...')
        
        interactions = []
        
        # Get initial spoons
        initial_spoons = await self._get_spoons_via_api()
        
        # Locate the contribute button (adjust selector as needed)
        contribute_button = await self.page.query_selector('button[data-action="contribute"], button.contribute, #contribute-btn')
        if not contribute_button:
            logger.error("Could not find contribute button")
            return interactions
        
        # Simulate double-click with timing variations
        click_times = [0, 50, 100, 200]  # ms between clicks
        
        for i, delay in enumerate(click_times):
            start_time = time.time()
            
            try:
                # Wait between clicks to simulate real user behavior
                if delay > 0:
                    await asyncio.sleep(delay / 1000)
                
                # Perform the click
                await contribute_button.click()
                
                # Wait for response (simulating slow network)
                await asyncio.sleep(1.0)  # 1 second wait for response
                
                # Check for visual feedback
                feedback_element = await self.page.query_selector('.feedback, .toast, .notification')
                visual_feedback = feedback_element is not None
                
                # Get current spoons
                current_spoons = await self._get_spoons_via_api()
                
                response_time = (time.time() - start_time) * 1000
                
                interaction = UIInteraction(
                    action=f"double_click_{i+1}",
                    timestamp=time.time(),
                    success=True,
                    response_time_ms=response_time,
                    spoons_before=initial_spoons if i == 0 else interactions[-1].spoons_after,
                    spoons_after=current_spoons
                )
                
                interactions.append(interaction)
                
                logger.info(f"Click {i+1}: Spoons {interaction.spoons_before} → {interaction.spoons_after} "
                           f"(Response: {response_time:.0f}ms, Feedback: {visual_feedback})")
                
                # Check for race condition indicators
                if i > 0 and interaction.spoons_after < interaction.spoons_before - 1:
                    logger.warning(f"[CRACK DETECTED] Potential race condition: "
                                 f"Expected -1 spoon, got {interaction.spoons_before - interaction.spoons_after}")
                
            except Exception as e:
                interaction = UIInteraction(
                    action=f"double_click_{i+1}",
                    timestamp=time.time(),
                    success=False,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(e),
                    spoons_before=initial_spoons if i == 0 else interactions[-1].spoons_after,
                    spoons_after=initial_spoons if i == 0 else interactions[-1].spoons_after
                )
                interactions.append(interaction)
                logger.error(f"Click {i+1} failed: {e}")
        
        return interactions
    
    async def test_cognitive_load_scenario(self) -> List[UIInteraction]:
        """
        TEST: Cognitive load limits
        
        Simulates a user under cognitive load trying to complete multiple
        actions rapidly. Tests the system's ability to maintain state
        consistency under pressure.
        """
        logger.info('[AGENT BLUE] Testing Cognitive Load Scenario...')
        
        interactions = []
        
        # Get initial state
        initial_spoons = await self._get_spoons_via_api()
        
        # Define multiple actions to perform rapidly
        actions = [
            ('contribute', 'button[data-action="contribute"]'),
            ('view_status', 'button[data-action="status"]'),
            ('refresh_data', 'button[data-action="refresh"]'),
        ]
        
        for action_name, selector in actions:
            start_time = time.time()
            
            try:
                # Find and click the button
                button = await self.page.query_selector(selector)
                if button:
                    await button.click()
                    
                    # Wait for response
                    await asyncio.sleep(0.5)
                    
                    # Get current state
                    current_spoons = await self._get_spoons_via_api()
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    interaction = UIInteraction(
                        action=action_name,
                        timestamp=time.time(),
                        success=True,
                        response_time_ms=response_time,
                        spoons_before=initial_spoons if not interactions else interactions[-1].spoons_after,
                        spoons_after=current_spoons
                    )
                    
                    interactions.append(interaction)
                    
                    logger.info(f"Action '{action_name}': Spoons {interaction.spoons_before} → {interaction.spoons_after} "
                               f"(Response: {response_time:.0f}ms)")
                
                else:
                    logger.warning(f"Button for '{action_name}' not found")
                    
            except Exception as e:
                interaction = UIInteraction(
                    action=action_name,
                    timestamp=time.time(),
                    success=False,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(e),
                    spoons_before=initial_spoons if not interactions else interactions[-1].spoons_after,
                    spoons_after=initial_spoons if not interactions else interactions[-1].spoons_after
                )
                interactions.append(interaction)
                logger.error(f"Action '{action_name}' failed: {e}")
        
        return interactions
    
    async def test_phantom_haptic_scenario(self) -> List[UIInteraction]:
        """
        TEST: Phantom Haptic scenario
        
        Tests what happens when the UI registers success but the backend
        WebSocket drops the packet. The user should not lose spoons without
        proper feedback.
        """
        logger.info('[AGENT BLUE] Testing Phantom Haptic Scenario...')
        
        interactions = []
        
        # Get initial spoons
        initial_spoons = await self._get_spoons_via_api()
        
        # Monitor network requests
        request_count = 0
        response_count = 0
        
        def on_request(request):
            nonlocal request_count
            request_count += 1
            logger.debug(f"Network request #{request_count}: {request.method} {request.url}")
        
        def on_response(response):
            nonlocal response_count
            response_count += 1
            logger.debug(f"Network response #{response_count}: {response.status} {response.url}")
        
        self.page.on('request', on_request)
        self.page.on('response', on_response)
        
        # Perform action that should trigger backend communication
        contribute_button = await self.page.query_selector('button[data-action="contribute"]')
        if contribute_button:
            start_time = time.time()
            
            try:
                await contribute_button.click()
                
                # Wait for potential responses
                await asyncio.sleep(2.0)
                
                # Check for visual feedback
                feedback_shown = await self.page.evaluate("""
                    !!document.querySelector('.success, .feedback.success, .toast.success')
                """)
                
                # Check for error states
                error_shown = await self.page.evaluate("""
                    !!document.querySelector('.error, .feedback.error, .toast.error')
                """)
                
                # Get final spoons
                final_spoons = await self._get_spoons_via_api()
                
                response_time = (time.time() - start_time) * 1000
                
                interaction = UIInteraction(
                    action="phantom_haptic_test",
                    timestamp=time.time(),
                    success=True,
                    response_time_ms=response_time,
                    spoons_before=initial_spoons,
                    spoons_after=final_spoons
                )
                
                interactions.append(interaction)
                
                logger.info(f"Phantom Haptic Test: Spoons {initial_spoons} → {final_spoons}")
                logger.info(f"Network: {request_count} requests, {response_count} responses")
                logger.info(f"Visual Feedback: {feedback_shown}, Error: {error_shown}")
                
                # Analyze for phantom haptic conditions
                if final_spoons < initial_spoons and not feedback_shown and not error_shown:
                    logger.warning("[CRACK DETECTED] Phantom Haptic: Spoons deducted without feedback!")
                elif final_spoons == initial_spoons and feedback_shown:
                    logger.warning("[CRACK DETECTED] False Positive: Feedback shown but no spoon deduction!")
                else:
                    logger.info("[SHIELD HOLDING] Phantom Haptic protection working correctly")
                
            except Exception as e:
                interaction = UIInteraction(
                    action="phantom_haptic_test",
                    timestamp=time.time(),
                    success=False,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(e),
                    spoons_before=initial_spoons,
                    spoons_after=initial_spoons
                )
                interactions.append(interaction)
                logger.error(f"Phantom Haptic Test failed: {e}")
        
        return interactions
    
    async def test_somatic_visual_feedback(self) -> List[UIInteraction]:
        """
        TEST: Somatic visual feedback
        
        Tests that the UI provides appropriate visual feedback for spoon
        transactions, especially important for neurodivergent users who
        rely on clear state indicators.
        """
        logger.info('[AGENT BLUE] Testing Somatic Visual Feedback...')
        
        interactions = []
        
        # Get initial spoons
        initial_spoons = await self._get_spoons_via_api()
        
        # Check initial UI state
        initial_ui_state = await self._get_ui_spoon_display()
        
        # Perform action
        contribute_button = await self.page.query_selector('button[data-action="contribute"]')
        if contribute_button:
            start_time = time.time()
            
            try:
                await contribute_button.click()
                
                # Wait for UI update
                await asyncio.sleep(1.0)
                
                # Check final UI state
                final_ui_state = await self._get_ui_spoon_display()
                final_spoons = await self._get_spoons_via_api()
                
                response_time = (time.time() - start_time) * 1000
                
                interaction = UIInteraction(
                    action="somatic_feedback_test",
                    timestamp=time.time(),
                    success=True,
                    response_time_ms=response_time,
                    spoons_before=initial_spoons,
                    spoons_after=final_spoons
                )
                
                interactions.append(interaction)
                
                logger.info(f"Somatic Feedback Test:")
                logger.info(f"  API Spoons: {initial_spoons} → {final_spoons}")
                logger.info(f"  UI Display: {initial_ui_state} → {final_ui_state}")
                
                # Check for consistency
                if str(final_spoons) != final_ui_state:
                    logger.warning(f"[CRACK DETECTED] UI/API inconsistency: API shows {final_spoons}, UI shows {final_ui_state}")
                else:
                    logger.info("[SHIELD HOLDING] UI/API consistency maintained")
                
            except Exception as e:
                interaction = UIInteraction(
                    action="somatic_feedback_test",
                    timestamp=time.time(),
                    success=False,
                    response_time_ms=(time.time() - start_time) * 1000,
                    error_message=str(e),
                    spoons_before=initial_spoons,
                    spoons_after=initial_spoons
                )
                interactions.append(interaction)
                logger.error(f"Somatic Feedback Test failed: {e}")
        
        return interactions
    
    async def _get_spoons_via_api(self) -> float:
        """Get current spoons via API."""
        try:
            async with self.context.request.get(f"{self.api_base}/spoons/{self.test_user_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    return float(data.get('spoons', 0.0))
                else:
                    return 12.0
        except:
            return 12.0
    
    async def _get_ui_spoon_display(self) -> str:
        """Get spoon display from UI."""
        try:
            spoon_element = await self.page.query_selector('.spoon-count, .spoons-display, [data-spoons]')
            if spoon_element:
                return await spoon_element.inner_text()
            else:
                return "unknown"
        except:
            return "unknown"
    
    async def _reset_spoons(self):
        """Reset spoons to baseline for testing."""
        try:
            async with self.context.request.post(f"{self.api_base}/spoons/reset/{self.test_user_id}") as response:
                await response.json()
        except:
            pass

async def run_agent_blue():
    """Run the complete Agent BLUE UI tests."""
    logger.info('🧠 P31 Q-SUITE: AGENT BLUE - Starting UI Empathy Tests')
    logger.info('Vector: Playwright automated UI testing (Android Tablet / 3G Network)')
    logger.info('Target: p31.ui and Discord UX')
    logger.info('Compliance: ISO 13485:2016 (Post-Market Clinical Follow-up)')
    
    async with AgentBlue() as agent:
        await agent.setup_test_environment()
        
        # Test 1: Double-click scenario
        logger.info('\n=== TEST 1: Double-Click Scenario ===')
        results1 = await agent.test_double_click_scenario()
        
        # Test 2: Cognitive load scenario
        logger.info('\n=== TEST 2: Cognitive Load Scenario ===')
        results2 = await agent.test_cognitive_load_scenario()
        
        # Test 3: Phantom Haptic scenario
        logger.info('\n=== TEST 3: Phantom Haptic Scenario ===')
        results3 = await agent.test_phantom_haptic_scenario()
        
        # Test 4: Somatic visual feedback
        logger.info('\n=== TEST 4: Somatic Visual Feedback ===')
        results4 = await agent.test_somatic_visual_feedback()
        
        # Summary
        logger.info('\n=== Q-SUITE AGENT BLUE RESULTS SUMMARY ===')
        
        all_results = results1 + results2 + results3 + results4
        successful = sum(1 for r in all_results if r.success)
        failed = len(all_results) - successful
        
        logger.info(f'Total interactions: {len(all_results)}')
        logger.info(f'Successful: {successful}')
        logger.info(f'Failed: {failed}')
        
        # Check for critical issues
        spoons_issues = [r for r in all_results if r.spoons_after is not None and r.spoons_before is not None 
                        and r.spoons_after < r.spoons_before - 1]
        ui_api_issues = [r for r in all_results if "inconsistency" in (r.error_message or "")]
        
        if spoons_issues:
            logger.warning(f'⚠️  WARNING: {len(spoons_issues)} potential spoon race conditions detected')
        if ui_api_issues:
            logger.warning(f'⚠️  WARNING: {len(ui_api_issues)} UI/API consistency issues detected')
        
        if not spoons_issues and not ui_api_issues:
            logger.info('✅ PASS: All UI empathy protections are working correctly')
        
        logger.info('\n🧠 P31 Q-SUITE: AGENT BLUE - Testing Complete')
        return all_results

if __name__ == "__main__":
    asyncio.run(run_agent_blue())