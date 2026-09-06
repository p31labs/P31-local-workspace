# P31 Q-Suite: Quantum User Testing Suite & GitHub OPSEC Audit

## Overview

This directory contains the complete implementation of the P31 Q-Suite: a comprehensive testing framework designed to find and fix race conditions in the Spoons economy system, along with a dual-agent GitHub OPSEC audit system for security compliance.

## 🧪 P31 Q-Suite: Quantum User Testing

### Architecture

The Q-Suite employs a dual-agent methodology that executes two contradictory testing states simultaneously to force the system to reconcile overlapping realities:

#### Agent RED (Headless Chaos Node)
- **Vector**: Direct API hits to `http://localhost:3001/api/shelter/brain/expend`
- **Target**: Backend Spoons economy and Upstash Redis
- **Objective**: Break the Spoons Economy via Async Race Conditions
- **Method**: Fires overlapping asynchronous requests at millisecond intervals

#### Agent BLUE (Headed Empathy Node)  
- **Vector**: Playwright automated UI testing (Android Tablet / 3G Network speeds)
- **Target**: p31.ui and Discord UX
- **Objective**: Simulate neurodivergent users with motor tics and cognitive load
- **Method**: Tests double-clicks, cognitive load limits, and somatic visual feedback

### Components

1. **`spoons_api.py`** - Backend API with race condition protection
2. **`qsuite_agent_red.py`** - Agent RED chaos testing
3. **`qsuite_agent_blue.py`** - Agent BLUE UI empathy testing
4. **`run_q_suite.py`** - Complete test orchestration
5. **`Q_SUITEDOCUMENTATION.md`** - Comprehensive documentation

### Race Condition Protection: The Resin

The core protection mechanism is an atomic Lua script executed within Redis that mathematically guarantees:
- **No race conditions** - Single Redis transaction prevents concurrent modifications
- **Idempotency** - Duplicate requests within 5 seconds are rejected
- **Medical safety** - System halts at 0 spoons to prevent cognitive overload
- **Atomicity** - All-or-nothing operations prevent partial state corruption

## 🛡️ GitHub OPSEC Audit System

### Dual Agent Protocol

A zero-trust, hostile OPSEC audit of the Phosphorus31 (P31) and Trimtab-Signal GitHub repository structures:

#### Agent Alpha: DevSecOps Master & Threat Intelligence Analyst
- **Vector 1**: Commit History & Trade Secret Bleed
- **Vector 3**: Vulnerable GitHub Actions workflows

#### Agent Beta: GitHub Enterprise Architect & Security Auditor  
- **Vector 2**: Persona Overexposure & PII
- **Vector 4**: Public vs. Private Matrix (Archive Risk)

### Security Vectors

1. **Commit History**: Detects leaked .env files, API keys, and proprietary code
2. **Persona Exposure**: Identifies personal information in GitHub profiles
3. **Workflows**: Finds secrets exposed in GitHub Actions logs
4. **Scaffolding**: Checks for missing security files and vulnerable code
5. **Archive Risk**: Assesses public repositories with sensitive content

## 🚀 Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers (for Agent BLUE)
playwright install
```

### Running the Q-Suite

```bash
# Start the API server
python spoons_api.py

# Run complete Q-Suite
python run_q_suite.py

# Custom endpoints
python run_q_suite.py --api-url http://your-api:3001 --ui-url http://your-ui:3000
```

### Running GitHub OPSEC Audit

```bash
# Basic audit
python github_opsec_audit.py

# With GitHub token for enhanced analysis
python github_opsec_audit.py --github-token your_token_here

# Save results to file
python github_opsec_audit.py --output audit_results.json
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run tests against Docker deployment
python run_q_suite.py --api-url http://localhost:3001
```

## 📊 Test Results Interpretation

### Q-Suite Results

#### ✅ PASS Conditions:
- All race condition protections working
- No spoons go below 0
- Idempotency keys prevent duplicates
- UI/API consistency maintained
- Medical safety compliance verified

#### ❌ CRITICAL Issues:
- Spoons going below 0 (medical safety violation)
- Race conditions detected
- UI/API inconsistencies
- Phantom haptic issues

### OPSEC Audit Results

#### 🚨 CRITICAL Vulnerabilities:
- Leaked secrets in commit history
- Hardcoded credentials in source code
- Exposed personal information in profiles

#### ⚠️ HIGH Severity:
- Missing security files
- Incomplete .gitignore patterns
- Sensitive topics in public repositories

#### ✅ COMPLIANCE STATUS:
- **COMPLIANT**: No critical or high severity vulnerabilities
- **AT RISK**: High severity issues need remediation  
- **NON-COMPLIANT**: Critical vulnerabilities must be addressed immediately

## 🔒 Security & Compliance

### Medical Device Compliance
- **21 CFR §890.3710**: Medical device safety standards
- **ISO 13485:2016**: Post-market clinical follow-up requirements
- **Medical Safety Hard-Stop**: System enforces 0-spoon minimum

### Cybersecurity Standards
- **ISO 27001**: Information security management
- **NIST Cybersecurity Framework**: Risk management framework
- **SOC 2 Type II**: Security controls compliance

### OPSEC Best Practices
- **Git History Sanitization**: Remove leaked secrets permanently
- **Repository Segregation**: Separate professional and personal accounts
- **Workflow Security**: Prevent secrets exposure in logs
- **Access Controls**: Implement proper branch protection rules

## 📁 File Structure

```
backend/
├── spoons_api.py              # Backend API with race condition protection
├── qsuite_agent_red.py        # Agent RED chaos testing
├── qsuite_agent_blue.py       # Agent BLUE UI empathy testing
├── run_q_suite.py             # Complete test orchestration
├── github_opsec_audit.py      # Dual-agent GitHub security audit
├── requirements.txt            # Python dependencies
├── Q_SUITEDOCUMENTATION.md    # Comprehensive Q-Suite documentation
├── Dockerfile                 # Docker containerization
├── docker-compose.yml         # Docker Compose setup
└── README.md                  # This file
```

## 🧠 Architect's Notes

### The Resin: Atomic Protection

The "Resin" - our atomic Lua script - mathematically guarantees that spoons can never drop below zero, even under extreme load conditions. This protects neurodivergent users from cognitive overload while maintaining system integrity.

**Key Protection Layers:**
1. **Idempotency Keys**: Prevent duplicate requests within 5-second window
2. **Atomic Operations**: Single Redis transaction prevents race conditions  
3. **Medical Hard-Stop**: System halts at 0 spoons (21 CFR §890.3710 compliance)
4. **Rate Limiting**: Additional protection against abuse

### OPSEC: The Silent Guardian

The GitHub OPSEC audit system acts as a silent guardian, constantly scanning for:
- **Accidental Leaks**: .env files, API keys, proprietary code
- **Persona Bleed**: Personal information mixed with professional accounts
- **Workflow Vulnerabilities**: Secrets exposed in build logs
- **Archive Risks**: Public repositories with sensitive content

### Compliance Matrix

| Standard | Q-Suite | OPSEC Audit | Status |
|----------|---------|-------------|---------|
| 21 CFR §890.3710 | ✅ | N/A | Medical Safety |
| ISO 13485:2016 | ✅ | N/A | Clinical Follow-up |
| ISO 27001 | N/A | ✅ | InfoSec Management |
| NIST CSF | N/A | ✅ | Risk Management |
| SOC 2 Type II | N/A | ✅ | Security Controls |

## 🆘 Troubleshooting

### Common Issues

1. **Redis Connection Failed**: Ensure Redis is running and accessible
2. **Playwright Not Installed**: Run `playwright install`
3. **API Not Responding**: Check if backend server is running on correct port
4. **UI Tests Failing**: Verify UI is accessible at specified URL

### Debug Mode

Enable debug logging:
```python
logging.basicConfig(level=logging.DEBUG)
```

### Manual Testing

Test the API endpoint directly:
```bash
curl -X PATCH http://localhost:3001/api/shelter/brain/expend \
  -H "Content-Type: application/json" \
  -d '{"fingerprint_hash": "test_user", "action_type": "POSNER_VOTE"}'
```

## 📞 Support

For questions or support regarding the P31 Q-Suite implementation:

- Review the source code comments for detailed explanations
- Check the test results for specific failure analysis
- Consult the medical device compliance documentation
- Run the GitHub OPSEC audit for security guidance

## 🎯 Mission Critical

The P31 Q-Suite ensures that the Spoons economy system maintains both **technical correctness** and **user experience quality** while adhering to strict **medical device compliance** standards. The dual-agent approach provides comprehensive coverage of both backend race conditions and frontend empathy issues.

The GitHub OPSEC audit system protects against **operational security risks** that could compromise the entire P31 ecosystem, ensuring that trade secrets, personal information, and medical device code remain secure and compliant.