(function(){'use strict';
var d=document,w=window;
function sc(l){return l<2?'var(--p31-accent-red,oklch(0.719 0.169 13))':l<4?'var(--p31-accent-gold,oklch(0.837 0.164 84))':'var(--p31-accent,oklch(0.870 0.148 203))'}
function updDial(l){
 var e=d.getElementById('spoon-dial');if(!e)return;
 if(typeof e.value!=='undefined')e.value=l;
 e.setAttribute('data-level',l);var c=sc(l);
 e.querySelectorAll('[data-dot],[role="dot"],z-dot').forEach(function(d,i){if(i<l){d.setAttribute('data-active','');d.style.background=c}else{d.removeAttribute('data-active');d.style.background=''}});
 e.style.setProperty('--z-range-fill-bg',c);
 e.dispatchEvent(new CustomEvent('dial:update',{detail:{level:l},bubbles:true}));
}
function updBadge(s){
 var e=d.querySelector('[data-mcp-tool="statusBadge"]')||d.getElementById('status-badge');if(!e)return;
 e.setAttribute('data-status',s);
 var dt=e.querySelector('[data-status-dot],[data-dot],.status-dot'),lbl=e.querySelector('[data-status-label],[data-label],.status-label');
 var C={online:'var(--p31-accent-green,oklch(0.773 0.153 163))',offline:'var(--p31-accent-red,oklch(0.719 0.169 13))',busy:'var(--p31-accent-gold,oklch(0.837 0.164 84))',away:'var(--p31-text-tertiary,oklch(0.711 0.035 257))'};
 if(dt)dt.style.background=C[s]||C.away;
 if(lbl)lbl.textContent=s[0].toUpperCase()+s.slice(1);
}
function setSpoonLevel(l){l=Math.max(0,Math.min(5,+l||0));d.documentElement.setAttribute('data-spoons',l);updDial(l);w.dispatchEvent(new CustomEvent('spoons:changed',{detail:{level:l}}));return{l:l}}
function setStatus(s){updBadge(s);return{s:s}}
function navigate(h,x){if(!h)return{error:1};x?w.open(h,'_blank','noopener,noreferrer'):w.location.href=h;return{h:h}}
function toggleDrawer(o,t){
 var q=t||'[data-mcp-tool="drawer"]',e=d.querySelector(q);if(!e)return{error:1};
 var p=o!==void 0?o:!e.hasAttribute('open');
 p?(e.setAttribute('open',''),e.dispatchEvent(new CustomEvent('drawer:open',{bubbles:true}))):(e.removeAttribute('open'),e.dispatchEvent(new CustomEvent('drawer:close',{bubbles:true})));
 return{open:p};
}
function scrollToElement(s,b){var e=d.querySelector(s);if(!e)return{error:1};e.scrollIntoView({behavior:b||'smooth',block:'start'});return{}}
function clickElement(s){var e=d.querySelector(s);if(!e)return{error:1};e.click();return{}}
function setInputValue(s,v){var e=d.querySelector(s);if(!e)return{error:1};e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return{}}
function scanUI(){
 var r=[];d.querySelectorAll('[data-mcp-tool]').forEach(function(e){
  var a={t:e.getAttribute('data-mcp-tool'),tag:e.tagName.toLowerCase()};
  var attrs=['state','target','type','range','current','href','external'];
  attrs.forEach(function(k){var v=e.getAttribute('data-mcp-'+k);if(v)a[k]=v});
  a.n=e.children.length;a.d=e.disabled||e.getAttribute('aria-disabled')==='true';
  r.push(a);
 });return r;
}
var tools={setSpoonLevel:setSpoonLevel,setStatus:setStatus,navigate:navigate,toggleDrawer:toggleDrawer,scrollToElement:scrollToElement,clickElement:clickElement,setInputValue:setInputValue,scanUI:scanUI,updateSpoonDial:updDial,updateStatusBadge:updBadge};
function exec(n,a){
 var f=tools[n];if(!f)throw new Error('?');
 if(Array.isArray(a))return f.apply(null,a);
 if(a&&typeof a==='object'){
  if(n==='setSpoonLevel'||n==='updateSpoonDial')return f(a.level);
  if(n==='setStatus'||n==='updateStatusBadge')return f(a.status);
  if(n==='navigate')return f(a.href,a.external);
  if(n==='toggleDrawer')return f(a.state,a.target);
  if(n==='scrollToElement'||n==='clickElement'||n==='setInputValue')return f(a.selector,a.behavior||a.value);
  if(n==='scanUI')return f();
 }return f(a);
}
var _ctx=typeof document!=='undefined'&&document.modelContext?document.modelContext:typeof navigator!=='undefined'&&navigator.modelContext?navigator.modelContext:null;
if(_ctx&&typeof _ctx.registerTool==='function'){
 var defs=['setSpoonLevel|setStatus|navigate|toggleDrawer|scrollToElement|clickElement|setInputValue|scanUI'];
 var schemas={
  setSpoonLevel:{type:'object',properties:{level:{type:'number',minimum:0,maximum:5}},required:['level']},
  setStatus:{type:'object',properties:{status:{type:'string',enum:['online','offline','busy','away']}},required:['status']},
  navigate:{type:'object',properties:{href:{type:'string'},external:{type:'boolean'}},required:['href']},
  toggleDrawer:{type:'object',properties:{state:{type:'boolean'},target:{type:'string'}}},
  scrollToElement:{type:'object',properties:{selector:{type:'string'},behavior:{type:'string',enum:['smooth','instant','auto']}},required:['selector']},
  clickElement:{type:'object',properties:{selector:{type:'string'}},required:['selector']},
  setInputValue:{type:'object',properties:{selector:{type:'string'},value:{type:'string'}},required:['selector','value']},
  scanUI:{type:'object',properties:{}}
 };
 try{defs[0].split('|').forEach(function(k){_ctx.registerTool(k,schemas[k],function(a){return JSON.stringify(exec(k,a))})})}catch(e){}
}
w.__p31MCPTools=tools;w.__p31MCPExec=exec;
if(d.documentElement.hasAttribute('data-mcp-bridge')){d.readyState==='loading'?d.addEventListener('DOMContentLoaded',scanUI):scanUI()}
})();
