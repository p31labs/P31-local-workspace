import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCageStore } from './hooks/useCageStore';
import { TetraView } from './components/TetraView';
import { LoveBoard } from './components/LoveBoard';
import { MeshTimeline } from './components/MeshTimeline';
import { useEffect } from 'react';
export function CageApp() {
    const { ping, nodes } = useCageStore();
    useEffect(() => { const i = setInterval(ping, 10_000); return () => clearInterval(i); }, [ping]);
    return (_jsxs("div", { className: "cage-root", children: [_jsxs("header", { className: "cage-hdr", children: [_jsx("h1", { className: "cage-logo", children: "\u25C7 K4 Cage" }), _jsxs("span", { className: "cage-status", children: [nodes.filter(n => n.online).length, "/4 online \u00B7 ", nodes.reduce((a, n) => a + n.love, 0), " LOVE"] })] }), _jsxs("main", { className: "cage-main", children: [_jsx(TetraView, {}), _jsx(LoveBoard, {}), _jsx(MeshTimeline, {})] }), _jsx("footer", { className: "cage-ftr", children: _jsx("span", { children: "Four nodes. Six edges. One unbreakable mesh." }) })] }));
}
//# sourceMappingURL=CageApp.js.map