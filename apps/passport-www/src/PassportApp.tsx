import { usePassportStore } from './hooks/usePassportStore';import { IdentityCard } from './components/IdentityCard';import { ActorEditor } from './components/ActorEditor';import { ExportPanel } from './components/ExportPanel';

export function PassportApp(){const{passport}=usePassportStore();return(<div className="passport-root">
<header className="pass-hdr"><h1 className="pass-logo">◇ Cognitive Passport</h1><span className="pass-edition">Edition {passport.edition}</span></header>
<main className="pass-main"><IdentityCard/><ActorEditor/><ExportPanel/></main>
<footer className="pass-ftr"><span>Self-sovereign identity · Ed25519-signed · DID:web · ML-DSA-65</span></footer>
</div>)}