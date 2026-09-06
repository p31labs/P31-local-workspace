import{t as e}from"./jsx-runtime-mpqBHCWX.js";var t=e(),n={cyan:`border-quantum-cyan/30 text-quantum-cyan hover:bg-quantum-cyan/10 glow-cyan`,violet:`border-quantum-violet/30 text-quantum-violet hover:bg-quantum-violet/10 glow-violet`,gold:`border-quantum-gold/30 text-quantum-gold hover:bg-quantum-gold/10 glow-gold`,green:`border-quantum-green/30 text-quantum-green hover:bg-quantum-green/10 glow-green`,rose:`border-quantum-rose/30 text-quantum-rose hover:bg-quantum-rose/10 glow-rose`},r={sm:`px-3 py-1.5 text-xs`,md:`px-4 py-2 text-sm`,lg:`px-6 py-3 text-base`};function i({children:e,color:i=`cyan`,size:a=`md`,variant:o=`primary`,className:s,...c}){let l=o===`secondary`?`bg-void-raised/40 hover:bg-void-raised/60`:o===`ghost`?`bg-transparent hover:bg-white/5`:``;return(0,t.jsx)(`button`,{className:`rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] min-w-[44px] ${n[i]} ${r[a]} ${l} ${s||``}`,...c,children:e})}i.__docgenInfo={description:``,methods:[],displayName:`GlowButton`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``},color:{required:!1,tsType:{name:`union`,raw:`'cyan' | 'violet' | 'gold' | 'green' | 'rose'`,elements:[{name:`literal`,value:`'cyan'`},{name:`literal`,value:`'violet'`},{name:`literal`,value:`'gold'`},{name:`literal`,value:`'green'`},{name:`literal`,value:`'rose'`}]},description:``,defaultValue:{value:`'cyan'`,computed:!1}},size:{required:!1,tsType:{name:`union`,raw:`'sm' | 'md' | 'lg'`,elements:[{name:`literal`,value:`'sm'`},{name:`literal`,value:`'md'`},{name:`literal`,value:`'lg'`}]},description:``,defaultValue:{value:`'md'`,computed:!1}},variant:{required:!1,tsType:{name:`union`,raw:`'primary' | 'secondary' | 'ghost'`,elements:[{name:`literal`,value:`'primary'`},{name:`literal`,value:`'secondary'`},{name:`literal`,value:`'ghost'`}]},description:``,defaultValue:{value:`'primary'`,computed:!1}}},composes:[`ButtonHTMLAttributes`]};var a={component:i,title:`UI/GlowButton`},o={args:{children:`Cyan`,color:`cyan`}},s={args:{children:`Violet`,color:`violet`}},c={args:{children:`Gold`,color:`gold`}},l={args:{children:`Green`,color:`green`}},u={args:{children:`Rose`,color:`rose`}},d={args:{children:`Small`,size:`sm`}},f={args:{children:`Large`,size:`lg`}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Cyan',
    color: 'cyan'
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Violet',
    color: 'violet'
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Gold',
    color: 'gold'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Green',
    color: 'green'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Rose',
    color: 'rose'
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Small',
    size: 'sm'
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Large',
    size: 'lg'
  }
}`,...f.parameters?.docs?.source}}};var p=[`Cyan`,`Violet`,`Gold`,`Green`,`Rose`,`Small`,`Large`];export{o as Cyan,c as Gold,l as Green,f as Large,u as Rose,d as Small,s as Violet,p as __namedExportsOrder,a as default};