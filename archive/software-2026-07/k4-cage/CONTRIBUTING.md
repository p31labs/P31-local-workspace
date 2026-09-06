# Contributing to P31 Labs

Thank you for your interest in contributing to sovereign infrastructure for neurodivergent families.

## Code of Conduct

This project is governed by the P31 Labs Code of Conduct. All contributors are expected to uphold principles of sovereign, privacy-preserving, neurodivergent-affirming technology.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/description`)
3. Make your changes
4. Run the verification suite
5. Submit a pull request

## Development Setup

```bash
npm install
npm run typecheck
npm test
```

## Coding Standards

- TypeScript strict mode required
- No console.log in production code (use structured logging)
- No hardcoded secrets; always use environment variables or `wrangler secret`
- Security-sensitive comparisons must use `crypto.subtle.timingSafeEqual`
- All contributions must pass the TRIPER certification suite

## Spoon-Aware Design

P31 Labs is committed to neurodivergent-affirming design. When contributing:

- Respect the `data-spoons` attribute (levels 1, 3, 5)
- Use the quantum design system tokens
- Test with low-spoon mode (level 1)

## License

MIT License — see LICENSE file.
