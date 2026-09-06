import { useCageStore } from './hooks/useCageStore';import { TetraView } from './components/TetraView';import { LoveBoard } from './components/LoveBoard';import { MeshTimeline } from './components/MeshTimeline';import { useEffect } from 'react';

export function CageApp(){const{ping,nodes}=useCageStore();useEffect(()=>{const i=setInterval(ping,10_000);return()=>clearInterval(i)},[ping]);
return(<div className="cage-root">
<header className="cage-hdr"><h1 className="cage-logo">◇ K4 Cage</h1><span className="cage-status">{nodes.filter(n=>n.online).length}/4 online · {nodes.reduce((a,n)=>a+n.love,0)} LOVE</span></header>
<main className="cage-main"><TetraView/><LoveBoard/><MeshTimeline/></main>
<footer className="cage-ftr"><span>Four nodes. Six edges. One unbreakable mesh.</span></footer>
</div>)}