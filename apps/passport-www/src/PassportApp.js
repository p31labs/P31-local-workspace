import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePassportStore } from './hooks/usePassportStore';
import { IdentityCard } from './components/IdentityCard';
import { ActorEditor } from './components/ActorEditor';
import { ExportPanel } from './components/ExportPanel';
export function PassportApp() {
    const { passport } = usePassportStore();
    return (_jsxs("div", { className: "passport-root", children: [_jsxs("header", { className: "pass-hdr", children: [_jsx("h1", { className: "pass-logo", children: "\u25C7 Cognitive Passport" }), _jsxs("span", { className: "pass-edition", children: ["Edition ", passport.edition] })] }), _jsxs("main", { className: "pass-main", children: [_jsx(IdentityCard, {}), _jsx(ActorEditor, {}), _jsx(ExportPanel, {})] }), _jsx("footer", { className: "pass-ftr", children: _jsx("span", { children: "Self-sovereign identity \u00B7 Ed25519-signed \u00B7 DID:web \u00B7 ML-DSA-65" }) })] }));
}
//# sourceMappingURL=PassportApp.js.map