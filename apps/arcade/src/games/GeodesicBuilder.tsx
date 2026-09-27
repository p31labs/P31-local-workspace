import { useRef, useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31ca/game-engine/react';
import {
  createStructure, placePiece as place, analyzeStructure, PRIMITIVES,
  gatedPrimitives, type PrimitiveType, type Structure,
} from '@p31ca/game-engine';
import { AchievementToast } from './common/AchievementToast';
import { playNote, P31_F } from './common/sound';

const PRIMITIVE_COLORS: Record<PrimitiveType, string> = {
  tetrahedron: '#FBBF24', octahedron: '#00F0FF', icosahedron: '#A78BFA', strut: '#34D399', hub: '#FB7185',
};

function JitterbugAmbient({ phase }: { phase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002; });
  const verts = [0,1,1, 0,1,-1, 0,-1,1, 0,-1,-1, 1,0,1, 1,0,-1, -1,0,1, -1,0,-1, 1,1,0, 1,-1,0, -1,1,0, -1,-1,0];
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 12; i++) pts.push(new THREE.Vector3(verts[i*3]*3, verts[i*3+1]*3, verts[i*3+2]*3));
  const edges = [[0,4],[0,5],[0,8],[0,9],[1,4],[1,5],[1,10],[1,11],[2,6],[2,7],[2,8],[2,9],[3,6],[3,7],[3,10],[3,11],[4,8],[4,10],[5,9],[5,11],[6,8],[6,10],[7,9],[7,11]];
  return <group ref={ref}>{edges.map(([a,b],i) => <Line key={i} points={[pts[a], pts[b]]} color="#00F0FF" lineWidth={0.3} transparent opacity={0.08} />)}</group>;
}

function PieceMesh({ piece }: { piece: any }) {
  const c = new THREE.Color(PRIMITIVE_COLORS[piece.type] || '#fff');
  const s = 0.35 * piece.scale;
  const pos = new THREE.Vector3(piece.position.x, piece.position.y, piece.position.z);
  return (
    <mesh position={pos}>
      {piece.type === 'tetrahedron' && <tetrahedronGeometry args={[s, 0]} />}
      {piece.type === 'octahedron' && <octahedronGeometry args={[s, 0]} />}
      {piece.type === 'icosahedron' && <icosahedronGeometry args={[s, 0]} />}
      {(piece.type === 'strut' || piece.type === 'hub') && <sphereGeometry args={[s * 0.5, 16, 16]} />}
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} roughness={0.15} metalness={0.3} />
    </mesh>
  );
}

function ConnectionLines({ structure }: { structure: Structure }) {
  const arr: [THREE.Vector3, THREE.Vector3][] = [];
  for (const p of structure.pieces) {
    for (const cid of p.connectedTo) {
      const conn = structure.pieces.find(x => x.id === cid);
      if (conn) arr.push([new THREE.Vector3(p.position.x, p.position.y, p.position.z), new THREE.Vector3(conn.position.x, conn.position.y, conn.position.z)]);
    }
  }
  return <>{arr.map(([a,b], i) => <Line key={i} points={[a,b]} color="#00F0FF" lineWidth={1} transparent opacity={0.4} />)}</>;
}

function Scene({ structure, phase }: { structure: Structure; phase: number }) {
  return (<>
    <ambientLight intensity={0.3} color="#0a0a1a" />
    <directionalLight position={[5,8,4]} intensity={2} color="#00F0FF" />
    <directionalLight position={[-4,-3,-3]} intensity={1.2} color="#A78BFA" />
    <pointLight position={[0,2,4]} intensity={3} color="#FBBF24" distance={10} />
    <JitterbugAmbient phase={phase} />
    <ConnectionLines structure={structure} />
    {structure.pieces.map((p, i) => <PieceMesh key={i} piece={p} />)}
    <OrbitControls enablePan enableZoom minDistance={3} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
    <gridHelper args={[8, 20, '#14203a', '#0b1220']} position={[0, -2, 0]} />
    <EffectComposer><Bloom luminanceThreshold={0.2} intensity={0.5} radius={0.4} /></EffectComposer>
  </>);
}

export default function GeodesicBuilder() {
  const { spoons, setSpoons, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({ type: 'geodesic', spoons, onComplete: (d) => { playNote(P31_F.goal, 0.5, 0.12); mintLOVE(d.loveEarned, 'geodesic'); } });
  const [structure, setStructure] = useState<Structure>(() => createStructure('My Dome', 'player', '#00F0FF'));
  const [selectedType, setSelectedType] = useState<PrimitiveType>('tetrahedron');
  const [msg, setMsg] = useState('Click Place. Drag to orbit. Scroll to zoom.');
  const [achievement, setAchievement] = useState<any>(null);
  const msgT = useRef<ReturnType<typeof setTimeout>>();
  const gated = gatedPrimitives(spoons);

  const show = (s: string, d = 2000) => { setMsg(s); if (msgT.current) clearTimeout(msgT.current); msgT.current = setTimeout(() => setMsg(''), d); };

  const handlePlace = useCallback(() => {
    if (!gated.allowedTypes.includes(selectedType)) { show('Need more energy for that primitive'); return; }
    if (structure.pieces.length >= gated.maxPieces) { show(`Max ${gated.maxPieces} pieces`); return; }
    const x = (Math.random() - 0.5) * 3, y = (Math.random() - 0.5) * 2;
    const r = place(structure, selectedType, { x, y, z: 0 }, { x: 0, y: 0, z: 0 }, 1, PRIMITIVE_COLORS[selectedType]);
    setStructure(r.structure); actions.addScore(10); playNote(P31_F.root, 0.08);
    if (r.snaps > 0) { actions.addLove(r.snaps * 5); show(`${r.snaps} connection${r.snaps>1?'s':''}! +${r.snaps*5} LOVE`); }
    if (r.structure.rigidity.isRigid && r.structure.pieces.length > 1) { actions.addLove(25); playNote(P31_F.fifth, 0.3, 0.1); setAchievement({ id:'rigid', title:'Structure RIGID!', description:'Maxwell criterion satisfied.', loveReward:25 }); }
    if (new Set(r.structure.pieces.map(p=>p.type)).size >= 3) { actions.addLove(50); setAchievement({ id:'types3', title:'3 Primitives!', description:'Builder mastery.', loveReward:50 }); }
  }, [structure, selectedType, spoons, gated, actions]);

  const complete = () => { const l = structure.pieces.length * 10 + (structure.rigidity.isRigid?100:0); actions.addLove(l); actions.complete(); show(`Complete! +${l} LOVE`, 4000); };

  useEffect(() => { const i = setInterval(() => actions.updateJitterbug(), 16); return () => clearInterval(i); }, [actions]);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'16px', maxWidth:500, margin:'0 auto' }}>
      <div style={{ width:'100%', padding:'10px 16px', borderRadius:12, background:'rgba(10,10,20,0.85)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,240,255,0.12)', display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'monospace', color:'#d4d4d8' }}>
        <span>Pcs: {structure.pieces.length}/{gated.maxPieces}</span>
        <span style={{ color: structure.rigidity.isRigid?'#34D399':'#94A3B8' }}>{structure.rigidity.isRigid?'◆ RIGID':'flexible'}</span>
        <span style={{ color:'#34D399' }}>♥ {state.loveEarned}</span>
      </div>
      <div style={{ width:400, height:400, borderRadius:16, overflow:'hidden', border:'1px solid rgba(0,240,255,0.15)', background:'#050510' }}>
        <Canvas camera={{ position:[0,1.5,6], fov:40 }} gl={{ antialias:true, alpha:true }}>
          <Suspense fallback={null}><Scene structure={structure} phase={state.jitterbug.phase} /></Suspense>
        </Canvas>
      </div>
      {msg && <div style={{ padding:'8px 20px', borderRadius:10, background:'rgba(0,240,255,0.1)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,240,255,0.2)', color:'#00F0FF', fontSize:13, fontWeight:600, fontFamily:'monospace' }}>{msg}</div>}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center' }}>
        {(Object.keys(PRIMITIVE_COLORS) as PrimitiveType[]).map(t => {
          const ok = gated.allowedTypes.includes(t);
          return <button key={t} onClick={() => setSelectedType(t)} style={{ padding:'5px 10px', borderRadius:7, cursor:ok?'pointer':'default', border:selectedType===t?`2px solid ${PRIMITIVE_COLORS[t]}`:`1px solid ${PRIMITIVE_COLORS[t]}30`, background:selectedType===t?`${PRIMITIVE_COLORS[t]}15`:'transparent', color:ok?PRIMITIVE_COLORS[t]:'rgba(255,255,255,0.2)', fontSize:11, fontFamily:'monospace', opacity:ok?1:0.4, transition:'all 0.2s' }}>{t==='tetrahedron'?'Tetra':t==='octahedron'?'Octa':t==='icosahedron'?'Icosa':t}</button>;
        })}
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={handlePlace} style={{ padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00F0FF,#0098FF)', color:'#0A0A0F', fontWeight:700, fontSize:13, fontFamily:'monospace' }}>Place</button>
        <button onClick={complete} disabled={structure.pieces.length===0} style={{ padding:'10px 24px', borderRadius:10, border:'none', cursor:structure.pieces.length?'pointer':'default', background:structure.pieces.length?'linear-gradient(135deg,#FBBF24,#F59E0B)':'#333', color:'#0A0A0F', fontWeight:700, fontSize:13, fontFamily:'monospace', opacity:structure.pieces.length?1:0.5 }}>Complete</button>
        {([0,1,2,3,4,5] as const).map(s => <button key={s} onClick={() => setSpoons(s)} style={{ width:26, padding:'3px 0', borderRadius:4, cursor:'pointer', border:spoons===s?`1px solid ${s<=1?'#FB7185':'#00F0FF'}`:'1px solid rgba(255,255,255,0.1)', background:spoons===s?`${s<=1?'#FB7185':'#00F0FF'}15`:'transparent', color:spoons===s?s<=1?'#FB7185':'#00F0FF':'rgba(255,255,255,0.4)', fontSize:10, fontFamily:'monospace' }}>{s===0?'!':s}</button>)}
      </div>
      <AchievementToast achievement={achievement} onDone={() => setAchievement(null)} />
    </div>
  );
}
