import * as THREE from "three";
import { makePlankTexture, makePlankBumpTexture, makeWallpaperTexture, woodMaterial, paintMaterial } from "./materials.js";
import { publicUrl } from "../publicUrl.js";

export function createRoom() {
  const group = new THREE.Group();
  group.name = "room";

  const floorTex = makePlankTexture();
  const floorBump = makePlankBumpTexture();
  const wallTex = makeWallpaperTexture();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 10),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorBump,
      bumpScale: 0.035,
      roughness: 0.88,
      metalness: 0.03,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.position.y = 0;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.96,
    metalness: 0,
  });

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.5), wallMat);
  back.position.set(0, 2.75, -5);
  back.receiveShadow = true;
  group.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.5), wallMat.clone());
  left.position.set(-6, 2.75, 0);
  left.rotation.y = Math.PI / 2;
  left.receiveShadow = true;
  group.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.5), wallMat.clone());
  right.position.set(6, 2.75, 0);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;
  group.add(right);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 10),
    paintMaterial(0x1a1612, 1)
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5.5;
  group.add(ceiling);

  // Baseboard
  const baseMat = woodMaterial(0x2a1c12, 0.8);
  for (const x of [-5, 5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 10), baseMat);
    b.position.set(x > 0 ? 5.96 : -5.96, 0.12, 0);
    group.add(b);
  }
  const backBase = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 0.08), baseMat);
  backBase.position.set(0, 0.12, -4.96);
  group.add(backBase);

  // Crown molding strip
  const crownMat = woodMaterial(0x241810, 0.75);
  const crownBack = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 0.08), crownMat);
  crownBack.position.set(0, 5.38, -4.96);
  group.add(crownBack);
  for (const x of [-5.96, 5.96]) {
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 10), crownMat);
    crown.position.set(x, 5.38, 0);
    group.add(crown);
  }

  // Window niche — open frame so the storm plays through the glass
  const frameMat = woodMaterial(0x2a1e16, 0.7);
  const windowGroup = new THREE.Group();
  windowGroup.position.set(3.2, 3.2, -4.95);

  const frameW = 1.8;
  const frameH = 1.5;
  const paneW = 1.5;
  const paneH = 1.2;
  const frameDepth = 0.12;
  const borderX = (frameW - paneW) / 2;
  const borderY = (frameH - paneH) / 2;

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(frameW, borderY, frameDepth), frameMat);
  topRail.position.y = paneH / 2 + borderY / 2;
  const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(frameW, borderY, frameDepth), frameMat);
  bottomRail.position.y = -(paneH / 2 + borderY / 2);
  const leftStile = new THREE.Mesh(new THREE.BoxGeometry(borderX, paneH, frameDepth), frameMat);
  leftStile.position.x = -(paneW / 2 + borderX / 2);
  const rightStile = new THREE.Mesh(new THREE.BoxGeometry(borderX, paneH, frameDepth), frameMat);
  rightStile.position.x = paneW / 2 + borderX / 2;
  windowGroup.add(topRail, bottomRail, leftStile, rightStile);

  const storm = createStormPane(paneW, paneH);
  storm.mesh.position.z = -0.02;
  windowGroup.add(storm.mesh);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(paneW, paneH),
    new THREE.MeshStandardMaterial({
      color: 0xc5d5e2,
      roughness: 0.12,
      metalness: 0.04,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    })
  );
  glass.position.z = 0.07;
  glass.renderOrder = 2;
  windowGroup.add(glass);

  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, paneH, 0.08), frameMat);
  mullionV.position.z = 0.08;
  windowGroup.add(mullionV);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(paneW, 0.06, 0.08), frameMat);
  mullionH.position.z = 0.08;
  windowGroup.add(mullionH);

  // Soft sill under the window
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(frameW + 0.12, 0.06, 0.22),
    woodMaterial(0x322418, 0.72)
  );
  sill.position.set(0, -(paneH / 2 + borderY + 0.04), 0.08);
  sill.castShadow = true;
  sill.receiveShadow = true;
  windowGroup.add(sill);

  group.add(windowGroup);

  // Radiator
  const rad = new THREE.Group();
  rad.position.set(-4.2, 0.55, -4.7);
  const radMat = paintMaterial(0x4a4a4a, 0.55);
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.35), radMat);
    fin.position.x = i * 0.16;
    fin.castShadow = true;
    rad.add(fin);
  }
  group.add(rad);

  // Coat hook plate
  const hookPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.35, 0.06),
    paintMaterial(0x3a3a3a, 0.5)
  );
  hookPlate.position.set(5.2, 2.4, -4.9);
  group.add(hookPlate);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.35 })
  );
  hook.rotation.x = Math.PI / 2;
  hook.position.set(5.2, 2.25, -4.82);
  group.add(hook);

  return { group, interactables: [], storm };
}

const PANE_ASPECT_CROP = 16 / 9;

function createStormPane(paneW, paneH) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const video = document.createElement("video");
  video.src = publicUrl("/video/storm.mp4");
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = !reduceMotion;
  video.preload = "auto";
  video.playbackRate = 0.65;
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  // Keep it in the DOM without display:none — some browsers skip VideoTexture otherwise.
  video.style.cssText =
    "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.append(video);

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const repeatX = paneW / paneH / PANE_ASPECT_CROP;
  texture.repeat.set(repeatX, 1);
  texture.offset.set((1 - repeatX) / 2, 0);

  const material = new THREE.MeshBasicMaterial({ map: texture });
  material.customProgramCacheKey = () => "storm-pane";
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
       diffuseColor.rgb = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(0.42)) * 1.85;`
    );
  };

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(paneW, paneH), material);
  mesh.name = "storm-pane";

  const probe = document.createElement("canvas");
  probe.width = 32;
  probe.height = 18;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  let lastLuma = 0.08;
  let lastHot = 0;

  function sampleStorm() {
    if (video.readyState < 2) return { luma: lastLuma, hot: lastHot };
    try {
      ctx.drawImage(video, 0, 0, probe.width, probe.height);
      const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
      let sum = 0;
      let hot = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const y = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
        sum += y;
        if (y > 150) hot += 1;
      }
      lastLuma = sum / count / 255;
      lastHot = hot / count;
    } catch {
      /*
      keep the previous sample if the frame isn't readable yet
      */
    }
    return { luma: lastLuma, hot: lastHot };
  }

  async function play() {
    if (reduceMotion) return;
    try {
      await video.play();
    } catch {
      /* autoplay blocked */
    }
  }

  function pause() {
    video.pause();
  }

  if (!reduceMotion) {
    video.addEventListener("canplay", () => play(), { once: true });
  }

  return { mesh, play, pause, sampleStorm };
}
