interface Actor {
    id: string;
    name: string;
    role: string;
}
interface Passport {
    edition: string;
    actors: Actor[];
    createdAt: string;
}
interface PassportState {
    passport: Passport;
    addActor: (a: Actor) => void;
    removeActor: (id: string) => void;
    exportJSON: () => string;
    exportMD: () => string;
}
export declare const usePassportStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PassportState>>;
export {};
//# sourceMappingURL=usePassportStore.d.ts.map