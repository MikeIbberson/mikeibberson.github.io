import * as THREE from "three";

/**
 * Spinning preview of a cloned prop mesh for the examine panel.
 * @param {HTMLCanvasElement} canvas
 * @param {{ lowPower?: boolean }} [opts]
 */
export function createExaminePreview(canvas, opts = {}) {
  const lowPower = !!opts.lowPower;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    alpha: true,
    powerPreference: lowPower ? "low-power" : "default",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.25 : 2));
  renderer.setSize(canvas.clientWidth || 260, canvas.clientHeight || 260, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.4, 3.2);

  const hemi = new THREE.HemisphereLight(0xb0c4de, 0x22180e, 0.7);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe6c0, 1.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0x5cff8a, 0.35, 10);
  fill.position.set(-2, 1, 2);
  scene.add(fill);

  let current = null;
  let raf = 0;
  let active = false;

  function fitCamera(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    camera.position.set(maxDim * 1.8, maxDim * 0.55, maxDim * 2.4);
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
    current.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone();
        o.material.emissive = new THREE.Color(0x000000);
        o.material.emissiveIntensity = 0;
      }
    });
    scene.add(current);
    fitCamera(current);
  }

  function start() {
    if (active) return;
    active = true;
    const loop = () => {
      if (!active) return;
      if (current) current.rotation.y += lowPower ? 0.008 : 0.012;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  function stop() {
    active = false;
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
