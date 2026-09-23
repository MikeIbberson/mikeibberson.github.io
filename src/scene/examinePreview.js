import * as THREE from "three";

/**
 * Spinning preview of a cloned prop mesh for the examine panel.
 * @param {HTMLCanvasElement} canvas
 * @param {{ lowPower?: boolean }} [opts]
 */
export function createExaminePreview(canvas, opts = {}) {
  const isLowPower = !!opts.lowPower;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowPower,
    alpha: true,
    powerPreference: isLowPower ? "low-power" : "default",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1.25 : 2));
  renderer.setSize(canvas.clientWidth || 260, canvas.clientHeight || 260, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.4, 3.2);

  const hemi = new THREE.HemisphereLight(0xb0c4de, 0x22180e, 0.78);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe6c0, 1.35);
  key.position.set(2.2, 3.2, 4.2);
  scene.add(key);
  const fill = new THREE.PointLight(0x5cff8a, 0.42, 12);
  fill.position.set(-2.2, 1.1, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x6a90b8, 0.35);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  let current = null;
  let raf = 0;
  let isActive = false;
  let spin = 0;
  let intro = 0;

  function fitCamera(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    camera.position.set(maxDim * 1.75, maxDim * 0.52, maxDim * 2.35);
    camera.near = maxDim / 100;
    camera.far = maxDim * 20;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  function show(sourceGroup) {
    if (current) {
      scene.remove(current);
      current.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
      });
      current = null;
    }
    current = sourceGroup.clone(true);
    // Drop invisible click proxies so they don't inflate the framing
    const drop = [];
    current.traverse((o) => {
      if (o.userData?.isHitProxy) drop.push(o);
    });
    for (const o of drop) o.parent?.remove(o);

    current.traverse((o) => {
      if (!(o.isMesh && o.material)) {
        return;
      }

      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = Array.isArray(o.material)
        ? mats.map((m) => m.clone())
        : mats[0].clone();
      const cloned = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of cloned) {
        if (!("emissive" in m)) {
          continue;
        }

        m.emissive = new THREE.Color(0x000000);
        m.emissiveIntensity = 0;
      }
    });
    spin = 0.35;
    intro = 0;
    current.scale.setScalar(0.92);
    scene.add(current);
    fitCamera(current);
  }

  function start() {
    if (isActive) return;
    isActive = true;
    const loop = () => {
      if (!isActive) return;
      if (current) {
        if (reduceMotion) {
          current.scale.setScalar(1);
        } else {
          intro = Math.min(1, intro + 0.045);
          const s = THREE.MathUtils.lerp(0.92, 1, intro);
          current.scale.setScalar(s);
          spin += isLowPower ? 0.007 : 0.011;
          current.rotation.y = spin;
          current.rotation.x = Math.sin(spin * 0.65) * 0.04;
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  function stop() {
    isActive = false;
    cancelAnimationFrame(raf);
  }

  function resize() {
    const w = canvas.clientWidth || 260;
    const h = canvas.clientHeight || 260;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return { show, start, stop, resize };
}
