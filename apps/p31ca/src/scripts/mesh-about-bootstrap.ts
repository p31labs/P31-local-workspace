import { mountMeshLivingBackground } from "./mesh-living-background";

function run() {
  const el = document.getElementById("p31-mesh-living-bg");
  if (el) mountMeshLivingBackground(el, { interactive: false });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run);
} else {
  run();
}
