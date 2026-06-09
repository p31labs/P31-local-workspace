/**
 * Injects the fixed P31 return ribbon (one sky spine).
 * Canon: andromeda/software/design-tokens/p31-universal-canon.json → returnRibbon
 */
(function () {
  if (document.querySelector(".p31-return-ribbon[data-p31-ribbon-injected]")) return;

  var sc = document.currentScript;
  var localSoup = sc && sc.getAttribute("data-local-soup");
  var soupHref = localSoup || "https://bonding.p31ca.org/soup";
  var HUB = "https://p31ca.org/";
  var PASS = "https://p31ca.org/passport";
  var CONN = "https://p31ca.org/connect";
  var MESH = "https://p31ca.org/mesh-start.html";

  var nav = document.createElement("nav");
  nav.className = "p31-return-ribbon";
  nav.setAttribute("aria-label", "P31 home spine");
  nav.setAttribute("data-p31-ribbon-injected", "");

  function sep() {
    var s = document.createElement("span");
    s.className = "p31-return-ribbon__sep";
    s.setAttribute("aria-hidden", "true");
    s.textContent = "·";
    return s;
  }
  function link(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }

  nav.appendChild(link(soupHref, "soup"));
  nav.appendChild(sep());
  nav.appendChild(link(HUB, "hub"));
  nav.appendChild(sep());
  nav.appendChild(link(PASS, "passport"));
  nav.appendChild(sep());
  nav.appendChild(link(CONN, "connection"));
  nav.appendChild(sep());
  nav.appendChild(link(MESH, "mesh"));

  document.body.classList.add("p31-has-return-ribbon");
  document.body.appendChild(nav);
})();
