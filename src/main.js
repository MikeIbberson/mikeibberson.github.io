import * as THREE from "three";
import { createRoom } from "./scene/room.js";
import { createProps, createDecor } from "./scene/props.js";
import { createExaminePreview } from "./scene/examinePreview.js";
import { content, fmt, ITEMS, PRIMARY_ITEMS } from "./data/content.js";
import { publicUrl } from "./publicUrl.js";

function asText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // YAML `Subject: Name` becomes { Subject: "Name" } — recover the intended line
  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [k, v] = entries[0];
      return `${k}: ${v}`;
    }
  }
  return String(value);
}

function pathGet(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function applyContent() {
  const c = content;
  if (c.meta?.title) document.title = c.meta.title;

  document.querySelectorAll("[data-content]").forEach((el) => {
    const value = pathGet(c, el.getAttribute("data-content"));
    if (value == null) return;
    el.textContent = asText(value);
  });

  const bootLinesHost = document.getElementById("boot-lines");
  if (bootLinesHost && Array.isArray(c.boot?.lines)) {
    bootLinesHost.replaceChildren(
      ...c.boot.lines.map((line, i, arr) => {
        const p = document.createElement("p");
        p.className = "boot__line" + (i === arr.length - 1 ? " boot__line--ok" : "");
        p.dataset.boot = "";
        p.textContent = asText(line);
        return p;
      })
    );
  }

  const brandLinkEl = document.getElementById("brand-link");
  if (brandLinkEl && c.hud?.brandAriaLabel) {
    brandLinkEl.setAttribute("aria-label", c.hud.brandAriaLabel);
  }

  const menuToggleEl = document.getElementById("menu-toggle");
  if (menuToggleEl && c.hud?.menuOpen) {
    menuToggleEl.setAttribute("aria-label", c.hud.menuOpen);
  }

  const hudCompany = document.getElementById("hud-company");
  if (hudCompany && c.site?.company?.href) {
    hudCompany.href = c.site.company.href;
  }

  const aboutRole = document.getElementById("about-role");
  if (aboutRole && c.site) {
    aboutRole.replaceChildren();
    aboutRole.append(document.createTextNode(`${c.site.role} `));
    if (c.site.company) {
      const a = document.createElement("a");
      a.href = c.site.company.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = c.site.company.name;
      aboutRole.append(a);
    }
    aboutRole.append(document.createTextNode(` · ${c.site.location}`));
  }

  const aboutClose = document.querySelector(".about__close");
  if (aboutClose && c.about?.close) {
    aboutClose.setAttribute("aria-label", c.about.close);
  }

  const socialsNav = document.getElementById("about-socials");
  if (socialsNav && c.about?.socialsAriaLabel) {
    socialsNav.setAttribute("aria-label", c.about.socialsAriaLabel);
  }

  const socialById = Object.fromEntries(
    (c.about?.socials ?? []).map((s) => [s.id, s])
  );
  document.querySelectorAll("[data-social]").forEach((el) => {
    const social = socialById[el.getAttribute("data-social")];
    if (!social) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.href = social.href;
    el.setAttribute("aria-label", social.label);
    const label = el.querySelector("span");
    if (label) label.textContent = social.label;
    if (String(social.href).startsWith("mailto:")) {
      el.removeAttribute("target");
      el.removeAttribute("rel");
    } else {
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  });
}

applyContent();

const canvas = document.getElementById("scene");
const boot = document.getElementById("boot");
const bootPrompt = document.getElementById("boot-prompt");
const prompt = document.getElementById("prompt");
const promptText = document.getElementById("prompt-text");
const examine = document.getElementById("examine");
const examineTitle = document.getElementById("examine-title");
const examineBody = document.getElementById("examine-body");
const examineLink = document.getElementById("examine-link");
const examineCanvas = document.getElementById("examine-canvas");
const ticker = document.getElementById("ticker");
const compass = document.getElementById("hud-compass");
const about = document.getElementById("about");
const menuToggle = document.getElementById("menu-toggle");
const brandLink = document.getElementById("brand-link");
const aim = document.getElementById("aim");

const copy = content;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const lowMemory =
  typeof navigator.deviceMemory === "number" && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
const lowPower = isTouch || lowMemory;
if (isTouch) document.body.classList.add("is-touch");
if (lowPower) document.body.classList.add("is-low-power");

document.body.classList.add("is-booting");

// Boot lines
const bootLines = [...document.querySelectorAll("[data-boot]")];
bootLines.forEach((line, i) => {
  setTimeout(() => line.classList.add("is-shown"), reduceMotion ? 0 : 250 + i * 380);
});
setTimeout(
  () => bootPrompt?.classList.add("is-shown"),
  reduceMotion ? 0 : 250 + bootLines.length * 380 + 200
);

if (isTouch && copy.boot?.promptTouch && bootPrompt) {
  bootPrompt.textContent = copy.boot.promptTouch;
}

function viewSize() {
  return { w: window.innerWidth, h: window.innerHeight };
}

function baseFov() {
  const { w, h } = viewSize();
  if (w < 480) return 54;
  if (w < 720 || h < 520) return 50;
  return 42;
}

const { w: initW, h: initH } = viewSize();
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !lowPower,
  powerPreference: lowPower ? "low-power" : "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 2));
renderer.setSize(initW, initH);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = lowPower ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
if (isTouch) canvas.style.touchAction = "none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050403);
scene.fog = new THREE.FogExp2(0x050403, 0.032);

const camera = new THREE.PerspectiveCamera(baseFov(), initW / initH, 0.1, 100);
const CAM_HOME = new THREE.Vector3(0.4, 2.1, 5.8);
const LOOK_HOME = new THREE.Vector3(0.2, 1.6, -2);
const _lookDir = new THREE.Vector3().subVectors(LOOK_HOME, CAM_HOME).normalize();
const BASE_YAW = Math.atan2(_lookDir.x, -_lookDir.z);
const BASE_PITCH = Math.asin(THREE.MathUtils.clamp(_lookDir.y, -1, 1));
const LOOK_YAW_MAX = 0.72;
const LOOK_PITCH_MIN = -0.32;
const LOOK_PITCH_MAX = 0.48;
const LOOK_SENS = 0.0038;
let lookYaw = 0;
let lookPitch = 0;
const _lookTarget = new THREE.Vector3();

function applyCameraLook() {
  const yaw = BASE_YAW + lookYaw;
  const pitch = THREE.MathUtils.clamp(BASE_PITCH + lookPitch, LOOK_PITCH_MIN, LOOK_PITCH_MAX);
  _lookDir.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
  camera.position.copy(CAM_HOME);
  camera.lookAt(_lookTarget.copy(CAM_HOME).add(_lookDir));
}

applyCameraLook();

// Ambient moonlight — very dim so flashlight matters
const moon = new THREE.DirectionalLight(0x8aa0b8, 0.18);
moon.position.set(4, 6, 2);
scene.add(moon);

const hemi = new THREE.HemisphereLight(0x2a3340, 0x1a1008, 0.22);
scene.add(hemi);

const windowGlow = new THREE.PointLight(0x6a90b8, 0.55, 8, 2);
windowGlow.position.set(3.2, 3.2, -4.2);
scene.add(windowGlow);

// Flashlight — cone is aimed along the cursor ray, not at the hit point,
// so the hotspot stays under the pointer on distant / grazing walls.
const FLASH_DIST = 28;
const FLASH_ANGLE = Math.PI / 5.8;
const FLASH_ANGLE_LOCK = Math.PI / 5.0;
const flashlight = new THREE.SpotLight(0xffe6b8, 0, FLASH_DIST, FLASH_ANGLE, 0.72, 1.15);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
flashlight.shadow.bias = -0.00012;
flashlight.shadow.normalBias = 0.045;
flashlight.shadow.radius = lowPower ? 0 : 2.5;
flashlight.shadow.camera.near = 0.35;
flashlight.shadow.camera.far = FLASH_DIST;
flashlight.position.copy(camera.position);
scene.add(flashlight);
scene.add(flashlight.target);

const flashFill = new THREE.PointLight(0xffe0a8, 0, 6.5, 2);
scene.add(flashFill);

const { group: roomGroup, storm } = createRoom();
scene.add(roomGroup);

const props = await createProps();
const propRoots = [];
props.forEach((p) => {
  scene.add(p);
  propRoots.push(p);
});

const decor = await createDecor();
decor.forEach((d) => scene.add(d));

const examinePreview = createExaminePreview(examineCanvas, { lowPower });

const ambience = new Audio(publicUrl("/audio/spooky-piano.mp3"));
ambience.loop = true;
ambience.preload = "auto";
ambience.volume = 0.34;
ambience.setAttribute("aria-hidden", "true");
document.body.appendChild(ambience);

function startAmbience() {
  const play = ambience.play();
  if (play?.catch) play.catch(() => {});
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    ambience.pause();
    storm.pause();
  } else if (live) {
    startAmbience();
    storm.play();
  }
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const _aimDir = new THREE.Vector3();
const _aimTarget = new THREE.Vector3();
const _fillPos = new THREE.Vector3();
const _smoothedTarget = new THREE.Vector3();
let aimReady = false;
let aimClientX = initW * 0.5;
let aimClientY = initH * 0.45;

let live = false;
let examining = false;
let aboutOpen = false;
let nearest = null;
let typeTimer = null;
const found = new Set();
const primaryIds = new Set(PRIMARY_ITEMS);
const TAP_PX = 14;
let touchDrag = null;
/** On touch, suppress examine prompts until the user looks around or taps. */
let touchPromptReady = !isTouch;

function setTicker(text) {
  if (ticker) ticker.textContent = text;
}
function setCompass(text) {
  if (compass) compass.textContent = text;
}

function centerAim() {
  const { w, h } = viewSize();
  updatePointer(w * 0.5, h * 0.48);
}

function updateAim() {
  if (!aim || isTouch) return;
  aim.style.setProperty("--ax", `${aimClientX}px`);
  aim.style.setProperty("--ay", `${aimClientY}px`);
  aim.classList.toggle("is-lock", !!nearest && live && !examining && !aboutOpen);
}

function showAim(show) {
  if (!aim || isTouch) return;
  aim.hidden = !show;
  if (show) updateAim();
}

function enterRoom() {
  if (live) return;
  live = true;
  document.body.classList.remove("is-booting");
  document.body.classList.add("is-live");
  boot?.classList.add("is-done");
  flashlight.intensity = 8.4;
  flashFill.intensity = 1.15;
  startAmbience();
  storm.play();
  if (isTouch) {
    lookYaw = 0;
    lookPitch = 0;
    touchPromptReady = false;
    applyCameraLook();
    centerAim();
    setTicker((copy.ticker.introTouch || copy.ticker.intro).trim());
  } else {
    const { w, h } = viewSize();
    updatePointer(w * 0.5, h * 0.48);
    setTicker(copy.ticker.intro.trim());
    showAim(true);
  }
  setCompass(copy.hud.compassIdle);
}

boot?.addEventListener("click", () => {
  if (!aboutOpen) enterRoom();
});
bootPrompt?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!aboutOpen) enterRoom();
});
bootPrompt?.addEventListener("keydown", (e) => {
  if (aboutOpen) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    enterRoom();
  }
});

function updatePointer(clientX, clientY) {
  const { w, h } = viewSize();
  aimClientX = clientX;
  aimClientY = clientY;
  pointer.x = (clientX / w) * 2 - 1;
  pointer.y = -(clientY / h) * 2 + 1;
  updateAim();
}

function isUiTarget(el) {
  return !!el?.closest?.(".boot, .examine, .about, .hud");
}

function isSolidHit(hit) {
  if (!hit.object?.isMesh || hit.distance < 0.15 || hit.distance > 24) return false;
  const mat = Array.isArray(hit.object.material)
    ? hit.object.material[0]
    : hit.object.material;
  if (!mat) return true;
  if (mat.visible === false) return false;
  if (mat.transparent && mat.opacity < 0.25) return false;
  return mat.opacity !== 0;
}

function aimFlashlight() {
  raycaster.setFromCamera(pointer, camera);
  _aimDir.copy(raycaster.ray.direction);

  // Origin slightly in front of the eye so the shadow near-plane is stable
  flashlight.position.copy(camera.position).addScaledVector(_aimDir, 0.18);

  // Aim along the cursor ray at a fixed range. Targeting the wall hit makes
  // the hotspot slide (especially on the back wall, where fill sat in-plane).
  _aimTarget.copy(camera.position).addScaledVector(_aimDir, 12);

  if (!aimReady) {
    _smoothedTarget.copy(_aimTarget);
    aimReady = true;
  } else {
    _smoothedTarget.lerp(_aimTarget, reduceMotion ? 1 : 0.62);
  }

  flashlight.target.position.copy(_smoothedTarget);
  flashlight.target.updateMatrixWorld();

  const hits = raycaster.intersectObjects(scene.children, true);
  const solid = hits.find(isSolidHit);

  if (solid) {
    // Sit the fill in front of the surface, toward the camera — not +Y,
    // which leaves a point light inside vertical walls.
    const pull = THREE.MathUtils.clamp(solid.distance * 0.06, 0.32, 0.85);
    _fillPos.copy(solid.point).addScaledVector(_aimDir, -pull);
  } else {
    _fillPos.copy(camera.position).addScaledVector(_aimDir, 4.2);
  }
  _fillPos.y = THREE.MathUtils.clamp(_fillPos.y, 0.14, 5.3);
  flashFill.position.copy(_fillPos);
}

function findPropRoot(obj) {
  let o = obj;
  while (o) {
    if (o.userData?.id && propRoots.includes(o)) return o;
    // also check if any ancestor is a prop root
    if (o.userData?.id) {
      const root = propRoots.find((p) => p.userData.id === o.userData.id);
      if (root) return root;
    }
    o = o.parent;
  }
  return null;
}

function updateHover() {
  if (!live || examining) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(propRoots, true);
  const hit = hits[0];
  const root = hit ? findPropRoot(hit.object) : null;

  // Clear emissive highlights
  propRoots.forEach((p) => {
    p.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.emissive && !obj.userData.isCrtScreen) {
        obj.material.emissive.setHex(0x000000);
        obj.material.emissiveIntensity = 0;
      }
    });
  });

  nearest = root && hit && hit.distance < 14 ? root : null;

  if (nearest && touchPromptReady) {
    nearest.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.emissive && !obj.userData.isCrtScreen) {
        obj.material.emissive.setHex(0x1a4a28);
        obj.material.emissiveIntensity = 0.22;
      }
    });

    const label = nearest.userData.label || nearest.userData.id;
    prompt.hidden = false;
    const examineTpl = isTouch
      ? copy.prompt.examineTouch || copy.prompt.examine
      : copy.prompt.examine;
    promptText.textContent = fmt(examineTpl, {
      label: String(label).toLowerCase(),
    });
    // Project root center to screen for prompt
    const center = new THREE.Vector3();
    new THREE.Box3().setFromObject(nearest).getCenter(center);
    center.project(camera);
    const { w, h } = viewSize();
    const sx = (center.x * 0.5 + 0.5) * w;
    const sy = (-center.y * 0.5 + 0.5) * h;
    prompt.style.setProperty("--px", `${sx}px`);
    prompt.style.setProperty("--py", `${sy}px`);
    setCompass(fmt(copy.hud.compassTarget, { label: String(label).toUpperCase() }));
    flashlight.angle = THREE.MathUtils.lerp(flashlight.angle, FLASH_ANGLE_LOCK, 0.2);
    flashlight.intensity = 9.2;
  } else {
    prompt.hidden = true;
    setCompass(copy.hud.compassIdle);
    flashlight.angle = THREE.MathUtils.lerp(flashlight.angle, FLASH_ANGLE, 0.2);
    flashlight.intensity = live ? 8.4 : 0;
  }
  updateAim();
}

function typeText(el, text, done) {
  el.textContent = "";
  if (typeTimer) clearInterval(typeTimer);
  if (reduceMotion) {
    el.textContent = text;
    done?.();
    return;
  }
  let i = 0;
  const caret = document.createElement("span");
  caret.className = "caret";
  caret.textContent = "█";
  el.appendChild(caret);
  typeTimer = setInterval(() => {
    if (i >= text.length) {
      clearInterval(typeTimer);
      caret.remove();
      done?.();
      return;
    }
    el.insertBefore(document.createTextNode(text[i]), caret);
    i += 1;
  }, 14);
}

function openExamine(root) {
  const id = root.userData.id;
  const data = ITEMS[id];
  if (!data) return;

  examining = true;
  document.body.classList.add("is-examining");
  prompt.hidden = true;
  showAim(false);
  examine.hidden = false;

  examineTitle.textContent = data.title;
  examinePreview.resize();
  examinePreview.show(root);
  examinePreview.start();

  if (data.href) {
    examineLink.hidden = false;
    examineLink.href = data.href;
    examineLink.textContent = data.linkText;
  } else {
    examineLink.hidden = true;
  }

  found.add(id);
  setTicker(data.found);
  setCompass(fmt(copy.hud.compassExamining, { title: data.title.toUpperCase() }));

  typeText(examineBody, data.body.trim(), () => {
    if ([...primaryIds].every((pid) => found.has(pid))) {
      setTicker(copy.ticker.primaryComplete.trim());
    }
  });

  examine.querySelector(".examine__close")?.focus();
}

function closeExamine() {
  if (!examining) return;
  examining = false;
  document.body.classList.remove("is-examining");
  examine.hidden = true;
  examinePreview.stop();
  if (typeTimer) clearInterval(typeTimer);
  setCompass(copy.hud.compassIdle);
  if (isTouch) centerAim();
  else showAim(true);
  if (found.size === 0) {
    setTicker((isTouch ? copy.ticker.introTouch || copy.ticker.idle : copy.ticker.idle).trim());
  } else if (found.size < propRoots.length) {
    setTicker(
      fmt(copy.ticker.progress, {
        count: found.size,
        plural: found.size > 1 ? "s" : "",
      })
    );
  } else {
    setTicker(copy.ticker.complete.trim());
  }
}

examine?.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", closeExamine);
});

function openAbout(e) {
  e?.preventDefault?.();
  if (examining) closeExamine();
  aboutOpen = true;
  document.body.classList.add("is-about");
  about?.removeAttribute("hidden");
  menuToggle?.setAttribute("aria-expanded", "true");
  menuToggle?.setAttribute("aria-label", copy.hud.menuClose);
  if (prompt) prompt.hidden = true;
  showAim(false);
  about?.querySelector(".about__close")?.focus();
}

function closeAbout() {
  aboutOpen = false;
  document.body.classList.remove("is-about");
  about?.setAttribute("hidden", "");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", copy.hud.menuOpen);
  if (isTouch && live) centerAim();
  else if (live) showAim(true);
  menuToggle?.focus();
}

menuToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (aboutOpen) closeAbout();
  else openAbout(e);
});

brandLink?.addEventListener("click", (e) => {
  e.stopPropagation();
  openAbout(e);
});

about?.querySelectorAll("[data-about-close]").forEach((el) => {
  el.addEventListener("click", closeAbout);
});

if (isTouch) {
  centerAim();

  window.addEventListener("pointerdown", (e) => {
    if (!live || examining || aboutOpen || isUiTarget(e.target)) return;
    touchDrag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startYaw: lookYaw,
      startPitch: lookPitch,
      moved: false,
    };
    try {
      canvas.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!touchDrag || e.pointerId !== touchDrag.id) return;
    if (examining || aboutOpen) return;
    const dx = e.clientX - touchDrag.x;
    const dy = e.clientY - touchDrag.y;
    if (Math.hypot(dx, dy) > TAP_PX) {
      touchDrag.moved = true;
      touchPromptReady = true;
    }
    if (touchDrag.moved) {
      lookYaw = THREE.MathUtils.clamp(
        touchDrag.startYaw - dx * LOOK_SENS,
        -LOOK_YAW_MAX,
        LOOK_YAW_MAX
      );
      lookPitch = THREE.MathUtils.clamp(
        touchDrag.startPitch - dy * LOOK_SENS,
        LOOK_PITCH_MIN - BASE_PITCH,
        LOOK_PITCH_MAX - BASE_PITCH
      );
      applyCameraLook();
      centerAim();
    }
  });

  function endTouchDrag(e) {
    if (!touchDrag || e.pointerId !== touchDrag.id) return;
    const wasTap = !touchDrag.moved;
    const tapX = e.clientX;
    const tapY = e.clientY;
    touchDrag = null;
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!live || examining || aboutOpen) return;
    if (wasTap) {
      touchPromptReady = true;
      updatePointer(tapX, tapY);
      aimFlashlight();
      updateHover();
      if (nearest) openExamine(nearest);
      centerAim();
    } else {
      centerAim();
      aimFlashlight();
      updateHover();
    }
  }

  window.addEventListener("pointerup", endTouchDrag);
  window.addEventListener("pointercancel", endTouchDrag);
} else {
  window.addEventListener("pointermove", (e) => {
    if (examining || aboutOpen) return;
    updatePointer(e.clientX, e.clientY);
  });

  window.addEventListener("click", (e) => {
    if (!live || examining || aboutOpen) return;
    if (isUiTarget(e.target)) return;
    updatePointer(e.clientX, e.clientY);
    aimFlashlight();
    updateHover();
    if (nearest) openExamine(nearest);
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (aboutOpen) {
      closeAbout();
      return;
    }
    if (live) closeExamine();
  }
  if (!live) {
    if (e.key === "Enter" || e.key === " ") {
      if (aboutOpen) return;
      e.preventDefault();
      enterRoom();
    }
    return;
  }
  if (
    (e.key === "e" || e.key === "E" || e.key === "Enter") &&
    nearest &&
    !examining &&
    !aboutOpen
  ) {
    e.preventDefault();
    openExamine(nearest);
  }
});

function handleResize() {
  const { w, h } = viewSize();
  camera.aspect = w / h;
  camera.fov = baseFov();
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  examinePreview.resize();
  if (isTouch && live && !examining && !aboutOpen) {
    centerAim();
  }
}

window.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("resize", handleResize);

let t = 0;
let stormFlash = 0;
const _stormColor = new THREE.Color();

function updateStormLight() {
  const { hot } = storm.sampleStorm();
  const strike = THREE.MathUtils.clamp(hot / 0.012, 0, 1);
  stormFlash = strike > stormFlash ? strike : THREE.MathUtils.lerp(stormFlash, strike, 0.14);
  const target = 0.38 + stormFlash * 18;
  windowGlow.intensity = THREE.MathUtils.lerp(windowGlow.intensity, target, 0.7);
  _stormColor.setRGB(
    THREE.MathUtils.lerp(0.42, 0.92, stormFlash),
    THREE.MathUtils.lerp(0.56, 0.94, stormFlash),
    THREE.MathUtils.lerp(0.72, 1, stormFlash)
  );
  windowGlow.color.lerp(_stormColor, 0.55);
}

function animate() {
  requestAnimationFrame(animate);
  t += 0.016;

  if (!reduceMotion) {
    if (lowPower) {
      if ((t * 60 | 0) % 2 === 0) updateStormLight();
    } else {
      updateStormLight();
    }
  }

  if (live && !examining && !aboutOpen) {
    aimFlashlight();
    updateHover();
    // subtle flicker
    if (!reduceMotion) {
      const jitter = lowPower ? 0.04 : 0.08;
      flashlight.intensity += (Math.random() - 0.5) * jitter;
      flashlight.intensity = THREE.MathUtils.clamp(
        flashlight.intensity,
        nearest ? 8.6 : 7.8,
        nearest ? 9.8 : 9.0
      );
    }
  }

  renderer.render(scene, camera);
}

animate();

if (reduceMotion) {
  bootLines.forEach((l) => l.classList.add("is-shown"));
  bootPrompt?.classList.add("is-shown");
}
