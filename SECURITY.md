# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Active development |

## Reporting a Vulnerability

To report a security vulnerability, please open a draft security advisory via GitHub:
https://github.com/p31labs/andromeda/security/advisories/new

You should expect an acknowledgment within 48 hours and an initial assessment within 5 business days.

## Responsible Disclosure

We kindly request that you:
- Do not disclose the vulnerability publicly until it has been addressed
- Provide sufficient detail to allow reproduction and remediation
- Allow reasonable time for a fix to be developed and deployed

## Security Practices

- All CI workflows use pinned SHA-based action versions
- Workflow permissions are set to read-only by default
- Branch protection requires PR review and passing status checks
- Secrets are never committed to the repository
