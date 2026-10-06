import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  woodMaterial,
  paintMaterial,
  loadLogoTexture,
  loadPortraitTexture,
} from "./materials.js";
import { ITEMS } from "../data/content.js";
import { publicUrl } from "../publicUrl.js";

function itemLabel(id, fallback) {
  return ITEMS[id]?.label ?? fallback;
}

const gltfLoader = new GLTFLoader();

/**
 * Orientations so fronts face the camera (+Z).
 * Computer: native screen is already on ±Z (glass is thin in Z) — never pitch it.
 * Bookcase: Y-up, front on ±Z — sit on the back wall so the front is readable.
 */
const FACE = {
  bookcase: 0,
  computer: 0,
  guitar: 0,
  runner: 0,
  dog: 0,
  mug: Math.PI / 2,
};

function markInteractable(root, id, label) {
  root.userData.id = id;
  root.userData.label = label;
  root.traverse((obj) => {
    if (!obj.isMesh) {
      return;
    }

    obj.castShadow = true;
    obj.receiveShadow = true;
    obj.userData.id = id;
    obj.userData.label = label;
  });
  return root;
}

function prepareGltfScene(scene) {
  scene.traverse((obj) => {
    if (!obj.isMesh) {
      return;
    }

    obj.castShadow = true;
    obj.receiveShadow = true;
    if (!obj.material) {
      return;
    }

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      m.side = THREE.FrontSide;
      if ("envMapIntensity" in m) m.envMapIntensity = 0.6;
    }
  });
  return scene;
}

function loadGltf(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

/**
 * Place a GLB: apply euler first, then scale so longest axis = targetSize,
 * then seat on y = yOffset (0 = floor, ~1 = desk).
 *
 * euler is XYZ in radians — pitch/yaw/roll relative to the raw export.
 */
function placeModel(object, targetSize, { euler = [0, 0, 0], yOffset = 0 } = {}) {
  object.position.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.rotation.order = "XYZ";
  object.rotation.set(euler[0], euler[1], euler[2]);
  object.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(targetSize / maxDim);
  object.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.x -= center.x;
  object.position.y += yOffset - box.min.y;
  object.position.z -= center.z;
  return object;
}

async function loadPlaced(url, targetSize, opts) {
  const gltf = await loadGltf(url);
  const model = prepareGltfScene(gltf.scene);
  return placeModel(model, targetSize, opts);
}

// Loads a GLB into group `g`; on failure warns and runs the optional fallback.
// Resolves to the placed model, or null when loading failed.
async function addPlacedModel(g, path, targetSize, opts, name, onError) {
  try {
    const model = await loadPlaced(publicUrl(path), targetSize, opts);
    g.add(model);
    return model;
  } catch (error) {
    console.warn(`${name} GLB failed`, error);
    onError?.();
    return null;
  }
}

function framedPicture(g, frameSize, pictureSize, tex) {
  const frameMat = woodMaterial(0x3a2a1c, 0.65);
  const [fw, fh] = frameSize;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.06), frameMat);
  g.add(frame);
  const [pw, ph] = pictureSize;
  const pic = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.92,
      metalness: 0.02,
      color: 0xb9a88a,
    })
  );
  pic.position.z = 0.035;
  g.add(pic);
}

async function bookshelf() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/bookcase.glb",
    2.2,
    {
      euler: [0, FACE.bookcase, 0],
    },
    "Bookcase"
  );
  // On the back wall so shelves face into the room / camera
  g.position.set(-2.8, 0, -4.55);
  return markInteractable(g, "bookshelf", itemLabel("bookshelf", "Bookshelf"));
}

async function deskComputer() {
  const g = new THREE.Group();
  const wood = woodMaterial(0x5a4030, 0.8);

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1), wood);
  top.position.y = 0.95;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  const legGeo = new THREE.BoxGeometry(0.1, 0.95, 0.1);
  for (const [x, y, z] of [
    [-0.95, 0.475, -0.4],
    [0.95, 0.475, -0.4],
    [-0.95, 0.475, 0.4],
    [0.95, 0.475, 0.4],
  ]) {
    const leg = new THREE.Mesh(legGeo, wood);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    g.add(leg);
  }

  // New CRT model is Y-up; yaw only so the screen faces the camera
  const model = await addPlacedModel(
    g,
    "/models/computer.glb",
    0.75,
    {
      euler: [0, FACE.computer, 0],
      yOffset: 1,
    },
    "Computer"
  );
  if (model) {
    model.position.x -= 0.15;
    model.position.z += 0.02;
  }

  g.position.set(0.2, 0, -3.5);
  return markInteractable(g, "computer", itemLabel("computer", "Computer"));
}

async function guitar() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/guitar.glb",
    1.35,
    {
      euler: [0, FACE.guitar, -0.1],
    },
    "Guitar"
  );
  g.position.set(3.7, 0, -3.7);
  return markInteractable(g, "guitar", itemLabel("guitar", "Guitar"));
}

async function runner() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/runner.glb",
    0.42,
    {
      euler: [0, FACE.runner, 0],
      yOffset: 1,
    },
    "Runner"
  );
  g.position.set(0.9, 0, -3.35);
  return markInteractable(g, "runner", itemLabel("runner", "Running statue"));
}

async function dog() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/dog.glb",
    0.65,
    {
      euler: [0, FACE.dog, 0],
    },
    "Dog"
  );
  g.position.set(1.6, 0, -2.2);
  return markInteractable(g, "dog", itemLabel("dog", "Robot dog"));
}

async function mug() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/mug.glb",
    0.28,
    {
      euler: [0, FACE.mug, 0],
      yOffset: 1,
    },
    "Mug",
    () => {
      const fallback = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.065, 0.14, 20),
        paintMaterial(0xc4c4c4, 0.45)
      );
      fallback.position.y = 1.07;
      g.add(fallback);
    }
  );
  // Left of the computer, inset from the desk’s front edge
  g.position.set(-0.7, 0, -3.4);
  return markInteractable(g, "mug", itemLabel("mug", "Coffee mug"));
}

async function textlayerFrame() {
  const g = new THREE.Group();
  framedPicture(g, [0.78, 0.78], [0.62, 0.62], await loadLogoTexture());
  // Right of the portrait, where the calendar hung
  g.position.set(1.05, 3.2, -4.92);
  return markInteractable(g, "textlayer", itemLabel("textlayer", "Textlayer"));
}

async function photo() {
  const g = new THREE.Group();
  framedPicture(g, [0.72, 0.9], [0.58, 0.74], await loadPortraitTexture());
  g.position.set(-0.5, 3.2, -4.92);
  return markInteractable(g, "photo", itemLabel("photo", "Photograph"));
}

function passport() {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.02, 0.38),
    paintMaterial(0x1e3a28, 0.7)
  );
  g.add(cover);
  const seal = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 16),
    new THREE.MeshStandardMaterial({
      color: 0xc9b27a,
      metalness: 0.6,
      roughness: 0.4,
    })
  );
  seal.rotation.x = -Math.PI / 2;
  seal.position.y = 0.012;
  g.add(seal);
  // Flat cover is only a few pixels tall from the camera, so a larger
  // invisible volume catches clicks aimed at the folder.
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.14, 0.44),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  hit.position.y = 0.07;
  hit.castShadow = false;
  hit.receiveShadow = false;
  hit.userData.isHitProxy = true;
  g.add(hit);
  // Right side of the desk, clear of the computer and the runner
  g.position.set(1.14, 1.02, -3.16);
  const folder = markInteractable(g, "passport", itemLabel("passport", "Travel folder"));
  hit.castShadow = false;
  hit.receiveShadow = false;
  return folder;
}

async function chair() {
  const g = new THREE.Group();
  // Face the desk, yawed slightly inward toward the desk center
  await addPlacedModel(
    g,
    "/models/chair.glb",
    1.05,
    {
      euler: [0, -0.28, 0],
    },
    "Chair"
  );
  g.position.set(0.35, 0, -2.35);
  return g;
}

async function carpet() {
  const g = new THREE.Group();
  await addPlacedModel(
    g,
    "/models/carpet.glb",
    3.6,
    {
      euler: [0, Math.PI / 8, 0],
      yOffset: 0.01,
    },
    "Carpet"
  );
  g.position.set(0.4, 0, -2);
  return g;
}

export async function createProps() {
  return Promise.all([
    bookshelf(),
    deskComputer(),
    guitar(),
    runner(),
    mug(),
    dog(),
    textlayerFrame(),
    Promise.resolve(passport()),
    photo(),
  ]);
}

/**
Non-interactive room decoration (not raycast / examine targets).
*/
export async function createDecor() {
  return Promise.all([chair(), carpet()]);
}
