interface CageNode {
    id: string;
    name: string;
    online: boolean;
    love: number;
    lastPing: number | null;
    mood: string;
}
interface CageState {
    nodes: CageNode[];
    events: string[];
    ping: () => void;
    sendLove: (id: string) => void;
    addEvent: (e: string) => void;
}
export declare const useCageStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CageState>>;
export {};
//# sourceMappingURL=useCageStore.d.ts.map