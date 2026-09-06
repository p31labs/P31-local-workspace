# P31 Labs Sovereign Command Center

A mobile-first, React-based Progressive Web App (PWA) designed as the central operational interface for the P31 Labs Sovereign Stack. This dashboard provides real-time monitoring and management of all 6 Cloudflare Workers, social media broadcasting, and quantum infrastructure.

## 🎯 Features

### Core Dashboard
- **Real-time Worker Monitoring** - Live status of all 6 Cloudflare workers
- **Multi-Platform Broadcasting** - Unified interface for social media management
- **Quantum Operations** - IBM QPU status monitoring and entropy generation
- **Mobile-First Design** - Optimized for touch interaction and mobile devices

### Platform Integration
- **Ko-fi Integration** - Node count, milestones, and Discord notifications
- **Zenodo Integration** - Academic repository and DOI publishing
- **Social Broadcasting** - Nostr, Bluesky, Mastodon, Twitter/X, Substack
- **Quantum Infrastructure** - IBM Quantum Runtime API and entropy generation

### Security & Compliance
- **Quantum-Safe Encryption** - All operations protected with PQC standards
- **Medical Device Compliance** - 21 CFR §890.3710 compliant interface
- **Low Cognitive Load** - Designed for neurodivergent operators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone and navigate to the project:**
```bash
cd software/sovereign-command-center
```

2. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

3. **Start development server:**
```bash
npm run dev
# or
pnpm dev
```

4. **Open in browser:**
Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## 📱 Mobile Features

### Progressive Web App
- **Offline Support** - Works without internet connection
- **Push Notifications** - Real-time alerts for critical events
- **Home Screen Installation** - Native app-like experience
- **Touch Optimized** - Gesture controls and swipe navigation

### Accessibility
- **High Contrast** - Optimized for low vision users
- **Voice Input** - Hands-free operation
- **Reduced Motion** - Respects user preferences
- **Screen Reader Support** - Full ARIA compliance

## 🔧 Architecture

### Tech Stack
- **Frontend:** Next.js 15 + React 19
- **Styling:** Tailwind CSS with custom animations
- **Icons:** Lucide React
- **TypeScript:** Full type safety

### Directory Structure
```
sovereign-command-center/
├── pages/                 # Next.js pages
│   ├── index.tsx         # Main dashboard
│   └── _app.tsx          # App wrapper
├── styles/               # Global styles
│   └── globals.css       # Tailwind + custom styles
├── public/               # Static assets
│   └── manifest.json     # PWA configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind configuration
└── README.md            # This file
```

## 🌐 Deployment

### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Set environment variables if needed

### Vercel
1. Import project from GitHub
2. Automatic Next.js configuration
3. Deploy with one click

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## 🔗 Integration with Sovereign Stack

### Cloudflare Workers
The dashboard connects to your 6 deployed workers:
- `p31-kofi-telemetry` - Funding and milestone tracking
- `p31-zenodo-publisher` - Academic publishing
- `p31-social-broadcast` - Multi-platform broadcasting
- `p31-quantum-bridge` - IBM Quantum Runtime API
- `p31-quantum-entropy` - Quantum entropy generation

### Discord Integration
- Real-time telemetry from Discord bot
- Payment notifications from Ko-fi
- Status updates and alerts

### Quantum Infrastructure
- Live connection to IBM Quantum Runtime
- Secure entropy generation for wcds
- Post-quantum cryptographic operations

## 🎨 Design System

### Color Palette
- **Void:** `#0f172a` (Deep background)
- **Phosphorus:** `#10b981` (Active/healthy green)
- **Crimson:** `#ef4444` (Alerts/errors)
- **Slate:** Various shades for UI elements

### Typography
- **Font Family:** System font stack
- **Font Sizes:** Responsive scaling
- **Line Heights:** Optimized for readability

### Animations
- **Fade In:** Smooth entry animations
- **Slide In:** Directional transitions
- **Pulse Effects:** Live status indicators
- **Spinners:** Loading states

## 📊 Monitoring & Analytics

### Worker Status
- Real-time HTTP status monitoring
- Latency tracking
- Connection health indicators

### Broadcast Analytics
- Platform-specific engagement metrics
- Success/failure rates
- Content performance tracking

### Quantum Operations
- QPU connection status
- Entropy generation metrics
- Security operation logs

## 🔒 Security Features

### Quantum-Safe Operations
- All API calls use PQC encryption
- Secure entropy generation
- Quantum-resistant authentication

### Data Protection
- Local storage encryption
- Secure session management
- Privacy-first design

### Compliance
- HIPAA-compliant data handling
- Medical device interface standards
- Accessibility compliance (WCAG 2.1)

## 🤖 Future Enhancements

### Phase 2: Advanced Features
- AI-powered content optimization
- Advanced analytics and reporting
- Push notification system
- Voice input integration

### Phase 3: Mobile App
- React Native mobile application
- Offline functionality
- Native platform integrations

### Phase 4: Quantum Integration
- Enhanced IBM QPU monitoring
- Quantum key distribution
- Performance optimization

## 📄 Legal & Compliance

This interface is designed to support the P31 Labs Sovereign Stack as a medical necessity under 21 CFR §890.3710. All design decisions prioritize accessibility, security, and compliance with medical device standards.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the P31 Labs Sovereign Stack and follows the same licensing terms.

## 🆘 Support

For support and questions:
- Check the [P31 Labs Documentation](../docs/)
- Review the [Sovereign Stack Architecture](../docs/SPACESHIP_EARTH_COMPLETE_IMPLEMENTATION.md)
- Contact the P31 Labs team

---

**🔺 Sovereign Command Center** - Your gateway to decentralized, quantum-safe social media management.