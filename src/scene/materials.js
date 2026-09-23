import * as THREE from "three";
import { content } from "../data/content.js";
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
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    const shade = 40 + Math.random() * 25;
    ctx.fillStyle = `rgb(${shade + 30},${shade + 15},${shade})`;
    ctx.fillRect(0, y, 512, 60);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, y + 62);
    ctx.lineTo(512, y + 62);
    ctx.stroke();
    for (let x = 0; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x + (y % 128 === 0 ? 0 : 64), y);
      ctx.lineTo(x + (y % 128 === 0 ? 0 : 64), y + 62);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeWallpaperTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#4a3b2e";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeCalendarTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e8dcc0";
  ctx.fillRect(0, 0, 256, 320);

  const now = new Date();
  const month = now
    .toLocaleString("en-US", { month: "long" })
    .toUpperCase();
  const day = String(now.getDate());
  const cal = content.calendarTexture ?? {};

  ctx.fillStyle = "#222";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(month, 128, 48);
  ctx.fillStyle = "#8b1e1e";
  ctx.font = "bold 120px Georgia";
  ctx.fillText(day, 128, 180);
  ctx.strokeStyle = "#8b1e1e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 150, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#2a4a2a";
  ctx.font = "16px monospace";
  ctx.fillText(cal.cta ?? "GET IN TOUCH →", 128, 260);
  const tex = new THREE.CanvasTexture(c);
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
