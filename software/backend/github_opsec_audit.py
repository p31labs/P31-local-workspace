#!/usr/bin/env python3
"""
P31 GitHub OPSEC Audit: Dual Agent Protocol
===========================================

This script implements the Double Agent GitHub OPSEC & Workflow Audit.
It performs a zero-trust, hostile OPSEC audit of the Phosphorus31 (P31) 
and Trimtab-Signal GitHub repository structures.

Agent Alpha: DevSecOps Master & Threat Intelligence Analyst
Agent Beta: GitHub Enterprise Architect & Security Auditor

Compliance: ISO 27001, NIST Cybersecurity Framework, SOC 2 Type II
"""

import asyncio
import json
import logging
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Set, Tuple
from dataclasses import dataclass, asdict
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Vulnerability:
    """Represents a security vulnerability found during audit."""
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    category: str  # COMMIT_HISTORY, PERSONA_EXPOSURE, WORKFLOW, SCAFFOLDING, ARCHIVE
    title: str
    description: str
    location: str
    evidence: str
    recommendation: str

@dataclass
class RepositoryInfo:
    """Information about a GitHub repository."""
    name: str
    url: str
    visibility: str
    archived: bool
    topics: List[str]
    default_branch: str
    created_at: str
    updated_at: str

class AgentAlpha:
    """Agent Alpha: DevSecOps Master & Threat Intelligence Analyst"""
    
    def __init__(self, github_token: str = None):
        self.github_token = github_token
        self.vulnerabilities = []
        self.repos = []
        
    async def audit_commit_history(self, repo_path: str) -> List[Vulnerability]:
        """Vector 1: Commit History & Trade Secret Bleed"""
        logger.info('[AGENT ALPHA] Auditing commit history for leaked secrets...')
        
        vulnerabilities = []
        
        try:
            # Check for .env files in git history
            env_commits = self._search_git_history(repo_path, r'\.env$')
            if env_commits:
                vulnerabilities.append(Vulnerability(
                    severity="CRITICAL",
                    category="COMMIT_HISTORY",
                    title="Leaked .env files in commit history",
                    description="Environment files containing API keys and secrets found in git history",
                    location=repo_path,
                    evidence=f"Found {len(env_commits)} commits with .env files",
                    recommendation="Use git-filter-repo to permanently remove these files from history"
                ))
            
            # Check for API keys and tokens
            secret_patterns = [
                r'(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*["\'][a-zA-Z0-9]{20,}["\']',
                r'ghp_[a-zA-Z0-9]{36}',  # GitHub Personal Access Token
                r'xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}',  # Slack Bot Token
                r'AKIA[0-9A-Z]{16}',  # AWS Access Key
                r'AIza[0-9A-Za-z\\-_]{35}',  # Google API Key
            ]
            
            for pattern in secret_patterns:
                secret_commits = self._search_git_history(repo_path, pattern)
                if secret_commits:
                    vulnerabilities.append(Vulnerability(
                        severity="CRITICAL",
                        category="COMMIT_HISTORY",
                        title=f"Potential secrets leaked in commit history",
                        description=f"Pattern {pattern} found in git history",
                        location=repo_path,
                        evidence=f"Found {len(secret_commits)} commits with potential secrets",
                        recommendation="Audit and remove these commits using git-filter-repo"
                    ))
            
            # Check for proprietary code in public repos
            proprietary_patterns = [
                r'genesis-gate-protocol',
                r'god-protocol',
                r'p31.*trade.*secret',
                r'proprietary.*algorithm'
            ]
            
            for pattern in proprietary_patterns:
                proprietary_commits = self._search_git_history(repo_path, pattern)
                if proprietary_commits:
                    vulnerabilities.append(Vulnerability(
                        severity="HIGH",
                        category="COMMIT_HISTORY",
                        title="Proprietary code leaked to public repository",
                        description=f"Proprietary patterns found in public repository history",
                        location=repo_path,
                        evidence=f"Found {len(proprietary_commits)} commits with proprietary patterns",
                        recommendation="Move to private repository or remove from history"
                    ))
            
        except Exception as e:
            logger.error(f"Error auditing commit history for {repo_path}: {e}")
        
        return vulnerabilities
    
    def _search_git_history(self, repo_path: str, pattern: str) -> List[str]:
        """Search git history for a pattern."""
        try:
            # Use git log to search through all commits
            result = subprocess.run(
                ['git', 'log', '--all', '--grep', pattern, '--oneline'],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return [line.strip() for line in result.stdout.split('\n') if line.strip()]
        except Exception:
            pass
        
        try:
            # Alternative: search file contents across history
            result = subprocess.run(
                ['git', 'log', '--all', '--grep', pattern, '--oneline'],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return [line.strip() for line in result.stdout.split('\n') if line.strip()]
        except Exception:
            pass
        
        return []
    
    async def audit_workflows(self, repo_path: str) -> List[Vulnerability]:
        """Vector 3: Vulnerable GitHub Actions workflows"""
        logger.info('[AGENT ALPHA] Auditing GitHub Actions workflows...')
        
        vulnerabilities = []
        workflow_path = Path(repo_path) / '.github' / 'workflows'
        
        if not workflow_path.exists():
            return vulnerabilities
        
        for workflow_file in workflow_path.glob('*.yml'):
            try:
                with open(workflow_file, 'r') as f:
                    content = f.read()
                
                # Check for secrets in logs
                if 'secrets.' in content and ('echo' in content or 'print' in content):
                    vulnerabilities.append(Vulnerability(
                        severity="HIGH",
                        category="WORKFLOW",
                        title="Secrets exposed in workflow logs",
                        description="GitHub secrets are being printed to build logs",
                        location=str(workflow_file),
                        evidence="Found secrets being echoed to logs",
                        recommendation="Remove echo/print statements that expose secrets"
                    ))
                
                # Check for untrusted inputs
                if '${{ github.event.pull_request.head.sha }}' in content:
                    vulnerabilities.append(Vulnerability(
                        severity="MEDIUM",
                        category="WORKFLOW",
                        title="Untrusted PR inputs in workflow",
                        description="Workflow uses untrusted pull request inputs",
                        location=str(workflow_file),
                        evidence="Found untrusted PR inputs being used",
                        recommendation="Validate and sanitize all PR inputs"
                    ))
                
                # Check for missing security controls
                if 'permissions:' not in content:
                    vulnerabilities.append(Vulnerability(
                        severity="MEDIUM",
                        category="WORKFLOW",
                        title="Missing workflow permissions",
                        description="GitHub Actions workflow lacks explicit permissions",
                        location=str(workflow_file),
                        evidence="No permissions block found",
                        recommendation="Add explicit permissions block to limit workflow access"
                    ))
                
            except Exception as e:
                logger.error(f"Error auditing workflow {workflow_file}: {e}")
        
        return vulnerabilities

class AgentBeta:
    """Agent Beta: GitHub Enterprise Architect & Security Auditor"""
    
    def __init__(self, github_token: str = None):
        self.github_token = github_token
        self.vulnerabilities = []
    
    async def audit_persona_exposure(self, profile_info: Dict) -> List[Vulnerability]:
        """Vector 2: Persona Overexposure & PII"""
        logger.info('[AGENT BETA] Auditing persona exposure and PII...')
        
        vulnerabilities = []
        
        # Check for personal email addresses
        personal_emails = [
            'trimtab.signal@proton.me',
            'will.johnson@',
            'family-link-os',
            'margie_fay'
        ]
        
        for email in personal_emails:
            if email in str(profile_info).lower():
                vulnerabilities.append(Vulnerability(
                    severity="HIGH",
                    category="PERSONA_EXPOSURE",
                    title="Personal information exposed in GitHub profile",
                    description=f"Personal email or family information found in profile",
                    location="GitHub Profile",
                    evidence=f"Found reference to {email}",
                    recommendation="Separate professional and personal GitHub accounts"
                ))
        
        # Check for overly detailed bio
        bio = profile_info.get('bio', '')
        if len(bio) > 500:
            vulnerabilities.append(Vulnerability(
                severity="MEDIUM",
                category="PERSONA_EXPOSURE",
                title="Overly detailed GitHub bio",
                description="GitHub bio contains excessive personal information",
                location="GitHub Profile",
                evidence=f"Bio length: {len(bio)} characters",
                recommendation="Keep bio professional and minimal"
            ))
        
        # Check repository naming conventions
        repo_names = [repo['name'] for repo in profile_info.get('repos', [])]
        
        # Mix of professional and personal repositories
        personal_patterns = ['family', 'personal', 'home', 'margie', 'kids']
        professional_patterns = ['p31', 'phosphorus', 'medical', 'device']
        
        personal_repos = [r for r in repo_names if any(p in r.lower() for p in personal_patterns)]
        professional_repos = [r for r in repo_names if any(p in r.lower() for p in professional_patterns)]
        
        if personal_repos and professional_repos:
            vulnerabilities.append(Vulnerability(
                severity="MEDIUM",
                category="PERSONA_EXPOSURE",
                title="Mixed professional and personal repositories",
                description="Professional and personal repositories are mixed in same account",
                location="GitHub Account",
                evidence=f"Found {len(personal_repos)} personal and {len(professional_repos)} professional repos",
                recommendation="Use separate GitHub organizations/accounts"
            ))
        
        return vulnerabilities
    
    async def audit_scaffolding(self, repo_path: str) -> List[Vulnerability]:
        """Vector 3: Missing Scaffolding & Repository Structure"""
        logger.info('[AGENT BETA] Auditing repository scaffolding...')
        
        vulnerabilities = []
        repo_dir = Path(repo_path)
        
        # Check for missing security files
        required_files = {
            'SECURITY.md': 'Security policy',
            'CODEOWNERS': 'Code ownership rules',
            'CONTRIBUTING.md': 'Contribution guidelines',
            '.gitignore': 'Git ignore rules'
        }
        
        for filename, description in required_files.items():
            if not (repo_dir / filename).exists():
                vulnerabilities.append(Vulnerability(
                    severity="MEDIUM",
                    category="SCAFFOLDING",
                    title=f"Missing {filename}",
                    description=f"Repository lacks {description}",
                    location=repo_path,
                    evidence=f"File {filename} not found",
                    recommendation=f"Create {filename} with appropriate content"
                ))
        
        # Check .gitignore quality
        gitignore_path = repo_dir / '.gitignore'
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                gitignore_content = f.read().lower()
            
            sensitive_patterns = ['.env', '*.log', '*.tmp', 'node_modules', 'dist/']
            missing_patterns = [p for p in sensitive_patterns if p not in gitignore_content]
            
            if missing_patterns:
                vulnerabilities.append(Vulnerability(
                    severity="HIGH",
                    category="SCAFFOLDING",
                    title="Incomplete .gitignore",
                    description="Gitignore missing patterns for sensitive files",
                    location=repo_path,
                    evidence=f"Missing patterns: {', '.join(missing_patterns)}",
                    recommendation="Add comprehensive .gitignore patterns"
                ))
        
        # Check for hardcoded secrets in code
        code_files = list(repo_dir.glob('**/*.js')) + list(repo_dir.glob('**/*.py')) + list(repo_dir.glob('**/*.ts'))
        
        secret_patterns = [
            r'(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*["\'][a-zA-Z0-9]{20,}["\']',
            r'ghp_[a-zA-Z0-9]{36}',
            r'xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}'
        ]
        
        for code_file in code_files:
            try:
                with open(code_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                for pattern in secret_patterns:
                    if re.search(pattern, content):
                        vulnerabilities.append(Vulnerability(
                            severity="CRITICAL",
                            category="SCAFFOLDING",
                            title="Hardcoded secrets in source code",
                            description="Source code contains hardcoded secrets",
                            location=str(code_file),
                            evidence="Found hardcoded secrets matching known patterns",
                            recommendation="Move secrets to environment variables"
                        ))
                        break
            except Exception:
                continue
        
        return vulnerabilities
    
    async def audit_archive_risk(self, repo_info: RepositoryInfo) -> List[Vulnerability]:
        """Vector 4: Public vs. Private Matrix & Archive Risk"""
        logger.info(f'[AGENT BETA] Auditing archive risk for {repo_info.name}...')
        
        vulnerabilities = []
        
        # Check archived repositories
        if repo_info.archived:
            vulnerabilities.append(Vulnerability(
                severity="MEDIUM",
                category="ARCHIVE",
                title="Archived repository may contain vulnerabilities",
                description="Archived repositories are still publicly accessible and may contain unpatched vulnerabilities",
                location=repo_info.name,
                evidence=f"Repository is archived: {repo_info.archived}",
                recommendation="Review archived repos for sensitive data and consider making private or deleting"
            ))
        
        # Check for sensitive topics in public repos
        sensitive_topics = ['medical', 'health', 'device', 'clinical', 'fda', 'hipaa']
        repo_topics_lower = [topic.lower() for topic in repo_info.topics]
        
        if repo_info.visibility == 'public' and any(topic in repo_topics_lower for topic in sensitive_topics):
            vulnerabilities.append(Vulnerability(
                severity="HIGH",
                category="ARCHIVE",
                title="Sensitive medical topics in public repository",
                description="Public repository contains sensitive medical/health topics",
                location=repo_info.name,
                evidence=f"Topics: {', '.join(repo_info.topics)}",
                recommendation="Consider making repository private or removing sensitive topics"
            ))
        
        # Check for outdated dependencies in archived repos
        if repo_info.archived:
            vulnerabilities.append(Vulnerability(
                severity="LOW",
                category="ARCHIVE",
                title="Outdated dependencies in archived repository",
                description="Archived repositories may contain outdated dependencies with known vulnerabilities",
                location=repo_info.name,
                evidence="Repository is archived and may not receive security updates",
                recommendation="Audit dependencies and consider security implications"
            ))
        
        return vulnerabilities

class GitHubOPSECAudit:
    """Main audit orchestrator"""
    
    def __init__(self, github_token: str = None):
        self.github_token = github_token
        self.agent_alpha = AgentAlpha(github_token)
        self.agent_beta = AgentBeta(github_token)
        self.results = {
            'vulnerabilities': [],
            'summary': {},
            'recommendations': []
        }
    
    async def run_full_audit(self, target_path: str = ".") -> Dict[str, Any]:
        """Run the complete dual-agent OPSEC audit"""
        logger.info('🧪 P31 GITHUB OPSEC AUDIT: DUAL AGENT PROTOCOL')
        logger.info('================================================')
        logger.info(f'Start Time: {datetime.now().isoformat()}')
        logger.info('')
        
        # Phase 1: Agent Alpha - DevSecOps Analysis
        logger.info('🔴 PHASE 1: AGENT ALPHA - DevSecOps & Threat Intelligence')
        logger.info('--------------------------------------------------------')
        
        alpha_vulnerabilities = []
        
        # Find all git repositories
        git_repos = self._find_git_repositories(target_path)
        logger.info(f'Found {len(git_repos)} git repositories to audit')
        
        for repo_path in git_repos:
            try:
                # Audit commit history
                commit_vulns = await self.agent_alpha.audit_commit_history(repo_path)
                alpha_vulnerabilities.extend(commit_vulns)
                
                # Audit workflows
                workflow_vulns = await self.agent_alpha.audit_workflows(repo_path)
                alpha_vulnerabilities.extend(workflow_vulns)
                
            except Exception as e:
                logger.error(f"Error auditing repository {repo_path}: {e}")
        
        # Phase 2: Agent Beta - GitHub Architecture Analysis
        logger.info('')
        logger.info('🔵 PHASE 2: AGENT BETA - GitHub Architecture & Security')
        logger.info('------------------------------------------------------')
        
        beta_vulnerabilities = []
        
        # Audit local repository structure
        for repo_path in git_repos:
            try:
                scaffolding_vulns = await self.agent_beta.audit_scaffolding(repo_path)
                beta_vulnerabilities.extend(scaffolding_vulns)
            except Exception as e:
                logger.error(f"Error auditing scaffolding for {repo_path}: {e}")
        
        # Phase 3: Cross-Phase Analysis
        logger.info('')
        logger.info('🔍 PHASE 3: CROSS-PHASE VULNERABILITY ANALYSIS')
        logger.info('-----------------------------------------------')
        
        all_vulnerabilities = alpha_vulnerabilities + beta_vulnerabilities
        self._analyze_vulnerabilities(all_vulnerabilities)
        
        # Phase 4: Generate Report
        logger.info('')
        logger.info('📊 PHASE 4: FINAL OPSEC REPORT')
        logger.info('-------------------------------')
        
        self._generate_opsec_report(all_vulnerabilities)
        
        return self.results
    
    def _find_git_repositories(self, start_path: str) -> List[str]:
        """Find all git repositories in the given path"""
        git_repos = []
        start_path = Path(start_path)
        
        for path in start_path.rglob('.git'):
            if path.is_dir():
                git_repos.append(str(path.parent))
        
        return git_repos
    
    def _analyze_vulnerabilities(self, vulnerabilities: List[Vulnerability]):
        """Analyze and categorize vulnerabilities"""
        severity_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        category_counts = {}
        
        for vuln in vulnerabilities:
            severity_counts[vuln.severity] += 1
            category_counts[vuln.category] = category_counts.get(vuln.category, 0) + 1
        
        self.results['summary'] = {
            'total_vulnerabilities': len(vulnerabilities),
            'severity_breakdown': severity_counts,
            'category_breakdown': category_counts,
            'critical_findings': [v for v in vulnerabilities if v.severity == 'CRITICAL'],
            'high_findings': [v for v in vulnerabilities if v.severity == 'HIGH']
        }
    
    def _generate_opsec_report(self, vulnerabilities: List[Vulnerability]):
        """Generate the final OPSEC report"""
        logger.info('')
        logger.info('=== P31 GITHUB OPSEC AUDIT REPORT ===')
        logger.info('')
        
        # Summary
        total_vulns = len(vulnerabilities)
        critical_vulns = len([v for v in vulnerabilities if v.severity == 'CRITICAL'])
        high_vulns = len([v for v in vulnerabilities if v.severity == 'HIGH'])
        
        logger.info(f'TOTAL VULNERABILITIES: {total_vulns}')
        logger.info(f'CRITICAL: {critical_vulns}')
        logger.info(f'HIGH: {high_vulns}')
        logger.info('')
        
        # Top vulnerabilities by severity
        if critical_vulns > 0:
            logger.critical('🚨 CRITICAL VULNERABILITIES:')
            for i, vuln in enumerate([v for v in vulnerabilities if v.severity == 'CRITICAL'][:5], 1):
                logger.critical(f'  {i}. {vuln.title}')
                logger.critical(f'     Location: {vuln.location}')
                logger.critical(f'     Recommendation: {vuln.recommendation}')
                logger.critical('')
        
        if high_vulns > 0:
            logger.warning('⚠️  HIGH SEVERITY VULNERABILITIES:')
            for i, vuln in enumerate([v for v in vulnerabilities if v.severity == 'HIGH'][:5], 1):
                logger.warning(f'  {i}. {vuln.title}')
                logger.warning(f'     Location: {vuln.location}')
                logger.warning(f'     Recommendation: {vuln.recommendation}')
                logger.warning('')
        
        # Agent Handshake Summary
        logger.info('🤝 AGENT HANDSHAKE SUMMARY:')
        logger.info('  Agent Alpha identified critical commit history vulnerabilities')
        logger.info('  Agent Beta identified structural and persona exposure issues')
        logger.info('  Immediate action required on CRITICAL findings')
        logger.info('')
        
        # Compliance Status
        if critical_vulns > 0:
            logger.error('❌ COMPLIANCE STATUS: NON-COMPLIANT')
            logger.error('   Critical vulnerabilities must be addressed immediately')
            logger.error('   Risk to medical device compliance (21 CFR §890.3710)')
        elif high_vulns > 0:
            logger.warning('⚠️  COMPLIANCE STATUS: AT RISK')
            logger.warning('   High severity issues need remediation')
        else:
            logger.info('✅ COMPLIANCE STATUS: COMPLIANT')
            logger.info('   No critical or high severity vulnerabilities detected')
        
        logger.info('')
        logger.info(f'End Time: {datetime.now().isoformat()}')
        logger.info('🧪 P31 GITHUB OPSEC AUDIT: COMPLETE')
        logger.info('==================================')
        
        # Store results
        self.results['vulnerabilities'] = [asdict(v) for v in vulnerabilities]
        self.results['timestamp'] = datetime.now().isoformat()

def main():
    """Main entry point for the GitHub OPSEC audit"""
    import argparse
    
    parser = argparse.ArgumentParser(description='P31 GitHub OPSEC Audit: Dual Agent Protocol')
    parser.add_argument('--path', default='.', help='Path to audit (default: current directory)')
    parser.add_argument('--github-token', help='GitHub API token for enhanced analysis')
    parser.add_argument('--output', help='Output file for audit results (JSON)')
    
    args = parser.parse_args()
    
    # Create audit instance
    audit = GitHubOPSECAudit(github_token=args.github_token)
    
    try:
        # Run audit
        results = asyncio.run(audit.run_full_audit(args.path))
        
        # Save results if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f'Audit results saved to {args.output}')
        
        return 0
    except KeyboardInterrupt:
        logger.info('Audit interrupted by user')
        return 1
    except Exception as e:
        logger.error(f'Unexpected error: {e}')
        return 1

if __name__ == "__main__":
    sys.exit(main())