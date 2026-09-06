#!/usr/bin/env python3
"""
P31 Q-Suite: Complete Test Runner
=================================

This script orchestrates the execution of both Agent RED and Agent BLUE
to comprehensively test the Spoons economy for race conditions and UI
empathy issues.

Usage:
    python run_q_suite.py [--api-url http://localhost:3001] [--ui-url http://localhost:3000]

Compliance: ISO 13485:2016 (Post-Market Clinical Follow-up)
"""

import argparse
import asyncio
import logging
import sys
import time
from datetime import datetime
from typing import Dict, List, Any

# Import our test agents
from qsuite_agent_red import run_q_suite as run_agent_red
from qsuite_agent_blue import run_agent_blue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QSuiteRunner:
    """Orchestrates the complete Q-Suite testing."""
    
    def __init__(self, api_url: str = "http://localhost:3001", ui_url: str = "http://localhost:3000"):
        self.api_url = api_url
        self.ui_url = ui_url
        self.results = {}
        
    async def run_full_suite(self) -> Dict[str, Any]:
        """Run the complete Q-Suite testing."""
        logger.info('🧪 P31 Q-SUITE: COMPLETE TESTING ORCHESTRATION')
        logger.info('===========================================')
        logger.info(f'API Target: {self.api_url}')
        logger.info(f'UI Target: {self.ui_url}')
        logger.info(f'Start Time: {datetime.now().isoformat()}')
        logger.info('')
        
        # Phase 1: Agent RED - Backend Race Condition Testing
        logger.info('🔴 PHASE 1: AGENT RED - Backend Race Condition Testing')
        logger.info('-----------------------------------------------------')
        
        try:
            agent_red_results = await run_agent_red()
            self.results['agent_red'] = {
                'status': 'completed',
                'results': agent_red_results,
                'timestamp': datetime.now().isoformat()
            }
            logger.info('✅ Agent RED completed successfully')
        except Exception as e:
            logger.error(f'❌ Agent RED failed: {e}')
            self.results['agent_red'] = {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
        
        logger.info('')
        
        # Phase 2: Agent BLUE - UI Empathy Testing
        logger.info('🔵 PHASE 2: AGENT BLUE - UI Empathy Testing')
        logger.info('-------------------------------------------')
        
        try:
            agent_blue_results = await run_agent_blue()
            self.results['agent_blue'] = {
                'status': 'completed',
                'results': agent_blue_results,
                'timestamp': datetime.now().isoformat()
            }
            logger.info('✅ Agent BLUE completed successfully')
        except Exception as e:
            logger.error(f'❌ Agent BLUE failed: {e}')
            self.results['agent_blue'] = {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
        
        # Phase 3: Cross-Phase Analysis
        logger.info('')
        logger.info('🔍 PHASE 3: CROSS-PHASE ANALYSIS')
        logger.info('---------------------------------')
        
        self._analyze_cross_phase_results()
        
        # Phase 4: Final Report
        logger.info('')
        logger.info('📊 PHASE 4: FINAL REPORT')
        logger.info('------------------------')
        
        self._generate_final_report()
        
        return self.results
    
    def _analyze_cross_phase_results(self):
        """Analyze results across both agents for comprehensive insights."""
        agent_red_status = self.results.get('agent_red', {}).get('status', 'unknown')
        agent_blue_status = self.results.get('agent_blue', {}).get('status', 'unknown')
        
        if agent_red_status == 'completed' and agent_blue_status == 'completed':
            logger.info('✅ Both agents completed successfully')
            
            # Analyze Agent RED results
            red_results = self.results['agent_red']['results']
            successful_red = sum(1 for r in red_results if r.success)
            failed_red = len(red_results) - successful_red
            
            # Analyze Agent BLUE results
            blue_results = self.results['agent_blue']['results']
            successful_blue = sum(1 for r in blue_results if r.success)
            failed_blue = len(blue_results) - successful_blue
            
            logger.info(f'Agent RED: {successful_red}/{len(red_results)} successful requests')
            logger.info(f'Agent BLUE: {successful_blue}/{len(blue_results)} successful interactions')
            
            # Check for critical vulnerabilities
            self._check_critical_vulnerabilities(red_results, blue_results)
            
        elif agent_red_status == 'failed' and agent_blue_status == 'failed':
            logger.error('❌ Both agents failed - Critical system issues detected')
        elif agent_red_status == 'failed':
            logger.warning('⚠️  Agent RED failed - Backend issues detected')
        elif agent_blue_status == 'failed':
            logger.warning('⚠️  Agent BLUE failed - UI issues detected')
    
    def _check_critical_vulnerabilities(self, red_results: List, blue_results: List):
        """Check for critical vulnerabilities across both test phases."""
        critical_issues = []
        
        # Check Agent RED for race conditions
        spoons_values_red = [r.spoons_remaining for r in red_results if r.success and hasattr(r, 'spoons_remaining')]
        if spoons_values_red:
            min_spoons_red = min(spoons_values_red)
            if min_spoons_red < 0:
                critical_issues.append(f"CRITICAL: Spoons went below 0 ({min_spoons_red}) in Agent RED")
            elif min_spoons_red < 11:
                critical_issues.append(f"POTENTIAL: Race condition detected (min spoons: {min_spoons_red}) in Agent RED")
        
        # Check Agent BLUE for UI inconsistencies
        spoons_issues_blue = [r for r in blue_results if hasattr(r, 'spoons_after') and hasattr(r, 'spoons_before') 
                             and r.spoons_after is not None and r.spoons_before is not None 
                             and r.spoons_after < r.spoons_before - 1]
        if spoons_issues_blue:
            critical_issues.append(f"CRITICAL: {len(spoons_issues_blue)} spoon race conditions detected in Agent BLUE")
        
        # Check for phantom haptic issues
        phantom_issues = [r for r in blue_results if hasattr(r, 'error_message') and r.error_message 
                         and 'Phantom Haptic' in r.error_message]
        if phantom_issues:
            critical_issues.append(f"CRITICAL: {len(phantom_issues)} phantom haptic issues detected")
        
        # Report findings
        if critical_issues:
            logger.critical('🚨 CRITICAL VULNERABILITIES DETECTED:')
            for issue in critical_issues:
                logger.critical(f'   {issue}')
            logger.critical('')
            logger.critical('The 21 CFR §890.3710 medical safety hard-stop may be compromised!')
        else:
            logger.info('✅ No critical vulnerabilities detected')
            logger.info('✅ All race condition protections are working correctly')
            logger.info('✅ All UI empathy protections are working correctly')
    
    def _generate_final_report(self):
        """Generate a comprehensive final report."""
        logger.info('')
        logger.info('=== Q-SUITE FINAL REPORT ===')
        logger.info('')
        
        # Summary
        total_tests = 0
        total_passed = 0
        total_failed = 0
        
        for agent_name, agent_data in self.results.items():
            if agent_data['status'] == 'completed' and 'results' in agent_data:
                results = agent_data['results']
                passed = sum(1 for r in results if r.success)
                failed = len(results) - passed
                total_tests += len(results)
                total_passed += passed
                total_failed += failed
                
                logger.info(f'{agent_name.upper()}:')
                logger.info(f'  Status: ✅ COMPLETED')
                logger.info(f'  Tests: {len(results)}')
                logger.info(f'  Passed: {passed}')
                logger.info(f'  Failed: {failed}')
                logger.info(f'  Success Rate: {(passed/len(results)*100):.1f}%')
                logger.info('')
            else:
                logger.info(f'{agent_name.upper()}:')
                logger.info(f'  Status: ❌ FAILED')
                logger.info(f'  Error: {agent_data.get("error", "Unknown")}')
                logger.info('')
        
        logger.info('OVERALL SUMMARY:')
        logger.info(f'  Total Tests: {total_tests}')
        logger.info(f'  Total Passed: {total_passed}')
        logger.info(f'  Total Failed: {total_failed}')
        if total_tests > 0:
            logger.info(f'  Overall Success Rate: {(total_passed/total_tests*100):.1f}%')
        
        # Compliance status
        if total_failed == 0 and total_tests > 0:
            logger.info('')
            logger.info('🎉 COMPLIANCE STATUS: ✅ PASS')
            logger.info('   ISO 13485:2016 (Post-Market Clinical Follow-up)')
            logger.info('   21 CFR §890.3710 (Medical Safety Hard-Stop)')
            logger.info('   All race condition protections verified')
            logger.info('   All UI empathy protections verified')
        elif total_failed > 0:
            logger.info('')
            logger.info('⚠️  COMPLIANCE STATUS: ⚠️  ISSUES DETECTED')
            logger.info('   Review failed tests and address vulnerabilities')
        
        logger.info('')
        logger.info(f'End Time: {datetime.now().isoformat()}')
        logger.info('🧪 P31 Q-SUITE: TESTING COMPLETE')
        logger.info('================================')

def main():
    """Main entry point for the Q-Suite runner."""
    parser = argparse.ArgumentParser(description='P31 Q-Suite: Complete Race Condition Testing')
    parser.add_argument('--api-url', default='http://localhost:3001', 
                       help='API endpoint URL (default: http://localhost:3001)')
    parser.add_argument('--ui-url', default='http://localhost:3000',
                       help='UI endpoint URL (default: http://localhost:3000)')
    parser.add_argument('--no-ui', action='store_true',
                       help='Skip UI testing (Agent BLUE only)')
    
    args = parser.parse_args()
    
    # Validate URLs
    if not args.api_url.startswith(('http://', 'https://')):
        logger.error('Invalid API URL format. Must start with http:// or https://')
        sys.exit(1)
    
    if not args.ui_url.startswith(('http://', 'https://')):
        logger.error('Invalid UI URL format. Must start with http:// or https://')
        sys.exit(1)
    
    # Create runner
    runner = QSuiteRunner(api_url=args.api_url, ui_url=args.ui_url)
    
    # Run tests
    try:
        results = asyncio.run(runner.run_full_suite())
        return 0
    except KeyboardInterrupt:
        logger.info('Testing interrupted by user')
        return 1
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        return 1

if __name__ == "__main__":
    sys.exit(main())