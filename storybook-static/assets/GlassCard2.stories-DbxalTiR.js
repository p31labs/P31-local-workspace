import{t as e}from"./jsx-runtime-CGlKWo3u.js";import{t}from"./GlassCard-C6YmcZkD.js";import"./chrome-DjdQLgxo.js";var n=e(),r={component:t,title:`UI/GlassCard`,argTypes:{color:{control:`select`,options:[`accent`,`violet`,`gold`],defaultValue:`accent`},padding:{control:`select`,options:[`sm`,`md`,`lg`,`xl`],defaultValue:`lg`},interactive:{control:`boolean`,defaultValue:!0}}},i={sm:`12px`,md:`20px`,lg:`28px`,xl:`40px`},a={accent:{borderColor:`var(--p31-accent, oklch(65% 0.18 195))`,boxShadow:`var(--p31-glow-cyan, 0 0 20px rgba(0,240,255,0.25))`},violet:{borderColor:`var(--p31-accent-violet, oklch(65% 0.18 285))`,boxShadow:`var(--p31-glow-violet, 0 0 20px rgba(167,139,250,0.25))`},gold:{borderColor:`var(--p31-accent-gold, oklch(65% 0.18 15))`,boxShadow:`var(--p31-glow-gold, 0 0 20px rgba(251,191,36,0.25))`}},o=(0,n.jsxs)(`div`,{style:{color:`var(--p31-text, oklch(96% 0.005 240))`},children:[(0,n.jsx)(`h3`,{style:{margin:`0 0 8px`,fontSize:`1.25rem`},children:`Glass Card`}),(0,n.jsx)(`p`,{style:{margin:0,color:`var(--p31-text-secondary, oklch(75% 0.01 240))`},children:`A glassmorphic container with backdrop blur and subtle border glow.`})]}),s=e=>{let{color:r,padding:o,interactive:s,...c}=e,l=i[o||`lg`];return(0,n.jsx)(t,{...c,style:{...c.style||{},padding:l,...r&&r!==`accent`?a[r]:{},...s===!1?{pointerEvents:`none`,opacity:.6}:{}}})},c={args:{children:o}},l={args:{children:o,color:`accent`},render:s},u={args:{children:o,color:`violet`},render:s},d={args:{children:o,color:`gold`},render:s},f={args:{children:o,strong:!0}},p={args:{children:o,interactive:!0},render:s},m={args:{children:o,interactive:!1},render:s};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    color: 'accent'
  },
  render: renderCard
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    color: 'violet'
  },
  render: renderCard
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    color: 'gold'
  },
  render: renderCard
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    strong: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    interactive: true
  },
  render: renderCard
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    children: cardContent,
    interactive: false
  },
  render: renderCard
}`,...m.parameters?.docs?.source}}};var h=[`Default`,`Accent`,`Violet`,`Gold`,`Strong`,`Interactive`,`NonInteractive`];export{l as Accent,c as Default,d as Gold,p as Interactive,m as NonInteractive,f as Strong,u as Violet,h as __namedExportsOrder,r as default};