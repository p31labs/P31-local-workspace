import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCageStore } from '../hooks/useCageStore';
export function MeshTimeline() { const { events } = useCageStore(); return (_jsxs("div", { className: "mesh-timeline", children: [_jsx("h3", { children: "Mesh Timeline" }), _jsx("div", { className: "mesh-events", children: events.map((e, i) => (_jsxs("div", { className: "mesh-event", children: [_jsx("span", { className: "mesh-event-dot" }), _jsx("span", { children: e })] }, i))) })] })); }
//# sourceMappingURL=MeshTimeline.js.map