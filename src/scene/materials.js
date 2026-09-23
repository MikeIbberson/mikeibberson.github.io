import * as THREE from "three";
import { publicUrl } from "../publicUrl.js";

export function woodMaterial(hex = 0x5a4030, roughness = 0.85, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness,
    metalness,
  });
}

export function paintMaterial(hex, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness,
    metalness: 0.02,
  });
}

export function makeNoiseTexture(size = 128, base = [60, 45, 32], variance = 18) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() - 0.5) * variance;
    const o = i * 4;
    data[o] = Math.max(0, Math.min(255, base[0] + n));
    data[o + 1] = Math.max(0, Math.min(255, base[1] + n));
    data[o + 2] = Math.max(0, Math.min(255, base[2] + n));
    data[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function makePlankTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2e2218";
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 64) {
    const base = 38 + Math.random() * 22;
    const warm = base + 28 + Math.random() * 10;
    const mid = base + 14 + Math.random() * 8;
    const cool = base + Math.random() * 6;
    const grad = ctx.createLinearGradient(0, y, 512, y + 60);
    grad.addColorStop(0, `rgb(${warm},${mid},${cool})`);
    grad.addColorStop(0.45, `rgb(${warm + 8},${mid + 4},${cool + 2})`);
    grad.addColorStop(1, `rgb(${warm - 6},${mid - 4},${cool - 2})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, 60);

    // Fine grain along the plank
    for (let i = 0; i < 90; i++) {
      const gx = Math.random() * 512;
      const gy = y + 4 + Math.random() * 52;
      ctx.strokeStyle = `rgba(${20 + Math.random() * 30},${12 + Math.random() * 18},8,${0.04 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + 40, gy + (Math.random() - 0.5) * 4, gx + 80 + Math.random() * 40, gy);
      ctx.stroke();
    }

    // Knots
    if (Math.random() > 0.55) {
      const kx = 40 + Math.random() * 430;
      const ky = y + 18 + Math.random() * 28;
      const kr = 3 + Math.random() * 5;
      const knot = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      knot.addColorStop(0, "rgba(55, 36, 22, 0.55)");
      knot.addColorStop(1, "rgba(55, 36, 22, 0)");
      ctx.fillStyle = knot;
      ctx.beginPath();
      ctx.arc(kx, ky, kr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 62);
    ctx.lineTo(512, y + 62);
    ctx.stroke();

    for (let x = 0; x < 512; x += 128) {
      const seamX = x + (y % 128 === 0 ? 0 : 64);
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.moveTo(seamX, y);
      ctx.lineTo(seamX, y + 62);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2.2);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft height variation for plank bump / roughness maps. */
export function makePlankBumpTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    const shade = 110 + Math.random() * 35;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 256, 28);
    ctx.fillStyle = "rgba(40,40,40,0.35)";
    ctx.fillRect(0, y + 29, 256, 2);
    for (let x = 0; x < 256; x += 64) {
      const seamX = x + (y % 64 === 0 ? 0 : 32);
      ctx.fillRect(seamX, y, 1, 28);
    }
  }
  for (let i = 0; i < 400; i++) {
    const g = 90 + Math.random() * 70;
    ctx.fillStyle = `rgba(${g},${g},${g},0.15)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2.2);
  return tex;
}

export function makeWallpaperTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, "#4f3f31");
  base.addColorStop(1, "#433528");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  // Soft vertical stripe pattern
  for (let x = 0; x < 256; x += 48) {
    ctx.fillStyle = "rgba(255,230,190,0.035)";
    ctx.fillRect(x + 8, 0, 14, 256);
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Damask-ish diamonds
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  for (let y = 16; y < 256; y += 48) {
    for (let x = 24; x < 256; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 10, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.09})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2);
  }

  // Water stain near bottom
  const stain = ctx.createRadialGradient(180, 230, 4, 180, 230, 50);
  stain.addColorStop(0, "rgba(30, 22, 14, 0.22)");
  stain.addColorStop(1, "rgba(30, 22, 14, 0)");
  ctx.fillStyle = stain;
  ctx.beginPath();
  ctx.arc(180, 230, 50, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4.2, 3.1);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Cover-crop + faded silver-gelatin grade so the portrait sits in the dark room. */
function vintagePortraitTexture(image, targetAspect) {
  const srcW = image.width || 1;
  const srcH = image.height || 1;
  const srcAspect = srcW / srcH;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (srcAspect > targetAspect) {
    sw = srcH * targetAspect;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / targetAspect;
    sy = (srcH - sh) / 2;
  }

  const w = 512;
  const h = Math.round(512 / targetAspect);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const cx = w * 0.5;
  const cy = h * 0.42;
  const maxR = Math.hypot(w * 0.58, h * 0.58);

  for (let i = 0; i < d.length; i += 4) {
    const y0 = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    // Slightly softer contrast, lifted blacks — old print, not a phone screen
    let y = (y0 - 128) * 0.82 + 118;
    y = Math.max(0, Math.min(255, y));
    const px = (i / 4) % w;
    const py = (i / 4 / w) | 0;
    const vig = Math.min(1, Math.hypot(px - cx, py - cy) / maxR);
    const v = 1 - vig * vig * 0.48;
    d[i] = Math.max(0, Math.min(255, (y * 1.02 + 16) * v));
    d[i + 1] = Math.max(0, Math.min(255, (y * 0.94 + 8) * v));
    d[i + 2] = Math.max(0, Math.min(255, (y * 0.72 + 2) * v));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.globalAlpha = 0.07;
  for (let n = 0; n < 1400; n++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#f0ead8" : "#1a120c";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function loadLogoTexture() {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    loader.load(
      publicUrl("/images/textlayer-logo.jpg"),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.magFilter = THREE.LinearFilter;
        resolve(tex);
      },
      undefined,
      () => {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = "#eee";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.fillText("TEXTLAYER", 128, 136);
        const fallback = new THREE.CanvasTexture(c);
        fallback.colorSpace = THREE.SRGBColorSpace;
        resolve(fallback);
      }
    );
  });
}

export function loadPortraitTexture() {
  const loader = new THREE.TextureLoader();
  const frameAspect = 0.58 / 0.74;
  return new Promise((resolve) => {
    loader.load(
      publicUrl("/images/portrait.jpg"),
      (tex) => {
        const graded = vintagePortraitTexture(tex.image, frameAspect);
        tex.dispose();
        resolve(graded);
      },
      undefined,
      () => {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 320;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, 256, 320);
        ctx.fillStyle = "#888";
        ctx.font = "20px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PORTRAIT", 128, 160);
        const fallback = new THREE.CanvasTexture(c);
        fallback.colorSpace = THREE.SRGBColorSpace;
        resolve(fallback);
      }
    );
  });
}
