var YM=Object.create;var mc=Object.defineProperty;var ZM=Object.getOwnPropertyDescriptor;var JM=Object.getOwnPropertyNames;var KM=Object.getPrototypeOf,jM=Object.prototype.hasOwnProperty;var QM=(t,e,n)=>e in t?mc(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var dv=(t,e,n)=>()=>{if(n)throw n[0];try{return t&&(e=t(t=0)),e}catch(i){throw n=[i],i}};var Ki=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(n){throw e=0,n}},ew=(t,e)=>{for(var n in e)mc(t,n,{get:e[n],enumerable:!0})},tw=(t,e,n,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of JM(e))!jM.call(t,r)&&r!==n&&mc(t,r,{get:()=>e[r],enumerable:!(i=ZM(e,r))||i.enumerable});return t};var Ce=(t,e,n)=>(n=t!=null?YM(KM(t)):{},tw(e||!t||!t.__esModule?mc(n,"default",{value:t,enumerable:!0}):n,t));var fv=(t,e,n)=>QM(t,typeof e!="symbol"?e+"":e,n);var wv=Ki(Ke=>{"use strict";var wa=Symbol.for("react.element"),nw=Symbol.for("react.portal"),iw=Symbol.for("react.fragment"),rw=Symbol.for("react.strict_mode"),sw=Symbol.for("react.profiler"),ow=Symbol.for("react.provider"),aw=Symbol.for("react.context"),lw=Symbol.for("react.forward_ref"),cw=Symbol.for("react.suspense"),uw=Symbol.for("react.memo"),dw=Symbol.for("react.lazy"),hv=Symbol.iterator;function fw(t){return t===null||typeof t!="object"?null:(t=hv&&t[hv]||t["@@iterator"],typeof t=="function"?t:null)}var gv={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},vv=Object.assign,xv={};function ro(t,e,n){this.props=t,this.context=e,this.refs=xv,this.updater=n||gv}ro.prototype.isReactComponent={};ro.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};ro.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function yv(){}yv.prototype=ro.prototype;function fh(t,e,n){this.props=t,this.context=e,this.refs=xv,this.updater=n||gv}var hh=fh.prototype=new yv;hh.constructor=fh;vv(hh,ro.prototype);hh.isPureReactComponent=!0;var pv=Array.isArray,_v=Object.prototype.hasOwnProperty,ph={current:null},bv={key:!0,ref:!0,__self:!0,__source:!0};function Sv(t,e,n){var i,r={},s=null,o=null;if(e!=null)for(i in e.ref!==void 0&&(o=e.ref),e.key!==void 0&&(s=""+e.key),e)_v.call(e,i)&&!bv.hasOwnProperty(i)&&(r[i]=e[i]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var l=Array(a),c=0;c<a;c++)l[c]=arguments[c+2];r.children=l}if(t&&t.defaultProps)for(i in a=t.defaultProps,a)r[i]===void 0&&(r[i]=a[i]);return{$$typeof:wa,type:t,key:s,ref:o,props:r,_owner:ph.current}}function hw(t,e){return{$$typeof:wa,type:t.type,key:e,ref:t.ref,props:t.props,_owner:t._owner}}function mh(t){return typeof t=="object"&&t!==null&&t.$$typeof===wa}function pw(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(n){return e[n]})}var mv=/\/+/g;function dh(t,e){return typeof t=="object"&&t!==null&&t.key!=null?pw(""+t.key):e.toString(36)}function vc(t,e,n,i,r){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var o=!1;if(t===null)o=!0;else switch(s){case"string":case"number":o=!0;break;case"object":switch(t.$$typeof){case wa:case nw:o=!0}}if(o)return o=t,r=r(o),t=i===""?"."+dh(o,0):i,pv(r)?(n="",t!=null&&(n=t.replace(mv,"$&/")+"/"),vc(r,e,n,"",function(c){return c})):r!=null&&(mh(r)&&(r=hw(r,n+(!r.key||o&&o.key===r.key?"":(""+r.key).replace(mv,"$&/")+"/")+t)),e.push(r)),1;if(o=0,i=i===""?".":i+":",pv(t))for(var a=0;a<t.length;a++){s=t[a];var l=i+dh(s,a);o+=vc(s,e,n,l,r)}else if(l=fw(t),typeof l=="function")for(t=l.call(t),a=0;!(s=t.next()).done;)s=s.value,l=i+dh(s,a++),o+=vc(s,e,n,l,r);else if(s==="object")throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.");return o}function gc(t,e,n){if(t==null)return t;var i=[],r=0;return vc(t,i,"","",function(s){return e.call(n,s,r++)}),i}function mw(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(n){(t._status===0||t._status===-1)&&(t._status=1,t._result=n)},function(n){(t._status===0||t._status===-1)&&(t._status=2,t._result=n)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var _n={current:null},xc={transition:null},gw={ReactCurrentDispatcher:_n,ReactCurrentBatchConfig:xc,ReactCurrentOwner:ph};function Mv(){throw Error("act(...) is not supported in production builds of React.")}Ke.Children={map:gc,forEach:function(t,e,n){gc(t,function(){e.apply(this,arguments)},n)},count:function(t){var e=0;return gc(t,function(){e++}),e},toArray:function(t){return gc(t,function(e){return e})||[]},only:function(t){if(!mh(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};Ke.Component=ro;Ke.Fragment=iw;Ke.Profiler=sw;Ke.PureComponent=fh;Ke.StrictMode=rw;Ke.Suspense=cw;Ke.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=gw;Ke.act=Mv;Ke.cloneElement=function(t,e,n){if(t==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+t+".");var i=vv({},t.props),r=t.key,s=t.ref,o=t._owner;if(e!=null){if(e.ref!==void 0&&(s=e.ref,o=ph.current),e.key!==void 0&&(r=""+e.key),t.type&&t.type.defaultProps)var a=t.type.defaultProps;for(l in e)_v.call(e,l)&&!bv.hasOwnProperty(l)&&(i[l]=e[l]===void 0&&a!==void 0?a[l]:e[l])}var l=arguments.length-2;if(l===1)i.children=n;else if(1<l){a=Array(l);for(var c=0;c<l;c++)a[c]=arguments[c+2];i.children=a}return{$$typeof:wa,type:t.type,key:r,ref:s,props:i,_owner:o}};Ke.createContext=function(t){return t={$$typeof:aw,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},t.Provider={$$typeof:ow,_context:t},t.Consumer=t};Ke.createElement=Sv;Ke.createFactory=function(t){var e=Sv.bind(null,t);return e.type=t,e};Ke.createRef=function(){return{current:null}};Ke.forwardRef=function(t){return{$$typeof:lw,render:t}};Ke.isValidElement=mh;Ke.lazy=function(t){return{$$typeof:dw,_payload:{_status:-1,_result:t},_init:mw}};Ke.memo=function(t,e){return{$$typeof:uw,type:t,compare:e===void 0?null:e}};Ke.startTransition=function(t){var e=xc.transition;xc.transition={};try{t()}finally{xc.transition=e}};Ke.unstable_act=Mv;Ke.useCallback=function(t,e){return _n.current.useCallback(t,e)};Ke.useContext=function(t){return _n.current.useContext(t)};Ke.useDebugValue=function(){};Ke.useDeferredValue=function(t){return _n.current.useDeferredValue(t)};Ke.useEffect=function(t,e){return _n.current.useEffect(t,e)};Ke.useId=function(){return _n.current.useId()};Ke.useImperativeHandle=function(t,e,n){return _n.current.useImperativeHandle(t,e,n)};Ke.useInsertionEffect=function(t,e){return _n.current.useInsertionEffect(t,e)};Ke.useLayoutEffect=function(t,e){return _n.current.useLayoutEffect(t,e)};Ke.useMemo=function(t,e){return _n.current.useMemo(t,e)};Ke.useReducer=function(t,e,n){return _n.current.useReducer(t,e,n)};Ke.useRef=function(t){return _n.current.useRef(t)};Ke.useState=function(t){return _n.current.useState(t)};Ke.useSyncExternalStore=function(t,e,n){return _n.current.useSyncExternalStore(t,e,n)};Ke.useTransition=function(){return _n.current.useTransition()};Ke.version="18.3.1"});var pi=Ki((Bk,Ev)=>{"use strict";Ev.exports=wv()});var Dv=Ki(vt=>{"use strict";function yh(t,e){var n=t.length;t.push(e);e:for(;0<n;){var i=n-1>>>1,r=t[i];if(0<yc(r,e))t[i]=e,t[n]=r,n=i;else break e}}function mi(t){return t.length===0?null:t[0]}function bc(t){if(t.length===0)return null;var e=t[0],n=t.pop();if(n!==e){t[0]=n;e:for(var i=0,r=t.length,s=r>>>1;i<s;){var o=2*(i+1)-1,a=t[o],l=o+1,c=t[l];if(0>yc(a,n))l<r&&0>yc(c,a)?(t[i]=c,t[l]=n,i=l):(t[i]=a,t[o]=n,i=o);else if(l<r&&0>yc(c,n))t[i]=c,t[l]=n,i=l;else break e}}return e}function yc(t,e){var n=t.sortIndex-e.sortIndex;return n!==0?n:t.id-e.id}typeof performance=="object"&&typeof performance.now=="function"?(Tv=performance,vt.unstable_now=function(){return Tv.now()}):(gh=Date,Av=gh.now(),vt.unstable_now=function(){return gh.now()-Av});var Tv,gh,Av,Pi=[],wr=[],vw=1,jn=null,an=3,Sc=!1,ys=!1,Ta=!1,Pv=typeof setTimeout=="function"?setTimeout:null,Iv=typeof clearTimeout=="function"?clearTimeout:null,Cv=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function _h(t){for(var e=mi(wr);e!==null;){if(e.callback===null)bc(wr);else if(e.startTime<=t)bc(wr),e.sortIndex=e.expirationTime,yh(Pi,e);else break;e=mi(wr)}}function bh(t){if(Ta=!1,_h(t),!ys)if(mi(Pi)!==null)ys=!0,Mh(Sh);else{var e=mi(wr);e!==null&&wh(bh,e.startTime-t)}}function Sh(t,e){ys=!1,Ta&&(Ta=!1,Iv(Aa),Aa=-1),Sc=!0;var n=an;try{for(_h(e),jn=mi(Pi);jn!==null&&(!(jn.expirationTime>e)||t&&!Nv());){var i=jn.callback;if(typeof i=="function"){jn.callback=null,an=jn.priorityLevel;var r=i(jn.expirationTime<=e);e=vt.unstable_now(),typeof r=="function"?jn.callback=r:jn===mi(Pi)&&bc(Pi),_h(e)}else bc(Pi);jn=mi(Pi)}if(jn!==null)var s=!0;else{var o=mi(wr);o!==null&&wh(bh,o.startTime-e),s=!1}return s}finally{jn=null,an=n,Sc=!1}}var Mc=!1,_c=null,Aa=-1,kv=5,Lv=-1;function Nv(){return!(vt.unstable_now()-Lv<kv)}function vh(){if(_c!==null){var t=vt.unstable_now();Lv=t;var e=!0;try{e=_c(!0,t)}finally{e?Ea():(Mc=!1,_c=null)}}else Mc=!1}var Ea;typeof Cv=="function"?Ea=function(){Cv(vh)}:typeof MessageChannel<"u"?(xh=new MessageChannel,Rv=xh.port2,xh.port1.onmessage=vh,Ea=function(){Rv.postMessage(null)}):Ea=function(){Pv(vh,0)};var xh,Rv;function Mh(t){_c=t,Mc||(Mc=!0,Ea())}function wh(t,e){Aa=Pv(function(){t(vt.unstable_now())},e)}vt.unstable_IdlePriority=5;vt.unstable_ImmediatePriority=1;vt.unstable_LowPriority=4;vt.unstable_NormalPriority=3;vt.unstable_Profiling=null;vt.unstable_UserBlockingPriority=2;vt.unstable_cancelCallback=function(t){t.callback=null};vt.unstable_continueExecution=function(){ys||Sc||(ys=!0,Mh(Sh))};vt.unstable_forceFrameRate=function(t){0>t||125<t?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):kv=0<t?Math.floor(1e3/t):5};vt.unstable_getCurrentPriorityLevel=function(){return an};vt.unstable_getFirstCallbackNode=function(){return mi(Pi)};vt.unstable_next=function(t){switch(an){case 1:case 2:case 3:var e=3;break;default:e=an}var n=an;an=e;try{return t()}finally{an=n}};vt.unstable_pauseExecution=function(){};vt.unstable_requestPaint=function(){};vt.unstable_runWithPriority=function(t,e){switch(t){case 1:case 2:case 3:case 4:case 5:break;default:t=3}var n=an;an=t;try{return e()}finally{an=n}};vt.unstable_scheduleCallback=function(t,e,n){var i=vt.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?i+n:i):n=i,t){case 1:var r=-1;break;case 2:r=250;break;case 5:r=1073741823;break;case 4:r=1e4;break;default:r=5e3}return r=n+r,t={id:vw++,callback:e,priorityLevel:t,startTime:n,expirationTime:r,sortIndex:-1},n>i?(t.sortIndex=n,yh(wr,t),mi(Pi)===null&&t===mi(wr)&&(Ta?(Iv(Aa),Aa=-1):Ta=!0,wh(bh,n-i))):(t.sortIndex=r,yh(Pi,t),ys||Sc||(ys=!0,Mh(Sh))),t};vt.unstable_shouldYield=Nv;vt.unstable_wrapCallback=function(t){var e=an;return function(){var n=an;an=e;try{return t.apply(this,arguments)}finally{an=n}}}});var Fv=Ki((Vk,Uv)=>{"use strict";Uv.exports=Dv()});var Hy=Ki(Gn=>{"use strict";var xw=pi(),Hn=Fv();function ne(t){for(var e="https://reactjs.org/docs/error-decoder.html?invariant="+t,n=1;n<arguments.length;n++)e+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Wx=new Set,Za={};function ks(t,e){To(t,e),To(t+"Capture",e)}function To(t,e){for(Za[t]=e,t=0;t<e.length;t++)Wx.add(e[t])}var ir=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),$h=Object.prototype.hasOwnProperty,yw=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Ov={},zv={};function _w(t){return $h.call(zv,t)?!0:$h.call(Ov,t)?!1:yw.test(t)?zv[t]=!0:(Ov[t]=!0,!1)}function bw(t,e,n,i){if(n!==null&&n.type===0)return!1;switch(typeof e){case"function":case"symbol":return!0;case"boolean":return i?!1:n!==null?!n.acceptsBooleans:(t=t.toLowerCase().slice(0,5),t!=="data-"&&t!=="aria-");default:return!1}}function Sw(t,e,n,i){if(e===null||typeof e>"u"||bw(t,e,n,i))return!0;if(i)return!1;if(n!==null)switch(n.type){case 3:return!e;case 4:return e===!1;case 5:return isNaN(e);case 6:return isNaN(e)||1>e}return!1}function Mn(t,e,n,i,r,s,o){this.acceptsBooleans=e===2||e===3||e===4,this.attributeName=i,this.attributeNamespace=r,this.mustUseProperty=n,this.propertyName=t,this.type=e,this.sanitizeURL=s,this.removeEmptyString=o}var sn={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(t){sn[t]=new Mn(t,0,!1,t,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(t){var e=t[0];sn[e]=new Mn(e,1,!1,t[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(t){sn[t]=new Mn(t,2,!1,t.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(t){sn[t]=new Mn(t,2,!1,t,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(t){sn[t]=new Mn(t,3,!1,t.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(t){sn[t]=new Mn(t,3,!0,t,null,!1,!1)});["capture","download"].forEach(function(t){sn[t]=new Mn(t,4,!1,t,null,!1,!1)});["cols","rows","size","span"].forEach(function(t){sn[t]=new Mn(t,6,!1,t,null,!1,!1)});["rowSpan","start"].forEach(function(t){sn[t]=new Mn(t,5,!1,t.toLowerCase(),null,!1,!1)});var zp=/[\-:]([a-z])/g;function Bp(t){return t[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(t){var e=t.replace(zp,Bp);sn[e]=new Mn(e,1,!1,t,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(t){var e=t.replace(zp,Bp);sn[e]=new Mn(e,1,!1,t,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(t){var e=t.replace(zp,Bp);sn[e]=new Mn(e,1,!1,t,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(t){sn[t]=new Mn(t,1,!1,t.toLowerCase(),null,!1,!1)});sn.xlinkHref=new Mn("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(t){sn[t]=new Mn(t,1,!1,t.toLowerCase(),null,!0,!0)});function Hp(t,e,n,i){var r=sn.hasOwnProperty(e)?sn[e]:null;(r!==null?r.type!==0:i||!(2<e.length)||e[0]!=="o"&&e[0]!=="O"||e[1]!=="n"&&e[1]!=="N")&&(Sw(e,n,r,i)&&(n=null),i||r===null?_w(e)&&(n===null?t.removeAttribute(e):t.setAttribute(e,""+n)):r.mustUseProperty?t[r.propertyName]=n===null?r.type===3?!1:"":n:(e=r.attributeName,i=r.attributeNamespace,n===null?t.removeAttribute(e):(r=r.type,n=r===3||r===4&&n===!0?"":""+n,i?t.setAttributeNS(i,e,n):t.setAttribute(e,n))))}var ar=xw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,wc=Symbol.for("react.element"),ao=Symbol.for("react.portal"),lo=Symbol.for("react.fragment"),Vp=Symbol.for("react.strict_mode"),Yh=Symbol.for("react.profiler"),Xx=Symbol.for("react.provider"),qx=Symbol.for("react.context"),Gp=Symbol.for("react.forward_ref"),Zh=Symbol.for("react.suspense"),Jh=Symbol.for("react.suspense_list"),Wp=Symbol.for("react.memo"),Tr=Symbol.for("react.lazy"),$x=Symbol.for("react.offscreen"),Bv=Symbol.iterator;function Ca(t){return t===null||typeof t!="object"?null:(t=Bv&&t[Bv]||t["@@iterator"],typeof t=="function"?t:null)}var kt=Object.assign,Eh;function Ua(t){if(Eh===void 0)try{throw Error()}catch(n){var e=n.stack.trim().match(/\n( *(at )?)/);Eh=e&&e[1]||""}return`
`+Eh+t}var Th=!1;function Ah(t,e){if(!t||Th)return"";Th=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(e)if(e=function(){throw Error()},Object.defineProperty(e.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(e,[])}catch(c){var i=c}Reflect.construct(t,[],e)}else{try{e.call()}catch(c){i=c}t.call(e.prototype)}else{try{throw Error()}catch(c){i=c}t()}}catch(c){if(c&&i&&typeof c.stack=="string"){for(var r=c.stack.split(`
`),s=i.stack.split(`
`),o=r.length-1,a=s.length-1;1<=o&&0<=a&&r[o]!==s[a];)a--;for(;1<=o&&0<=a;o--,a--)if(r[o]!==s[a]){if(o!==1||a!==1)do if(o--,a--,0>a||r[o]!==s[a]){var l=`
`+r[o].replace(" at new "," at ");return t.displayName&&l.includes("<anonymous>")&&(l=l.replace("<anonymous>",t.displayName)),l}while(1<=o&&0<=a);break}}}finally{Th=!1,Error.prepareStackTrace=n}return(t=t?t.displayName||t.name:"")?Ua(t):""}function Mw(t){switch(t.tag){case 5:return Ua(t.type);case 16:return Ua("Lazy");case 13:return Ua("Suspense");case 19:return Ua("SuspenseList");case 0:case 2:case 15:return t=Ah(t.type,!1),t;case 11:return t=Ah(t.type.render,!1),t;case 1:return t=Ah(t.type,!0),t;default:return""}}function Kh(t){if(t==null)return null;if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case lo:return"Fragment";case ao:return"Portal";case Yh:return"Profiler";case Vp:return"StrictMode";case Zh:return"Suspense";case Jh:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case qx:return(t.displayName||"Context")+".Consumer";case Xx:return(t._context.displayName||"Context")+".Provider";case Gp:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case Wp:return e=t.displayName||null,e!==null?e:Kh(t.type)||"Memo";case Tr:e=t._payload,t=t._init;try{return Kh(t(e))}catch{}}return null}function ww(t){var e=t.type;switch(t.tag){case 24:return"Cache";case 9:return(e.displayName||"Context")+".Consumer";case 10:return(e._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return t=e.render,t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case 7:return"Fragment";case 5:return e;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Kh(e);case 8:return e===Vp?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e}return null}function Br(t){switch(typeof t){case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function Yx(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function Ew(t){var e=Yx(t)?"checked":"value",n=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),i=""+t[e];if(!t.hasOwnProperty(e)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var r=n.get,s=n.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return r.call(this)},set:function(o){i=""+o,s.call(this,o)}}),Object.defineProperty(t,e,{enumerable:n.enumerable}),{getValue:function(){return i},setValue:function(o){i=""+o},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function Ec(t){t._valueTracker||(t._valueTracker=Ew(t))}function Zx(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var n=e.getValue(),i="";return t&&(i=Yx(t)?t.checked?"true":"false":t.value),t=i,t!==n?(e.setValue(t),!0):!1}function Qc(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function jh(t,e){var n=e.checked;return kt({},e,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??t._wrapperState.initialChecked})}function Hv(t,e){var n=e.defaultValue==null?"":e.defaultValue,i=e.checked!=null?e.checked:e.defaultChecked;n=Br(e.value!=null?e.value:n),t._wrapperState={initialChecked:i,initialValue:n,controlled:e.type==="checkbox"||e.type==="radio"?e.checked!=null:e.value!=null}}function Jx(t,e){e=e.checked,e!=null&&Hp(t,"checked",e,!1)}function Qh(t,e){Jx(t,e);var n=Br(e.value),i=e.type;if(n!=null)i==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+n):t.value!==""+n&&(t.value=""+n);else if(i==="submit"||i==="reset"){t.removeAttribute("value");return}e.hasOwnProperty("value")?ep(t,e.type,n):e.hasOwnProperty("defaultValue")&&ep(t,e.type,Br(e.defaultValue)),e.checked==null&&e.defaultChecked!=null&&(t.defaultChecked=!!e.defaultChecked)}function Vv(t,e,n){if(e.hasOwnProperty("value")||e.hasOwnProperty("defaultValue")){var i=e.type;if(!(i!=="submit"&&i!=="reset"||e.value!==void 0&&e.value!==null))return;e=""+t._wrapperState.initialValue,n||e===t.value||(t.value=e),t.defaultValue=e}n=t.name,n!==""&&(t.name=""),t.defaultChecked=!!t._wrapperState.initialChecked,n!==""&&(t.name=n)}function ep(t,e,n){(e!=="number"||Qc(t.ownerDocument)!==t)&&(n==null?t.defaultValue=""+t._wrapperState.initialValue:t.defaultValue!==""+n&&(t.defaultValue=""+n))}var Fa=Array.isArray;function _o(t,e,n,i){if(t=t.options,e){e={};for(var r=0;r<n.length;r++)e["$"+n[r]]=!0;for(n=0;n<t.length;n++)r=e.hasOwnProperty("$"+t[n].value),t[n].selected!==r&&(t[n].selected=r),r&&i&&(t[n].defaultSelected=!0)}else{for(n=""+Br(n),e=null,r=0;r<t.length;r++){if(t[r].value===n){t[r].selected=!0,i&&(t[r].defaultSelected=!0);return}e!==null||t[r].disabled||(e=t[r])}e!==null&&(e.selected=!0)}}function tp(t,e){if(e.dangerouslySetInnerHTML!=null)throw Error(ne(91));return kt({},e,{value:void 0,defaultValue:void 0,children:""+t._wrapperState.initialValue})}function Gv(t,e){var n=e.value;if(n==null){if(n=e.children,e=e.defaultValue,n!=null){if(e!=null)throw Error(ne(92));if(Fa(n)){if(1<n.length)throw Error(ne(93));n=n[0]}e=n}e==null&&(e=""),n=e}t._wrapperState={initialValue:Br(n)}}function Kx(t,e){var n=Br(e.value),i=Br(e.defaultValue);n!=null&&(n=""+n,n!==t.value&&(t.value=n),e.defaultValue==null&&t.defaultValue!==n&&(t.defaultValue=n)),i!=null&&(t.defaultValue=""+i)}function Wv(t){var e=t.textContent;e===t._wrapperState.initialValue&&e!==""&&e!==null&&(t.value=e)}function jx(t){switch(t){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function np(t,e){return t==null||t==="http://www.w3.org/1999/xhtml"?jx(e):t==="http://www.w3.org/2000/svg"&&e==="foreignObject"?"http://www.w3.org/1999/xhtml":t}var Tc,Qx=(function(t){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(e,n,i,r){MSApp.execUnsafeLocalFunction(function(){return t(e,n,i,r)})}:t})(function(t,e){if(t.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in t)t.innerHTML=e;else{for(Tc=Tc||document.createElement("div"),Tc.innerHTML="<svg>"+e.valueOf().toString()+"</svg>",e=Tc.firstChild;t.firstChild;)t.removeChild(t.firstChild);for(;e.firstChild;)t.appendChild(e.firstChild)}});function Ja(t,e){if(e){var n=t.firstChild;if(n&&n===t.lastChild&&n.nodeType===3){n.nodeValue=e;return}}t.textContent=e}var Ba={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Tw=["Webkit","ms","Moz","O"];Object.keys(Ba).forEach(function(t){Tw.forEach(function(e){e=e+t.charAt(0).toUpperCase()+t.substring(1),Ba[e]=Ba[t]})});function e1(t,e,n){return e==null||typeof e=="boolean"||e===""?"":n||typeof e!="number"||e===0||Ba.hasOwnProperty(t)&&Ba[t]?(""+e).trim():e+"px"}function t1(t,e){t=t.style;for(var n in e)if(e.hasOwnProperty(n)){var i=n.indexOf("--")===0,r=e1(n,e[n],i);n==="float"&&(n="cssFloat"),i?t.setProperty(n,r):t[n]=r}}var Aw=kt({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function ip(t,e){if(e){if(Aw[t]&&(e.children!=null||e.dangerouslySetInnerHTML!=null))throw Error(ne(137,t));if(e.dangerouslySetInnerHTML!=null){if(e.children!=null)throw Error(ne(60));if(typeof e.dangerouslySetInnerHTML!="object"||!("__html"in e.dangerouslySetInnerHTML))throw Error(ne(61))}if(e.style!=null&&typeof e.style!="object")throw Error(ne(62))}}function rp(t,e){if(t.indexOf("-")===-1)return typeof e.is=="string";switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var sp=null;function Xp(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var op=null,bo=null,So=null;function Xv(t){if(t=pl(t)){if(typeof op!="function")throw Error(ne(280));var e=t.stateNode;e&&(e=Au(e),op(t.stateNode,t.type,e))}}function n1(t){bo?So?So.push(t):So=[t]:bo=t}function i1(){if(bo){var t=bo,e=So;if(So=bo=null,Xv(t),e)for(t=0;t<e.length;t++)Xv(e[t])}}function r1(t,e){return t(e)}function s1(){}var Ch=!1;function o1(t,e,n){if(Ch)return t(e,n);Ch=!0;try{return r1(t,e,n)}finally{Ch=!1,(bo!==null||So!==null)&&(s1(),i1())}}function Ka(t,e){var n=t.stateNode;if(n===null)return null;var i=Au(n);if(i===null)return null;n=i[e];e:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(t=t.type,i=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!i;break e;default:t=!1}if(t)return null;if(n&&typeof n!="function")throw Error(ne(231,e,typeof n));return n}var ap=!1;if(ir)try{so={},Object.defineProperty(so,"passive",{get:function(){ap=!0}}),window.addEventListener("test",so,so),window.removeEventListener("test",so,so)}catch{ap=!1}var so;function Cw(t,e,n,i,r,s,o,a,l){var c=Array.prototype.slice.call(arguments,3);try{e.apply(n,c)}catch(d){this.onError(d)}}var Ha=!1,eu=null,tu=!1,lp=null,Rw={onError:function(t){Ha=!0,eu=t}};function Pw(t,e,n,i,r,s,o,a,l){Ha=!1,eu=null,Cw.apply(Rw,arguments)}function Iw(t,e,n,i,r,s,o,a,l){if(Pw.apply(this,arguments),Ha){if(Ha){var c=eu;Ha=!1,eu=null}else throw Error(ne(198));tu||(tu=!0,lp=c)}}function Ls(t){var e=t,n=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,(e.flags&4098)!==0&&(n=e.return),t=e.return;while(t)}return e.tag===3?n:null}function a1(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function qv(t){if(Ls(t)!==t)throw Error(ne(188))}function kw(t){var e=t.alternate;if(!e){if(e=Ls(t),e===null)throw Error(ne(188));return e!==t?null:t}for(var n=t,i=e;;){var r=n.return;if(r===null)break;var s=r.alternate;if(s===null){if(i=r.return,i!==null){n=i;continue}break}if(r.child===s.child){for(s=r.child;s;){if(s===n)return qv(r),t;if(s===i)return qv(r),e;s=s.sibling}throw Error(ne(188))}if(n.return!==i.return)n=r,i=s;else{for(var o=!1,a=r.child;a;){if(a===n){o=!0,n=r,i=s;break}if(a===i){o=!0,i=r,n=s;break}a=a.sibling}if(!o){for(a=s.child;a;){if(a===n){o=!0,n=s,i=r;break}if(a===i){o=!0,i=s,n=r;break}a=a.sibling}if(!o)throw Error(ne(189))}}if(n.alternate!==i)throw Error(ne(190))}if(n.tag!==3)throw Error(ne(188));return n.stateNode.current===n?t:e}function l1(t){return t=kw(t),t!==null?c1(t):null}function c1(t){if(t.tag===5||t.tag===6)return t;for(t=t.child;t!==null;){var e=c1(t);if(e!==null)return e;t=t.sibling}return null}var u1=Hn.unstable_scheduleCallback,$v=Hn.unstable_cancelCallback,Lw=Hn.unstable_shouldYield,Nw=Hn.unstable_requestPaint,zt=Hn.unstable_now,Dw=Hn.unstable_getCurrentPriorityLevel,qp=Hn.unstable_ImmediatePriority,d1=Hn.unstable_UserBlockingPriority,nu=Hn.unstable_NormalPriority,Uw=Hn.unstable_LowPriority,f1=Hn.unstable_IdlePriority,Mu=null,Ni=null;function Fw(t){if(Ni&&typeof Ni.onCommitFiberRoot=="function")try{Ni.onCommitFiberRoot(Mu,t,void 0,(t.current.flags&128)===128)}catch{}}var _i=Math.clz32?Math.clz32:Bw,Ow=Math.log,zw=Math.LN2;function Bw(t){return t>>>=0,t===0?32:31-(Ow(t)/zw|0)|0}var Ac=64,Cc=4194304;function Oa(t){switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return t&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return t}}function iu(t,e){var n=t.pendingLanes;if(n===0)return 0;var i=0,r=t.suspendedLanes,s=t.pingedLanes,o=n&268435455;if(o!==0){var a=o&~r;a!==0?i=Oa(a):(s&=o,s!==0&&(i=Oa(s)))}else o=n&~r,o!==0?i=Oa(o):s!==0&&(i=Oa(s));if(i===0)return 0;if(e!==0&&e!==i&&(e&r)===0&&(r=i&-i,s=e&-e,r>=s||r===16&&(s&4194240)!==0))return e;if((i&4)!==0&&(i|=n&16),e=t.entangledLanes,e!==0)for(t=t.entanglements,e&=i;0<e;)n=31-_i(e),r=1<<n,i|=t[n],e&=~r;return i}function Hw(t,e){switch(t){case 1:case 2:case 4:return e+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Vw(t,e){for(var n=t.suspendedLanes,i=t.pingedLanes,r=t.expirationTimes,s=t.pendingLanes;0<s;){var o=31-_i(s),a=1<<o,l=r[o];l===-1?((a&n)===0||(a&i)!==0)&&(r[o]=Hw(a,e)):l<=e&&(t.expiredLanes|=a),s&=~a}}function cp(t){return t=t.pendingLanes&-1073741825,t!==0?t:t&1073741824?1073741824:0}function h1(){var t=Ac;return Ac<<=1,(Ac&4194240)===0&&(Ac=64),t}function Rh(t){for(var e=[],n=0;31>n;n++)e.push(t);return e}function fl(t,e,n){t.pendingLanes|=e,e!==536870912&&(t.suspendedLanes=0,t.pingedLanes=0),t=t.eventTimes,e=31-_i(e),t[e]=n}function Gw(t,e){var n=t.pendingLanes&~e;t.pendingLanes=e,t.suspendedLanes=0,t.pingedLanes=0,t.expiredLanes&=e,t.mutableReadLanes&=e,t.entangledLanes&=e,e=t.entanglements;var i=t.eventTimes;for(t=t.expirationTimes;0<n;){var r=31-_i(n),s=1<<r;e[r]=0,i[r]=-1,t[r]=-1,n&=~s}}function $p(t,e){var n=t.entangledLanes|=e;for(t=t.entanglements;n;){var i=31-_i(n),r=1<<i;r&e|t[i]&e&&(t[i]|=e),n&=~r}}var dt=0;function p1(t){return t&=-t,1<t?4<t?(t&268435455)!==0?16:536870912:4:1}var m1,Yp,g1,v1,x1,up=!1,Rc=[],kr=null,Lr=null,Nr=null,ja=new Map,Qa=new Map,Cr=[],Ww="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Yv(t,e){switch(t){case"focusin":case"focusout":kr=null;break;case"dragenter":case"dragleave":Lr=null;break;case"mouseover":case"mouseout":Nr=null;break;case"pointerover":case"pointerout":ja.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":Qa.delete(e.pointerId)}}function Ra(t,e,n,i,r,s){return t===null||t.nativeEvent!==s?(t={blockedOn:e,domEventName:n,eventSystemFlags:i,nativeEvent:s,targetContainers:[r]},e!==null&&(e=pl(e),e!==null&&Yp(e)),t):(t.eventSystemFlags|=i,e=t.targetContainers,r!==null&&e.indexOf(r)===-1&&e.push(r),t)}function Xw(t,e,n,i,r){switch(e){case"focusin":return kr=Ra(kr,t,e,n,i,r),!0;case"dragenter":return Lr=Ra(Lr,t,e,n,i,r),!0;case"mouseover":return Nr=Ra(Nr,t,e,n,i,r),!0;case"pointerover":var s=r.pointerId;return ja.set(s,Ra(ja.get(s)||null,t,e,n,i,r)),!0;case"gotpointercapture":return s=r.pointerId,Qa.set(s,Ra(Qa.get(s)||null,t,e,n,i,r)),!0}return!1}function y1(t){var e=Ss(t.target);if(e!==null){var n=Ls(e);if(n!==null){if(e=n.tag,e===13){if(e=a1(n),e!==null){t.blockedOn=e,x1(t.priority,function(){g1(n)});return}}else if(e===3&&n.stateNode.current.memoizedState.isDehydrated){t.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}t.blockedOn=null}function Gc(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var n=dp(t.domEventName,t.eventSystemFlags,e[0],t.nativeEvent);if(n===null){n=t.nativeEvent;var i=new n.constructor(n.type,n);sp=i,n.target.dispatchEvent(i),sp=null}else return e=pl(n),e!==null&&Yp(e),t.blockedOn=n,!1;e.shift()}return!0}function Zv(t,e,n){Gc(t)&&n.delete(e)}function qw(){up=!1,kr!==null&&Gc(kr)&&(kr=null),Lr!==null&&Gc(Lr)&&(Lr=null),Nr!==null&&Gc(Nr)&&(Nr=null),ja.forEach(Zv),Qa.forEach(Zv)}function Pa(t,e){t.blockedOn===e&&(t.blockedOn=null,up||(up=!0,Hn.unstable_scheduleCallback(Hn.unstable_NormalPriority,qw)))}function el(t){function e(r){return Pa(r,t)}if(0<Rc.length){Pa(Rc[0],t);for(var n=1;n<Rc.length;n++){var i=Rc[n];i.blockedOn===t&&(i.blockedOn=null)}}for(kr!==null&&Pa(kr,t),Lr!==null&&Pa(Lr,t),Nr!==null&&Pa(Nr,t),ja.forEach(e),Qa.forEach(e),n=0;n<Cr.length;n++)i=Cr[n],i.blockedOn===t&&(i.blockedOn=null);for(;0<Cr.length&&(n=Cr[0],n.blockedOn===null);)y1(n),n.blockedOn===null&&Cr.shift()}var Mo=ar.ReactCurrentBatchConfig,ru=!0;function $w(t,e,n,i){var r=dt,s=Mo.transition;Mo.transition=null;try{dt=1,Zp(t,e,n,i)}finally{dt=r,Mo.transition=s}}function Yw(t,e,n,i){var r=dt,s=Mo.transition;Mo.transition=null;try{dt=4,Zp(t,e,n,i)}finally{dt=r,Mo.transition=s}}function Zp(t,e,n,i){if(ru){var r=dp(t,e,n,i);if(r===null)Uh(t,e,i,su,n),Yv(t,i);else if(Xw(r,t,e,n,i))i.stopPropagation();else if(Yv(t,i),e&4&&-1<Ww.indexOf(t)){for(;r!==null;){var s=pl(r);if(s!==null&&m1(s),s=dp(t,e,n,i),s===null&&Uh(t,e,i,su,n),s===r)break;r=s}r!==null&&i.stopPropagation()}else Uh(t,e,i,null,n)}}var su=null;function dp(t,e,n,i){if(su=null,t=Xp(i),t=Ss(t),t!==null)if(e=Ls(t),e===null)t=null;else if(n=e.tag,n===13){if(t=a1(e),t!==null)return t;t=null}else if(n===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null);return su=t,null}function _1(t){switch(t){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Dw()){case qp:return 1;case d1:return 4;case nu:case Uw:return 16;case f1:return 536870912;default:return 16}default:return 16}}var Pr=null,Jp=null,Wc=null;function b1(){if(Wc)return Wc;var t,e=Jp,n=e.length,i,r="value"in Pr?Pr.value:Pr.textContent,s=r.length;for(t=0;t<n&&e[t]===r[t];t++);var o=n-t;for(i=1;i<=o&&e[n-i]===r[s-i];i++);return Wc=r.slice(t,1<i?1-i:void 0)}function Xc(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function Pc(){return!0}function Jv(){return!1}function Vn(t){function e(n,i,r,s,o){this._reactName=n,this._targetInst=r,this.type=i,this.nativeEvent=s,this.target=o,this.currentTarget=null;for(var a in t)t.hasOwnProperty(a)&&(n=t[a],this[a]=n?n(s):s[a]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?Pc:Jv,this.isPropagationStopped=Jv,this}return kt(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=Pc)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=Pc)},persist:function(){},isPersistent:Pc}),e}var Lo={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Kp=Vn(Lo),hl=kt({},Lo,{view:0,detail:0}),Zw=Vn(hl),Ph,Ih,Ia,wu=kt({},hl,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:jp,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==Ia&&(Ia&&t.type==="mousemove"?(Ph=t.screenX-Ia.screenX,Ih=t.screenY-Ia.screenY):Ih=Ph=0,Ia=t),Ph)},movementY:function(t){return"movementY"in t?t.movementY:Ih}}),Kv=Vn(wu),Jw=kt({},wu,{dataTransfer:0}),Kw=Vn(Jw),jw=kt({},hl,{relatedTarget:0}),kh=Vn(jw),Qw=kt({},Lo,{animationName:0,elapsedTime:0,pseudoElement:0}),e3=Vn(Qw),t3=kt({},Lo,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),n3=Vn(t3),i3=kt({},Lo,{data:0}),jv=Vn(i3),r3={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},s3={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},o3={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function a3(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=o3[t])?!!e[t]:!1}function jp(){return a3}var l3=kt({},hl,{key:function(t){if(t.key){var e=r3[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=Xc(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?s3[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:jp,charCode:function(t){return t.type==="keypress"?Xc(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Xc(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),c3=Vn(l3),u3=kt({},wu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Qv=Vn(u3),d3=kt({},hl,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:jp}),f3=Vn(d3),h3=kt({},Lo,{propertyName:0,elapsedTime:0,pseudoElement:0}),p3=Vn(h3),m3=kt({},wu,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),g3=Vn(m3),v3=[9,13,27,32],Qp=ir&&"CompositionEvent"in window,Va=null;ir&&"documentMode"in document&&(Va=document.documentMode);var x3=ir&&"TextEvent"in window&&!Va,S1=ir&&(!Qp||Va&&8<Va&&11>=Va),ex=" ",tx=!1;function M1(t,e){switch(t){case"keyup":return v3.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function w1(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var co=!1;function y3(t,e){switch(t){case"compositionend":return w1(e);case"keypress":return e.which!==32?null:(tx=!0,ex);case"textInput":return t=e.data,t===ex&&tx?null:t;default:return null}}function _3(t,e){if(co)return t==="compositionend"||!Qp&&M1(t,e)?(t=b1(),Wc=Jp=Pr=null,co=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return S1&&e.locale!=="ko"?null:e.data;default:return null}}var b3={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function nx(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!b3[t.type]:e==="textarea"}function E1(t,e,n,i){n1(i),e=ou(e,"onChange"),0<e.length&&(n=new Kp("onChange","change",null,n,i),t.push({event:n,listeners:e}))}var Ga=null,tl=null;function S3(t){U1(t,0)}function Eu(t){var e=ho(t);if(Zx(e))return t}function M3(t,e){if(t==="change")return e}var T1=!1;ir&&(ir?(kc="oninput"in document,kc||(Lh=document.createElement("div"),Lh.setAttribute("oninput","return;"),kc=typeof Lh.oninput=="function"),Ic=kc):Ic=!1,T1=Ic&&(!document.documentMode||9<document.documentMode));var Ic,kc,Lh;function ix(){Ga&&(Ga.detachEvent("onpropertychange",A1),tl=Ga=null)}function A1(t){if(t.propertyName==="value"&&Eu(tl)){var e=[];E1(e,tl,t,Xp(t)),o1(S3,e)}}function w3(t,e,n){t==="focusin"?(ix(),Ga=e,tl=n,Ga.attachEvent("onpropertychange",A1)):t==="focusout"&&ix()}function E3(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Eu(tl)}function T3(t,e){if(t==="click")return Eu(e)}function A3(t,e){if(t==="input"||t==="change")return Eu(e)}function C3(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var Si=typeof Object.is=="function"?Object.is:C3;function nl(t,e){if(Si(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var n=Object.keys(t),i=Object.keys(e);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var r=n[i];if(!$h.call(e,r)||!Si(t[r],e[r]))return!1}return!0}function rx(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function sx(t,e){var n=rx(t);t=0;for(var i;n;){if(n.nodeType===3){if(i=t+n.textContent.length,t<=e&&i>=e)return{node:n,offset:e-t};t=i}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=rx(n)}}function C1(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?C1(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function R1(){for(var t=window,e=Qc();e instanceof t.HTMLIFrameElement;){try{var n=typeof e.contentWindow.location.href=="string"}catch{n=!1}if(n)t=e.contentWindow;else break;e=Qc(t.document)}return e}function em(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}function R3(t){var e=R1(),n=t.focusedElem,i=t.selectionRange;if(e!==n&&n&&n.ownerDocument&&C1(n.ownerDocument.documentElement,n)){if(i!==null&&em(n)){if(e=i.start,t=i.end,t===void 0&&(t=e),"selectionStart"in n)n.selectionStart=e,n.selectionEnd=Math.min(t,n.value.length);else if(t=(e=n.ownerDocument||document)&&e.defaultView||window,t.getSelection){t=t.getSelection();var r=n.textContent.length,s=Math.min(i.start,r);i=i.end===void 0?s:Math.min(i.end,r),!t.extend&&s>i&&(r=i,i=s,s=r),r=sx(n,s);var o=sx(n,i);r&&o&&(t.rangeCount!==1||t.anchorNode!==r.node||t.anchorOffset!==r.offset||t.focusNode!==o.node||t.focusOffset!==o.offset)&&(e=e.createRange(),e.setStart(r.node,r.offset),t.removeAllRanges(),s>i?(t.addRange(e),t.extend(o.node,o.offset)):(e.setEnd(o.node,o.offset),t.addRange(e)))}}for(e=[],t=n;t=t.parentNode;)t.nodeType===1&&e.push({element:t,left:t.scrollLeft,top:t.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<e.length;n++)t=e[n],t.element.scrollLeft=t.left,t.element.scrollTop=t.top}}var P3=ir&&"documentMode"in document&&11>=document.documentMode,uo=null,fp=null,Wa=null,hp=!1;function ox(t,e,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;hp||uo==null||uo!==Qc(i)||(i=uo,"selectionStart"in i&&em(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Wa&&nl(Wa,i)||(Wa=i,i=ou(fp,"onSelect"),0<i.length&&(e=new Kp("onSelect","select",null,e,n),t.push({event:e,listeners:i}),e.target=uo)))}function Lc(t,e){var n={};return n[t.toLowerCase()]=e.toLowerCase(),n["Webkit"+t]="webkit"+e,n["Moz"+t]="moz"+e,n}var fo={animationend:Lc("Animation","AnimationEnd"),animationiteration:Lc("Animation","AnimationIteration"),animationstart:Lc("Animation","AnimationStart"),transitionend:Lc("Transition","TransitionEnd")},Nh={},P1={};ir&&(P1=document.createElement("div").style,"AnimationEvent"in window||(delete fo.animationend.animation,delete fo.animationiteration.animation,delete fo.animationstart.animation),"TransitionEvent"in window||delete fo.transitionend.transition);function Tu(t){if(Nh[t])return Nh[t];if(!fo[t])return t;var e=fo[t],n;for(n in e)if(e.hasOwnProperty(n)&&n in P1)return Nh[t]=e[n];return t}var I1=Tu("animationend"),k1=Tu("animationiteration"),L1=Tu("animationstart"),N1=Tu("transitionend"),D1=new Map,ax="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Vr(t,e){D1.set(t,e),ks(e,[t])}for(Nc=0;Nc<ax.length;Nc++)Dc=ax[Nc],lx=Dc.toLowerCase(),cx=Dc[0].toUpperCase()+Dc.slice(1),Vr(lx,"on"+cx);var Dc,lx,cx,Nc;Vr(I1,"onAnimationEnd");Vr(k1,"onAnimationIteration");Vr(L1,"onAnimationStart");Vr("dblclick","onDoubleClick");Vr("focusin","onFocus");Vr("focusout","onBlur");Vr(N1,"onTransitionEnd");To("onMouseEnter",["mouseout","mouseover"]);To("onMouseLeave",["mouseout","mouseover"]);To("onPointerEnter",["pointerout","pointerover"]);To("onPointerLeave",["pointerout","pointerover"]);ks("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));ks("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));ks("onBeforeInput",["compositionend","keypress","textInput","paste"]);ks("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));ks("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));ks("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var za="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),I3=new Set("cancel close invalid load scroll toggle".split(" ").concat(za));function ux(t,e,n){var i=t.type||"unknown-event";t.currentTarget=n,Iw(i,e,void 0,t),t.currentTarget=null}function U1(t,e){e=(e&4)!==0;for(var n=0;n<t.length;n++){var i=t[n],r=i.event;i=i.listeners;e:{var s=void 0;if(e)for(var o=i.length-1;0<=o;o--){var a=i[o],l=a.instance,c=a.currentTarget;if(a=a.listener,l!==s&&r.isPropagationStopped())break e;ux(r,a,c),s=l}else for(o=0;o<i.length;o++){if(a=i[o],l=a.instance,c=a.currentTarget,a=a.listener,l!==s&&r.isPropagationStopped())break e;ux(r,a,c),s=l}}}if(tu)throw t=lp,tu=!1,lp=null,t}function bt(t,e){var n=e[xp];n===void 0&&(n=e[xp]=new Set);var i=t+"__bubble";n.has(i)||(F1(e,t,2,!1),n.add(i))}function Dh(t,e,n){var i=0;e&&(i|=4),F1(n,t,i,e)}var Uc="_reactListening"+Math.random().toString(36).slice(2);function il(t){if(!t[Uc]){t[Uc]=!0,Wx.forEach(function(n){n!=="selectionchange"&&(I3.has(n)||Dh(n,!1,t),Dh(n,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[Uc]||(e[Uc]=!0,Dh("selectionchange",!1,e))}}function F1(t,e,n,i){switch(_1(e)){case 1:var r=$w;break;case 4:r=Yw;break;default:r=Zp}n=r.bind(null,e,n,t),r=void 0,!ap||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(r=!0),i?r!==void 0?t.addEventListener(e,n,{capture:!0,passive:r}):t.addEventListener(e,n,!0):r!==void 0?t.addEventListener(e,n,{passive:r}):t.addEventListener(e,n,!1)}function Uh(t,e,n,i,r){var s=i;if((e&1)===0&&(e&2)===0&&i!==null)e:for(;;){if(i===null)return;var o=i.tag;if(o===3||o===4){var a=i.stateNode.containerInfo;if(a===r||a.nodeType===8&&a.parentNode===r)break;if(o===4)for(o=i.return;o!==null;){var l=o.tag;if((l===3||l===4)&&(l=o.stateNode.containerInfo,l===r||l.nodeType===8&&l.parentNode===r))return;o=o.return}for(;a!==null;){if(o=Ss(a),o===null)return;if(l=o.tag,l===5||l===6){i=s=o;continue e}a=a.parentNode}}i=i.return}o1(function(){var c=s,d=Xp(n),f=[];e:{var h=D1.get(t);if(h!==void 0){var p=Kp,v=t;switch(t){case"keypress":if(Xc(n)===0)break e;case"keydown":case"keyup":p=c3;break;case"focusin":v="focus",p=kh;break;case"focusout":v="blur",p=kh;break;case"beforeblur":case"afterblur":p=kh;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=Kv;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=Kw;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=f3;break;case I1:case k1:case L1:p=e3;break;case N1:p=p3;break;case"scroll":p=Zw;break;case"wheel":p=g3;break;case"copy":case"cut":case"paste":p=n3;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=Qv}var y=(e&4)!==0,m=!y&&t==="scroll",u=y?h!==null?h+"Capture":null:h;y=[];for(var g=c,x;g!==null;){x=g;var _=x.stateNode;if(x.tag===5&&_!==null&&(x=_,u!==null&&(_=Ka(g,u),_!=null&&y.push(rl(g,_,x)))),m)break;g=g.return}0<y.length&&(h=new p(h,v,null,n,d),f.push({event:h,listeners:y}))}}if((e&7)===0){e:{if(h=t==="mouseover"||t==="pointerover",p=t==="mouseout"||t==="pointerout",h&&n!==sp&&(v=n.relatedTarget||n.fromElement)&&(Ss(v)||v[rr]))break e;if((p||h)&&(h=d.window===d?d:(h=d.ownerDocument)?h.defaultView||h.parentWindow:window,p?(v=n.relatedTarget||n.toElement,p=c,v=v?Ss(v):null,v!==null&&(m=Ls(v),v!==m||v.tag!==5&&v.tag!==6)&&(v=null)):(p=null,v=c),p!==v)){if(y=Kv,_="onMouseLeave",u="onMouseEnter",g="mouse",(t==="pointerout"||t==="pointerover")&&(y=Qv,_="onPointerLeave",u="onPointerEnter",g="pointer"),m=p==null?h:ho(p),x=v==null?h:ho(v),h=new y(_,g+"leave",p,n,d),h.target=m,h.relatedTarget=x,_=null,Ss(d)===c&&(y=new y(u,g+"enter",v,n,d),y.target=x,y.relatedTarget=m,_=y),m=_,p&&v)t:{for(y=p,u=v,g=0,x=y;x;x=oo(x))g++;for(x=0,_=u;_;_=oo(_))x++;for(;0<g-x;)y=oo(y),g--;for(;0<x-g;)u=oo(u),x--;for(;g--;){if(y===u||u!==null&&y===u.alternate)break t;y=oo(y),u=oo(u)}y=null}else y=null;p!==null&&dx(f,h,p,y,!1),v!==null&&m!==null&&dx(f,m,v,y,!0)}}e:{if(h=c?ho(c):window,p=h.nodeName&&h.nodeName.toLowerCase(),p==="select"||p==="input"&&h.type==="file")var T=M3;else if(nx(h))if(T1)T=A3;else{T=E3;var E=w3}else(p=h.nodeName)&&p.toLowerCase()==="input"&&(h.type==="checkbox"||h.type==="radio")&&(T=T3);if(T&&(T=T(t,c))){E1(f,T,n,d);break e}E&&E(t,h,c),t==="focusout"&&(E=h._wrapperState)&&E.controlled&&h.type==="number"&&ep(h,"number",h.value)}switch(E=c?ho(c):window,t){case"focusin":(nx(E)||E.contentEditable==="true")&&(uo=E,fp=c,Wa=null);break;case"focusout":Wa=fp=uo=null;break;case"mousedown":hp=!0;break;case"contextmenu":case"mouseup":case"dragend":hp=!1,ox(f,n,d);break;case"selectionchange":if(P3)break;case"keydown":case"keyup":ox(f,n,d)}var A;if(Qp)e:{switch(t){case"compositionstart":var R="onCompositionStart";break e;case"compositionend":R="onCompositionEnd";break e;case"compositionupdate":R="onCompositionUpdate";break e}R=void 0}else co?M1(t,n)&&(R="onCompositionEnd"):t==="keydown"&&n.keyCode===229&&(R="onCompositionStart");R&&(S1&&n.locale!=="ko"&&(co||R!=="onCompositionStart"?R==="onCompositionEnd"&&co&&(A=b1()):(Pr=d,Jp="value"in Pr?Pr.value:Pr.textContent,co=!0)),E=ou(c,R),0<E.length&&(R=new jv(R,t,null,n,d),f.push({event:R,listeners:E}),A?R.data=A:(A=w1(n),A!==null&&(R.data=A)))),(A=x3?y3(t,n):_3(t,n))&&(c=ou(c,"onBeforeInput"),0<c.length&&(d=new jv("onBeforeInput","beforeinput",null,n,d),f.push({event:d,listeners:c}),d.data=A))}U1(f,e)})}function rl(t,e,n){return{instance:t,listener:e,currentTarget:n}}function ou(t,e){for(var n=e+"Capture",i=[];t!==null;){var r=t,s=r.stateNode;r.tag===5&&s!==null&&(r=s,s=Ka(t,n),s!=null&&i.unshift(rl(t,s,r)),s=Ka(t,e),s!=null&&i.push(rl(t,s,r))),t=t.return}return i}function oo(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5);return t||null}function dx(t,e,n,i,r){for(var s=e._reactName,o=[];n!==null&&n!==i;){var a=n,l=a.alternate,c=a.stateNode;if(l!==null&&l===i)break;a.tag===5&&c!==null&&(a=c,r?(l=Ka(n,s),l!=null&&o.unshift(rl(n,l,a))):r||(l=Ka(n,s),l!=null&&o.push(rl(n,l,a)))),n=n.return}o.length!==0&&t.push({event:e,listeners:o})}var k3=/\r\n?/g,L3=/\u0000|\uFFFD/g;function fx(t){return(typeof t=="string"?t:""+t).replace(k3,`
`).replace(L3,"")}function Fc(t,e,n){if(e=fx(e),fx(t)!==e&&n)throw Error(ne(425))}function au(){}var pp=null,mp=null;function gp(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var vp=typeof setTimeout=="function"?setTimeout:void 0,N3=typeof clearTimeout=="function"?clearTimeout:void 0,hx=typeof Promise=="function"?Promise:void 0,D3=typeof queueMicrotask=="function"?queueMicrotask:typeof hx<"u"?function(t){return hx.resolve(null).then(t).catch(U3)}:vp;function U3(t){setTimeout(function(){throw t})}function Fh(t,e){var n=e,i=0;do{var r=n.nextSibling;if(t.removeChild(n),r&&r.nodeType===8)if(n=r.data,n==="/$"){if(i===0){t.removeChild(r),el(e);return}i--}else n!=="$"&&n!=="$?"&&n!=="$!"||i++;n=r}while(n);el(e)}function Dr(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?")break;if(e==="/$")return null}}return t}function px(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="$"||n==="$!"||n==="$?"){if(e===0)return t;e--}else n==="/$"&&e++}t=t.previousSibling}return null}var No=Math.random().toString(36).slice(2),Li="__reactFiber$"+No,sl="__reactProps$"+No,rr="__reactContainer$"+No,xp="__reactEvents$"+No,F3="__reactListeners$"+No,O3="__reactHandles$"+No;function Ss(t){var e=t[Li];if(e)return e;for(var n=t.parentNode;n;){if(e=n[rr]||n[Li]){if(n=e.alternate,e.child!==null||n!==null&&n.child!==null)for(t=px(t);t!==null;){if(n=t[Li])return n;t=px(t)}return e}t=n,n=t.parentNode}return null}function pl(t){return t=t[Li]||t[rr],!t||t.tag!==5&&t.tag!==6&&t.tag!==13&&t.tag!==3?null:t}function ho(t){if(t.tag===5||t.tag===6)return t.stateNode;throw Error(ne(33))}function Au(t){return t[sl]||null}var yp=[],po=-1;function Gr(t){return{current:t}}function St(t){0>po||(t.current=yp[po],yp[po]=null,po--)}function xt(t,e){po++,yp[po]=t.current,t.current=e}var Hr={},dn=Gr(Hr),Rn=Gr(!1),As=Hr;function Ao(t,e){var n=t.type.contextTypes;if(!n)return Hr;var i=t.stateNode;if(i&&i.__reactInternalMemoizedUnmaskedChildContext===e)return i.__reactInternalMemoizedMaskedChildContext;var r={},s;for(s in n)r[s]=e[s];return i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=e,t.__reactInternalMemoizedMaskedChildContext=r),r}function Pn(t){return t=t.childContextTypes,t!=null}function lu(){St(Rn),St(dn)}function mx(t,e,n){if(dn.current!==Hr)throw Error(ne(168));xt(dn,e),xt(Rn,n)}function O1(t,e,n){var i=t.stateNode;if(e=e.childContextTypes,typeof i.getChildContext!="function")return n;i=i.getChildContext();for(var r in i)if(!(r in e))throw Error(ne(108,ww(t)||"Unknown",r));return kt({},n,i)}function cu(t){return t=(t=t.stateNode)&&t.__reactInternalMemoizedMergedChildContext||Hr,As=dn.current,xt(dn,t),xt(Rn,Rn.current),!0}function gx(t,e,n){var i=t.stateNode;if(!i)throw Error(ne(169));n?(t=O1(t,e,As),i.__reactInternalMemoizedMergedChildContext=t,St(Rn),St(dn),xt(dn,t)):St(Rn),xt(Rn,n)}var Qi=null,Cu=!1,Oh=!1;function z1(t){Qi===null?Qi=[t]:Qi.push(t)}function z3(t){Cu=!0,z1(t)}function Wr(){if(!Oh&&Qi!==null){Oh=!0;var t=0,e=dt;try{var n=Qi;for(dt=1;t<n.length;t++){var i=n[t];do i=i(!0);while(i!==null)}Qi=null,Cu=!1}catch(r){throw Qi!==null&&(Qi=Qi.slice(t+1)),u1(qp,Wr),r}finally{dt=e,Oh=!1}}return null}var mo=[],go=0,uu=null,du=0,Qn=[],ei=0,Cs=null,er=1,tr="";function _s(t,e){mo[go++]=du,mo[go++]=uu,uu=t,du=e}function B1(t,e,n){Qn[ei++]=er,Qn[ei++]=tr,Qn[ei++]=Cs,Cs=t;var i=er;t=tr;var r=32-_i(i)-1;i&=~(1<<r),n+=1;var s=32-_i(e)+r;if(30<s){var o=r-r%5;s=(i&(1<<o)-1).toString(32),i>>=o,r-=o,er=1<<32-_i(e)+r|n<<r|i,tr=s+t}else er=1<<s|n<<r|i,tr=t}function tm(t){t.return!==null&&(_s(t,1),B1(t,1,0))}function nm(t){for(;t===uu;)uu=mo[--go],mo[go]=null,du=mo[--go],mo[go]=null;for(;t===Cs;)Cs=Qn[--ei],Qn[ei]=null,tr=Qn[--ei],Qn[ei]=null,er=Qn[--ei],Qn[ei]=null}var Bn=null,zn=null,Tt=!1,yi=null;function H1(t,e){var n=ti(5,null,null,0);n.elementType="DELETED",n.stateNode=e,n.return=t,e=t.deletions,e===null?(t.deletions=[n],t.flags|=16):e.push(n)}function vx(t,e){switch(t.tag){case 5:var n=t.type;return e=e.nodeType!==1||n.toLowerCase()!==e.nodeName.toLowerCase()?null:e,e!==null?(t.stateNode=e,Bn=t,zn=Dr(e.firstChild),!0):!1;case 6:return e=t.pendingProps===""||e.nodeType!==3?null:e,e!==null?(t.stateNode=e,Bn=t,zn=null,!0):!1;case 13:return e=e.nodeType!==8?null:e,e!==null?(n=Cs!==null?{id:er,overflow:tr}:null,t.memoizedState={dehydrated:e,treeContext:n,retryLane:1073741824},n=ti(18,null,null,0),n.stateNode=e,n.return=t,t.child=n,Bn=t,zn=null,!0):!1;default:return!1}}function _p(t){return(t.mode&1)!==0&&(t.flags&128)===0}function bp(t){if(Tt){var e=zn;if(e){var n=e;if(!vx(t,e)){if(_p(t))throw Error(ne(418));e=Dr(n.nextSibling);var i=Bn;e&&vx(t,e)?H1(i,n):(t.flags=t.flags&-4097|2,Tt=!1,Bn=t)}}else{if(_p(t))throw Error(ne(418));t.flags=t.flags&-4097|2,Tt=!1,Bn=t}}}function xx(t){for(t=t.return;t!==null&&t.tag!==5&&t.tag!==3&&t.tag!==13;)t=t.return;Bn=t}function Oc(t){if(t!==Bn)return!1;if(!Tt)return xx(t),Tt=!0,!1;var e;if((e=t.tag!==3)&&!(e=t.tag!==5)&&(e=t.type,e=e!=="head"&&e!=="body"&&!gp(t.type,t.memoizedProps)),e&&(e=zn)){if(_p(t))throw V1(),Error(ne(418));for(;e;)H1(t,e),e=Dr(e.nextSibling)}if(xx(t),t.tag===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(ne(317));e:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="/$"){if(e===0){zn=Dr(t.nextSibling);break e}e--}else n!=="$"&&n!=="$!"&&n!=="$?"||e++}t=t.nextSibling}zn=null}}else zn=Bn?Dr(t.stateNode.nextSibling):null;return!0}function V1(){for(var t=zn;t;)t=Dr(t.nextSibling)}function Co(){zn=Bn=null,Tt=!1}function im(t){yi===null?yi=[t]:yi.push(t)}var B3=ar.ReactCurrentBatchConfig;function ka(t,e,n){if(t=n.ref,t!==null&&typeof t!="function"&&typeof t!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(ne(309));var i=n.stateNode}if(!i)throw Error(ne(147,t));var r=i,s=""+t;return e!==null&&e.ref!==null&&typeof e.ref=="function"&&e.ref._stringRef===s?e.ref:(e=function(o){var a=r.refs;o===null?delete a[s]:a[s]=o},e._stringRef=s,e)}if(typeof t!="string")throw Error(ne(284));if(!n._owner)throw Error(ne(290,t))}return t}function zc(t,e){throw t=Object.prototype.toString.call(e),Error(ne(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t))}function yx(t){var e=t._init;return e(t._payload)}function G1(t){function e(u,g){if(t){var x=u.deletions;x===null?(u.deletions=[g],u.flags|=16):x.push(g)}}function n(u,g){if(!t)return null;for(;g!==null;)e(u,g),g=g.sibling;return null}function i(u,g){for(u=new Map;g!==null;)g.key!==null?u.set(g.key,g):u.set(g.index,g),g=g.sibling;return u}function r(u,g){return u=zr(u,g),u.index=0,u.sibling=null,u}function s(u,g,x){return u.index=x,t?(x=u.alternate,x!==null?(x=x.index,x<g?(u.flags|=2,g):x):(u.flags|=2,g)):(u.flags|=1048576,g)}function o(u){return t&&u.alternate===null&&(u.flags|=2),u}function a(u,g,x,_){return g===null||g.tag!==6?(g=Xh(x,u.mode,_),g.return=u,g):(g=r(g,x),g.return=u,g)}function l(u,g,x,_){var T=x.type;return T===lo?d(u,g,x.props.children,_,x.key):g!==null&&(g.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Tr&&yx(T)===g.type)?(_=r(g,x.props),_.ref=ka(u,g,x),_.return=u,_):(_=jc(x.type,x.key,x.props,null,u.mode,_),_.ref=ka(u,g,x),_.return=u,_)}function c(u,g,x,_){return g===null||g.tag!==4||g.stateNode.containerInfo!==x.containerInfo||g.stateNode.implementation!==x.implementation?(g=qh(x,u.mode,_),g.return=u,g):(g=r(g,x.children||[]),g.return=u,g)}function d(u,g,x,_,T){return g===null||g.tag!==7?(g=Ts(x,u.mode,_,T),g.return=u,g):(g=r(g,x),g.return=u,g)}function f(u,g,x){if(typeof g=="string"&&g!==""||typeof g=="number")return g=Xh(""+g,u.mode,x),g.return=u,g;if(typeof g=="object"&&g!==null){switch(g.$$typeof){case wc:return x=jc(g.type,g.key,g.props,null,u.mode,x),x.ref=ka(u,null,g),x.return=u,x;case ao:return g=qh(g,u.mode,x),g.return=u,g;case Tr:var _=g._init;return f(u,_(g._payload),x)}if(Fa(g)||Ca(g))return g=Ts(g,u.mode,x,null),g.return=u,g;zc(u,g)}return null}function h(u,g,x,_){var T=g!==null?g.key:null;if(typeof x=="string"&&x!==""||typeof x=="number")return T!==null?null:a(u,g,""+x,_);if(typeof x=="object"&&x!==null){switch(x.$$typeof){case wc:return x.key===T?l(u,g,x,_):null;case ao:return x.key===T?c(u,g,x,_):null;case Tr:return T=x._init,h(u,g,T(x._payload),_)}if(Fa(x)||Ca(x))return T!==null?null:d(u,g,x,_,null);zc(u,x)}return null}function p(u,g,x,_,T){if(typeof _=="string"&&_!==""||typeof _=="number")return u=u.get(x)||null,a(g,u,""+_,T);if(typeof _=="object"&&_!==null){switch(_.$$typeof){case wc:return u=u.get(_.key===null?x:_.key)||null,l(g,u,_,T);case ao:return u=u.get(_.key===null?x:_.key)||null,c(g,u,_,T);case Tr:var E=_._init;return p(u,g,x,E(_._payload),T)}if(Fa(_)||Ca(_))return u=u.get(x)||null,d(g,u,_,T,null);zc(g,_)}return null}function v(u,g,x,_){for(var T=null,E=null,A=g,R=g=0,w=null;A!==null&&R<x.length;R++){A.index>R?(w=A,A=null):w=A.sibling;var S=h(u,A,x[R],_);if(S===null){A===null&&(A=w);break}t&&A&&S.alternate===null&&e(u,A),g=s(S,g,R),E===null?T=S:E.sibling=S,E=S,A=w}if(R===x.length)return n(u,A),Tt&&_s(u,R),T;if(A===null){for(;R<x.length;R++)A=f(u,x[R],_),A!==null&&(g=s(A,g,R),E===null?T=A:E.sibling=A,E=A);return Tt&&_s(u,R),T}for(A=i(u,A);R<x.length;R++)w=p(A,u,R,x[R],_),w!==null&&(t&&w.alternate!==null&&A.delete(w.key===null?R:w.key),g=s(w,g,R),E===null?T=w:E.sibling=w,E=w);return t&&A.forEach(function(P){return e(u,P)}),Tt&&_s(u,R),T}function y(u,g,x,_){var T=Ca(x);if(typeof T!="function")throw Error(ne(150));if(x=T.call(x),x==null)throw Error(ne(151));for(var E=T=null,A=g,R=g=0,w=null,S=x.next();A!==null&&!S.done;R++,S=x.next()){A.index>R?(w=A,A=null):w=A.sibling;var P=h(u,A,S.value,_);if(P===null){A===null&&(A=w);break}t&&A&&P.alternate===null&&e(u,A),g=s(P,g,R),E===null?T=P:E.sibling=P,E=P,A=w}if(S.done)return n(u,A),Tt&&_s(u,R),T;if(A===null){for(;!S.done;R++,S=x.next())S=f(u,S.value,_),S!==null&&(g=s(S,g,R),E===null?T=S:E.sibling=S,E=S);return Tt&&_s(u,R),T}for(A=i(u,A);!S.done;R++,S=x.next())S=p(A,u,R,S.value,_),S!==null&&(t&&S.alternate!==null&&A.delete(S.key===null?R:S.key),g=s(S,g,R),E===null?T=S:E.sibling=S,E=S);return t&&A.forEach(function(z){return e(u,z)}),Tt&&_s(u,R),T}function m(u,g,x,_){if(typeof x=="object"&&x!==null&&x.type===lo&&x.key===null&&(x=x.props.children),typeof x=="object"&&x!==null){switch(x.$$typeof){case wc:e:{for(var T=x.key,E=g;E!==null;){if(E.key===T){if(T=x.type,T===lo){if(E.tag===7){n(u,E.sibling),g=r(E,x.props.children),g.return=u,u=g;break e}}else if(E.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===Tr&&yx(T)===E.type){n(u,E.sibling),g=r(E,x.props),g.ref=ka(u,E,x),g.return=u,u=g;break e}n(u,E);break}else e(u,E);E=E.sibling}x.type===lo?(g=Ts(x.props.children,u.mode,_,x.key),g.return=u,u=g):(_=jc(x.type,x.key,x.props,null,u.mode,_),_.ref=ka(u,g,x),_.return=u,u=_)}return o(u);case ao:e:{for(E=x.key;g!==null;){if(g.key===E)if(g.tag===4&&g.stateNode.containerInfo===x.containerInfo&&g.stateNode.implementation===x.implementation){n(u,g.sibling),g=r(g,x.children||[]),g.return=u,u=g;break e}else{n(u,g);break}else e(u,g);g=g.sibling}g=qh(x,u.mode,_),g.return=u,u=g}return o(u);case Tr:return E=x._init,m(u,g,E(x._payload),_)}if(Fa(x))return v(u,g,x,_);if(Ca(x))return y(u,g,x,_);zc(u,x)}return typeof x=="string"&&x!==""||typeof x=="number"?(x=""+x,g!==null&&g.tag===6?(n(u,g.sibling),g=r(g,x),g.return=u,u=g):(n(u,g),g=Xh(x,u.mode,_),g.return=u,u=g),o(u)):n(u,g)}return m}var Ro=G1(!0),W1=G1(!1),fu=Gr(null),hu=null,vo=null,rm=null;function sm(){rm=vo=hu=null}function om(t){var e=fu.current;St(fu),t._currentValue=e}function Sp(t,e,n){for(;t!==null;){var i=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,i!==null&&(i.childLanes|=e)):i!==null&&(i.childLanes&e)!==e&&(i.childLanes|=e),t===n)break;t=t.return}}function wo(t,e){hu=t,rm=vo=null,t=t.dependencies,t!==null&&t.firstContext!==null&&((t.lanes&e)!==0&&(Cn=!0),t.firstContext=null)}function ii(t){var e=t._currentValue;if(rm!==t)if(t={context:t,memoizedValue:e,next:null},vo===null){if(hu===null)throw Error(ne(308));vo=t,hu.dependencies={lanes:0,firstContext:t}}else vo=vo.next=t;return e}var Ms=null;function am(t){Ms===null?Ms=[t]:Ms.push(t)}function X1(t,e,n,i){var r=e.interleaved;return r===null?(n.next=n,am(e)):(n.next=r.next,r.next=n),e.interleaved=n,sr(t,i)}function sr(t,e){t.lanes|=e;var n=t.alternate;for(n!==null&&(n.lanes|=e),n=t,t=t.return;t!==null;)t.childLanes|=e,n=t.alternate,n!==null&&(n.childLanes|=e),n=t,t=t.return;return n.tag===3?n.stateNode:null}var Ar=!1;function lm(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function q1(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,effects:t.effects})}function nr(t,e){return{eventTime:t,lane:e,tag:0,payload:null,callback:null,next:null}}function Ur(t,e,n){var i=t.updateQueue;if(i===null)return null;if(i=i.shared,(it&2)!==0){var r=i.pending;return r===null?e.next=e:(e.next=r.next,r.next=e),i.pending=e,sr(t,n)}return r=i.interleaved,r===null?(e.next=e,am(i)):(e.next=r.next,r.next=e),i.interleaved=e,sr(t,n)}function qc(t,e,n){if(e=e.updateQueue,e!==null&&(e=e.shared,(n&4194240)!==0)){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,$p(t,n)}}function _x(t,e){var n=t.updateQueue,i=t.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var r=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?r=s=o:s=s.next=o,n=n.next}while(n!==null);s===null?r=s=e:s=s.next=e}else r=s=e;n={baseState:i.baseState,firstBaseUpdate:r,lastBaseUpdate:s,shared:i.shared,effects:i.effects},t.updateQueue=n;return}t=n.lastBaseUpdate,t===null?n.firstBaseUpdate=e:t.next=e,n.lastBaseUpdate=e}function pu(t,e,n,i){var r=t.updateQueue;Ar=!1;var s=r.firstBaseUpdate,o=r.lastBaseUpdate,a=r.shared.pending;if(a!==null){r.shared.pending=null;var l=a,c=l.next;l.next=null,o===null?s=c:o.next=c,o=l;var d=t.alternate;d!==null&&(d=d.updateQueue,a=d.lastBaseUpdate,a!==o&&(a===null?d.firstBaseUpdate=c:a.next=c,d.lastBaseUpdate=l))}if(s!==null){var f=r.baseState;o=0,d=c=l=null,a=s;do{var h=a.lane,p=a.eventTime;if((i&h)===h){d!==null&&(d=d.next={eventTime:p,lane:0,tag:a.tag,payload:a.payload,callback:a.callback,next:null});e:{var v=t,y=a;switch(h=e,p=n,y.tag){case 1:if(v=y.payload,typeof v=="function"){f=v.call(p,f,h);break e}f=v;break e;case 3:v.flags=v.flags&-65537|128;case 0:if(v=y.payload,h=typeof v=="function"?v.call(p,f,h):v,h==null)break e;f=kt({},f,h);break e;case 2:Ar=!0}}a.callback!==null&&a.lane!==0&&(t.flags|=64,h=r.effects,h===null?r.effects=[a]:h.push(a))}else p={eventTime:p,lane:h,tag:a.tag,payload:a.payload,callback:a.callback,next:null},d===null?(c=d=p,l=f):d=d.next=p,o|=h;if(a=a.next,a===null){if(a=r.shared.pending,a===null)break;h=a,a=h.next,h.next=null,r.lastBaseUpdate=h,r.shared.pending=null}}while(!0);if(d===null&&(l=f),r.baseState=l,r.firstBaseUpdate=c,r.lastBaseUpdate=d,e=r.shared.interleaved,e!==null){r=e;do o|=r.lane,r=r.next;while(r!==e)}else s===null&&(r.shared.lanes=0);Ps|=o,t.lanes=o,t.memoizedState=f}}function bx(t,e,n){if(t=e.effects,e.effects=null,t!==null)for(e=0;e<t.length;e++){var i=t[e],r=i.callback;if(r!==null){if(i.callback=null,i=n,typeof r!="function")throw Error(ne(191,r));r.call(i)}}}var ml={},Di=Gr(ml),ol=Gr(ml),al=Gr(ml);function ws(t){if(t===ml)throw Error(ne(174));return t}function cm(t,e){switch(xt(al,e),xt(ol,t),xt(Di,ml),t=e.nodeType,t){case 9:case 11:e=(e=e.documentElement)?e.namespaceURI:np(null,"");break;default:t=t===8?e.parentNode:e,e=t.namespaceURI||null,t=t.tagName,e=np(e,t)}St(Di),xt(Di,e)}function Po(){St(Di),St(ol),St(al)}function $1(t){ws(al.current);var e=ws(Di.current),n=np(e,t.type);e!==n&&(xt(ol,t),xt(Di,n))}function um(t){ol.current===t&&(St(Di),St(ol))}var Pt=Gr(0);function mu(t){for(var e=t;e!==null;){if(e.tag===13){var n=e.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if((e.flags&128)!==0)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var zh=[];function dm(){for(var t=0;t<zh.length;t++)zh[t]._workInProgressVersionPrimary=null;zh.length=0}var $c=ar.ReactCurrentDispatcher,Bh=ar.ReactCurrentBatchConfig,Rs=0,It=null,Wt=null,Zt=null,gu=!1,Xa=!1,ll=0,H3=0;function ln(){throw Error(ne(321))}function fm(t,e){if(e===null)return!1;for(var n=0;n<e.length&&n<t.length;n++)if(!Si(t[n],e[n]))return!1;return!0}function hm(t,e,n,i,r,s){if(Rs=s,It=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,$c.current=t===null||t.memoizedState===null?X3:q3,t=n(i,r),Xa){s=0;do{if(Xa=!1,ll=0,25<=s)throw Error(ne(301));s+=1,Zt=Wt=null,e.updateQueue=null,$c.current=$3,t=n(i,r)}while(Xa)}if($c.current=vu,e=Wt!==null&&Wt.next!==null,Rs=0,Zt=Wt=It=null,gu=!1,e)throw Error(ne(300));return t}function pm(){var t=ll!==0;return ll=0,t}function ki(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Zt===null?It.memoizedState=Zt=t:Zt=Zt.next=t,Zt}function ri(){if(Wt===null){var t=It.alternate;t=t!==null?t.memoizedState:null}else t=Wt.next;var e=Zt===null?It.memoizedState:Zt.next;if(e!==null)Zt=e,Wt=t;else{if(t===null)throw Error(ne(310));Wt=t,t={memoizedState:Wt.memoizedState,baseState:Wt.baseState,baseQueue:Wt.baseQueue,queue:Wt.queue,next:null},Zt===null?It.memoizedState=Zt=t:Zt=Zt.next=t}return Zt}function cl(t,e){return typeof e=="function"?e(t):e}function Hh(t){var e=ri(),n=e.queue;if(n===null)throw Error(ne(311));n.lastRenderedReducer=t;var i=Wt,r=i.baseQueue,s=n.pending;if(s!==null){if(r!==null){var o=r.next;r.next=s.next,s.next=o}i.baseQueue=r=s,n.pending=null}if(r!==null){s=r.next,i=i.baseState;var a=o=null,l=null,c=s;do{var d=c.lane;if((Rs&d)===d)l!==null&&(l=l.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),i=c.hasEagerState?c.eagerState:t(i,c.action);else{var f={lane:d,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};l===null?(a=l=f,o=i):l=l.next=f,It.lanes|=d,Ps|=d}c=c.next}while(c!==null&&c!==s);l===null?o=i:l.next=a,Si(i,e.memoizedState)||(Cn=!0),e.memoizedState=i,e.baseState=o,e.baseQueue=l,n.lastRenderedState=i}if(t=n.interleaved,t!==null){r=t;do s=r.lane,It.lanes|=s,Ps|=s,r=r.next;while(r!==t)}else r===null&&(n.lanes=0);return[e.memoizedState,n.dispatch]}function Vh(t){var e=ri(),n=e.queue;if(n===null)throw Error(ne(311));n.lastRenderedReducer=t;var i=n.dispatch,r=n.pending,s=e.memoizedState;if(r!==null){n.pending=null;var o=r=r.next;do s=t(s,o.action),o=o.next;while(o!==r);Si(s,e.memoizedState)||(Cn=!0),e.memoizedState=s,e.baseQueue===null&&(e.baseState=s),n.lastRenderedState=s}return[s,i]}function Y1(){}function Z1(t,e){var n=It,i=ri(),r=e(),s=!Si(i.memoizedState,r);if(s&&(i.memoizedState=r,Cn=!0),i=i.queue,mm(j1.bind(null,n,i,t),[t]),i.getSnapshot!==e||s||Zt!==null&&Zt.memoizedState.tag&1){if(n.flags|=2048,ul(9,K1.bind(null,n,i,r,e),void 0,null),Jt===null)throw Error(ne(349));(Rs&30)!==0||J1(n,e,r)}return r}function J1(t,e,n){t.flags|=16384,t={getSnapshot:e,value:n},e=It.updateQueue,e===null?(e={lastEffect:null,stores:null},It.updateQueue=e,e.stores=[t]):(n=e.stores,n===null?e.stores=[t]:n.push(t))}function K1(t,e,n,i){e.value=n,e.getSnapshot=i,Q1(e)&&ey(t)}function j1(t,e,n){return n(function(){Q1(e)&&ey(t)})}function Q1(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!Si(t,n)}catch{return!0}}function ey(t){var e=sr(t,1);e!==null&&bi(e,t,1,-1)}function Sx(t){var e=ki();return typeof t=="function"&&(t=t()),e.memoizedState=e.baseState=t,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:cl,lastRenderedState:t},e.queue=t,t=t.dispatch=W3.bind(null,It,t),[e.memoizedState,t]}function ul(t,e,n,i){return t={tag:t,create:e,destroy:n,deps:i,next:null},e=It.updateQueue,e===null?(e={lastEffect:null,stores:null},It.updateQueue=e,e.lastEffect=t.next=t):(n=e.lastEffect,n===null?e.lastEffect=t.next=t:(i=n.next,n.next=t,t.next=i,e.lastEffect=t)),t}function ty(){return ri().memoizedState}function Yc(t,e,n,i){var r=ki();It.flags|=t,r.memoizedState=ul(1|e,n,void 0,i===void 0?null:i)}function Ru(t,e,n,i){var r=ri();i=i===void 0?null:i;var s=void 0;if(Wt!==null){var o=Wt.memoizedState;if(s=o.destroy,i!==null&&fm(i,o.deps)){r.memoizedState=ul(e,n,s,i);return}}It.flags|=t,r.memoizedState=ul(1|e,n,s,i)}function Mx(t,e){return Yc(8390656,8,t,e)}function mm(t,e){return Ru(2048,8,t,e)}function ny(t,e){return Ru(4,2,t,e)}function iy(t,e){return Ru(4,4,t,e)}function ry(t,e){if(typeof e=="function")return t=t(),e(t),function(){e(null)};if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function sy(t,e,n){return n=n!=null?n.concat([t]):null,Ru(4,4,ry.bind(null,e,t),n)}function gm(){}function oy(t,e){var n=ri();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&fm(e,i[1])?i[0]:(n.memoizedState=[t,e],t)}function ay(t,e){var n=ri();e=e===void 0?null:e;var i=n.memoizedState;return i!==null&&e!==null&&fm(e,i[1])?i[0]:(t=t(),n.memoizedState=[t,e],t)}function ly(t,e,n){return(Rs&21)===0?(t.baseState&&(t.baseState=!1,Cn=!0),t.memoizedState=n):(Si(n,e)||(n=h1(),It.lanes|=n,Ps|=n,t.baseState=!0),e)}function V3(t,e){var n=dt;dt=n!==0&&4>n?n:4,t(!0);var i=Bh.transition;Bh.transition={};try{t(!1),e()}finally{dt=n,Bh.transition=i}}function cy(){return ri().memoizedState}function G3(t,e,n){var i=Or(t);if(n={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null},uy(t))dy(e,n);else if(n=X1(t,e,n,i),n!==null){var r=Sn();bi(n,t,i,r),fy(n,e,i)}}function W3(t,e,n){var i=Or(t),r={lane:i,action:n,hasEagerState:!1,eagerState:null,next:null};if(uy(t))dy(e,r);else{var s=t.alternate;if(t.lanes===0&&(s===null||s.lanes===0)&&(s=e.lastRenderedReducer,s!==null))try{var o=e.lastRenderedState,a=s(o,n);if(r.hasEagerState=!0,r.eagerState=a,Si(a,o)){var l=e.interleaved;l===null?(r.next=r,am(e)):(r.next=l.next,l.next=r),e.interleaved=r;return}}catch{}n=X1(t,e,r,i),n!==null&&(r=Sn(),bi(n,t,i,r),fy(n,e,i))}}function uy(t){var e=t.alternate;return t===It||e!==null&&e===It}function dy(t,e){Xa=gu=!0;var n=t.pending;n===null?e.next=e:(e.next=n.next,n.next=e),t.pending=e}function fy(t,e,n){if((n&4194240)!==0){var i=e.lanes;i&=t.pendingLanes,n|=i,e.lanes=n,$p(t,n)}}var vu={readContext:ii,useCallback:ln,useContext:ln,useEffect:ln,useImperativeHandle:ln,useInsertionEffect:ln,useLayoutEffect:ln,useMemo:ln,useReducer:ln,useRef:ln,useState:ln,useDebugValue:ln,useDeferredValue:ln,useTransition:ln,useMutableSource:ln,useSyncExternalStore:ln,useId:ln,unstable_isNewReconciler:!1},X3={readContext:ii,useCallback:function(t,e){return ki().memoizedState=[t,e===void 0?null:e],t},useContext:ii,useEffect:Mx,useImperativeHandle:function(t,e,n){return n=n!=null?n.concat([t]):null,Yc(4194308,4,ry.bind(null,e,t),n)},useLayoutEffect:function(t,e){return Yc(4194308,4,t,e)},useInsertionEffect:function(t,e){return Yc(4,2,t,e)},useMemo:function(t,e){var n=ki();return e=e===void 0?null:e,t=t(),n.memoizedState=[t,e],t},useReducer:function(t,e,n){var i=ki();return e=n!==void 0?n(e):e,i.memoizedState=i.baseState=e,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:e},i.queue=t,t=t.dispatch=G3.bind(null,It,t),[i.memoizedState,t]},useRef:function(t){var e=ki();return t={current:t},e.memoizedState=t},useState:Sx,useDebugValue:gm,useDeferredValue:function(t){return ki().memoizedState=t},useTransition:function(){var t=Sx(!1),e=t[0];return t=V3.bind(null,t[1]),ki().memoizedState=t,[e,t]},useMutableSource:function(){},useSyncExternalStore:function(t,e,n){var i=It,r=ki();if(Tt){if(n===void 0)throw Error(ne(407));n=n()}else{if(n=e(),Jt===null)throw Error(ne(349));(Rs&30)!==0||J1(i,e,n)}r.memoizedState=n;var s={value:n,getSnapshot:e};return r.queue=s,Mx(j1.bind(null,i,s,t),[t]),i.flags|=2048,ul(9,K1.bind(null,i,s,n,e),void 0,null),n},useId:function(){var t=ki(),e=Jt.identifierPrefix;if(Tt){var n=tr,i=er;n=(i&~(1<<32-_i(i)-1)).toString(32)+n,e=":"+e+"R"+n,n=ll++,0<n&&(e+="H"+n.toString(32)),e+=":"}else n=H3++,e=":"+e+"r"+n.toString(32)+":";return t.memoizedState=e},unstable_isNewReconciler:!1},q3={readContext:ii,useCallback:oy,useContext:ii,useEffect:mm,useImperativeHandle:sy,useInsertionEffect:ny,useLayoutEffect:iy,useMemo:ay,useReducer:Hh,useRef:ty,useState:function(){return Hh(cl)},useDebugValue:gm,useDeferredValue:function(t){var e=ri();return ly(e,Wt.memoizedState,t)},useTransition:function(){var t=Hh(cl)[0],e=ri().memoizedState;return[t,e]},useMutableSource:Y1,useSyncExternalStore:Z1,useId:cy,unstable_isNewReconciler:!1},$3={readContext:ii,useCallback:oy,useContext:ii,useEffect:mm,useImperativeHandle:sy,useInsertionEffect:ny,useLayoutEffect:iy,useMemo:ay,useReducer:Vh,useRef:ty,useState:function(){return Vh(cl)},useDebugValue:gm,useDeferredValue:function(t){var e=ri();return Wt===null?e.memoizedState=t:ly(e,Wt.memoizedState,t)},useTransition:function(){var t=Vh(cl)[0],e=ri().memoizedState;return[t,e]},useMutableSource:Y1,useSyncExternalStore:Z1,useId:cy,unstable_isNewReconciler:!1};function vi(t,e){if(t&&t.defaultProps){e=kt({},e),t=t.defaultProps;for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e}return e}function Mp(t,e,n,i){e=t.memoizedState,n=n(i,e),n=n==null?e:kt({},e,n),t.memoizedState=n,t.lanes===0&&(t.updateQueue.baseState=n)}var Pu={isMounted:function(t){return(t=t._reactInternals)?Ls(t)===t:!1},enqueueSetState:function(t,e,n){t=t._reactInternals;var i=Sn(),r=Or(t),s=nr(i,r);s.payload=e,n!=null&&(s.callback=n),e=Ur(t,s,r),e!==null&&(bi(e,t,r,i),qc(e,t,r))},enqueueReplaceState:function(t,e,n){t=t._reactInternals;var i=Sn(),r=Or(t),s=nr(i,r);s.tag=1,s.payload=e,n!=null&&(s.callback=n),e=Ur(t,s,r),e!==null&&(bi(e,t,r,i),qc(e,t,r))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var n=Sn(),i=Or(t),r=nr(n,i);r.tag=2,e!=null&&(r.callback=e),e=Ur(t,r,i),e!==null&&(bi(e,t,i,n),qc(e,t,i))}};function wx(t,e,n,i,r,s,o){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(i,s,o):e.prototype&&e.prototype.isPureReactComponent?!nl(n,i)||!nl(r,s):!0}function hy(t,e,n){var i=!1,r=Hr,s=e.contextType;return typeof s=="object"&&s!==null?s=ii(s):(r=Pn(e)?As:dn.current,i=e.contextTypes,s=(i=i!=null)?Ao(t,r):Hr),e=new e(n,s),t.memoizedState=e.state!==null&&e.state!==void 0?e.state:null,e.updater=Pu,t.stateNode=e,e._reactInternals=t,i&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=r,t.__reactInternalMemoizedMaskedChildContext=s),e}function Ex(t,e,n,i){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(n,i),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(n,i),e.state!==t&&Pu.enqueueReplaceState(e,e.state,null)}function wp(t,e,n,i){var r=t.stateNode;r.props=n,r.state=t.memoizedState,r.refs={},lm(t);var s=e.contextType;typeof s=="object"&&s!==null?r.context=ii(s):(s=Pn(e)?As:dn.current,r.context=Ao(t,s)),r.state=t.memoizedState,s=e.getDerivedStateFromProps,typeof s=="function"&&(Mp(t,e,s,n),r.state=t.memoizedState),typeof e.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(e=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),e!==r.state&&Pu.enqueueReplaceState(r,r.state,null),pu(t,n,r,i),r.state=t.memoizedState),typeof r.componentDidMount=="function"&&(t.flags|=4194308)}function Io(t,e){try{var n="",i=e;do n+=Mw(i),i=i.return;while(i);var r=n}catch(s){r=`
Error generating stack: `+s.message+`
`+s.stack}return{value:t,source:e,stack:r,digest:null}}function Gh(t,e,n){return{value:t,source:null,stack:n??null,digest:e??null}}function Ep(t,e){try{console.error(e.value)}catch(n){setTimeout(function(){throw n})}}var Y3=typeof WeakMap=="function"?WeakMap:Map;function py(t,e,n){n=nr(-1,n),n.tag=3,n.payload={element:null};var i=e.value;return n.callback=function(){yu||(yu=!0,Dp=i),Ep(t,e)},n}function my(t,e,n){n=nr(-1,n),n.tag=3;var i=t.type.getDerivedStateFromError;if(typeof i=="function"){var r=e.value;n.payload=function(){return i(r)},n.callback=function(){Ep(t,e)}}var s=t.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){Ep(t,e),typeof i!="function"&&(Fr===null?Fr=new Set([this]):Fr.add(this));var o=e.stack;this.componentDidCatch(e.value,{componentStack:o!==null?o:""})}),n}function Tx(t,e,n){var i=t.pingCache;if(i===null){i=t.pingCache=new Y3;var r=new Set;i.set(e,r)}else r=i.get(e),r===void 0&&(r=new Set,i.set(e,r));r.has(n)||(r.add(n),t=lE.bind(null,t,e,n),e.then(t,t))}function Ax(t){do{var e;if((e=t.tag===13)&&(e=t.memoizedState,e=e!==null?e.dehydrated!==null:!0),e)return t;t=t.return}while(t!==null);return null}function Cx(t,e,n,i,r){return(t.mode&1)===0?(t===e?t.flags|=65536:(t.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(e=nr(-1,1),e.tag=2,Ur(n,e,1))),n.lanes|=1),t):(t.flags|=65536,t.lanes=r,t)}var Z3=ar.ReactCurrentOwner,Cn=!1;function bn(t,e,n,i){e.child=t===null?W1(e,null,n,i):Ro(e,t.child,n,i)}function Rx(t,e,n,i,r){n=n.render;var s=e.ref;return wo(e,r),i=hm(t,e,n,i,s,r),n=pm(),t!==null&&!Cn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,or(t,e,r)):(Tt&&n&&tm(e),e.flags|=1,bn(t,e,i,r),e.child)}function Px(t,e,n,i,r){if(t===null){var s=n.type;return typeof s=="function"&&!wm(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(e.tag=15,e.type=s,gy(t,e,s,i,r)):(t=jc(n.type,null,i,e,e.mode,r),t.ref=e.ref,t.return=e,e.child=t)}if(s=t.child,(t.lanes&r)===0){var o=s.memoizedProps;if(n=n.compare,n=n!==null?n:nl,n(o,i)&&t.ref===e.ref)return or(t,e,r)}return e.flags|=1,t=zr(s,i),t.ref=e.ref,t.return=e,e.child=t}function gy(t,e,n,i,r){if(t!==null){var s=t.memoizedProps;if(nl(s,i)&&t.ref===e.ref)if(Cn=!1,e.pendingProps=i=s,(t.lanes&r)!==0)(t.flags&131072)!==0&&(Cn=!0);else return e.lanes=t.lanes,or(t,e,r)}return Tp(t,e,n,i,r)}function vy(t,e,n){var i=e.pendingProps,r=i.children,s=t!==null?t.memoizedState:null;if(i.mode==="hidden")if((e.mode&1)===0)e.memoizedState={baseLanes:0,cachePool:null,transitions:null},xt(yo,On),On|=n;else{if((n&1073741824)===0)return t=s!==null?s.baseLanes|n:n,e.lanes=e.childLanes=1073741824,e.memoizedState={baseLanes:t,cachePool:null,transitions:null},e.updateQueue=null,xt(yo,On),On|=t,null;e.memoizedState={baseLanes:0,cachePool:null,transitions:null},i=s!==null?s.baseLanes:n,xt(yo,On),On|=i}else s!==null?(i=s.baseLanes|n,e.memoizedState=null):i=n,xt(yo,On),On|=i;return bn(t,e,r,n),e.child}function xy(t,e){var n=e.ref;(t===null&&n!==null||t!==null&&t.ref!==n)&&(e.flags|=512,e.flags|=2097152)}function Tp(t,e,n,i,r){var s=Pn(n)?As:dn.current;return s=Ao(e,s),wo(e,r),n=hm(t,e,n,i,s,r),i=pm(),t!==null&&!Cn?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~r,or(t,e,r)):(Tt&&i&&tm(e),e.flags|=1,bn(t,e,n,r),e.child)}function Ix(t,e,n,i,r){if(Pn(n)){var s=!0;cu(e)}else s=!1;if(wo(e,r),e.stateNode===null)Zc(t,e),hy(e,n,i),wp(e,n,i,r),i=!0;else if(t===null){var o=e.stateNode,a=e.memoizedProps;o.props=a;var l=o.context,c=n.contextType;typeof c=="object"&&c!==null?c=ii(c):(c=Pn(n)?As:dn.current,c=Ao(e,c));var d=n.getDerivedStateFromProps,f=typeof d=="function"||typeof o.getSnapshotBeforeUpdate=="function";f||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(a!==i||l!==c)&&Ex(e,o,i,c),Ar=!1;var h=e.memoizedState;o.state=h,pu(e,i,o,r),l=e.memoizedState,a!==i||h!==l||Rn.current||Ar?(typeof d=="function"&&(Mp(e,n,d,i),l=e.memoizedState),(a=Ar||wx(e,n,a,i,h,l,c))?(f||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(e.flags|=4194308)):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=i,e.memoizedState=l),o.props=i,o.state=l,o.context=c,i=a):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),i=!1)}else{o=e.stateNode,q1(t,e),a=e.memoizedProps,c=e.type===e.elementType?a:vi(e.type,a),o.props=c,f=e.pendingProps,h=o.context,l=n.contextType,typeof l=="object"&&l!==null?l=ii(l):(l=Pn(n)?As:dn.current,l=Ao(e,l));var p=n.getDerivedStateFromProps;(d=typeof p=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(a!==f||h!==l)&&Ex(e,o,i,l),Ar=!1,h=e.memoizedState,o.state=h,pu(e,i,o,r);var v=e.memoizedState;a!==f||h!==v||Rn.current||Ar?(typeof p=="function"&&(Mp(e,n,p,i),v=e.memoizedState),(c=Ar||wx(e,n,c,i,h,v,l)||!1)?(d||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(i,v,l),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(i,v,l)),typeof o.componentDidUpdate=="function"&&(e.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof o.componentDidUpdate!="function"||a===t.memoizedProps&&h===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||a===t.memoizedProps&&h===t.memoizedState||(e.flags|=1024),e.memoizedProps=i,e.memoizedState=v),o.props=i,o.state=v,o.context=l,i=c):(typeof o.componentDidUpdate!="function"||a===t.memoizedProps&&h===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||a===t.memoizedProps&&h===t.memoizedState||(e.flags|=1024),i=!1)}return Ap(t,e,n,i,s,r)}function Ap(t,e,n,i,r,s){xy(t,e);var o=(e.flags&128)!==0;if(!i&&!o)return r&&gx(e,n,!1),or(t,e,s);i=e.stateNode,Z3.current=e;var a=o&&typeof n.getDerivedStateFromError!="function"?null:i.render();return e.flags|=1,t!==null&&o?(e.child=Ro(e,t.child,null,s),e.child=Ro(e,null,a,s)):bn(t,e,a,s),e.memoizedState=i.state,r&&gx(e,n,!0),e.child}function yy(t){var e=t.stateNode;e.pendingContext?mx(t,e.pendingContext,e.pendingContext!==e.context):e.context&&mx(t,e.context,!1),cm(t,e.containerInfo)}function kx(t,e,n,i,r){return Co(),im(r),e.flags|=256,bn(t,e,n,i),e.child}var Cp={dehydrated:null,treeContext:null,retryLane:0};function Rp(t){return{baseLanes:t,cachePool:null,transitions:null}}function _y(t,e,n){var i=e.pendingProps,r=Pt.current,s=!1,o=(e.flags&128)!==0,a;if((a=o)||(a=t!==null&&t.memoizedState===null?!1:(r&2)!==0),a?(s=!0,e.flags&=-129):(t===null||t.memoizedState!==null)&&(r|=1),xt(Pt,r&1),t===null)return bp(e),t=e.memoizedState,t!==null&&(t=t.dehydrated,t!==null)?((e.mode&1)===0?e.lanes=1:t.data==="$!"?e.lanes=8:e.lanes=1073741824,null):(o=i.children,t=i.fallback,s?(i=e.mode,s=e.child,o={mode:"hidden",children:o},(i&1)===0&&s!==null?(s.childLanes=0,s.pendingProps=o):s=Lu(o,i,0,null),t=Ts(t,i,n,null),s.return=e,t.return=e,s.sibling=t,e.child=s,e.child.memoizedState=Rp(n),e.memoizedState=Cp,t):vm(e,o));if(r=t.memoizedState,r!==null&&(a=r.dehydrated,a!==null))return J3(t,e,o,i,a,r,n);if(s){s=i.fallback,o=e.mode,r=t.child,a=r.sibling;var l={mode:"hidden",children:i.children};return(o&1)===0&&e.child!==r?(i=e.child,i.childLanes=0,i.pendingProps=l,e.deletions=null):(i=zr(r,l),i.subtreeFlags=r.subtreeFlags&14680064),a!==null?s=zr(a,s):(s=Ts(s,o,n,null),s.flags|=2),s.return=e,i.return=e,i.sibling=s,e.child=i,i=s,s=e.child,o=t.child.memoizedState,o=o===null?Rp(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},s.memoizedState=o,s.childLanes=t.childLanes&~n,e.memoizedState=Cp,i}return s=t.child,t=s.sibling,i=zr(s,{mode:"visible",children:i.children}),(e.mode&1)===0&&(i.lanes=n),i.return=e,i.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=i,e.memoizedState=null,i}function vm(t,e){return e=Lu({mode:"visible",children:e},t.mode,0,null),e.return=t,t.child=e}function Bc(t,e,n,i){return i!==null&&im(i),Ro(e,t.child,null,n),t=vm(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function J3(t,e,n,i,r,s,o){if(n)return e.flags&256?(e.flags&=-257,i=Gh(Error(ne(422))),Bc(t,e,o,i)):e.memoizedState!==null?(e.child=t.child,e.flags|=128,null):(s=i.fallback,r=e.mode,i=Lu({mode:"visible",children:i.children},r,0,null),s=Ts(s,r,o,null),s.flags|=2,i.return=e,s.return=e,i.sibling=s,e.child=i,(e.mode&1)!==0&&Ro(e,t.child,null,o),e.child.memoizedState=Rp(o),e.memoizedState=Cp,s);if((e.mode&1)===0)return Bc(t,e,o,null);if(r.data==="$!"){if(i=r.nextSibling&&r.nextSibling.dataset,i)var a=i.dgst;return i=a,s=Error(ne(419)),i=Gh(s,i,void 0),Bc(t,e,o,i)}if(a=(o&t.childLanes)!==0,Cn||a){if(i=Jt,i!==null){switch(o&-o){case 4:r=2;break;case 16:r=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:r=32;break;case 536870912:r=268435456;break;default:r=0}r=(r&(i.suspendedLanes|o))!==0?0:r,r!==0&&r!==s.retryLane&&(s.retryLane=r,sr(t,r),bi(i,t,r,-1))}return Mm(),i=Gh(Error(ne(421))),Bc(t,e,o,i)}return r.data==="$?"?(e.flags|=128,e.child=t.child,e=cE.bind(null,t),r._reactRetry=e,null):(t=s.treeContext,zn=Dr(r.nextSibling),Bn=e,Tt=!0,yi=null,t!==null&&(Qn[ei++]=er,Qn[ei++]=tr,Qn[ei++]=Cs,er=t.id,tr=t.overflow,Cs=e),e=vm(e,i.children),e.flags|=4096,e)}function Lx(t,e,n){t.lanes|=e;var i=t.alternate;i!==null&&(i.lanes|=e),Sp(t.return,e,n)}function Wh(t,e,n,i,r){var s=t.memoizedState;s===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:r}:(s.isBackwards=e,s.rendering=null,s.renderingStartTime=0,s.last=i,s.tail=n,s.tailMode=r)}function by(t,e,n){var i=e.pendingProps,r=i.revealOrder,s=i.tail;if(bn(t,e,i.children,n),i=Pt.current,(i&2)!==0)i=i&1|2,e.flags|=128;else{if(t!==null&&(t.flags&128)!==0)e:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&Lx(t,n,e);else if(t.tag===19)Lx(t,n,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}i&=1}if(xt(Pt,i),(e.mode&1)===0)e.memoizedState=null;else switch(r){case"forwards":for(n=e.child,r=null;n!==null;)t=n.alternate,t!==null&&mu(t)===null&&(r=n),n=n.sibling;n=r,n===null?(r=e.child,e.child=null):(r=n.sibling,n.sibling=null),Wh(e,!1,r,n,s);break;case"backwards":for(n=null,r=e.child,e.child=null;r!==null;){if(t=r.alternate,t!==null&&mu(t)===null){e.child=r;break}t=r.sibling,r.sibling=n,n=r,r=t}Wh(e,!0,n,null,s);break;case"together":Wh(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function Zc(t,e){(e.mode&1)===0&&t!==null&&(t.alternate=null,e.alternate=null,e.flags|=2)}function or(t,e,n){if(t!==null&&(e.dependencies=t.dependencies),Ps|=e.lanes,(n&e.childLanes)===0)return null;if(t!==null&&e.child!==t.child)throw Error(ne(153));if(e.child!==null){for(t=e.child,n=zr(t,t.pendingProps),e.child=n,n.return=e;t.sibling!==null;)t=t.sibling,n=n.sibling=zr(t,t.pendingProps),n.return=e;n.sibling=null}return e.child}function K3(t,e,n){switch(e.tag){case 3:yy(e),Co();break;case 5:$1(e);break;case 1:Pn(e.type)&&cu(e);break;case 4:cm(e,e.stateNode.containerInfo);break;case 10:var i=e.type._context,r=e.memoizedProps.value;xt(fu,i._currentValue),i._currentValue=r;break;case 13:if(i=e.memoizedState,i!==null)return i.dehydrated!==null?(xt(Pt,Pt.current&1),e.flags|=128,null):(n&e.child.childLanes)!==0?_y(t,e,n):(xt(Pt,Pt.current&1),t=or(t,e,n),t!==null?t.sibling:null);xt(Pt,Pt.current&1);break;case 19:if(i=(n&e.childLanes)!==0,(t.flags&128)!==0){if(i)return by(t,e,n);e.flags|=128}if(r=e.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),xt(Pt,Pt.current),i)break;return null;case 22:case 23:return e.lanes=0,vy(t,e,n)}return or(t,e,n)}var Sy,Pp,My,wy;Sy=function(t,e){for(var n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};Pp=function(){};My=function(t,e,n,i){var r=t.memoizedProps;if(r!==i){t=e.stateNode,ws(Di.current);var s=null;switch(n){case"input":r=jh(t,r),i=jh(t,i),s=[];break;case"select":r=kt({},r,{value:void 0}),i=kt({},i,{value:void 0}),s=[];break;case"textarea":r=tp(t,r),i=tp(t,i),s=[];break;default:typeof r.onClick!="function"&&typeof i.onClick=="function"&&(t.onclick=au)}ip(n,i);var o;n=null;for(c in r)if(!i.hasOwnProperty(c)&&r.hasOwnProperty(c)&&r[c]!=null)if(c==="style"){var a=r[c];for(o in a)a.hasOwnProperty(o)&&(n||(n={}),n[o]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(Za.hasOwnProperty(c)?s||(s=[]):(s=s||[]).push(c,null));for(c in i){var l=i[c];if(a=r?.[c],i.hasOwnProperty(c)&&l!==a&&(l!=null||a!=null))if(c==="style")if(a){for(o in a)!a.hasOwnProperty(o)||l&&l.hasOwnProperty(o)||(n||(n={}),n[o]="");for(o in l)l.hasOwnProperty(o)&&a[o]!==l[o]&&(n||(n={}),n[o]=l[o])}else n||(s||(s=[]),s.push(c,n)),n=l;else c==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,a=a?a.__html:void 0,l!=null&&a!==l&&(s=s||[]).push(c,l)):c==="children"?typeof l!="string"&&typeof l!="number"||(s=s||[]).push(c,""+l):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(Za.hasOwnProperty(c)?(l!=null&&c==="onScroll"&&bt("scroll",t),s||a===l||(s=[])):(s=s||[]).push(c,l))}n&&(s=s||[]).push("style",n);var c=s;(e.updateQueue=c)&&(e.flags|=4)}};wy=function(t,e,n,i){n!==i&&(e.flags|=4)};function La(t,e){if(!Tt)switch(t.tailMode){case"hidden":e=t.tail;for(var n=null;e!==null;)e.alternate!==null&&(n=e),e=e.sibling;n===null?t.tail=null:n.sibling=null;break;case"collapsed":n=t.tail;for(var i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:i.sibling=null}}function cn(t){var e=t.alternate!==null&&t.alternate.child===t.child,n=0,i=0;if(e)for(var r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags&14680064,i|=r.flags&14680064,r.return=t,r=r.sibling;else for(r=t.child;r!==null;)n|=r.lanes|r.childLanes,i|=r.subtreeFlags,i|=r.flags,r.return=t,r=r.sibling;return t.subtreeFlags|=i,t.childLanes=n,e}function j3(t,e,n){var i=e.pendingProps;switch(nm(e),e.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return cn(e),null;case 1:return Pn(e.type)&&lu(),cn(e),null;case 3:return i=e.stateNode,Po(),St(Rn),St(dn),dm(),i.pendingContext&&(i.context=i.pendingContext,i.pendingContext=null),(t===null||t.child===null)&&(Oc(e)?e.flags|=4:t===null||t.memoizedState.isDehydrated&&(e.flags&256)===0||(e.flags|=1024,yi!==null&&(Op(yi),yi=null))),Pp(t,e),cn(e),null;case 5:um(e);var r=ws(al.current);if(n=e.type,t!==null&&e.stateNode!=null)My(t,e,n,i,r),t.ref!==e.ref&&(e.flags|=512,e.flags|=2097152);else{if(!i){if(e.stateNode===null)throw Error(ne(166));return cn(e),null}if(t=ws(Di.current),Oc(e)){i=e.stateNode,n=e.type;var s=e.memoizedProps;switch(i[Li]=e,i[sl]=s,t=(e.mode&1)!==0,n){case"dialog":bt("cancel",i),bt("close",i);break;case"iframe":case"object":case"embed":bt("load",i);break;case"video":case"audio":for(r=0;r<za.length;r++)bt(za[r],i);break;case"source":bt("error",i);break;case"img":case"image":case"link":bt("error",i),bt("load",i);break;case"details":bt("toggle",i);break;case"input":Hv(i,s),bt("invalid",i);break;case"select":i._wrapperState={wasMultiple:!!s.multiple},bt("invalid",i);break;case"textarea":Gv(i,s),bt("invalid",i)}ip(n,s),r=null;for(var o in s)if(s.hasOwnProperty(o)){var a=s[o];o==="children"?typeof a=="string"?i.textContent!==a&&(s.suppressHydrationWarning!==!0&&Fc(i.textContent,a,t),r=["children",a]):typeof a=="number"&&i.textContent!==""+a&&(s.suppressHydrationWarning!==!0&&Fc(i.textContent,a,t),r=["children",""+a]):Za.hasOwnProperty(o)&&a!=null&&o==="onScroll"&&bt("scroll",i)}switch(n){case"input":Ec(i),Vv(i,s,!0);break;case"textarea":Ec(i),Wv(i);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(i.onclick=au)}i=r,e.updateQueue=i,i!==null&&(e.flags|=4)}else{o=r.nodeType===9?r:r.ownerDocument,t==="http://www.w3.org/1999/xhtml"&&(t=jx(n)),t==="http://www.w3.org/1999/xhtml"?n==="script"?(t=o.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild)):typeof i.is=="string"?t=o.createElement(n,{is:i.is}):(t=o.createElement(n),n==="select"&&(o=t,i.multiple?o.multiple=!0:i.size&&(o.size=i.size))):t=o.createElementNS(t,n),t[Li]=e,t[sl]=i,Sy(t,e,!1,!1),e.stateNode=t;e:{switch(o=rp(n,i),n){case"dialog":bt("cancel",t),bt("close",t),r=i;break;case"iframe":case"object":case"embed":bt("load",t),r=i;break;case"video":case"audio":for(r=0;r<za.length;r++)bt(za[r],t);r=i;break;case"source":bt("error",t),r=i;break;case"img":case"image":case"link":bt("error",t),bt("load",t),r=i;break;case"details":bt("toggle",t),r=i;break;case"input":Hv(t,i),r=jh(t,i),bt("invalid",t);break;case"option":r=i;break;case"select":t._wrapperState={wasMultiple:!!i.multiple},r=kt({},i,{value:void 0}),bt("invalid",t);break;case"textarea":Gv(t,i),r=tp(t,i),bt("invalid",t);break;default:r=i}ip(n,r),a=r;for(s in a)if(a.hasOwnProperty(s)){var l=a[s];s==="style"?t1(t,l):s==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,l!=null&&Qx(t,l)):s==="children"?typeof l=="string"?(n!=="textarea"||l!=="")&&Ja(t,l):typeof l=="number"&&Ja(t,""+l):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(Za.hasOwnProperty(s)?l!=null&&s==="onScroll"&&bt("scroll",t):l!=null&&Hp(t,s,l,o))}switch(n){case"input":Ec(t),Vv(t,i,!1);break;case"textarea":Ec(t),Wv(t);break;case"option":i.value!=null&&t.setAttribute("value",""+Br(i.value));break;case"select":t.multiple=!!i.multiple,s=i.value,s!=null?_o(t,!!i.multiple,s,!1):i.defaultValue!=null&&_o(t,!!i.multiple,i.defaultValue,!0);break;default:typeof r.onClick=="function"&&(t.onclick=au)}switch(n){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}}i&&(e.flags|=4)}e.ref!==null&&(e.flags|=512,e.flags|=2097152)}return cn(e),null;case 6:if(t&&e.stateNode!=null)wy(t,e,t.memoizedProps,i);else{if(typeof i!="string"&&e.stateNode===null)throw Error(ne(166));if(n=ws(al.current),ws(Di.current),Oc(e)){if(i=e.stateNode,n=e.memoizedProps,i[Li]=e,(s=i.nodeValue!==n)&&(t=Bn,t!==null))switch(t.tag){case 3:Fc(i.nodeValue,n,(t.mode&1)!==0);break;case 5:t.memoizedProps.suppressHydrationWarning!==!0&&Fc(i.nodeValue,n,(t.mode&1)!==0)}s&&(e.flags|=4)}else i=(n.nodeType===9?n:n.ownerDocument).createTextNode(i),i[Li]=e,e.stateNode=i}return cn(e),null;case 13:if(St(Pt),i=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(Tt&&zn!==null&&(e.mode&1)!==0&&(e.flags&128)===0)V1(),Co(),e.flags|=98560,s=!1;else if(s=Oc(e),i!==null&&i.dehydrated!==null){if(t===null){if(!s)throw Error(ne(318));if(s=e.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(ne(317));s[Li]=e}else Co(),(e.flags&128)===0&&(e.memoizedState=null),e.flags|=4;cn(e),s=!1}else yi!==null&&(Op(yi),yi=null),s=!0;if(!s)return e.flags&65536?e:null}return(e.flags&128)!==0?(e.lanes=n,e):(i=i!==null,i!==(t!==null&&t.memoizedState!==null)&&i&&(e.child.flags|=8192,(e.mode&1)!==0&&(t===null||(Pt.current&1)!==0?Xt===0&&(Xt=3):Mm())),e.updateQueue!==null&&(e.flags|=4),cn(e),null);case 4:return Po(),Pp(t,e),t===null&&il(e.stateNode.containerInfo),cn(e),null;case 10:return om(e.type._context),cn(e),null;case 17:return Pn(e.type)&&lu(),cn(e),null;case 19:if(St(Pt),s=e.memoizedState,s===null)return cn(e),null;if(i=(e.flags&128)!==0,o=s.rendering,o===null)if(i)La(s,!1);else{if(Xt!==0||t!==null&&(t.flags&128)!==0)for(t=e.child;t!==null;){if(o=mu(t),o!==null){for(e.flags|=128,La(s,!1),i=o.updateQueue,i!==null&&(e.updateQueue=i,e.flags|=4),e.subtreeFlags=0,i=n,n=e.child;n!==null;)s=n,t=i,s.flags&=14680066,o=s.alternate,o===null?(s.childLanes=0,s.lanes=t,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=o.childLanes,s.lanes=o.lanes,s.child=o.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=o.memoizedProps,s.memoizedState=o.memoizedState,s.updateQueue=o.updateQueue,s.type=o.type,t=o.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),n=n.sibling;return xt(Pt,Pt.current&1|2),e.child}t=t.sibling}s.tail!==null&&zt()>ko&&(e.flags|=128,i=!0,La(s,!1),e.lanes=4194304)}else{if(!i)if(t=mu(o),t!==null){if(e.flags|=128,i=!0,n=t.updateQueue,n!==null&&(e.updateQueue=n,e.flags|=4),La(s,!0),s.tail===null&&s.tailMode==="hidden"&&!o.alternate&&!Tt)return cn(e),null}else 2*zt()-s.renderingStartTime>ko&&n!==1073741824&&(e.flags|=128,i=!0,La(s,!1),e.lanes=4194304);s.isBackwards?(o.sibling=e.child,e.child=o):(n=s.last,n!==null?n.sibling=o:e.child=o,s.last=o)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=zt(),e.sibling=null,n=Pt.current,xt(Pt,i?n&1|2:n&1),e):(cn(e),null);case 22:case 23:return Sm(),i=e.memoizedState!==null,t!==null&&t.memoizedState!==null!==i&&(e.flags|=8192),i&&(e.mode&1)!==0?(On&1073741824)!==0&&(cn(e),e.subtreeFlags&6&&(e.flags|=8192)):cn(e),null;case 24:return null;case 25:return null}throw Error(ne(156,e.tag))}function Q3(t,e){switch(nm(e),e.tag){case 1:return Pn(e.type)&&lu(),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return Po(),St(Rn),St(dn),dm(),t=e.flags,(t&65536)!==0&&(t&128)===0?(e.flags=t&-65537|128,e):null;case 5:return um(e),null;case 13:if(St(Pt),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(ne(340));Co()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return St(Pt),null;case 4:return Po(),null;case 10:return om(e.type._context),null;case 22:case 23:return Sm(),null;case 24:return null;default:return null}}var Hc=!1,un=!1,eE=typeof WeakSet=="function"?WeakSet:Set,_e=null;function xo(t,e){var n=t.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(i){Dt(t,e,i)}else n.current=null}function Ip(t,e,n){try{n()}catch(i){Dt(t,e,i)}}var Nx=!1;function tE(t,e){if(pp=ru,t=R1(),em(t)){if("selectionStart"in t)var n={start:t.selectionStart,end:t.selectionEnd};else e:{n=(n=t.ownerDocument)&&n.defaultView||window;var i=n.getSelection&&n.getSelection();if(i&&i.rangeCount!==0){n=i.anchorNode;var r=i.anchorOffset,s=i.focusNode;i=i.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var o=0,a=-1,l=-1,c=0,d=0,f=t,h=null;t:for(;;){for(var p;f!==n||r!==0&&f.nodeType!==3||(a=o+r),f!==s||i!==0&&f.nodeType!==3||(l=o+i),f.nodeType===3&&(o+=f.nodeValue.length),(p=f.firstChild)!==null;)h=f,f=p;for(;;){if(f===t)break t;if(h===n&&++c===r&&(a=o),h===s&&++d===i&&(l=o),(p=f.nextSibling)!==null)break;f=h,h=f.parentNode}f=p}n=a===-1||l===-1?null:{start:a,end:l}}else n=null}n=n||{start:0,end:0}}else n=null;for(mp={focusedElem:t,selectionRange:n},ru=!1,_e=e;_e!==null;)if(e=_e,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,_e=t;else for(;_e!==null;){e=_e;try{var v=e.alternate;if((e.flags&1024)!==0)switch(e.tag){case 0:case 11:case 15:break;case 1:if(v!==null){var y=v.memoizedProps,m=v.memoizedState,u=e.stateNode,g=u.getSnapshotBeforeUpdate(e.elementType===e.type?y:vi(e.type,y),m);u.__reactInternalSnapshotBeforeUpdate=g}break;case 3:var x=e.stateNode.containerInfo;x.nodeType===1?x.textContent="":x.nodeType===9&&x.documentElement&&x.removeChild(x.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(ne(163))}}catch(_){Dt(e,e.return,_)}if(t=e.sibling,t!==null){t.return=e.return,_e=t;break}_e=e.return}return v=Nx,Nx=!1,v}function qa(t,e,n){var i=e.updateQueue;if(i=i!==null?i.lastEffect:null,i!==null){var r=i=i.next;do{if((r.tag&t)===t){var s=r.destroy;r.destroy=void 0,s!==void 0&&Ip(e,n,s)}r=r.next}while(r!==i)}}function Iu(t,e){if(e=e.updateQueue,e=e!==null?e.lastEffect:null,e!==null){var n=e=e.next;do{if((n.tag&t)===t){var i=n.create;n.destroy=i()}n=n.next}while(n!==e)}}function kp(t){var e=t.ref;if(e!==null){var n=t.stateNode;t.tag,t=n,typeof e=="function"?e(t):e.current=t}}function Ey(t){var e=t.alternate;e!==null&&(t.alternate=null,Ey(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&(delete e[Li],delete e[sl],delete e[xp],delete e[F3],delete e[O3])),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}function Ty(t){return t.tag===5||t.tag===3||t.tag===4}function Dx(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||Ty(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function Lp(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.nodeType===8?n.parentNode.insertBefore(t,e):n.insertBefore(t,e):(n.nodeType===8?(e=n.parentNode,e.insertBefore(t,n)):(e=n,e.appendChild(t)),n=n._reactRootContainer,n!=null||e.onclick!==null||(e.onclick=au));else if(i!==4&&(t=t.child,t!==null))for(Lp(t,e,n),t=t.sibling;t!==null;)Lp(t,e,n),t=t.sibling}function Np(t,e,n){var i=t.tag;if(i===5||i===6)t=t.stateNode,e?n.insertBefore(t,e):n.appendChild(t);else if(i!==4&&(t=t.child,t!==null))for(Np(t,e,n),t=t.sibling;t!==null;)Np(t,e,n),t=t.sibling}var nn=null,xi=!1;function Er(t,e,n){for(n=n.child;n!==null;)Ay(t,e,n),n=n.sibling}function Ay(t,e,n){if(Ni&&typeof Ni.onCommitFiberUnmount=="function")try{Ni.onCommitFiberUnmount(Mu,n)}catch{}switch(n.tag){case 5:un||xo(n,e);case 6:var i=nn,r=xi;nn=null,Er(t,e,n),nn=i,xi=r,nn!==null&&(xi?(t=nn,n=n.stateNode,t.nodeType===8?t.parentNode.removeChild(n):t.removeChild(n)):nn.removeChild(n.stateNode));break;case 18:nn!==null&&(xi?(t=nn,n=n.stateNode,t.nodeType===8?Fh(t.parentNode,n):t.nodeType===1&&Fh(t,n),el(t)):Fh(nn,n.stateNode));break;case 4:i=nn,r=xi,nn=n.stateNode.containerInfo,xi=!0,Er(t,e,n),nn=i,xi=r;break;case 0:case 11:case 14:case 15:if(!un&&(i=n.updateQueue,i!==null&&(i=i.lastEffect,i!==null))){r=i=i.next;do{var s=r,o=s.destroy;s=s.tag,o!==void 0&&((s&2)!==0||(s&4)!==0)&&Ip(n,e,o),r=r.next}while(r!==i)}Er(t,e,n);break;case 1:if(!un&&(xo(n,e),i=n.stateNode,typeof i.componentWillUnmount=="function"))try{i.props=n.memoizedProps,i.state=n.memoizedState,i.componentWillUnmount()}catch(a){Dt(n,e,a)}Er(t,e,n);break;case 21:Er(t,e,n);break;case 22:n.mode&1?(un=(i=un)||n.memoizedState!==null,Er(t,e,n),un=i):Er(t,e,n);break;default:Er(t,e,n)}}function Ux(t){var e=t.updateQueue;if(e!==null){t.updateQueue=null;var n=t.stateNode;n===null&&(n=t.stateNode=new eE),e.forEach(function(i){var r=uE.bind(null,t,i);n.has(i)||(n.add(i),i.then(r,r))})}}function gi(t,e){var n=e.deletions;if(n!==null)for(var i=0;i<n.length;i++){var r=n[i];try{var s=t,o=e,a=o;e:for(;a!==null;){switch(a.tag){case 5:nn=a.stateNode,xi=!1;break e;case 3:nn=a.stateNode.containerInfo,xi=!0;break e;case 4:nn=a.stateNode.containerInfo,xi=!0;break e}a=a.return}if(nn===null)throw Error(ne(160));Ay(s,o,r),nn=null,xi=!1;var l=r.alternate;l!==null&&(l.return=null),r.return=null}catch(c){Dt(r,e,c)}}if(e.subtreeFlags&12854)for(e=e.child;e!==null;)Cy(e,t),e=e.sibling}function Cy(t,e){var n=t.alternate,i=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(gi(e,t),Ii(t),i&4){try{qa(3,t,t.return),Iu(3,t)}catch(y){Dt(t,t.return,y)}try{qa(5,t,t.return)}catch(y){Dt(t,t.return,y)}}break;case 1:gi(e,t),Ii(t),i&512&&n!==null&&xo(n,n.return);break;case 5:if(gi(e,t),Ii(t),i&512&&n!==null&&xo(n,n.return),t.flags&32){var r=t.stateNode;try{Ja(r,"")}catch(y){Dt(t,t.return,y)}}if(i&4&&(r=t.stateNode,r!=null)){var s=t.memoizedProps,o=n!==null?n.memoizedProps:s,a=t.type,l=t.updateQueue;if(t.updateQueue=null,l!==null)try{a==="input"&&s.type==="radio"&&s.name!=null&&Jx(r,s),rp(a,o);var c=rp(a,s);for(o=0;o<l.length;o+=2){var d=l[o],f=l[o+1];d==="style"?t1(r,f):d==="dangerouslySetInnerHTML"?Qx(r,f):d==="children"?Ja(r,f):Hp(r,d,f,c)}switch(a){case"input":Qh(r,s);break;case"textarea":Kx(r,s);break;case"select":var h=r._wrapperState.wasMultiple;r._wrapperState.wasMultiple=!!s.multiple;var p=s.value;p!=null?_o(r,!!s.multiple,p,!1):h!==!!s.multiple&&(s.defaultValue!=null?_o(r,!!s.multiple,s.defaultValue,!0):_o(r,!!s.multiple,s.multiple?[]:"",!1))}r[sl]=s}catch(y){Dt(t,t.return,y)}}break;case 6:if(gi(e,t),Ii(t),i&4){if(t.stateNode===null)throw Error(ne(162));r=t.stateNode,s=t.memoizedProps;try{r.nodeValue=s}catch(y){Dt(t,t.return,y)}}break;case 3:if(gi(e,t),Ii(t),i&4&&n!==null&&n.memoizedState.isDehydrated)try{el(e.containerInfo)}catch(y){Dt(t,t.return,y)}break;case 4:gi(e,t),Ii(t);break;case 13:gi(e,t),Ii(t),r=t.child,r.flags&8192&&(s=r.memoizedState!==null,r.stateNode.isHidden=s,!s||r.alternate!==null&&r.alternate.memoizedState!==null||(_m=zt())),i&4&&Ux(t);break;case 22:if(d=n!==null&&n.memoizedState!==null,t.mode&1?(un=(c=un)||d,gi(e,t),un=c):gi(e,t),Ii(t),i&8192){if(c=t.memoizedState!==null,(t.stateNode.isHidden=c)&&!d&&(t.mode&1)!==0)for(_e=t,d=t.child;d!==null;){for(f=_e=d;_e!==null;){switch(h=_e,p=h.child,h.tag){case 0:case 11:case 14:case 15:qa(4,h,h.return);break;case 1:xo(h,h.return);var v=h.stateNode;if(typeof v.componentWillUnmount=="function"){i=h,n=h.return;try{e=i,v.props=e.memoizedProps,v.state=e.memoizedState,v.componentWillUnmount()}catch(y){Dt(i,n,y)}}break;case 5:xo(h,h.return);break;case 22:if(h.memoizedState!==null){Ox(f);continue}}p!==null?(p.return=h,_e=p):Ox(f)}d=d.sibling}e:for(d=null,f=t;;){if(f.tag===5){if(d===null){d=f;try{r=f.stateNode,c?(s=r.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(a=f.stateNode,l=f.memoizedProps.style,o=l!=null&&l.hasOwnProperty("display")?l.display:null,a.style.display=e1("display",o))}catch(y){Dt(t,t.return,y)}}}else if(f.tag===6){if(d===null)try{f.stateNode.nodeValue=c?"":f.memoizedProps}catch(y){Dt(t,t.return,y)}}else if((f.tag!==22&&f.tag!==23||f.memoizedState===null||f===t)&&f.child!==null){f.child.return=f,f=f.child;continue}if(f===t)break e;for(;f.sibling===null;){if(f.return===null||f.return===t)break e;d===f&&(d=null),f=f.return}d===f&&(d=null),f.sibling.return=f.return,f=f.sibling}}break;case 19:gi(e,t),Ii(t),i&4&&Ux(t);break;case 21:break;default:gi(e,t),Ii(t)}}function Ii(t){var e=t.flags;if(e&2){try{e:{for(var n=t.return;n!==null;){if(Ty(n)){var i=n;break e}n=n.return}throw Error(ne(160))}switch(i.tag){case 5:var r=i.stateNode;i.flags&32&&(Ja(r,""),i.flags&=-33);var s=Dx(t);Np(t,s,r);break;case 3:case 4:var o=i.stateNode.containerInfo,a=Dx(t);Lp(t,a,o);break;default:throw Error(ne(161))}}catch(l){Dt(t,t.return,l)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function nE(t,e,n){_e=t,Ry(t,e,n)}function Ry(t,e,n){for(var i=(t.mode&1)!==0;_e!==null;){var r=_e,s=r.child;if(r.tag===22&&i){var o=r.memoizedState!==null||Hc;if(!o){var a=r.alternate,l=a!==null&&a.memoizedState!==null||un;a=Hc;var c=un;if(Hc=o,(un=l)&&!c)for(_e=r;_e!==null;)o=_e,l=o.child,o.tag===22&&o.memoizedState!==null?zx(r):l!==null?(l.return=o,_e=l):zx(r);for(;s!==null;)_e=s,Ry(s,e,n),s=s.sibling;_e=r,Hc=a,un=c}Fx(t,e,n)}else(r.subtreeFlags&8772)!==0&&s!==null?(s.return=r,_e=s):Fx(t,e,n)}}function Fx(t){for(;_e!==null;){var e=_e;if((e.flags&8772)!==0){var n=e.alternate;try{if((e.flags&8772)!==0)switch(e.tag){case 0:case 11:case 15:un||Iu(5,e);break;case 1:var i=e.stateNode;if(e.flags&4&&!un)if(n===null)i.componentDidMount();else{var r=e.elementType===e.type?n.memoizedProps:vi(e.type,n.memoizedProps);i.componentDidUpdate(r,n.memoizedState,i.__reactInternalSnapshotBeforeUpdate)}var s=e.updateQueue;s!==null&&bx(e,s,i);break;case 3:var o=e.updateQueue;if(o!==null){if(n=null,e.child!==null)switch(e.child.tag){case 5:n=e.child.stateNode;break;case 1:n=e.child.stateNode}bx(e,o,n)}break;case 5:var a=e.stateNode;if(n===null&&e.flags&4){n=a;var l=e.memoizedProps;switch(e.type){case"button":case"input":case"select":case"textarea":l.autoFocus&&n.focus();break;case"img":l.src&&(n.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(e.memoizedState===null){var c=e.alternate;if(c!==null){var d=c.memoizedState;if(d!==null){var f=d.dehydrated;f!==null&&el(f)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(ne(163))}un||e.flags&512&&kp(e)}catch(h){Dt(e,e.return,h)}}if(e===t){_e=null;break}if(n=e.sibling,n!==null){n.return=e.return,_e=n;break}_e=e.return}}function Ox(t){for(;_e!==null;){var e=_e;if(e===t){_e=null;break}var n=e.sibling;if(n!==null){n.return=e.return,_e=n;break}_e=e.return}}function zx(t){for(;_e!==null;){var e=_e;try{switch(e.tag){case 0:case 11:case 15:var n=e.return;try{Iu(4,e)}catch(l){Dt(e,n,l)}break;case 1:var i=e.stateNode;if(typeof i.componentDidMount=="function"){var r=e.return;try{i.componentDidMount()}catch(l){Dt(e,r,l)}}var s=e.return;try{kp(e)}catch(l){Dt(e,s,l)}break;case 5:var o=e.return;try{kp(e)}catch(l){Dt(e,o,l)}}}catch(l){Dt(e,e.return,l)}if(e===t){_e=null;break}var a=e.sibling;if(a!==null){a.return=e.return,_e=a;break}_e=e.return}}var iE=Math.ceil,xu=ar.ReactCurrentDispatcher,xm=ar.ReactCurrentOwner,ni=ar.ReactCurrentBatchConfig,it=0,Jt=null,Ht=null,rn=0,On=0,yo=Gr(0),Xt=0,dl=null,Ps=0,ku=0,ym=0,$a=null,An=null,_m=0,ko=1/0,ji=null,yu=!1,Dp=null,Fr=null,Vc=!1,Ir=null,_u=0,Ya=0,Up=null,Jc=-1,Kc=0;function Sn(){return(it&6)!==0?zt():Jc!==-1?Jc:Jc=zt()}function Or(t){return(t.mode&1)===0?1:(it&2)!==0&&rn!==0?rn&-rn:B3.transition!==null?(Kc===0&&(Kc=h1()),Kc):(t=dt,t!==0||(t=window.event,t=t===void 0?16:_1(t.type)),t)}function bi(t,e,n,i){if(50<Ya)throw Ya=0,Up=null,Error(ne(185));fl(t,n,i),((it&2)===0||t!==Jt)&&(t===Jt&&((it&2)===0&&(ku|=n),Xt===4&&Rr(t,rn)),In(t,i),n===1&&it===0&&(e.mode&1)===0&&(ko=zt()+500,Cu&&Wr()))}function In(t,e){var n=t.callbackNode;Vw(t,e);var i=iu(t,t===Jt?rn:0);if(i===0)n!==null&&$v(n),t.callbackNode=null,t.callbackPriority=0;else if(e=i&-i,t.callbackPriority!==e){if(n!=null&&$v(n),e===1)t.tag===0?z3(Bx.bind(null,t)):z1(Bx.bind(null,t)),D3(function(){(it&6)===0&&Wr()}),n=null;else{switch(p1(i)){case 1:n=qp;break;case 4:n=d1;break;case 16:n=nu;break;case 536870912:n=f1;break;default:n=nu}n=Fy(n,Py.bind(null,t))}t.callbackPriority=e,t.callbackNode=n}}function Py(t,e){if(Jc=-1,Kc=0,(it&6)!==0)throw Error(ne(327));var n=t.callbackNode;if(Eo()&&t.callbackNode!==n)return null;var i=iu(t,t===Jt?rn:0);if(i===0)return null;if((i&30)!==0||(i&t.expiredLanes)!==0||e)e=bu(t,i);else{e=i;var r=it;it|=2;var s=ky();(Jt!==t||rn!==e)&&(ji=null,ko=zt()+500,Es(t,e));do try{oE();break}catch(a){Iy(t,a)}while(!0);sm(),xu.current=s,it=r,Ht!==null?e=0:(Jt=null,rn=0,e=Xt)}if(e!==0){if(e===2&&(r=cp(t),r!==0&&(i=r,e=Fp(t,r))),e===1)throw n=dl,Es(t,0),Rr(t,i),In(t,zt()),n;if(e===6)Rr(t,i);else{if(r=t.current.alternate,(i&30)===0&&!rE(r)&&(e=bu(t,i),e===2&&(s=cp(t),s!==0&&(i=s,e=Fp(t,s))),e===1))throw n=dl,Es(t,0),Rr(t,i),In(t,zt()),n;switch(t.finishedWork=r,t.finishedLanes=i,e){case 0:case 1:throw Error(ne(345));case 2:bs(t,An,ji);break;case 3:if(Rr(t,i),(i&130023424)===i&&(e=_m+500-zt(),10<e)){if(iu(t,0)!==0)break;if(r=t.suspendedLanes,(r&i)!==i){Sn(),t.pingedLanes|=t.suspendedLanes&r;break}t.timeoutHandle=vp(bs.bind(null,t,An,ji),e);break}bs(t,An,ji);break;case 4:if(Rr(t,i),(i&4194240)===i)break;for(e=t.eventTimes,r=-1;0<i;){var o=31-_i(i);s=1<<o,o=e[o],o>r&&(r=o),i&=~s}if(i=r,i=zt()-i,i=(120>i?120:480>i?480:1080>i?1080:1920>i?1920:3e3>i?3e3:4320>i?4320:1960*iE(i/1960))-i,10<i){t.timeoutHandle=vp(bs.bind(null,t,An,ji),i);break}bs(t,An,ji);break;case 5:bs(t,An,ji);break;default:throw Error(ne(329))}}}return In(t,zt()),t.callbackNode===n?Py.bind(null,t):null}function Fp(t,e){var n=$a;return t.current.memoizedState.isDehydrated&&(Es(t,e).flags|=256),t=bu(t,e),t!==2&&(e=An,An=n,e!==null&&Op(e)),t}function Op(t){An===null?An=t:An.push.apply(An,t)}function rE(t){for(var e=t;;){if(e.flags&16384){var n=e.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var i=0;i<n.length;i++){var r=n[i],s=r.getSnapshot;r=r.value;try{if(!Si(s(),r))return!1}catch{return!1}}}if(n=e.child,e.subtreeFlags&16384&&n!==null)n.return=e,e=n;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function Rr(t,e){for(e&=~ym,e&=~ku,t.suspendedLanes|=e,t.pingedLanes&=~e,t=t.expirationTimes;0<e;){var n=31-_i(e),i=1<<n;t[n]=-1,e&=~i}}function Bx(t){if((it&6)!==0)throw Error(ne(327));Eo();var e=iu(t,0);if((e&1)===0)return In(t,zt()),null;var n=bu(t,e);if(t.tag!==0&&n===2){var i=cp(t);i!==0&&(e=i,n=Fp(t,i))}if(n===1)throw n=dl,Es(t,0),Rr(t,e),In(t,zt()),n;if(n===6)throw Error(ne(345));return t.finishedWork=t.current.alternate,t.finishedLanes=e,bs(t,An,ji),In(t,zt()),null}function bm(t,e){var n=it;it|=1;try{return t(e)}finally{it=n,it===0&&(ko=zt()+500,Cu&&Wr())}}function Is(t){Ir!==null&&Ir.tag===0&&(it&6)===0&&Eo();var e=it;it|=1;var n=ni.transition,i=dt;try{if(ni.transition=null,dt=1,t)return t()}finally{dt=i,ni.transition=n,it=e,(it&6)===0&&Wr()}}function Sm(){On=yo.current,St(yo)}function Es(t,e){t.finishedWork=null,t.finishedLanes=0;var n=t.timeoutHandle;if(n!==-1&&(t.timeoutHandle=-1,N3(n)),Ht!==null)for(n=Ht.return;n!==null;){var i=n;switch(nm(i),i.tag){case 1:i=i.type.childContextTypes,i!=null&&lu();break;case 3:Po(),St(Rn),St(dn),dm();break;case 5:um(i);break;case 4:Po();break;case 13:St(Pt);break;case 19:St(Pt);break;case 10:om(i.type._context);break;case 22:case 23:Sm()}n=n.return}if(Jt=t,Ht=t=zr(t.current,null),rn=On=e,Xt=0,dl=null,ym=ku=Ps=0,An=$a=null,Ms!==null){for(e=0;e<Ms.length;e++)if(n=Ms[e],i=n.interleaved,i!==null){n.interleaved=null;var r=i.next,s=n.pending;if(s!==null){var o=s.next;s.next=r,i.next=o}n.pending=i}Ms=null}return t}function Iy(t,e){do{var n=Ht;try{if(sm(),$c.current=vu,gu){for(var i=It.memoizedState;i!==null;){var r=i.queue;r!==null&&(r.pending=null),i=i.next}gu=!1}if(Rs=0,Zt=Wt=It=null,Xa=!1,ll=0,xm.current=null,n===null||n.return===null){Xt=1,dl=e,Ht=null;break}e:{var s=t,o=n.return,a=n,l=e;if(e=rn,a.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){var c=l,d=a,f=d.tag;if((d.mode&1)===0&&(f===0||f===11||f===15)){var h=d.alternate;h?(d.updateQueue=h.updateQueue,d.memoizedState=h.memoizedState,d.lanes=h.lanes):(d.updateQueue=null,d.memoizedState=null)}var p=Ax(o);if(p!==null){p.flags&=-257,Cx(p,o,a,s,e),p.mode&1&&Tx(s,c,e),e=p,l=c;var v=e.updateQueue;if(v===null){var y=new Set;y.add(l),e.updateQueue=y}else v.add(l);break e}else{if((e&1)===0){Tx(s,c,e),Mm();break e}l=Error(ne(426))}}else if(Tt&&a.mode&1){var m=Ax(o);if(m!==null){(m.flags&65536)===0&&(m.flags|=256),Cx(m,o,a,s,e),im(Io(l,a));break e}}s=l=Io(l,a),Xt!==4&&(Xt=2),$a===null?$a=[s]:$a.push(s),s=o;do{switch(s.tag){case 3:s.flags|=65536,e&=-e,s.lanes|=e;var u=py(s,l,e);_x(s,u);break e;case 1:a=l;var g=s.type,x=s.stateNode;if((s.flags&128)===0&&(typeof g.getDerivedStateFromError=="function"||x!==null&&typeof x.componentDidCatch=="function"&&(Fr===null||!Fr.has(x)))){s.flags|=65536,e&=-e,s.lanes|=e;var _=my(s,a,e);_x(s,_);break e}}s=s.return}while(s!==null)}Ny(n)}catch(T){e=T,Ht===n&&n!==null&&(Ht=n=n.return);continue}break}while(!0)}function ky(){var t=xu.current;return xu.current=vu,t===null?vu:t}function Mm(){(Xt===0||Xt===3||Xt===2)&&(Xt=4),Jt===null||(Ps&268435455)===0&&(ku&268435455)===0||Rr(Jt,rn)}function bu(t,e){var n=it;it|=2;var i=ky();(Jt!==t||rn!==e)&&(ji=null,Es(t,e));do try{sE();break}catch(r){Iy(t,r)}while(!0);if(sm(),it=n,xu.current=i,Ht!==null)throw Error(ne(261));return Jt=null,rn=0,Xt}function sE(){for(;Ht!==null;)Ly(Ht)}function oE(){for(;Ht!==null&&!Lw();)Ly(Ht)}function Ly(t){var e=Uy(t.alternate,t,On);t.memoizedProps=t.pendingProps,e===null?Ny(t):Ht=e,xm.current=null}function Ny(t){var e=t;do{var n=e.alternate;if(t=e.return,(e.flags&32768)===0){if(n=j3(n,e,On),n!==null){Ht=n;return}}else{if(n=Q3(n,e),n!==null){n.flags&=32767,Ht=n;return}if(t!==null)t.flags|=32768,t.subtreeFlags=0,t.deletions=null;else{Xt=6,Ht=null;return}}if(e=e.sibling,e!==null){Ht=e;return}Ht=e=t}while(e!==null);Xt===0&&(Xt=5)}function bs(t,e,n){var i=dt,r=ni.transition;try{ni.transition=null,dt=1,aE(t,e,n,i)}finally{ni.transition=r,dt=i}return null}function aE(t,e,n,i){do Eo();while(Ir!==null);if((it&6)!==0)throw Error(ne(327));n=t.finishedWork;var r=t.finishedLanes;if(n===null)return null;if(t.finishedWork=null,t.finishedLanes=0,n===t.current)throw Error(ne(177));t.callbackNode=null,t.callbackPriority=0;var s=n.lanes|n.childLanes;if(Gw(t,s),t===Jt&&(Ht=Jt=null,rn=0),(n.subtreeFlags&2064)===0&&(n.flags&2064)===0||Vc||(Vc=!0,Fy(nu,function(){return Eo(),null})),s=(n.flags&15990)!==0,(n.subtreeFlags&15990)!==0||s){s=ni.transition,ni.transition=null;var o=dt;dt=1;var a=it;it|=4,xm.current=null,tE(t,n),Cy(n,t),R3(mp),ru=!!pp,mp=pp=null,t.current=n,nE(n,t,r),Nw(),it=a,dt=o,ni.transition=s}else t.current=n;if(Vc&&(Vc=!1,Ir=t,_u=r),s=t.pendingLanes,s===0&&(Fr=null),Fw(n.stateNode,i),In(t,zt()),e!==null)for(i=t.onRecoverableError,n=0;n<e.length;n++)r=e[n],i(r.value,{componentStack:r.stack,digest:r.digest});if(yu)throw yu=!1,t=Dp,Dp=null,t;return(_u&1)!==0&&t.tag!==0&&Eo(),s=t.pendingLanes,(s&1)!==0?t===Up?Ya++:(Ya=0,Up=t):Ya=0,Wr(),null}function Eo(){if(Ir!==null){var t=p1(_u),e=ni.transition,n=dt;try{if(ni.transition=null,dt=16>t?16:t,Ir===null)var i=!1;else{if(t=Ir,Ir=null,_u=0,(it&6)!==0)throw Error(ne(331));var r=it;for(it|=4,_e=t.current;_e!==null;){var s=_e,o=s.child;if((_e.flags&16)!==0){var a=s.deletions;if(a!==null){for(var l=0;l<a.length;l++){var c=a[l];for(_e=c;_e!==null;){var d=_e;switch(d.tag){case 0:case 11:case 15:qa(8,d,s)}var f=d.child;if(f!==null)f.return=d,_e=f;else for(;_e!==null;){d=_e;var h=d.sibling,p=d.return;if(Ey(d),d===c){_e=null;break}if(h!==null){h.return=p,_e=h;break}_e=p}}}var v=s.alternate;if(v!==null){var y=v.child;if(y!==null){v.child=null;do{var m=y.sibling;y.sibling=null,y=m}while(y!==null)}}_e=s}}if((s.subtreeFlags&2064)!==0&&o!==null)o.return=s,_e=o;else e:for(;_e!==null;){if(s=_e,(s.flags&2048)!==0)switch(s.tag){case 0:case 11:case 15:qa(9,s,s.return)}var u=s.sibling;if(u!==null){u.return=s.return,_e=u;break e}_e=s.return}}var g=t.current;for(_e=g;_e!==null;){o=_e;var x=o.child;if((o.subtreeFlags&2064)!==0&&x!==null)x.return=o,_e=x;else e:for(o=g;_e!==null;){if(a=_e,(a.flags&2048)!==0)try{switch(a.tag){case 0:case 11:case 15:Iu(9,a)}}catch(T){Dt(a,a.return,T)}if(a===o){_e=null;break e}var _=a.sibling;if(_!==null){_.return=a.return,_e=_;break e}_e=a.return}}if(it=r,Wr(),Ni&&typeof Ni.onPostCommitFiberRoot=="function")try{Ni.onPostCommitFiberRoot(Mu,t)}catch{}i=!0}return i}finally{dt=n,ni.transition=e}}return!1}function Hx(t,e,n){e=Io(n,e),e=py(t,e,1),t=Ur(t,e,1),e=Sn(),t!==null&&(fl(t,1,e),In(t,e))}function Dt(t,e,n){if(t.tag===3)Hx(t,t,n);else for(;e!==null;){if(e.tag===3){Hx(e,t,n);break}else if(e.tag===1){var i=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Fr===null||!Fr.has(i))){t=Io(n,t),t=my(e,t,1),e=Ur(e,t,1),t=Sn(),e!==null&&(fl(e,1,t),In(e,t));break}}e=e.return}}function lE(t,e,n){var i=t.pingCache;i!==null&&i.delete(e),e=Sn(),t.pingedLanes|=t.suspendedLanes&n,Jt===t&&(rn&n)===n&&(Xt===4||Xt===3&&(rn&130023424)===rn&&500>zt()-_m?Es(t,0):ym|=n),In(t,e)}function Dy(t,e){e===0&&((t.mode&1)===0?e=1:(e=Cc,Cc<<=1,(Cc&130023424)===0&&(Cc=4194304)));var n=Sn();t=sr(t,e),t!==null&&(fl(t,e,n),In(t,n))}function cE(t){var e=t.memoizedState,n=0;e!==null&&(n=e.retryLane),Dy(t,n)}function uE(t,e){var n=0;switch(t.tag){case 13:var i=t.stateNode,r=t.memoizedState;r!==null&&(n=r.retryLane);break;case 19:i=t.stateNode;break;default:throw Error(ne(314))}i!==null&&i.delete(e),Dy(t,n)}var Uy;Uy=function(t,e,n){if(t!==null)if(t.memoizedProps!==e.pendingProps||Rn.current)Cn=!0;else{if((t.lanes&n)===0&&(e.flags&128)===0)return Cn=!1,K3(t,e,n);Cn=(t.flags&131072)!==0}else Cn=!1,Tt&&(e.flags&1048576)!==0&&B1(e,du,e.index);switch(e.lanes=0,e.tag){case 2:var i=e.type;Zc(t,e),t=e.pendingProps;var r=Ao(e,dn.current);wo(e,n),r=hm(null,e,i,t,r,n);var s=pm();return e.flags|=1,typeof r=="object"&&r!==null&&typeof r.render=="function"&&r.$$typeof===void 0?(e.tag=1,e.memoizedState=null,e.updateQueue=null,Pn(i)?(s=!0,cu(e)):s=!1,e.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,lm(e),r.updater=Pu,e.stateNode=r,r._reactInternals=e,wp(e,i,t,n),e=Ap(null,e,i,!0,s,n)):(e.tag=0,Tt&&s&&tm(e),bn(null,e,r,n),e=e.child),e;case 16:i=e.elementType;e:{switch(Zc(t,e),t=e.pendingProps,r=i._init,i=r(i._payload),e.type=i,r=e.tag=fE(i),t=vi(i,t),r){case 0:e=Tp(null,e,i,t,n);break e;case 1:e=Ix(null,e,i,t,n);break e;case 11:e=Rx(null,e,i,t,n);break e;case 14:e=Px(null,e,i,vi(i.type,t),n);break e}throw Error(ne(306,i,""))}return e;case 0:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:vi(i,r),Tp(t,e,i,r,n);case 1:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:vi(i,r),Ix(t,e,i,r,n);case 3:e:{if(yy(e),t===null)throw Error(ne(387));i=e.pendingProps,s=e.memoizedState,r=s.element,q1(t,e),pu(e,i,null,n);var o=e.memoizedState;if(i=o.element,s.isDehydrated)if(s={element:i,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},e.updateQueue.baseState=s,e.memoizedState=s,e.flags&256){r=Io(Error(ne(423)),e),e=kx(t,e,i,n,r);break e}else if(i!==r){r=Io(Error(ne(424)),e),e=kx(t,e,i,n,r);break e}else for(zn=Dr(e.stateNode.containerInfo.firstChild),Bn=e,Tt=!0,yi=null,n=W1(e,null,i,n),e.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Co(),i===r){e=or(t,e,n);break e}bn(t,e,i,n)}e=e.child}return e;case 5:return $1(e),t===null&&bp(e),i=e.type,r=e.pendingProps,s=t!==null?t.memoizedProps:null,o=r.children,gp(i,r)?o=null:s!==null&&gp(i,s)&&(e.flags|=32),xy(t,e),bn(t,e,o,n),e.child;case 6:return t===null&&bp(e),null;case 13:return _y(t,e,n);case 4:return cm(e,e.stateNode.containerInfo),i=e.pendingProps,t===null?e.child=Ro(e,null,i,n):bn(t,e,i,n),e.child;case 11:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:vi(i,r),Rx(t,e,i,r,n);case 7:return bn(t,e,e.pendingProps,n),e.child;case 8:return bn(t,e,e.pendingProps.children,n),e.child;case 12:return bn(t,e,e.pendingProps.children,n),e.child;case 10:e:{if(i=e.type._context,r=e.pendingProps,s=e.memoizedProps,o=r.value,xt(fu,i._currentValue),i._currentValue=o,s!==null)if(Si(s.value,o)){if(s.children===r.children&&!Rn.current){e=or(t,e,n);break e}}else for(s=e.child,s!==null&&(s.return=e);s!==null;){var a=s.dependencies;if(a!==null){o=s.child;for(var l=a.firstContext;l!==null;){if(l.context===i){if(s.tag===1){l=nr(-1,n&-n),l.tag=2;var c=s.updateQueue;if(c!==null){c=c.shared;var d=c.pending;d===null?l.next=l:(l.next=d.next,d.next=l),c.pending=l}}s.lanes|=n,l=s.alternate,l!==null&&(l.lanes|=n),Sp(s.return,n,e),a.lanes|=n;break}l=l.next}}else if(s.tag===10)o=s.type===e.type?null:s.child;else if(s.tag===18){if(o=s.return,o===null)throw Error(ne(341));o.lanes|=n,a=o.alternate,a!==null&&(a.lanes|=n),Sp(o,n,e),o=s.sibling}else o=s.child;if(o!==null)o.return=s;else for(o=s;o!==null;){if(o===e){o=null;break}if(s=o.sibling,s!==null){s.return=o.return,o=s;break}o=o.return}s=o}bn(t,e,r.children,n),e=e.child}return e;case 9:return r=e.type,i=e.pendingProps.children,wo(e,n),r=ii(r),i=i(r),e.flags|=1,bn(t,e,i,n),e.child;case 14:return i=e.type,r=vi(i,e.pendingProps),r=vi(i.type,r),Px(t,e,i,r,n);case 15:return gy(t,e,e.type,e.pendingProps,n);case 17:return i=e.type,r=e.pendingProps,r=e.elementType===i?r:vi(i,r),Zc(t,e),e.tag=1,Pn(i)?(t=!0,cu(e)):t=!1,wo(e,n),hy(e,i,r),wp(e,i,r,n),Ap(null,e,i,!0,t,n);case 19:return by(t,e,n);case 22:return vy(t,e,n)}throw Error(ne(156,e.tag))};function Fy(t,e){return u1(t,e)}function dE(t,e,n,i){this.tag=t,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ti(t,e,n,i){return new dE(t,e,n,i)}function wm(t){return t=t.prototype,!(!t||!t.isReactComponent)}function fE(t){if(typeof t=="function")return wm(t)?1:0;if(t!=null){if(t=t.$$typeof,t===Gp)return 11;if(t===Wp)return 14}return 2}function zr(t,e){var n=t.alternate;return n===null?(n=ti(t.tag,e,t.key,t.mode),n.elementType=t.elementType,n.type=t.type,n.stateNode=t.stateNode,n.alternate=t,t.alternate=n):(n.pendingProps=e,n.type=t.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=t.flags&14680064,n.childLanes=t.childLanes,n.lanes=t.lanes,n.child=t.child,n.memoizedProps=t.memoizedProps,n.memoizedState=t.memoizedState,n.updateQueue=t.updateQueue,e=t.dependencies,n.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},n.sibling=t.sibling,n.index=t.index,n.ref=t.ref,n}function jc(t,e,n,i,r,s){var o=2;if(i=t,typeof t=="function")wm(t)&&(o=1);else if(typeof t=="string")o=5;else e:switch(t){case lo:return Ts(n.children,r,s,e);case Vp:o=8,r|=8;break;case Yh:return t=ti(12,n,e,r|2),t.elementType=Yh,t.lanes=s,t;case Zh:return t=ti(13,n,e,r),t.elementType=Zh,t.lanes=s,t;case Jh:return t=ti(19,n,e,r),t.elementType=Jh,t.lanes=s,t;case $x:return Lu(n,r,s,e);default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case Xx:o=10;break e;case qx:o=9;break e;case Gp:o=11;break e;case Wp:o=14;break e;case Tr:o=16,i=null;break e}throw Error(ne(130,t==null?t:typeof t,""))}return e=ti(o,n,e,r),e.elementType=t,e.type=i,e.lanes=s,e}function Ts(t,e,n,i){return t=ti(7,t,i,e),t.lanes=n,t}function Lu(t,e,n,i){return t=ti(22,t,i,e),t.elementType=$x,t.lanes=n,t.stateNode={isHidden:!1},t}function Xh(t,e,n){return t=ti(6,t,null,e),t.lanes=n,t}function qh(t,e,n){return e=ti(4,t.children!==null?t.children:[],t.key,e),e.lanes=n,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}function hE(t,e,n,i,r){this.tag=e,this.containerInfo=t,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Rh(0),this.expirationTimes=Rh(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Rh(0),this.identifierPrefix=i,this.onRecoverableError=r,this.mutableSourceEagerHydrationData=null}function Em(t,e,n,i,r,s,o,a,l){return t=new hE(t,e,n,a,l),e===1?(e=1,s===!0&&(e|=8)):e=0,s=ti(3,null,null,e),t.current=s,s.stateNode=t,s.memoizedState={element:i,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},lm(s),t}function pE(t,e,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:ao,key:i==null?null:""+i,children:t,containerInfo:e,implementation:n}}function Oy(t){if(!t)return Hr;t=t._reactInternals;e:{if(Ls(t)!==t||t.tag!==1)throw Error(ne(170));var e=t;do{switch(e.tag){case 3:e=e.stateNode.context;break e;case 1:if(Pn(e.type)){e=e.stateNode.__reactInternalMemoizedMergedChildContext;break e}}e=e.return}while(e!==null);throw Error(ne(171))}if(t.tag===1){var n=t.type;if(Pn(n))return O1(t,n,e)}return e}function zy(t,e,n,i,r,s,o,a,l){return t=Em(n,i,!0,t,r,s,o,a,l),t.context=Oy(null),n=t.current,i=Sn(),r=Or(n),s=nr(i,r),s.callback=e??null,Ur(n,s,r),t.current.lanes=r,fl(t,r,i),In(t,i),t}function Nu(t,e,n,i){var r=e.current,s=Sn(),o=Or(r);return n=Oy(n),e.context===null?e.context=n:e.pendingContext=n,e=nr(s,o),e.payload={element:t},i=i===void 0?null:i,i!==null&&(e.callback=i),t=Ur(r,e,o),t!==null&&(bi(t,r,o,s),qc(t,r,o)),o}function Su(t){return t=t.current,t.child?(t.child.tag===5,t.child.stateNode):null}function Vx(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var n=t.retryLane;t.retryLane=n!==0&&n<e?n:e}}function Tm(t,e){Vx(t,e),(t=t.alternate)&&Vx(t,e)}function mE(){return null}var By=typeof reportError=="function"?reportError:function(t){console.error(t)};function Am(t){this._internalRoot=t}Du.prototype.render=Am.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(ne(409));Nu(t,e,null,null)};Du.prototype.unmount=Am.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;Is(function(){Nu(null,t,null,null)}),e[rr]=null}};function Du(t){this._internalRoot=t}Du.prototype.unstable_scheduleHydration=function(t){if(t){var e=v1();t={blockedOn:null,target:t,priority:e};for(var n=0;n<Cr.length&&e!==0&&e<Cr[n].priority;n++);Cr.splice(n,0,t),n===0&&y1(t)}};function Cm(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function Uu(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11&&(t.nodeType!==8||t.nodeValue!==" react-mount-point-unstable "))}function Gx(){}function gE(t,e,n,i,r){if(r){if(typeof i=="function"){var s=i;i=function(){var c=Su(o);s.call(c)}}var o=zy(e,i,t,0,null,!1,!1,"",Gx);return t._reactRootContainer=o,t[rr]=o.current,il(t.nodeType===8?t.parentNode:t),Is(),o}for(;r=t.lastChild;)t.removeChild(r);if(typeof i=="function"){var a=i;i=function(){var c=Su(l);a.call(c)}}var l=Em(t,0,!1,null,null,!1,!1,"",Gx);return t._reactRootContainer=l,t[rr]=l.current,il(t.nodeType===8?t.parentNode:t),Is(function(){Nu(e,l,n,i)}),l}function Fu(t,e,n,i,r){var s=n._reactRootContainer;if(s){var o=s;if(typeof r=="function"){var a=r;r=function(){var l=Su(o);a.call(l)}}Nu(e,o,t,r)}else o=gE(n,e,t,r,i);return Su(o)}m1=function(t){switch(t.tag){case 3:var e=t.stateNode;if(e.current.memoizedState.isDehydrated){var n=Oa(e.pendingLanes);n!==0&&($p(e,n|1),In(e,zt()),(it&6)===0&&(ko=zt()+500,Wr()))}break;case 13:Is(function(){var i=sr(t,1);if(i!==null){var r=Sn();bi(i,t,1,r)}}),Tm(t,1)}};Yp=function(t){if(t.tag===13){var e=sr(t,134217728);if(e!==null){var n=Sn();bi(e,t,134217728,n)}Tm(t,134217728)}};g1=function(t){if(t.tag===13){var e=Or(t),n=sr(t,e);if(n!==null){var i=Sn();bi(n,t,e,i)}Tm(t,e)}};v1=function(){return dt};x1=function(t,e){var n=dt;try{return dt=t,e()}finally{dt=n}};op=function(t,e,n){switch(e){case"input":if(Qh(t,n),e=n.name,n.type==="radio"&&e!=null){for(n=t;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+e)+'][type="radio"]'),e=0;e<n.length;e++){var i=n[e];if(i!==t&&i.form===t.form){var r=Au(i);if(!r)throw Error(ne(90));Zx(i),Qh(i,r)}}}break;case"textarea":Kx(t,n);break;case"select":e=n.value,e!=null&&_o(t,!!n.multiple,e,!1)}};r1=bm;s1=Is;var vE={usingClientEntryPoint:!1,Events:[pl,ho,Au,n1,i1,bm]},Na={findFiberByHostInstance:Ss,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},xE={bundleType:Na.bundleType,version:Na.version,rendererPackageName:Na.rendererPackageName,rendererConfig:Na.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ar.ReactCurrentDispatcher,findHostInstanceByFiber:function(t){return t=l1(t),t===null?null:t.stateNode},findFiberByHostInstance:Na.findFiberByHostInstance||mE,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(Da=__REACT_DEVTOOLS_GLOBAL_HOOK__,!Da.isDisabled&&Da.supportsFiber))try{Mu=Da.inject(xE),Ni=Da}catch{}var Da;Gn.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=vE;Gn.createPortal=function(t,e){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Cm(e))throw Error(ne(200));return pE(t,e,null,n)};Gn.createRoot=function(t,e){if(!Cm(t))throw Error(ne(299));var n=!1,i="",r=By;return e!=null&&(e.unstable_strictMode===!0&&(n=!0),e.identifierPrefix!==void 0&&(i=e.identifierPrefix),e.onRecoverableError!==void 0&&(r=e.onRecoverableError)),e=Em(t,1,!1,null,null,n,!1,i,r),t[rr]=e.current,il(t.nodeType===8?t.parentNode:t),new Am(e)};Gn.findDOMNode=function(t){if(t==null)return null;if(t.nodeType===1)return t;var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(ne(188)):(t=Object.keys(t).join(","),Error(ne(268,t)));return t=l1(e),t=t===null?null:t.stateNode,t};Gn.flushSync=function(t){return Is(t)};Gn.hydrate=function(t,e,n){if(!Uu(e))throw Error(ne(200));return Fu(null,t,e,!0,n)};Gn.hydrateRoot=function(t,e,n){if(!Cm(t))throw Error(ne(405));var i=n!=null&&n.hydratedSources||null,r=!1,s="",o=By;if(n!=null&&(n.unstable_strictMode===!0&&(r=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),e=zy(e,null,t,1,n??null,r,!1,s,o),t[rr]=e.current,il(t),i)for(t=0;t<i.length;t++)n=i[t],r=n._getVersion,r=r(n._source),e.mutableSourceEagerHydrationData==null?e.mutableSourceEagerHydrationData=[n,r]:e.mutableSourceEagerHydrationData.push(n,r);return new Du(e)};Gn.render=function(t,e,n){if(!Uu(e))throw Error(ne(200));return Fu(null,t,e,!1,n)};Gn.unmountComponentAtNode=function(t){if(!Uu(t))throw Error(ne(40));return t._reactRootContainer?(Is(function(){Fu(null,null,t,!1,function(){t._reactRootContainer=null,t[rr]=null})}),!0):!1};Gn.unstable_batchedUpdates=bm;Gn.unstable_renderSubtreeIntoContainer=function(t,e,n,i){if(!Uu(n))throw Error(ne(200));if(t==null||t._reactInternals===void 0)throw Error(ne(38));return Fu(t,e,n,!1,i)};Gn.version="18.3.1-next-f1338f8080-20240426"});var Wy=Ki((Wk,Gy)=>{"use strict";function Vy(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Vy)}catch(t){console.error(t)}}Vy(),Gy.exports=Hy()});var qy=Ki(Rm=>{"use strict";var Xy=Wy();Rm.createRoot=Xy.createRoot,Rm.hydrateRoot=Xy.hydrateRoot;var Xk});var Yy=Ki(Ou=>{"use strict";var yE=pi(),_E=Symbol.for("react.element"),bE=Symbol.for("react.fragment"),SE=Object.prototype.hasOwnProperty,ME=yE.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,wE={key:!0,ref:!0,__self:!0,__source:!0};function $y(t,e,n){var i,r={},s=null,o=null;n!==void 0&&(s=""+n),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(o=e.ref);for(i in e)SE.call(e,i)&&!wE.hasOwnProperty(i)&&(r[i]=e[i]);if(t&&t.defaultProps)for(i in e=t.defaultProps,e)r[i]===void 0&&(r[i]=e[i]);return{$$typeof:_E,type:t,key:s,ref:o,props:r,_owner:ME.current}}Ou.Fragment=bE;Ou.jsx=$y;Ou.jsxs=$y});var Ue=Ki((_L,Zy)=>{"use strict";Zy.exports=Yy()});var Ns,Ds,Nm=dv(()=>{Ns={void:"#0A0A0F",surface:"#12121A",surface2:"#1C1C2A",cloud:"#A1A1AA",textPrimary:"#F5F5F7",textSecondary:"rgba(245,245,247,0.6)",textTertiary:"rgba(245,245,247,0.3)",accent:"#00F0FF",violet:"#A78BFA",gold:"#FBBF24",green:"#34D399",red:"#FB7185",iris:"#818CF8"},Ds={teal:[77,184,168],coral:[204,98,71],phosphor:[59,163,114],butter:[205,168,82],white:[255,255,255],gold:[175,200,140],remembrance:"#f5f0e8",remembranceRGB:[245,240,232]}});var n_={};ew(n_,{initStarfield:()=>t_,mountStarfield:()=>IE});function Dm(t,e){let n=Math.max(0,Math.min(5,Number(t)||3));return e||n<=1?{count:12,speed:.005,connR:30,hearthA:.01,tealGlowA:.008,coralRatio:.1,baseAlpha:.06,breathRate:4e-4,dimFactor:.15}:n<=3?{count:50,speed:.08,connR:60,hearthA:.035,tealGlowA:.016,coralRatio:.3,baseAlpha:.18,breathRate:75e-5,dimFactor:.7}:{...RE}}function Um(t,e){let n={...t};switch(e){case"AMBER":n.coralRatio=Math.min(.85,n.coralRatio+.2),n.dimFactor*=.92;break;case"RED":n.coralRatio=Math.min(.92,n.coralRatio+.35),n.dimFactor*=.88;break;case"BLUE":n.coralRatio=Math.max(.05,n.coralRatio-.1),n.tealGlowA*=1.3;break}return n}function e_(t,e,n){let i=Math.random()<n.coralRatio;return{x:Math.random()*t,y:Math.random()*e,r:Math.random()*1.2+.35,vx:(Math.random()-.5)*n.speed*2,vy:(Math.random()-.5)*n.speed*2,a:Math.random()*n.baseAlpha+.05,color:i?[...Ds.coral]:[...Ds.teal],life:null}}function t_(t,e={}){let n=t.getContext("2d");if(!n)return PE();let i=e.spoons??3,r=e.voltage||"GREEN",s=Um(Dm(i,e.safeMode),r),o=0,a=0,l=1,c=[],d=[],f=[],h=0,p=!0,v=performance.now(),y=typeof window<"u"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,m=!!e.poetsMode,u=null;function g(){let L=t.getBoundingClientRect();l=Math.min(window.devicePixelRatio||1,2),o=Math.max(1,L.width),a=Math.max(1,L.height),t.width=Math.floor(o*l),t.height=Math.floor(a*l),n.setTransform(l,0,0,l,0,0)}function x(){c=[];let L=typeof window<"u"&&window.matchMedia("(max-width: 640px)").matches,O=m?16:L?Math.round(s.count*.62):s.count;for(let X=0;X<O;X++)c.push(e_(o,a,s))}function _(){let L=typeof window<"u"&&window.matchMedia("(max-width: 640px)").matches,O=m?16:L?Math.round(s.count*.62):s.count;for(;c.length>O;)c.pop();for(;c.length<O;)c.push(e_(o,a,s));for(let X of c)X.vx=(Math.random()-.5)*s.speed*2,X.vy=(Math.random()-.5)*s.speed*2}function T(L,O,X=.08){if(u)try{let H=u.createOscillator(),Z=u.createGain();H.type="sine",H.frequency.value=L,Z.gain.value=X,H.connect(Z),Z.connect(u.destination),H.start(),H.stop(u.currentTime+O)}catch{}}function E(L,O){let X=typeof O=="number"&&O>0?O:1;n.clearRect(0,0,o,a);let H=Math.sin(L*s.breathRate)*.5+.5,Z=s.dimFactor,G=s.hearthA*(.8+H*.4)*Z,oe=n.createRadialGradient(o/2,a*.92,0,o/2,a*.92,a*.75);oe.addColorStop(0,`rgba(204,98,71,${G})`),oe.addColorStop(.5,`rgba(204,98,71,${G*.35})`),oe.addColorStop(1,"rgba(10,10,15,0)"),n.fillStyle=oe,n.fillRect(0,0,o,a);let le=n.createRadialGradient(o*.42,a*.22,0,o*.42,a*.22,a*.48);le.addColorStop(0,`rgba(77,184,168,${s.tealGlowA*Z})`),le.addColorStop(1,"rgba(10,10,15,0)"),n.fillStyle=le,n.fillRect(0,0,o,a);for(let te of f){let ge=.6+.4*Math.sin(L*.001+te.phase),Ge=te.a*ge*Z;n.beginPath(),n.arc(te.x*o,te.y*a,1.2*ge,0,Math.PI*2),n.fillStyle=`rgba(245,240,232,${Ge})`,n.fill()}if(s.connR>0&&!y)for(let te=0;te<c.length;te++)for(let ge=te+1;ge<c.length;ge++){let Ge=c[te],W=c[ge],se=Ge.x-W.x,ye=Ge.y-W.y,ae=se*se+ye*ye;if(ae>s.connR*s.connR)continue;let Qe=.042*(1-Math.sqrt(ae)/s.connR)*Z;n.beginPath(),n.moveTo(Ge.x,Ge.y),n.lineTo(W.x,W.y),n.strokeStyle=`rgba(${Ge.color[0]},${Ge.color[1]},${Ge.color[2]},${Math.min(Qe,.14)})`,n.lineWidth=.5,n.stroke()}for(let te of c){y||(te.x+=te.vx*X,te.y+=te.vy*X,te.x<-10&&(te.x=o+10),te.x>o+10&&(te.x=-10),te.y<-10&&(te.y=a+10),te.y>a+10&&(te.y=-10));let ge=te.a*Z*(.72+H*.28);n.beginPath(),n.arc(te.x,te.y,te.r,0,Math.PI*2),n.fillStyle=`rgba(${te.color[0]},${te.color[1]},${te.color[2]},${ge})`,n.fill()}for(let te=d.length-1;te>=0;te--){let ge=d[te];if(y||(ge.x+=ge.vx*X*.5,ge.y+=ge.vy*X*.5),ge.life-=.03,ge.life<=0){d.splice(te,1);continue}n.beginPath(),n.arc(ge.x,ge.y,ge.r,0,Math.PI*2),n.fillStyle=`rgba(${ge.color[0]},${ge.color[1]},${ge.color[2]},${ge.a*ge.life})`,n.fill()}}function A(L){if(!p)return;let O=Math.min(3,(L-v)/16.67);v=L,E(L,O),y||(h=requestAnimationFrame(A))}function R(){g(),x(),y&&E(0,1)}function w(){document.hidden?(p=!1,cancelAnimationFrame(h)):(p=!0,v=performance.now(),y?E(0,1):h=requestAnimationFrame(A))}function S(L){!L||!L.persisted||(p=!0,v=performance.now(),y?E(0,1):h=requestAnimationFrame(A))}let P=typeof window<"u"?window.matchMedia("(prefers-reduced-motion: reduce)"):null,z=()=>{P&&(y=P.matches)};return P&&(typeof P.addEventListener=="function"?P.addEventListener("change",z):P.addListener?.(z)),window.addEventListener("resize",R),document.addEventListener("visibilitychange",w),window.addEventListener("pageshow",S),window.addEventListener("pagehide",()=>{p=!1,cancelAnimationFrame(h)}),g(),x(),y?E(0,1):h=requestAnimationFrame(A),{setSpoons(L){i=L,s=Um(Dm(L,e.safeMode),r),_(),y&&E(0,1)},setVoltage(L){r=L,s=Um(Dm(i,e.safeMode),r)},setRemembrance(L){f=L.map(O=>({x:O.x,y:O.y,a:.3+Math.random()*.2,phase:Math.random()*Math.PI*2}))},setConfig(L){s={...s,...L},_(),y&&E(0,1)},burst(L,O,X){let H=X==="gold"?Ds.butter:X==="coral"?Ds.coral:X==="phosphor"?Ds.phosphor:Ds.white;for(let Z=0;Z<6;Z++){let G=Math.random()*Math.PI*2,oe=Math.random()*40;d.push({x:L+Math.cos(G)*oe*.35,y:O+Math.sin(G)*oe*.35,r:Math.random()*2+.6,vx:Math.cos(G)*(.4+Math.random()*1.2),vy:Math.sin(G)*(.4+Math.random()*1.2),a:.75,color:[...H],life:1})}e.connectionAudio&&T(880,.03,.04)},destroy(){p=!1,cancelAnimationFrame(h),window.removeEventListener("resize",R),document.removeEventListener("visibilitychange",w),window.removeEventListener("pageshow",S),P&&(typeof P.removeEventListener=="function"?P.removeEventListener("change",z):P.removeListener?.(z))}}}function PE(){return{setSpoons(){},setVoltage(){},setRemembrance(){},setConfig(){},burst(){},destroy(){}}}function IE(t,e={}){let n=t||document.body,i=document.createElement("div");i.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:0";let r=document.createElement("canvas");return r.style.cssText="display:block;width:100%;height:100%",i.appendChild(r),n.appendChild(i),t_(r,{...e,container:n})}var RE,i_=dv(()=>{Nm();RE={count:80,speed:.15,connR:80,hearthA:.04,tealGlowA:.02,coralRatio:.15,baseAlpha:.25,breathRate:8e-4,dimFactor:1}});var BM=Ce(qy());var xn=Ce(pi());var Jy=Ce(Ue(),1),EE={sm:"p-4",md:"p-6",lg:"p-8"};function Bt({children:t,className:e="",padding:n="md",strong:i=!1,hover:r,style:s}){let o=[i?"glass-strong":"glass-panel",r?"glass-panel--hover":"",EE[n],e].filter(Boolean).join(" ");return(0,Jy.jsx)("div",{className:o,style:s,children:t})}var TE=Ce(Ue(),1);var Ky=Ce(Ue(),1);var jy=Ce(Ue(),1);var Pm=Ce(Ue(),1),AE='<path d="M100 30 Q96 80 100 110 Q100 120 100 145" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor"/><circle cx="100" cy="30" r="6" fill="currentColor"/>';function Im({level:t,value:e,onChange:n,min:i=0,max:r=5,className:s="",style:o}){let l=Math.max(i,Math.min(r,t??e??3));return(0,Pm.jsx)("div",{className:`spoon-dial ${s}`.trim(),role:"radiogroup","aria-label":"Cognitive load",style:o,children:Array.from({length:r-i+1},(c,d)=>i+d).map(c=>(0,Pm.jsx)("button",{type:"button",className:`spoon-btn${c===l?" active":""}`,"aria-checked":c===l?"true":"false","aria-label":`Spoons = ${c}`,title:`Cognitive load level ${c}`,onClick:()=>n?.(c),dangerouslySetInnerHTML:{__html:`<svg viewBox="0 0 200 200" width="15" height="15" aria-hidden="true">${AE}</svg>`}},c))})}var Qy=Ce(Ue(),1);function gl({children:t,variant:e="primary",size:n="md",disabled:i=!1,className:r="",style:s,onClick:o,...a}){let l={primary:"btn btn-primary",secondary:"btn btn-secondary",ghost:"btn btn-ghost"}[e],c={sm:"btn-sm",md:"btn-md",lg:"btn-lg"}[n];return(0,Qy.jsx)("button",{type:"button",className:`${l} ${c} ${r}`.trim(),disabled:i,style:s,onClick:o,...a,children:t})}function km(t){switch(t){case"online":return"badge-success";case"offline":return"badge-error";case"busy":return"badge-warning";case"away":return"badge-info";default:return"badge"}}var zu=Ce(Ue(),1),CE={online:"Online",offline:"Offline",busy:"Busy",away:"Away"};function Lm({status:t="online",variant:e,label:n,className:i="",style:r}){let s=e?{live:"online",beta:"away",research:"offline"}[e]:t,o=n||CE[s],a=`badge ${km(s)} ${i}`.trim();return(0,zu.jsxs)("span",{className:a,style:r,children:[(0,zu.jsx)("span",{className:"status-dot","data-status":s,"aria-hidden":"true"}),o]})}var Do=Ce(Ue(),1);function mt({icon:t,value:e,label:n,clickable:i=!1,className:r="",style:s}){let o=`metric-badge${i?" clickable":""} ${r}`.trim();return(0,Do.jsxs)("div",{className:o,style:s,children:[t&&(0,Do.jsx)("span",{className:"status-dot",children:t}),(0,Do.jsx)("span",{className:"value",children:e}),n&&(0,Do.jsx)("span",{className:"label",children:n})]})}var vl=Ce(pi(),1),r_=Ce(Ue(),1);function Fm({spoons:t,voltage:e,safeMode:n,className:i="",style:r}){let s=(0,vl.useRef)(null),o=(0,vl.useRef)(null);return(0,vl.useEffect)(()=>{if(!s.current)return;let a=!1;return Promise.resolve().then(()=>(i_(),n_)).then(({mountStarfield:l})=>{a||!s.current||(o.current=l(s.current,{spoons:t,voltage:e,safeMode:n}))}),()=>{a=!0,o.current?.destroy(),o.current=null}},[t,e,n]),(0,r_.jsx)("div",{ref:s,className:`starfield-bg ${i}`.trim(),style:r,"aria-hidden":"true"})}var UE=Ce(pi(),1);Nm();var s_=1.618033988749895,Om=16,zm=1.333;var kE=120,DL=6e4/kE,UL={VERTICES:4,EDGES:6,FACES:4,OVERLAP:1/3,BOND_ANGLE_DEG:109.47122063449069,FACE_ANGLE_DEG:60,MAXWELL_RIGIDITY:6,POSNER_TOTAL_ATOMS:24};function Bu(t,e,n){return t*Math.pow(n,e)}function Hu(t,e=1){let n=Math.pow(10,e);return Math.round(t*n)/n}var LE=s_;function Ui(t){if(t>=4){let e=Hu(Bu(Om,3,zm),1);return Hu(Bu(e,t-3,LE),1)}return Hu(Bu(Om,t,zm),1)}var HL={caption:Ui(-3),overline:Ui(-2),label:Ui(-1),body:Ui(0),h4:Ui(1),h3:Ui(2),h2:Ui(3),h1:Ui(4),heroH2:Ui(5),heroH1:Ui(6)},Bm={sans:"Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",mono:"JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"};var Vm=typeof window<"u"&&typeof HTMLElement<"u"&&typeof customElements<"u",NE=`
  :host {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p31-void, ${Ns.void});
    font-family: var(--p31-font-sans, ${Bm.sans});
  }
  .breath-circle {
    width: 160px;
    height: 160px;
    border-radius: 9999px;
    border: 2px solid var(--p31-accent, ${Ns.accent});
    animation: p31-breathe 4s ease-in-out infinite;
  }
  .message {
    margin-top: 32px;
    color: var(--p31-cloud, ${typeof Ns.cloud=="string"?Ns.cloud:"#A1A1AA"});
    font-size: 14px;
    text-align: center;
  }
  .exit-btn {
    margin-top: 32px;
    padding: 16px 32px;
    background: var(--p31-accent, ${Ns.accent});
    color: var(--p31-void, ${Ns.void});
    font-weight: 700;
    font-size: 18px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: var(--p31-font-sans, ${Bm.sans});
  }
  .exit-btn:hover { opacity: 0.8; }
  @keyframes p31-breathe {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.18); opacity: 1; }
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`,Hm;Vm&&(Hm=class extends HTMLElement{constructor(){super();fv(this,"_onKey",n=>{n.key==="Escape"&&this._fireReady()});this.attachShadow({mode:"open"})}static get observedAttributes(){return["message","button-label"]}connectedCallback(){this.render(),this.addEventListener("keydown",this._onKey),window.addEventListener("keydown",this._onKey)}disconnectedCallback(){window.removeEventListener("keydown",this._onKey)}attributeChangedCallback(){this.shadowRoot&&this.render()}_fireReady(){this.dispatchEvent(new CustomEvent("p31-ready",{bubbles:!0,composed:!0}));let n=this.onready;typeof n=="function"&&n()}render(){let n=this.getAttribute("message")||"Rest. Breathe. You can exit when ready.",i=this.getAttribute("button-label")||"I'm Ready";this.shadowRoot.innerHTML=`
        <style>${NE}</style>
        <div class="container" role="alert" aria-live="assertive">
          <div class="breath-circle" aria-hidden="true"></div>
          <p class="message">${n}</p>
          <button class="exit-btn">${i}</button>
        </div>
      `,this.shadowRoot.querySelector(".exit-btn").addEventListener("click",()=>this._fireReady())}});var o_=!1;function DE(t="p31-crisis-overlay"){!Vm||o_||(!customElements.get(t)&&Hm&&customElements.define(t,Hm),o_=!0)}Vm&&DE();var FE=Ce(Ue(),1);var a_=Ce(Ue(),1);var Vu=Ce(pi(),1),l_=Ce(Ue(),1);var F0=Ce(pi(),1);var c_=t=>{let e,n=new Set,i=(c,d)=>{let f=typeof c=="function"?c(e):c;if(!Object.is(f,e)){let h=e;e=d??(typeof f!="object"||f===null)?f:Object.assign({},e,f),n.forEach(p=>p(e,h))}},r=()=>e,a={setState:i,getState:r,getInitialState:()=>l,subscribe:c=>(n.add(c),()=>n.delete(c))},l=e=t(i,r,a);return a},u_=(t=>t?c_(t):c_);var xl=Ce(pi(),1);var OE=t=>t;function zE(t,e=OE){let n=xl.default.useSyncExternalStore(t.subscribe,xl.default.useCallback(()=>e(t.getState()),[t,e]),xl.default.useCallback(()=>e(t.getInitialState()),[t,e]));return xl.default.useDebugValue(n),n}var d_=t=>{let e=u_(t),n=i=>zE(e,i);return Object.assign(n,e),n},f_=(t=>t?d_(t):d_);function BE(t,e){let n;try{n=t()}catch{return}return{getItem:r=>{var s;let o=l=>l===null?null:JSON.parse(l,e?.reviver),a=(s=n.getItem(r))!=null?s:null;return a instanceof Promise?a.then(o):o(a)},setItem:(r,s)=>n.setItem(r,JSON.stringify(s,e?.replacer)),removeItem:r=>n.removeItem(r)}}var Gm=t=>e=>{try{let n=t(e);return n instanceof Promise?n:{then(i){return Gm(i)(n)},catch(i){return this}}}catch(n){return{then(i){return this},catch(i){return Gm(i)(n)}}}},HE=(t,e)=>(n,i,r)=>{let s={storage:BE(()=>window.localStorage),partialize:m=>m,version:0,merge:(m,u)=>({...u,...m}),...e},o=!1,a=0,l=new Set,c=new Set,d=s.storage;if(!d)return t((...m)=>{console.warn(`[zustand persist middleware] Unable to update item '${s.name}', the given storage is currently unavailable.`),n(...m)},i,r);let f=()=>{let m=s.partialize({...i()});return d.setItem(s.name,{state:m,version:s.version})},h=r.setState;r.setState=(m,u)=>(h(m,u),f());let p=t((...m)=>(n(...m),f()),i,r);r.getInitialState=()=>p;let v,y=()=>{var m,u;if(!d)return;let g=++a;o=!1,l.forEach(_=>{var T;return _((T=i())!=null?T:p)});let x=((u=s.onRehydrateStorage)==null?void 0:u.call(s,(m=i())!=null?m:p))||void 0;return Gm(d.getItem.bind(d))(s.name).then(_=>{if(_)if(typeof _.version=="number"&&_.version!==s.version){if(s.migrate){let T=s.migrate(_.state,_.version);return T instanceof Promise?T.then(E=>[!0,E]):[!0,T]}console.error("State loaded from storage couldn't be migrated since no migrate function was provided")}else return[!1,_.state];return[!1,void 0]}).then(_=>{var T;if(g!==a)return;let[E,A]=_;if(v=s.merge(A,(T=i())!=null?T:p),n(v,!0),E)return f()}).then(()=>{g===a&&(x?.(i(),void 0),v=i(),o=!0,c.forEach(_=>_(v)))}).catch(_=>{g===a&&x?.(void 0,_)})};return r.persist={setOptions:m=>{s={...s,...m},m.storage&&(d=m.storage)},clearStorage:()=>{++a,d?.removeItem(s.name)},getOptions:()=>s,rehydrate:()=>y(),hasHydrated:()=>o,onHydrate:m=>(l.add(m),()=>{l.delete(m)}),onFinishHydration:m=>(c.add(m),()=>{c.delete(m)})},s.skipHydration||y(),v||p},h_=HE;var VE=(t,e)=>{if(typeof t=="number"){if(e===3)return{mode:"rgb",r:(t>>8&15|t>>4&240)/255,g:(t>>4&15|t&240)/255,b:(t&15|t<<4&240)/255};if(e===4)return{mode:"rgb",r:(t>>12&15|t>>8&240)/255,g:(t>>8&15|t>>4&240)/255,b:(t>>4&15|t&240)/255,alpha:(t&15|t<<4&240)/255};if(e===6)return{mode:"rgb",r:(t>>16&255)/255,g:(t>>8&255)/255,b:(t&255)/255};if(e===8)return{mode:"rgb",r:(t>>24&255)/255,g:(t>>16&255)/255,b:(t>>8&255)/255,alpha:(t&255)/255}}},Gu=VE;var GE={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},p_=GE;var WE=t=>Gu(p_[t.toLowerCase()],6),m_=WE;var XE=/^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i,qE=t=>{let e;return(e=t.match(XE))?Gu(parseInt(e[1],16),e[1].length):void 0},g_=qE;var wn="([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)",d5=`(?:${wn}|none)`,Us=`${wn}%`,f5=`(?:${wn}%|none)`,yl=`(?:${wn}%|${wn})`,$E=`(?:${wn}%|${wn}|none)`,v_=`(?:${wn}(deg|grad|rad|turn)|${wn})`,h5=`(?:${wn}(deg|grad|rad|turn)|${wn}|none)`,Xr="\\s*,\\s*";var p5=new RegExp("^"+$E+"$");var YE=new RegExp(`^rgba?\\(\\s*${wn}${Xr}${wn}${Xr}${wn}\\s*(?:,\\s*${yl}\\s*)?\\)$`),ZE=new RegExp(`^rgba?\\(\\s*${Us}${Xr}${Us}${Xr}${Us}\\s*(?:,\\s*${yl}\\s*)?\\)$`),JE=t=>{let e={mode:"rgb"},n;if(n=t.match(YE))n[1]!==void 0&&(e.r=n[1]/255),n[2]!==void 0&&(e.g=n[2]/255),n[3]!==void 0&&(e.b=n[3]/255);else if(n=t.match(ZE))n[1]!==void 0&&(e.r=n[1]/100),n[2]!==void 0&&(e.g=n[2]/100),n[3]!==void 0&&(e.b=n[3]/100);else return;return n[4]!==void 0?e.alpha=Math.max(0,Math.min(1,n[4]/100)):n[5]!==void 0&&(e.alpha=Math.max(0,Math.min(1,+n[5]))),e},x_=JE;var KE=(t,e)=>t===void 0?void 0:typeof t!="object"?_l(t):t.mode!==void 0?t:e?{...t,mode:e}:void 0,Wu=KE;var jE=(t="rgb")=>e=>(e=Wu(e,t))!==void 0?e.mode===t?e:Mi[e.mode][t]?Mi[e.mode][t](e):t==="rgb"?Mi[e.mode].rgb(e):Mi.rgb[t](Mi[e.mode].rgb(e)):void 0,bl=jE;var Mi={},y_={},Sl=[],Wm={},QE=t=>t,ot=t=>(Mi[t.mode]={...Mi[t.mode],...t.toMode},Object.keys(t.fromMode||{}).forEach(e=>{Mi[e]||(Mi[e]={}),Mi[e][t.mode]=t.fromMode[e]}),t.ranges||(t.ranges={}),t.difference||(t.difference={}),t.channels.forEach(e=>{if(t.ranges[e]===void 0&&(t.ranges[e]=[0,1]),!t.interpolate[e])throw new Error(`Missing interpolator for: ${e}`);typeof t.interpolate[e]=="function"&&(t.interpolate[e]={use:t.interpolate[e]}),t.interpolate[e].fixup||(t.interpolate[e].fixup=QE)}),y_[t.mode]=t,(t.parse||[]).forEach(e=>{eT(e,t.mode)}),bl(t.mode)),Xu=t=>y_[t],eT=(t,e)=>{if(typeof t=="string"){if(!e)throw new Error("'mode' required when 'parser' is a string");Wm[t]=e}else typeof t=="function"&&Sl.indexOf(t)<0&&Sl.push(t)};var Xm=/[^\x00-\x7F]|[a-zA-Z_]/,tT=/[^\x00-\x7F]|[-\w]/,j={Function:"function",Ident:"ident",Number:"number",Percentage:"percentage",ParenClose:")",None:"none",Hue:"hue",Alpha:"alpha"},ze=0;function qu(t){let e=t[ze],n=t[ze+1];return e==="-"||e==="+"?/\d/.test(n)||n==="."&&/\d/.test(t[ze+2]):e==="."?/\d/.test(n):/\d/.test(e)}function qm(t){if(ze>=t.length)return!1;let e=t[ze];if(Xm.test(e))return!0;if(e==="-"){if(t.length-ze<2)return!1;let n=t[ze+1];return!!(n==="-"||Xm.test(n))}return!1}var nT={deg:1,rad:180/Math.PI,grad:9/10,turn:360};function Ml(t){let e="";if((t[ze]==="-"||t[ze]==="+")&&(e+=t[ze++]),e+=$u(t),t[ze]==="."&&/\d/.test(t[ze+1])&&(e+=t[ze++]+$u(t)),(t[ze]==="e"||t[ze]==="E")&&((t[ze+1]==="-"||t[ze+1]==="+")&&/\d/.test(t[ze+2])?e+=t[ze++]+t[ze++]+$u(t):/\d/.test(t[ze+1])&&(e+=t[ze++]+$u(t))),qm(t)){let n=Yu(t);return n==="deg"||n==="rad"||n==="turn"||n==="grad"?{type:j.Hue,value:e*nT[n]}:void 0}return t[ze]==="%"?(ze++,{type:j.Percentage,value:+e}):{type:j.Number,value:+e}}function $u(t){let e="";for(;/\d/.test(t[ze]);)e+=t[ze++];return e}function Yu(t){let e="";for(;ze<t.length&&tT.test(t[ze]);)e+=t[ze++];return e}function iT(t){let e=Yu(t);return t[ze]==="("?(ze++,{type:j.Function,value:e}):e==="none"?{type:j.None,value:void 0}:{type:j.Ident,value:e}}function rT(t=""){let e=t.trim(),n=[],i;for(ze=0;ze<e.length;){if(i=e[ze++],i===`
`||i==="	"||i===" "){for(;ze<e.length&&(e[ze]===`
`||e[ze]==="	"||e[ze]===" ");)ze++;continue}if(i===",")return;if(i===")"){n.push({type:j.ParenClose});continue}if(i==="+"){if(ze--,qu(e)){n.push(Ml(e));continue}return}if(i==="-"){if(ze--,qu(e)){n.push(Ml(e));continue}if(qm(e)){n.push({type:j.Ident,value:Yu(e)});continue}return}if(i==="."){if(ze--,qu(e)){n.push(Ml(e));continue}return}if(i==="/"){for(;ze<e.length&&(e[ze]===`
`||e[ze]==="	"||e[ze]===" ");)ze++;let r;if(qu(e)&&(r=Ml(e),r.type!==j.Hue)){n.push({type:j.Alpha,value:r});continue}if(qm(e)&&Yu(e)==="none"){n.push({type:j.Alpha,value:{type:j.None,value:void 0}});continue}return}if(/\d/.test(i)){ze--,n.push(Ml(e));continue}if(Xm.test(i)){ze--,n.push(iT(e));continue}return}return n}function sT(t){t._i=0;let e=t[t._i++];if(!e||e.type!==j.Function||e.value!=="color"||(e=t[t._i++],e.type!==j.Ident))return;let n=Wm[e.value];if(!n)return;let i={mode:n},r=__(t,!1);if(!r)return;let s=Xu(n).channels;for(let o=0,a,l;o<s.length;o++)a=r[o],l=s[o],a.type!==j.None&&(i[l]=a.type===j.Number?a.value:a.value/100,l==="alpha"&&(i[l]=Math.max(0,Math.min(1,i[l]))));return i}function __(t,e){let n=[],i;for(;t._i<t.length;){if(i=t[t._i++],i.type===j.None||i.type===j.Number||i.type===j.Alpha||i.type===j.Percentage||e&&i.type===j.Hue){n.push(i);continue}if(i.type===j.ParenClose){if(t._i<t.length)return;continue}return}if(!(n.length<3||n.length>4)){if(n.length===4){if(n[3].type!==j.Alpha)return;n[3]=n[3].value}return n.length===3&&n.push({type:j.None,value:void 0}),n.every(r=>r.type!==j.Alpha)?n:void 0}}function oT(t,e){t._i=0;let n=t[t._i++];if(!n||n.type!==j.Function)return;let i=__(t,e);if(i)return i.unshift(n.value),i}var aT=t=>{if(typeof t!="string")return;let e=rT(t),n=e?oT(e,!0):void 0,i,r=0,s=Sl.length;for(;r<s;)if((i=Sl[r++](t,n))!==void 0)return i;return e?sT(e):void 0},_l=aT;function lT(t,e){if(!e||e[0]!=="rgb"&&e[0]!=="rgba")return;let n={mode:"rgb"},[,i,r,s,o]=e;if(!(i.type===j.Hue||r.type===j.Hue||s.type===j.Hue))return i.type!==j.None&&(n.r=i.type===j.Number?i.value/255:i.value/100),r.type!==j.None&&(n.g=r.type===j.Number?r.value/255:r.value/100),s.type!==j.None&&(n.b=s.type===j.Number?s.value/255:s.value/100),o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var b_=lT;var cT=t=>t==="transparent"?{mode:"rgb",r:0,g:0,b:0,alpha:0}:void 0,S_=cT;var M_=(t,e,n)=>t+n*(e-t);var uT=t=>{let e=[];for(let n=0;n<t.length-1;n++){let i=t[n],r=t[n+1];i===void 0&&r===void 0?e.push(void 0):i!==void 0&&r!==void 0?e.push([i,r]):e.push(i!==void 0?[i,i]:[r,r])}return e},w_=t=>e=>{let n=uT(e);return i=>{let r=i*n.length,s=i>=1?n.length-1:Math.max(Math.floor(r),0),o=n[s];return o===void 0?void 0:t(o[0],o[1],r-s)}};var ee=w_(M_);var Je=t=>{let e=!1,n=t.map(i=>i!==void 0?(e=!0,i):1);return e?n:t};var dT={mode:"rgb",channels:["r","g","b","alpha"],parse:[b_,g_,x_,m_,S_,"srgb"],serialize:"srgb",interpolate:{r:ee,g:ee,b:ee,alpha:{use:ee,fixup:Je}},gamut:!0,white:{r:1,g:1,b:1},black:{r:0,g:0,b:0}},si=dT;var $m=(t=0)=>Math.pow(Math.abs(t),2.19921875)*Math.sign(t),fT=t=>{let e=$m(t.r),n=$m(t.g),i=$m(t.b),r={mode:"xyz65",x:.5766690429101305*e+.1855582379065463*n+.1882286462349947*i,y:.297344975250536*e+.6273635662554661*n+.0752914584939979*i,z:.0270313613864123*e+.0706888525358272*n+.9913375368376386*i};return t.alpha!==void 0&&(r.alpha=t.alpha),r},Ym=fT;var Zm=t=>Math.pow(Math.abs(t),.4547069271758437)*Math.sign(t),hT=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"a98",r:Zm(t*2.0415879038107465-e*.5650069742788597-.3447313507783297*n),g:Zm(t*-.9692436362808798+e*1.8759675015077206+.0415550574071756*n),b:Zm(t*.0134442806320312-e*.1183623922310184+1.0151749943912058*n)};return i!==void 0&&(r.alpha=i),r},Jm=hT;var Km=(t=0)=>{let e=Math.abs(t);return e<=.04045?t/12.92:(Math.sign(t)||1)*Math.pow((e+.055)/1.055,2.4)},pT=({r:t,g:e,b:n,alpha:i})=>{let r={mode:"lrgb",r:Km(t),g:Km(e),b:Km(n)};return i!==void 0&&(r.alpha=i),r},oi=pT;var mT=t=>{let{r:e,g:n,b:i,alpha:r}=oi(t),s={mode:"xyz65",x:.4123907992659593*e+.357584339383878*n+.1804807884018343*i,y:.2126390058715102*e+.715168678767756*n+.0721923153607337*i,z:.0193308187155918*e+.119194779794626*n+.9505321522496607*i};return r!==void 0&&(s.alpha=r),s},kn=mT;var jm=(t=0)=>{let e=Math.abs(t);return e>.0031308?(Math.sign(t)||1)*(1.055*Math.pow(e,.4166666666666667)-.055):t*12.92},gT=({r:t,g:e,b:n,alpha:i},r="rgb")=>{let s={mode:r,r:jm(t),g:jm(e),b:jm(n)};return i!==void 0&&(s.alpha=i),s},ai=gT;var vT=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=ai({r:t*3.2409699419045226-e*1.537383177570094-.4986107602930034*n,g:t*-.9692436362808796+e*1.8759675015077204+.0415550574071756*n,b:t*.0556300796969936-e*.2039769588889765+1.0569715142428784*n});return i!==void 0&&(r.alpha=i),r},Ln=vT;var xT={...si,mode:"a98",parse:["a98-rgb"],serialize:"a98-rgb",fromMode:{rgb:t=>Jm(kn(t)),xyz65:Jm},toMode:{rgb:t=>Ln(Ym(t)),xyz65:Ym}},E_=xT;var yT=t=>(t=t%360)<0?t+360:t,gt=yT;var _T=(t,e)=>t.map((n,i,r)=>{if(n===void 0)return n;let s=gt(n);return i===0||t[i-1]===void 0?s:e(s-gt(r[i-1]))}).reduce((n,i)=>!n.length||i===void 0||n[n.length-1]===void 0?(n.push(i),n):(n.push(i+n[n.length-1]),n),[]),Kt=t=>_T(t,e=>Math.abs(e)<=180?e:e-360*Math.sign(e));var Vt=[-.14861,1.78277,-.29227,-.90649,1.97294,0],T_=Math.PI/180,A_=180/Math.PI;var C_=Vt[3]*Vt[4],R_=Vt[1]*Vt[4],P_=Vt[1]*Vt[2]-Vt[0]*Vt[3],bT=({r:t,g:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=(P_*n+t*C_-e*R_)/(P_+C_-R_),s=n-r,o=(Vt[4]*(e-r)-Vt[2]*s)/Vt[3],a={mode:"cubehelix",l:r,s:r===0||r===1?void 0:Math.sqrt(s*s+o*o)/(Vt[4]*r*(1-r))};return a.s&&(a.h=Math.atan2(o,s)*A_-120),i!==void 0&&(a.alpha=i),a},I_=bT;var ST=({h:t,s:e,l:n,alpha:i})=>{let r={mode:"rgb"};t=(t===void 0?0:t+120)*T_,n===void 0&&(n=0);let s=e===void 0?0:e*n*(1-n),o=Math.cos(t),a=Math.sin(t);return r.r=n+s*(Vt[0]*o+Vt[1]*a),r.g=n+s*(Vt[2]*o+Vt[3]*a),r.b=n+s*(Vt[4]*o+Vt[5]*a),i!==void 0&&(r.alpha=i),r},k_=ST;var qr=(t,e)=>{if(t.h===void 0||e.h===void 0||!t.s||!e.s)return 0;let n=gt(t.h),i=gt(e.h),r=Math.sin((i-n+360)/2*Math.PI/180);return 2*Math.sqrt(t.s*e.s)*r},L_=(t,e)=>{if(t.h===void 0||e.h===void 0)return 0;let n=gt(t.h),i=gt(e.h);return Math.abs(i-n)>180?n-(i-360*Math.sign(i-n)):i-n},$r=(t,e)=>{if(t.h===void 0||e.h===void 0||!t.c||!e.c)return 0;let n=gt(t.h),i=gt(e.h),r=Math.sin((i-n+360)/2*Math.PI/180);return 2*Math.sqrt(t.c*e.c)*r};var jt=t=>{let e=t.reduce((i,r)=>{if(r!==void 0){let s=r*Math.PI/180;i.sin+=Math.sin(s),i.cos+=Math.cos(s)}return i},{sin:0,cos:0}),n=Math.atan2(e.sin,e.cos)*180/Math.PI;return n<0?360+n:n};var MT={mode:"cubehelix",channels:["h","s","l","alpha"],parse:["--cubehelix"],serialize:"--cubehelix",ranges:{h:[0,360],s:[0,4.614],l:[0,1]},fromMode:{rgb:I_},toMode:{rgb:k_},interpolate:{h:{use:ee,fixup:Kt},s:ee,l:ee,alpha:{use:ee,fixup:Je}},difference:{h:qr},average:{h:jt}},N_=MT;var wT=({l:t,a:e,b:n,alpha:i},r="lch")=>{e===void 0&&(e=0),n===void 0&&(n=0);let s=Math.sqrt(e*e+n*n),o={mode:r,l:t,c:s};return s&&(o.h=gt(Math.atan2(n,e)*180/Math.PI)),i!==void 0&&(o.alpha=i),o},Wn=wT;var ET=({l:t,c:e,h:n,alpha:i},r="lab")=>{n===void 0&&(n=0);let s={mode:r,l:t,a:e?e*Math.cos(n/180*Math.PI):0,b:e?e*Math.sin(n/180*Math.PI):0};return i!==void 0&&(s.alpha=i),s},Xn=ET;var Zu=Math.pow(29,3)/Math.pow(3,3),Ju=Math.pow(6,3)/Math.pow(29,3);var At={X:.9642956764295677,Y:1,Z:.8251046025104602},Yr={X:.3127/.329,Y:1,Z:(1-.3127-.329)/.329},AN=Math.pow(29,3)/Math.pow(3,3),CN=Math.pow(6,3)/Math.pow(29,3);var Qm=t=>Math.pow(t,3)>Ju?Math.pow(t,3):(116*t-16)/Zu,TT=({l:t,a:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=(t+16)/116,s=e/500+r,o=r-n/200,a={mode:"xyz65",x:Qm(s)*Yr.X,y:Qm(r)*Yr.Y,z:Qm(o)*Yr.Z};return i!==void 0&&(a.alpha=i),a},Ku=TT;var AT=t=>Ln(Ku(t)),Zr=AT;var e0=t=>t>Ju?Math.cbrt(t):(Zu*t+16)/116,CT=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=e0(t/Yr.X),s=e0(e/Yr.Y),o=e0(n/Yr.Z),a={mode:"lab65",l:116*s-16,a:500*(r-s),b:200*(s-o)};return i!==void 0&&(a.alpha=i),a},ju=CT;var RT=t=>{let e=ju(kn(t));return t.r===t.b&&t.b===t.g&&(e.a=e.b=0),e},Jr=RT;var Fs=.14444444444444443*Math.PI,Uo=Math.cos(Fs),Fo=Math.sin(Fs),Qu=100/Math.log(139/100);var PT=({l:t,c:e,h:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"lab65",l:(Math.exp(t*1/Qu)-1)/.0039},s=(Math.exp(.0435*e*1*1)-1)/.075,o=s*Math.cos(n/180*Math.PI-Fs),a=s*Math.sin(n/180*Math.PI-Fs);return r.a=o*Uo-a/.83*Fo,r.b=o*Fo+a/.83*Uo,i!==void 0&&(r.alpha=i),r},El=PT;var IT=({l:t,a:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=e*Uo+n*Fo,s=.83*(n*Uo-e*Fo),o=Math.sqrt(r*r+s*s),a={mode:"dlch",l:Qu/1*Math.log(1+.0039*t),c:Math.log(1+.075*o)/(.0435*1*1)};return a.c&&(a.h=gt((Math.atan2(s,r)+Fs)/Math.PI*180)),i!==void 0&&(a.alpha=i),a},Tl=IT;var D_=t=>El(Wn(t,"dlch")),U_=t=>Xn(Tl(t),"dlab"),kT={mode:"dlab",parse:["--din99o-lab"],serialize:"--din99o-lab",toMode:{lab65:D_,rgb:t=>Zr(D_(t))},fromMode:{lab65:U_,rgb:t=>U_(Jr(t))},channels:["l","a","b","alpha"],ranges:{l:[0,100],a:[-40.09,45.501],b:[-40.469,44.344]},interpolate:{l:ee,a:ee,b:ee,alpha:{use:ee,fixup:Je}}},F_=kT;var LT={mode:"dlch",parse:["--din99o-lch"],serialize:"--din99o-lch",toMode:{lab65:El,dlab:t=>Xn(t,"dlab"),rgb:t=>Zr(El(t))},fromMode:{lab65:Tl,dlab:t=>Wn(t,"dlch"),rgb:t=>Tl(Jr(t))},channels:["l","c","h","alpha"],ranges:{l:[0,100],c:[0,51.484],h:[0,360]},interpolate:{l:ee,c:ee,h:{use:ee,fixup:Kt},alpha:{use:ee,fixup:Je}},difference:{h:$r},average:{h:jt}},O_=LT;function n0({h:t,s:e,i:n,alpha:i}){t=gt(t!==void 0?t:0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.abs(t/60%2-1),s;switch(Math.floor(t/60)){case 0:s={r:n*(1+e*(3/(2-r)-1)),g:n*(1+e*(3*(1-r)/(2-r)-1)),b:n*(1-e)};break;case 1:s={r:n*(1+e*(3*(1-r)/(2-r)-1)),g:n*(1+e*(3/(2-r)-1)),b:n*(1-e)};break;case 2:s={r:n*(1-e),g:n*(1+e*(3/(2-r)-1)),b:n*(1+e*(3*(1-r)/(2-r)-1))};break;case 3:s={r:n*(1-e),g:n*(1+e*(3*(1-r)/(2-r)-1)),b:n*(1+e*(3/(2-r)-1))};break;case 4:s={r:n*(1+e*(3*(1-r)/(2-r)-1)),g:n*(1-e),b:n*(1+e*(3/(2-r)-1))};break;case 5:s={r:n*(1+e*(3/(2-r)-1)),g:n*(1-e),b:n*(1+e*(3*(1-r)/(2-r)-1))};break;default:s={r:n*(1-e),g:n*(1-e),b:n*(1-e)}}return s.mode="rgb",i!==void 0&&(s.alpha=i),s}function i0({r:t,g:e,b:n,alpha:i}){t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.max(t,e,n),s=Math.min(t,e,n),o={mode:"hsi",s:t+e+n===0?0:1-3*s/(t+e+n),i:(t+e+n)/3};return r-s!==0&&(o.h=(r===t?(e-n)/(r-s)+(e<n)*6:r===e?(n-t)/(r-s)+2:(t-e)/(r-s)+4)*60),i!==void 0&&(o.alpha=i),o}var NT={mode:"hsi",toMode:{rgb:n0},parse:["--hsi"],serialize:"--hsi",fromMode:{rgb:i0},channels:["h","s","i","alpha"],ranges:{h:[0,360]},gamut:"rgb",interpolate:{h:{use:ee,fixup:Kt},s:ee,i:ee,alpha:{use:ee,fixup:Je}},difference:{h:qr},average:{h:jt}},z_=NT;function r0({h:t,s:e,l:n,alpha:i}){t=gt(t!==void 0?t:0),e===void 0&&(e=0),n===void 0&&(n=0);let r=n+e*(n<.5?n:1-n),s=r-(r-n)*2*Math.abs(t/60%2-1),o;switch(Math.floor(t/60)){case 0:o={r,g:s,b:2*n-r};break;case 1:o={r:s,g:r,b:2*n-r};break;case 2:o={r:2*n-r,g:r,b:s};break;case 3:o={r:2*n-r,g:s,b:r};break;case 4:o={r:s,g:2*n-r,b:r};break;case 5:o={r,g:2*n-r,b:s};break;default:o={r:2*n-r,g:2*n-r,b:2*n-r}}return o.mode="rgb",i!==void 0&&(o.alpha=i),o}function s0({r:t,g:e,b:n,alpha:i}){t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.max(t,e,n),s=Math.min(t,e,n),o={mode:"hsl",s:r===s?0:(r-s)/(1-Math.abs(r+s-1)),l:.5*(r+s)};return r-s!==0&&(o.h=(r===t?(e-n)/(r-s)+(e<n)*6:r===e?(n-t)/(r-s)+2:(t-e)/(r-s)+4)*60),i!==void 0&&(o.alpha=i),o}var DT=(t,e)=>{switch(e){case"deg":return+t;case"rad":return t/Math.PI*180;case"grad":return t/10*9;case"turn":return t*360}},B_=DT;var UT=new RegExp(`^hsla?\\(\\s*${v_}${Xr}${Us}${Xr}${Us}\\s*(?:,\\s*${yl}\\s*)?\\)$`),FT=t=>{let e=t.match(UT);if(!e)return;let n={mode:"hsl"};return e[3]!==void 0?n.h=+e[3]:e[1]!==void 0&&e[2]!==void 0&&(n.h=B_(e[1],e[2])),e[4]!==void 0&&(n.s=Math.min(Math.max(0,e[4]/100),1)),e[5]!==void 0&&(n.l=Math.min(Math.max(0,e[5]/100),1)),e[6]!==void 0?n.alpha=Math.max(0,Math.min(1,e[6]/100)):e[7]!==void 0&&(n.alpha=Math.max(0,Math.min(1,+e[7]))),n},H_=FT;function OT(t,e){if(!e||e[0]!=="hsl"&&e[0]!=="hsla")return;let n={mode:"hsl"},[,i,r,s,o]=e;if(i.type!==j.None){if(i.type===j.Percentage)return;n.h=i.value}if(r.type!==j.None){if(r.type===j.Hue)return;n.s=r.value/100}if(s.type!==j.None){if(s.type===j.Hue)return;n.l=s.value/100}return o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var V_=OT;var zT={mode:"hsl",toMode:{rgb:r0},fromMode:{rgb:s0},channels:["h","s","l","alpha"],ranges:{h:[0,360]},gamut:"rgb",parse:[V_,H_],serialize:t=>`hsl(${t.h!==void 0?t.h:"none"} ${t.s!==void 0?t.s*100+"%":"none"} ${t.l!==void 0?t.l*100+"%":"none"}${t.alpha<1?` / ${t.alpha}`:""})`,interpolate:{h:{use:ee,fixup:Kt},s:ee,l:ee,alpha:{use:ee,fixup:Je}},difference:{h:qr},average:{h:jt}},ed=zT;function Al({h:t,s:e,v:n,alpha:i}){t=gt(t!==void 0?t:0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.abs(t/60%2-1),s;switch(Math.floor(t/60)){case 0:s={r:n,g:n*(1-e*r),b:n*(1-e)};break;case 1:s={r:n*(1-e*r),g:n,b:n*(1-e)};break;case 2:s={r:n*(1-e),g:n,b:n*(1-e*r)};break;case 3:s={r:n*(1-e),g:n*(1-e*r),b:n};break;case 4:s={r:n*(1-e*r),g:n*(1-e),b:n};break;case 5:s={r:n,g:n*(1-e),b:n*(1-e*r)};break;default:s={r:n*(1-e),g:n*(1-e),b:n*(1-e)}}return s.mode="rgb",i!==void 0&&(s.alpha=i),s}function Cl({r:t,g:e,b:n,alpha:i}){t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.max(t,e,n),s=Math.min(t,e,n),o={mode:"hsv",s:r===0?0:1-s/r,v:r};return r-s!==0&&(o.h=(r===t?(e-n)/(r-s)+(e<n)*6:r===e?(n-t)/(r-s)+2:(t-e)/(r-s)+4)*60),i!==void 0&&(o.alpha=i),o}var BT={mode:"hsv",toMode:{rgb:Al},parse:["--hsv"],serialize:"--hsv",fromMode:{rgb:Cl},channels:["h","s","v","alpha"],ranges:{h:[0,360]},gamut:"rgb",interpolate:{h:{use:ee,fixup:Kt},s:ee,v:ee,alpha:{use:ee,fixup:Je}},difference:{h:qr},average:{h:jt}},td=BT;function o0({h:t,w:e,b:n,alpha:i}){if(e===void 0&&(e=0),n===void 0&&(n=0),e+n>1){let r=e+n;e/=r,n/=r}return Al({h:t,s:n===1?1:1-e/(1-n),v:1-n,alpha:i})}function a0(t){let e=Cl(t);if(e===void 0)return;let n=e.s!==void 0?e.s:0,i=e.v!==void 0?e.v:0,r={mode:"hwb",w:(1-n)*i,b:1-i};return e.h!==void 0&&(r.h=e.h),e.alpha!==void 0&&(r.alpha=e.alpha),r}function HT(t,e){if(!e||e[0]!=="hwb")return;let n={mode:"hwb"},[,i,r,s,o]=e;if(i.type!==j.None){if(i.type===j.Percentage)return;n.h=i.value}if(r.type!==j.None){if(r.type===j.Hue)return;n.w=r.value/100}if(s.type!==j.None){if(s.type===j.Hue)return;n.b=s.value/100}return o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var G_=HT;var VT={mode:"hwb",toMode:{rgb:o0},fromMode:{rgb:a0},channels:["h","w","b","alpha"],ranges:{h:[0,360]},gamut:"rgb",parse:[G_],serialize:t=>`hwb(${t.h!==void 0?t.h:"none"} ${t.w!==void 0?t.w*100+"%":"none"} ${t.b!==void 0?t.b*100+"%":"none"}${t.alpha<1?` / ${t.alpha}`:""})`,interpolate:{h:{use:ee,fixup:Kt},w:ee,b:ee,alpha:{use:ee,fixup:Je}},difference:{h:L_},average:{h:jt}},W_=VT;var Oo=.1593017578125,X_=78.84375,zo=.8359375,Bo=18.8515625,Ho=18.6875;function nd(t){if(t<0)return 0;let e=Math.pow(t,1/X_);return 1e4*Math.pow(Math.max(0,e-zo)/(Bo-Ho*e),1/Oo)}function id(t){if(t<0)return 0;let e=Math.pow(t/1e4,Oo);return Math.pow((zo+Bo*e)/(1+Ho*e),X_)}var l0=t=>Math.max(t/203,0),WT=({i:t,t:e,p:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=nd(t+.008609037037932761*e+.11102962500302593*n),s=nd(t-.00860903703793275*e-.11102962500302599*n),o=nd(t+.5600313357106791*e-.32062717498731885*n),a={mode:"xyz65",x:l0(2.070152218389422*r-1.3263473389671556*s+.2066510476294051*o),y:l0(.3647385209748074*r+.680566024947227*s-.0453045459220346*o),z:l0(-.049747207535812*r-.0492609666966138*s+1.1880659249923042*o)};return i!==void 0&&(a.alpha=i),a},c0=WT;var u0=(t=0)=>Math.max(t*203,0),XT=({x:t,y:e,z:n,alpha:i})=>{let r=u0(t),s=u0(e),o=u0(n),a=id(.3592832590121217*r+.6976051147779502*s-.0358915932320289*o),l=id(-.1920808463704995*r+1.1004767970374323*s+.0753748658519118*o),c=id(.0070797844607477*r+.0748396662186366*s+.8433265453898765*o),d=.5*a+.5*l,f=1.61376953125*a-3.323486328125*l+1.709716796875*c,h=4.378173828125*a-4.24560546875*l-.132568359375*c,p={mode:"itp",i:d,t:f,p:h};return i!==void 0&&(p.alpha=i),p},d0=XT;var qT={mode:"itp",channels:["i","t","p","alpha"],parse:["--ictcp"],serialize:"--ictcp",toMode:{xyz65:c0,rgb:t=>Ln(c0(t))},fromMode:{xyz65:d0,rgb:t=>d0(kn(t))},ranges:{i:[0,.581],t:[-.369,.272],p:[-.164,.331]},interpolate:{i:ee,t:ee,p:ee,alpha:{use:ee,fixup:Je}}},q_=qT;var $T=134.03437499999998,YT=16295499532821565e-27,f0=t=>{if(t<0)return 0;let e=Math.pow(t/1e4,Oo);return Math.pow((zo+Bo*e)/(1+Ho*e),$T)},h0=(t=0)=>Math.max(t*203,0),ZT=({x:t,y:e,z:n,alpha:i})=>{t=h0(t),e=h0(e),n=h0(n);let r=1.15*t-.15*n,s=.66*e+.34*t,o=f0(.41478972*r+.579999*s+.014648*n),a=f0(-.20151*r+1.120649*s+.0531008*n),l=f0(-.0166008*r+.2648*s+.6684799*n),c=(o+a)/2,d={mode:"jab",j:.44*c/(1-.56*c)-YT,a:3.524*o-4.066708*a+.542708*l,b:.199076*o+1.096799*a-1.295875*l};return i!==void 0&&(d.alpha=i),d},rd=ZT;var JT=134.03437499999998,$_=16295499532821565e-27,p0=t=>{if(t<0)return 0;let e=Math.pow(t,1/JT);return 1e4*Math.pow((zo-e)/(Ho*e-Bo),1/Oo)},m0=t=>t/203,KT=({j:t,a:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=(t+$_)/(.44+.56*(t+$_)),s=p0(r+.13860504*e+.058047316*n),o=p0(r-.13860504*e-.058047316*n),a=p0(r-.096019242*e-.8118919*n),l={mode:"xyz65",x:m0(1.661373024652174*s-.914523081304348*o+.23136208173913045*a),y:m0(-.3250758611844533*s+1.571847026732543*o-.21825383453227928*a),z:m0(-.090982811*s-.31272829*o+1.5227666*a)};return i!==void 0&&(l.alpha=i),l},sd=KT;var jT=t=>{let e=rd(kn(t));return t.r===t.b&&t.b===t.g&&(e.a=e.b=0),e},od=jT;var QT=t=>Ln(sd(t)),ad=QT;var e2={mode:"jab",channels:["j","a","b","alpha"],parse:["--jzazbz"],serialize:"--jzazbz",fromMode:{rgb:od,xyz65:rd},toMode:{rgb:ad,xyz65:sd},ranges:{j:[0,.222],a:[-.109,.129],b:[-.185,.134]},interpolate:{j:ee,a:ee,b:ee,alpha:{use:ee,fixup:Je}}},Y_=e2;var t2=({j:t,a:e,b:n,alpha:i})=>{e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.sqrt(e*e+n*n),s={mode:"jch",j:t,c:r};return r&&(s.h=gt(Math.atan2(n,e)*180/Math.PI)),i!==void 0&&(s.alpha=i),s},g0=t2;var n2=({j:t,c:e,h:n,alpha:i})=>{n===void 0&&(n=0);let r={mode:"jab",j:t,a:e?e*Math.cos(n/180*Math.PI):0,b:e?e*Math.sin(n/180*Math.PI):0};return i!==void 0&&(r.alpha=i),r},v0=n2;var i2={mode:"jch",parse:["--jzczhz"],serialize:"--jzczhz",toMode:{jab:v0,rgb:t=>ad(v0(t))},fromMode:{rgb:t=>g0(od(t)),jab:g0},channels:["j","c","h","alpha"],ranges:{j:[0,.221],c:[0,.19],h:[0,360]},interpolate:{h:{use:ee,fixup:Kt},c:ee,j:ee,alpha:{use:ee,fixup:Je}},difference:{h:$r},average:{h:jt}},Z_=i2;var Kr=Math.pow(29,3)/Math.pow(3,3),Vo=Math.pow(6,3)/Math.pow(29,3);var x0=t=>Math.pow(t,3)>Vo?Math.pow(t,3):(116*t-16)/Kr,r2=({l:t,a:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=(t+16)/116,s=e/500+r,o=r-n/200,a={mode:"xyz50",x:x0(s)*At.X,y:x0(r)*At.Y,z:x0(o)*At.Z};return i!==void 0&&(a.alpha=i),a},Go=r2;var s2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=ai({r:t*3.1341359569958707-e*1.6173863321612538-.4906619460083532*n,g:t*-.978795502912089+e*1.916254567259524+.03344273116131949*n,b:t*.07195537988411677-e*.2289768264158322+1.405386058324125*n});return i!==void 0&&(r.alpha=i),r},Fi=s2;var o2=t=>Fi(Go(t)),ld=o2;var a2=t=>{let{r:e,g:n,b:i,alpha:r}=oi(t),s={mode:"xyz50",x:.436065742824811*e+.3851514688337912*n+.14307845442264197*i,y:.22249319175623702*e+.7168870538238823*n+.06061979053616537*i,z:.013923904500943465*e+.09708128566574634*n+.7140993584005155*i};return r!==void 0&&(s.alpha=r),s},Oi=a2;var y0=t=>t>Vo?Math.cbrt(t):(Kr*t+16)/116,l2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=y0(t/At.X),s=y0(e/At.Y),o=y0(n/At.Z),a={mode:"lab",l:116*s-16,a:500*(r-s),b:200*(s-o)};return i!==void 0&&(a.alpha=i),a},Wo=l2;var c2=t=>{let e=Wo(Oi(t));return t.r===t.b&&t.b===t.g&&(e.a=e.b=0),e},cd=c2;function u2(t,e){if(!e||e[0]!=="lab")return;let n={mode:"lab"},[,i,r,s,o]=e;if(!(i.type===j.Hue||r.type===j.Hue||s.type===j.Hue))return i.type!==j.None&&(n.l=Math.min(Math.max(0,i.value),100)),r.type!==j.None&&(n.a=r.type===j.Number?r.value:r.value*125/100),s.type!==j.None&&(n.b=s.type===j.Number?s.value:s.value*125/100),o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var J_=u2;var d2={mode:"lab",toMode:{xyz50:Go,rgb:ld},fromMode:{xyz50:Wo,rgb:cd},channels:["l","a","b","alpha"],ranges:{l:[0,100],a:[-125,125],b:[-125,125]},parse:[J_],serialize:t=>`lab(${t.l!==void 0?t.l:"none"} ${t.a!==void 0?t.a:"none"} ${t.b!==void 0?t.b:"none"}${t.alpha<1?` / ${t.alpha}`:""})`,interpolate:{l:ee,a:ee,b:ee,alpha:{use:ee,fixup:Je}}},Xo=d2;var f2={...Xo,mode:"lab65",parse:["--lab-d65"],serialize:"--lab-d65",toMode:{xyz65:Ku,rgb:Zr},fromMode:{xyz65:ju,rgb:Jr},ranges:{l:[0,100],a:[-125,125],b:[-125,125]}},K_=f2;function h2(t,e){if(!e||e[0]!=="lch")return;let n={mode:"lch"},[,i,r,s,o]=e;if(i.type!==j.None){if(i.type===j.Hue)return;n.l=Math.min(Math.max(0,i.value),100)}if(r.type!==j.None&&(n.c=Math.max(0,r.type===j.Number?r.value:r.value*150/100)),s.type!==j.None){if(s.type===j.Percentage)return;n.h=s.value}return o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var j_=h2;var p2={mode:"lch",toMode:{lab:Xn,rgb:t=>ld(Xn(t))},fromMode:{rgb:t=>Wn(cd(t)),lab:Wn},channels:["l","c","h","alpha"],ranges:{l:[0,100],c:[0,150],h:[0,360]},parse:[j_],serialize:t=>`lch(${t.l!==void 0?t.l:"none"} ${t.c!==void 0?t.c:"none"} ${t.h!==void 0?t.h:"none"}${t.alpha<1?` / ${t.alpha}`:""})`,interpolate:{h:{use:ee,fixup:Kt},c:ee,l:ee,alpha:{use:ee,fixup:Je}},difference:{h:$r},average:{h:jt}},qo=p2;var m2={...qo,mode:"lch65",parse:["--lch-d65"],serialize:"--lch-d65",toMode:{lab65:t=>Xn(t,"lab65"),rgb:t=>Zr(Xn(t,"lab65"))},fromMode:{rgb:t=>Wn(Jr(t),"lch65"),lab65:t=>Wn(t,"lch65")},ranges:{l:[0,100],c:[0,150],h:[0,360]}},Q_=m2;var g2=({l:t,u:e,v:n,alpha:i})=>{e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.sqrt(e*e+n*n),s={mode:"lchuv",l:t,c:r};return r&&(s.h=gt(Math.atan2(n,e)*180/Math.PI)),i!==void 0&&(s.alpha=i),s},_0=g2;var v2=({l:t,c:e,h:n,alpha:i})=>{n===void 0&&(n=0);let r={mode:"luv",l:t,u:e?e*Math.cos(n/180*Math.PI):0,v:e?e*Math.sin(n/180*Math.PI):0};return i!==void 0&&(r.alpha=i),r},b0=v2;var eb=(t,e,n)=>4*t/(t+15*e+3*n),tb=(t,e,n)=>9*e/(t+15*e+3*n),x2=eb(At.X,At.Y,At.Z),y2=tb(At.X,At.Y,At.Z),_2=t=>t<=Vo?Kr*t:116*Math.cbrt(t)-16,b2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=_2(e/At.Y),s=eb(t,e,n),o=tb(t,e,n);!isFinite(s)||!isFinite(o)?r=s=o=0:(s=13*r*(s-x2),o=13*r*(o-y2));let a={mode:"luv",l:r,u:s,v:o};return i!==void 0&&(a.alpha=i),a},Rl=b2;var S2=(t,e,n)=>4*t/(t+15*e+3*n),M2=(t,e,n)=>9*e/(t+15*e+3*n),w2=S2(At.X,At.Y,At.Z),E2=M2(At.X,At.Y,At.Z),T2=({l:t,u:e,v:n,alpha:i})=>{if(t===void 0&&(t=0),t===0)return{mode:"xyz50",x:0,y:0,z:0};e===void 0&&(e=0),n===void 0&&(n=0);let r=e/(13*t)+w2,s=n/(13*t)+E2,o=At.Y*(t<=8?t/Kr:Math.pow((t+16)/116,3)),a=o*(9*r)/(4*s),l=o*(12-3*r-20*s)/(4*s),c={mode:"xyz50",x:a,y:o,z:l};return i!==void 0&&(c.alpha=i),c},Pl=T2;var A2=t=>_0(Rl(Oi(t))),C2=t=>Fi(Pl(b0(t))),R2={mode:"lchuv",toMode:{luv:b0,rgb:C2},fromMode:{rgb:A2,luv:_0},channels:["l","c","h","alpha"],parse:["--lchuv"],serialize:"--lchuv",ranges:{l:[0,100],c:[0,176.956],h:[0,360]},interpolate:{h:{use:ee,fixup:Kt},c:ee,l:ee,alpha:{use:ee,fixup:Je}},difference:{h:$r},average:{h:jt}},nb=R2;var P2={...si,mode:"lrgb",toMode:{rgb:ai},fromMode:{rgb:oi},parse:["srgb-linear"],serialize:"srgb-linear"},ib=P2;var I2={mode:"luv",toMode:{xyz50:Pl,rgb:t=>Fi(Pl(t))},fromMode:{xyz50:Rl,rgb:t=>Rl(Oi(t))},channels:["l","u","v","alpha"],parse:["--luv"],serialize:"--luv",ranges:{l:[0,100],u:[-84.936,175.042],v:[-125.882,87.243]},interpolate:{l:ee,u:ee,v:ee,alpha:{use:ee,fixup:Je}}},rb=I2;var k2=({r:t,g:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.cbrt(.412221469470763*t+.5363325372617348*e+.0514459932675022*n),s=Math.cbrt(.2119034958178252*t+.6806995506452344*e+.1073969535369406*n),o=Math.cbrt(.0883024591900564*t+.2817188391361215*e+.6299787016738222*n),a={mode:"oklab",l:.210454268309314*r+.7936177747023054*s-.0040720430116193*o,a:1.9779985324311684*r-2.42859224204858*s+.450593709617411*o,b:.0259040424655478*r+.7827717124575296*s-.8086757549230774*o};return i!==void 0&&(a.alpha=i),a},ud=k2;var L2=t=>{let e=ud(oi(t));return t.r===t.b&&t.b===t.g&&(e.a=e.b=0),e},jr=L2;var N2=({l:t,a:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=Math.pow(t+.3963377773761749*e+.2158037573099136*n,3),s=Math.pow(t-.1055613458156586*e-.0638541728258133*n,3),o=Math.pow(t-.0894841775298119*e-1.2914855480194092*n,3),a={mode:"lrgb",r:4.076741636075957*r-3.3077115392580616*s+.2309699031821044*o,g:-1.2684379732850317*r+2.6097573492876887*s-.3413193760026573*o,b:-.0041960761386756*r-.7034186179359362*s+1.7076146940746117*o};return i!==void 0&&(a.alpha=i),a},zi=N2;var D2=t=>ai(zi(t)),Qr=D2;function Il(t){let i=1.170873786407767;return .5*(i*t-.206+Math.sqrt((i*t-.206)*(i*t-.206)+4*.03*i*t))}function Os(t){return(t*t+.206*t)/(1.170873786407767*(t+.03))}function U2(t,e){let n,i,r,s,o,a,l,c;-1.88170328*t-.80936493*e>1?(n=1.19086277,i=1.76576728,r=.59662641,s=.75515197,o=.56771245,a=4.0767416621,l=-3.3077115913,c=.2309699292):1.81444104*t-1.19445276*e>1?(n=.73956515,i=-.45954404,r=.08285427,s=.1254107,o=.14503204,a=-1.2684380046,l=2.6097574011,c=-.3413193965):(n=1.35733652,i=-.00915799,r=-1.1513021,s=-.50559606,o=.00692167,a=-.0041960863,l=-.7034186147,c=1.707614701);let d=n+i*t+r*e+s*t*t+o*t*e,f=.3963377774*t+.2158037573*e,h=-.1055613458*t-.0638541728*e,p=-.0894841775*t-1.291485548*e;{let v=1+d*f,y=1+d*h,m=1+d*p,u=v*v*v,g=y*y*y,x=m*m*m,_=3*f*v*v,T=3*h*y*y,E=3*p*m*m,A=6*f*f*v,R=6*h*h*y,w=6*p*p*m,S=a*u+l*g+c*x,P=a*_+l*T+c*E,z=a*A+l*R+c*w;d=d-S*P/(P*P-.5*S*z)}return d}function S0(t,e){let n=U2(t,e),i=zi({l:1,a:n*t,b:n*e}),r=Math.cbrt(1/Math.max(i.r,i.g,i.b)),s=r*n;return[r,s]}function F2(t,e,n,i,r,s=null){s||(s=S0(t,e));let o;if((n-r)*s[1]-(s[0]-r)*i<=0)o=s[1]*r/(i*s[0]+s[1]*(r-n));else{o=s[1]*(r-1)/(i*(s[0]-1)+s[1]*(r-n));{let a=n-r,l=i,c=.3963377774*t+.2158037573*e,d=-.1055613458*t-.0638541728*e,f=-.0894841775*t-1.291485548*e,h=a+l*c,p=a+l*d,v=a+l*f;{let y=r*(1-o)+o*n,m=o*i,u=y+m*c,g=y+m*d,x=y+m*f,_=u*u*u,T=g*g*g,E=x*x*x,A=3*h*u*u,R=3*p*g*g,w=3*v*x*x,S=6*h*h*u,P=6*p*p*g,z=6*v*v*x,L=4.0767416621*_-3.3077115913*T+.2309699292*E-1,O=4.0767416621*A-3.3077115913*R+.2309699292*w,X=4.0767416621*S-3.3077115913*P+.2309699292*z,H=O/(O*O-.5*L*X),Z=-L*H,G=-1.2684380046*_+2.6097574011*T-.3413193965*E-1,oe=-1.2684380046*A+2.6097574011*R-.3413193965*w,le=-1.2684380046*S+2.6097574011*P-.3413193965*z,te=oe/(oe*oe-.5*G*le),ge=-G*te,Ge=-.0041960863*_-.7034186147*T+1.707614701*E-1,W=-.0041960863*A-.7034186147*R+1.707614701*w,se=-.0041960863*S-.7034186147*P+1.707614701*z,ye=W/(W*W-.5*Ge*se),ae=-Ge*ye;Z=H>=0?Z:1e6,ge=te>=0?ge:1e6,ae=ye>=0?ae:1e6,o+=Math.min(Z,Math.min(ge,ae))}}}return o}function kl(t,e,n=null){n||(n=S0(t,e));let i=n[0],r=n[1];return[r/i,r/(1-i)]}function dd(t,e,n){let i=S0(e,n),r=F2(e,n,t,1,t,i),s=kl(e,n,i),o=.11516993+1/(7.4477897+4.1590124*n+e*(-2.19557347+1.75198401*n+e*(-2.13704948-10.02301043*n+e*(-4.24894561+5.38770819*n+4.69891013*e)))),a=.11239642+1/(1.6132032-.68124379*n+e*(.40370612+.90148123*n+e*(-.27087943+.6122399*n+e*(.00299215-.45399568*n-.14661872*e)))),l=r/Math.min(t*s[0],(1-t)*s[1]),c=t*o,d=(1-t)*a,f=.9*l*Math.sqrt(Math.sqrt(1/(1/(c*c*c*c)+1/(d*d*d*d))));return c=t*.4,d=(1-t)*.8,[Math.sqrt(1/(1/(c*c)+1/(d*d))),f,r]}function fd(t){let e=t.l!==void 0?t.l:0,n=t.a!==void 0?t.a:0,i=t.b!==void 0?t.b:0,r={mode:"okhsl",l:Il(e)};t.alpha!==void 0&&(r.alpha=t.alpha);let s=Math.sqrt(n*n+i*i);if(!s)return r.s=0,r;let[o,a,l]=dd(e,n/s,i/s),c;if(s<a){let d=0,f=.8*o,h=1-f/a;c=(s-d)/(f+h*(s-d))*.8}else{let d=a,f=.2*a*a*1.25*1.25/o,h=1-f/(l-a);c=.8+.2*((s-d)/(f+h*(s-d)))}return c&&(r.s=c,r.h=gt(Math.atan2(i,n)*180/Math.PI)),r}function hd(t){let e=t.h!==void 0?t.h:0,n=t.s!==void 0?t.s:0,i=t.l!==void 0?t.l:0,r={mode:"oklab",l:Os(i)};if(t.alpha!==void 0&&(r.alpha=t.alpha),!n||i===1)return r.a=r.b=0,r;let s=Math.cos(e/180*Math.PI),o=Math.sin(e/180*Math.PI),[a,l,c]=dd(r.l,s,o),d,f,h,p;n<.8?(d=1.25*n,f=0,h=.8*a,p=1-h/l):(d=5*(n-.8),f=l,h=.2*l*l*1.25*1.25/a,p=1-h/(c-l));let v=f+d*h/(1-p*d);return r.a=v*s,r.b=v*o,r}var O2={...ed,mode:"okhsl",channels:["h","s","l","alpha"],parse:["--okhsl"],serialize:"--okhsl",fromMode:{oklab:fd,rgb:t=>fd(jr(t))},toMode:{oklab:hd,rgb:t=>Qr(hd(t))}},sb=O2;function pd(t){let e=t.l!==void 0?t.l:0,n=t.a!==void 0?t.a:0,i=t.b!==void 0?t.b:0,r=Math.sqrt(n*n+i*i),s=r?n/r:1,o=r?i/r:1,[a,l]=kl(s,o),c=.5,d=1-c/a,f=l/(r+e*l),h=f*e,p=f*r,v=Os(h),y=p*v/h,m=zi({l:v,a:s*y,b:o*y}),u=Math.cbrt(1/Math.max(m.r,m.g,m.b,0));e=e/u,r=r/u*Il(e)/e,e=Il(e);let g={mode:"okhsv",s:r?(c+l)*p/(l*c+l*d*p):0,v:e?e/h:0};return g.s&&(g.h=gt(Math.atan2(i,n)*180/Math.PI)),t.alpha!==void 0&&(g.alpha=t.alpha),g}function md(t){let e={mode:"oklab"};t.alpha!==void 0&&(e.alpha=t.alpha);let n=t.h!==void 0?t.h:0,i=t.s!==void 0?t.s:0,r=t.v!==void 0?t.v:0,s=Math.cos(n/180*Math.PI),o=Math.sin(n/180*Math.PI),[a,l]=kl(s,o),c=.5,d=1-c/a,f=1-i*c/(c+l-l*d*i),h=i*l*c/(c+l-l*d*i),p=Os(f),v=h*p/f,y=zi({l:p,a:s*v,b:o*v}),m=Math.cbrt(1/Math.max(y.r,y.g,y.b,0)),u=Os(r*f),g=h*u/f;return e.l=u*m,e.a=g*s*m,e.b=g*o*m,e}var z2={...td,mode:"okhsv",channels:["h","s","v","alpha"],parse:["--okhsv"],serialize:"--okhsv",fromMode:{oklab:pd,rgb:t=>pd(jr(t))},toMode:{oklab:md,rgb:t=>Qr(md(t))}},ob=z2;function B2(t,e){if(!e||e[0]!=="oklab")return;let n={mode:"oklab"},[,i,r,s,o]=e;if(!(i.type===j.Hue||r.type===j.Hue||s.type===j.Hue))return i.type!==j.None&&(n.l=Math.min(Math.max(0,i.type===j.Number?i.value:i.value/100),1)),r.type!==j.None&&(n.a=r.type===j.Number?r.value:r.value*.4/100),s.type!==j.None&&(n.b=s.type===j.Number?s.value:s.value*.4/100),o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var ab=B2;var H2={...Xo,mode:"oklab",toMode:{lrgb:zi,rgb:Qr},fromMode:{lrgb:ud,rgb:jr},ranges:{l:[0,1],a:[-.4,.4],b:[-.4,.4]},parse:[ab],serialize:t=>`oklab(${t.l!==void 0?t.l:"none"} ${t.a!==void 0?t.a:"none"} ${t.b!==void 0?t.b:"none"}${t.alpha<1?` / ${t.alpha}`:""})`},lb=H2;function V2(t,e){if(!e||e[0]!=="oklch")return;let n={mode:"oklch"},[,i,r,s,o]=e;if(i.type!==j.None){if(i.type===j.Hue)return;n.l=Math.min(Math.max(0,i.type===j.Number?i.value:i.value/100),1)}if(r.type!==j.None&&(n.c=Math.max(0,r.type===j.Number?r.value:r.value*.4/100)),s.type!==j.None){if(s.type===j.Percentage)return;n.h=s.value}return o.type!==j.None&&(n.alpha=Math.min(1,Math.max(0,o.type===j.Number?o.value:o.value/100))),n}var cb=V2;var G2={...qo,mode:"oklch",toMode:{oklab:t=>Xn(t,"oklab"),rgb:t=>Qr(Xn(t,"oklab"))},fromMode:{rgb:t=>Wn(jr(t),"oklch"),oklab:t=>Wn(t,"oklch")},parse:[cb],serialize:t=>`oklch(${t.l!==void 0?t.l:"none"} ${t.c!==void 0?t.c:"none"} ${t.h!==void 0?t.h:"none"}${t.alpha<1?` / ${t.alpha}`:""})`,ranges:{l:[0,1],c:[0,.4],h:[0,360]}},ub=G2;var W2=t=>{let{r:e,g:n,b:i,alpha:r}=oi(t),s={mode:"xyz65",x:.486570948648216*e+.265667693169093*n+.1982172852343625*i,y:.2289745640697487*e+.6917385218365062*n+.079286914093745*i,z:0*e+.0451133818589026*n+1.043944368900976*i};return r!==void 0&&(s.alpha=r),s},M0=W2;var X2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=ai({r:t*2.4934969119414263-e*.9313836179191242-.402710784450717*n,g:t*-.8294889695615749+e*1.7626640603183465+.0236246858419436*n,b:t*.0358458302437845-e*.0761723892680418+.9568845240076871*n},"p3");return i!==void 0&&(r.alpha=i),r},w0=X2;var q2={...si,mode:"p3",parse:["display-p3"],serialize:"display-p3",fromMode:{rgb:t=>w0(kn(t)),xyz65:w0},toMode:{rgb:t=>Ln(M0(t)),xyz65:M0}},db=q2;var E0=t=>{let e=Math.abs(t);return e>=.001953125?Math.sign(t)*Math.pow(e,.5555555555555556):16*t},$2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"prophoto",r:E0(t*1.3457868816471585-e*.2555720873797946-.0511018649755453*n),g:E0(t*-.5446307051249019+e*1.5082477428451466+.0205274474364214*n),b:E0(t*0+e*0+1.2119675456389452*n)};return i!==void 0&&(r.alpha=i),r},T0=$2;var A0=(t=0)=>{let e=Math.abs(t);return e>=.03125?Math.sign(t)*Math.pow(e,1.8):t/16},Y2=t=>{let e=A0(t.r),n=A0(t.g),i=A0(t.b),r={mode:"xyz50",x:.7977666449006423*e+.1351812974005331*n+.0313477341283922*i,y:.2880748288194013*e+.7118352342418731*n+899369387256e-16*i,z:0*e+0*n+.8251046025104602*i};return t.alpha!==void 0&&(r.alpha=t.alpha),r},C0=Y2;var Z2={...si,mode:"prophoto",parse:["prophoto-rgb"],serialize:"prophoto-rgb",fromMode:{xyz50:T0,rgb:t=>T0(Oi(t))},toMode:{xyz50:C0,rgb:t=>Fi(C0(t))}},fb=Z2;var hb=1.09929682680944,J2=.018053968510807,R0=t=>{let e=Math.abs(t);return e>J2?(Math.sign(t)||1)*(hb*Math.pow(e,.45)-(hb-1)):4.5*t},K2=({x:t,y:e,z:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"rec2020",r:R0(t*1.7166511879712683-e*.3556707837763925-.2533662813736599*n),g:R0(t*-.6666843518324893+e*1.6164812366349395+.0157685458139111*n),b:R0(t*.0176398574453108-e*.0427706132578085+.9421031212354739*n)};return i!==void 0&&(r.alpha=i),r},P0=K2;var pb=1.09929682680944,j2=.018053968510807,I0=(t=0)=>{let e=Math.abs(t);return e<j2*4.5?t/4.5:(Math.sign(t)||1)*Math.pow((e+pb-1)/pb,1/.45)},Q2=t=>{let e=I0(t.r),n=I0(t.g),i=I0(t.b),r={mode:"xyz65",x:.6369580483012911*e+.1446169035862083*n+.1688809751641721*i,y:.262700212011267*e+.6779980715188708*n+.059301716469862*i,z:0*e+.0280726930490874*n+1.0609850577107909*i};return t.alpha!==void 0&&(r.alpha=t.alpha),r},k0=Q2;var eA={...si,mode:"rec2020",fromMode:{xyz65:P0,rgb:t=>P0(kn(t))},toMode:{xyz65:k0,rgb:t=>Ln(k0(t))},parse:["rec2020"],serialize:"rec2020"},mb=eA;var lr=.0037930732552754493,gd=Math.cbrt(lr);var L0=t=>Math.cbrt(t)-gd,tA=t=>{let{r:e,g:n,b:i,alpha:r}=oi(t),s=L0(.3*e+.622*n+.078*i+lr),o=L0(.23*e+.692*n+.078*i+lr),a=L0(.2434226892454782*e+.2047674442449682*n+.5518098665095535*i+lr),l={mode:"xyb",x:(s-o)/2,y:(s+o)/2,b:a-(s+o)/2};return r!==void 0&&(l.alpha=r),l},gb=tA;var N0=t=>Math.pow(t+gd,3),nA=({x:t,y:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r=N0(t+e)-lr,s=N0(e-t)-lr,o=N0(n+e)-lr,a=ai({r:11.031566904639861*r-9.866943908131562*s-.16462299650829934*o,g:-3.2541473810744237*r+4.418770377582723*s-.16462299650829934*o,b:-3.6588512867136815*r+2.7129230459360922*s+1.9459282407775895*o});return i!==void 0&&(a.alpha=i),a},vb=nA;var iA={mode:"xyb",channels:["x","y","b","alpha"],parse:["--xyb"],serialize:"--xyb",toMode:{rgb:vb},fromMode:{rgb:gb},ranges:{x:[-.0154,.0281],y:[0,.8453],b:[-.2778,.388]},interpolate:{x:ee,y:ee,b:ee,alpha:{use:ee,fixup:Je}}},xb=iA;var rA={mode:"xyz50",parse:["xyz-d50"],serialize:"xyz-d50",toMode:{rgb:Fi,lab:Wo},fromMode:{rgb:Oi,lab:Go},channels:["x","y","z","alpha"],ranges:{x:[0,.964],y:[0,.999],z:[0,.825]},interpolate:{x:ee,y:ee,z:ee,alpha:{use:ee,fixup:Je}}},yb=rA;var sA=t=>{let{x:e,y:n,z:i,alpha:r}=t;e===void 0&&(e=0),n===void 0&&(n=0),i===void 0&&(i=0);let s={mode:"xyz50",x:1.0479298208405488*e+.0229467933410191*n-.0501922295431356*i,y:.0296278156881593*e+.990434484573249*n-.0170738250293851*i,z:-.0092430581525912*e+.0150551448965779*n+.7518742899580008*i};return r!==void 0&&(s.alpha=r),s},_b=sA;var oA=t=>{let{x:e,y:n,z:i,alpha:r}=t;e===void 0&&(e=0),n===void 0&&(n=0),i===void 0&&(i=0);let s={mode:"xyz65",x:.9554734527042182*e-.0230985368742614*n+.0632593086610217*i,y:-.0283697069632081*e+1.0099954580058226*n+.021041398966943*i,z:.0123140016883199*e-.0205076964334779*n+1.3303659366080753*i};return r!==void 0&&(s.alpha=r),s},bb=oA;var aA={mode:"xyz65",toMode:{rgb:Ln,xyz50:_b},fromMode:{rgb:kn,xyz50:bb},ranges:{x:[0,.95],y:[0,1],z:[0,1.088]},channels:["x","y","z","alpha"],parse:["xyz","xyz-d65"],serialize:"xyz-d65",interpolate:{x:ee,y:ee,z:ee,alpha:{use:ee,fixup:Je}}},Sb=aA;var lA=({r:t,g:e,b:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"yiq",y:.29889531*t+.58662247*e+.11448223*n,i:.59597799*t-.2741761*e-.32180189*n,q:.21147017*t-.52261711*e+.31114694*n};return i!==void 0&&(r.alpha=i),r},Mb=lA;var cA=({y:t,i:e,q:n,alpha:i})=>{t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0);let r={mode:"rgb",r:t+.95608445*e+.6208885*n,g:t-.27137664*e-.6486059*n,b:t-1.10561724*e+1.70250126*n};return i!==void 0&&(r.alpha=i),r},wb=cA;var uA={mode:"yiq",toMode:{rgb:wb},fromMode:{rgb:Mb},channels:["y","i","q","alpha"],parse:["--yiq"],serialize:"--yiq",ranges:{i:[-.595,.595],q:[-.522,.522]},interpolate:{y:ee,i:ee,q:ee,alpha:{use:ee,fixup:Je}}},Eb=uA;var dA=(t,e)=>Math.round(t*(e=Math.pow(10,e)))/e,fA=(t=4)=>e=>typeof e=="number"?dA(e,t):e,Tb=fA;var Xz=Tb(2);var qz=bl("rgb"),$z=bl("hsl");var D0=t=>{let e=Wu(t);if(!e)return;let n=Xu(e.mode);if(!n.serialize||typeof n.serialize=="string"){let i=`color(${n.serialize||`--${e.mode}`} `;return n.channels.forEach((r,s)=>{r!=="alpha"&&(i+=(s?" ":"")+(e[r]!==void 0?e[r]:"none"))}),e.alpha!==void 0&&e.alpha<1&&(i+=` / ${e.alpha}`),i+")"}if(typeof n.serialize=="function")return n.serialize(e)};var N6=ot(E_),D6=ot(N_),U6=ot(F_),F6=ot(O_),O6=ot(z_),z6=ot(ed),B6=ot(td),H6=ot(W_),V6=ot(q_),G6=ot(Y_),W6=ot(Z_),X6=ot(Xo),q6=ot(K_),$6=ot(qo),Y6=ot(Q_),Z6=ot(nb),J6=ot(ib),K6=ot(rb),j6=ot(sb),Q6=ot(ob),eB=ot(lb),Ab=ot(ub),tB=ot(db),nB=ot(fb),iB=ot(mb),rB=ot(si),sB=ot(xb),oB=ot(yb),aB=ot(Sb),lB=ot(Eb);var U0={garden:{"--p31-accent":"oklch(76% 0.14 45)","--p31-accent-alt":"oklch(0.69 0.09 150)","--p31-accent-green":"oklch(0.68 0.12 152)","--p31-accent-red":"oklch(0.71 0.13 22)","--p31-accent-gold":"oklch(0.7 0.135 88)","--p31-accent-violet":"oklch(0.71 0.1 28)","--p31-bg":"oklch(14% 0.014 75)","--p31-void":"oklch(4% 0.008 75)","--p31-surface":"oklch(15% 0.017 74)","--p31-surface2":"oklch(15% 0.02 72)","--p31-text":"oklch(93% 0.012 80)","--p31-text-secondary":"oklch(83% 0.018 75)","--p31-text-tertiary":"oklch(76% 0.015 75)","--p31-glass-bg":"oklch(12% 0.015 74 / 0.90)","--p31-glass-bg-subtle":"oklch(12% 0.015 74 / 0.70)","--p31-glass-bg-strong":"oklch(12% 0.015 74 / 0.95)","--p31-glass-border":"oklch(100% 0.01 75 / 0.16)","--p31-glass-border-subtle":"oklch(100% 0.01 75 / 0.10)","--p31-glass-border-strong":"oklch(100% 0.01 75 / 0.25)","--p31-notif-gold":"oklch(0.7 0.135 88)","--p31-notif-green":"oklch(0.68 0.12 152)","--p31-notif-violet":"oklch(0.71 0.1 28)","--p31-notif-cyan":"oklch(0.69 0.09 150)","--p31-notif-rose":"oklch(0.71 0.13 22)","--p31-star-warm":"#d9a066","--p31-star-cool":"#8a7a68","--p31-accent-gradient":"linear-gradient(135deg, oklch(76% 0.14 45) 0%, oklch(0.70 0.135 88) 55%, oklch(0.68 0.12 152) 100%)","--p31-hero-gradient":"linear-gradient(160deg, oklch(76% 0.14 45 / 0.9) 0%, oklch(0.70 0.135 88 / 0.85) 50%, oklch(0.68 0.12 152 / 0.9) 100%)"},ocean:{"--p31-accent":"oklch(73% 0.18 195)","--p31-accent-alt":"oklch(0.71 0.18 285)","--p31-accent-green":"oklch(0.69 0.18 105)","--p31-accent-red":"oklch(0.71 0.18 20)","--p31-accent-gold":"oklch(0.71 0.18 15)","--p31-accent-violet":"oklch(0.7 0.14 275)","--p31-bg":"oklch(10% 0.01 240)","--p31-void":"oklch(4% 0.005 240)","--p31-surface":"oklch(12% 0.015 240)","--p31-surface2":"oklch(13% 0.02 240)","--p31-text":"oklch(96% 0.005 240)","--p31-text-secondary":"oklch(83% 0.01 240)","--p31-text-tertiary":"oklch(76% 0.01 240)","--p31-glass-bg":"oklch(10% 0.012 240 / 0.90)","--p31-glass-bg-subtle":"oklch(10% 0.012 240 / 0.70)","--p31-glass-bg-strong":"oklch(10% 0.012 240 / 0.95)","--p31-glass-border":"oklch(100% 0.01 240 / 0.16)","--p31-glass-border-subtle":"oklch(100% 0.01 240 / 0.10)","--p31-glass-border-strong":"oklch(100% 0.01 240 / 0.25)","--p31-notif-gold":"oklch(0.71 0.18 15)","--p31-notif-green":"oklch(0.69 0.18 105)","--p31-notif-violet":"oklch(0.7 0.14 275)","--p31-notif-cyan":"oklch(0.71 0.18 195)","--p31-notif-rose":"oklch(0.71 0.18 20)","--p31-star-warm":"#22d3ee","--p31-star-cool":"#8b5cf6","--p31-accent-gradient":"linear-gradient(135deg, oklch(73% 0.18 195) 0%, oklch(0.70 0.14 275) 55%, oklch(0.71 0.18 285) 100%)","--p31-hero-gradient":"linear-gradient(160deg, oklch(73% 0.18 195 / 0.9) 0%, oklch(0.70 0.14 275 / 0.85) 50%, oklch(0.71 0.18 285 / 0.9) 100%)"},aurora:{"--p31-accent":"oklch(71% 0.22 160)","--p31-accent-alt":"oklch(0.72 0.22 330)","--p31-accent-green":"oklch(0.68 0.2 130)","--p31-accent-red":"oklch(0.72 0.22 350)","--p31-accent-gold":"oklch(0.7 0.18 90)","--p31-accent-violet":"oklch(0.74 0.22 280)","--p31-bg":"oklch(12% 0.025 250)","--p31-void":"oklch(5% 0.012 250)","--p31-surface":"oklch(14% 0.025 200)","--p31-surface2":"oklch(15% 0.025 180)","--p31-text":"oklch(95% 0.01 100)","--p31-text-secondary":"oklch(82% 0.02 130)","--p31-text-tertiary":"oklch(76% 0.02 180)","--p31-glass-bg":"oklch(11% 0.02 200 / 0.90)","--p31-glass-bg-subtle":"oklch(11% 0.02 200 / 0.70)","--p31-glass-bg-strong":"oklch(11% 0.02 200 / 0.95)","--p31-glass-border":"oklch(100% 0.01 180 / 0.16)","--p31-glass-border-subtle":"oklch(100% 0.01 180 / 0.10)","--p31-glass-border-strong":"oklch(100% 0.01 180 / 0.25)","--p31-notif-gold":"oklch(0.7 0.18 90)","--p31-notif-green":"oklch(0.68 0.2 130)","--p31-notif-violet":"oklch(0.74 0.22 280)","--p31-notif-cyan":"oklch(0.72 0.22 330)","--p31-notif-rose":"oklch(0.72 0.22 350)","--p31-star-warm":"#a78bfa","--p31-star-cool":"#38bdf8","--p31-accent-gradient":"linear-gradient(135deg, oklch(71% 0.22 160) 0%, oklch(0.68 0.2 130) 55%, oklch(0.74 0.22 280) 100%)","--p31-hero-gradient":"linear-gradient(160deg, oklch(71% 0.22 160 / 0.9) 0%, oklch(0.68 0.2 130 / 0.85) 50%, oklch(0.74 0.22 280 / 0.9) 100%)"},zen:{"--p31-accent":"oklch(74% 0.01 100)","--p31-accent-alt":"oklch(0.69 0.01 100)","--p31-accent-green":"oklch(0.69 0.01 150)","--p31-accent-red":"oklch(0.69 0.005 30)","--p31-accent-gold":"oklch(0.69 0.01 90)","--p31-accent-violet":"oklch(0.69 0.005 280)","--p31-bg":"oklch(10% 0.005 100)","--p31-void":"oklch(3% 0.003 100)","--p31-surface":"oklch(13% 0.005 100)","--p31-surface2":"oklch(15% 0.005 100)","--p31-text":"oklch(92% 0.005 100)","--p31-text-secondary":"oklch(82% 0.005 100)","--p31-text-tertiary":"oklch(76% 0.005 100)","--p31-glass-bg":"oklch(11% 0.004 100 / 0.90)","--p31-glass-bg-subtle":"oklch(11% 0.004 100 / 0.70)","--p31-glass-bg-strong":"oklch(11% 0.004 100 / 0.95)","--p31-glass-border":"oklch(100% 0.002 100 / 0.16)","--p31-glass-border-subtle":"oklch(100% 0.002 100 / 0.10)","--p31-glass-border-strong":"oklch(100% 0.002 100 / 0.25)","--p31-notif-gold":"oklch(0.69 0.01 90)","--p31-notif-green":"oklch(0.69 0.01 150)","--p31-notif-violet":"oklch(0.69 0.005 280)","--p31-notif-cyan":"oklch(0.69 0.01 100)","--p31-notif-rose":"oklch(0.69 0.005 30)","--p31-star-warm":"#64748b","--p31-star-cool":"#475569","--p31-accent-gradient":"linear-gradient(135deg, oklch(74% 0.01 100) 0%, oklch(0.69 0.01 90) 55%, oklch(0.69 0.005 280) 100%)","--p31-hero-gradient":"linear-gradient(160deg, oklch(74% 0.01 100 / 0.9) 0%, oklch(0.69 0.01 90 / 0.85) 50%, oklch(0.69 0.005 280 / 0.9) 100%)"},volt:{"--p31-accent":"oklch(85% 0.22 105)","--p31-accent-alt":"oklch(0.69 0.18 80)","--p31-accent-green":"oklch(0.67 0.2 130)","--p31-accent-red":"oklch(0.7 0.18 30)","--p31-accent-gold":"oklch(0.68 0.2 90)","--p31-accent-violet":"oklch(0.7 0.18 280)","--p31-bg":"oklch(5% 0.01 240)","--p31-void":"oklch(2% 0.005 240)","--p31-surface":"oklch(9% 0.015 240)","--p31-surface2":"oklch(13% 0.02 240)","--p31-text":"oklch(98% 0.015 105)","--p31-text-secondary":"oklch(84% 0.01 100)","--p31-text-tertiary":"oklch(76% 0.01 100)","--p31-glass-bg":"oklch(8% 0.012 240 / 0.90)","--p31-glass-bg-subtle":"oklch(8% 0.012 240 / 0.70)","--p31-glass-bg-strong":"oklch(8% 0.012 240 / 0.95)","--p31-glass-border":"oklch(100% 0.01 100 / 0.16)","--p31-glass-border-subtle":"oklch(100% 0.01 100 / 0.10)","--p31-glass-border-strong":"oklch(100% 0.01 100 / 0.25)","--p31-notif-gold":"oklch(0.68 0.2 90)","--p31-notif-green":"oklch(0.67 0.2 130)","--p31-notif-violet":"oklch(0.7 0.18 280)","--p31-notif-cyan":"oklch(0.69 0.18 80)","--p31-notif-rose":"oklch(0.7 0.18 30)","--p31-star-warm":"#fbbf24","--p31-star-cool":"#f59e0b","--p31-accent-gradient":"linear-gradient(135deg, oklch(85% 0.22 105) 0%, oklch(0.68 0.2 90) 55%, oklch(0.7 0.18 280) 100%)","--p31-hero-gradient":"linear-gradient(160deg, oklch(85% 0.22 105 / 0.9) 0%, oklch(0.68 0.2 90 / 0.85) 50%, oklch(0.7 0.18 280 / 0.9) 100%)"}},hA={p31ca:{$extends:"ocean","--p31-accent":"oklch(70% 0.16 195)","--p31-accent-alt":"oklch(0.72 0.16 285)"},phos:{$extends:"aurora","--p31-accent":"oklch(72% 0.24 160)","--p31-accent-alt":"oklch(0.74 0.24 330)"},phosphorus31:{$extends:"garden","--p31-accent":"oklch(74% 0.15 45)","--p31-accent-alt":"oklch(0.70 0.10 150)"},willow:{$extends:"zen","--p31-accent":"oklch(72% 0.01 100)","--p31-accent-alt":"oklch(0.70 0.01 100)"},bonding:{$extends:"volt","--p31-accent":"oklch(82% 0.20 105)","--p31-accent-alt":"oklch(0.70 0.16 80)"}};function Cb(t){let e=hA[t];if(!e)throw new Error(`Unknown brand: ${t}`);let n=e.$extends?{...U0[e.$extends]}:{};for(let[i,r]of Object.entries(e))i!=="$extends"&&r!==void 0&&(n[i]=r);return n}var pA=f_()(h_((t,e)=>({theme:"ocean",age:"adult",brand:null,muted:!1,warmLight:!1,setTheme:n=>{t({theme:n}),e().applyTheme()},setAge:n=>{t({age:n}),e().applyTheme()},setBrand:n=>{t({brand:n}),e().applyTheme()},setMuted:n=>{t({muted:n}),e().applyTheme()},setWarmLight:n=>{t({warmLight:n}),e().applyTheme()},applyTheme:()=>{let{theme:n,age:i,brand:r,muted:s,warmLight:o}=e(),a=r?Cb(r):U0[n],l=document.documentElement;Object.entries(a).forEach(([c,d])=>{l.style.setProperty(c,yA(d,{muted:s,warmLight:o}))}),l.setAttribute("data-theme",n),l.setAttribute("data-age",i),l.setAttribute("data-brand",r??""),window.__P31_STAR_COLORS__={warm:a["--p31-star-warm"]??"#d9a066",cool:a["--p31-star-cool"]??"#8a7a68"},l.style.fontSize=i==="child"?"17px":"15px"}}),{name:"p31-portal-theme"})),mA=.45,gA=60,vA=.5;function xA(t,e,n){let i=(e-t+540)%360-180;return(t+i*n+360)%360}function yA(t,e){if(!e.muted&&!e.warmLight)return t;let n=_l(t);if(!n)return t;let i=n.mode==="oklch"?n:Ab(n);return e.muted&&(i={...i,c:Math.max(0,i.c*mA)}),e.warmLight&&i.h!==void 0&&(i={...i,h:xA(i.h,gA,vA)}),D0(i)}var Rb=Ce(Ue(),1);var Pb=Ce(Ue(),1);var Ib=Ce(Ue(),1);var kb=Ce(Ue(),1);async function O0(t,e){let n=await fetch(t,{credentials:"same-origin",headers:{accept:"application/json",...e?.body?{"content-type":"application/json"}:{}},...e});if(!n.ok)throw new Error(`${t} -> ${n.status}`);return await n.json()}function Lb(){return O0("/api/eye")}function Nb(){return O0("/api/whoami").catch(()=>({authenticated:!1}))}async function Db(t,e,n){return O0(`/api/control/${t}`,{method:"POST",body:JSON.stringify({name:e,reason:n})})}function Ub(t){let e=null;try{e=new EventSource("/api/sse"),e.addEventListener("status",()=>t()),e.onmessage=()=>t(),e.onerror=()=>{}}catch{e=null}return()=>e?.close()}var gs=Ce(pi());var oS=0,gg=1,aS=2;var vg=1,lS=2,Wi=3,mr=0,En=1,Xi=2,_r=0,Ws=1,qi=2,xg=3,yg=4,cS=5,ls=100,uS=101,dS=102,fS=103,hS=104,pS=200,mS=201,gS=202,vS=203,Bd=204,Hd=205,xS=206,yS=207,_S=208,bS=209,SS=210,MS=211,wS=212,ES=213,TS=214,pf=0,mf=1,gf=2,Xs=3,vf=4,xf=5,yf=6,_f=7,_g=0,AS=1,CS=2,br=0,RS=1,PS=2,IS=3,kS=4,LS=5,NS=6,DS=7;var bg=300,Js=301,Ks=302,bf=303,Sf=304,ic=306,Vd=1e3,as=1001,Gd=1002,ci=1003,US=1004;var rc=1005;var Ci=1006,Mf=1007;var hs=1008;var $i=1009,Sg=1010,Mg=1011,pa=1012,wf=1013,ps=1014,Yi=1015,ma=1016,Ef=1017,Tf=1018,ga=1020,wg=35902,Eg=1021,Tg=1022,ui=1023,oa=1026,va=1027,Ag=1028,Af=1029,Cg=1030,Cf=1031;var Rf=1033,sc=33776,oc=33777,ac=33778,lc=33779,Pf=35840,If=35841,kf=35842,Lf=35843,Nf=36196,Df=37492,Uf=37496,Ff=37808,Of=37809,zf=37810,Bf=37811,Hf=37812,Vf=37813,Gf=37814,Wf=37815,Xf=37816,qf=37817,$f=37818,Yf=37819,Zf=37820,Jf=37821,cc=36492,Kf=36494,jf=36495,Rg=36283,Qf=36284,eh=36285,th=36286;var zl=2300,Wd=2301,zd=2302,cg=2400,ug=2401,dg=2402;var FS=3200,OS=3201;var zS=0,BS=1,Sr="",Yn="srgb",qs="srgb-linear",Bl="linear",ft="srgb";var Gs=7680;var fg=519,HS=512,VS=513,GS=514,Pg=515,WS=516,XS=517,qS=518,$S=519,hg=35044;var Ig="300 es",Hi=2e3,Hl=2001;var gr=class{addEventListener(e,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(n)===-1&&i[e].push(n)}hasEventListener(e,n){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(n)!==-1}removeEventListener(e,n){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(n);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let n=this._listeners;if(n===void 0)return;let i=n[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}},fn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var z0=Math.PI/180,Xd=180/Math.PI;function uc(){let t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(fn[t&255]+fn[t>>8&255]+fn[t>>16&255]+fn[t>>24&255]+"-"+fn[e&255]+fn[e>>8&255]+"-"+fn[e>>16&15|64]+fn[e>>24&255]+"-"+fn[n&63|128]+fn[n>>8&255]+"-"+fn[n>>16&255]+fn[n>>24&255]+fn[i&255]+fn[i>>8&255]+fn[i>>16&255]+fn[i>>24&255]).toLowerCase()}function tt(t,e,n){return Math.max(e,Math.min(n,t))}function _A(t,e){return(t%e+e)%e}function B0(t,e,n){return(1-n)*t+n*e}function Ll(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return t/4294967295;case Uint16Array:return t/65535;case Uint8Array:return t/255;case Int32Array:return Math.max(t/2147483647,-1);case Int16Array:return Math.max(t/32767,-1);case Int8Array:return Math.max(t/127,-1);default:throw new Error("Invalid component type.")}}function Nn(t,e){switch(e.constructor){case Float32Array:return t;case Uint32Array:return Math.round(t*4294967295);case Uint16Array:return Math.round(t*65535);case Uint8Array:return Math.round(t*255);case Int32Array:return Math.round(t*2147483647);case Int16Array:return Math.round(t*32767);case Int8Array:return Math.round(t*127);default:throw new Error("Invalid component type.")}}var ht=class t{constructor(e=0,n=0){t.prototype.isVector2=!0,this.x=e,this.y=n}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,n){return this.x=e,this.y=n,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let n=this.x,i=this.y,r=e.elements;return this.x=r[0]*n+r[3]*i+r[6],this.y=r[1]*n+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,n){return this.x=tt(this.x,e.x,n.x),this.y=tt(this.y,e.y,n.y),this}clampScalar(e,n){return this.x=tt(this.x,e,n),this.y=tt(this.y,e,n),this}clampLength(e,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(tt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(e)/n;return Math.acos(tt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let n=this.x-e.x,i=this.y-e.y;return n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this}rotateAround(e,n){let i=Math.cos(n),r=Math.sin(n),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},vr=class{constructor(e=0,n=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=n,this._z=i,this._w=r}static slerpFlat(e,n,i,r,s,o,a){let l=i[r+0],c=i[r+1],d=i[r+2],f=i[r+3],h=s[o+0],p=s[o+1],v=s[o+2],y=s[o+3];if(a===0){e[n+0]=l,e[n+1]=c,e[n+2]=d,e[n+3]=f;return}if(a===1){e[n+0]=h,e[n+1]=p,e[n+2]=v,e[n+3]=y;return}if(f!==y||l!==h||c!==p||d!==v){let m=1-a,u=l*h+c*p+d*v+f*y,g=u>=0?1:-1,x=1-u*u;if(x>Number.EPSILON){let T=Math.sqrt(x),E=Math.atan2(T,u*g);m=Math.sin(m*E)/T,a=Math.sin(a*E)/T}let _=a*g;if(l=l*m+h*_,c=c*m+p*_,d=d*m+v*_,f=f*m+y*_,m===1-a){let T=1/Math.sqrt(l*l+c*c+d*d+f*f);l*=T,c*=T,d*=T,f*=T}}e[n]=l,e[n+1]=c,e[n+2]=d,e[n+3]=f}static multiplyQuaternionsFlat(e,n,i,r,s,o){let a=i[r],l=i[r+1],c=i[r+2],d=i[r+3],f=s[o],h=s[o+1],p=s[o+2],v=s[o+3];return e[n]=a*v+d*f+l*p-c*h,e[n+1]=l*v+d*h+c*f-a*p,e[n+2]=c*v+d*p+a*h-l*f,e[n+3]=d*v-a*f-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,n,i,r){return this._x=e,this._y=n,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,n=!0){let i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),d=a(r/2),f=a(s/2),h=l(i/2),p=l(r/2),v=l(s/2);switch(o){case"XYZ":this._x=h*d*f+c*p*v,this._y=c*p*f-h*d*v,this._z=c*d*v+h*p*f,this._w=c*d*f-h*p*v;break;case"YXZ":this._x=h*d*f+c*p*v,this._y=c*p*f-h*d*v,this._z=c*d*v-h*p*f,this._w=c*d*f+h*p*v;break;case"ZXY":this._x=h*d*f-c*p*v,this._y=c*p*f+h*d*v,this._z=c*d*v+h*p*f,this._w=c*d*f-h*p*v;break;case"ZYX":this._x=h*d*f-c*p*v,this._y=c*p*f+h*d*v,this._z=c*d*v-h*p*f,this._w=c*d*f+h*p*v;break;case"YZX":this._x=h*d*f+c*p*v,this._y=c*p*f+h*d*v,this._z=c*d*v-h*p*f,this._w=c*d*f-h*p*v;break;case"XZY":this._x=h*d*f-c*p*v,this._y=c*p*f-h*d*v,this._z=c*d*v+h*p*f,this._w=c*d*f+h*p*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,n){let i=n/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let n=e.elements,i=n[0],r=n[4],s=n[8],o=n[1],a=n[5],l=n[9],c=n[2],d=n[6],f=n[10],h=i+a+f;if(h>0){let p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(d-l)*p,this._y=(s-c)*p,this._z=(o-r)*p}else if(i>a&&i>f){let p=2*Math.sqrt(1+i-a-f);this._w=(d-l)/p,this._x=.25*p,this._y=(r+o)/p,this._z=(s+c)/p}else if(a>f){let p=2*Math.sqrt(1+a-i-f);this._w=(s-c)/p,this._x=(r+o)/p,this._y=.25*p,this._z=(l+d)/p}else{let p=2*Math.sqrt(1+f-i-a);this._w=(o-r)/p,this._x=(s+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,n){let i=e.dot(n)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*n.z-e.z*n.y,this._y=e.z*n.x-e.x*n.z,this._z=e.x*n.y-e.y*n.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(tt(this.dot(e),-1,1)))}rotateTowards(e,n){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,n/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,n){let i=e._x,r=e._y,s=e._z,o=e._w,a=n._x,l=n._y,c=n._z,d=n._w;return this._x=i*d+o*a+r*c-s*l,this._y=r*d+o*l+s*a-i*c,this._z=s*d+o*c+i*l-r*a,this._w=o*d-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(e,n){if(n===0)return this;if(n===1)return this.copy(e);let i=this._x,r=this._y,s=this._z,o=this._w,a=o*e._w+i*e._x+r*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=r,this._z=s,this;let l=1-a*a;if(l<=Number.EPSILON){let p=1-n;return this._w=p*o+n*this._w,this._x=p*i+n*this._x,this._y=p*r+n*this._y,this._z=p*s+n*this._z,this.normalize(),this}let c=Math.sqrt(l),d=Math.atan2(c,a),f=Math.sin((1-n)*d)/c,h=Math.sin(n*d)/c;return this._w=o*f+this._w*h,this._x=i*f+this._x*h,this._y=r*f+this._y*h,this._z=s*f+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,n,i){return this.copy(e).slerp(n,i)}random(){let e=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(n),s*Math.cos(n))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,n=0){return this._x=e[n],this._y=e[n+1],this._z=e[n+2],this._w=e[n+3],this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._w,e}fromBufferAttribute(e,n){return this._x=e.getX(n),this._y=e.getY(n),this._z=e.getZ(n),this._w=e.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},U=class t{constructor(e=0,n=0,i=0){t.prototype.isVector3=!0,this.x=e,this.y=n,this.z=i}set(e,n,i){return i===void 0&&(i=this.z),this.x=e,this.y=n,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,n){return this.x=e.x*n.x,this.y=e.y*n.y,this.z=e.z*n.z,this}applyEuler(e){return this.applyQuaternion(Fb.setFromEuler(e))}applyAxisAngle(e,n){return this.applyQuaternion(Fb.setFromAxisAngle(e,n))}applyMatrix3(e){let n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[3]*i+s[6]*r,this.y=s[1]*n+s[4]*i+s[7]*r,this.z=s[2]*n+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let n=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*n+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*n+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*n+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*n+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){let n=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*r-a*i),d=2*(a*n-s*r),f=2*(s*i-o*n);return this.x=n+l*c+o*f-a*d,this.y=i+l*d+a*c-s*f,this.z=r+l*f+s*d-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let n=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*n+s[4]*i+s[8]*r,this.y=s[1]*n+s[5]*i+s[9]*r,this.z=s[2]*n+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,n){return this.x=tt(this.x,e.x,n.x),this.y=tt(this.y,e.y,n.y),this.z=tt(this.z,e.z,n.z),this}clampScalar(e,n){return this.x=tt(this.x,e,n),this.y=tt(this.y,e,n),this.z=tt(this.z,e,n),this}clampLength(e,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(tt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,n){let i=e.x,r=e.y,s=e.z,o=n.x,a=n.y,l=n.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(e){let n=e.lengthSq();if(n===0)return this.set(0,0,0);let i=e.dot(this)/n;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return H0.copy(this).projectOnVector(e),this.sub(H0)}reflect(e){return this.sub(H0.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let n=Math.sqrt(this.lengthSq()*e.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(e)/n;return Math.acos(tt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let n=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return n*n+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,n,i){let r=Math.sin(n)*e;return this.x=r*Math.sin(i),this.y=Math.cos(n)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,n,i){return this.x=e*Math.sin(n),this.y=i,this.z=e*Math.cos(n),this}setFromMatrixPosition(e){let n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(e){let n=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=n,this.y=i,this.z=r,this}setFromMatrixColumn(e,n){return this.fromArray(e.elements,n*4)}setFromMatrix3Column(e,n){return this.fromArray(e.elements,n*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(e),this.y=n,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},H0=new U,Fb=new vr,$e=class t{constructor(e,n,i,r,s,o,a,l,c){t.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,o,a,l,c)}set(e,n,i,r,s,o,a,l,c){let d=this.elements;return d[0]=e,d[1]=r,d[2]=a,d[3]=n,d[4]=s,d[5]=l,d[6]=i,d[7]=o,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(e,n,i){return e.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let n=e.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){let i=e.elements,r=n.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],d=i[4],f=i[7],h=i[2],p=i[5],v=i[8],y=r[0],m=r[3],u=r[6],g=r[1],x=r[4],_=r[7],T=r[2],E=r[5],A=r[8];return s[0]=o*y+a*g+l*T,s[3]=o*m+a*x+l*E,s[6]=o*u+a*_+l*A,s[1]=c*y+d*g+f*T,s[4]=c*m+d*x+f*E,s[7]=c*u+d*_+f*A,s[2]=h*y+p*g+v*T,s[5]=h*m+p*x+v*E,s[8]=h*u+p*_+v*A,this}multiplyScalar(e){let n=this.elements;return n[0]*=e,n[3]*=e,n[6]*=e,n[1]*=e,n[4]*=e,n[7]*=e,n[2]*=e,n[5]*=e,n[8]*=e,this}determinant(){let e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8];return n*o*d-n*a*c-i*s*d+i*a*l+r*s*c-r*o*l}invert(){let e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8],f=d*o-a*c,h=a*l-d*s,p=c*s-o*l,v=n*f+i*h+r*p;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/v;return e[0]=f*y,e[1]=(r*c-d*i)*y,e[2]=(a*i-r*o)*y,e[3]=h*y,e[4]=(d*n-r*l)*y,e[5]=(r*s-a*n)*y,e[6]=p*y,e[7]=(i*l-c*n)*y,e[8]=(o*n-i*s)*y,this}transpose(){let e,n=this.elements;return e=n[1],n[1]=n[3],n[3]=e,e=n[2],n[2]=n[6],n[6]=e,e=n[5],n[5]=n[7],n[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let n=this.elements;return e[0]=n[0],e[1]=n[3],e[2]=n[6],e[3]=n[1],e[4]=n[4],e[5]=n[7],e[6]=n[2],e[7]=n[5],e[8]=n[8],this}setUvTransform(e,n,i,r,s,o,a){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-r*c,r*l,-r*(-c*o+l*a)+a+n,0,0,1),this}scale(e,n){return this.premultiply(V0.makeScale(e,n)),this}rotate(e){return this.premultiply(V0.makeRotation(-e)),this}translate(e,n){return this.premultiply(V0.makeTranslation(e,n)),this}makeTranslation(e,n){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,n,0,0,1),this}makeRotation(e){let n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(e,n){return this.set(e,0,0,0,n,0,0,0,1),this}equals(e){let n=this.elements,i=e.elements;for(let r=0;r<9;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<9;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){let i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},V0=new $e;function kg(t){for(let e=t.length-1;e>=0;--e)if(t[e]>=65535)return!0;return!1}function Vl(t){return document.createElementNS("http://www.w3.org/1999/xhtml",t)}function YS(){let t=Vl("canvas");return t.style.display="block",t}var Ob={};function $s(t){t in Ob||(Ob[t]=!0,console.warn(t))}function ZS(t,e,n){return new Promise(function(i,r){function s(){switch(t.clientWaitSync(e,t.SYNC_FLUSH_COMMANDS_BIT,0)){case t.WAIT_FAILED:r();break;case t.TIMEOUT_EXPIRED:setTimeout(s,n);break;default:i()}}setTimeout(s,n)})}function JS(t){let e=t.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function KS(t){let e=t.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var zb=new $e().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Bb=new $e().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function bA(){let t={enabled:!0,workingColorSpace:qs,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===ft&&(r.r=pr(r.r),r.g=pr(r.g),r.b=pr(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ft&&(r.r=sa(r.r),r.g=sa(r.g),r.b=sa(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Sr?Bl:this.spaces[r].transfer},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return $s("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),t.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return $s("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),t.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return t.define({[qs]:{primaries:e,whitePoint:i,transfer:Bl,toXYZ:zb,fromXYZ:Bb,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Yn},outputColorSpaceConfig:{drawingBufferColorSpace:Yn}},[Yn]:{primaries:e,whitePoint:i,transfer:ft,toXYZ:zb,fromXYZ:Bb,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Yn}}}),t}var rt=bA();function pr(t){return t<.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4)}function sa(t){return t<.0031308?t*12.92:1.055*Math.pow(t,.41666)-.055}var $o,qd=class{static getDataURL(e,n="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{$o===void 0&&($o=Vl("canvas")),$o.width=e.width,$o.height=e.height;let r=$o.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=$o}return i.toDataURL(n)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let n=Vl("canvas");n.width=e.width,n.height=e.height;let i=n.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=pr(s[o]/255)*255;return i.putImageData(r,0,0),n}else if(e.data){let n=e.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(pr(n[i]/255)*255):n[i]=pr(n[i]);return{data:n,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},SA=0,aa=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:SA++}),this.uuid=uc(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let n=this.data;return n instanceof HTMLVideoElement?e.set(n.videoWidth,n.videoHeight):n!==null?e.set(n.width,n.height,n.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let n=e===void 0||typeof e=="string";if(!n&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(G0(r[o].image)):s.push(G0(r[o]))}else s=G0(r);i.url=s}return n||(e.images[this.uuid]=i),i}};function G0(t){return typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap?qd.getDataURL(t):t.data?{data:Array.from(t.data),width:t.width,height:t.height,type:t.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var MA=0,W0=new U,Dn=class t extends gr{constructor(e=t.DEFAULT_IMAGE,n=t.DEFAULT_MAPPING,i=as,r=as,s=Ci,o=hs,a=ui,l=$i,c=t.DEFAULT_ANISOTROPY,d=Sr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:MA++}),this.uuid=uc(),this.name="",this.source=new aa(e),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ht(0,0),this.repeat=new ht(1,1),this.center=new ht(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new $e,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(W0).x}get height(){return this.source.getSize(W0).y}get depth(){return this.source.getSize(W0).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let n in e){let i=e[n];if(i===void 0){console.warn(`THREE.Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let r=this[n];if(r===void 0){console.warn(`THREE.Texture.setValues(): property '${n}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[n]=i}}toJSON(e){let n=e===void 0||typeof e=="string";if(!n&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==bg)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Vd:e.x=e.x-Math.floor(e.x);break;case as:e.x=e.x<0?0:1;break;case Gd:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Vd:e.y=e.y-Math.floor(e.y);break;case as:e.y=e.y<0?0:1;break;case Gd:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Dn.DEFAULT_IMAGE=null;Dn.DEFAULT_MAPPING=bg;Dn.DEFAULT_ANISOTROPY=1;var Ft=class t{constructor(e=0,n=0,i=0,r=1){t.prototype.isVector4=!0,this.x=e,this.y=n,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,n,i,r){return this.x=e,this.y=n,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,n){switch(e){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,n){return this.x=e.x+n.x,this.y=e.y+n.y,this.z=e.z+n.z,this.w=e.w+n.w,this}addScaledVector(e,n){return this.x+=e.x*n,this.y+=e.y*n,this.z+=e.z*n,this.w+=e.w*n,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,n){return this.x=e.x-n.x,this.y=e.y-n.y,this.z=e.z-n.z,this.w=e.w-n.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let n=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*n+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*n+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*n+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*n+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let n=Math.sqrt(1-e.w*e.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/n,this.y=e.y/n,this.z=e.z/n),this}setAxisAngleFromRotationMatrix(e){let n,i,r,s,l=e.elements,c=l[0],d=l[4],f=l[8],h=l[1],p=l[5],v=l[9],y=l[2],m=l[6],u=l[10];if(Math.abs(d-h)<.01&&Math.abs(f-y)<.01&&Math.abs(v-m)<.01){if(Math.abs(d+h)<.1&&Math.abs(f+y)<.1&&Math.abs(v+m)<.1&&Math.abs(c+p+u-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let x=(c+1)/2,_=(p+1)/2,T=(u+1)/2,E=(d+h)/4,A=(f+y)/4,R=(v+m)/4;return x>_&&x>T?x<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(x),r=E/i,s=A/i):_>T?_<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(_),i=E/r,s=R/r):T<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),i=A/s,r=R/s),this.set(i,r,s,n),this}let g=Math.sqrt((m-v)*(m-v)+(f-y)*(f-y)+(h-d)*(h-d));return Math.abs(g)<.001&&(g=1),this.x=(m-v)/g,this.y=(f-y)/g,this.z=(h-d)/g,this.w=Math.acos((c+p+u-1)/2),this}setFromMatrixPosition(e){let n=e.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,n){return this.x=tt(this.x,e.x,n.x),this.y=tt(this.y,e.y,n.y),this.z=tt(this.z,e.z,n.z),this.w=tt(this.w,e.w,n.w),this}clampScalar(e,n){return this.x=tt(this.x,e,n),this.y=tt(this.y,e,n),this.z=tt(this.z,e,n),this.w=tt(this.w,e,n),this}clampLength(e,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(tt(i,e,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,n){return this.x+=(e.x-this.x)*n,this.y+=(e.y-this.y)*n,this.z+=(e.z-this.z)*n,this.w+=(e.w-this.w)*n,this}lerpVectors(e,n,i){return this.x=e.x+(n.x-e.x)*i,this.y=e.y+(n.y-e.y)*i,this.z=e.z+(n.z-e.z)*i,this.w=e.w+(n.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,n=0){return this.x=e[n],this.y=e[n+1],this.z=e[n+2],this.w=e[n+3],this}toArray(e=[],n=0){return e[n]=this.x,e[n+1]=this.y,e[n+2]=this.z,e[n+3]=this.w,e}fromBufferAttribute(e,n){return this.x=e.getX(n),this.y=e.getY(n),this.z=e.getZ(n),this.w=e.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},$d=class extends gr{constructor(e=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ci,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=n,this.depth=i.depth,this.scissor=new Ft(0,0,e,n),this.scissorTest=!1,this.viewport=new Ft(0,0,e,n);let r={width:e,height:n,depth:i.depth},s=new Dn(r);this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){let n={minFilter:Ci,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(n.mapping=e.mapping),e.wrapS!==void 0&&(n.wrapS=e.wrapS),e.wrapT!==void 0&&(n.wrapT=e.wrapT),e.wrapR!==void 0&&(n.wrapR=e.wrapR),e.magFilter!==void 0&&(n.magFilter=e.magFilter),e.minFilter!==void 0&&(n.minFilter=e.minFilter),e.format!==void 0&&(n.format=e.format),e.type!==void 0&&(n.type=e.type),e.anisotropy!==void 0&&(n.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(n.colorSpace=e.colorSpace),e.flipY!==void 0&&(n.flipY=e.flipY),e.generateMipmaps!==void 0&&(n.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(n.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,n,i=1){if(this.width!==e||this.height!==n||this.depth!==i){this.width=e,this.height=n,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=n,this.textures[r].image.depth=i,this.textures[r].isArrayTexture=this.textures[r].image.depth>1;this.dispose()}this.viewport.set(0,0,e,n),this.scissor.set(0,0,e,n)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,i=e.textures.length;n<i;n++){this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let r=Object.assign({},e.textures[n].image);this.textures[n].source=new aa(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Vi=class extends $d{constructor(e=1,n=1,i={}){super(e,n,i),this.isWebGLRenderTarget=!0}},Gl=class extends Dn{constructor(e=null,n=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=ci,this.minFilter=ci,this.wrapR=as,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Yd=class extends Dn{constructor(e=null,n=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:n,height:i,depth:r},this.magFilter=ci,this.minFilter=ci,this.wrapR=as,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var cs=class{constructor(e=new U(1/0,1/0,1/0),n=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=n}set(e,n){return this.min.copy(e),this.max.copy(n),this}setFromArray(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n+=3)this.expandByPoint(wi.fromArray(e,n));return this}setFromBufferAttribute(e){this.makeEmpty();for(let n=0,i=e.count;n<i;n++)this.expandByPoint(wi.fromBufferAttribute(e,n));return this}setFromPoints(e){this.makeEmpty();for(let n=0,i=e.length;n<i;n++)this.expandByPoint(e[n]);return this}setFromCenterAndSize(e,n){let i=wi.copy(n).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,n=!1){return this.makeEmpty(),this.expandByObject(e,n)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,n=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(n===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,wi):wi.fromBufferAttribute(s,o),wi.applyMatrix4(e.matrixWorld),this.expandByPoint(wi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),vd.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),vd.copy(i.boundingBox)),vd.applyMatrix4(e.matrixWorld),this.union(vd)}let r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],n);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,n){return n.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wi),wi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let n,i;return e.normal.x>0?(n=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(n=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(n+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(n+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(n+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(n+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),n<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Nl),xd.subVectors(this.max,Nl),Yo.subVectors(e.a,Nl),Zo.subVectors(e.b,Nl),Jo.subVectors(e.c,Nl),es.subVectors(Zo,Yo),ts.subVectors(Jo,Zo),zs.subVectors(Yo,Jo);let n=[0,-es.z,es.y,0,-ts.z,ts.y,0,-zs.z,zs.y,es.z,0,-es.x,ts.z,0,-ts.x,zs.z,0,-zs.x,-es.y,es.x,0,-ts.y,ts.x,0,-zs.y,zs.x,0];return!X0(n,Yo,Zo,Jo,xd)||(n=[1,0,0,0,1,0,0,0,1],!X0(n,Yo,Zo,Jo,xd))?!1:(yd.crossVectors(es,ts),n=[yd.x,yd.y,yd.z],X0(n,Yo,Zo,Jo,xd))}clampPoint(e,n){return n.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(wi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(cr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),cr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),cr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),cr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),cr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),cr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),cr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),cr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(cr),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},cr=[new U,new U,new U,new U,new U,new U,new U,new U],wi=new U,vd=new cs,Yo=new U,Zo=new U,Jo=new U,es=new U,ts=new U,zs=new U,Nl=new U,xd=new U,yd=new U,Bs=new U;function X0(t,e,n,i,r){for(let s=0,o=t.length-3;s<=o;s+=3){Bs.fromArray(t,s);let a=r.x*Math.abs(Bs.x)+r.y*Math.abs(Bs.y)+r.z*Math.abs(Bs.z),l=e.dot(Bs),c=n.dot(Bs),d=i.dot(Bs);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>a)return!1}return!0}var wA=new cs,Dl=new U,q0=new U,us=class{constructor(e=new U,n=-1){this.isSphere=!0,this.center=e,this.radius=n}set(e,n){return this.center.copy(e),this.radius=n,this}setFromPoints(e,n){let i=this.center;n!==void 0?i.copy(n):wA.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let n=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=n*n}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,n){let i=this.center.distanceToSquared(e);return n.copy(e),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Dl.subVectors(e,this.center);let n=Dl.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),r=(i-this.radius)*.5;this.center.addScaledVector(Dl,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(q0.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Dl.copy(e.center).add(q0)),this.expandByPoint(Dl.copy(e.center).sub(q0))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ur=new U,$0=new U,_d=new U,ns=new U,Y0=new U,bd=new U,Z0=new U,la=class{constructor(e=new U,n=new U(0,0,-1)){this.origin=e,this.direction=n}set(e,n){return this.origin.copy(e),this.direction.copy(n),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,n){return n.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ur)),this}closestPointToPoint(e,n){n.subVectors(e,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let n=ur.subVectors(e,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(e):(ur.copy(this.origin).addScaledVector(this.direction,n),ur.distanceToSquared(e))}distanceSqToSegment(e,n,i,r){$0.copy(e).add(n).multiplyScalar(.5),_d.copy(n).sub(e).normalize(),ns.copy(this.origin).sub($0);let s=e.distanceTo(n)*.5,o=-this.direction.dot(_d),a=ns.dot(this.direction),l=-ns.dot(_d),c=ns.lengthSq(),d=Math.abs(1-o*o),f,h,p,v;if(d>0)if(f=o*l-a,h=o*a-l,v=s*d,f>=0)if(h>=-v)if(h<=v){let y=1/d;f*=y,h*=y,p=f*(f+o*h+2*a)+h*(o*f+h+2*l)+c}else h=s,f=Math.max(0,-(o*h+a)),p=-f*f+h*(h+2*l)+c;else h=-s,f=Math.max(0,-(o*h+a)),p=-f*f+h*(h+2*l)+c;else h<=-v?(f=Math.max(0,-(-o*s+a)),h=f>0?-s:Math.min(Math.max(-s,-l),s),p=-f*f+h*(h+2*l)+c):h<=v?(f=0,h=Math.min(Math.max(-s,-l),s),p=h*(h+2*l)+c):(f=Math.max(0,-(o*s+a)),h=f>0?s:Math.min(Math.max(-s,-l),s),p=-f*f+h*(h+2*l)+c);else h=o>0?-s:s,f=Math.max(0,-(o*h+a)),p=-f*f+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy($0).addScaledVector(_d,h),p}intersectSphere(e,n){ur.subVectors(e.center,this.origin);let i=ur.dot(this.direction),r=ur.dot(ur)-i*i,s=e.radius*e.radius;if(r>s)return null;let o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,n):this.at(a,n)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let n=e.normal.dot(this.direction);if(n===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/n;return i>=0?i:null}intersectPlane(e,n){let i=this.distanceToPlane(e);return i===null?null:this.at(i,n)}intersectsPlane(e){let n=e.distanceToPoint(this.origin);return n===0||e.normal.dot(this.direction)*n<0}intersectBox(e,n){let i,r,s,o,a,l,c=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,r=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,r=(e.min.x-h.x)*c),d>=0?(s=(e.min.y-h.y)*d,o=(e.max.y-h.y)*d):(s=(e.max.y-h.y)*d,o=(e.min.y-h.y)*d),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),f>=0?(a=(e.min.z-h.z)*f,l=(e.max.z-h.z)*f):(a=(e.max.z-h.z)*f,l=(e.min.z-h.z)*f),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,n)}intersectsBox(e){return this.intersectBox(e,ur)!==null}intersectTriangle(e,n,i,r,s){Y0.subVectors(n,e),bd.subVectors(i,e),Z0.crossVectors(Y0,bd);let o=this.direction.dot(Z0),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ns.subVectors(this.origin,e);let l=a*this.direction.dot(bd.crossVectors(ns,bd));if(l<0)return null;let c=a*this.direction.dot(Y0.cross(ns));if(c<0||l+c>o)return null;let d=-a*ns.dot(Z0);return d<0?null:this.at(d/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ut=class t{constructor(e,n,i,r,s,o,a,l,c,d,f,h,p,v,y,m){t.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,n,i,r,s,o,a,l,c,d,f,h,p,v,y,m)}set(e,n,i,r,s,o,a,l,c,d,f,h,p,v,y,m){let u=this.elements;return u[0]=e,u[4]=n,u[8]=i,u[12]=r,u[1]=s,u[5]=o,u[9]=a,u[13]=l,u[2]=c,u[6]=d,u[10]=f,u[14]=h,u[3]=p,u[7]=v,u[11]=y,u[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new t().fromArray(this.elements)}copy(e){let n=this.elements,i=e.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(e){let n=this.elements,i=e.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(e){let n=e.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(e,n,i){return e.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,n,i){return this.set(e.x,n.x,i.x,0,e.y,n.y,i.y,0,e.z,n.z,i.z,0,0,0,0,1),this}extractRotation(e){let n=this.elements,i=e.elements,r=1/Ko.setFromMatrixColumn(e,0).length(),s=1/Ko.setFromMatrixColumn(e,1).length(),o=1/Ko.setFromMatrixColumn(e,2).length();return n[0]=i[0]*r,n[1]=i[1]*r,n[2]=i[2]*r,n[3]=0,n[4]=i[4]*s,n[5]=i[5]*s,n[6]=i[6]*s,n[7]=0,n[8]=i[8]*o,n[9]=i[9]*o,n[10]=i[10]*o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(e){let n=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){let h=o*d,p=o*f,v=a*d,y=a*f;n[0]=l*d,n[4]=-l*f,n[8]=c,n[1]=p+v*c,n[5]=h-y*c,n[9]=-a*l,n[2]=y-h*c,n[6]=v+p*c,n[10]=o*l}else if(e.order==="YXZ"){let h=l*d,p=l*f,v=c*d,y=c*f;n[0]=h+y*a,n[4]=v*a-p,n[8]=o*c,n[1]=o*f,n[5]=o*d,n[9]=-a,n[2]=p*a-v,n[6]=y+h*a,n[10]=o*l}else if(e.order==="ZXY"){let h=l*d,p=l*f,v=c*d,y=c*f;n[0]=h-y*a,n[4]=-o*f,n[8]=v+p*a,n[1]=p+v*a,n[5]=o*d,n[9]=y-h*a,n[2]=-o*c,n[6]=a,n[10]=o*l}else if(e.order==="ZYX"){let h=o*d,p=o*f,v=a*d,y=a*f;n[0]=l*d,n[4]=v*c-p,n[8]=h*c+y,n[1]=l*f,n[5]=y*c+h,n[9]=p*c-v,n[2]=-c,n[6]=a*l,n[10]=o*l}else if(e.order==="YZX"){let h=o*l,p=o*c,v=a*l,y=a*c;n[0]=l*d,n[4]=y-h*f,n[8]=v*f+p,n[1]=f,n[5]=o*d,n[9]=-a*d,n[2]=-c*d,n[6]=p*f+v,n[10]=h-y*f}else if(e.order==="XZY"){let h=o*l,p=o*c,v=a*l,y=a*c;n[0]=l*d,n[4]=-f,n[8]=c*d,n[1]=h*f+y,n[5]=o*d,n[9]=p*f-v,n[2]=v*f-p,n[6]=a*d,n[10]=y*f+h}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(e){return this.compose(EA,e,TA)}lookAt(e,n,i){let r=this.elements;return qn.subVectors(e,n),qn.lengthSq()===0&&(qn.z=1),qn.normalize(),is.crossVectors(i,qn),is.lengthSq()===0&&(Math.abs(i.z)===1?qn.x+=1e-4:qn.z+=1e-4,qn.normalize(),is.crossVectors(i,qn)),is.normalize(),Sd.crossVectors(qn,is),r[0]=is.x,r[4]=Sd.x,r[8]=qn.x,r[1]=is.y,r[5]=Sd.y,r[9]=qn.y,r[2]=is.z,r[6]=Sd.z,r[10]=qn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,n){let i=e.elements,r=n.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],d=i[1],f=i[5],h=i[9],p=i[13],v=i[2],y=i[6],m=i[10],u=i[14],g=i[3],x=i[7],_=i[11],T=i[15],E=r[0],A=r[4],R=r[8],w=r[12],S=r[1],P=r[5],z=r[9],L=r[13],O=r[2],X=r[6],H=r[10],Z=r[14],G=r[3],oe=r[7],le=r[11],te=r[15];return s[0]=o*E+a*S+l*O+c*G,s[4]=o*A+a*P+l*X+c*oe,s[8]=o*R+a*z+l*H+c*le,s[12]=o*w+a*L+l*Z+c*te,s[1]=d*E+f*S+h*O+p*G,s[5]=d*A+f*P+h*X+p*oe,s[9]=d*R+f*z+h*H+p*le,s[13]=d*w+f*L+h*Z+p*te,s[2]=v*E+y*S+m*O+u*G,s[6]=v*A+y*P+m*X+u*oe,s[10]=v*R+y*z+m*H+u*le,s[14]=v*w+y*L+m*Z+u*te,s[3]=g*E+x*S+_*O+T*G,s[7]=g*A+x*P+_*X+T*oe,s[11]=g*R+x*z+_*H+T*le,s[15]=g*w+x*L+_*Z+T*te,this}multiplyScalar(e){let n=this.elements;return n[0]*=e,n[4]*=e,n[8]*=e,n[12]*=e,n[1]*=e,n[5]*=e,n[9]*=e,n[13]*=e,n[2]*=e,n[6]*=e,n[10]*=e,n[14]*=e,n[3]*=e,n[7]*=e,n[11]*=e,n[15]*=e,this}determinant(){let e=this.elements,n=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],d=e[2],f=e[6],h=e[10],p=e[14],v=e[3],y=e[7],m=e[11],u=e[15];return v*(+s*l*f-r*c*f-s*a*h+i*c*h+r*a*p-i*l*p)+y*(+n*l*p-n*c*h+s*o*h-r*o*p+r*c*d-s*l*d)+m*(+n*c*f-n*a*p-s*o*f+i*o*p+s*a*d-i*c*d)+u*(-r*a*d-n*l*f+n*a*h+r*o*f-i*o*h+i*l*d)}transpose(){let e=this.elements,n;return n=e[1],e[1]=e[4],e[4]=n,n=e[2],e[2]=e[8],e[8]=n,n=e[6],e[6]=e[9],e[9]=n,n=e[3],e[3]=e[12],e[12]=n,n=e[7],e[7]=e[13],e[13]=n,n=e[11],e[11]=e[14],e[14]=n,this}setPosition(e,n,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=n,r[14]=i),this}invert(){let e=this.elements,n=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],d=e[8],f=e[9],h=e[10],p=e[11],v=e[12],y=e[13],m=e[14],u=e[15],g=f*m*c-y*h*c+y*l*p-a*m*p-f*l*u+a*h*u,x=v*h*c-d*m*c-v*l*p+o*m*p+d*l*u-o*h*u,_=d*y*c-v*f*c+v*a*p-o*y*p-d*a*u+o*f*u,T=v*f*l-d*y*l-v*a*h+o*y*h+d*a*m-o*f*m,E=n*g+i*x+r*_+s*T;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/E;return e[0]=g*A,e[1]=(y*h*s-f*m*s-y*r*p+i*m*p+f*r*u-i*h*u)*A,e[2]=(a*m*s-y*l*s+y*r*c-i*m*c-a*r*u+i*l*u)*A,e[3]=(f*l*s-a*h*s-f*r*c+i*h*c+a*r*p-i*l*p)*A,e[4]=x*A,e[5]=(d*m*s-v*h*s+v*r*p-n*m*p-d*r*u+n*h*u)*A,e[6]=(v*l*s-o*m*s-v*r*c+n*m*c+o*r*u-n*l*u)*A,e[7]=(o*h*s-d*l*s+d*r*c-n*h*c-o*r*p+n*l*p)*A,e[8]=_*A,e[9]=(v*f*s-d*y*s-v*i*p+n*y*p+d*i*u-n*f*u)*A,e[10]=(o*y*s-v*a*s+v*i*c-n*y*c-o*i*u+n*a*u)*A,e[11]=(d*a*s-o*f*s-d*i*c+n*f*c+o*i*p-n*a*p)*A,e[12]=T*A,e[13]=(d*y*r-v*f*r+v*i*h-n*y*h-d*i*m+n*f*m)*A,e[14]=(v*a*r-o*y*r-v*i*l+n*y*l+o*i*m-n*a*m)*A,e[15]=(o*f*r-d*a*r+d*i*l-n*f*l-o*i*h+n*a*h)*A,this}scale(e){let n=this.elements,i=e.x,r=e.y,s=e.z;return n[0]*=i,n[4]*=r,n[8]*=s,n[1]*=i,n[5]*=r,n[9]*=s,n[2]*=i,n[6]*=r,n[10]*=s,n[3]*=i,n[7]*=r,n[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,n=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(n,i,r))}makeTranslation(e,n,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(e){let n=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(e){let n=Math.cos(e),i=Math.sin(e);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(e){let n=Math.cos(e),i=Math.sin(e);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,n){let i=Math.cos(n),r=Math.sin(n),s=1-i,o=e.x,a=e.y,l=e.z,c=s*o,d=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,d*a+i,d*l-r*o,0,c*l-r*a,d*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(e,n,i){return this.set(e,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,n,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,n,r,1,0,0,0,0,1),this}compose(e,n,i){let r=this.elements,s=n._x,o=n._y,a=n._z,l=n._w,c=s+s,d=o+o,f=a+a,h=s*c,p=s*d,v=s*f,y=o*d,m=o*f,u=a*f,g=l*c,x=l*d,_=l*f,T=i.x,E=i.y,A=i.z;return r[0]=(1-(y+u))*T,r[1]=(p+_)*T,r[2]=(v-x)*T,r[3]=0,r[4]=(p-_)*E,r[5]=(1-(h+u))*E,r[6]=(m+g)*E,r[7]=0,r[8]=(v+x)*A,r[9]=(m-g)*A,r[10]=(1-(h+y))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,n,i){let r=this.elements,s=Ko.set(r[0],r[1],r[2]).length(),o=Ko.set(r[4],r[5],r[6]).length(),a=Ko.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],Ei.copy(this);let c=1/s,d=1/o,f=1/a;return Ei.elements[0]*=c,Ei.elements[1]*=c,Ei.elements[2]*=c,Ei.elements[4]*=d,Ei.elements[5]*=d,Ei.elements[6]*=d,Ei.elements[8]*=f,Ei.elements[9]*=f,Ei.elements[10]*=f,n.setFromRotationMatrix(Ei),i.x=s,i.y=o,i.z=a,this}makePerspective(e,n,i,r,s,o,a=Hi){let l=this.elements,c=2*s/(n-e),d=2*s/(i-r),f=(n+e)/(n-e),h=(i+r)/(i-r),p,v;if(a===Hi)p=-(o+s)/(o-s),v=-2*o*s/(o-s);else if(a===Hl)p=-o/(o-s),v=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=d,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,n,i,r,s,o,a=Hi){let l=this.elements,c=1/(n-e),d=1/(i-r),f=1/(o-s),h=(n+e)*c,p=(i+r)*d,v,y;if(a===Hi)v=(o+s)*f,y=-2*f;else if(a===Hl)v=s*f,y=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=y,l[14]=-v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let n=this.elements,i=e.elements;for(let r=0;r<16;r++)if(n[r]!==i[r])return!1;return!0}fromArray(e,n=0){for(let i=0;i<16;i++)this.elements[i]=e[i+n];return this}toArray(e=[],n=0){let i=this.elements;return e[n]=i[0],e[n+1]=i[1],e[n+2]=i[2],e[n+3]=i[3],e[n+4]=i[4],e[n+5]=i[5],e[n+6]=i[6],e[n+7]=i[7],e[n+8]=i[8],e[n+9]=i[9],e[n+10]=i[10],e[n+11]=i[11],e[n+12]=i[12],e[n+13]=i[13],e[n+14]=i[14],e[n+15]=i[15],e}},Ko=new U,Ei=new Ut,EA=new U(0,0,0),TA=new U(1,1,1),is=new U,Sd=new U,qn=new U,Hb=new Ut,Vb=new vr,Gi=class t{constructor(e=0,n=0,i=0,r=t.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=n,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,n,i,r=this._order){return this._x=e,this._y=n,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,n=this._order,i=!0){let r=e.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],d=r[9],f=r[2],h=r[6],p=r[10];switch(n){case"XYZ":this._y=Math.asin(tt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-tt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(tt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-tt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(tt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-tt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,n,i){return Hb.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Hb,n,i)}setFromVector3(e,n=this._order){return this.set(e.x,e.y,e.z,n)}reorder(e){return Vb.setFromEuler(this),this.setFromQuaternion(Vb,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],n=0){return e[n]=this._x,e[n+1]=this._y,e[n+2]=this._z,e[n+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Gi.DEFAULT_ORDER="XYZ";var Wl=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},AA=0,Gb=new U,jo=new vr,dr=new Ut,Md=new U,Ul=new U,CA=new U,RA=new vr,Wb=new U(1,0,0),Xb=new U(0,1,0),qb=new U(0,0,1),$b={type:"added"},PA={type:"removed"},Qo={type:"childadded",child:null},J0={type:"childremoved",child:null},Un=class t extends gr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:AA++}),this.uuid=uc(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=t.DEFAULT_UP.clone();let e=new U,n=new Gi,i=new vr,r=new U(1,1,1);function s(){i.setFromEuler(n,!1)}function o(){n.setFromQuaternion(i,void 0,!1)}n._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Ut},normalMatrix:{value:new $e}}),this.matrix=new Ut,this.matrixWorld=new Ut,this.matrixAutoUpdate=t.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,n){this.quaternion.setFromAxisAngle(e,n)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,n){return jo.setFromAxisAngle(e,n),this.quaternion.multiply(jo),this}rotateOnWorldAxis(e,n){return jo.setFromAxisAngle(e,n),this.quaternion.premultiply(jo),this}rotateX(e){return this.rotateOnAxis(Wb,e)}rotateY(e){return this.rotateOnAxis(Xb,e)}rotateZ(e){return this.rotateOnAxis(qb,e)}translateOnAxis(e,n){return Gb.copy(e).applyQuaternion(this.quaternion),this.position.add(Gb.multiplyScalar(n)),this}translateX(e){return this.translateOnAxis(Wb,e)}translateY(e){return this.translateOnAxis(Xb,e)}translateZ(e){return this.translateOnAxis(qb,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(dr.copy(this.matrixWorld).invert())}lookAt(e,n,i){e.isVector3?Md.copy(e):Md.set(e,n,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Ul.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?dr.lookAt(Ul,Md,this.up):dr.lookAt(Md,Ul,this.up),this.quaternion.setFromRotationMatrix(dr),r&&(dr.extractRotation(r.matrixWorld),jo.setFromRotationMatrix(dr),this.quaternion.premultiply(jo.invert()))}add(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent($b),Qo.child=e,this.dispatchEvent(Qo),Qo.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(e);return n!==-1&&(e.parent=null,this.children.splice(n,1),e.dispatchEvent(PA),J0.child=e,this.dispatchEvent(J0),J0.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),dr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),dr.multiply(e.parent.matrixWorld)),e.applyMatrix4(dr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent($b),Qo.child=e,this.dispatchEvent(Qo),Qo.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,n){if(this[e]===n)return this;for(let i=0,r=this.children.length;i<r;i++){let o=this.children[i].getObjectByProperty(e,n);if(o!==void 0)return o}}getObjectsByProperty(e,n,i=[]){this[e]===n&&i.push(this);let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,n,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ul,e,CA),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ul,RA,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return e.set(n[8],n[9],n[10]).normalize()}raycast(){}traverse(e){e(this);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].traverseVisible(e)}traverseAncestors(e){let n=this.parent;n!==null&&(e(n),n.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let n=this.children;for(let i=0,r=n.length;i<r;i++)n[i].updateMatrixWorld(e)}updateWorldMatrix(e,n){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),n===!0){let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let n=e===void 0||typeof e=="string",i={};n&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){let f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(e.materials,this.material[l]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];r.animations.push(s(e.animations,l))}}if(n){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),d=o(e.images),f=o(e.shapes),h=o(e.skeletons),p=o(e.animations),v=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),v.length>0&&(i.nodes=v)}return i.object=r,i;function o(a){let l=[];for(let c in a){let d=a[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,n=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),n===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};Un.DEFAULT_UP=new U(0,1,0);Un.DEFAULT_MATRIX_AUTO_UPDATE=!0;Un.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ti=new U,fr=new U,K0=new U,hr=new U,ea=new U,ta=new U,Yb=new U,j0=new U,Q0=new U,eg=new U,tg=new Ft,ng=new Ft,ig=new Ft,os=class t{constructor(e=new U,n=new U,i=new U){this.a=e,this.b=n,this.c=i}static getNormal(e,n,i,r){r.subVectors(i,n),Ti.subVectors(e,n),r.cross(Ti);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,n,i,r,s){Ti.subVectors(r,n),fr.subVectors(i,n),K0.subVectors(e,n);let o=Ti.dot(Ti),a=Ti.dot(fr),l=Ti.dot(K0),c=fr.dot(fr),d=fr.dot(K0),f=o*c-a*a;if(f===0)return s.set(0,0,0),null;let h=1/f,p=(c*l-a*d)*h,v=(o*d-a*l)*h;return s.set(1-p-v,v,p)}static containsPoint(e,n,i,r){return this.getBarycoord(e,n,i,r,hr)===null?!1:hr.x>=0&&hr.y>=0&&hr.x+hr.y<=1}static getInterpolation(e,n,i,r,s,o,a,l){return this.getBarycoord(e,n,i,r,hr)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,hr.x),l.addScaledVector(o,hr.y),l.addScaledVector(a,hr.z),l)}static getInterpolatedAttribute(e,n,i,r,s,o){return tg.setScalar(0),ng.setScalar(0),ig.setScalar(0),tg.fromBufferAttribute(e,n),ng.fromBufferAttribute(e,i),ig.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(tg,s.x),o.addScaledVector(ng,s.y),o.addScaledVector(ig,s.z),o}static isFrontFacing(e,n,i,r){return Ti.subVectors(i,n),fr.subVectors(e,n),Ti.cross(fr).dot(r)<0}set(e,n,i){return this.a.copy(e),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(e,n,i,r){return this.a.copy(e[n]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,n,i,r){return this.a.fromBufferAttribute(e,n),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ti.subVectors(this.c,this.b),fr.subVectors(this.a,this.b),Ti.cross(fr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return t.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,n){return t.getBarycoord(e,this.a,this.b,this.c,n)}getInterpolation(e,n,i,r,s){return t.getInterpolation(e,this.a,this.b,this.c,n,i,r,s)}containsPoint(e){return t.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return t.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,n){let i=this.a,r=this.b,s=this.c,o,a;ea.subVectors(r,i),ta.subVectors(s,i),j0.subVectors(e,i);let l=ea.dot(j0),c=ta.dot(j0);if(l<=0&&c<=0)return n.copy(i);Q0.subVectors(e,r);let d=ea.dot(Q0),f=ta.dot(Q0);if(d>=0&&f<=d)return n.copy(r);let h=l*f-d*c;if(h<=0&&l>=0&&d<=0)return o=l/(l-d),n.copy(i).addScaledVector(ea,o);eg.subVectors(e,s);let p=ea.dot(eg),v=ta.dot(eg);if(v>=0&&p<=v)return n.copy(s);let y=p*c-l*v;if(y<=0&&c>=0&&v<=0)return a=c/(c-v),n.copy(i).addScaledVector(ta,a);let m=d*v-p*f;if(m<=0&&f-d>=0&&p-v>=0)return Yb.subVectors(s,r),a=(f-d)/(f-d+(p-v)),n.copy(r).addScaledVector(Yb,a);let u=1/(m+y+h);return o=y*u,a=h*u,n.copy(i).addScaledVector(ea,o).addScaledVector(ta,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},jS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},rs={h:0,s:0,l:0},wd={h:0,s:0,l:0};function rg(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*6*(2/3-n):t}var je=class{constructor(e,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,n,i)}set(e,n,i){if(n===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,n,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,n=Yn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,rt.colorSpaceToWorking(this,n),this}setRGB(e,n,i,r=rt.workingColorSpace){return this.r=e,this.g=n,this.b=i,rt.colorSpaceToWorking(this,r),this}setHSL(e,n,i,r=rt.workingColorSpace){if(e=_A(e,1),n=tt(n,0,1),i=tt(i,0,1),n===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+n):i+n-i*n,o=2*i-s;this.r=rg(o,s,e+1/3),this.g=rg(o,s,e),this.b=rg(o,s,e-1/3)}return rt.colorSpaceToWorking(this,r),this}setStyle(e,n=Yn){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,n);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,n);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,n);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,n);if(o===6)return this.setHex(parseInt(s,16),n);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,n);return this}setColorName(e,n=Yn){let i=jS[e.toLowerCase()];return i!==void 0?this.setHex(i,n):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=pr(e.r),this.g=pr(e.g),this.b=pr(e.b),this}copyLinearToSRGB(e){return this.r=sa(e.r),this.g=sa(e.g),this.b=sa(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Yn){return rt.workingToColorSpace(hn.copy(this),e),Math.round(tt(hn.r*255,0,255))*65536+Math.round(tt(hn.g*255,0,255))*256+Math.round(tt(hn.b*255,0,255))}getHexString(e=Yn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,n=rt.workingColorSpace){rt.workingToColorSpace(hn.copy(this),n);let i=hn.r,r=hn.g,s=hn.b,o=Math.max(i,r,s),a=Math.min(i,r,s),l,c,d=(a+o)/2;if(a===o)l=0,c=0;else{let f=o-a;switch(c=d<=.5?f/(o+a):f/(2-o-a),o){case i:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-i)/f+2;break;case s:l=(i-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,n=rt.workingColorSpace){return rt.workingToColorSpace(hn.copy(this),n),e.r=hn.r,e.g=hn.g,e.b=hn.b,e}getStyle(e=Yn){rt.workingToColorSpace(hn.copy(this),e);let n=hn.r,i=hn.g,r=hn.b;return e!==Yn?`color(${e} ${n.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,n,i){return this.getHSL(rs),this.setHSL(rs.h+e,rs.s+n,rs.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,n){return this.r=e.r+n.r,this.g=e.g+n.g,this.b=e.b+n.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,n){return this.r+=(e.r-this.r)*n,this.g+=(e.g-this.g)*n,this.b+=(e.b-this.b)*n,this}lerpColors(e,n,i){return this.r=e.r+(n.r-e.r)*i,this.g=e.g+(n.g-e.g)*i,this.b=e.b+(n.b-e.b)*i,this}lerpHSL(e,n){this.getHSL(rs),e.getHSL(wd);let i=B0(rs.h,wd.h,n),r=B0(rs.s,wd.s,n),s=B0(rs.l,wd.l,n);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let n=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*n+s[3]*i+s[6]*r,this.g=s[1]*n+s[4]*i+s[7]*r,this.b=s[2]*n+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,n=0){return this.r=e[n],this.g=e[n+1],this.b=e[n+2],this}toArray(e=[],n=0){return e[n]=this.r,e[n+1]=this.g,e[n+2]=this.b,e}fromBufferAttribute(e,n){return this.r=e.getX(n),this.g=e.getY(n),this.b=e.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},hn=new je;je.NAMES=jS;var IA=0,xr=class extends gr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:IA++}),this.uuid=uc(),this.name="",this.type="Material",this.blending=Ws,this.side=mr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Bd,this.blendDst=Hd,this.blendEquation=ls,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new je(0,0,0),this.blendAlpha=0,this.depthFunc=Xs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fg,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Gs,this.stencilZFail=Gs,this.stencilZPass=Gs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let n in e){let i=e[n];if(i===void 0){console.warn(`THREE.Material: parameter '${n}' has value of undefined.`);continue}let r=this[n];if(r===void 0){console.warn(`THREE.Material: '${n}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[n]=i}}toJSON(e){let n=e===void 0||typeof e=="string";n&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ws&&(i.blending=this.blending),this.side!==mr&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Bd&&(i.blendSrc=this.blendSrc),this.blendDst!==Hd&&(i.blendDst=this.blendDst),this.blendEquation!==ls&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Xs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==fg&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Gs&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Gs&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Gs&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let o=[];for(let a in s){let l=s[a];delete l.metadata,o.push(l)}return o}if(n){let s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let n=e.clippingPlanes,i=null;if(n!==null){let r=n.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=n[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},yr=class extends xr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new je(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gi,this.combine=_g,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Gt=new U,Ed=new ht,kA=0,on=class{constructor(e,n,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:kA++}),this.name="",this.array=e,this.itemSize=n,this.count=e!==void 0?e.length/n:0,this.normalized=i,this.usage=hg,this.updateRanges=[],this.gpuType=Yi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,n){this.updateRanges.push({start:e,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,n,i){e*=this.itemSize,i*=n.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=n.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Ed.fromBufferAttribute(this,n),Ed.applyMatrix3(e),this.setXY(n,Ed.x,Ed.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Gt.fromBufferAttribute(this,n),Gt.applyMatrix3(e),this.setXYZ(n,Gt.x,Gt.y,Gt.z);return this}applyMatrix4(e){for(let n=0,i=this.count;n<i;n++)Gt.fromBufferAttribute(this,n),Gt.applyMatrix4(e),this.setXYZ(n,Gt.x,Gt.y,Gt.z);return this}applyNormalMatrix(e){for(let n=0,i=this.count;n<i;n++)Gt.fromBufferAttribute(this,n),Gt.applyNormalMatrix(e),this.setXYZ(n,Gt.x,Gt.y,Gt.z);return this}transformDirection(e){for(let n=0,i=this.count;n<i;n++)Gt.fromBufferAttribute(this,n),Gt.transformDirection(e),this.setXYZ(n,Gt.x,Gt.y,Gt.z);return this}set(e,n=0){return this.array.set(e,n),this}getComponent(e,n){let i=this.array[e*this.itemSize+n];return this.normalized&&(i=Ll(i,this.array)),i}setComponent(e,n,i){return this.normalized&&(i=Nn(i,this.array)),this.array[e*this.itemSize+n]=i,this}getX(e){let n=this.array[e*this.itemSize];return this.normalized&&(n=Ll(n,this.array)),n}setX(e,n){return this.normalized&&(n=Nn(n,this.array)),this.array[e*this.itemSize]=n,this}getY(e){let n=this.array[e*this.itemSize+1];return this.normalized&&(n=Ll(n,this.array)),n}setY(e,n){return this.normalized&&(n=Nn(n,this.array)),this.array[e*this.itemSize+1]=n,this}getZ(e){let n=this.array[e*this.itemSize+2];return this.normalized&&(n=Ll(n,this.array)),n}setZ(e,n){return this.normalized&&(n=Nn(n,this.array)),this.array[e*this.itemSize+2]=n,this}getW(e){let n=this.array[e*this.itemSize+3];return this.normalized&&(n=Ll(n,this.array)),n}setW(e,n){return this.normalized&&(n=Nn(n,this.array)),this.array[e*this.itemSize+3]=n,this}setXY(e,n,i){return e*=this.itemSize,this.normalized&&(n=Nn(n,this.array),i=Nn(i,this.array)),this.array[e+0]=n,this.array[e+1]=i,this}setXYZ(e,n,i,r){return e*=this.itemSize,this.normalized&&(n=Nn(n,this.array),i=Nn(i,this.array),r=Nn(r,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,n,i,r,s){return e*=this.itemSize,this.normalized&&(n=Nn(n,this.array),i=Nn(i,this.array),r=Nn(r,this.array),s=Nn(s,this.array)),this.array[e+0]=n,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==hg&&(e.usage=this.usage),e}};var Xl=class extends on{constructor(e,n,i){super(new Uint16Array(e),n,i)}};var ql=class extends on{constructor(e,n,i){super(new Uint32Array(e),n,i)}};var en=class extends on{constructor(e,n,i){super(new Float32Array(e),n,i)}},LA=0,li=new Ut,sg=new Un,na=new U,$n=new cs,Fl=new cs,Qt=new U,mn=class t extends gr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:LA++}),this.uuid=uc(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(kg(e)?ql:Xl)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,n){return this.attributes[e]=n,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,n,i=0){this.groups.push({start:e,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,n){this.drawRange.start=e,this.drawRange.count=n}applyMatrix4(e){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(e),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new $e().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return li.makeRotationFromQuaternion(e),this.applyMatrix4(li),this}rotateX(e){return li.makeRotationX(e),this.applyMatrix4(li),this}rotateY(e){return li.makeRotationY(e),this.applyMatrix4(li),this}rotateZ(e){return li.makeRotationZ(e),this.applyMatrix4(li),this}translate(e,n,i){return li.makeTranslation(e,n,i),this.applyMatrix4(li),this}scale(e,n,i){return li.makeScale(e,n,i),this.applyMatrix4(li),this}lookAt(e){return sg.lookAt(e),sg.updateMatrix(),this.applyMatrix4(sg.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(na).negate(),this.translate(na.x,na.y,na.z),this}setFromPoints(e){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new en(i,3))}else{let i=Math.min(e.length,n.count);for(let r=0;r<i;r++){let s=e[r];n.setXYZ(r,s.x,s.y,s.z||0)}e.length>n.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new cs);let e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),n)for(let i=0,r=n.length;i<r;i++){let s=n[i];$n.setFromBufferAttribute(s),this.morphTargetsRelative?(Qt.addVectors(this.boundingBox.min,$n.min),this.boundingBox.expandByPoint(Qt),Qt.addVectors(this.boundingBox.max,$n.max),this.boundingBox.expandByPoint(Qt)):(this.boundingBox.expandByPoint($n.min),this.boundingBox.expandByPoint($n.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new us);let e=this.attributes.position,n=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){let i=this.boundingSphere.center;if($n.setFromBufferAttribute(e),n)for(let s=0,o=n.length;s<o;s++){let a=n[s];Fl.setFromBufferAttribute(a),this.morphTargetsRelative?(Qt.addVectors($n.min,Fl.min),$n.expandByPoint(Qt),Qt.addVectors($n.max,Fl.max),$n.expandByPoint(Qt)):($n.expandByPoint(Fl.min),$n.expandByPoint(Fl.max))}$n.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)Qt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Qt));if(n)for(let s=0,o=n.length;s<o;s++){let a=n[s],l=this.morphTargetsRelative;for(let c=0,d=a.count;c<d;c++)Qt.fromBufferAttribute(a,c),l&&(na.fromBufferAttribute(e,c),Qt.add(na)),r=Math.max(r,i.distanceToSquared(Qt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,n=this.attributes;if(e===null||n.position===void 0||n.normal===void 0||n.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,r=n.normal,s=n.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new on(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let R=0;R<i.count;R++)a[R]=new U,l[R]=new U;let c=new U,d=new U,f=new U,h=new ht,p=new ht,v=new ht,y=new U,m=new U;function u(R,w,S){c.fromBufferAttribute(i,R),d.fromBufferAttribute(i,w),f.fromBufferAttribute(i,S),h.fromBufferAttribute(s,R),p.fromBufferAttribute(s,w),v.fromBufferAttribute(s,S),d.sub(c),f.sub(c),p.sub(h),v.sub(h);let P=1/(p.x*v.y-v.x*p.y);isFinite(P)&&(y.copy(d).multiplyScalar(v.y).addScaledVector(f,-p.y).multiplyScalar(P),m.copy(f).multiplyScalar(p.x).addScaledVector(d,-v.x).multiplyScalar(P),a[R].add(y),a[w].add(y),a[S].add(y),l[R].add(m),l[w].add(m),l[S].add(m))}let g=this.groups;g.length===0&&(g=[{start:0,count:e.count}]);for(let R=0,w=g.length;R<w;++R){let S=g[R],P=S.start,z=S.count;for(let L=P,O=P+z;L<O;L+=3)u(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let x=new U,_=new U,T=new U,E=new U;function A(R){T.fromBufferAttribute(r,R),E.copy(T);let w=a[R];x.copy(w),x.sub(T.multiplyScalar(T.dot(w))).normalize(),_.crossVectors(E,w);let P=_.dot(l[R])<0?-1:1;o.setXYZW(R,x.x,x.y,x.z,P)}for(let R=0,w=g.length;R<w;++R){let S=g[R],P=S.start,z=S.count;for(let L=P,O=P+z;L<O;L+=3)A(e.getX(L+0)),A(e.getX(L+1)),A(e.getX(L+2))}}computeVertexNormals(){let e=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new on(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);let r=new U,s=new U,o=new U,a=new U,l=new U,c=new U,d=new U,f=new U;if(e)for(let h=0,p=e.count;h<p;h+=3){let v=e.getX(h+0),y=e.getX(h+1),m=e.getX(h+2);r.fromBufferAttribute(n,v),s.fromBufferAttribute(n,y),o.fromBufferAttribute(n,m),d.subVectors(o,s),f.subVectors(r,s),d.cross(f),a.fromBufferAttribute(i,v),l.fromBufferAttribute(i,y),c.fromBufferAttribute(i,m),a.add(d),l.add(d),c.add(d),i.setXYZ(v,a.x,a.y,a.z),i.setXYZ(y,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=n.count;h<p;h+=3)r.fromBufferAttribute(n,h+0),s.fromBufferAttribute(n,h+1),o.fromBufferAttribute(n,h+2),d.subVectors(o,s),f.subVectors(r,s),d.cross(f),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let n=0,i=e.count;n<i;n++)Qt.fromBufferAttribute(e,n),Qt.normalize(),e.setXYZ(n,Qt.x,Qt.y,Qt.z)}toNonIndexed(){function e(a,l){let c=a.array,d=a.itemSize,f=a.normalized,h=new c.constructor(l.length*d),p=0,v=0;for(let y=0,m=l.length;y<m;y++){a.isInterleavedBufferAttribute?p=l[y]*a.data.stride+a.offset:p=l[y]*d;for(let u=0;u<d;u++)h[v++]=c[p++]}return new on(h,d,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new t,i=this.index.array,r=this.attributes;for(let a in r){let l=r[a],c=e(l,i);n.setAttribute(a,c)}let s=this.morphAttributes;for(let a in s){let l=[],c=s[a];for(let d=0,f=c.length;d<f;d++){let h=c[d],p=e(h,i);l.push(p)}n.morphAttributes[a]=l}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let n=this.index;n!==null&&(e.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],d=[];for(let f=0,h=c.length;f<h;f++){let p=c[f];d.push(p.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let d=r[c];this.setAttribute(c,d.clone(n))}let s=e.morphAttributes;for(let c in s){let d=[],f=s[c];for(let h=0,p=f.length;h<p;h++)d.push(f[h].clone(n));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,d=o.length;c<d;c++){let f=o[c];this.addGroup(f.start,f.count,f.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Zb=new Ut,Hs=new la,Td=new us,Jb=new U,Ad=new U,Cd=new U,Rd=new U,og=new U,Pd=new U,Kb=new U,Id=new U,gn=class extends Un{constructor(e=new mn,n=new yr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,n){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;n.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(s&&a){Pd.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let d=a[l],f=s[l];d!==0&&(og.fromBufferAttribute(f,e),o?Pd.addScaledVector(og,d):Pd.addScaledVector(og.sub(n),d))}n.add(Pd)}return n}raycast(e,n){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Td.copy(i.boundingSphere),Td.applyMatrix4(s),Hs.copy(e.ray).recast(e.near),!(Td.containsPoint(Hs.origin)===!1&&(Hs.intersectSphere(Td,Jb)===null||Hs.origin.distanceToSquared(Jb)>(e.far-e.near)**2))&&(Zb.copy(s).invert(),Hs.copy(e.ray).applyMatrix4(Zb),!(i.boundingBox!==null&&Hs.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,n,Hs)))}_computeIntersections(e,n,i){let r,s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,f=s.attributes.normal,h=s.groups,p=s.drawRange;if(a!==null)if(Array.isArray(o))for(let v=0,y=h.length;v<y;v++){let m=h[v],u=o[m.materialIndex],g=Math.max(m.start,p.start),x=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let _=g,T=x;_<T;_+=3){let E=a.getX(_),A=a.getX(_+1),R=a.getX(_+2);r=kd(this,u,e,i,c,d,f,E,A,R),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,n.push(r))}}else{let v=Math.max(0,p.start),y=Math.min(a.count,p.start+p.count);for(let m=v,u=y;m<u;m+=3){let g=a.getX(m),x=a.getX(m+1),_=a.getX(m+2);r=kd(this,o,e,i,c,d,f,g,x,_),r&&(r.faceIndex=Math.floor(m/3),n.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let v=0,y=h.length;v<y;v++){let m=h[v],u=o[m.materialIndex],g=Math.max(m.start,p.start),x=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let _=g,T=x;_<T;_+=3){let E=_,A=_+1,R=_+2;r=kd(this,u,e,i,c,d,f,E,A,R),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,n.push(r))}}else{let v=Math.max(0,p.start),y=Math.min(l.count,p.start+p.count);for(let m=v,u=y;m<u;m+=3){let g=m,x=m+1,_=m+2;r=kd(this,o,e,i,c,d,f,g,x,_),r&&(r.faceIndex=Math.floor(m/3),n.push(r))}}}};function NA(t,e,n,i,r,s,o,a){let l;if(e.side===En?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,e.side===mr,a),l===null)return null;Id.copy(a),Id.applyMatrix4(t.matrixWorld);let c=n.ray.origin.distanceTo(Id);return c<n.near||c>n.far?null:{distance:c,point:Id.clone(),object:t}}function kd(t,e,n,i,r,s,o,a,l,c){t.getVertexPosition(a,Ad),t.getVertexPosition(l,Cd),t.getVertexPosition(c,Rd);let d=NA(t,e,n,i,Ad,Cd,Rd,Kb);if(d){let f=new U;os.getBarycoord(Kb,Ad,Cd,Rd,f),r&&(d.uv=os.getInterpolatedAttribute(r,a,l,c,f,new ht)),s&&(d.uv1=os.getInterpolatedAttribute(s,a,l,c,f,new ht)),o&&(d.normal=os.getInterpolatedAttribute(o,a,l,c,f,new U),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));let h={a,b:l,c,normal:new U,materialIndex:0};os.getNormal(Ad,Cd,Rd,h.normal),d.face=h,d.barycoord=f}return d}var ca=class t extends mn{constructor(e=1,n=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:n,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};let a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);let l=[],c=[],d=[],f=[],h=0,p=0;v("z","y","x",-1,-1,i,n,e,o,s,0),v("z","y","x",1,-1,i,n,-e,o,s,1),v("x","z","y",1,1,e,i,n,r,o,2),v("x","z","y",1,-1,e,i,-n,r,o,3),v("x","y","z",1,-1,e,n,i,r,s,4),v("x","y","z",-1,-1,e,n,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new en(c,3)),this.setAttribute("normal",new en(d,3)),this.setAttribute("uv",new en(f,2));function v(y,m,u,g,x,_,T,E,A,R,w){let S=_/A,P=T/R,z=_/2,L=T/2,O=E/2,X=A+1,H=R+1,Z=0,G=0,oe=new U;for(let le=0;le<H;le++){let te=le*P-L;for(let ge=0;ge<X;ge++){let Ge=ge*S-z;oe[y]=Ge*g,oe[m]=te*x,oe[u]=O,c.push(oe.x,oe.y,oe.z),oe[y]=0,oe[m]=0,oe[u]=E>0?1:-1,d.push(oe.x,oe.y,oe.z),f.push(ge/A),f.push(1-le/R),Z+=1}}for(let le=0;le<R;le++)for(let te=0;te<A;te++){let ge=h+te+X*le,Ge=h+te+X*(le+1),W=h+(te+1)+X*(le+1),se=h+(te+1)+X*le;l.push(ge,Ge,se),l.push(Ge,W,se),G+=6}a.addGroup(p,G,w),p+=G,h+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new t(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function js(t){let e={};for(let n in t){e[n]={};for(let i in t[n]){let r=t[n][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[n][i]=null):e[n][i]=r.clone():Array.isArray(r)?e[n][i]=r.slice():e[n][i]=r}}return e}function vn(t){let e={};for(let n=0;n<t.length;n++){let i=js(t[n]);for(let r in i)e[r]=i[r]}return e}function DA(t){let e=[];for(let n=0;n<t.length;n++)e.push(t[n].clone());return e}function Lg(t){let e=t.getRenderTarget();return e===null?t.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:rt.workingColorSpace}var QS={clone:js,merge:vn},UA=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,FA=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ri=class extends xr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=UA,this.fragmentShader=FA,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=js(e.uniforms),this.uniformsGroups=DA(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let n=super.toJSON(e);n.glslVersion=this.glslVersion,n.uniforms={};for(let r in this.uniforms){let o=this.uniforms[r].value;o&&o.isTexture?n.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?n.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?n.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?n.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?n.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?n.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?n.uniforms[r]={type:"m4",value:o.toArray()}:n.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}},$l=class extends Un{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ut,this.projectionMatrix=new Ut,this.projectionMatrixInverse=new Ut,this.coordinateSystem=Hi}copy(e,n){return super.copy(e,n),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,n){super.updateWorldMatrix(e,n),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ss=new U,jb=new ht,Qb=new ht,pn=class extends $l{constructor(e=50,n=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let n=.5*this.getFilmHeight()/e;this.fov=Xd*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(z0*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Xd*2*Math.atan(Math.tan(z0*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,n,i){ss.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ss.x,ss.y).multiplyScalar(-e/ss.z),ss.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ss.x,ss.y).multiplyScalar(-e/ss.z)}getViewSize(e,n){return this.getViewBounds(e,jb,Qb),n.subVectors(Qb,jb)}setViewOffset(e,n,i,r,s,o){this.aspect=e/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,n=e*Math.tan(z0*.5*this.fov)/this.zoom,i=2*n,r=this.aspect*i,s=-.5*r,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,n-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,n,n-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let n=super.toJSON(e);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}},ia=-90,ra=1,Zd=class extends Un{constructor(e,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new pn(ia,ra,e,n);r.layers=this.layers,this.add(r);let s=new pn(ia,ra,e,n);s.layers=this.layers,this.add(s);let o=new pn(ia,ra,e,n);o.layers=this.layers,this.add(o);let a=new pn(ia,ra,e,n);a.layers=this.layers,this.add(a);let l=new pn(ia,ra,e,n);l.layers=this.layers,this.add(l);let c=new pn(ia,ra,e,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,n=this.children.concat(),[i,r,s,o,a,l]=n;for(let c of n)this.remove(c);if(e===Hi)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Hl)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of n)this.add(c),c.updateMatrixWorld()}update(e,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,o,a,l,c,d]=this.children,f=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(n,s),e.setRenderTarget(i,1,r),e.render(n,o),e.setRenderTarget(i,2,r),e.render(n,a),e.setRenderTarget(i,3,r),e.render(n,l),e.setRenderTarget(i,4,r),e.render(n,c),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,r),e.render(n,d),e.setRenderTarget(f,h,p),e.xr.enabled=v,i.texture.needsPMREMUpdate=!0}},Yl=class extends Dn{constructor(e=[],n=Js,i,r,s,o,a,l,c,d){super(e,n,i,r,s,o,a,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Jd=class extends Vi{constructor(e=1,n={}){super(e,e,n),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Yl(r),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new ca(5,5,5),s=new Ri({name:"CubemapFromEquirect",uniforms:js(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:En,blending:_r});s.uniforms.tEquirect.value=n;let o=new gn(r,s),a=n.minFilter;return n.minFilter===hs&&(n.minFilter=Ci),new Zd(1,10,this).update(e,o),n.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,n=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(n,i,r);e.setRenderTarget(s)}},Ai=class extends Un{constructor(){super(),this.isGroup=!0,this.type="Group"}},OA={type:"move"},ua=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ai,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ai,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ai,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let n=this._hand;if(n)for(let i of e.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,n,i){let r=null,s=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&n.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let y of e.hand.values()){let m=n.getJointPose(y,i),u=this._getHandJoint(c,y);m!==null&&(u.matrix.fromArray(m.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=m.radius),u.visible=m!==null}let d=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=d.position.distanceTo(f.position),p=.02,v=.005;c.inputState.pinching&&h>p+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=n.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=n.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(OA)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,n){if(e.joints[n.jointName]===void 0){let i=new Ai;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[n.jointName]=i,e.add(i)}return e.joints[n.jointName]}};var Zl=class extends Un{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Gi,this.environmentIntensity=1,this.environmentRotation=new Gi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,n){return super.copy(e,n),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let n=super.toJSON(e);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(n.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(n.object.backgroundIntensity=this.backgroundIntensity),n.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(n.object.environmentIntensity=this.environmentIntensity),n.object.environmentRotation=this.environmentRotation.toArray(),n}};var ag=new U,zA=new U,BA=new $e,Bi=class{constructor(e=new U(1,0,0),n=0){this.isPlane=!0,this.normal=e,this.constant=n}set(e,n){return this.normal.copy(e),this.constant=n,this}setComponents(e,n,i,r){return this.normal.set(e,n,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,n){return this.normal.copy(e),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(e,n,i){let r=ag.subVectors(i,n).cross(zA.subVectors(e,n)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,n){return n.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,n){let i=e.delta(ag),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?n.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:n.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let n=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return n<0&&i>0||i<0&&n>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,n){let i=n||BA.getNormalMatrix(e),r=this.coplanarPoint(ag).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Vs=new us,Ld=new U,Jl=class{constructor(e=new Bi,n=new Bi,i=new Bi,r=new Bi,s=new Bi,o=new Bi){this.planes=[e,n,i,r,s,o]}set(e,n,i,r,s,o){let a=this.planes;return a[0].copy(e),a[1].copy(n),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,n=Hi){let i=this.planes,r=e.elements,s=r[0],o=r[1],a=r[2],l=r[3],c=r[4],d=r[5],f=r[6],h=r[7],p=r[8],v=r[9],y=r[10],m=r[11],u=r[12],g=r[13],x=r[14],_=r[15];if(i[0].setComponents(l-s,h-c,m-p,_-u).normalize(),i[1].setComponents(l+s,h+c,m+p,_+u).normalize(),i[2].setComponents(l+o,h+d,m+v,_+g).normalize(),i[3].setComponents(l-o,h-d,m-v,_-g).normalize(),i[4].setComponents(l-a,h-f,m-y,_-x).normalize(),n===Hi)i[5].setComponents(l+a,h+f,m+y,_+x).normalize();else if(n===Hl)i[5].setComponents(a,f,y,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Vs.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let n=e.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Vs.copy(n.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Vs)}intersectsSprite(e){return Vs.center.set(0,0,0),Vs.radius=.7071067811865476,Vs.applyMatrix4(e.matrixWorld),this.intersectsSphere(Vs)}intersectsSphere(e){let n=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(n[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let n=this.planes;for(let i=0;i<6;i++){let r=n[i];if(Ld.x=r.normal.x>0?e.max.x:e.min.x,Ld.y=r.normal.y>0?e.max.y:e.min.y,Ld.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ld)<0)return!1}return!0}containsPoint(e){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var da=class extends xr{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new je(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Kd=new U,jd=new U,eS=new Ut,Ol=new la,Nd=new us,lg=new U,tS=new U,Qd=class extends Un{constructor(e=new mn,n=new da){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let n=e.attributes.position,i=[0];for(let r=1,s=n.count;r<s;r++)Kd.fromBufferAttribute(n,r-1),jd.fromBufferAttribute(n,r),i[r]=i[r-1],i[r]+=Kd.distanceTo(jd);e.setAttribute("lineDistance",new en(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,n){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Nd.copy(i.boundingSphere),Nd.applyMatrix4(r),Nd.radius+=s,e.ray.intersectsSphere(Nd)===!1)return;eS.copy(r).invert(),Ol.copy(e.ray).applyMatrix4(eS);let a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,d=i.index,h=i.attributes.position;if(d!==null){let p=Math.max(0,o.start),v=Math.min(d.count,o.start+o.count);for(let y=p,m=v-1;y<m;y+=c){let u=d.getX(y),g=d.getX(y+1),x=Dd(this,e,Ol,l,u,g,y);x&&n.push(x)}if(this.isLineLoop){let y=d.getX(v-1),m=d.getX(p),u=Dd(this,e,Ol,l,y,m,v-1);u&&n.push(u)}}else{let p=Math.max(0,o.start),v=Math.min(h.count,o.start+o.count);for(let y=p,m=v-1;y<m;y+=c){let u=Dd(this,e,Ol,l,y,y+1,y);u&&n.push(u)}if(this.isLineLoop){let y=Dd(this,e,Ol,l,v-1,p,v-1);y&&n.push(y)}}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}};function Dd(t,e,n,i,r,s,o){let a=t.geometry.attributes.position;if(Kd.fromBufferAttribute(a,r),jd.fromBufferAttribute(a,s),n.distanceSqToSegment(Kd,jd,lg,tS)>i)return;lg.applyMatrix4(t.matrixWorld);let c=e.ray.origin.distanceTo(lg);if(!(c<e.near||c>e.far))return{distance:c,point:tS.clone().applyMatrix4(t.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:t}}var nS=new U,iS=new U,Kl=class extends Qd{constructor(e,n){super(e,n),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let n=e.attributes.position,i=[];for(let r=0,s=n.count;r<s;r+=2)nS.fromBufferAttribute(n,r),iS.fromBufferAttribute(n,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+nS.distanceTo(iS);e.setAttribute("lineDistance",new en(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Ys=class extends xr{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new je(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},rS=new Ut,pg=new la,Ud=new us,Fd=new U,fa=class extends Un{constructor(e=new mn,n=new Ys){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,n){return super.copy(e,n),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,n){let i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ud.copy(i.boundingSphere),Ud.applyMatrix4(r),Ud.radius+=s,e.ray.intersectsSphere(Ud)===!1)return;rS.copy(r).invert(),pg.copy(e.ray).applyMatrix4(rS);let a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,f=i.attributes.position;if(c!==null){let h=Math.max(0,o.start),p=Math.min(c.count,o.start+o.count);for(let v=h,y=p;v<y;v++){let m=c.getX(v);Fd.fromBufferAttribute(f,m),sS(Fd,m,l,r,e,n,this)}}else{let h=Math.max(0,o.start),p=Math.min(f.count,o.start+o.count);for(let v=h,y=p;v<y;v++)Fd.fromBufferAttribute(f,v),sS(Fd,v,l,r,e,n,this)}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let r=n[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}};function sS(t,e,n,i,r,s,o){let a=pg.distanceSqToPoint(t);if(a<n){let l=new U;pg.closestPointToPoint(t,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var jl=class extends Dn{constructor(e,n,i,r,s,o,a,l,c){super(e,n,i,r,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Ql=class extends Dn{constructor(e,n,i=ps,r,s,o,a=ci,l=ci,c,d=oa,f=1){if(d!==oa&&d!==va)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:n,depth:f};super(h,r,s,o,a,l,d,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new aa(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let n=super.toJSON(e);return this.compareFunction!==null&&(n.compareFunction=this.compareFunction),n}};var ec=class t extends mn{constructor(e=1,n=1,i=1,r=32,s=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:n,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};let c=this;r=Math.floor(r),s=Math.floor(s);let d=[],f=[],h=[],p=[],v=0,y=[],m=i/2,u=0;g(),o===!1&&(e>0&&x(!0),n>0&&x(!1)),this.setIndex(d),this.setAttribute("position",new en(f,3)),this.setAttribute("normal",new en(h,3)),this.setAttribute("uv",new en(p,2));function g(){let _=new U,T=new U,E=0,A=(n-e)/i;for(let R=0;R<=s;R++){let w=[],S=R/s,P=S*(n-e)+e;for(let z=0;z<=r;z++){let L=z/r,O=L*l+a,X=Math.sin(O),H=Math.cos(O);T.x=P*X,T.y=-S*i+m,T.z=P*H,f.push(T.x,T.y,T.z),_.set(X,A,H).normalize(),h.push(_.x,_.y,_.z),p.push(L,1-S),w.push(v++)}y.push(w)}for(let R=0;R<r;R++)for(let w=0;w<s;w++){let S=y[w][R],P=y[w+1][R],z=y[w+1][R+1],L=y[w][R+1];(e>0||w!==0)&&(d.push(S,P,L),E+=3),(n>0||w!==s-1)&&(d.push(P,z,L),E+=3)}c.addGroup(u,E,0),u+=E}function x(_){let T=v,E=new ht,A=new U,R=0,w=_===!0?e:n,S=_===!0?1:-1;for(let z=1;z<=r;z++)f.push(0,m*S,0),h.push(0,S,0),p.push(.5,.5),v++;let P=v;for(let z=0;z<=r;z++){let O=z/r*l+a,X=Math.cos(O),H=Math.sin(O);A.x=w*H,A.y=m*S,A.z=w*X,f.push(A.x,A.y,A.z),h.push(0,S,0),E.x=X*.5+.5,E.y=H*.5*S+.5,p.push(E.x,E.y),v++}for(let z=0;z<r;z++){let L=T+z,O=P+z;_===!0?d.push(O,O+1,L):d.push(O+1,O,L),R+=3}c.addGroup(u,R,_===!0?1:2),u+=R}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new t(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var tc=class t extends mn{constructor(e=1,n=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:n,widthSegments:i,heightSegments:r};let s=e/2,o=n/2,a=Math.floor(i),l=Math.floor(r),c=a+1,d=l+1,f=e/a,h=n/l,p=[],v=[],y=[],m=[];for(let u=0;u<d;u++){let g=u*h-o;for(let x=0;x<c;x++){let _=x*f-s;v.push(_,-g,0),y.push(0,0,1),m.push(x/a),m.push(1-u/l)}}for(let u=0;u<l;u++)for(let g=0;g<a;g++){let x=g+c*u,_=g+c*(u+1),T=g+1+c*(u+1),E=g+1+c*u;p.push(x,_,E),p.push(_,T,E)}this.setIndex(p),this.setAttribute("position",new en(v,3)),this.setAttribute("normal",new en(y,3)),this.setAttribute("uv",new en(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new t(e.width,e.height,e.widthSegments,e.heightSegments)}};var ha=class t extends mn{constructor(e=1,n=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:n,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,d=[],f=new U,h=new U,p=[],v=[],y=[],m=[];for(let u=0;u<=i;u++){let g=[],x=u/i,_=0;u===0&&o===0?_=.5/n:u===i&&l===Math.PI&&(_=-.5/n);for(let T=0;T<=n;T++){let E=T/n;f.x=-e*Math.cos(r+E*s)*Math.sin(o+x*a),f.y=e*Math.cos(o+x*a),f.z=e*Math.sin(r+E*s)*Math.sin(o+x*a),v.push(f.x,f.y,f.z),h.copy(f).normalize(),y.push(h.x,h.y,h.z),m.push(E+_,1-x),g.push(c++)}d.push(g)}for(let u=0;u<i;u++)for(let g=0;g<n;g++){let x=d[u][g+1],_=d[u][g],T=d[u+1][g],E=d[u+1][g+1];(u!==0||o>0)&&p.push(x,_,E),(u!==i-1||l<Math.PI)&&p.push(_,T,E)}this.setIndex(p),this.setAttribute("position",new en(v,3)),this.setAttribute("normal",new en(y,3)),this.setAttribute("uv",new en(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new t(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var ef=class extends xr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=FS,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},tf=class extends xr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Od(t,e){return!t||t.constructor===e?t:typeof e.BYTES_PER_ELEMENT=="number"?new e(t):Array.prototype.slice.call(t)}function HA(t){return ArrayBuffer.isView(t)&&!(t instanceof DataView)}var Zs=class{constructor(e,n,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let n=this.parameterPositions,i=this._cachedIndex,r=n[i],s=n[i-1];e:{t:{let o;n:{i:if(!(e<r)){for(let a=i+2;;){if(r===void 0){if(e<s)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(s=r,r=n[++i],e<r)break t}o=n.length;break n}if(!(e>=s)){let a=n[1];e<a&&(i=2,s=a);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=n[--i-1],e>=s)break t}o=i,i=0;break n}break e}for(;i<o;){let a=i+o>>>1;e<n[a]?o=a:i=a+1}if(r=n[i],s=n[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let n=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let o=0;o!==r;++o)n[o]=i[s+o];return n}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},nf=class extends Zs{constructor(e,n,i,r){super(e,n,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:cg,endingEnd:cg}}intervalChanged_(e,n,i){let r=this.parameterPositions,s=e-2,o=e+1,a=r[s],l=r[o];if(a===void 0)switch(this.getSettings_().endingStart){case ug:s=e,a=2*n-i;break;case dg:s=r.length-2,a=n+r[s]-r[s+1];break;default:s=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case ug:o=e,l=2*i-n;break;case dg:o=1,l=i+r[1]-r[0];break;default:o=e-1,l=n}let c=(i-n)*.5,d=this.valueSize;this._weightPrev=c/(n-a),this._weightNext=c/(l-i),this._offsetPrev=s*d,this._offsetNext=o*d}interpolate_(e,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,d=this._offsetPrev,f=this._offsetNext,h=this._weightPrev,p=this._weightNext,v=(i-n)/(r-n),y=v*v,m=y*v,u=-h*m+2*h*y-h*v,g=(1+h)*m+(-1.5-2*h)*y+(-.5+h)*v+1,x=(-1-p)*m+(1.5+p)*y+.5*v,_=p*m-p*y;for(let T=0;T!==a;++T)s[T]=u*o[d+T]+g*o[c+T]+x*o[l+T]+_*o[f+T];return s}},rf=class extends Zs{constructor(e,n,i,r){super(e,n,i,r)}interpolate_(e,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,d=(i-n)/(r-n),f=1-d;for(let h=0;h!==a;++h)s[h]=o[c+h]*f+o[l+h]*d;return s}},sf=class extends Zs{constructor(e,n,i,r){super(e,n,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Zn=class{constructor(e,n,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Od(n,this.TimeBufferType),this.values=Od(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let n=e.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(e);else{i={name:e.name,times:Od(e.times,Array),values:Od(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new sf(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new rf(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new nf(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let n;switch(e){case zl:n=this.InterpolantFactoryMethodDiscrete;break;case Wd:n=this.InterpolantFactoryMethodLinear;break;case zd:n=this.InterpolantFactoryMethodSmooth;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zl;case this.InterpolantFactoryMethodLinear:return Wd;case this.InterpolantFactoryMethodSmooth:return zd}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let n=this.times;for(let i=0,r=n.length;i!==r;++i)n[i]+=e}return this}scale(e){if(e!==1){let n=this.times;for(let i=0,r=n.length;i!==r;++i)n[i]*=e}return this}trim(e,n){let i=this.times,r=i.length,s=0,o=r-1;for(;s!==r&&i[s]<e;)++s;for(;o!==-1&&i[o]>n;)--o;if(++o,s!==0||o!==r){s>=o&&(o=Math.max(o,1),s=o-1);let a=this.getValueSize();this.times=i.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let e=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==s;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(r!==void 0&&HA(r))for(let a=0,l=r.length;a!==l;++a){let c=r[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===zd,s=e.length-1,o=1;for(let a=1;a<s;++a){let l=!1,c=e[a],d=e[a+1];if(c!==d&&(a!==1||c!==e[0]))if(r)l=!0;else{let f=a*i,h=f-i,p=f+i;for(let v=0;v!==i;++v){let y=n[f+v];if(y!==n[h+v]||y!==n[p+v]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let f=a*i,h=o*i;for(let p=0;p!==i;++p)n[h+p]=n[f+p]}++o}}if(s>0){e[o]=e[s];for(let a=s*i,l=o*i,c=0;c!==i;++c)n[l+c]=n[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=n.slice(0,o*i)):(this.times=e,this.values=n),this}clone(){let e=this.times.slice(),n=this.values.slice(),i=this.constructor,r=new i(this.name,e,n);return r.createInterpolant=this.createInterpolant,r}};Zn.prototype.ValueTypeName="";Zn.prototype.TimeBufferType=Float32Array;Zn.prototype.ValueBufferType=Float32Array;Zn.prototype.DefaultInterpolation=Wd;var ds=class extends Zn{constructor(e,n,i){super(e,n,i)}};ds.prototype.ValueTypeName="bool";ds.prototype.ValueBufferType=Array;ds.prototype.DefaultInterpolation=zl;ds.prototype.InterpolantFactoryMethodLinear=void 0;ds.prototype.InterpolantFactoryMethodSmooth=void 0;var of=class extends Zn{constructor(e,n,i,r){super(e,n,i,r)}};of.prototype.ValueTypeName="color";var af=class extends Zn{constructor(e,n,i,r){super(e,n,i,r)}};af.prototype.ValueTypeName="number";var lf=class extends Zs{constructor(e,n,i,r){super(e,n,i,r)}interpolate_(e,n,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-n)/(r-n),c=e*a;for(let d=c+a;c!==d;c+=4)vr.slerpFlat(s,0,o,c-a,o,c,l);return s}},nc=class extends Zn{constructor(e,n,i,r){super(e,n,i,r)}InterpolantFactoryMethodLinear(e){return new lf(this.times,this.values,this.getValueSize(),e)}};nc.prototype.ValueTypeName="quaternion";nc.prototype.InterpolantFactoryMethodSmooth=void 0;var fs=class extends Zn{constructor(e,n,i){super(e,n,i)}};fs.prototype.ValueTypeName="string";fs.prototype.ValueBufferType=Array;fs.prototype.DefaultInterpolation=zl;fs.prototype.InterpolantFactoryMethodLinear=void 0;fs.prototype.InterpolantFactoryMethodSmooth=void 0;var cf=class extends Zn{constructor(e,n,i,r){super(e,n,i,r)}};cf.prototype.ValueTypeName="vector";var uf=class{constructor(e,n,i){let r=this,s=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=n,this.onError=i,this.itemStart=function(d){a++,s===!1&&r.onStart!==void 0&&r.onStart(d,o,a),s=!0},this.itemEnd=function(d){o++,r.onProgress!==void 0&&r.onProgress(d,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(d){r.onError!==void 0&&r.onError(d)},this.resolveURL=function(d){return l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,f){return c.push(d,f),this},this.removeHandler=function(d){let f=c.indexOf(d);return f!==-1&&c.splice(f,2),this},this.getHandler=function(d){for(let f=0,h=c.length;f<h;f+=2){let p=c[f],v=c[f+1];if(p.global&&(p.lastIndex=0),p.test(d))return v}return null}}},eM=new uf,df=class{constructor(e){this.manager=e!==void 0?e:eM,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,n){let i=this;return new Promise(function(r,s){i.load(e,r,n,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};df.DEFAULT_MATERIAL_NAME="__DEFAULT";var ff=class extends $l{constructor(e=-1,n=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=n,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,n){return super.copy(e,n),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,n,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,o=i+e,a=r+n,l=r-n;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=d*this.view.offsetY,l=a-d*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let n=super.toJSON(e);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}};var hf=class extends pn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Ng="\\[\\]\\.:\\/",VA=new RegExp("["+Ng+"]","g"),Dg="[^"+Ng+"]",GA="[^"+Ng.replace("\\.","")+"]",WA=/((?:WC+[\/:])*)/.source.replace("WC",Dg),XA=/(WCOD+)?/.source.replace("WCOD",GA),qA=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Dg),$A=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Dg),YA=new RegExp("^"+WA+XA+qA+$A+"$"),ZA=["material","materials","bones","map"],mg=class{constructor(e,n,i){let r=i||Mt.parseTrackName(n);this._targetGroup=e,this._bindings=e.subscribe_(n,r)}getValue(e,n){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,n)}setValue(e,n){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,n)}bind(){let e=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=e.length;n!==i;++n)e[n].bind()}unbind(){let e=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=e.length;n!==i;++n)e[n].unbind()}},Mt=class t{constructor(e,n,i){this.path=n,this.parsedPath=i||t.parseTrackName(n),this.node=t.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,n,i){return e&&e.isAnimationObjectGroup?new t.Composite(e,n,i):new t(e,n,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(VA,"")}static parseTrackName(e){let n=YA.exec(e);if(n===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);ZA.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,n){if(n===void 0||n===""||n==="."||n===-1||n===e.name||n===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(n);if(i!==void 0)return i}if(e.children){let i=function(s){for(let o=0;o<s.length;o++){let a=s[o];if(a.name===n||a.uuid===n)return a;let l=i(a.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,n){e[n]=this.targetObject[this.propertyName]}_getValue_array(e,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[n++]=i[r]}_getValue_arrayElement(e,n){e[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,n){this.resolvedProperty.toArray(e,n)}_setValue_direct(e,n){this.targetObject[this.propertyName]=e[n]}_setValue_direct_setNeedsUpdate(e,n){this.targetObject[this.propertyName]=e[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,n){this.targetObject[this.propertyName]=e[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[n++]}_setValue_array_setNeedsUpdate(e,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,n){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,n){this.resolvedProperty[this.propertyIndex]=e[n]}_setValue_arrayElement_setNeedsUpdate(e,n){this.resolvedProperty[this.propertyIndex]=e[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,n){this.resolvedProperty[this.propertyIndex]=e[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,n){this.resolvedProperty.fromArray(e,n)}_setValue_fromArray_setNeedsUpdate(e,n){this.resolvedProperty.fromArray(e,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,n){this.resolvedProperty.fromArray(e,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,n){this.bind(),this.getValue(e,n)}_setValue_unbound(e,n){this.bind(),this.setValue(e,n)}bind(){let e=this.node,n=this.parsedPath,i=n.objectName,r=n.propertyName,s=n.propertyIndex;if(e||(e=t.findNode(this.rootNode,n.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=n.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let d=0;d<e.length;d++)if(e[d].name===c){c=d;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[r];if(o===void 0){let c=n.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Mt.Composite=mg;Mt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Mt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Mt.prototype.GetterByBindingType=[Mt.prototype._getValue_direct,Mt.prototype._getValue_array,Mt.prototype._getValue_arrayElement,Mt.prototype._getValue_toArray];Mt.prototype.SetterByBindingTypeAndVersioning=[[Mt.prototype._setValue_direct,Mt.prototype._setValue_direct_setNeedsUpdate,Mt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_array,Mt.prototype._setValue_array_setNeedsUpdate,Mt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_arrayElement,Mt.prototype._setValue_arrayElement_setNeedsUpdate,Mt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_fromArray,Mt.prototype._setValue_fromArray_setNeedsUpdate,Mt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var jB=new Float32Array(1);function Ug(t,e,n,i){let r=JA(i);switch(n){case Eg:return t*e;case Ag:return t*e/r.components*r.byteLength;case Af:return t*e/r.components*r.byteLength;case Cg:return t*e*2/r.components*r.byteLength;case Cf:return t*e*2/r.components*r.byteLength;case Tg:return t*e*3/r.components*r.byteLength;case ui:return t*e*4/r.components*r.byteLength;case Rf:return t*e*4/r.components*r.byteLength;case sc:case oc:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case ac:case lc:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case If:case Lf:return Math.max(t,16)*Math.max(e,8)/4;case Pf:case kf:return Math.max(t,8)*Math.max(e,8)/2;case Nf:case Df:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*8;case Uf:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case Ff:return Math.floor((t+3)/4)*Math.floor((e+3)/4)*16;case Of:return Math.floor((t+4)/5)*Math.floor((e+3)/4)*16;case zf:return Math.floor((t+4)/5)*Math.floor((e+4)/5)*16;case Bf:return Math.floor((t+5)/6)*Math.floor((e+4)/5)*16;case Hf:return Math.floor((t+5)/6)*Math.floor((e+5)/6)*16;case Vf:return Math.floor((t+7)/8)*Math.floor((e+4)/5)*16;case Gf:return Math.floor((t+7)/8)*Math.floor((e+5)/6)*16;case Wf:return Math.floor((t+7)/8)*Math.floor((e+7)/8)*16;case Xf:return Math.floor((t+9)/10)*Math.floor((e+4)/5)*16;case qf:return Math.floor((t+9)/10)*Math.floor((e+5)/6)*16;case $f:return Math.floor((t+9)/10)*Math.floor((e+7)/8)*16;case Yf:return Math.floor((t+9)/10)*Math.floor((e+9)/10)*16;case Zf:return Math.floor((t+11)/12)*Math.floor((e+9)/10)*16;case Jf:return Math.floor((t+11)/12)*Math.floor((e+11)/12)*16;case cc:case Kf:case jf:return Math.ceil(t/4)*Math.ceil(e/4)*16;case Rg:case Qf:return Math.ceil(t/4)*Math.ceil(e/4)*8;case eh:case th:return Math.ceil(t/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function JA(t){switch(t){case $i:case Sg:return{byteLength:1,components:1};case pa:case Mg:case ma:return{byteLength:2,components:1};case Ef:case Tf:return{byteLength:2,components:4};case ps:case wf:case Yi:return{byteLength:4,components:1};case wg:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${t}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"177"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="177");function wM(){let t=null,e=!1,n=null,i=null;function r(s,o){n(s,o),i=t.requestAnimationFrame(r)}return{start:function(){e!==!0&&n!==null&&(i=t.requestAnimationFrame(r),e=!0)},stop:function(){t.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){n=s},setContext:function(s){t=s}}}function jA(t){let e=new WeakMap;function n(a,l){let c=a.array,d=a.usage,f=c.byteLength,h=t.createBuffer();t.bindBuffer(l,h),t.bufferData(l,c,d),a.onUploadCallback();let p;if(c instanceof Float32Array)p=t.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=t.HALF_FLOAT:p=t.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=t.SHORT;else if(c instanceof Uint32Array)p=t.UNSIGNED_INT;else if(c instanceof Int32Array)p=t.INT;else if(c instanceof Int8Array)p=t.BYTE;else if(c instanceof Uint8Array)p=t.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=t.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:f}}function i(a,l,c){let d=l.array,f=l.updateRanges;if(t.bindBuffer(c,a),f.length===0)t.bufferSubData(c,0,d);else{f.sort((p,v)=>p.start-v.start);let h=0;for(let p=1;p<f.length;p++){let v=f[h],y=f[p];y.start<=v.start+v.count+1?v.count=Math.max(v.count,y.start+y.count-v.start):(++h,f[h]=y)}f.length=h+1;for(let p=0,v=f.length;p<v;p++){let y=f[p];t.bufferSubData(c,y.start*d.BYTES_PER_ELEMENT,d,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(t.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let d=e.get(a);(!d||d.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,n(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:s,update:o}}var QA=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,eC=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,tC=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,nC=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,iC=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rC=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,sC=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,oC=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,aC=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,lC=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cC=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,uC=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,dC=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fC=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,hC=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,pC=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,mC=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gC=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vC=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,xC=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,yC=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,_C=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,bC=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,SC=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,MC=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,wC=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,EC=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,TC=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,AC=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,CC=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,RC="gl_FragColor = linearToOutputTexel( gl_FragColor );",PC=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,IC=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,kC=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,LC=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,NC=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,DC=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,UC=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,FC=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,OC=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zC=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,BC=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,HC=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,VC=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,GC=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,WC=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,XC=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,qC=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$C=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,YC=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ZC=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,JC=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,KC=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jC=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,QC=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,eR=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,tR=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,nR=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,iR=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rR=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,sR=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,oR=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,aR=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,lR=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,cR=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,uR=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,dR=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,fR=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,hR=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,pR=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,mR=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,gR=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,vR=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,xR=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yR=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_R=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,bR=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,SR=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,MR=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wR=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ER=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,TR=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,AR=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,CR=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,RR=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,PR=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,IR=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,kR=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,LR=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,NR=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,DR=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,UR=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,FR=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,OR=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,zR=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,BR=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,HR=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,VR=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,GR=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,WR=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,XR=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,qR=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,$R=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,YR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ZR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,JR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,KR=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,jR=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,QR=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,eP=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tP=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nP=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,iP=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rP=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,sP=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,oP=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,aP=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,lP=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,cP=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uP=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,dP=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,fP=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,hP=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pP=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mP=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gP=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,vP=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xP=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,yP=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,_P=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bP=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,SP=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,MP=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wP=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,EP=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,TP=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,AP=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,CP=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,RP=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,PP=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,IP=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ye={alphahash_fragment:QA,alphahash_pars_fragment:eC,alphamap_fragment:tC,alphamap_pars_fragment:nC,alphatest_fragment:iC,alphatest_pars_fragment:rC,aomap_fragment:sC,aomap_pars_fragment:oC,batching_pars_vertex:aC,batching_vertex:lC,begin_vertex:cC,beginnormal_vertex:uC,bsdfs:dC,iridescence_fragment:fC,bumpmap_pars_fragment:hC,clipping_planes_fragment:pC,clipping_planes_pars_fragment:mC,clipping_planes_pars_vertex:gC,clipping_planes_vertex:vC,color_fragment:xC,color_pars_fragment:yC,color_pars_vertex:_C,color_vertex:bC,common:SC,cube_uv_reflection_fragment:MC,defaultnormal_vertex:wC,displacementmap_pars_vertex:EC,displacementmap_vertex:TC,emissivemap_fragment:AC,emissivemap_pars_fragment:CC,colorspace_fragment:RC,colorspace_pars_fragment:PC,envmap_fragment:IC,envmap_common_pars_fragment:kC,envmap_pars_fragment:LC,envmap_pars_vertex:NC,envmap_physical_pars_fragment:XC,envmap_vertex:DC,fog_vertex:UC,fog_pars_vertex:FC,fog_fragment:OC,fog_pars_fragment:zC,gradientmap_pars_fragment:BC,lightmap_pars_fragment:HC,lights_lambert_fragment:VC,lights_lambert_pars_fragment:GC,lights_pars_begin:WC,lights_toon_fragment:qC,lights_toon_pars_fragment:$C,lights_phong_fragment:YC,lights_phong_pars_fragment:ZC,lights_physical_fragment:JC,lights_physical_pars_fragment:KC,lights_fragment_begin:jC,lights_fragment_maps:QC,lights_fragment_end:eR,logdepthbuf_fragment:tR,logdepthbuf_pars_fragment:nR,logdepthbuf_pars_vertex:iR,logdepthbuf_vertex:rR,map_fragment:sR,map_pars_fragment:oR,map_particle_fragment:aR,map_particle_pars_fragment:lR,metalnessmap_fragment:cR,metalnessmap_pars_fragment:uR,morphinstance_vertex:dR,morphcolor_vertex:fR,morphnormal_vertex:hR,morphtarget_pars_vertex:pR,morphtarget_vertex:mR,normal_fragment_begin:gR,normal_fragment_maps:vR,normal_pars_fragment:xR,normal_pars_vertex:yR,normal_vertex:_R,normalmap_pars_fragment:bR,clearcoat_normal_fragment_begin:SR,clearcoat_normal_fragment_maps:MR,clearcoat_pars_fragment:wR,iridescence_pars_fragment:ER,opaque_fragment:TR,packing:AR,premultiplied_alpha_fragment:CR,project_vertex:RR,dithering_fragment:PR,dithering_pars_fragment:IR,roughnessmap_fragment:kR,roughnessmap_pars_fragment:LR,shadowmap_pars_fragment:NR,shadowmap_pars_vertex:DR,shadowmap_vertex:UR,shadowmask_pars_fragment:FR,skinbase_vertex:OR,skinning_pars_vertex:zR,skinning_vertex:BR,skinnormal_vertex:HR,specularmap_fragment:VR,specularmap_pars_fragment:GR,tonemapping_fragment:WR,tonemapping_pars_fragment:XR,transmission_fragment:qR,transmission_pars_fragment:$R,uv_pars_fragment:YR,uv_pars_vertex:ZR,uv_vertex:JR,worldpos_vertex:KR,background_vert:jR,background_frag:QR,backgroundCube_vert:eP,backgroundCube_frag:tP,cube_vert:nP,cube_frag:iP,depth_vert:rP,depth_frag:sP,distanceRGBA_vert:oP,distanceRGBA_frag:aP,equirect_vert:lP,equirect_frag:cP,linedashed_vert:uP,linedashed_frag:dP,meshbasic_vert:fP,meshbasic_frag:hP,meshlambert_vert:pP,meshlambert_frag:mP,meshmatcap_vert:gP,meshmatcap_frag:vP,meshnormal_vert:xP,meshnormal_frag:yP,meshphong_vert:_P,meshphong_frag:bP,meshphysical_vert:SP,meshphysical_frag:MP,meshtoon_vert:wP,meshtoon_frag:EP,points_vert:TP,points_frag:AP,shadow_vert:CP,shadow_frag:RP,sprite_vert:PP,sprite_frag:IP},de={common:{diffuse:{value:new je(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new $e}},envmap:{envMap:{value:null},envMapRotation:{value:new $e},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new $e}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new $e}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new $e},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new $e},normalScale:{value:new ht(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new $e},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new $e}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new $e}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new $e}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new je(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new je(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0},uvTransform:{value:new $e}},sprite:{diffuse:{value:new je(16777215)},opacity:{value:1},center:{value:new ht(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}}},Zi={basic:{uniforms:vn([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.fog]),vertexShader:Ye.meshbasic_vert,fragmentShader:Ye.meshbasic_frag},lambert:{uniforms:vn([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new je(0)}}]),vertexShader:Ye.meshlambert_vert,fragmentShader:Ye.meshlambert_frag},phong:{uniforms:vn([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new je(0)},specular:{value:new je(1118481)},shininess:{value:30}}]),vertexShader:Ye.meshphong_vert,fragmentShader:Ye.meshphong_frag},standard:{uniforms:vn([de.common,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.roughnessmap,de.metalnessmap,de.fog,de.lights,{emissive:{value:new je(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag},toon:{uniforms:vn([de.common,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.gradientmap,de.fog,de.lights,{emissive:{value:new je(0)}}]),vertexShader:Ye.meshtoon_vert,fragmentShader:Ye.meshtoon_frag},matcap:{uniforms:vn([de.common,de.bumpmap,de.normalmap,de.displacementmap,de.fog,{matcap:{value:null}}]),vertexShader:Ye.meshmatcap_vert,fragmentShader:Ye.meshmatcap_frag},points:{uniforms:vn([de.points,de.fog]),vertexShader:Ye.points_vert,fragmentShader:Ye.points_frag},dashed:{uniforms:vn([de.common,de.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ye.linedashed_vert,fragmentShader:Ye.linedashed_frag},depth:{uniforms:vn([de.common,de.displacementmap]),vertexShader:Ye.depth_vert,fragmentShader:Ye.depth_frag},normal:{uniforms:vn([de.common,de.bumpmap,de.normalmap,de.displacementmap,{opacity:{value:1}}]),vertexShader:Ye.meshnormal_vert,fragmentShader:Ye.meshnormal_frag},sprite:{uniforms:vn([de.sprite,de.fog]),vertexShader:Ye.sprite_vert,fragmentShader:Ye.sprite_frag},background:{uniforms:{uvTransform:{value:new $e},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ye.background_vert,fragmentShader:Ye.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new $e}},vertexShader:Ye.backgroundCube_vert,fragmentShader:Ye.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ye.cube_vert,fragmentShader:Ye.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ye.equirect_vert,fragmentShader:Ye.equirect_frag},distanceRGBA:{uniforms:vn([de.common,de.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ye.distanceRGBA_vert,fragmentShader:Ye.distanceRGBA_frag},shadow:{uniforms:vn([de.lights,de.fog,{color:{value:new je(0)},opacity:{value:1}}]),vertexShader:Ye.shadow_vert,fragmentShader:Ye.shadow_frag}};Zi.physical={uniforms:vn([Zi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new $e},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new $e},clearcoatNormalScale:{value:new ht(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new $e},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new $e},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new $e},sheen:{value:0},sheenColor:{value:new je(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new $e},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new $e},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new $e},transmissionSamplerSize:{value:new ht},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new $e},attenuationDistance:{value:0},attenuationColor:{value:new je(0)},specularColor:{value:new je(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new $e},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new $e},anisotropyVector:{value:new ht},anisotropyMap:{value:null},anisotropyMapTransform:{value:new $e}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag};var nh={r:0,b:0,g:0},Qs=new Gi,kP=new Ut;function LP(t,e,n,i,r,s,o){let a=new je(0),l=s===!0?0:1,c,d,f=null,h=0,p=null;function v(x){let _=x.isScene===!0?x.background:null;return _&&_.isTexture&&(_=(x.backgroundBlurriness>0?n:e).get(_)),_}function y(x){let _=!1,T=v(x);T===null?u(a,l):T&&T.isColor&&(u(T,1),_=!0);let E=t.xr.getEnvironmentBlendMode();E==="additive"?i.buffers.color.setClear(0,0,0,1,o):E==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(t.autoClear||_)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil))}function m(x,_){let T=v(_);T&&(T.isCubeTexture||T.mapping===ic)?(d===void 0&&(d=new gn(new ca(1,1,1),new Ri({name:"BackgroundCubeMaterial",uniforms:js(Zi.backgroundCube.uniforms),vertexShader:Zi.backgroundCube.vertexShader,fragmentShader:Zi.backgroundCube.fragmentShader,side:En,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(E,A,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(d)),Qs.copy(_.backgroundRotation),Qs.x*=-1,Qs.y*=-1,Qs.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(Qs.y*=-1,Qs.z*=-1),d.material.uniforms.envMap.value=T,d.material.uniforms.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(kP.makeRotationFromEuler(Qs)),d.material.toneMapped=rt.getTransfer(T.colorSpace)!==ft,(f!==T||h!==T.version||p!==t.toneMapping)&&(d.material.needsUpdate=!0,f=T,h=T.version,p=t.toneMapping),d.layers.enableAll(),x.unshift(d,d.geometry,d.material,0,0,null)):T&&T.isTexture&&(c===void 0&&(c=new gn(new tc(2,2),new Ri({name:"BackgroundMaterial",uniforms:js(Zi.background.uniforms),vertexShader:Zi.background.vertexShader,fragmentShader:Zi.background.fragmentShader,side:mr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=T,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=rt.getTransfer(T.colorSpace)!==ft,T.matrixAutoUpdate===!0&&T.updateMatrix(),c.material.uniforms.uvTransform.value.copy(T.matrix),(f!==T||h!==T.version||p!==t.toneMapping)&&(c.material.needsUpdate=!0,f=T,h=T.version,p=t.toneMapping),c.layers.enableAll(),x.unshift(c,c.geometry,c.material,0,0,null))}function u(x,_){x.getRGB(nh,Lg(t)),i.buffers.color.setClear(nh.r,nh.g,nh.b,_,o)}function g(){d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,_=1){a.set(x),l=_,u(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(x){l=x,u(a,l)},render:y,addToRenderList:m,dispose:g}}function NP(t,e){let n=t.getParameter(t.MAX_VERTEX_ATTRIBS),i={},r=h(null),s=r,o=!1;function a(S,P,z,L,O){let X=!1,H=f(L,z,P);s!==H&&(s=H,c(s.object)),X=p(S,L,z,O),X&&v(S,L,z,O),O!==null&&e.update(O,t.ELEMENT_ARRAY_BUFFER),(X||o)&&(o=!1,_(S,P,z,L),O!==null&&t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function l(){return t.createVertexArray()}function c(S){return t.bindVertexArray(S)}function d(S){return t.deleteVertexArray(S)}function f(S,P,z){let L=z.wireframe===!0,O=i[S.id];O===void 0&&(O={},i[S.id]=O);let X=O[P.id];X===void 0&&(X={},O[P.id]=X);let H=X[L];return H===void 0&&(H=h(l()),X[L]=H),H}function h(S){let P=[],z=[],L=[];for(let O=0;O<n;O++)P[O]=0,z[O]=0,L[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:z,attributeDivisors:L,object:S,attributes:{},index:null}}function p(S,P,z,L){let O=s.attributes,X=P.attributes,H=0,Z=z.getAttributes();for(let G in Z)if(Z[G].location>=0){let le=O[G],te=X[G];if(te===void 0&&(G==="instanceMatrix"&&S.instanceMatrix&&(te=S.instanceMatrix),G==="instanceColor"&&S.instanceColor&&(te=S.instanceColor)),le===void 0||le.attribute!==te||te&&le.data!==te.data)return!0;H++}return s.attributesNum!==H||s.index!==L}function v(S,P,z,L){let O={},X=P.attributes,H=0,Z=z.getAttributes();for(let G in Z)if(Z[G].location>=0){let le=X[G];le===void 0&&(G==="instanceMatrix"&&S.instanceMatrix&&(le=S.instanceMatrix),G==="instanceColor"&&S.instanceColor&&(le=S.instanceColor));let te={};te.attribute=le,le&&le.data&&(te.data=le.data),O[G]=te,H++}s.attributes=O,s.attributesNum=H,s.index=L}function y(){let S=s.newAttributes;for(let P=0,z=S.length;P<z;P++)S[P]=0}function m(S){u(S,0)}function u(S,P){let z=s.newAttributes,L=s.enabledAttributes,O=s.attributeDivisors;z[S]=1,L[S]===0&&(t.enableVertexAttribArray(S),L[S]=1),O[S]!==P&&(t.vertexAttribDivisor(S,P),O[S]=P)}function g(){let S=s.newAttributes,P=s.enabledAttributes;for(let z=0,L=P.length;z<L;z++)P[z]!==S[z]&&(t.disableVertexAttribArray(z),P[z]=0)}function x(S,P,z,L,O,X,H){H===!0?t.vertexAttribIPointer(S,P,z,O,X):t.vertexAttribPointer(S,P,z,L,O,X)}function _(S,P,z,L){y();let O=L.attributes,X=z.getAttributes(),H=P.defaultAttributeValues;for(let Z in X){let G=X[Z];if(G.location>=0){let oe=O[Z];if(oe===void 0&&(Z==="instanceMatrix"&&S.instanceMatrix&&(oe=S.instanceMatrix),Z==="instanceColor"&&S.instanceColor&&(oe=S.instanceColor)),oe!==void 0){let le=oe.normalized,te=oe.itemSize,ge=e.get(oe);if(ge===void 0)continue;let Ge=ge.buffer,W=ge.type,se=ge.bytesPerElement,ye=W===t.INT||W===t.UNSIGNED_INT||oe.gpuType===wf;if(oe.isInterleavedBufferAttribute){let ae=oe.data,Te=ae.stride,Qe=oe.offset;if(ae.isInstancedInterleavedBuffer){for(let Ne=0;Ne<G.locationSize;Ne++)u(G.location+Ne,ae.meshPerAttribute);S.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let Ne=0;Ne<G.locationSize;Ne++)m(G.location+Ne);t.bindBuffer(t.ARRAY_BUFFER,Ge);for(let Ne=0;Ne<G.locationSize;Ne++)x(G.location+Ne,te/G.locationSize,W,le,Te*se,(Qe+te/G.locationSize*Ne)*se,ye)}else{if(oe.isInstancedBufferAttribute){for(let ae=0;ae<G.locationSize;ae++)u(G.location+ae,oe.meshPerAttribute);S.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let ae=0;ae<G.locationSize;ae++)m(G.location+ae);t.bindBuffer(t.ARRAY_BUFFER,Ge);for(let ae=0;ae<G.locationSize;ae++)x(G.location+ae,te/G.locationSize,W,le,te*se,te/G.locationSize*ae*se,ye)}}else if(H!==void 0){let le=H[Z];if(le!==void 0)switch(le.length){case 2:t.vertexAttrib2fv(G.location,le);break;case 3:t.vertexAttrib3fv(G.location,le);break;case 4:t.vertexAttrib4fv(G.location,le);break;default:t.vertexAttrib1fv(G.location,le)}}}}g()}function T(){R();for(let S in i){let P=i[S];for(let z in P){let L=P[z];for(let O in L)d(L[O].object),delete L[O];delete P[z]}delete i[S]}}function E(S){if(i[S.id]===void 0)return;let P=i[S.id];for(let z in P){let L=P[z];for(let O in L)d(L[O].object),delete L[O];delete P[z]}delete i[S.id]}function A(S){for(let P in i){let z=i[P];if(z[S.id]===void 0)continue;let L=z[S.id];for(let O in L)d(L[O].object),delete L[O];delete z[S.id]}}function R(){w(),o=!0,s!==r&&(s=r,c(s.object))}function w(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:R,resetDefaultState:w,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfProgram:A,initAttributes:y,enableAttribute:m,disableUnusedAttributes:g}}function DP(t,e,n){let i;function r(c){i=c}function s(c,d){t.drawArrays(i,c,d),n.update(d,i,1)}function o(c,d,f){f!==0&&(t.drawArraysInstanced(i,c,d,f),n.update(d,i,f))}function a(c,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,d,0,f);let p=0;for(let v=0;v<f;v++)p+=d[v];n.update(p,i,1)}function l(c,d,f,h){if(f===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let v=0;v<c.length;v++)o(c[v],d[v],h[v]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,d,0,h,0,f);let v=0;for(let y=0;y<f;y++)v+=d[y]*h[y];n.update(v,i,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function UP(t,e,n,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");r=t.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(A){return!(A!==ui&&i.convert(A)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let R=A===ma&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==$i&&i.convert(A)!==t.getParameter(t.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Yi&&!R)}function l(A){if(A==="highp"){if(t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.HIGH_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&t.getShaderPrecisionFormat(t.VERTEX_SHADER,t.MEDIUM_FLOAT).precision>0&&t.getShaderPrecisionFormat(t.FRAGMENT_SHADER,t.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp",d=l(c);d!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);let f=n.logarithmicDepthBuffer===!0,h=n.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS),v=t.getParameter(t.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=t.getParameter(t.MAX_TEXTURE_SIZE),m=t.getParameter(t.MAX_CUBE_MAP_TEXTURE_SIZE),u=t.getParameter(t.MAX_VERTEX_ATTRIBS),g=t.getParameter(t.MAX_VERTEX_UNIFORM_VECTORS),x=t.getParameter(t.MAX_VARYING_VECTORS),_=t.getParameter(t.MAX_FRAGMENT_UNIFORM_VECTORS),T=v>0,E=t.getParameter(t.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:h,maxTextures:p,maxVertexTextures:v,maxTextureSize:y,maxCubemapSize:m,maxAttributes:u,maxVertexUniforms:g,maxVaryings:x,maxFragmentUniforms:_,vertexTextures:T,maxSamples:E}}function FP(t){let e=this,n=null,i=0,r=!1,s=!1,o=new Bi,a=new $e,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){let p=f.length!==0||h||i!==0||r;return r=h,i=f.length,p},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,h){n=d(f,h,0)},this.setState=function(f,h,p){let v=f.clippingPlanes,y=f.clipIntersection,m=f.clipShadows,u=t.get(f);if(!r||v===null||v.length===0||s&&!m)s?d(null):c();else{let g=s?0:i,x=g*4,_=u.clippingState||null;l.value=_,_=d(v,h,x,p);for(let T=0;T!==x;++T)_[T]=n[T];u.clippingState=_,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=g}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(f,h,p,v){let y=f!==null?f.length:0,m=null;if(y!==0){if(m=l.value,v!==!0||m===null){let u=p+y*4,g=h.matrixWorldInverse;a.getNormalMatrix(g),(m===null||m.length<u)&&(m=new Float32Array(u));for(let x=0,_=p;x!==y;++x,_+=4)o.copy(f[x]).applyMatrix4(g,a),o.normal.toArray(m,_),m[_+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,m}}function OP(t){let e=new WeakMap;function n(o,a){return a===bf?o.mapping=Js:a===Sf&&(o.mapping=Ks),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===bf||a===Sf)if(e.has(o)){let l=e.get(o).texture;return n(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Jd(l.height);return c.fromEquirectangularTexture(t,o),e.set(o,c),o.addEventListener("dispose",r),n(c.texture,o.mapping)}else return null}}return o}function r(o){let a=o.target;a.removeEventListener("dispose",r);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}var ya=4,tM=[.125,.215,.35,.446,.526,.582],no=20,Fg=new ff,nM=new je,Og=null,zg=0,Bg=0,Hg=!1,to=(1+Math.sqrt(5))/2,xa=1/to,iM=[new U(-to,xa,0),new U(to,xa,0),new U(-xa,0,to),new U(xa,0,to),new U(0,to,-xa),new U(0,to,xa),new U(-1,1,-1),new U(1,1,-1),new U(-1,1,1),new U(1,1,1)],zP=new U,sh=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,n=0,i=.1,r=100,s={}){let{size:o=256,position:a=zP}=s;Og=this._renderer.getRenderTarget(),zg=this._renderer.getActiveCubeFace(),Bg=this._renderer.getActiveMipmapLevel(),Hg=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,n=null){return this._fromTexture(e,n)}fromCubemap(e,n=null){return this._fromTexture(e,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=oM(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=sM(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Og,zg,Bg),this._renderer.xr.enabled=Hg,e.scissorTest=!1,ih(e,0,0,e.width,e.height)}_fromTexture(e,n){e.mapping===Js||e.mapping===Ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Og=this._renderer.getRenderTarget(),zg=this._renderer.getActiveCubeFace(),Bg=this._renderer.getActiveMipmapLevel(),Hg=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=n||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:Ci,minFilter:Ci,generateMipmaps:!1,type:ma,format:ui,colorSpace:qs,depthBuffer:!1},r=rM(e,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=rM(e,n,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=BP(s)),this._blurMaterial=HP(s,e,n)}return r}_compileMaterial(e){let n=new gn(this._lodPlanes[0],e);this._renderer.compile(n,Fg)}_sceneToCubeUV(e,n,i,r,s){let l=new pn(90,1,n,i),c=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,p=f.toneMapping;f.getClearColor(nM),f.toneMapping=br,f.autoClear=!1;let v=new yr({name:"PMREM.Background",side:En,depthWrite:!1,depthTest:!1}),y=new gn(new ca,v),m=!1,u=e.background;u?u.isColor&&(v.color.copy(u),e.background=null,m=!0):(v.color.copy(nM),m=!0);for(let g=0;g<6;g++){let x=g%3;x===0?(l.up.set(0,c[g],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+d[g],s.y,s.z)):x===1?(l.up.set(0,0,c[g]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+d[g],s.z)):(l.up.set(0,c[g],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+d[g]));let _=this._cubeSize;ih(r,x*_,g>2?_:0,_,_),f.setRenderTarget(r),m&&f.render(y,l),f.render(e,l)}y.geometry.dispose(),y.material.dispose(),f.toneMapping=p,f.autoClear=h,e.background=u}_textureToCubeUV(e,n){let i=this._renderer,r=e.mapping===Js||e.mapping===Ks;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=oM()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=sM());let s=r?this._cubemapMaterial:this._equirectMaterial,o=new gn(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=e;let l=this._cubeSize;ih(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(o,Fg)}_applyPMREM(e){let n=this._renderer,i=n.autoClear;n.autoClear=!1;let r=this._lodPlanes.length;for(let s=1;s<r;s++){let o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=iM[(r-s-1)%iM.length];this._blur(e,s-1,s,o,a)}n.autoClear=i}_blur(e,n,i,r,s){let o=this._pingPongRenderTarget;this._halfBlur(e,o,n,i,r,"latitudinal",s),this._halfBlur(o,e,i,i,r,"longitudinal",s)}_halfBlur(e,n,i,r,s,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let d=3,f=new gn(this._lodPlanes[r],c),h=c.uniforms,p=this._sizeLods[i]-1,v=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*no-1),y=s/v,m=isFinite(s)?1+Math.floor(d*y):no;m>no&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${no}`);let u=[],g=0;for(let A=0;A<no;++A){let R=A/y,w=Math.exp(-R*R/2);u.push(w),A===0?g+=w:A<m&&(g+=2*w)}for(let A=0;A<u.length;A++)u[A]=u[A]/g;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=u,h.latitudinal.value=o==="latitudinal",a&&(h.poleAxis.value=a);let{_lodMax:x}=this;h.dTheta.value=v,h.mipInt.value=x-i;let _=this._sizeLods[r],T=3*_*(r>x-ya?r-x+ya:0),E=4*(this._cubeSize-_);ih(n,T,E,3*_,2*_),l.setRenderTarget(n),l.render(f,Fg)}};function BP(t){let e=[],n=[],i=[],r=t,s=t-ya+1+tM.length;for(let o=0;o<s;o++){let a=Math.pow(2,r);n.push(a);let l=1/a;o>t-ya?l=tM[o-t+ya-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),d=-c,f=1+c,h=[d,d,f,d,f,f,d,d,f,f,d,f],p=6,v=6,y=3,m=2,u=1,g=new Float32Array(y*v*p),x=new Float32Array(m*v*p),_=new Float32Array(u*v*p);for(let E=0;E<p;E++){let A=E%3*2/3-1,R=E>2?0:-1,w=[A,R,0,A+2/3,R,0,A+2/3,R+1,0,A,R,0,A+2/3,R+1,0,A,R+1,0];g.set(w,y*v*E),x.set(h,m*v*E);let S=[E,E,E,E,E,E];_.set(S,u*v*E)}let T=new mn;T.setAttribute("position",new on(g,y)),T.setAttribute("uv",new on(x,m)),T.setAttribute("faceIndex",new on(_,u)),e.push(T),r>ya&&r--}return{lodPlanes:e,sizeLods:n,sigmas:i}}function rM(t,e,n){let i=new Vi(t,e,n);return i.texture.mapping=ic,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ih(t,e,n,i,r){t.viewport.set(e,n,i,r),t.scissor.set(e,n,i,r)}function HP(t,e,n){let i=new Float32Array(no),r=new U(0,1,0);return new Ri({name:"SphericalGaussianBlur",defines:{n:no,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${t}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Kg(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:_r,depthTest:!1,depthWrite:!1})}function sM(){return new Ri({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Kg(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:_r,depthTest:!1,depthWrite:!1})}function oM(){return new Ri({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Kg(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:_r,depthTest:!1,depthWrite:!1})}function Kg(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function VP(t){let e=new WeakMap,n=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===bf||l===Sf,d=l===Js||l===Ks;if(c||d){let f=e.get(a),h=f!==void 0?f.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==h)return n===null&&(n=new sh(t)),f=c?n.fromEquirectangular(a,f):n.fromCubemap(a,f),f.texture.pmremVersion=a.pmremVersion,e.set(a,f),f.texture;if(f!==void 0)return f.texture;{let p=a.image;return c&&p&&p.height>0||d&&p&&r(p)?(n===null&&(n=new sh(t)),f=c?n.fromEquirectangular(a):n.fromCubemap(a),f.texture.pmremVersion=a.pmremVersion,e.set(a,f),a.addEventListener("dispose",s),f.texture):null}}}return a}function r(a){let l=0,c=6;for(let d=0;d<c;d++)a[d]!==void 0&&l++;return l===c}function s(a){let l=a.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:o}}function GP(t){let e={};function n(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=t.getExtension("WEBGL_depth_texture")||t.getExtension("MOZ_WEBGL_depth_texture")||t.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=t.getExtension("EXT_texture_filter_anisotropic")||t.getExtension("MOZ_EXT_texture_filter_anisotropic")||t.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=t.getExtension("WEBGL_compressed_texture_s3tc")||t.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||t.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=t.getExtension("WEBGL_compressed_texture_pvrtc")||t.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=t.getExtension(i)}return e[i]=r,r}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let r=n(i);return r===null&&$s("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function WP(t,e,n,i){let r={},s=new WeakMap;function o(f){let h=f.target;h.index!==null&&e.remove(h.index);for(let v in h.attributes)e.remove(h.attributes[v]);h.removeEventListener("dispose",o),delete r[h.id];let p=s.get(h);p&&(e.remove(p),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,n.memory.geometries--}function a(f,h){return r[h.id]===!0||(h.addEventListener("dispose",o),r[h.id]=!0,n.memory.geometries++),h}function l(f){let h=f.attributes;for(let p in h)e.update(h[p],t.ARRAY_BUFFER)}function c(f){let h=[],p=f.index,v=f.attributes.position,y=0;if(p!==null){let g=p.array;y=p.version;for(let x=0,_=g.length;x<_;x+=3){let T=g[x+0],E=g[x+1],A=g[x+2];h.push(T,E,E,A,A,T)}}else if(v!==void 0){let g=v.array;y=v.version;for(let x=0,_=g.length/3-1;x<_;x+=3){let T=x+0,E=x+1,A=x+2;h.push(T,E,E,A,A,T)}}else return;let m=new(kg(h)?ql:Xl)(h,1);m.version=y;let u=s.get(f);u&&e.remove(u),s.set(f,m)}function d(f){let h=s.get(f);if(h){let p=f.index;p!==null&&h.version<p.version&&c(f)}else c(f);return s.get(f)}return{get:a,update:l,getWireframeAttribute:d}}function XP(t,e,n){let i;function r(h){i=h}let s,o;function a(h){s=h.type,o=h.bytesPerElement}function l(h,p){t.drawElements(i,p,s,h*o),n.update(p,i,1)}function c(h,p,v){v!==0&&(t.drawElementsInstanced(i,p,s,h*o,v),n.update(p,i,v))}function d(h,p,v){if(v===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,h,0,v);let m=0;for(let u=0;u<v;u++)m+=p[u];n.update(m,i,1)}function f(h,p,v,y){if(v===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let u=0;u<h.length;u++)c(h[u]/o,p[u],y[u]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,s,h,0,y,0,v);let u=0;for(let g=0;g<v;g++)u+=p[g]*y[g];n.update(u,i,1)}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=f}function qP(t){let e={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(n.calls++,o){case t.TRIANGLES:n.triangles+=a*(s/3);break;case t.LINES:n.lines+=a*(s/2);break;case t.LINE_STRIP:n.lines+=a*(s-1);break;case t.LINE_LOOP:n.lines+=a*s;break;case t.POINTS:n.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:e,render:n,programs:null,autoReset:!0,reset:r,update:i}}function $P(t,e,n){let i=new WeakMap,r=new Ft;function s(o,a,l){let c=o.morphTargetInfluences,d=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=d!==void 0?d.length:0,h=i.get(a);if(h===void 0||h.count!==f){let w=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",w)};h!==void 0&&h.texture.dispose();let p=a.morphAttributes.position!==void 0,v=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],u=a.morphAttributes.normal||[],g=a.morphAttributes.color||[],x=0;p===!0&&(x=1),v===!0&&(x=2),y===!0&&(x=3);let _=a.attributes.position.count*x,T=1;_>e.maxTextureSize&&(T=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);let E=new Float32Array(_*T*4*f),A=new Gl(E,_,T,f);A.type=Yi,A.needsUpdate=!0;let R=x*4;for(let S=0;S<f;S++){let P=m[S],z=u[S],L=g[S],O=_*T*4*S;for(let X=0;X<P.count;X++){let H=X*R;p===!0&&(r.fromBufferAttribute(P,X),E[O+H+0]=r.x,E[O+H+1]=r.y,E[O+H+2]=r.z,E[O+H+3]=0),v===!0&&(r.fromBufferAttribute(z,X),E[O+H+4]=r.x,E[O+H+5]=r.y,E[O+H+6]=r.z,E[O+H+7]=0),y===!0&&(r.fromBufferAttribute(L,X),E[O+H+8]=r.x,E[O+H+9]=r.y,E[O+H+10]=r.z,E[O+H+11]=L.itemSize===4?r.w:1)}}h={count:f,texture:A,size:new ht(_,T)},i.set(a,h),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(t,"morphTexture",o.morphTexture,n);else{let p=0;for(let y=0;y<c.length;y++)p+=c[y];let v=a.morphTargetsRelative?1:1-p;l.getUniforms().setValue(t,"morphTargetBaseInfluence",v),l.getUniforms().setValue(t,"morphTargetInfluences",c)}l.getUniforms().setValue(t,"morphTargetsTexture",h.texture,n),l.getUniforms().setValue(t,"morphTargetsTextureSize",h.size)}return{update:s}}function YP(t,e,n,i){let r=new WeakMap;function s(l){let c=i.render.frame,d=l.geometry,f=e.get(l,d);if(r.get(f)!==c&&(e.update(f),r.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),r.get(l)!==c&&(n.update(l.instanceMatrix,t.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,t.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;r.get(h)!==c&&(h.update(),r.set(h,c))}return f}function o(){r=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),n.remove(c.instanceMatrix),c.instanceColor!==null&&n.remove(c.instanceColor)}return{update:s,dispose:o}}var EM=new Dn,aM=new Ql(1,1),TM=new Gl,AM=new Yd,CM=new Yl,lM=[],cM=[],uM=new Float32Array(16),dM=new Float32Array(9),fM=new Float32Array(4);function ba(t,e,n){let i=t[0];if(i<=0||i>0)return t;let r=e*n,s=lM[r];if(s===void 0&&(s=new Float32Array(r),lM[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=n,t[o].toArray(s,a)}return s}function qt(t,e){if(t.length!==e.length)return!1;for(let n=0,i=t.length;n<i;n++)if(t[n]!==e[n])return!1;return!0}function $t(t,e){for(let n=0,i=e.length;n<i;n++)t[n]=e[n]}function ah(t,e){let n=cM[e];n===void 0&&(n=new Int32Array(e),cM[e]=n);for(let i=0;i!==e;++i)n[i]=t.allocateTextureUnit();return n}function ZP(t,e){let n=this.cache;n[0]!==e&&(t.uniform1f(this.addr,e),n[0]=e)}function JP(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2f(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(qt(n,e))return;t.uniform2fv(this.addr,e),$t(n,e)}}function KP(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3f(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else if(e.r!==void 0)(n[0]!==e.r||n[1]!==e.g||n[2]!==e.b)&&(t.uniform3f(this.addr,e.r,e.g,e.b),n[0]=e.r,n[1]=e.g,n[2]=e.b);else{if(qt(n,e))return;t.uniform3fv(this.addr,e),$t(n,e)}}function jP(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4f(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(qt(n,e))return;t.uniform4fv(this.addr,e),$t(n,e)}}function QP(t,e){let n=this.cache,i=e.elements;if(i===void 0){if(qt(n,e))return;t.uniformMatrix2fv(this.addr,!1,e),$t(n,e)}else{if(qt(n,i))return;fM.set(i),t.uniformMatrix2fv(this.addr,!1,fM),$t(n,i)}}function eI(t,e){let n=this.cache,i=e.elements;if(i===void 0){if(qt(n,e))return;t.uniformMatrix3fv(this.addr,!1,e),$t(n,e)}else{if(qt(n,i))return;dM.set(i),t.uniformMatrix3fv(this.addr,!1,dM),$t(n,i)}}function tI(t,e){let n=this.cache,i=e.elements;if(i===void 0){if(qt(n,e))return;t.uniformMatrix4fv(this.addr,!1,e),$t(n,e)}else{if(qt(n,i))return;uM.set(i),t.uniformMatrix4fv(this.addr,!1,uM),$t(n,i)}}function nI(t,e){let n=this.cache;n[0]!==e&&(t.uniform1i(this.addr,e),n[0]=e)}function iI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2i(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(qt(n,e))return;t.uniform2iv(this.addr,e),$t(n,e)}}function rI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3i(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(qt(n,e))return;t.uniform3iv(this.addr,e),$t(n,e)}}function sI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4i(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(qt(n,e))return;t.uniform4iv(this.addr,e),$t(n,e)}}function oI(t,e){let n=this.cache;n[0]!==e&&(t.uniform1ui(this.addr,e),n[0]=e)}function aI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y)&&(t.uniform2ui(this.addr,e.x,e.y),n[0]=e.x,n[1]=e.y);else{if(qt(n,e))return;t.uniform2uiv(this.addr,e),$t(n,e)}}function lI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z)&&(t.uniform3ui(this.addr,e.x,e.y,e.z),n[0]=e.x,n[1]=e.y,n[2]=e.z);else{if(qt(n,e))return;t.uniform3uiv(this.addr,e),$t(n,e)}}function cI(t,e){let n=this.cache;if(e.x!==void 0)(n[0]!==e.x||n[1]!==e.y||n[2]!==e.z||n[3]!==e.w)&&(t.uniform4ui(this.addr,e.x,e.y,e.z,e.w),n[0]=e.x,n[1]=e.y,n[2]=e.z,n[3]=e.w);else{if(qt(n,e))return;t.uniform4uiv(this.addr,e),$t(n,e)}}function uI(t,e,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r);let s;this.type===t.SAMPLER_2D_SHADOW?(aM.compareFunction=Pg,s=aM):s=EM,n.setTexture2D(e||s,r)}function dI(t,e,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture3D(e||AM,r)}function fI(t,e,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTextureCube(e||CM,r)}function hI(t,e,n){let i=this.cache,r=n.allocateTextureUnit();i[0]!==r&&(t.uniform1i(this.addr,r),i[0]=r),n.setTexture2DArray(e||TM,r)}function pI(t){switch(t){case 5126:return ZP;case 35664:return JP;case 35665:return KP;case 35666:return jP;case 35674:return QP;case 35675:return eI;case 35676:return tI;case 5124:case 35670:return nI;case 35667:case 35671:return iI;case 35668:case 35672:return rI;case 35669:case 35673:return sI;case 5125:return oI;case 36294:return aI;case 36295:return lI;case 36296:return cI;case 35678:case 36198:case 36298:case 36306:case 35682:return uI;case 35679:case 36299:case 36307:return dI;case 35680:case 36300:case 36308:case 36293:return fI;case 36289:case 36303:case 36311:case 36292:return hI}}function mI(t,e){t.uniform1fv(this.addr,e)}function gI(t,e){let n=ba(e,this.size,2);t.uniform2fv(this.addr,n)}function vI(t,e){let n=ba(e,this.size,3);t.uniform3fv(this.addr,n)}function xI(t,e){let n=ba(e,this.size,4);t.uniform4fv(this.addr,n)}function yI(t,e){let n=ba(e,this.size,4);t.uniformMatrix2fv(this.addr,!1,n)}function _I(t,e){let n=ba(e,this.size,9);t.uniformMatrix3fv(this.addr,!1,n)}function bI(t,e){let n=ba(e,this.size,16);t.uniformMatrix4fv(this.addr,!1,n)}function SI(t,e){t.uniform1iv(this.addr,e)}function MI(t,e){t.uniform2iv(this.addr,e)}function wI(t,e){t.uniform3iv(this.addr,e)}function EI(t,e){t.uniform4iv(this.addr,e)}function TI(t,e){t.uniform1uiv(this.addr,e)}function AI(t,e){t.uniform2uiv(this.addr,e)}function CI(t,e){t.uniform3uiv(this.addr,e)}function RI(t,e){t.uniform4uiv(this.addr,e)}function PI(t,e,n){let i=this.cache,r=e.length,s=ah(n,r);qt(i,s)||(t.uniform1iv(this.addr,s),$t(i,s));for(let o=0;o!==r;++o)n.setTexture2D(e[o]||EM,s[o])}function II(t,e,n){let i=this.cache,r=e.length,s=ah(n,r);qt(i,s)||(t.uniform1iv(this.addr,s),$t(i,s));for(let o=0;o!==r;++o)n.setTexture3D(e[o]||AM,s[o])}function kI(t,e,n){let i=this.cache,r=e.length,s=ah(n,r);qt(i,s)||(t.uniform1iv(this.addr,s),$t(i,s));for(let o=0;o!==r;++o)n.setTextureCube(e[o]||CM,s[o])}function LI(t,e,n){let i=this.cache,r=e.length,s=ah(n,r);qt(i,s)||(t.uniform1iv(this.addr,s),$t(i,s));for(let o=0;o!==r;++o)n.setTexture2DArray(e[o]||TM,s[o])}function NI(t){switch(t){case 5126:return mI;case 35664:return gI;case 35665:return vI;case 35666:return xI;case 35674:return yI;case 35675:return _I;case 35676:return bI;case 5124:case 35670:return SI;case 35667:case 35671:return MI;case 35668:case 35672:return wI;case 35669:case 35673:return EI;case 5125:return TI;case 36294:return AI;case 36295:return CI;case 36296:return RI;case 35678:case 36198:case 36298:case 36306:case 35682:return PI;case 35679:case 36299:case 36307:return II;case 35680:case 36300:case 36308:case 36293:return kI;case 36289:case 36303:case 36311:case 36292:return LI}}var Gg=class{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.setValue=pI(n.type)}},Wg=class{constructor(e,n,i){this.id=e,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=NI(n.type)}},Xg=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,n,i){let r=this.seq;for(let s=0,o=r.length;s!==o;++s){let a=r[s];a.setValue(e,n[a.id],i)}}},Vg=/(\w+)(\])?(\[|\.)?/g;function hM(t,e){t.seq.push(e),t.map[e.id]=e}function DI(t,e,n){let i=t.name,r=i.length;for(Vg.lastIndex=0;;){let s=Vg.exec(i),o=Vg.lastIndex,a=s[1],l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){hM(n,c===void 0?new Gg(a,t,e):new Wg(a,t,e));break}else{let f=n.map[a];f===void 0&&(f=new Xg(a),hM(n,f)),n=f}}}var _a=class{constructor(e,n){this.seq=[],this.map={};let i=e.getProgramParameter(n,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let s=e.getActiveUniform(n,r),o=e.getUniformLocation(n,s.name);DI(s,o,this)}}setValue(e,n,i,r){let s=this.map[n];s!==void 0&&s.setValue(e,i,r)}setOptional(e,n,i){let r=n[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,n,i,r){for(let s=0,o=n.length;s!==o;++s){let a=n[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,n){let i=[];for(let r=0,s=e.length;r!==s;++r){let o=e[r];o.id in n&&i.push(o)}return i}};function pM(t,e,n){let i=t.createShader(e);return t.shaderSource(i,n),t.compileShader(i),i}var UI=37297,FI=0;function OI(t,e){let n=t.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,n.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${n[o]}`)}return i.join(`
`)}var mM=new $e;function zI(t){rt._getMatrix(mM,rt.workingColorSpace,t);let e=`mat3( ${mM.elements.map(n=>n.toFixed(4))} )`;switch(rt.getTransfer(t)){case Bl:return[e,"LinearTransferOETF"];case ft:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",t),[e,"LinearTransferOETF"]}}function gM(t,e,n){let i=t.getShaderParameter(e,t.COMPILE_STATUS),r=t.getShaderInfoLog(e).trim();if(i&&r==="")return"";let s=/ERROR: 0:(\d+)/.exec(r);if(s){let o=parseInt(s[1]);return n.toUpperCase()+`

`+r+`

`+OI(t.getShaderSource(e),o)}else return r}function BI(t,e){let n=zI(e);return[`vec4 ${t}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}function HI(t,e){let n;switch(e){case RS:n="Linear";break;case PS:n="Reinhard";break;case IS:n="Cineon";break;case kS:n="ACESFilmic";break;case NS:n="AgX";break;case DS:n="Neutral";break;case LS:n="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),n="Linear"}return"vec3 "+t+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var rh=new U;function VI(){rt.getLuminanceCoefficients(rh);let t=rh.x.toFixed(4),e=rh.y.toFixed(4),n=rh.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${t}, ${e}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function GI(t){return[t.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",t.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(dc).join(`
`)}function WI(t){let e=[];for(let n in t){let i=t[n];i!==!1&&e.push("#define "+n+" "+i)}return e.join(`
`)}function XI(t,e){let n={},i=t.getProgramParameter(e,t.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=t.getActiveAttrib(e,r),o=s.name,a=1;s.type===t.FLOAT_MAT2&&(a=2),s.type===t.FLOAT_MAT3&&(a=3),s.type===t.FLOAT_MAT4&&(a=4),n[o]={type:s.type,location:t.getAttribLocation(e,o),locationSize:a}}return n}function dc(t){return t!==""}function vM(t,e){let n=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return t.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function xM(t,e){return t.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var qI=/^[ \t]*#include +<([\w\d./]+)>/gm;function qg(t){return t.replace(qI,YI)}var $I=new Map;function YI(t,e){let n=Ye[e];if(n===void 0){let i=$I.get(e);if(i!==void 0)n=Ye[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return qg(n)}var ZI=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function yM(t){return t.replace(ZI,JI)}function JI(t,e,n,i){let r="";for(let s=parseInt(e);s<parseInt(n);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function _M(t){let e=`precision ${t.precision} float;
	precision ${t.precision} int;
	precision ${t.precision} sampler2D;
	precision ${t.precision} samplerCube;
	precision ${t.precision} sampler3D;
	precision ${t.precision} sampler2DArray;
	precision ${t.precision} sampler2DShadow;
	precision ${t.precision} samplerCubeShadow;
	precision ${t.precision} sampler2DArrayShadow;
	precision ${t.precision} isampler2D;
	precision ${t.precision} isampler3D;
	precision ${t.precision} isamplerCube;
	precision ${t.precision} isampler2DArray;
	precision ${t.precision} usampler2D;
	precision ${t.precision} usampler3D;
	precision ${t.precision} usamplerCube;
	precision ${t.precision} usampler2DArray;
	`;return t.precision==="highp"?e+=`
#define HIGH_PRECISION`:t.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:t.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function KI(t){let e="SHADOWMAP_TYPE_BASIC";return t.shadowMapType===vg?e="SHADOWMAP_TYPE_PCF":t.shadowMapType===lS?e="SHADOWMAP_TYPE_PCF_SOFT":t.shadowMapType===Wi&&(e="SHADOWMAP_TYPE_VSM"),e}function jI(t){let e="ENVMAP_TYPE_CUBE";if(t.envMap)switch(t.envMapMode){case Js:case Ks:e="ENVMAP_TYPE_CUBE";break;case ic:e="ENVMAP_TYPE_CUBE_UV";break}return e}function QI(t){let e="ENVMAP_MODE_REFLECTION";return t.envMap&&t.envMapMode===Ks&&(e="ENVMAP_MODE_REFRACTION"),e}function ek(t){let e="ENVMAP_BLENDING_NONE";if(t.envMap)switch(t.combine){case _g:e="ENVMAP_BLENDING_MULTIPLY";break;case AS:e="ENVMAP_BLENDING_MIX";break;case CS:e="ENVMAP_BLENDING_ADD";break}return e}function tk(t){let e=t.envMapCubeUVHeight;if(e===null)return null;let n=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function nk(t,e,n,i){let r=t.getContext(),s=n.defines,o=n.vertexShader,a=n.fragmentShader,l=KI(n),c=jI(n),d=QI(n),f=ek(n),h=tk(n),p=GI(n),v=WI(s),y=r.createProgram(),m,u,g=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(m=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(dc).join(`
`),m.length>0&&(m+=`
`),u=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v].filter(dc).join(`
`),u.length>0&&(u+=`
`)):(m=[_M(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+d:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",n.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(dc).join(`
`),u=[_M(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,v,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+d:"",n.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor||n.batchingColor?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",n.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==br?"#define TONE_MAPPING":"",n.toneMapping!==br?Ye.tonemapping_pars_fragment:"",n.toneMapping!==br?HI("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",Ye.colorspace_pars_fragment,BI("linearToOutputTexel",n.outputColorSpace),VI(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(dc).join(`
`)),o=qg(o),o=vM(o,n),o=xM(o,n),a=qg(a),a=vM(a,n),a=xM(a,n),o=yM(o),a=yM(a),n.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,u=["#define varying in",n.glslVersion===Ig?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===Ig?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);let x=g+m+o,_=g+u+a,T=pM(r,r.VERTEX_SHADER,x),E=pM(r,r.FRAGMENT_SHADER,_);r.attachShader(y,T),r.attachShader(y,E),n.index0AttributeName!==void 0?r.bindAttribLocation(y,0,n.index0AttributeName):n.morphTargets===!0&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function A(P){if(t.debug.checkShaderErrors){let z=r.getProgramInfoLog(y).trim(),L=r.getShaderInfoLog(T).trim(),O=r.getShaderInfoLog(E).trim(),X=!0,H=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if(X=!1,typeof t.debug.onShaderError=="function")t.debug.onShaderError(r,y,T,E);else{let Z=gM(r,T,"vertex"),G=gM(r,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+z+`
`+Z+`
`+G)}else z!==""?console.warn("THREE.WebGLProgram: Program Info Log:",z):(L===""||O==="")&&(H=!1);H&&(P.diagnostics={runnable:X,programLog:z,vertexShader:{log:L,prefix:m},fragmentShader:{log:O,prefix:u}})}r.deleteShader(T),r.deleteShader(E),R=new _a(r,y),w=XI(r,y)}let R;this.getUniforms=function(){return R===void 0&&A(this),R};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let S=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=r.getProgramParameter(y,UI)),S},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=FI++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=T,this.fragmentShader=E,this}var ik=0,$g=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let n=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(n),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){let n=this.materialCache.get(e);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let n=this.materialCache,i=n.get(e);return i===void 0&&(i=new Set,n.set(e,i)),i}_getShaderStage(e){let n=this.shaderCache,i=n.get(e);return i===void 0&&(i=new Yg(e),n.set(e,i)),i}},Yg=class{constructor(e){this.id=ik++,this.code=e,this.usedTimes=0}};function rk(t,e,n,i,r,s,o){let a=new Wl,l=new $g,c=new Set,d=[],f=r.logarithmicDepthBuffer,h=r.vertexTextures,p=r.precision,v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(w){return c.add(w),w===0?"uv":`uv${w}`}function m(w,S,P,z,L){let O=z.fog,X=L.geometry,H=w.isMeshStandardMaterial?z.environment:null,Z=(w.isMeshStandardMaterial?n:e).get(w.envMap||H),G=Z&&Z.mapping===ic?Z.image.height:null,oe=v[w.type];w.precision!==null&&(p=r.getMaxPrecision(w.precision),p!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",p,"instead."));let le=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,te=le!==void 0?le.length:0,ge=0;X.morphAttributes.position!==void 0&&(ge=1),X.morphAttributes.normal!==void 0&&(ge=2),X.morphAttributes.color!==void 0&&(ge=3);let Ge,W,se,ye;if(oe){let ct=Zi[oe];Ge=ct.vertexShader,W=ct.fragmentShader}else Ge=w.vertexShader,W=w.fragmentShader,l.update(w),se=l.getVertexShaderID(w),ye=l.getFragmentShaderID(w);let ae=t.getRenderTarget(),Te=t.state.buffers.depth.getReversed(),Qe=L.isInstancedMesh===!0,Ne=L.isBatchedMesh===!0,pt=!!w.map,yt=!!w.matcap,nt=!!Z,I=!!w.aoMap,me=!!w.lightMap,ve=!!w.bumpMap,Be=!!w.normalMap,ce=!!w.displacementMap,Re=!!w.emissiveMap,xe=!!w.metalnessMap,ke=!!w.roughnessMap,Fe=w.anisotropy>0,C=w.clearcoat>0,b=w.dispersion>0,F=w.iridescence>0,$=w.sheen>0,J=w.transmission>0,q=Fe&&!!w.anisotropyMap,Pe=C&&!!w.clearcoatMap,fe=C&&!!w.clearcoatNormalMap,Ae=C&&!!w.clearcoatRoughnessMap,Ie=F&&!!w.iridescenceMap,K=F&&!!w.iridescenceThicknessMap,be=$&&!!w.sheenColorMap,He=$&&!!w.sheenRoughnessMap,Oe=!!w.specularMap,ue=!!w.specularColorMap,Xe=!!w.specularIntensityMap,k=J&&!!w.transmissionMap,he=J&&!!w.thicknessMap,Q=!!w.gradientMap,Me=!!w.alphaMap,ie=w.alphaTest>0,Y=!!w.alphaHash,we=!!w.extensions,qe=br;w.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(qe=t.toneMapping);let _t={shaderID:oe,shaderType:w.type,shaderName:w.name,vertexShader:Ge,fragmentShader:W,defines:w.defines,customVertexShaderID:se,customFragmentShaderID:ye,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:p,batching:Ne,batchingColor:Ne&&L._colorsTexture!==null,instancing:Qe,instancingColor:Qe&&L.instanceColor!==null,instancingMorph:Qe&&L.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:ae===null?t.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:qs,alphaToCoverage:!!w.alphaToCoverage,map:pt,matcap:yt,envMap:nt,envMapMode:nt&&Z.mapping,envMapCubeUVHeight:G,aoMap:I,lightMap:me,bumpMap:ve,normalMap:Be,displacementMap:h&&ce,emissiveMap:Re,normalMapObjectSpace:Be&&w.normalMapType===BS,normalMapTangentSpace:Be&&w.normalMapType===zS,metalnessMap:xe,roughnessMap:ke,anisotropy:Fe,anisotropyMap:q,clearcoat:C,clearcoatMap:Pe,clearcoatNormalMap:fe,clearcoatRoughnessMap:Ae,dispersion:b,iridescence:F,iridescenceMap:Ie,iridescenceThicknessMap:K,sheen:$,sheenColorMap:be,sheenRoughnessMap:He,specularMap:Oe,specularColorMap:ue,specularIntensityMap:Xe,transmission:J,transmissionMap:k,thicknessMap:he,gradientMap:Q,opaque:w.transparent===!1&&w.blending===Ws&&w.alphaToCoverage===!1,alphaMap:Me,alphaTest:ie,alphaHash:Y,combine:w.combine,mapUv:pt&&y(w.map.channel),aoMapUv:I&&y(w.aoMap.channel),lightMapUv:me&&y(w.lightMap.channel),bumpMapUv:ve&&y(w.bumpMap.channel),normalMapUv:Be&&y(w.normalMap.channel),displacementMapUv:ce&&y(w.displacementMap.channel),emissiveMapUv:Re&&y(w.emissiveMap.channel),metalnessMapUv:xe&&y(w.metalnessMap.channel),roughnessMapUv:ke&&y(w.roughnessMap.channel),anisotropyMapUv:q&&y(w.anisotropyMap.channel),clearcoatMapUv:Pe&&y(w.clearcoatMap.channel),clearcoatNormalMapUv:fe&&y(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ae&&y(w.clearcoatRoughnessMap.channel),iridescenceMapUv:Ie&&y(w.iridescenceMap.channel),iridescenceThicknessMapUv:K&&y(w.iridescenceThicknessMap.channel),sheenColorMapUv:be&&y(w.sheenColorMap.channel),sheenRoughnessMapUv:He&&y(w.sheenRoughnessMap.channel),specularMapUv:Oe&&y(w.specularMap.channel),specularColorMapUv:ue&&y(w.specularColorMap.channel),specularIntensityMapUv:Xe&&y(w.specularIntensityMap.channel),transmissionMapUv:k&&y(w.transmissionMap.channel),thicknessMapUv:he&&y(w.thicknessMap.channel),alphaMapUv:Me&&y(w.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(Be||Fe),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!X.attributes.uv&&(pt||Me),fog:!!O,useFog:w.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:Te,skinning:L.isSkinnedMesh===!0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:te,morphTextureStride:ge,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:t.shadowMap.enabled&&P.length>0,shadowMapType:t.shadowMap.type,toneMapping:qe,decodeVideoTexture:pt&&w.map.isVideoTexture===!0&&rt.getTransfer(w.map.colorSpace)===ft,decodeVideoTextureEmissive:Re&&w.emissiveMap.isVideoTexture===!0&&rt.getTransfer(w.emissiveMap.colorSpace)===ft,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===Xi,flipSided:w.side===En,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:we&&w.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(we&&w.extensions.multiDraw===!0||Ne)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return _t.vertexUv1s=c.has(1),_t.vertexUv2s=c.has(2),_t.vertexUv3s=c.has(3),c.clear(),_t}function u(w){let S=[];if(w.shaderID?S.push(w.shaderID):(S.push(w.customVertexShaderID),S.push(w.customFragmentShaderID)),w.defines!==void 0)for(let P in w.defines)S.push(P),S.push(w.defines[P]);return w.isRawShaderMaterial===!1&&(g(S,w),x(S,w),S.push(t.outputColorSpace)),S.push(w.customProgramCacheKey),S.join()}function g(w,S){w.push(S.precision),w.push(S.outputColorSpace),w.push(S.envMapMode),w.push(S.envMapCubeUVHeight),w.push(S.mapUv),w.push(S.alphaMapUv),w.push(S.lightMapUv),w.push(S.aoMapUv),w.push(S.bumpMapUv),w.push(S.normalMapUv),w.push(S.displacementMapUv),w.push(S.emissiveMapUv),w.push(S.metalnessMapUv),w.push(S.roughnessMapUv),w.push(S.anisotropyMapUv),w.push(S.clearcoatMapUv),w.push(S.clearcoatNormalMapUv),w.push(S.clearcoatRoughnessMapUv),w.push(S.iridescenceMapUv),w.push(S.iridescenceThicknessMapUv),w.push(S.sheenColorMapUv),w.push(S.sheenRoughnessMapUv),w.push(S.specularMapUv),w.push(S.specularColorMapUv),w.push(S.specularIntensityMapUv),w.push(S.transmissionMapUv),w.push(S.thicknessMapUv),w.push(S.combine),w.push(S.fogExp2),w.push(S.sizeAttenuation),w.push(S.morphTargetsCount),w.push(S.morphAttributeCount),w.push(S.numDirLights),w.push(S.numPointLights),w.push(S.numSpotLights),w.push(S.numSpotLightMaps),w.push(S.numHemiLights),w.push(S.numRectAreaLights),w.push(S.numDirLightShadows),w.push(S.numPointLightShadows),w.push(S.numSpotLightShadows),w.push(S.numSpotLightShadowsWithMaps),w.push(S.numLightProbes),w.push(S.shadowMapType),w.push(S.toneMapping),w.push(S.numClippingPlanes),w.push(S.numClipIntersection),w.push(S.depthPacking)}function x(w,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reverseDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),w.push(a.mask)}function _(w){let S=v[w.type],P;if(S){let z=Zi[S];P=QS.clone(z.uniforms)}else P=w.uniforms;return P}function T(w,S){let P;for(let z=0,L=d.length;z<L;z++){let O=d[z];if(O.cacheKey===S){P=O,++P.usedTimes;break}}return P===void 0&&(P=new nk(t,S,w,s),d.push(P)),P}function E(w){if(--w.usedTimes===0){let S=d.indexOf(w);d[S]=d[d.length-1],d.pop(),w.destroy()}}function A(w){l.remove(w)}function R(){l.dispose()}return{getParameters:m,getProgramCacheKey:u,getUniforms:_,acquireProgram:T,releaseProgram:E,releaseShaderCache:A,programs:d,dispose:R}}function sk(){let t=new WeakMap;function e(o){return t.has(o)}function n(o){let a=t.get(o);return a===void 0&&(a={},t.set(o,a)),a}function i(o){t.delete(o)}function r(o,a,l){t.get(o)[a]=l}function s(){t=new WeakMap}return{has:e,get:n,remove:i,update:r,dispose:s}}function ok(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.material.id!==e.material.id?t.material.id-e.material.id:t.z!==e.z?t.z-e.z:t.id-e.id}function bM(t,e){return t.groupOrder!==e.groupOrder?t.groupOrder-e.groupOrder:t.renderOrder!==e.renderOrder?t.renderOrder-e.renderOrder:t.z!==e.z?e.z-t.z:t.id-e.id}function SM(){let t=[],e=0,n=[],i=[],r=[];function s(){e=0,n.length=0,i.length=0,r.length=0}function o(f,h,p,v,y,m){let u=t[e];return u===void 0?(u={id:f.id,object:f,geometry:h,material:p,groupOrder:v,renderOrder:f.renderOrder,z:y,group:m},t[e]=u):(u.id=f.id,u.object=f,u.geometry=h,u.material=p,u.groupOrder=v,u.renderOrder=f.renderOrder,u.z=y,u.group=m),e++,u}function a(f,h,p,v,y,m){let u=o(f,h,p,v,y,m);p.transmission>0?i.push(u):p.transparent===!0?r.push(u):n.push(u)}function l(f,h,p,v,y,m){let u=o(f,h,p,v,y,m);p.transmission>0?i.unshift(u):p.transparent===!0?r.unshift(u):n.unshift(u)}function c(f,h){n.length>1&&n.sort(f||ok),i.length>1&&i.sort(h||bM),r.length>1&&r.sort(h||bM)}function d(){for(let f=e,h=t.length;f<h;f++){let p=t[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:n,transmissive:i,transparent:r,init:s,push:a,unshift:l,finish:d,sort:c}}function ak(){let t=new WeakMap;function e(i,r){let s=t.get(i),o;return s===void 0?(o=new SM,t.set(i,[o])):r>=s.length?(o=new SM,s.push(o)):o=s[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}function lk(){let t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"DirectionalLight":n={direction:new U,color:new je};break;case"SpotLight":n={position:new U,direction:new U,color:new je,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new U,color:new je,distance:0,decay:0};break;case"HemisphereLight":n={direction:new U,skyColor:new je,groundColor:new je};break;case"RectAreaLight":n={color:new je,position:new U,halfWidth:new U,halfHeight:new U};break}return t[e.id]=n,n}}}function ck(){let t={};return{get:function(e){if(t[e.id]!==void 0)return t[e.id];let n;switch(e.type){case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ht,shadowCameraNear:1,shadowCameraFar:1e3};break}return t[e.id]=n,n}}}var uk=0;function dk(t,e){return(e.castShadow?2:0)-(t.castShadow?2:0)+(e.map?1:0)-(t.map?1:0)}function fk(t){let e=new lk,n=ck(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new U);let r=new U,s=new Ut,o=new Ut;function a(c){let d=0,f=0,h=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let p=0,v=0,y=0,m=0,u=0,g=0,x=0,_=0,T=0,E=0,A=0;c.sort(dk);for(let w=0,S=c.length;w<S;w++){let P=c[w],z=P.color,L=P.intensity,O=P.distance,X=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)d+=z.r*L,f+=z.g*L,h+=z.b*L;else if(P.isLightProbe){for(let H=0;H<9;H++)i.probe[H].addScaledVector(P.sh.coefficients[H],L);A++}else if(P.isDirectionalLight){let H=e.get(P);if(H.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Z=P.shadow,G=n.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,i.directionalShadow[p]=G,i.directionalShadowMap[p]=X,i.directionalShadowMatrix[p]=P.shadow.matrix,g++}i.directional[p]=H,p++}else if(P.isSpotLight){let H=e.get(P);H.position.setFromMatrixPosition(P.matrixWorld),H.color.copy(z).multiplyScalar(L),H.distance=O,H.coneCos=Math.cos(P.angle),H.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),H.decay=P.decay,i.spot[y]=H;let Z=P.shadow;if(P.map&&(i.spotLightMap[T]=P.map,T++,Z.updateMatrices(P),P.castShadow&&E++),i.spotLightMatrix[y]=Z.matrix,P.castShadow){let G=n.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,i.spotShadow[y]=G,i.spotShadowMap[y]=X,_++}y++}else if(P.isRectAreaLight){let H=e.get(P);H.color.copy(z).multiplyScalar(L),H.halfWidth.set(P.width*.5,0,0),H.halfHeight.set(0,P.height*.5,0),i.rectArea[m]=H,m++}else if(P.isPointLight){let H=e.get(P);if(H.color.copy(P.color).multiplyScalar(P.intensity),H.distance=P.distance,H.decay=P.decay,P.castShadow){let Z=P.shadow,G=n.get(P);G.shadowIntensity=Z.intensity,G.shadowBias=Z.bias,G.shadowNormalBias=Z.normalBias,G.shadowRadius=Z.radius,G.shadowMapSize=Z.mapSize,G.shadowCameraNear=Z.camera.near,G.shadowCameraFar=Z.camera.far,i.pointShadow[v]=G,i.pointShadowMap[v]=X,i.pointShadowMatrix[v]=P.shadow.matrix,x++}i.point[v]=H,v++}else if(P.isHemisphereLight){let H=e.get(P);H.skyColor.copy(P.color).multiplyScalar(L),H.groundColor.copy(P.groundColor).multiplyScalar(L),i.hemi[u]=H,u++}}m>0&&(t.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=de.LTC_FLOAT_1,i.rectAreaLTC2=de.LTC_FLOAT_2):(i.rectAreaLTC1=de.LTC_HALF_1,i.rectAreaLTC2=de.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=h;let R=i.hash;(R.directionalLength!==p||R.pointLength!==v||R.spotLength!==y||R.rectAreaLength!==m||R.hemiLength!==u||R.numDirectionalShadows!==g||R.numPointShadows!==x||R.numSpotShadows!==_||R.numSpotMaps!==T||R.numLightProbes!==A)&&(i.directional.length=p,i.spot.length=y,i.rectArea.length=m,i.point.length=v,i.hemi.length=u,i.directionalShadow.length=g,i.directionalShadowMap.length=g,i.pointShadow.length=x,i.pointShadowMap.length=x,i.spotShadow.length=_,i.spotShadowMap.length=_,i.directionalShadowMatrix.length=g,i.pointShadowMatrix.length=x,i.spotLightMatrix.length=_+T-E,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=A,R.directionalLength=p,R.pointLength=v,R.spotLength=y,R.rectAreaLength=m,R.hemiLength=u,R.numDirectionalShadows=g,R.numPointShadows=x,R.numSpotShadows=_,R.numSpotMaps=T,R.numLightProbes=A,i.version=uk++)}function l(c,d){let f=0,h=0,p=0,v=0,y=0,m=d.matrixWorldInverse;for(let u=0,g=c.length;u<g;u++){let x=c[u];if(x.isDirectionalLight){let _=i.directional[f];_.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),_.direction.sub(r),_.direction.transformDirection(m),f++}else if(x.isSpotLight){let _=i.spot[p];_.position.setFromMatrixPosition(x.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),_.direction.sub(r),_.direction.transformDirection(m),p++}else if(x.isRectAreaLight){let _=i.rectArea[v];_.position.setFromMatrixPosition(x.matrixWorld),_.position.applyMatrix4(m),o.identity(),s.copy(x.matrixWorld),s.premultiply(m),o.extractRotation(s),_.halfWidth.set(x.width*.5,0,0),_.halfHeight.set(0,x.height*.5,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),v++}else if(x.isPointLight){let _=i.point[h];_.position.setFromMatrixPosition(x.matrixWorld),_.position.applyMatrix4(m),h++}else if(x.isHemisphereLight){let _=i.hemi[y];_.direction.setFromMatrixPosition(x.matrixWorld),_.direction.transformDirection(m),y++}}}return{setup:a,setupView:l,state:i}}function MM(t){let e=new fk(t),n=[],i=[];function r(d){c.camera=d,n.length=0,i.length=0}function s(d){n.push(d)}function o(d){i.push(d)}function a(){e.setup(n)}function l(d){e.setupView(n,d)}let c={lightsArray:n,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function hk(t){let e=new WeakMap;function n(r,s=0){let o=e.get(r),a;return o===void 0?(a=new MM(t),e.set(r,[a])):s>=o.length?(a=new MM(t),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:n,dispose:i}}var pk=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,mk=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function gk(t,e,n){let i=new Jl,r=new ht,s=new ht,o=new Ft,a=new ef({depthPacking:OS}),l=new tf,c={},d=n.maxTextureSize,f={[mr]:En,[En]:mr,[Xi]:Xi},h=new Ri({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ht},radius:{value:4}},vertexShader:pk,fragmentShader:mk}),p=h.clone();p.defines.HORIZONTAL_PASS=1;let v=new mn;v.setAttribute("position",new on(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new gn(v,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vg;let u=this.type;this.render=function(E,A,R){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;let w=t.getRenderTarget(),S=t.getActiveCubeFace(),P=t.getActiveMipmapLevel(),z=t.state;z.setBlending(_r),z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let L=u!==Wi&&this.type===Wi,O=u===Wi&&this.type!==Wi;for(let X=0,H=E.length;X<H;X++){let Z=E[X],G=Z.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;r.copy(G.mapSize);let oe=G.getFrameExtents();if(r.multiply(oe),s.copy(G.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/oe.x),r.x=s.x*oe.x,G.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/oe.y),r.y=s.y*oe.y,G.mapSize.y=s.y)),G.map===null||L===!0||O===!0){let te=this.type!==Wi?{minFilter:ci,magFilter:ci}:{};G.map!==null&&G.map.dispose(),G.map=new Vi(r.x,r.y,te),G.map.texture.name=Z.name+".shadowMap",G.camera.updateProjectionMatrix()}t.setRenderTarget(G.map),t.clear();let le=G.getViewportCount();for(let te=0;te<le;te++){let ge=G.getViewport(te);o.set(s.x*ge.x,s.y*ge.y,s.x*ge.z,s.y*ge.w),z.viewport(o),G.updateMatrices(Z,te),i=G.getFrustum(),_(A,R,G.camera,Z,this.type)}G.isPointLightShadow!==!0&&this.type===Wi&&g(G,R),G.needsUpdate=!1}u=this.type,m.needsUpdate=!1,t.setRenderTarget(w,S,P)};function g(E,A){let R=e.update(y);h.defines.VSM_SAMPLES!==E.blurSamples&&(h.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new Vi(r.x,r.y)),h.uniforms.shadow_pass.value=E.map.texture,h.uniforms.resolution.value=E.mapSize,h.uniforms.radius.value=E.radius,t.setRenderTarget(E.mapPass),t.clear(),t.renderBufferDirect(A,null,R,h,y,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value=E.mapSize,p.uniforms.radius.value=E.radius,t.setRenderTarget(E.map),t.clear(),t.renderBufferDirect(A,null,R,p,y,null)}function x(E,A,R,w){let S=null,P=R.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(P!==void 0)S=P;else if(S=R.isPointLight===!0?l:a,t.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let z=S.uuid,L=A.uuid,O=c[z];O===void 0&&(O={},c[z]=O);let X=O[L];X===void 0&&(X=S.clone(),O[L]=X,A.addEventListener("dispose",T)),S=X}if(S.visible=A.visible,S.wireframe=A.wireframe,w===Wi?S.side=A.shadowSide!==null?A.shadowSide:A.side:S.side=A.shadowSide!==null?A.shadowSide:f[A.side],S.alphaMap=A.alphaMap,S.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,S.map=A.map,S.clipShadows=A.clipShadows,S.clippingPlanes=A.clippingPlanes,S.clipIntersection=A.clipIntersection,S.displacementMap=A.displacementMap,S.displacementScale=A.displacementScale,S.displacementBias=A.displacementBias,S.wireframeLinewidth=A.wireframeLinewidth,S.linewidth=A.linewidth,R.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let z=t.properties.get(S);z.light=R}return S}function _(E,A,R,w,S){if(E.visible===!1)return;if(E.layers.test(A.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&S===Wi)&&(!E.frustumCulled||i.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,E.matrixWorld);let L=e.update(E),O=E.material;if(Array.isArray(O)){let X=L.groups;for(let H=0,Z=X.length;H<Z;H++){let G=X[H],oe=O[G.materialIndex];if(oe&&oe.visible){let le=x(E,oe,w,S);E.onBeforeShadow(t,E,A,R,L,le,G),t.renderBufferDirect(R,null,L,le,E,G),E.onAfterShadow(t,E,A,R,L,le,G)}}}else if(O.visible){let X=x(E,O,w,S);E.onBeforeShadow(t,E,A,R,L,X,null),t.renderBufferDirect(R,null,L,X,E,null),E.onAfterShadow(t,E,A,R,L,X,null)}}let z=E.children;for(let L=0,O=z.length;L<O;L++)_(z[L],A,R,w,S)}function T(E){E.target.removeEventListener("dispose",T);for(let R in c){let w=c[R],S=E.target.uuid;S in w&&(w[S].dispose(),delete w[S])}}}var vk={[pf]:mf,[gf]:yf,[vf]:_f,[Xs]:xf,[mf]:pf,[yf]:gf,[_f]:vf,[xf]:Xs};function xk(t,e){function n(){let k=!1,he=new Ft,Q=null,Me=new Ft(0,0,0,0);return{setMask:function(ie){Q!==ie&&!k&&(t.colorMask(ie,ie,ie,ie),Q=ie)},setLocked:function(ie){k=ie},setClear:function(ie,Y,we,qe,_t){_t===!0&&(ie*=qe,Y*=qe,we*=qe),he.set(ie,Y,we,qe),Me.equals(he)===!1&&(t.clearColor(ie,Y,we,qe),Me.copy(he))},reset:function(){k=!1,Q=null,Me.set(-1,0,0,0)}}}function i(){let k=!1,he=!1,Q=null,Me=null,ie=null;return{setReversed:function(Y){if(he!==Y){let we=e.get("EXT_clip_control");Y?we.clipControlEXT(we.LOWER_LEFT_EXT,we.ZERO_TO_ONE_EXT):we.clipControlEXT(we.LOWER_LEFT_EXT,we.NEGATIVE_ONE_TO_ONE_EXT),he=Y;let qe=ie;ie=null,this.setClear(qe)}},getReversed:function(){return he},setTest:function(Y){Y?ae(t.DEPTH_TEST):Te(t.DEPTH_TEST)},setMask:function(Y){Q!==Y&&!k&&(t.depthMask(Y),Q=Y)},setFunc:function(Y){if(he&&(Y=vk[Y]),Me!==Y){switch(Y){case pf:t.depthFunc(t.NEVER);break;case mf:t.depthFunc(t.ALWAYS);break;case gf:t.depthFunc(t.LESS);break;case Xs:t.depthFunc(t.LEQUAL);break;case vf:t.depthFunc(t.EQUAL);break;case xf:t.depthFunc(t.GEQUAL);break;case yf:t.depthFunc(t.GREATER);break;case _f:t.depthFunc(t.NOTEQUAL);break;default:t.depthFunc(t.LEQUAL)}Me=Y}},setLocked:function(Y){k=Y},setClear:function(Y){ie!==Y&&(he&&(Y=1-Y),t.clearDepth(Y),ie=Y)},reset:function(){k=!1,Q=null,Me=null,ie=null,he=!1}}}function r(){let k=!1,he=null,Q=null,Me=null,ie=null,Y=null,we=null,qe=null,_t=null;return{setTest:function(ct){k||(ct?ae(t.STENCIL_TEST):Te(t.STENCIL_TEST))},setMask:function(ct){he!==ct&&!k&&(t.stencilMask(ct),he=ct)},setFunc:function(ct,fi,Ji){(Q!==ct||Me!==fi||ie!==Ji)&&(t.stencilFunc(ct,fi,Ji),Q=ct,Me=fi,ie=Ji)},setOp:function(ct,fi,Ji){(Y!==ct||we!==fi||qe!==Ji)&&(t.stencilOp(ct,fi,Ji),Y=ct,we=fi,qe=Ji)},setLocked:function(ct){k=ct},setClear:function(ct){_t!==ct&&(t.clearStencil(ct),_t=ct)},reset:function(){k=!1,he=null,Q=null,Me=null,ie=null,Y=null,we=null,qe=null,_t=null}}}let s=new n,o=new i,a=new r,l=new WeakMap,c=new WeakMap,d={},f={},h=new WeakMap,p=[],v=null,y=!1,m=null,u=null,g=null,x=null,_=null,T=null,E=null,A=new je(0,0,0),R=0,w=!1,S=null,P=null,z=null,L=null,O=null,X=t.getParameter(t.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,Z=0,G=t.getParameter(t.VERSION);G.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(G)[1]),H=Z>=1):G.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),H=Z>=2);let oe=null,le={},te=t.getParameter(t.SCISSOR_BOX),ge=t.getParameter(t.VIEWPORT),Ge=new Ft().fromArray(te),W=new Ft().fromArray(ge);function se(k,he,Q,Me){let ie=new Uint8Array(4),Y=t.createTexture();t.bindTexture(k,Y),t.texParameteri(k,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(k,t.TEXTURE_MAG_FILTER,t.NEAREST);for(let we=0;we<Q;we++)k===t.TEXTURE_3D||k===t.TEXTURE_2D_ARRAY?t.texImage3D(he,0,t.RGBA,1,1,Me,0,t.RGBA,t.UNSIGNED_BYTE,ie):t.texImage2D(he+we,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,ie);return Y}let ye={};ye[t.TEXTURE_2D]=se(t.TEXTURE_2D,t.TEXTURE_2D,1),ye[t.TEXTURE_CUBE_MAP]=se(t.TEXTURE_CUBE_MAP,t.TEXTURE_CUBE_MAP_POSITIVE_X,6),ye[t.TEXTURE_2D_ARRAY]=se(t.TEXTURE_2D_ARRAY,t.TEXTURE_2D_ARRAY,1,1),ye[t.TEXTURE_3D]=se(t.TEXTURE_3D,t.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ae(t.DEPTH_TEST),o.setFunc(Xs),ve(!1),Be(gg),ae(t.CULL_FACE),I(_r);function ae(k){d[k]!==!0&&(t.enable(k),d[k]=!0)}function Te(k){d[k]!==!1&&(t.disable(k),d[k]=!1)}function Qe(k,he){return f[k]!==he?(t.bindFramebuffer(k,he),f[k]=he,k===t.DRAW_FRAMEBUFFER&&(f[t.FRAMEBUFFER]=he),k===t.FRAMEBUFFER&&(f[t.DRAW_FRAMEBUFFER]=he),!0):!1}function Ne(k,he){let Q=p,Me=!1;if(k){Q=h.get(he),Q===void 0&&(Q=[],h.set(he,Q));let ie=k.textures;if(Q.length!==ie.length||Q[0]!==t.COLOR_ATTACHMENT0){for(let Y=0,we=ie.length;Y<we;Y++)Q[Y]=t.COLOR_ATTACHMENT0+Y;Q.length=ie.length,Me=!0}}else Q[0]!==t.BACK&&(Q[0]=t.BACK,Me=!0);Me&&t.drawBuffers(Q)}function pt(k){return v!==k?(t.useProgram(k),v=k,!0):!1}let yt={[ls]:t.FUNC_ADD,[uS]:t.FUNC_SUBTRACT,[dS]:t.FUNC_REVERSE_SUBTRACT};yt[fS]=t.MIN,yt[hS]=t.MAX;let nt={[pS]:t.ZERO,[mS]:t.ONE,[gS]:t.SRC_COLOR,[Bd]:t.SRC_ALPHA,[SS]:t.SRC_ALPHA_SATURATE,[_S]:t.DST_COLOR,[xS]:t.DST_ALPHA,[vS]:t.ONE_MINUS_SRC_COLOR,[Hd]:t.ONE_MINUS_SRC_ALPHA,[bS]:t.ONE_MINUS_DST_COLOR,[yS]:t.ONE_MINUS_DST_ALPHA,[MS]:t.CONSTANT_COLOR,[wS]:t.ONE_MINUS_CONSTANT_COLOR,[ES]:t.CONSTANT_ALPHA,[TS]:t.ONE_MINUS_CONSTANT_ALPHA};function I(k,he,Q,Me,ie,Y,we,qe,_t,ct){if(k===_r){y===!0&&(Te(t.BLEND),y=!1);return}if(y===!1&&(ae(t.BLEND),y=!0),k!==cS){if(k!==m||ct!==w){if((u!==ls||_!==ls)&&(t.blendEquation(t.FUNC_ADD),u=ls,_=ls),ct)switch(k){case Ws:t.blendFuncSeparate(t.ONE,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case qi:t.blendFunc(t.ONE,t.ONE);break;case xg:t.blendFuncSeparate(t.ZERO,t.ONE_MINUS_SRC_COLOR,t.ZERO,t.ONE);break;case yg:t.blendFuncSeparate(t.ZERO,t.SRC_COLOR,t.ZERO,t.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case Ws:t.blendFuncSeparate(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA,t.ONE,t.ONE_MINUS_SRC_ALPHA);break;case qi:t.blendFunc(t.SRC_ALPHA,t.ONE);break;case xg:t.blendFuncSeparate(t.ZERO,t.ONE_MINUS_SRC_COLOR,t.ZERO,t.ONE);break;case yg:t.blendFunc(t.ZERO,t.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}g=null,x=null,T=null,E=null,A.set(0,0,0),R=0,m=k,w=ct}return}ie=ie||he,Y=Y||Q,we=we||Me,(he!==u||ie!==_)&&(t.blendEquationSeparate(yt[he],yt[ie]),u=he,_=ie),(Q!==g||Me!==x||Y!==T||we!==E)&&(t.blendFuncSeparate(nt[Q],nt[Me],nt[Y],nt[we]),g=Q,x=Me,T=Y,E=we),(qe.equals(A)===!1||_t!==R)&&(t.blendColor(qe.r,qe.g,qe.b,_t),A.copy(qe),R=_t),m=k,w=!1}function me(k,he){k.side===Xi?Te(t.CULL_FACE):ae(t.CULL_FACE);let Q=k.side===En;he&&(Q=!Q),ve(Q),k.blending===Ws&&k.transparent===!1?I(_r):I(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),o.setFunc(k.depthFunc),o.setTest(k.depthTest),o.setMask(k.depthWrite),s.setMask(k.colorWrite);let Me=k.stencilWrite;a.setTest(Me),Me&&(a.setMask(k.stencilWriteMask),a.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),a.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),Re(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?ae(t.SAMPLE_ALPHA_TO_COVERAGE):Te(t.SAMPLE_ALPHA_TO_COVERAGE)}function ve(k){S!==k&&(k?t.frontFace(t.CW):t.frontFace(t.CCW),S=k)}function Be(k){k!==oS?(ae(t.CULL_FACE),k!==P&&(k===gg?t.cullFace(t.BACK):k===aS?t.cullFace(t.FRONT):t.cullFace(t.FRONT_AND_BACK))):Te(t.CULL_FACE),P=k}function ce(k){k!==z&&(H&&t.lineWidth(k),z=k)}function Re(k,he,Q){k?(ae(t.POLYGON_OFFSET_FILL),(L!==he||O!==Q)&&(t.polygonOffset(he,Q),L=he,O=Q)):Te(t.POLYGON_OFFSET_FILL)}function xe(k){k?ae(t.SCISSOR_TEST):Te(t.SCISSOR_TEST)}function ke(k){k===void 0&&(k=t.TEXTURE0+X-1),oe!==k&&(t.activeTexture(k),oe=k)}function Fe(k,he,Q){Q===void 0&&(oe===null?Q=t.TEXTURE0+X-1:Q=oe);let Me=le[Q];Me===void 0&&(Me={type:void 0,texture:void 0},le[Q]=Me),(Me.type!==k||Me.texture!==he)&&(oe!==Q&&(t.activeTexture(Q),oe=Q),t.bindTexture(k,he||ye[k]),Me.type=k,Me.texture=he)}function C(){let k=le[oe];k!==void 0&&k.type!==void 0&&(t.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function b(){try{t.compressedTexImage2D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function F(){try{t.compressedTexImage3D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function $(){try{t.texSubImage2D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function J(){try{t.texSubImage3D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function q(){try{t.compressedTexSubImage2D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Pe(){try{t.compressedTexSubImage3D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function fe(){try{t.texStorage2D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ae(){try{t.texStorage3D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ie(){try{t.texImage2D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function K(){try{t.texImage3D(...arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function be(k){Ge.equals(k)===!1&&(t.scissor(k.x,k.y,k.z,k.w),Ge.copy(k))}function He(k){W.equals(k)===!1&&(t.viewport(k.x,k.y,k.z,k.w),W.copy(k))}function Oe(k,he){let Q=c.get(he);Q===void 0&&(Q=new WeakMap,c.set(he,Q));let Me=Q.get(k);Me===void 0&&(Me=t.getUniformBlockIndex(he,k.name),Q.set(k,Me))}function ue(k,he){let Me=c.get(he).get(k);l.get(he)!==Me&&(t.uniformBlockBinding(he,Me,k.__bindingPointIndex),l.set(he,Me))}function Xe(){t.disable(t.BLEND),t.disable(t.CULL_FACE),t.disable(t.DEPTH_TEST),t.disable(t.POLYGON_OFFSET_FILL),t.disable(t.SCISSOR_TEST),t.disable(t.STENCIL_TEST),t.disable(t.SAMPLE_ALPHA_TO_COVERAGE),t.blendEquation(t.FUNC_ADD),t.blendFunc(t.ONE,t.ZERO),t.blendFuncSeparate(t.ONE,t.ZERO,t.ONE,t.ZERO),t.blendColor(0,0,0,0),t.colorMask(!0,!0,!0,!0),t.clearColor(0,0,0,0),t.depthMask(!0),t.depthFunc(t.LESS),o.setReversed(!1),t.clearDepth(1),t.stencilMask(4294967295),t.stencilFunc(t.ALWAYS,0,4294967295),t.stencilOp(t.KEEP,t.KEEP,t.KEEP),t.clearStencil(0),t.cullFace(t.BACK),t.frontFace(t.CCW),t.polygonOffset(0,0),t.activeTexture(t.TEXTURE0),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),t.bindFramebuffer(t.READ_FRAMEBUFFER,null),t.useProgram(null),t.lineWidth(1),t.scissor(0,0,t.canvas.width,t.canvas.height),t.viewport(0,0,t.canvas.width,t.canvas.height),d={},oe=null,le={},f={},h=new WeakMap,p=[],v=null,y=!1,m=null,u=null,g=null,x=null,_=null,T=null,E=null,A=new je(0,0,0),R=0,w=!1,S=null,P=null,z=null,L=null,O=null,Ge.set(0,0,t.canvas.width,t.canvas.height),W.set(0,0,t.canvas.width,t.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:ae,disable:Te,bindFramebuffer:Qe,drawBuffers:Ne,useProgram:pt,setBlending:I,setMaterial:me,setFlipSided:ve,setCullFace:Be,setLineWidth:ce,setPolygonOffset:Re,setScissorTest:xe,activeTexture:ke,bindTexture:Fe,unbindTexture:C,compressedTexImage2D:b,compressedTexImage3D:F,texImage2D:Ie,texImage3D:K,updateUBOMapping:Oe,uniformBlockBinding:ue,texStorage2D:fe,texStorage3D:Ae,texSubImage2D:$,texSubImage3D:J,compressedTexSubImage2D:q,compressedTexSubImage3D:Pe,scissor:be,viewport:He,reset:Xe}}function yk(t,e,n,i,r,s,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ht,d=new WeakMap,f,h=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(C,b){return p?new OffscreenCanvas(C,b):Vl("canvas")}function y(C,b,F){let $=1,J=Fe(C);if((J.width>F||J.height>F)&&($=F/Math.max(J.width,J.height)),$<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let q=Math.floor($*J.width),Pe=Math.floor($*J.height);f===void 0&&(f=v(q,Pe));let fe=b?v(q,Pe):f;return fe.width=q,fe.height=Pe,fe.getContext("2d").drawImage(C,0,0,q,Pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+q+"x"+Pe+")."),fe}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),C;return C}function m(C){return C.generateMipmaps}function u(C){t.generateMipmap(C)}function g(C){return C.isWebGLCubeRenderTarget?t.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?t.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?t.TEXTURE_2D_ARRAY:t.TEXTURE_2D}function x(C,b,F,$,J=!1){if(C!==null){if(t[C]!==void 0)return t[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let q=b;if(b===t.RED&&(F===t.FLOAT&&(q=t.R32F),F===t.HALF_FLOAT&&(q=t.R16F),F===t.UNSIGNED_BYTE&&(q=t.R8)),b===t.RED_INTEGER&&(F===t.UNSIGNED_BYTE&&(q=t.R8UI),F===t.UNSIGNED_SHORT&&(q=t.R16UI),F===t.UNSIGNED_INT&&(q=t.R32UI),F===t.BYTE&&(q=t.R8I),F===t.SHORT&&(q=t.R16I),F===t.INT&&(q=t.R32I)),b===t.RG&&(F===t.FLOAT&&(q=t.RG32F),F===t.HALF_FLOAT&&(q=t.RG16F),F===t.UNSIGNED_BYTE&&(q=t.RG8)),b===t.RG_INTEGER&&(F===t.UNSIGNED_BYTE&&(q=t.RG8UI),F===t.UNSIGNED_SHORT&&(q=t.RG16UI),F===t.UNSIGNED_INT&&(q=t.RG32UI),F===t.BYTE&&(q=t.RG8I),F===t.SHORT&&(q=t.RG16I),F===t.INT&&(q=t.RG32I)),b===t.RGB_INTEGER&&(F===t.UNSIGNED_BYTE&&(q=t.RGB8UI),F===t.UNSIGNED_SHORT&&(q=t.RGB16UI),F===t.UNSIGNED_INT&&(q=t.RGB32UI),F===t.BYTE&&(q=t.RGB8I),F===t.SHORT&&(q=t.RGB16I),F===t.INT&&(q=t.RGB32I)),b===t.RGBA_INTEGER&&(F===t.UNSIGNED_BYTE&&(q=t.RGBA8UI),F===t.UNSIGNED_SHORT&&(q=t.RGBA16UI),F===t.UNSIGNED_INT&&(q=t.RGBA32UI),F===t.BYTE&&(q=t.RGBA8I),F===t.SHORT&&(q=t.RGBA16I),F===t.INT&&(q=t.RGBA32I)),b===t.RGB&&F===t.UNSIGNED_INT_5_9_9_9_REV&&(q=t.RGB9_E5),b===t.RGBA){let Pe=J?Bl:rt.getTransfer($);F===t.FLOAT&&(q=t.RGBA32F),F===t.HALF_FLOAT&&(q=t.RGBA16F),F===t.UNSIGNED_BYTE&&(q=Pe===ft?t.SRGB8_ALPHA8:t.RGBA8),F===t.UNSIGNED_SHORT_4_4_4_4&&(q=t.RGBA4),F===t.UNSIGNED_SHORT_5_5_5_1&&(q=t.RGB5_A1)}return(q===t.R16F||q===t.R32F||q===t.RG16F||q===t.RG32F||q===t.RGBA16F||q===t.RGBA32F)&&e.get("EXT_color_buffer_float"),q}function _(C,b){let F;return C?b===null||b===ps||b===ga?F=t.DEPTH24_STENCIL8:b===Yi?F=t.DEPTH32F_STENCIL8:b===pa&&(F=t.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===ps||b===ga?F=t.DEPTH_COMPONENT24:b===Yi?F=t.DEPTH_COMPONENT32F:b===pa&&(F=t.DEPTH_COMPONENT16),F}function T(C,b){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==ci&&C.minFilter!==Ci?Math.log2(Math.max(b.width,b.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?b.mipmaps.length:1}function E(C){let b=C.target;b.removeEventListener("dispose",E),R(b),b.isVideoTexture&&d.delete(b)}function A(C){let b=C.target;b.removeEventListener("dispose",A),S(b)}function R(C){let b=i.get(C);if(b.__webglInit===void 0)return;let F=C.source,$=h.get(F);if($){let J=$[b.__cacheKey];J.usedTimes--,J.usedTimes===0&&w(C),Object.keys($).length===0&&h.delete(F)}i.remove(C)}function w(C){let b=i.get(C);t.deleteTexture(b.__webglTexture);let F=C.source,$=h.get(F);delete $[b.__cacheKey],o.memory.textures--}function S(C){let b=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(b.__webglFramebuffer[$]))for(let J=0;J<b.__webglFramebuffer[$].length;J++)t.deleteFramebuffer(b.__webglFramebuffer[$][J]);else t.deleteFramebuffer(b.__webglFramebuffer[$]);b.__webglDepthbuffer&&t.deleteRenderbuffer(b.__webglDepthbuffer[$])}else{if(Array.isArray(b.__webglFramebuffer))for(let $=0;$<b.__webglFramebuffer.length;$++)t.deleteFramebuffer(b.__webglFramebuffer[$]);else t.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&t.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&t.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let $=0;$<b.__webglColorRenderbuffer.length;$++)b.__webglColorRenderbuffer[$]&&t.deleteRenderbuffer(b.__webglColorRenderbuffer[$]);b.__webglDepthRenderbuffer&&t.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let F=C.textures;for(let $=0,J=F.length;$<J;$++){let q=i.get(F[$]);q.__webglTexture&&(t.deleteTexture(q.__webglTexture),o.memory.textures--),i.remove(F[$])}i.remove(C)}let P=0;function z(){P=0}function L(){let C=P;return C>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+r.maxTextures),P+=1,C}function O(C){let b=[];return b.push(C.wrapS),b.push(C.wrapT),b.push(C.wrapR||0),b.push(C.magFilter),b.push(C.minFilter),b.push(C.anisotropy),b.push(C.internalFormat),b.push(C.format),b.push(C.type),b.push(C.generateMipmaps),b.push(C.premultiplyAlpha),b.push(C.flipY),b.push(C.unpackAlignment),b.push(C.colorSpace),b.join()}function X(C,b){let F=i.get(C);if(C.isVideoTexture&&xe(C),C.isRenderTargetTexture===!1&&C.version>0&&F.__version!==C.version){let $=C.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ye(F,C,b);return}}n.bindTexture(t.TEXTURE_2D,F.__webglTexture,t.TEXTURE0+b)}function H(C,b){let F=i.get(C);if(C.version>0&&F.__version!==C.version){ye(F,C,b);return}n.bindTexture(t.TEXTURE_2D_ARRAY,F.__webglTexture,t.TEXTURE0+b)}function Z(C,b){let F=i.get(C);if(C.version>0&&F.__version!==C.version){ye(F,C,b);return}n.bindTexture(t.TEXTURE_3D,F.__webglTexture,t.TEXTURE0+b)}function G(C,b){let F=i.get(C);if(C.version>0&&F.__version!==C.version){ae(F,C,b);return}n.bindTexture(t.TEXTURE_CUBE_MAP,F.__webglTexture,t.TEXTURE0+b)}let oe={[Vd]:t.REPEAT,[as]:t.CLAMP_TO_EDGE,[Gd]:t.MIRRORED_REPEAT},le={[ci]:t.NEAREST,[US]:t.NEAREST_MIPMAP_NEAREST,[rc]:t.NEAREST_MIPMAP_LINEAR,[Ci]:t.LINEAR,[Mf]:t.LINEAR_MIPMAP_NEAREST,[hs]:t.LINEAR_MIPMAP_LINEAR},te={[HS]:t.NEVER,[$S]:t.ALWAYS,[VS]:t.LESS,[Pg]:t.LEQUAL,[GS]:t.EQUAL,[qS]:t.GEQUAL,[WS]:t.GREATER,[XS]:t.NOTEQUAL};function ge(C,b){if(b.type===Yi&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===Ci||b.magFilter===Mf||b.magFilter===rc||b.magFilter===hs||b.minFilter===Ci||b.minFilter===Mf||b.minFilter===rc||b.minFilter===hs)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),t.texParameteri(C,t.TEXTURE_WRAP_S,oe[b.wrapS]),t.texParameteri(C,t.TEXTURE_WRAP_T,oe[b.wrapT]),(C===t.TEXTURE_3D||C===t.TEXTURE_2D_ARRAY)&&t.texParameteri(C,t.TEXTURE_WRAP_R,oe[b.wrapR]),t.texParameteri(C,t.TEXTURE_MAG_FILTER,le[b.magFilter]),t.texParameteri(C,t.TEXTURE_MIN_FILTER,le[b.minFilter]),b.compareFunction&&(t.texParameteri(C,t.TEXTURE_COMPARE_MODE,t.COMPARE_REF_TO_TEXTURE),t.texParameteri(C,t.TEXTURE_COMPARE_FUNC,te[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===ci||b.minFilter!==rc&&b.minFilter!==hs||b.type===Yi&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||i.get(b).__currentAnisotropy){let F=e.get("EXT_texture_filter_anisotropic");t.texParameterf(C,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,r.getMaxAnisotropy())),i.get(b).__currentAnisotropy=b.anisotropy}}}function Ge(C,b){let F=!1;C.__webglInit===void 0&&(C.__webglInit=!0,b.addEventListener("dispose",E));let $=b.source,J=h.get($);J===void 0&&(J={},h.set($,J));let q=O(b);if(q!==C.__cacheKey){J[q]===void 0&&(J[q]={texture:t.createTexture(),usedTimes:0},o.memory.textures++,F=!0),J[q].usedTimes++;let Pe=J[C.__cacheKey];Pe!==void 0&&(J[C.__cacheKey].usedTimes--,Pe.usedTimes===0&&w(b)),C.__cacheKey=q,C.__webglTexture=J[q].texture}return F}function W(C,b,F){return Math.floor(Math.floor(C/F)/b)}function se(C,b,F,$){let q=C.updateRanges;if(q.length===0)n.texSubImage2D(t.TEXTURE_2D,0,0,0,b.width,b.height,F,$,b.data);else{q.sort((K,be)=>K.start-be.start);let Pe=0;for(let K=1;K<q.length;K++){let be=q[Pe],He=q[K],Oe=be.start+be.count,ue=W(He.start,b.width,4),Xe=W(be.start,b.width,4);He.start<=Oe+1&&ue===Xe&&W(He.start+He.count-1,b.width,4)===ue?be.count=Math.max(be.count,He.start+He.count-be.start):(++Pe,q[Pe]=He)}q.length=Pe+1;let fe=t.getParameter(t.UNPACK_ROW_LENGTH),Ae=t.getParameter(t.UNPACK_SKIP_PIXELS),Ie=t.getParameter(t.UNPACK_SKIP_ROWS);t.pixelStorei(t.UNPACK_ROW_LENGTH,b.width);for(let K=0,be=q.length;K<be;K++){let He=q[K],Oe=Math.floor(He.start/4),ue=Math.ceil(He.count/4),Xe=Oe%b.width,k=Math.floor(Oe/b.width),he=ue,Q=1;t.pixelStorei(t.UNPACK_SKIP_PIXELS,Xe),t.pixelStorei(t.UNPACK_SKIP_ROWS,k),n.texSubImage2D(t.TEXTURE_2D,0,Xe,k,he,Q,F,$,b.data)}C.clearUpdateRanges(),t.pixelStorei(t.UNPACK_ROW_LENGTH,fe),t.pixelStorei(t.UNPACK_SKIP_PIXELS,Ae),t.pixelStorei(t.UNPACK_SKIP_ROWS,Ie)}}function ye(C,b,F){let $=t.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&($=t.TEXTURE_2D_ARRAY),b.isData3DTexture&&($=t.TEXTURE_3D);let J=Ge(C,b),q=b.source;n.bindTexture($,C.__webglTexture,t.TEXTURE0+F);let Pe=i.get(q);if(q.version!==Pe.__version||J===!0){n.activeTexture(t.TEXTURE0+F);let fe=rt.getPrimaries(rt.workingColorSpace),Ae=b.colorSpace===Sr?null:rt.getPrimaries(b.colorSpace),Ie=b.colorSpace===Sr||fe===Ae?t.NONE:t.BROWSER_DEFAULT_WEBGL;t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,b.flipY),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),t.pixelStorei(t.UNPACK_ALIGNMENT,b.unpackAlignment),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ie);let K=y(b.image,!1,r.maxTextureSize);K=ke(b,K);let be=s.convert(b.format,b.colorSpace),He=s.convert(b.type),Oe=x(b.internalFormat,be,He,b.colorSpace,b.isVideoTexture);ge($,b);let ue,Xe=b.mipmaps,k=b.isVideoTexture!==!0,he=Pe.__version===void 0||J===!0,Q=q.dataReady,Me=T(b,K);if(b.isDepthTexture)Oe=_(b.format===va,b.type),he&&(k?n.texStorage2D(t.TEXTURE_2D,1,Oe,K.width,K.height):n.texImage2D(t.TEXTURE_2D,0,Oe,K.width,K.height,0,be,He,null));else if(b.isDataTexture)if(Xe.length>0){k&&he&&n.texStorage2D(t.TEXTURE_2D,Me,Oe,Xe[0].width,Xe[0].height);for(let ie=0,Y=Xe.length;ie<Y;ie++)ue=Xe[ie],k?Q&&n.texSubImage2D(t.TEXTURE_2D,ie,0,0,ue.width,ue.height,be,He,ue.data):n.texImage2D(t.TEXTURE_2D,ie,Oe,ue.width,ue.height,0,be,He,ue.data);b.generateMipmaps=!1}else k?(he&&n.texStorage2D(t.TEXTURE_2D,Me,Oe,K.width,K.height),Q&&se(b,K,be,He)):n.texImage2D(t.TEXTURE_2D,0,Oe,K.width,K.height,0,be,He,K.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){k&&he&&n.texStorage3D(t.TEXTURE_2D_ARRAY,Me,Oe,Xe[0].width,Xe[0].height,K.depth);for(let ie=0,Y=Xe.length;ie<Y;ie++)if(ue=Xe[ie],b.format!==ui)if(be!==null)if(k){if(Q)if(b.layerUpdates.size>0){let we=Ug(ue.width,ue.height,b.format,b.type);for(let qe of b.layerUpdates){let _t=ue.data.subarray(qe*we/ue.data.BYTES_PER_ELEMENT,(qe+1)*we/ue.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,ie,0,0,qe,ue.width,ue.height,1,be,_t)}b.clearLayerUpdates()}else n.compressedTexSubImage3D(t.TEXTURE_2D_ARRAY,ie,0,0,0,ue.width,ue.height,K.depth,be,ue.data)}else n.compressedTexImage3D(t.TEXTURE_2D_ARRAY,ie,Oe,ue.width,ue.height,K.depth,0,ue.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else k?Q&&n.texSubImage3D(t.TEXTURE_2D_ARRAY,ie,0,0,0,ue.width,ue.height,K.depth,be,He,ue.data):n.texImage3D(t.TEXTURE_2D_ARRAY,ie,Oe,ue.width,ue.height,K.depth,0,be,He,ue.data)}else{k&&he&&n.texStorage2D(t.TEXTURE_2D,Me,Oe,Xe[0].width,Xe[0].height);for(let ie=0,Y=Xe.length;ie<Y;ie++)ue=Xe[ie],b.format!==ui?be!==null?k?Q&&n.compressedTexSubImage2D(t.TEXTURE_2D,ie,0,0,ue.width,ue.height,be,ue.data):n.compressedTexImage2D(t.TEXTURE_2D,ie,Oe,ue.width,ue.height,0,ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):k?Q&&n.texSubImage2D(t.TEXTURE_2D,ie,0,0,ue.width,ue.height,be,He,ue.data):n.texImage2D(t.TEXTURE_2D,ie,Oe,ue.width,ue.height,0,be,He,ue.data)}else if(b.isDataArrayTexture)if(k){if(he&&n.texStorage3D(t.TEXTURE_2D_ARRAY,Me,Oe,K.width,K.height,K.depth),Q)if(b.layerUpdates.size>0){let ie=Ug(K.width,K.height,b.format,b.type);for(let Y of b.layerUpdates){let we=K.data.subarray(Y*ie/K.data.BYTES_PER_ELEMENT,(Y+1)*ie/K.data.BYTES_PER_ELEMENT);n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,Y,K.width,K.height,1,be,He,we)}b.clearLayerUpdates()}else n.texSubImage3D(t.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,be,He,K.data)}else n.texImage3D(t.TEXTURE_2D_ARRAY,0,Oe,K.width,K.height,K.depth,0,be,He,K.data);else if(b.isData3DTexture)k?(he&&n.texStorage3D(t.TEXTURE_3D,Me,Oe,K.width,K.height,K.depth),Q&&n.texSubImage3D(t.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,be,He,K.data)):n.texImage3D(t.TEXTURE_3D,0,Oe,K.width,K.height,K.depth,0,be,He,K.data);else if(b.isFramebufferTexture){if(he)if(k)n.texStorage2D(t.TEXTURE_2D,Me,Oe,K.width,K.height);else{let ie=K.width,Y=K.height;for(let we=0;we<Me;we++)n.texImage2D(t.TEXTURE_2D,we,Oe,ie,Y,0,be,He,null),ie>>=1,Y>>=1}}else if(Xe.length>0){if(k&&he){let ie=Fe(Xe[0]);n.texStorage2D(t.TEXTURE_2D,Me,Oe,ie.width,ie.height)}for(let ie=0,Y=Xe.length;ie<Y;ie++)ue=Xe[ie],k?Q&&n.texSubImage2D(t.TEXTURE_2D,ie,0,0,be,He,ue):n.texImage2D(t.TEXTURE_2D,ie,Oe,be,He,ue);b.generateMipmaps=!1}else if(k){if(he){let ie=Fe(K);n.texStorage2D(t.TEXTURE_2D,Me,Oe,ie.width,ie.height)}Q&&n.texSubImage2D(t.TEXTURE_2D,0,0,0,be,He,K)}else n.texImage2D(t.TEXTURE_2D,0,Oe,be,He,K);m(b)&&u($),Pe.__version=q.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function ae(C,b,F){if(b.image.length!==6)return;let $=Ge(C,b),J=b.source;n.bindTexture(t.TEXTURE_CUBE_MAP,C.__webglTexture,t.TEXTURE0+F);let q=i.get(J);if(J.version!==q.__version||$===!0){n.activeTexture(t.TEXTURE0+F);let Pe=rt.getPrimaries(rt.workingColorSpace),fe=b.colorSpace===Sr?null:rt.getPrimaries(b.colorSpace),Ae=b.colorSpace===Sr||Pe===fe?t.NONE:t.BROWSER_DEFAULT_WEBGL;t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,b.flipY),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),t.pixelStorei(t.UNPACK_ALIGNMENT,b.unpackAlignment),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);let Ie=b.isCompressedTexture||b.image[0].isCompressedTexture,K=b.image[0]&&b.image[0].isDataTexture,be=[];for(let Y=0;Y<6;Y++)!Ie&&!K?be[Y]=y(b.image[Y],!0,r.maxCubemapSize):be[Y]=K?b.image[Y].image:b.image[Y],be[Y]=ke(b,be[Y]);let He=be[0],Oe=s.convert(b.format,b.colorSpace),ue=s.convert(b.type),Xe=x(b.internalFormat,Oe,ue,b.colorSpace),k=b.isVideoTexture!==!0,he=q.__version===void 0||$===!0,Q=J.dataReady,Me=T(b,He);ge(t.TEXTURE_CUBE_MAP,b);let ie;if(Ie){k&&he&&n.texStorage2D(t.TEXTURE_CUBE_MAP,Me,Xe,He.width,He.height);for(let Y=0;Y<6;Y++){ie=be[Y].mipmaps;for(let we=0;we<ie.length;we++){let qe=ie[we];b.format!==ui?Oe!==null?k?Q&&n.compressedTexSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we,0,0,qe.width,qe.height,Oe,qe.data):n.compressedTexImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we,Xe,qe.width,qe.height,0,qe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):k?Q&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we,0,0,qe.width,qe.height,Oe,ue,qe.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we,Xe,qe.width,qe.height,0,Oe,ue,qe.data)}}}else{if(ie=b.mipmaps,k&&he){ie.length>0&&Me++;let Y=Fe(be[0]);n.texStorage2D(t.TEXTURE_CUBE_MAP,Me,Xe,Y.width,Y.height)}for(let Y=0;Y<6;Y++)if(K){k?Q&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,be[Y].width,be[Y].height,Oe,ue,be[Y].data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,Xe,be[Y].width,be[Y].height,0,Oe,ue,be[Y].data);for(let we=0;we<ie.length;we++){let _t=ie[we].image[Y].image;k?Q&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we+1,0,0,_t.width,_t.height,Oe,ue,_t.data):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we+1,Xe,_t.width,_t.height,0,Oe,ue,_t.data)}}else{k?Q&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,Oe,ue,be[Y]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,Xe,Oe,ue,be[Y]);for(let we=0;we<ie.length;we++){let qe=ie[we];k?Q&&n.texSubImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we+1,0,0,Oe,ue,qe.image[Y]):n.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X+Y,we+1,Xe,Oe,ue,qe.image[Y])}}}m(b)&&u(t.TEXTURE_CUBE_MAP),q.__version=J.version,b.onUpdate&&b.onUpdate(b)}C.__version=b.version}function Te(C,b,F,$,J,q){let Pe=s.convert(F.format,F.colorSpace),fe=s.convert(F.type),Ae=x(F.internalFormat,Pe,fe,F.colorSpace),Ie=i.get(b),K=i.get(F);if(K.__renderTarget=b,!Ie.__hasExternalTextures){let be=Math.max(1,b.width>>q),He=Math.max(1,b.height>>q);J===t.TEXTURE_3D||J===t.TEXTURE_2D_ARRAY?n.texImage3D(J,q,Ae,be,He,b.depth,0,Pe,fe,null):n.texImage2D(J,q,Ae,be,He,0,Pe,fe,null)}n.bindFramebuffer(t.FRAMEBUFFER,C),Re(b)?a.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,$,J,K.__webglTexture,0,ce(b)):(J===t.TEXTURE_2D||J>=t.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=t.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&t.framebufferTexture2D(t.FRAMEBUFFER,$,J,K.__webglTexture,q),n.bindFramebuffer(t.FRAMEBUFFER,null)}function Qe(C,b,F){if(t.bindRenderbuffer(t.RENDERBUFFER,C),b.depthBuffer){let $=b.depthTexture,J=$&&$.isDepthTexture?$.type:null,q=_(b.stencilBuffer,J),Pe=b.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,fe=ce(b);Re(b)?a.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,fe,q,b.width,b.height):F?t.renderbufferStorageMultisample(t.RENDERBUFFER,fe,q,b.width,b.height):t.renderbufferStorage(t.RENDERBUFFER,q,b.width,b.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,Pe,t.RENDERBUFFER,C)}else{let $=b.textures;for(let J=0;J<$.length;J++){let q=$[J],Pe=s.convert(q.format,q.colorSpace),fe=s.convert(q.type),Ae=x(q.internalFormat,Pe,fe,q.colorSpace),Ie=ce(b);F&&Re(b)===!1?t.renderbufferStorageMultisample(t.RENDERBUFFER,Ie,Ae,b.width,b.height):Re(b)?a.renderbufferStorageMultisampleEXT(t.RENDERBUFFER,Ie,Ae,b.width,b.height):t.renderbufferStorage(t.RENDERBUFFER,Ae,b.width,b.height)}}t.bindRenderbuffer(t.RENDERBUFFER,null)}function Ne(C,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(n.bindFramebuffer(t.FRAMEBUFFER,C),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let $=i.get(b.depthTexture);$.__renderTarget=b,(!$.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),X(b.depthTexture,0);let J=$.__webglTexture,q=ce(b);if(b.depthTexture.format===oa)Re(b)?a.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.TEXTURE_2D,J,0,q):t.framebufferTexture2D(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.TEXTURE_2D,J,0);else if(b.depthTexture.format===va)Re(b)?a.framebufferTexture2DMultisampleEXT(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.TEXTURE_2D,J,0,q):t.framebufferTexture2D(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function pt(C){let b=i.get(C),F=C.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==C.depthTexture){let $=C.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),$){let J=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,$.removeEventListener("dispose",J)};$.addEventListener("dispose",J),b.__depthDisposeCallback=J}b.__boundDepthTexture=$}if(C.depthTexture&&!b.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");let $=C.texture.mipmaps;$&&$.length>0?Ne(b.__webglFramebuffer[0],C):Ne(b.__webglFramebuffer,C)}else if(F){b.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(n.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer[$]),b.__webglDepthbuffer[$]===void 0)b.__webglDepthbuffer[$]=t.createRenderbuffer(),Qe(b.__webglDepthbuffer[$],C,!1);else{let J=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,q=b.__webglDepthbuffer[$];t.bindRenderbuffer(t.RENDERBUFFER,q),t.framebufferRenderbuffer(t.FRAMEBUFFER,J,t.RENDERBUFFER,q)}}else{let $=C.texture.mipmaps;if($&&$.length>0?n.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer[0]):n.bindFramebuffer(t.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=t.createRenderbuffer(),Qe(b.__webglDepthbuffer,C,!1);else{let J=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,q=b.__webglDepthbuffer;t.bindRenderbuffer(t.RENDERBUFFER,q),t.framebufferRenderbuffer(t.FRAMEBUFFER,J,t.RENDERBUFFER,q)}}n.bindFramebuffer(t.FRAMEBUFFER,null)}function yt(C,b,F){let $=i.get(C);b!==void 0&&Te($.__webglFramebuffer,C,C.texture,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,0),F!==void 0&&pt(C)}function nt(C){let b=C.texture,F=i.get(C),$=i.get(b);C.addEventListener("dispose",A);let J=C.textures,q=C.isWebGLCubeRenderTarget===!0,Pe=J.length>1;if(Pe||($.__webglTexture===void 0&&($.__webglTexture=t.createTexture()),$.__version=b.version,o.memory.textures++),q){F.__webglFramebuffer=[];for(let fe=0;fe<6;fe++)if(b.mipmaps&&b.mipmaps.length>0){F.__webglFramebuffer[fe]=[];for(let Ae=0;Ae<b.mipmaps.length;Ae++)F.__webglFramebuffer[fe][Ae]=t.createFramebuffer()}else F.__webglFramebuffer[fe]=t.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){F.__webglFramebuffer=[];for(let fe=0;fe<b.mipmaps.length;fe++)F.__webglFramebuffer[fe]=t.createFramebuffer()}else F.__webglFramebuffer=t.createFramebuffer();if(Pe)for(let fe=0,Ae=J.length;fe<Ae;fe++){let Ie=i.get(J[fe]);Ie.__webglTexture===void 0&&(Ie.__webglTexture=t.createTexture(),o.memory.textures++)}if(C.samples>0&&Re(C)===!1){F.__webglMultisampledFramebuffer=t.createFramebuffer(),F.__webglColorRenderbuffer=[],n.bindFramebuffer(t.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let fe=0;fe<J.length;fe++){let Ae=J[fe];F.__webglColorRenderbuffer[fe]=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,F.__webglColorRenderbuffer[fe]);let Ie=s.convert(Ae.format,Ae.colorSpace),K=s.convert(Ae.type),be=x(Ae.internalFormat,Ie,K,Ae.colorSpace,C.isXRRenderTarget===!0),He=ce(C);t.renderbufferStorageMultisample(t.RENDERBUFFER,He,be,C.width,C.height),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+fe,t.RENDERBUFFER,F.__webglColorRenderbuffer[fe])}t.bindRenderbuffer(t.RENDERBUFFER,null),C.depthBuffer&&(F.__webglDepthRenderbuffer=t.createRenderbuffer(),Qe(F.__webglDepthRenderbuffer,C,!0)),n.bindFramebuffer(t.FRAMEBUFFER,null)}}if(q){n.bindTexture(t.TEXTURE_CUBE_MAP,$.__webglTexture),ge(t.TEXTURE_CUBE_MAP,b);for(let fe=0;fe<6;fe++)if(b.mipmaps&&b.mipmaps.length>0)for(let Ae=0;Ae<b.mipmaps.length;Ae++)Te(F.__webglFramebuffer[fe][Ae],C,b,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+fe,Ae);else Te(F.__webglFramebuffer[fe],C,b,t.COLOR_ATTACHMENT0,t.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0);m(b)&&u(t.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(Pe){for(let fe=0,Ae=J.length;fe<Ae;fe++){let Ie=J[fe],K=i.get(Ie);n.bindTexture(t.TEXTURE_2D,K.__webglTexture),ge(t.TEXTURE_2D,Ie),Te(F.__webglFramebuffer,C,Ie,t.COLOR_ATTACHMENT0+fe,t.TEXTURE_2D,0),m(Ie)&&u(t.TEXTURE_2D)}n.unbindTexture()}else{let fe=t.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(fe=C.isWebGL3DRenderTarget?t.TEXTURE_3D:t.TEXTURE_2D_ARRAY),n.bindTexture(fe,$.__webglTexture),ge(fe,b),b.mipmaps&&b.mipmaps.length>0)for(let Ae=0;Ae<b.mipmaps.length;Ae++)Te(F.__webglFramebuffer[Ae],C,b,t.COLOR_ATTACHMENT0,fe,Ae);else Te(F.__webglFramebuffer,C,b,t.COLOR_ATTACHMENT0,fe,0);m(b)&&u(fe),n.unbindTexture()}C.depthBuffer&&pt(C)}function I(C){let b=C.textures;for(let F=0,$=b.length;F<$;F++){let J=b[F];if(m(J)){let q=g(C),Pe=i.get(J).__webglTexture;n.bindTexture(q,Pe),u(q),n.unbindTexture()}}}let me=[],ve=[];function Be(C){if(C.samples>0){if(Re(C)===!1){let b=C.textures,F=C.width,$=C.height,J=t.COLOR_BUFFER_BIT,q=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT,Pe=i.get(C),fe=b.length>1;if(fe)for(let Ie=0;Ie<b.length;Ie++)n.bindFramebuffer(t.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+Ie,t.RENDERBUFFER,null),n.bindFramebuffer(t.FRAMEBUFFER,Pe.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+Ie,t.TEXTURE_2D,null,0);n.bindFramebuffer(t.READ_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer);let Ae=C.texture.mipmaps;Ae&&Ae.length>0?n.bindFramebuffer(t.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer[0]):n.bindFramebuffer(t.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer);for(let Ie=0;Ie<b.length;Ie++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(J|=t.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(J|=t.STENCIL_BUFFER_BIT)),fe){t.framebufferRenderbuffer(t.READ_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,Pe.__webglColorRenderbuffer[Ie]);let K=i.get(b[Ie]).__webglTexture;t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,K,0)}t.blitFramebuffer(0,0,F,$,0,0,F,$,J,t.NEAREST),l===!0&&(me.length=0,ve.length=0,me.push(t.COLOR_ATTACHMENT0+Ie),C.depthBuffer&&C.resolveDepthBuffer===!1&&(me.push(q),ve.push(q),t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,ve)),t.invalidateFramebuffer(t.READ_FRAMEBUFFER,me))}if(n.bindFramebuffer(t.READ_FRAMEBUFFER,null),n.bindFramebuffer(t.DRAW_FRAMEBUFFER,null),fe)for(let Ie=0;Ie<b.length;Ie++){n.bindFramebuffer(t.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0+Ie,t.RENDERBUFFER,Pe.__webglColorRenderbuffer[Ie]);let K=i.get(b[Ie]).__webglTexture;n.bindFramebuffer(t.FRAMEBUFFER,Pe.__webglFramebuffer),t.framebufferTexture2D(t.DRAW_FRAMEBUFFER,t.COLOR_ATTACHMENT0+Ie,t.TEXTURE_2D,K,0)}n.bindFramebuffer(t.DRAW_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let b=C.stencilBuffer?t.DEPTH_STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT;t.invalidateFramebuffer(t.DRAW_FRAMEBUFFER,[b])}}}function ce(C){return Math.min(r.maxSamples,C.samples)}function Re(C){let b=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function xe(C){let b=o.render.frame;d.get(C)!==b&&(d.set(C,b),C.update())}function ke(C,b){let F=C.colorSpace,$=C.format,J=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||F!==qs&&F!==Sr&&(rt.getTransfer(F)===ft?($!==ui||J!==$i)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),b}function Fe(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=L,this.resetTextureUnits=z,this.setTexture2D=X,this.setTexture2DArray=H,this.setTexture3D=Z,this.setTextureCube=G,this.rebindTextures=yt,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=I,this.updateMultisampleRenderTarget=Be,this.setupDepthRenderbuffer=pt,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=Re}function _k(t,e){function n(i,r=Sr){let s,o=rt.getTransfer(r);if(i===$i)return t.UNSIGNED_BYTE;if(i===Ef)return t.UNSIGNED_SHORT_4_4_4_4;if(i===Tf)return t.UNSIGNED_SHORT_5_5_5_1;if(i===wg)return t.UNSIGNED_INT_5_9_9_9_REV;if(i===Sg)return t.BYTE;if(i===Mg)return t.SHORT;if(i===pa)return t.UNSIGNED_SHORT;if(i===wf)return t.INT;if(i===ps)return t.UNSIGNED_INT;if(i===Yi)return t.FLOAT;if(i===ma)return t.HALF_FLOAT;if(i===Eg)return t.ALPHA;if(i===Tg)return t.RGB;if(i===ui)return t.RGBA;if(i===oa)return t.DEPTH_COMPONENT;if(i===va)return t.DEPTH_STENCIL;if(i===Ag)return t.RED;if(i===Af)return t.RED_INTEGER;if(i===Cg)return t.RG;if(i===Cf)return t.RG_INTEGER;if(i===Rf)return t.RGBA_INTEGER;if(i===sc||i===oc||i===ac||i===lc)if(o===ft)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===sc)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===oc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ac)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===lc)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===sc)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===oc)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ac)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===lc)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Pf||i===If||i===kf||i===Lf)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Pf)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===If)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===kf)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Lf)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Nf||i===Df||i===Uf)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Nf||i===Df)return o===ft?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Uf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Ff||i===Of||i===zf||i===Bf||i===Hf||i===Vf||i===Gf||i===Wf||i===Xf||i===qf||i===$f||i===Yf||i===Zf||i===Jf)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Ff)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Of)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===zf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Bf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Hf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Vf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Gf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Wf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Xf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===qf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===$f)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Yf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Zf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Jf)return o===ft?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===cc||i===Kf||i===jf)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===cc)return o===ft?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Kf)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===jf)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Rg||i===Qf||i===eh||i===th)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===cc)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Qf)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===eh)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===th)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ga?t.UNSIGNED_INT_24_8:t[i]!==void 0?t[i]:null}return{convert:n}}var bk=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Sk=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Zg=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,n,i){if(this.texture===null){let r=new Dn,s=e.properties.get(r);s.__webglTexture=n.texture,(n.depthNear!==i.depthNear||n.depthFar!==i.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let n=e.cameras[0].viewport,i=new Ri({vertexShader:bk,fragmentShader:Sk,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new gn(new tc(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Jg=class extends gr{constructor(e,n){super();let i=this,r=null,s=1,o=null,a="local-floor",l=1,c=null,d=null,f=null,h=null,p=null,v=null,y=new Zg,m=n.getContextAttributes(),u=null,g=null,x=[],_=[],T=new ht,E=null,A=new pn;A.viewport=new Ft;let R=new pn;R.viewport=new Ft;let w=[A,R],S=new hf,P=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let se=x[W];return se===void 0&&(se=new ua,x[W]=se),se.getTargetRaySpace()},this.getControllerGrip=function(W){let se=x[W];return se===void 0&&(se=new ua,x[W]=se),se.getGripSpace()},this.getHand=function(W){let se=x[W];return se===void 0&&(se=new ua,x[W]=se),se.getHandSpace()};function L(W){let se=_.indexOf(W.inputSource);if(se===-1)return;let ye=x[se];ye!==void 0&&(ye.update(W.inputSource,W.frame,c||o),ye.dispatchEvent({type:W.type,data:W.inputSource}))}function O(){r.removeEventListener("select",L),r.removeEventListener("selectstart",L),r.removeEventListener("selectend",L),r.removeEventListener("squeeze",L),r.removeEventListener("squeezestart",L),r.removeEventListener("squeezeend",L),r.removeEventListener("end",O),r.removeEventListener("inputsourceschange",X);for(let W=0;W<x.length;W++){let se=_[W];se!==null&&(_[W]=null,x[W].disconnect(se))}P=null,z=null,y.reset(),e.setRenderTarget(u),p=null,h=null,f=null,r=null,g=null,Ge.stop(),i.isPresenting=!1,e.setPixelRatio(E),e.setSize(T.width,T.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){s=W,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return f},this.getFrame=function(){return v},this.getSession=function(){return r},this.setSession=async function(W){if(r=W,r!==null){if(u=e.getRenderTarget(),r.addEventListener("select",L),r.addEventListener("selectstart",L),r.addEventListener("selectend",L),r.addEventListener("squeeze",L),r.addEventListener("squeezestart",L),r.addEventListener("squeezeend",L),r.addEventListener("end",O),r.addEventListener("inputsourceschange",X),m.xrCompatible!==!0&&await n.makeXRCompatible(),E=e.getPixelRatio(),e.getSize(T),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let ye=null,ae=null,Te=null;m.depth&&(Te=m.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,ye=m.stencil?va:oa,ae=m.stencil?ga:ps);let Qe={colorFormat:n.RGBA8,depthFormat:Te,scaleFactor:s};f=new XRWebGLBinding(r,n),h=f.createProjectionLayer(Qe),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),g=new Vi(h.textureWidth,h.textureHeight,{format:ui,type:$i,depthTexture:new Ql(h.textureWidth,h.textureHeight,ae,void 0,void 0,void 0,void 0,void 0,void 0,ye),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{let ye={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,n,ye),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),g=new Vi(p.framebufferWidth,p.framebufferHeight,{format:ui,type:$i,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),Ge.setContext(r),Ge.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function X(W){for(let se=0;se<W.removed.length;se++){let ye=W.removed[se],ae=_.indexOf(ye);ae>=0&&(_[ae]=null,x[ae].disconnect(ye))}for(let se=0;se<W.added.length;se++){let ye=W.added[se],ae=_.indexOf(ye);if(ae===-1){for(let Qe=0;Qe<x.length;Qe++)if(Qe>=_.length){_.push(ye),ae=Qe;break}else if(_[Qe]===null){_[Qe]=ye,ae=Qe;break}if(ae===-1)break}let Te=x[ae];Te&&Te.connect(ye)}}let H=new U,Z=new U;function G(W,se,ye){H.setFromMatrixPosition(se.matrixWorld),Z.setFromMatrixPosition(ye.matrixWorld);let ae=H.distanceTo(Z),Te=se.projectionMatrix.elements,Qe=ye.projectionMatrix.elements,Ne=Te[14]/(Te[10]-1),pt=Te[14]/(Te[10]+1),yt=(Te[9]+1)/Te[5],nt=(Te[9]-1)/Te[5],I=(Te[8]-1)/Te[0],me=(Qe[8]+1)/Qe[0],ve=Ne*I,Be=Ne*me,ce=ae/(-I+me),Re=ce*-I;if(se.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(Re),W.translateZ(ce),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Te[10]===-1)W.projectionMatrix.copy(se.projectionMatrix),W.projectionMatrixInverse.copy(se.projectionMatrixInverse);else{let xe=Ne+ce,ke=pt+ce,Fe=ve-Re,C=Be+(ae-Re),b=yt*pt/ke*xe,F=nt*pt/ke*xe;W.projectionMatrix.makePerspective(Fe,C,b,F,xe,ke),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function oe(W,se){se===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(se.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(r===null)return;let se=W.near,ye=W.far;y.texture!==null&&(y.depthNear>0&&(se=y.depthNear),y.depthFar>0&&(ye=y.depthFar)),S.near=R.near=A.near=se,S.far=R.far=A.far=ye,(P!==S.near||z!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),P=S.near,z=S.far),A.layers.mask=W.layers.mask|2,R.layers.mask=W.layers.mask|4,S.layers.mask=A.layers.mask|R.layers.mask;let ae=W.parent,Te=S.cameras;oe(S,ae);for(let Qe=0;Qe<Te.length;Qe++)oe(Te[Qe],ae);Te.length===2?G(S,A,R):S.projectionMatrix.copy(A.projectionMatrix),le(W,S,ae)};function le(W,se,ye){ye===null?W.matrix.copy(se.matrixWorld):(W.matrix.copy(ye.matrixWorld),W.matrix.invert(),W.matrix.multiply(se.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(se.projectionMatrix),W.projectionMatrixInverse.copy(se.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Xd*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(W){l=W,h!==null&&(h.fixedFoveation=W),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=W)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(S)};let te=null;function ge(W,se){if(d=se.getViewerPose(c||o),v=se,d!==null){let ye=d.views;p!==null&&(e.setRenderTargetFramebuffer(g,p.framebuffer),e.setRenderTarget(g));let ae=!1;ye.length!==S.cameras.length&&(S.cameras.length=0,ae=!0);for(let Ne=0;Ne<ye.length;Ne++){let pt=ye[Ne],yt=null;if(p!==null)yt=p.getViewport(pt);else{let I=f.getViewSubImage(h,pt);yt=I.viewport,Ne===0&&(e.setRenderTargetTextures(g,I.colorTexture,I.depthStencilTexture),e.setRenderTarget(g))}let nt=w[Ne];nt===void 0&&(nt=new pn,nt.layers.enable(Ne),nt.viewport=new Ft,w[Ne]=nt),nt.matrix.fromArray(pt.transform.matrix),nt.matrix.decompose(nt.position,nt.quaternion,nt.scale),nt.projectionMatrix.fromArray(pt.projectionMatrix),nt.projectionMatrixInverse.copy(nt.projectionMatrix).invert(),nt.viewport.set(yt.x,yt.y,yt.width,yt.height),Ne===0&&(S.matrix.copy(nt.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),ae===!0&&S.cameras.push(nt)}let Te=r.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&f){let Ne=f.getDepthInformation(ye[0]);Ne&&Ne.isValid&&Ne.texture&&y.init(e,Ne,r.renderState)}}for(let ye=0;ye<x.length;ye++){let ae=_[ye],Te=x[ye];ae!==null&&Te!==void 0&&Te.update(ae,se,c||o)}te&&te(W,se),se.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:se}),v=null}let Ge=new wM;Ge.setAnimationLoop(ge),this.setAnimationLoop=function(W){te=W},this.dispose=function(){}}},eo=new Gi,Mk=new Ut;function wk(t,e){function n(m,u){m.matrixAutoUpdate===!0&&m.updateMatrix(),u.value.copy(m.matrix)}function i(m,u){u.color.getRGB(m.fogColor.value,Lg(t)),u.isFog?(m.fogNear.value=u.near,m.fogFar.value=u.far):u.isFogExp2&&(m.fogDensity.value=u.density)}function r(m,u,g,x,_){u.isMeshBasicMaterial||u.isMeshLambertMaterial?s(m,u):u.isMeshToonMaterial?(s(m,u),f(m,u)):u.isMeshPhongMaterial?(s(m,u),d(m,u)):u.isMeshStandardMaterial?(s(m,u),h(m,u),u.isMeshPhysicalMaterial&&p(m,u,_)):u.isMeshMatcapMaterial?(s(m,u),v(m,u)):u.isMeshDepthMaterial?s(m,u):u.isMeshDistanceMaterial?(s(m,u),y(m,u)):u.isMeshNormalMaterial?s(m,u):u.isLineBasicMaterial?(o(m,u),u.isLineDashedMaterial&&a(m,u)):u.isPointsMaterial?l(m,u,g,x):u.isSpriteMaterial?c(m,u):u.isShadowMaterial?(m.color.value.copy(u.color),m.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function s(m,u){m.opacity.value=u.opacity,u.color&&m.diffuse.value.copy(u.color),u.emissive&&m.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(m.map.value=u.map,n(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.bumpMap&&(m.bumpMap.value=u.bumpMap,n(u.bumpMap,m.bumpMapTransform),m.bumpScale.value=u.bumpScale,u.side===En&&(m.bumpScale.value*=-1)),u.normalMap&&(m.normalMap.value=u.normalMap,n(u.normalMap,m.normalMapTransform),m.normalScale.value.copy(u.normalScale),u.side===En&&m.normalScale.value.negate()),u.displacementMap&&(m.displacementMap.value=u.displacementMap,n(u.displacementMap,m.displacementMapTransform),m.displacementScale.value=u.displacementScale,m.displacementBias.value=u.displacementBias),u.emissiveMap&&(m.emissiveMap.value=u.emissiveMap,n(u.emissiveMap,m.emissiveMapTransform)),u.specularMap&&(m.specularMap.value=u.specularMap,n(u.specularMap,m.specularMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest);let g=e.get(u),x=g.envMap,_=g.envMapRotation;x&&(m.envMap.value=x,eo.copy(_),eo.x*=-1,eo.y*=-1,eo.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(eo.y*=-1,eo.z*=-1),m.envMapRotation.value.setFromMatrix4(Mk.makeRotationFromEuler(eo)),m.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=u.reflectivity,m.ior.value=u.ior,m.refractionRatio.value=u.refractionRatio),u.lightMap&&(m.lightMap.value=u.lightMap,m.lightMapIntensity.value=u.lightMapIntensity,n(u.lightMap,m.lightMapTransform)),u.aoMap&&(m.aoMap.value=u.aoMap,m.aoMapIntensity.value=u.aoMapIntensity,n(u.aoMap,m.aoMapTransform))}function o(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,u.map&&(m.map.value=u.map,n(u.map,m.mapTransform))}function a(m,u){m.dashSize.value=u.dashSize,m.totalSize.value=u.dashSize+u.gapSize,m.scale.value=u.scale}function l(m,u,g,x){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.size.value=u.size*g,m.scale.value=x*.5,u.map&&(m.map.value=u.map,n(u.map,m.uvTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function c(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.rotation.value=u.rotation,u.map&&(m.map.value=u.map,n(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,n(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function d(m,u){m.specular.value.copy(u.specular),m.shininess.value=Math.max(u.shininess,1e-4)}function f(m,u){u.gradientMap&&(m.gradientMap.value=u.gradientMap)}function h(m,u){m.metalness.value=u.metalness,u.metalnessMap&&(m.metalnessMap.value=u.metalnessMap,n(u.metalnessMap,m.metalnessMapTransform)),m.roughness.value=u.roughness,u.roughnessMap&&(m.roughnessMap.value=u.roughnessMap,n(u.roughnessMap,m.roughnessMapTransform)),u.envMap&&(m.envMapIntensity.value=u.envMapIntensity)}function p(m,u,g){m.ior.value=u.ior,u.sheen>0&&(m.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),m.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(m.sheenColorMap.value=u.sheenColorMap,n(u.sheenColorMap,m.sheenColorMapTransform)),u.sheenRoughnessMap&&(m.sheenRoughnessMap.value=u.sheenRoughnessMap,n(u.sheenRoughnessMap,m.sheenRoughnessMapTransform))),u.clearcoat>0&&(m.clearcoat.value=u.clearcoat,m.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(m.clearcoatMap.value=u.clearcoatMap,n(u.clearcoatMap,m.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,n(u.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(m.clearcoatNormalMap.value=u.clearcoatNormalMap,n(u.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===En&&m.clearcoatNormalScale.value.negate())),u.dispersion>0&&(m.dispersion.value=u.dispersion),u.iridescence>0&&(m.iridescence.value=u.iridescence,m.iridescenceIOR.value=u.iridescenceIOR,m.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(m.iridescenceMap.value=u.iridescenceMap,n(u.iridescenceMap,m.iridescenceMapTransform)),u.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=u.iridescenceThicknessMap,n(u.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),u.transmission>0&&(m.transmission.value=u.transmission,m.transmissionSamplerMap.value=g.texture,m.transmissionSamplerSize.value.set(g.width,g.height),u.transmissionMap&&(m.transmissionMap.value=u.transmissionMap,n(u.transmissionMap,m.transmissionMapTransform)),m.thickness.value=u.thickness,u.thicknessMap&&(m.thicknessMap.value=u.thicknessMap,n(u.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=u.attenuationDistance,m.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(m.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(m.anisotropyMap.value=u.anisotropyMap,n(u.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=u.specularIntensity,m.specularColor.value.copy(u.specularColor),u.specularColorMap&&(m.specularColorMap.value=u.specularColorMap,n(u.specularColorMap,m.specularColorMapTransform)),u.specularIntensityMap&&(m.specularIntensityMap.value=u.specularIntensityMap,n(u.specularIntensityMap,m.specularIntensityMapTransform))}function v(m,u){u.matcap&&(m.matcap.value=u.matcap)}function y(m,u){let g=e.get(u).light;m.referencePosition.value.setFromMatrixPosition(g.matrixWorld),m.nearDistance.value=g.shadow.camera.near,m.farDistance.value=g.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Ek(t,e,n,i){let r={},s={},o=[],a=t.getParameter(t.MAX_UNIFORM_BUFFER_BINDINGS);function l(g,x){let _=x.program;i.uniformBlockBinding(g,_)}function c(g,x){let _=r[g.id];_===void 0&&(v(g),_=d(g),r[g.id]=_,g.addEventListener("dispose",m));let T=x.program;i.updateUBOMapping(g,T);let E=e.render.frame;s[g.id]!==E&&(h(g),s[g.id]=E)}function d(g){let x=f();g.__bindingPointIndex=x;let _=t.createBuffer(),T=g.__size,E=g.usage;return t.bindBuffer(t.UNIFORM_BUFFER,_),t.bufferData(t.UNIFORM_BUFFER,T,E),t.bindBuffer(t.UNIFORM_BUFFER,null),t.bindBufferBase(t.UNIFORM_BUFFER,x,_),_}function f(){for(let g=0;g<a;g++)if(o.indexOf(g)===-1)return o.push(g),g;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(g){let x=r[g.id],_=g.uniforms,T=g.__cache;t.bindBuffer(t.UNIFORM_BUFFER,x);for(let E=0,A=_.length;E<A;E++){let R=Array.isArray(_[E])?_[E]:[_[E]];for(let w=0,S=R.length;w<S;w++){let P=R[w];if(p(P,E,w,T)===!0){let z=P.__offset,L=Array.isArray(P.value)?P.value:[P.value],O=0;for(let X=0;X<L.length;X++){let H=L[X],Z=y(H);typeof H=="number"||typeof H=="boolean"?(P.__data[0]=H,t.bufferSubData(t.UNIFORM_BUFFER,z+O,P.__data)):H.isMatrix3?(P.__data[0]=H.elements[0],P.__data[1]=H.elements[1],P.__data[2]=H.elements[2],P.__data[3]=0,P.__data[4]=H.elements[3],P.__data[5]=H.elements[4],P.__data[6]=H.elements[5],P.__data[7]=0,P.__data[8]=H.elements[6],P.__data[9]=H.elements[7],P.__data[10]=H.elements[8],P.__data[11]=0):(H.toArray(P.__data,O),O+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}t.bufferSubData(t.UNIFORM_BUFFER,z,P.__data)}}}t.bindBuffer(t.UNIFORM_BUFFER,null)}function p(g,x,_,T){let E=g.value,A=x+"_"+_;if(T[A]===void 0)return typeof E=="number"||typeof E=="boolean"?T[A]=E:T[A]=E.clone(),!0;{let R=T[A];if(typeof E=="number"||typeof E=="boolean"){if(R!==E)return T[A]=E,!0}else if(R.equals(E)===!1)return R.copy(E),!0}return!1}function v(g){let x=g.uniforms,_=0,T=16;for(let A=0,R=x.length;A<R;A++){let w=Array.isArray(x[A])?x[A]:[x[A]];for(let S=0,P=w.length;S<P;S++){let z=w[S],L=Array.isArray(z.value)?z.value:[z.value];for(let O=0,X=L.length;O<X;O++){let H=L[O],Z=y(H),G=_%T,oe=G%Z.boundary,le=G+oe;_+=oe,le!==0&&T-le<Z.storage&&(_+=T-le),z.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=_,_+=Z.storage}}}let E=_%T;return E>0&&(_+=T-E),g.__size=_,g.__cache={},this}function y(g){let x={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(x.boundary=4,x.storage=4):g.isVector2?(x.boundary=8,x.storage=8):g.isVector3||g.isColor?(x.boundary=16,x.storage=12):g.isVector4?(x.boundary=16,x.storage=16):g.isMatrix3?(x.boundary=48,x.storage=48):g.isMatrix4?(x.boundary=64,x.storage=64):g.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",g),x}function m(g){let x=g.target;x.removeEventListener("dispose",m);let _=o.indexOf(x.__bindingPointIndex);o.splice(_,1),t.deleteBuffer(r[x.id]),delete r[x.id],delete s[x.id]}function u(){for(let g in r)t.deleteBuffer(r[g]);o=[],r={},s={}}return{bind:l,update:c,dispose:u}}var oh=class{constructor(e={}){let{canvas:n=YS(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;let v=new Uint32Array(4),y=new Int32Array(4),m=null,u=null,g=[],x=[];this.domElement=n,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=br,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let _=this,T=!1;this._outputColorSpace=Yn;let E=0,A=0,R=null,w=-1,S=null,P=new Ft,z=new Ft,L=null,O=new je(0),X=0,H=n.width,Z=n.height,G=1,oe=null,le=null,te=new Ft(0,0,H,Z),ge=new Ft(0,0,H,Z),Ge=!1,W=new Jl,se=!1,ye=!1,ae=new Ut,Te=new Ut,Qe=new U,Ne=new Ft,pt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},yt=!1;function nt(){return R===null?G:1}let I=i;function me(M,N){return n.getContext(M,N)}try{let M={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${"177"}`),n.addEventListener("webglcontextlost",Me,!1),n.addEventListener("webglcontextrestored",ie,!1),n.addEventListener("webglcontextcreationerror",Y,!1),I===null){let N="webgl2";if(I=me(N,M),I===null)throw me(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let ve,Be,ce,Re,xe,ke,Fe,C,b,F,$,J,q,Pe,fe,Ae,Ie,K,be,He,Oe,ue,Xe,k;function he(){ve=new GP(I),ve.init(),ue=new _k(I,ve),Be=new UP(I,ve,e,ue),ce=new xk(I,ve),Be.reverseDepthBuffer&&h&&ce.buffers.depth.setReversed(!0),Re=new qP(I),xe=new sk,ke=new yk(I,ve,ce,xe,Be,ue,Re),Fe=new OP(_),C=new VP(_),b=new jA(I),Xe=new NP(I,b),F=new WP(I,b,Re,Xe),$=new YP(I,F,b,Re),be=new $P(I,Be,ke),Ae=new FP(xe),J=new rk(_,Fe,C,ve,Be,Xe,Ae),q=new wk(_,xe),Pe=new ak,fe=new hk(ve),K=new LP(_,Fe,C,ce,$,p,l),Ie=new gk(_,$,Be),k=new Ek(I,Re,Be,ce),He=new DP(I,ve,Re),Oe=new XP(I,ve,Re),Re.programs=J.programs,_.capabilities=Be,_.extensions=ve,_.properties=xe,_.renderLists=Pe,_.shadowMap=Ie,_.state=ce,_.info=Re}he();let Q=new Jg(_,I);this.xr=Q,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let M=ve.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=ve.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(M){M!==void 0&&(G=M,this.setSize(H,Z,!1))},this.getSize=function(M){return M.set(H,Z)},this.setSize=function(M,N,B=!0){if(Q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}H=M,Z=N,n.width=Math.floor(M*G),n.height=Math.floor(N*G),B===!0&&(n.style.width=M+"px",n.style.height=N+"px"),this.setViewport(0,0,M,N)},this.getDrawingBufferSize=function(M){return M.set(H*G,Z*G).floor()},this.setDrawingBufferSize=function(M,N,B){H=M,Z=N,G=B,n.width=Math.floor(M*B),n.height=Math.floor(N*B),this.setViewport(0,0,M,N)},this.getCurrentViewport=function(M){return M.copy(P)},this.getViewport=function(M){return M.copy(te)},this.setViewport=function(M,N,B,V){M.isVector4?te.set(M.x,M.y,M.z,M.w):te.set(M,N,B,V),ce.viewport(P.copy(te).multiplyScalar(G).round())},this.getScissor=function(M){return M.copy(ge)},this.setScissor=function(M,N,B,V){M.isVector4?ge.set(M.x,M.y,M.z,M.w):ge.set(M,N,B,V),ce.scissor(z.copy(ge).multiplyScalar(G).round())},this.getScissorTest=function(){return Ge},this.setScissorTest=function(M){ce.setScissorTest(Ge=M)},this.setOpaqueSort=function(M){oe=M},this.setTransparentSort=function(M){le=M},this.getClearColor=function(M){return M.copy(K.getClearColor())},this.setClearColor=function(){K.setClearColor(...arguments)},this.getClearAlpha=function(){return K.getClearAlpha()},this.setClearAlpha=function(){K.setClearAlpha(...arguments)},this.clear=function(M=!0,N=!0,B=!0){let V=0;if(M){let D=!1;if(R!==null){let re=R.texture.format;D=re===Rf||re===Cf||re===Af}if(D){let re=R.texture.type,pe=re===$i||re===ps||re===pa||re===ga||re===Ef||re===Tf,Ee=K.getClearColor(),Se=K.getClearAlpha(),Ve=Ee.r,We=Ee.g,Le=Ee.b;pe?(v[0]=Ve,v[1]=We,v[2]=Le,v[3]=Se,I.clearBufferuiv(I.COLOR,0,v)):(y[0]=Ve,y[1]=We,y[2]=Le,y[3]=Se,I.clearBufferiv(I.COLOR,0,y))}else V|=I.COLOR_BUFFER_BIT}N&&(V|=I.DEPTH_BUFFER_BIT),B&&(V|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){n.removeEventListener("webglcontextlost",Me,!1),n.removeEventListener("webglcontextrestored",ie,!1),n.removeEventListener("webglcontextcreationerror",Y,!1),K.dispose(),Pe.dispose(),fe.dispose(),xe.dispose(),Fe.dispose(),C.dispose(),$.dispose(),Xe.dispose(),k.dispose(),J.dispose(),Q.dispose(),Q.removeEventListener("sessionstart",rv),Q.removeEventListener("sessionend",sv),vs.stop()};function Me(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function ie(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;let M=Re.autoReset,N=Ie.enabled,B=Ie.autoUpdate,V=Ie.needsUpdate,D=Ie.type;he(),Re.autoReset=M,Ie.enabled=N,Ie.autoUpdate=B,Ie.needsUpdate=V,Ie.type=D}function Y(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function we(M){let N=M.target;N.removeEventListener("dispose",we),qe(N)}function qe(M){_t(M),xe.remove(M)}function _t(M){let N=xe.get(M).programs;N!==void 0&&(N.forEach(function(B){J.releaseProgram(B)}),M.isShaderMaterial&&J.releaseShaderCache(M))}this.renderBufferDirect=function(M,N,B,V,D,re){N===null&&(N=pt);let pe=D.isMesh&&D.matrixWorld.determinant()<0,Ee=VM(M,N,B,V,D);ce.setMaterial(V,pe);let Se=B.index,Ve=1;if(V.wireframe===!0){if(Se=F.getWireframeAttribute(B),Se===void 0)return;Ve=2}let We=B.drawRange,Le=B.attributes.position,et=We.start*Ve,ut=(We.start+We.count)*Ve;re!==null&&(et=Math.max(et,re.start*Ve),ut=Math.min(ut,(re.start+re.count)*Ve)),Se!==null?(et=Math.max(et,0),ut=Math.min(ut,Se.count)):Le!=null&&(et=Math.max(et,0),ut=Math.min(ut,Le.count));let Rt=ut-et;if(Rt<0||Rt===1/0)return;Xe.setup(D,V,Ee,B,Se);let Nt,st=He;if(Se!==null&&(Nt=b.get(Se),st=Oe,st.setIndex(Nt)),D.isMesh)V.wireframe===!0?(ce.setLineWidth(V.wireframeLinewidth*nt()),st.setMode(I.LINES)):st.setMode(I.TRIANGLES);else if(D.isLine){let De=V.linewidth;De===void 0&&(De=1),ce.setLineWidth(De*nt()),D.isLineSegments?st.setMode(I.LINES):D.isLineLoop?st.setMode(I.LINE_LOOP):st.setMode(I.LINE_STRIP)}else D.isPoints?st.setMode(I.POINTS):D.isSprite&&st.setMode(I.TRIANGLES);if(D.isBatchedMesh)if(D._multiDrawInstances!==null)$s("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount,D._multiDrawInstances);else if(ve.get("WEBGL_multi_draw"))st.renderMultiDraw(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount);else{let De=D._multiDrawStarts,tn=D._multiDrawCounts,lt=D._multiDrawCount,hi=Se?b.get(Se).bytesPerElement:1,io=xe.get(V).currentProgram.getUniforms();for(let Fn=0;Fn<lt;Fn++)io.setValue(I,"_gl_DrawID",Fn),st.render(De[Fn]/hi,tn[Fn])}else if(D.isInstancedMesh)st.renderInstances(et,Rt,D.count);else if(B.isInstancedBufferGeometry){let De=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,tn=Math.min(B.instanceCount,De);st.renderInstances(et,Rt,tn)}else st.render(et,Rt)};function ct(M,N,B){M.transparent===!0&&M.side===Xi&&M.forceSinglePass===!1?(M.side=En,M.needsUpdate=!0,pc(M,N,B),M.side=mr,M.needsUpdate=!0,pc(M,N,B),M.side=Xi):pc(M,N,B)}this.compile=function(M,N,B=null){B===null&&(B=M),u=fe.get(B),u.init(N),x.push(u),B.traverseVisible(function(D){D.isLight&&D.layers.test(N.layers)&&(u.pushLight(D),D.castShadow&&u.pushShadow(D))}),M!==B&&M.traverseVisible(function(D){D.isLight&&D.layers.test(N.layers)&&(u.pushLight(D),D.castShadow&&u.pushShadow(D))}),u.setupLights();let V=new Set;return M.traverse(function(D){if(!(D.isMesh||D.isPoints||D.isLine||D.isSprite))return;let re=D.material;if(re)if(Array.isArray(re))for(let pe=0;pe<re.length;pe++){let Ee=re[pe];ct(Ee,B,D),V.add(Ee)}else ct(re,B,D),V.add(re)}),u=x.pop(),V},this.compileAsync=function(M,N,B=null){let V=this.compile(M,N,B);return new Promise(D=>{function re(){if(V.forEach(function(pe){xe.get(pe).currentProgram.isReady()&&V.delete(pe)}),V.size===0){D(M);return}setTimeout(re,10)}ve.get("KHR_parallel_shader_compile")!==null?re():setTimeout(re,10)})};let fi=null;function Ji(M){fi&&fi(M)}function rv(){vs.stop()}function sv(){vs.start()}let vs=new wM;vs.setAnimationLoop(Ji),typeof self<"u"&&vs.setContext(self),this.setAnimationLoop=function(M){fi=M,Q.setAnimationLoop(M),M===null?vs.stop():vs.start()},Q.addEventListener("sessionstart",rv),Q.addEventListener("sessionend",sv),this.render=function(M,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),Q.enabled===!0&&Q.isPresenting===!0&&(Q.cameraAutoUpdate===!0&&Q.updateCamera(N),N=Q.getCamera()),M.isScene===!0&&M.onBeforeRender(_,M,N,R),u=fe.get(M,x.length),u.init(N),x.push(u),Te.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),W.setFromProjectionMatrix(Te),ye=this.localClippingEnabled,se=Ae.init(this.clippingPlanes,ye),m=Pe.get(M,g.length),m.init(),g.push(m),Q.enabled===!0&&Q.isPresenting===!0){let re=_.xr.getDepthSensingMesh();re!==null&&ch(re,N,-1/0,_.sortObjects)}ch(M,N,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(oe,le),yt=Q.enabled===!1||Q.isPresenting===!1||Q.hasDepthSensing()===!1,yt&&K.addToRenderList(m,M),this.info.render.frame++,se===!0&&Ae.beginShadows();let B=u.state.shadowsArray;Ie.render(B,M,N),se===!0&&Ae.endShadows(),this.info.autoReset===!0&&this.info.reset();let V=m.opaque,D=m.transmissive;if(u.setupLights(),N.isArrayCamera){let re=N.cameras;if(D.length>0)for(let pe=0,Ee=re.length;pe<Ee;pe++){let Se=re[pe];av(V,D,M,Se)}yt&&K.render(M);for(let pe=0,Ee=re.length;pe<Ee;pe++){let Se=re[pe];ov(m,M,Se,Se.viewport)}}else D.length>0&&av(V,D,M,N),yt&&K.render(M),ov(m,M,N);R!==null&&A===0&&(ke.updateMultisampleRenderTarget(R),ke.updateRenderTargetMipmap(R)),M.isScene===!0&&M.onAfterRender(_,M,N),Xe.resetDefaultState(),w=-1,S=null,x.pop(),x.length>0?(u=x[x.length-1],se===!0&&Ae.setGlobalState(_.clippingPlanes,u.state.camera)):u=null,g.pop(),g.length>0?m=g[g.length-1]:m=null};function ch(M,N,B,V){if(M.visible===!1)return;if(M.layers.test(N.layers)){if(M.isGroup)B=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(N);else if(M.isLight)u.pushLight(M),M.castShadow&&u.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||W.intersectsSprite(M)){V&&Ne.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Te);let pe=$.update(M),Ee=M.material;Ee.visible&&m.push(M,pe,Ee,B,Ne.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||W.intersectsObject(M))){let pe=$.update(M),Ee=M.material;if(V&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ne.copy(M.boundingSphere.center)):(pe.boundingSphere===null&&pe.computeBoundingSphere(),Ne.copy(pe.boundingSphere.center)),Ne.applyMatrix4(M.matrixWorld).applyMatrix4(Te)),Array.isArray(Ee)){let Se=pe.groups;for(let Ve=0,We=Se.length;Ve<We;Ve++){let Le=Se[Ve],et=Ee[Le.materialIndex];et&&et.visible&&m.push(M,pe,et,B,Ne.z,Le)}}else Ee.visible&&m.push(M,pe,Ee,B,Ne.z,null)}}let re=M.children;for(let pe=0,Ee=re.length;pe<Ee;pe++)ch(re[pe],N,B,V)}function ov(M,N,B,V){let D=M.opaque,re=M.transmissive,pe=M.transparent;u.setupLightsView(B),se===!0&&Ae.setGlobalState(_.clippingPlanes,B),V&&ce.viewport(P.copy(V)),D.length>0&&hc(D,N,B),re.length>0&&hc(re,N,B),pe.length>0&&hc(pe,N,B),ce.buffers.depth.setTest(!0),ce.buffers.depth.setMask(!0),ce.buffers.color.setMask(!0),ce.setPolygonOffset(!1)}function av(M,N,B,V){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[V.id]===void 0&&(u.state.transmissionRenderTarget[V.id]=new Vi(1,1,{generateMipmaps:!0,type:ve.has("EXT_color_buffer_half_float")||ve.has("EXT_color_buffer_float")?ma:$i,minFilter:hs,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:rt.workingColorSpace}));let re=u.state.transmissionRenderTarget[V.id],pe=V.viewport||P;re.setSize(pe.z*_.transmissionResolutionScale,pe.w*_.transmissionResolutionScale);let Ee=_.getRenderTarget();_.setRenderTarget(re),_.getClearColor(O),X=_.getClearAlpha(),X<1&&_.setClearColor(16777215,.5),_.clear(),yt&&K.render(B);let Se=_.toneMapping;_.toneMapping=br;let Ve=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),u.setupLightsView(V),se===!0&&Ae.setGlobalState(_.clippingPlanes,V),hc(M,B,V),ke.updateMultisampleRenderTarget(re),ke.updateRenderTargetMipmap(re),ve.has("WEBGL_multisampled_render_to_texture")===!1){let We=!1;for(let Le=0,et=N.length;Le<et;Le++){let ut=N[Le],Rt=ut.object,Nt=ut.geometry,st=ut.material,De=ut.group;if(st.side===Xi&&Rt.layers.test(V.layers)){let tn=st.side;st.side=En,st.needsUpdate=!0,lv(Rt,B,V,Nt,st,De),st.side=tn,st.needsUpdate=!0,We=!0}}We===!0&&(ke.updateMultisampleRenderTarget(re),ke.updateRenderTargetMipmap(re))}_.setRenderTarget(Ee),_.setClearColor(O,X),Ve!==void 0&&(V.viewport=Ve),_.toneMapping=Se}function hc(M,N,B){let V=N.isScene===!0?N.overrideMaterial:null;for(let D=0,re=M.length;D<re;D++){let pe=M[D],Ee=pe.object,Se=pe.geometry,Ve=pe.group,We=pe.material;We.allowOverride===!0&&V!==null&&(We=V),Ee.layers.test(B.layers)&&lv(Ee,N,B,Se,We,Ve)}}function lv(M,N,B,V,D,re){M.onBeforeRender(_,N,B,V,D,re),M.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),D.onBeforeRender(_,N,B,V,M,re),D.transparent===!0&&D.side===Xi&&D.forceSinglePass===!1?(D.side=En,D.needsUpdate=!0,_.renderBufferDirect(B,N,V,D,M,re),D.side=mr,D.needsUpdate=!0,_.renderBufferDirect(B,N,V,D,M,re),D.side=Xi):_.renderBufferDirect(B,N,V,D,M,re),M.onAfterRender(_,N,B,V,D,re)}function pc(M,N,B){N.isScene!==!0&&(N=pt);let V=xe.get(M),D=u.state.lights,re=u.state.shadowsArray,pe=D.state.version,Ee=J.getParameters(M,D.state,re,N,B),Se=J.getProgramCacheKey(Ee),Ve=V.programs;V.environment=M.isMeshStandardMaterial?N.environment:null,V.fog=N.fog,V.envMap=(M.isMeshStandardMaterial?C:Fe).get(M.envMap||V.environment),V.envMapRotation=V.environment!==null&&M.envMap===null?N.environmentRotation:M.envMapRotation,Ve===void 0&&(M.addEventListener("dispose",we),Ve=new Map,V.programs=Ve);let We=Ve.get(Se);if(We!==void 0){if(V.currentProgram===We&&V.lightsStateVersion===pe)return uv(M,Ee),We}else Ee.uniforms=J.getUniforms(M),M.onBeforeCompile(Ee,_),We=J.acquireProgram(Ee,Se),Ve.set(Se,We),V.uniforms=Ee.uniforms;let Le=V.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Le.clippingPlanes=Ae.uniform),uv(M,Ee),V.needsLights=WM(M),V.lightsStateVersion=pe,V.needsLights&&(Le.ambientLightColor.value=D.state.ambient,Le.lightProbe.value=D.state.probe,Le.directionalLights.value=D.state.directional,Le.directionalLightShadows.value=D.state.directionalShadow,Le.spotLights.value=D.state.spot,Le.spotLightShadows.value=D.state.spotShadow,Le.rectAreaLights.value=D.state.rectArea,Le.ltc_1.value=D.state.rectAreaLTC1,Le.ltc_2.value=D.state.rectAreaLTC2,Le.pointLights.value=D.state.point,Le.pointLightShadows.value=D.state.pointShadow,Le.hemisphereLights.value=D.state.hemi,Le.directionalShadowMap.value=D.state.directionalShadowMap,Le.directionalShadowMatrix.value=D.state.directionalShadowMatrix,Le.spotShadowMap.value=D.state.spotShadowMap,Le.spotLightMatrix.value=D.state.spotLightMatrix,Le.spotLightMap.value=D.state.spotLightMap,Le.pointShadowMap.value=D.state.pointShadowMap,Le.pointShadowMatrix.value=D.state.pointShadowMatrix),V.currentProgram=We,V.uniformsList=null,We}function cv(M){if(M.uniformsList===null){let N=M.currentProgram.getUniforms();M.uniformsList=_a.seqWithValue(N.seq,M.uniforms)}return M.uniformsList}function uv(M,N){let B=xe.get(M);B.outputColorSpace=N.outputColorSpace,B.batching=N.batching,B.batchingColor=N.batchingColor,B.instancing=N.instancing,B.instancingColor=N.instancingColor,B.instancingMorph=N.instancingMorph,B.skinning=N.skinning,B.morphTargets=N.morphTargets,B.morphNormals=N.morphNormals,B.morphColors=N.morphColors,B.morphTargetsCount=N.morphTargetsCount,B.numClippingPlanes=N.numClippingPlanes,B.numIntersection=N.numClipIntersection,B.vertexAlphas=N.vertexAlphas,B.vertexTangents=N.vertexTangents,B.toneMapping=N.toneMapping}function VM(M,N,B,V,D){N.isScene!==!0&&(N=pt),ke.resetTextureUnits();let re=N.fog,pe=V.isMeshStandardMaterial?N.environment:null,Ee=R===null?_.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:qs,Se=(V.isMeshStandardMaterial?C:Fe).get(V.envMap||pe),Ve=V.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,We=!!B.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Le=!!B.morphAttributes.position,et=!!B.morphAttributes.normal,ut=!!B.morphAttributes.color,Rt=br;V.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(Rt=_.toneMapping);let Nt=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,st=Nt!==void 0?Nt.length:0,De=xe.get(V),tn=u.state.lights;if(se===!0&&(ye===!0||M!==S)){let yn=M===S&&V.id===w;Ae.setState(V,M,yn)}let lt=!1;V.version===De.__version?(De.needsLights&&De.lightsStateVersion!==tn.state.version||De.outputColorSpace!==Ee||D.isBatchedMesh&&De.batching===!1||!D.isBatchedMesh&&De.batching===!0||D.isBatchedMesh&&De.batchingColor===!0&&D.colorTexture===null||D.isBatchedMesh&&De.batchingColor===!1&&D.colorTexture!==null||D.isInstancedMesh&&De.instancing===!1||!D.isInstancedMesh&&De.instancing===!0||D.isSkinnedMesh&&De.skinning===!1||!D.isSkinnedMesh&&De.skinning===!0||D.isInstancedMesh&&De.instancingColor===!0&&D.instanceColor===null||D.isInstancedMesh&&De.instancingColor===!1&&D.instanceColor!==null||D.isInstancedMesh&&De.instancingMorph===!0&&D.morphTexture===null||D.isInstancedMesh&&De.instancingMorph===!1&&D.morphTexture!==null||De.envMap!==Se||V.fog===!0&&De.fog!==re||De.numClippingPlanes!==void 0&&(De.numClippingPlanes!==Ae.numPlanes||De.numIntersection!==Ae.numIntersection)||De.vertexAlphas!==Ve||De.vertexTangents!==We||De.morphTargets!==Le||De.morphNormals!==et||De.morphColors!==ut||De.toneMapping!==Rt||De.morphTargetsCount!==st)&&(lt=!0):(lt=!0,De.__version=V.version);let hi=De.currentProgram;lt===!0&&(hi=pc(V,N,D));let io=!1,Fn=!1,Ma=!1,Et=hi.getUniforms(),Jn=De.uniforms;if(ce.useProgram(hi.program)&&(io=!0,Fn=!0,Ma=!0),V.id!==w&&(w=V.id,Fn=!0),io||S!==M){ce.buffers.depth.getReversed()?(ae.copy(M.projectionMatrix),JS(ae),KS(ae),Et.setValue(I,"projectionMatrix",ae)):Et.setValue(I,"projectionMatrix",M.projectionMatrix),Et.setValue(I,"viewMatrix",M.matrixWorldInverse);let Tn=Et.map.cameraPosition;Tn!==void 0&&Tn.setValue(I,Qe.setFromMatrixPosition(M.matrixWorld)),Be.logarithmicDepthBuffer&&Et.setValue(I,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Et.setValue(I,"isOrthographic",M.isOrthographicCamera===!0),S!==M&&(S=M,Fn=!0,Ma=!0)}if(D.isSkinnedMesh){Et.setOptional(I,D,"bindMatrix"),Et.setOptional(I,D,"bindMatrixInverse");let yn=D.skeleton;yn&&(yn.boneTexture===null&&yn.computeBoneTexture(),Et.setValue(I,"boneTexture",yn.boneTexture,ke))}D.isBatchedMesh&&(Et.setOptional(I,D,"batchingTexture"),Et.setValue(I,"batchingTexture",D._matricesTexture,ke),Et.setOptional(I,D,"batchingIdTexture"),Et.setValue(I,"batchingIdTexture",D._indirectTexture,ke),Et.setOptional(I,D,"batchingColorTexture"),D._colorsTexture!==null&&Et.setValue(I,"batchingColorTexture",D._colorsTexture,ke));let Kn=B.morphAttributes;if((Kn.position!==void 0||Kn.normal!==void 0||Kn.color!==void 0)&&be.update(D,B,hi),(Fn||De.receiveShadow!==D.receiveShadow)&&(De.receiveShadow=D.receiveShadow,Et.setValue(I,"receiveShadow",D.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(Jn.envMap.value=Se,Jn.flipEnvMap.value=Se.isCubeTexture&&Se.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&N.environment!==null&&(Jn.envMapIntensity.value=N.environmentIntensity),Fn&&(Et.setValue(I,"toneMappingExposure",_.toneMappingExposure),De.needsLights&&GM(Jn,Ma),re&&V.fog===!0&&q.refreshFogUniforms(Jn,re),q.refreshMaterialUniforms(Jn,V,G,Z,u.state.transmissionRenderTarget[M.id]),_a.upload(I,cv(De),Jn,ke)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(_a.upload(I,cv(De),Jn,ke),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Et.setValue(I,"center",D.center),Et.setValue(I,"modelViewMatrix",D.modelViewMatrix),Et.setValue(I,"normalMatrix",D.normalMatrix),Et.setValue(I,"modelMatrix",D.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){let yn=V.uniformsGroups;for(let Tn=0,uh=yn.length;Tn<uh;Tn++){let xs=yn[Tn];k.update(xs,hi),k.bind(xs,hi)}}return hi}function GM(M,N){M.ambientLightColor.needsUpdate=N,M.lightProbe.needsUpdate=N,M.directionalLights.needsUpdate=N,M.directionalLightShadows.needsUpdate=N,M.pointLights.needsUpdate=N,M.pointLightShadows.needsUpdate=N,M.spotLights.needsUpdate=N,M.spotLightShadows.needsUpdate=N,M.rectAreaLights.needsUpdate=N,M.hemisphereLights.needsUpdate=N}function WM(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(M,N,B){let V=xe.get(M);V.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),xe.get(M.texture).__webglTexture=N,xe.get(M.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:B,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,N){let B=xe.get(M);B.__webglFramebuffer=N,B.__useDefaultFramebuffer=N===void 0};let XM=I.createFramebuffer();this.setRenderTarget=function(M,N=0,B=0){R=M,E=N,A=B;let V=!0,D=null,re=!1,pe=!1;if(M){let Se=xe.get(M);if(Se.__useDefaultFramebuffer!==void 0)ce.bindFramebuffer(I.FRAMEBUFFER,null),V=!1;else if(Se.__webglFramebuffer===void 0)ke.setupRenderTarget(M);else if(Se.__hasExternalTextures)ke.rebindTextures(M,xe.get(M.texture).__webglTexture,xe.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Le=M.depthTexture;if(Se.__boundDepthTexture!==Le){if(Le!==null&&xe.has(Le)&&(M.width!==Le.image.width||M.height!==Le.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");ke.setupDepthRenderbuffer(M)}}let Ve=M.texture;(Ve.isData3DTexture||Ve.isDataArrayTexture||Ve.isCompressedArrayTexture)&&(pe=!0);let We=xe.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(We[N])?D=We[N][B]:D=We[N],re=!0):M.samples>0&&ke.useMultisampledRTT(M)===!1?D=xe.get(M).__webglMultisampledFramebuffer:Array.isArray(We)?D=We[B]:D=We,P.copy(M.viewport),z.copy(M.scissor),L=M.scissorTest}else P.copy(te).multiplyScalar(G).floor(),z.copy(ge).multiplyScalar(G).floor(),L=Ge;if(B!==0&&(D=XM),ce.bindFramebuffer(I.FRAMEBUFFER,D)&&V&&ce.drawBuffers(M,D),ce.viewport(P),ce.scissor(z),ce.setScissorTest(L),re){let Se=xe.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+N,Se.__webglTexture,B)}else if(pe){let Se=xe.get(M.texture),Ve=N;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Se.__webglTexture,B,Ve)}else if(M!==null&&B!==0){let Se=xe.get(M.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Se.__webglTexture,B)}w=-1},this.readRenderTargetPixels=function(M,N,B,V,D,re,pe,Ee=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=xe.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&pe!==void 0&&(Se=Se[pe]),Se){ce.bindFramebuffer(I.FRAMEBUFFER,Se);try{let Ve=M.textures[Ee],We=Ve.format,Le=Ve.type;if(!Be.textureFormatReadable(We)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Be.textureTypeReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=M.width-V&&B>=0&&B<=M.height-D&&(M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Ee),I.readPixels(N,B,V,D,ue.convert(We),ue.convert(Le),re))}finally{let Ve=R!==null?xe.get(R).__webglFramebuffer:null;ce.bindFramebuffer(I.FRAMEBUFFER,Ve)}}},this.readRenderTargetPixelsAsync=async function(M,N,B,V,D,re,pe,Ee=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=xe.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&pe!==void 0&&(Se=Se[pe]),Se)if(N>=0&&N<=M.width-V&&B>=0&&B<=M.height-D){ce.bindFramebuffer(I.FRAMEBUFFER,Se);let Ve=M.textures[Ee],We=Ve.format,Le=Ve.type;if(!Be.textureFormatReadable(We))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Be.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let et=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,et),I.bufferData(I.PIXEL_PACK_BUFFER,re.byteLength,I.STREAM_READ),M.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+Ee),I.readPixels(N,B,V,D,ue.convert(We),ue.convert(Le),0);let ut=R!==null?xe.get(R).__webglFramebuffer:null;ce.bindFramebuffer(I.FRAMEBUFFER,ut);let Rt=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await ZS(I,Rt,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,et),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,re),I.deleteBuffer(et),I.deleteSync(Rt),re}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,N=null,B=0){let V=Math.pow(2,-B),D=Math.floor(M.image.width*V),re=Math.floor(M.image.height*V),pe=N!==null?N.x:0,Ee=N!==null?N.y:0;ke.setTexture2D(M,0),I.copyTexSubImage2D(I.TEXTURE_2D,B,0,0,pe,Ee,D,re),ce.unbindTexture()};let qM=I.createFramebuffer(),$M=I.createFramebuffer();this.copyTextureToTexture=function(M,N,B=null,V=null,D=0,re=null){re===null&&(D!==0?($s("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),re=D,D=0):re=0);let pe,Ee,Se,Ve,We,Le,et,ut,Rt,Nt=M.isCompressedTexture?M.mipmaps[re]:M.image;if(B!==null)pe=B.max.x-B.min.x,Ee=B.max.y-B.min.y,Se=B.isBox3?B.max.z-B.min.z:1,Ve=B.min.x,We=B.min.y,Le=B.isBox3?B.min.z:0;else{let Kn=Math.pow(2,-D);pe=Math.floor(Nt.width*Kn),Ee=Math.floor(Nt.height*Kn),M.isDataArrayTexture?Se=Nt.depth:M.isData3DTexture?Se=Math.floor(Nt.depth*Kn):Se=1,Ve=0,We=0,Le=0}V!==null?(et=V.x,ut=V.y,Rt=V.z):(et=0,ut=0,Rt=0);let st=ue.convert(N.format),De=ue.convert(N.type),tn;N.isData3DTexture?(ke.setTexture3D(N,0),tn=I.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(ke.setTexture2DArray(N,0),tn=I.TEXTURE_2D_ARRAY):(ke.setTexture2D(N,0),tn=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,N.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,N.unpackAlignment);let lt=I.getParameter(I.UNPACK_ROW_LENGTH),hi=I.getParameter(I.UNPACK_IMAGE_HEIGHT),io=I.getParameter(I.UNPACK_SKIP_PIXELS),Fn=I.getParameter(I.UNPACK_SKIP_ROWS),Ma=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,Nt.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Nt.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Ve),I.pixelStorei(I.UNPACK_SKIP_ROWS,We),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Le);let Et=M.isDataArrayTexture||M.isData3DTexture,Jn=N.isDataArrayTexture||N.isData3DTexture;if(M.isDepthTexture){let Kn=xe.get(M),yn=xe.get(N),Tn=xe.get(Kn.__renderTarget),uh=xe.get(yn.__renderTarget);ce.bindFramebuffer(I.READ_FRAMEBUFFER,Tn.__webglFramebuffer),ce.bindFramebuffer(I.DRAW_FRAMEBUFFER,uh.__webglFramebuffer);for(let xs=0;xs<Se;xs++)Et&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,xe.get(M).__webglTexture,D,Le+xs),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,xe.get(N).__webglTexture,re,Rt+xs)),I.blitFramebuffer(Ve,We,pe,Ee,et,ut,pe,Ee,I.DEPTH_BUFFER_BIT,I.NEAREST);ce.bindFramebuffer(I.READ_FRAMEBUFFER,null),ce.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(D!==0||M.isRenderTargetTexture||xe.has(M)){let Kn=xe.get(M),yn=xe.get(N);ce.bindFramebuffer(I.READ_FRAMEBUFFER,qM),ce.bindFramebuffer(I.DRAW_FRAMEBUFFER,$M);for(let Tn=0;Tn<Se;Tn++)Et?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Kn.__webglTexture,D,Le+Tn):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,Kn.__webglTexture,D),Jn?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,yn.__webglTexture,re,Rt+Tn):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,yn.__webglTexture,re),D!==0?I.blitFramebuffer(Ve,We,pe,Ee,et,ut,pe,Ee,I.COLOR_BUFFER_BIT,I.NEAREST):Jn?I.copyTexSubImage3D(tn,re,et,ut,Rt+Tn,Ve,We,pe,Ee):I.copyTexSubImage2D(tn,re,et,ut,Ve,We,pe,Ee);ce.bindFramebuffer(I.READ_FRAMEBUFFER,null),ce.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else Jn?M.isDataTexture||M.isData3DTexture?I.texSubImage3D(tn,re,et,ut,Rt,pe,Ee,Se,st,De,Nt.data):N.isCompressedArrayTexture?I.compressedTexSubImage3D(tn,re,et,ut,Rt,pe,Ee,Se,st,Nt.data):I.texSubImage3D(tn,re,et,ut,Rt,pe,Ee,Se,st,De,Nt):M.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,re,et,ut,pe,Ee,st,De,Nt.data):M.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,re,et,ut,Nt.width,Nt.height,st,Nt.data):I.texSubImage2D(I.TEXTURE_2D,re,et,ut,pe,Ee,st,De,Nt);I.pixelStorei(I.UNPACK_ROW_LENGTH,lt),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,hi),I.pixelStorei(I.UNPACK_SKIP_PIXELS,io),I.pixelStorei(I.UNPACK_SKIP_ROWS,Fn),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ma),re===0&&N.generateMipmaps&&I.generateMipmap(tn),ce.unbindTexture()},this.copyTextureToTexture3D=function(M,N,B=null,V=null,D=0){return $s('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,N,B,V,D)},this.initRenderTarget=function(M){xe.get(M).__webglFramebuffer===void 0&&ke.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?ke.setTextureCube(M,0):M.isData3DTexture?ke.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?ke.setTexture2DArray(M,0):ke.setTexture2D(M,0),ce.unbindTexture()},this.resetState=function(){E=0,A=0,R=null,ce.reset(),Xe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Hi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let n=this.getContext();n.drawingBufferColorSpace=rt._getDrawingBufferColorSpace(e),n.unpackColorSpace=rt._getUnpackColorSpace()}};var di=(1+Math.sqrt(5))/2,Ak=[{x:1,y:1,z:0},{x:1,y:-1,z:0},{x:-1,y:1,z:0},{x:-1,y:-1,z:0},{x:1,y:0,z:1},{x:1,y:0,z:-1},{x:-1,y:0,z:1},{x:-1,y:0,z:-1},{x:0,y:1,z:1},{x:0,y:1,z:-1},{x:0,y:-1,z:1},{x:0,y:-1,z:-1}],Ck=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}],RM=[{x:0,y:1,z:di},{x:0,y:1,z:-di},{x:0,y:-1,z:di},{x:0,y:-1,z:-di},{x:1,y:di,z:0},{x:1,y:-di,z:0},{x:-1,y:di,z:0},{x:-1,y:-di,z:0},{x:di,y:0,z:1},{x:di,y:0,z:-1},{x:-di,y:0,z:1},{x:-di,y:0,z:-1}];function PM(t,e,n){let i=n*n*(3-2*n),r=Math.min(t.length,e.length),s=[];for(let o=0;o<r;o++)s.push({x:t[o].x+(e[o].x-t[o].x)*i,y:t[o].y+(e[o].y-t[o].y)*i,z:t[o].z+(e[o].z-t[o].z)*i});return s}function IM(t){let e=Math.max(0,Math.min(1,t||0));return e<=.5?PM(Ak,RM,e*2):PM(RM,Ck,(e-.5)*2)}var Sa=[{x:1,y:1,z:1},{x:1,y:-1,z:-1},{x:-1,y:1,z:-1},{x:-1,y:-1,z:1}],kM=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];var Mr=1.4,LM=140,NM=[[0,4],[0,5],[0,8],[0,9],[1,4],[1,5],[1,10],[1,11],[2,6],[2,7],[2,8],[2,9],[3,6],[3,7],[3,10],[3,11],[4,8],[4,10],[5,9],[5,11],[6,8],[6,10],[7,9],[7,11]],Rk=[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5]];function Pk(t){return t<=.33?NM:t<=.66?NM.slice(0,12):Rk}function lh(t){return Math.max(0,Math.min(1,Number.isFinite(t)?t:1))}function Ik(t){let e=/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)$/i.exec(t.trim());if(!e)return null;let n=parseFloat(e[1])/(e[1].endsWith("%")?100:1),i=parseFloat(e[2]),r=parseFloat(e[3])*Math.PI/180,s=i*Math.cos(r),o=i*Math.sin(r),a=n+.3963377774*s+.2158037573*o,l=n-.1055613458*s-.0638541728*o,c=n-.0894841775*s-1.291485548*o,d=a*a*a,f=l*l*l,h=c*c*c,p=g=>g<=.0031308?12.92*g:1.055*Math.pow(g,1/2.4)-.055,v=g=>Math.round(Math.max(0,Math.min(1,g))*255).toString(16).padStart(2,"0"),y=p(4.0767416621*d-3.3077115913*f+.2309699292*h),m=p(-1.2684380046*d+2.6097574011*f-.3413193965*h),u=p(-.0041960863*d-.7034186147*f+1.707614701*h);return`#${v(y)}${v(m)}${v(u)}`}function kk(t,e,n){try{let i=getComputedStyle(t).getPropertyValue(e).trim();return i?i.toLowerCase().startsWith("oklch(")?Ik(i)??n:i:n}catch{return n}}function fc(t,e,n){let i=kk(t,e,n);try{let r=new je(i);return Number.isNaN(r.r)||Number.isNaN(r.g)||Number.isNaN(r.b)?new je(n):r}catch{return new je(n)}}function Lk(){try{let t=document.createElement("canvas");t.width=64,t.height=64;let e=t.getContext("2d");if(!e)return null;let n=e.createRadialGradient(32,32,0,32,32,32);return n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.35,"rgba(255,255,255,0.55)"),n.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=n,e.fillRect(0,0,64,64),new jl(t)}catch{return null}}function DM(t,e){let n={update(){},setPhase(){},dispose(){}};if(typeof window>"u"||!t)return n;let i=null;try{let S=function(me,ve,Be,ce,Re,xe,ke,Fe,C){R.set(ve,Be,ce),w.set(Re,xe,ke);let b=w.sub(R),F=b.length();me.position.set((ve+Re)/2,(Be+xe)/2,(ce+ke)/2),F>1e-6&&me.quaternion.setFromUnitVectors(A,b.normalize()),me.scale.set(Fe,F,Fe),me.material.opacity=C},Qe=function(me){let ve=me.verticesList&&me.verticesList.length>0?me.verticesList:null,Be=me.edgesList&&me.edgesList.length>0?me.edgesList:null,ce=Number.isFinite(me.rigidity)?lh(me.rigidity):.5;for(let Re=0;Re<4;Re++){let xe=ve&&Re<ve.length?lh(ve[Re].love):1,ke=.14+xe*.3,Fe=x[Re];Fe.scale.setScalar(ke);let C=Fe.children[0],b=Fe.children[1];C.scale.setScalar(1),b.scale.setScalar(2.6),_[Re*2].opacity=.65+xe*.35,_[Re*2+1].opacity=.1+xe*.22}for(let Re=0;Re<6;Re++){let xe=Be&&Re<Be.length?lh(Be[Re].weight):1,ke=kM[Re],Fe=Sa[ke[0]],C=Sa[ke[1]],b=(.28+xe*.45)*(.65+ce*.35);E[Re].color.copy(l).lerp(c,xe),S(T[Re],Fe.x,Fe.y,Fe.z,C.x,C.y,C.z,.014+xe*.032,b)}se=.9+(Number.isFinite(me.love)?lh(me.love):.5)*.2,g.scale.setScalar(se)},Ne=function(me){let ve=IM(me),Be=O.attributes.position,ce=Be.array;for(let Fe=0;Fe<ve.length;Fe++)ce[Fe*3]=ve[Fe].x*Mr,ce[Fe*3+1]=ve[Fe].y*Mr,ce[Fe*3+2]=ve[Fe].z*Mr;Be.needsUpdate=!0,O.setDrawRange(0,ve.length);let Re=Pk(me),xe=H.attributes.position,ke=xe.array;for(let Fe=0;Fe<Re.length;Fe++){let C=ve[Re[Fe][0]],b=ve[Re[Fe][1]];ke[Fe*6]=C.x*Mr,ke[Fe*6+1]=C.y*Mr,ke[Fe*6+2]=C.z*Mr,ke[Fe*6+3]=b.x*Mr,ke[Fe*6+4]=b.y*Mr,ke[Fe*6+5]=b.z*Mr}xe.needsUpdate=!0,H.setDrawRange(0,Re.length*2)},pt=function(){Ge=W,Ne(Ge),h.render(d,f)},yt=function(me){let ve=W-Ge;Math.abs(ve)>.001&&(Ge+=Math.sign(ve)*Math.min(Math.abs(ve),.05*me)),Ne(Ge);let Be=performance.now();g.rotation.y+=.0032*me,g.rotation.x=Math.sin(Be*4e-4)*.08,P.rotation.y-=.0016*me,ge.rotation.y+=8e-4*me;let ce=1+Math.sin(Be*.0012)*.025;g.scale.setScalar(se*ce)},nt=function(me){if(!ae)return;let ve=Math.min(3,(me-Te)/16.67);Te=me,yt(ve),h.render(d,f),r||(ye=requestAnimationFrame(nt))},r=!!(e?.reducedMotion??(typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)),s=fc(t,"--p31-accent","#4cc9b0"),o=fc(t,"--p31-accent-violet","#8b7cf6"),a=fc(t,"--p31-accent-gold","#f5be0b"),l=fc(t,"--p31-accent-green","#4ade80"),c=fc(t,"--p31-accent-red","#f87171"),d=new Zl,f=new pn(50,1,.1,100);f.position.set(0,0,6.5),i=document.createElement("canvas"),i.style.pointerEvents="none",t.appendChild(i);let h=new oh({canvas:i,antialias:!0,alpha:!0});h.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),h.setClearColor(0,0);let p=Math.max(1,t.clientWidth||1),v=Math.max(1,t.clientHeight||1);h.setSize(p,v,!1),f.aspect=p/v,f.updateProjectionMatrix();let y=new ha(1,12,8),m=new ha(1,16,12),u=new ec(1,1,1,6,1,!0),g=new Ai;d.add(g);let x=[],_=[];for(let me=0;me<4;me++){let ve=new Ai,Be=new yr({color:s,transparent:!0,opacity:.95,blending:qi,depthWrite:!1}),ce=new yr({color:s,transparent:!0,opacity:.16,blending:qi,depthWrite:!1}),Re=new gn(y,Be),xe=new gn(m,ce);xe.scale.setScalar(2.6),ve.add(Re),ve.add(xe),ve.position.set(Sa[me].x,Sa[me].y,Sa[me].z),_.push(Be,ce),x.push(ve),g.add(ve)}let T=[],E=[];for(let me=0;me<6;me++){let ve=new yr({color:l,transparent:!0,opacity:.5,blending:qi,depthWrite:!1}),Be=new gn(u,ve);T.push(Be),E.push(ve),g.add(Be)}let A=new U(0,1,0),R=new U,w=new U,P=new Ai;d.add(P);let z=12,L=24,O=new mn;O.setAttribute("position",new on(new Float32Array(z*3),3)),O.setDrawRange(0,z);let X=new Ys({color:o,size:.1,sizeAttenuation:!0,transparent:!0,opacity:.75,blending:qi,depthWrite:!1});P.add(new fa(O,X));let H=new mn;H.setAttribute("position",new on(new Float32Array(L*6),3)),H.setDrawRange(0,L*2);let Z=new da({color:o,transparent:!0,opacity:.24,blending:qi,depthWrite:!1});P.add(new Kl(H,Z));let G=Lk(),oe=new mn,le=new Float32Array(LM*3);for(let me=0;me<LM;me++){let ve=2+Math.random()*1.8,Be=Math.random()*Math.PI*2,ce=Math.acos(2*Math.random()-1);le[me*3]=ve*Math.sin(ce)*Math.cos(Be),le[me*3+1]=ve*Math.sin(ce)*Math.sin(Be),le[me*3+2]=ve*Math.cos(ce)}oe.setAttribute("position",new on(le,3));let te=new Ys({color:a,size:.07,sizeAttenuation:!0,map:G??void 0,transparent:!0,opacity:.5,blending:qi,depthWrite:!1}),ge=new fa(oe,te);d.add(ge);let Ge=0,W=0,se=1,ye=0,ae=!0,Te=performance.now(),I=new ResizeObserver(()=>{let me=Math.max(1,t.clientWidth||1),ve=Math.max(1,t.clientHeight||1);h.setSize(me,ve,!1),f.aspect=me/ve,f.updateProjectionMatrix(),r&&pt()});return I.observe(t),Ne(0),r?pt():(Te=performance.now(),ye=requestAnimationFrame(nt)),{update(me){Qe(me),r&&pt()},setPhase(me){W=Math.max(0,Math.min(1,Number.isFinite(me)?me:0)),r&&pt()},dispose(){ae=!1,ye&&cancelAnimationFrame(ye),I.disconnect(),y.dispose(),m.dispose(),u.dispose(),O.dispose(),H.dispose(),oe.dispose(),_.forEach(me=>me.dispose()),E.forEach(me=>me.dispose()),X.dispose(),Z.dispose(),te.dispose(),G&&G.dispose(),h.dispose(),i&&i.parentNode===t&&t.removeChild(i)}}}catch{return i&&i.parentNode===t&&t.removeChild(i),n}}var ms=Ce(Ue());function UM({mesh:t}){let e=(0,gs.useRef)(null),n=(0,gs.useRef)(null),[i,r]=(0,gs.useState)(!1);return(0,gs.useEffect)(()=>{let s=e.current;if(s){try{let o=typeof window<"u"&&typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=DM(s,{reducedMotion:o});if(!s.querySelector("canvas")){a.dispose(),r(!0);return}n.current=a}catch{r(!0)}return()=>{n.current?.dispose(),n.current=null}}},[]),(0,gs.useEffect)(()=>{n.current?.update(t)},[t]),i?(0,ms.jsx)("div",{role:"img","aria-label":"K4 mesh",className:"cc-eye",children:(0,ms.jsxs)("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,textAlign:"center"},children:[(0,ms.jsxs)("div",{className:"cc-mono",style:{fontSize:22,fontWeight:700},children:[t.vertices,"V / ",t.edges,"E"]}),(0,ms.jsxs)("div",{className:"cc-muted cc-mono",style:{fontSize:12},children:[t.isostatic?"isostatic":"non-isostatic"," / rigidity ",Math.round(t.rigidity*100),"%"]}),(0,ms.jsxs)("div",{className:"cc-mono",style:{fontSize:12},children:["love ",Math.round(t.love*100),"%"]})]})}):(0,ms.jsx)("div",{ref:e,className:"cc-eye",role:"img","aria-label":"K4 mesh"})}var FM=Ce(pi());var Ct=Ce(Ue()),Nk={online:"online",degraded:"busy",offline:"offline"};function jg({fleet:t,canControl:e,onQuarantine:n,onRollback:i}){let[r,s]=(0,FM.useState)(null),o=t.filter(c=>c.status==="online").length;function a(c){window.confirm(`Quarantine node "${c}"?`)&&n(c)}function l(c){window.confirm(`Rollback node "${c}"?`)&&i(c)}return(0,Ct.jsxs)(Bt,{padding:"md",children:[(0,Ct.jsx)("div",{className:"cc-card-title",children:"Fleet Matrix"}),(0,Ct.jsxs)("div",{style:{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,Ct.jsx)(mt,{label:"Online",value:`${o}`}),(0,Ct.jsx)(mt,{label:"Total",value:`${t.length}`})]}),t.length===0?(0,Ct.jsx)("div",{className:"cc-muted",children:"No fleet nodes reported."}):t.map(c=>(0,Ct.jsxs)("div",{children:[(0,Ct.jsx)("div",{className:"cc-row cc-row--click",onClick:()=>s(r===c.name?null:c.name),role:"button",tabIndex:0,onKeyDown:d=>{(d.key==="Enter"||d.key===" ")&&s(r===c.name?null:c.name)},children:(0,Ct.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0},children:[(0,Ct.jsx)(Lm,{status:Nk[c.status],label:c.status}),(0,Ct.jsx)("span",{className:"cc-mono",children:c.name}),c.group?(0,Ct.jsx)("span",{className:"cc-secondary",children:c.group}):null]})}),r===c.name&&(0,Ct.jsxs)("div",{style:{padding:"8px 0 12px 20px",display:"flex",flexDirection:"column",gap:8},children:[(0,Ct.jsxs)("div",{children:[(0,Ct.jsx)("span",{className:"cc-secondary",children:"Endpoint: "}),(0,Ct.jsx)("a",{href:c.url,className:"cc-link cc-mono",target:"_blank",rel:"noopener noreferrer",children:c.url})]}),c.latency_ms!=null&&(0,Ct.jsxs)("div",{children:[(0,Ct.jsx)("span",{className:"cc-secondary",children:"Latency: "}),(0,Ct.jsxs)("span",{className:"cc-mono",children:[c.latency_ms,"ms"]})]}),e&&(0,Ct.jsxs)("div",{className:"cc-actions",children:[(0,Ct.jsx)(gl,{onClick:()=>a(c.name),children:"Quarantine"}),(0,Ct.jsx)(gl,{onClick:()=>l(c.name),children:"Rollback"})]})]})]},c.name))]})}var Lt=Ce(Ue());function Qg({surfaces:t}){let e=t.filter(n=>n.ok).length;return(0,Lt.jsxs)(Bt,{padding:"md",children:[(0,Lt.jsx)("div",{className:"cc-card-title",children:"Surface Monitor"}),(0,Lt.jsxs)("div",{style:{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,Lt.jsx)(mt,{label:"Healthy",value:`${e}`}),(0,Lt.jsx)(mt,{label:"Total",value:`${t.length}`})]}),t.length===0?(0,Lt.jsx)("div",{className:"cc-muted",children:"No surfaces registered."}):(0,Lt.jsxs)("table",{className:"cc-table",children:[(0,Lt.jsx)("thead",{children:(0,Lt.jsxs)("tr",{children:[(0,Lt.jsx)("th",{children:"Name"}),(0,Lt.jsx)("th",{children:"URL"}),(0,Lt.jsx)("th",{children:"Code"}),(0,Lt.jsx)("th",{children:"Status"})]})}),(0,Lt.jsx)("tbody",{children:t.map(n=>(0,Lt.jsxs)("tr",{children:[(0,Lt.jsx)("td",{className:"cc-mono",children:n.name}),(0,Lt.jsx)("td",{children:(0,Lt.jsx)("a",{href:n.url,className:"cc-link",target:"_blank",rel:"noopener noreferrer",children:n.url})}),(0,Lt.jsx)("td",{className:"cc-mono",children:n.code}),(0,Lt.jsx)("td",{children:(0,Lt.jsx)("span",{className:`cc-chip ${n.ok?"cc-chip--ok":"cc-chip--bad"}`,children:n.ok?"ok":"fail"})})]},n.name))})]})]})}var Ot=Ce(Ue());function ev({mesh:t}){let e=t.vertices>2?(t.edges/(3*t.vertices-6)).toFixed(3):"0.000";return(0,Ot.jsxs)(Bt,{padding:"md",children:[(0,Ot.jsx)("div",{className:"cc-card-title",children:"K\u2084 Mesh"}),(0,Ot.jsxs)("div",{className:"cc-grid",style:{marginBottom:16},children:[(0,Ot.jsx)(mt,{label:"Vertices",value:`${t.vertices}`}),(0,Ot.jsx)(mt,{label:"Edges",value:`${t.edges}`}),(0,Ot.jsx)(mt,{label:"LOVE Total",value:`${t.love}`}),(0,Ot.jsx)(mt,{label:"Rigidity",value:e}),(0,Ot.jsxs)("div",{children:[(0,Ot.jsx)("div",{className:"cc-muted",style:{fontSize:11,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"},children:"Isostatic"}),(0,Ot.jsx)("span",{className:`cc-chip ${t.isostatic?"cc-chip--ok":"cc-chip--bad"}`,children:t.isostatic?"yes":"no"})]})]}),t.edgesList.length===0?(0,Ot.jsx)("div",{className:"cc-muted",children:"No edges in mesh."}):(0,Ot.jsxs)("table",{className:"cc-table",children:[(0,Ot.jsx)("thead",{children:(0,Ot.jsxs)("tr",{children:[(0,Ot.jsx)("th",{children:"Edge"}),(0,Ot.jsx)("th",{children:"Weight"})]})}),(0,Ot.jsx)("tbody",{children:t.edgesList.map((n,i)=>(0,Ot.jsxs)("tr",{children:[(0,Ot.jsxs)("td",{className:"cc-mono",children:[n.a," \u2192 ",n.b]}),(0,Ot.jsx)("td",{className:"cc-mono",children:n.weight})]},`${n.a}-${n.b}-${i}`))})]})]})}var Yt=Ce(Ue());function Dk(t){return t<=7?"cc-chip--bad":t<=21?"cc-chip--warn":"cc-chip--ok"}function tv({grants:t,legal:e}){let n=[...t].sort((i,r)=>i.days-r.days);return(0,Yt.jsxs)(Bt,{padding:"md",children:[(0,Yt.jsx)("div",{className:"cc-card-title",children:"Funding Rail"}),(0,Yt.jsxs)("div",{className:"cc-hearing",style:{marginBottom:16},children:[(0,Yt.jsx)("span",{className:"cc-hearing__days",children:e.days_to_hearing}),(0,Yt.jsx)("span",{style:{fontSize:13},children:"days to hearing"}),(0,Yt.jsxs)("span",{className:"cc-muted",style:{fontSize:12,marginLeft:"auto"},children:[e.case," \xB7 ",e.judge," \xB7 ",e.hearing_date]})]}),(0,Yt.jsxs)("div",{style:{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,Yt.jsx)(mt,{label:"Active Grants",value:`${t.length}`}),(0,Yt.jsx)(mt,{label:"Next Deadline",value:`${n.length>0?n[0].days:"--"}d`})]}),n.length===0?(0,Yt.jsx)("div",{className:"cc-muted",children:"No grants active."}):n.map(i=>(0,Yt.jsxs)("div",{className:"cc-row",children:[(0,Yt.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0},children:[(0,Yt.jsx)("a",{href:i.url,className:"cc-link cc-mono",target:"_blank",rel:"noopener noreferrer",children:i.name}),(0,Yt.jsx)("span",{className:"cc-secondary",children:i.amount})]}),(0,Yt.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8,flexShrink:0},children:[(0,Yt.jsx)("span",{className:"cc-muted",children:i.deadline}),(0,Yt.jsxs)("span",{className:`cc-chip ${Dk(i.days)}`,children:[i.days,"d"]})]})]},i.name))]})}var wt=Ce(Ue());function nv({costs:t}){return t?(0,wt.jsxs)(Bt,{padding:"md",children:[(0,wt.jsx)("div",{className:"cc-card-title",children:"Cost Telemetry"}),(0,wt.jsxs)("div",{style:{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,wt.jsx)(mt,{label:"Total",value:`$${t.total.toFixed(2)}`}),(0,wt.jsx)(mt,{label:"Period",value:`${t.period_hours}h`}),(0,wt.jsx)(mt,{label:"Line Items",value:`${t.items.length}`})]}),t.items.length===0?(0,wt.jsx)("div",{className:"cc-muted",children:"No cost items recorded."}):(0,wt.jsxs)("table",{className:"cc-table",children:[(0,wt.jsx)("thead",{children:(0,wt.jsxs)("tr",{children:[(0,wt.jsx)("th",{children:"Service"}),(0,wt.jsx)("th",{children:"Operation"}),(0,wt.jsx)("th",{children:"Qty"}),(0,wt.jsx)("th",{children:"Cost"})]})}),(0,wt.jsx)("tbody",{children:t.items.map((e,n)=>(0,wt.jsxs)("tr",{children:[(0,wt.jsx)("td",{className:"cc-mono",children:e.service}),(0,wt.jsx)("td",{children:e.operation}),(0,wt.jsx)("td",{className:"cc-mono",children:e.qty}),(0,wt.jsxs)("td",{className:"cc-mono",children:["$",e.cost.toFixed(4)]})]},`${e.service}-${e.operation}-${n}`))})]})]}):(0,wt.jsxs)(Bt,{padding:"md",children:[(0,wt.jsx)("div",{className:"cc-card-title",children:"Cost Telemetry"}),(0,wt.jsx)("div",{className:"cc-muted",children:"EPCP_DB not bound. No cost telemetry."})]})}var at=Ce(Ue());function iv({mcp:t}){let e=t.endpoints.filter(n=>n.ok).length;return(0,at.jsxs)(Bt,{padding:"md",children:[(0,at.jsx)("div",{className:"cc-card-title",children:"MCP / Reach"}),(0,at.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:4,marginBottom:16},children:[(0,at.jsxs)("div",{children:[(0,at.jsx)("span",{className:"cc-secondary",children:"Name: "}),(0,at.jsx)("span",{className:"cc-mono",children:t.name})]}),(0,at.jsxs)("div",{children:[(0,at.jsx)("span",{className:"cc-secondary",children:"Version: "}),(0,at.jsx)("span",{className:"cc-mono",children:t.version})]}),(0,at.jsxs)("div",{children:[(0,at.jsx)("span",{className:"cc-secondary",children:"Registry: "}),(0,at.jsx)("a",{href:t.registry_url,className:"cc-link cc-mono",target:"_blank",rel:"noopener noreferrer",children:t.registry_url})]})]}),(0,at.jsxs)("div",{style:{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"},children:[(0,at.jsx)(mt,{label:"Endpoints",value:`${t.endpoints.length}`}),(0,at.jsx)(mt,{label:"Healthy",value:`${e}`})]}),t.endpoints.length===0?(0,at.jsx)("div",{className:"cc-muted",children:"No MCP endpoints registered."}):(0,at.jsxs)("table",{className:"cc-table",children:[(0,at.jsx)("thead",{children:(0,at.jsxs)("tr",{children:[(0,at.jsx)("th",{children:"Name"}),(0,at.jsx)("th",{children:"URL"}),(0,at.jsx)("th",{children:"Status"})]})}),(0,at.jsx)("tbody",{children:t.endpoints.map(n=>(0,at.jsxs)("tr",{children:[(0,at.jsx)("td",{className:"cc-mono",children:n.name}),(0,at.jsx)("td",{children:(0,at.jsx)("a",{href:n.url,className:"cc-link",target:"_blank",rel:"noopener noreferrer",children:n.url})}),(0,at.jsx)("td",{children:(0,at.jsx)("span",{className:`cc-chip ${n.ok?"cc-chip--ok":"cc-chip--bad"}`,children:n.ok?"ok":"fail"})})]},n.name))})]})]})}var Ze=Ce(Ue()),Uk=[{id:"eye",label:"The Eye"},{id:"fleet",label:"Fleet"},{id:"surfaces",label:"Surfaces"},{id:"funding",label:"Funding"},{id:"costs",label:"Costs"},{id:"reach",label:"Reach"}];function Fk(){try{let t=Number(localStorage.getItem("cc:spoons"));return Number.isFinite(t)?Math.max(0,Math.min(5,t)):3}catch{return 3}}function OM(){let[t,e]=(0,xn.useState)(null),[n,i]=(0,xn.useState)({authenticated:!1}),[r,s]=(0,xn.useState)("eye"),[o,a]=(0,xn.useState)(Fk),[l,c]=(0,xn.useState)(null),[d,f]=(0,xn.useState)(null),h=(0,xn.useRef)(!1),p=(0,xn.useCallback)(async()=>{if(!h.current){h.current=!0;try{let g=await Lb();e(g),f(null)}catch(g){f(g instanceof Error?g.message:String(g))}finally{h.current=!1}}},[]);(0,xn.useEffect)(()=>{Nb().then(i),p();let g=Ub(p),x=window.setInterval(p,3e4);return()=>{g(),window.clearInterval(x)}},[p]),(0,xn.useEffect)(()=>{document.documentElement.dataset.spoons=String(o);try{localStorage.setItem("cc:spoons",String(o))}catch{}},[o]);let v=(0,xn.useCallback)(g=>{a(g),fetch("/api/operator/shift",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({spoons:g})}).catch(()=>{})},[]),y=!!t?.control_enabled&&(n.role==="admin"||n.role==="operator"),m=(0,xn.useCallback)(async(g,x)=>{c(`${g}: ${x}\u2026`);try{let _=await Db(g,x);c(_.ok?`${g} ok: ${_.message??x}`:`${g} failed: ${_.error??"unknown"}`)}catch(_){c(`${g} failed: ${_ instanceof Error?_.message:String(_)}`)}p()},[p]),u=t?new Date(t.ts).toLocaleTimeString():"\u2014";return(0,Ze.jsxs)(Ze.Fragment,{children:[(0,Ze.jsx)(Fm,{spoons:o}),(0,Ze.jsxs)("div",{className:"cc-app",children:[(0,Ze.jsxs)("header",{className:"cc-header",children:[(0,Ze.jsxs)("div",{style:{flex:1,minWidth:240},children:[(0,Ze.jsxs)("h1",{className:"cc-title",children:["P31 ",(0,Ze.jsx)("span",{style:{color:"var(--p31-accent)"},children:"Command Center"})]}),(0,Ze.jsxs)("div",{className:"cc-sub",children:["All-Seeing Eye \xB7 ",n.authenticated?`${n.email} (${n.role})`:"not authenticated"," \xB7 updated ",u]})]}),(0,Ze.jsx)(Im,{level:o,onChange:v})]}),t&&(0,Ze.jsxs)("div",{className:"cc-grid",children:[(0,Ze.jsx)(Bt,{padding:"sm",children:(0,Ze.jsx)(mt,{label:"Nodes Online",value:`${t.kpi.workers_online}/${t.kpi.workers_total}`})}),(0,Ze.jsx)(Bt,{padding:"sm",children:(0,Ze.jsx)(mt,{label:"Portals Live",value:`${t.kpi.portals_live}`})}),(0,Ze.jsx)(Bt,{padding:"sm",children:(0,Ze.jsx)(mt,{label:"Active Grants",value:`${t.kpi.grants_active}`})}),(0,Ze.jsx)(Bt,{padding:"sm",children:(0,Ze.jsx)(mt,{label:"Days to Grant",value:`${t.kpi.days_to_next_deadline}`})}),(0,Ze.jsx)(Bt,{padding:"sm",children:(0,Ze.jsx)(mt,{label:"Days to Hearing",value:`${t.kpi.days_to_hearing}`})})]}),d&&(0,Ze.jsxs)("div",{className:"cc-secondary",role:"status",children:["telemetry error: ",d]}),l&&(0,Ze.jsx)("div",{className:"cc-secondary",role:"status","aria-live":"polite",children:l}),(0,Ze.jsx)("nav",{className:"cc-tabs",role:"tablist","aria-label":"Sections",children:Uk.map(g=>(0,Ze.jsx)("button",{role:"tab","aria-selected":r===g.id,className:`cc-chip ${r===g.id?"cc-chip--ok":""}`,onClick:()=>s(g.id),children:g.label},g.id))}),t?r==="eye"?(0,Ze.jsxs)("div",{className:"cc-grid cc-grid--wide",children:[(0,Ze.jsx)(UM,{mesh:t.mesh}),(0,Ze.jsx)(ev,{mesh:t.mesh})]}):r==="fleet"?(0,Ze.jsx)(jg,{fleet:t.fleet,canControl:y,onQuarantine:g=>m("quarantine",g),onRollback:g=>m("rollback",g)}):r==="surfaces"?(0,Ze.jsx)(Qg,{surfaces:t.surfaces}):r==="funding"?(0,Ze.jsx)(tv,{grants:t.grants,legal:t.legal}):r==="costs"?(0,Ze.jsx)(nv,{costs:t.costs}):(0,Ze.jsx)(iv,{mcp:t.mcp}):(0,Ze.jsx)(Bt,{children:(0,Ze.jsx)("div",{className:"cc-muted",children:"Syncing operator telemetry\u2026"})}),(0,Ze.jsx)("footer",{className:"cc-muted",style:{fontSize:11,textAlign:"center",paddingTop:8},children:"P31 Labs Inc \xB7 EIN 42-1888158 \xB7 command-center.p31ca.org"})]})]})}var HM=Ce(Ue()),zM=document.getElementById("root");zM&&(0,BM.createRoot)(zM).render((0,HM.jsx)(OM,{}));
//# sourceMappingURL=dashboard.js.map
