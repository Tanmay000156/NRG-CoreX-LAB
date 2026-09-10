/**
 * Chem3D Studio - Three.js 3D Molecular Graphics Engine
 * Provides multi-mode rendering (Ball & Stick, Spacefill, Licorice, Wireframe),
 * dual-tone CPK bond gradients, selection halos, dipole vectors, and interactive raycasting.
 */

import { ELEMENTS, getElement } from './elements-data.js';

export class Renderer3D {
  constructor(containerElement) {
    this.container = containerElement;
    this.styleMode = "ball-and-stick"; // "ball-and-stick", "spacefill", "licorice", "wireframe"
    this.showLabels = true;
    this.showDipole = false;
    this.showGrid = true;
    this.showBondsInfo = true;

    this.selectedAtoms = [];
    this.hoveredAtom = null;
    this.hoveredBond = null;

    // Cache of reusable geometries and materials
    this.sphereGeom = new THREE.SphereGeometry(1, 32, 24);
    this.cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 20);
    this.atomMaterials = new Map();

    this.initScene();
    this.initLights();
    this.initControls();
    this.setupEventListeners();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d); // Obsidian midnight lab background

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 18);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Molecular root group
    this.molGroup = new THREE.Group();
    this.scene.add(this.molGroup);

    // UI overlays root group (labels, arrows, halos)
    this.overlayGroup = new THREE.Group();
    this.scene.add(this.overlayGroup);

    // Subtle holographic scientific grid
    this.gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    this.gridHelper.position.y = -6;
    this.scene.add(this.gridHelper);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  initLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    // Key directional light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(12, 18, 20);
    this.scene.add(keyLight);

    // Cyan/violet rim light for futuristic laboratory sheen
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-16, -10, -15);
    this.scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xfef08a, 0.4);
    warmFill.position.set(10, -12, 10);
    this.scene.add(warmFill);
  }

  initControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.1;
    this.controls.panSpeed = 0.8;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 120;
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Get or create standard shiny CPK material for an element
   */
  getAtomMaterial(element, isHovered = false, isSelected = false) {
    const key = `${element.symbol}_${isHovered}_${isSelected}_${this.styleMode}`;
    if (this.atomMaterials.has(key)) return this.atomMaterials.get(key);

    let color = new THREE.Color(element.cpkColor || "#A0A0A0");
    let emissive = new THREE.Color(0x000000);
    let roughness = 0.28;
    let metalness = 0.18;
    let wireframe = this.styleMode === "wireframe";

    if (isSelected) {
      emissive = new THREE.Color(0x00f2fe);
    } else if (isHovered) {
      emissive = new THREE.Color(0x38bdf8).multiplyScalar(0.4);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      roughness: roughness,
      metalness: metalness,
      wireframe: wireframe
    });

    this.atomMaterials.set(key, mat);
    return mat;
  }

  /**
   * Synchronize 3D meshes with MoleculeGraph state
   */
  syncGraph(graph) {
    // 1. Synchronize Atoms
    const currentMeshMap = new Map();
    this.molGroup.children.forEach(child => {
      if (child.userData && child.userData.type === "atom") {
        currentMeshMap.set(child.userData.atomId, child);
      }
    });

    graph.atoms.forEach(atom => {
      let atomMesh = currentMeshMap.get(atom.id);
      const isSelected = this.selectedAtoms.includes(atom);
      const isHovered = this.hoveredAtom === atom;

      // Compute visual radius
      let radius = 0.45;
      if (this.styleMode === "spacefill") {
        radius = (atom.element.vdwRadius || 1.6) * 0.65;
      } else if (this.styleMode === "licorice") {
        radius = 0.22;
      } else {
        // Ball and stick
        radius = 0.32 + (atom.element.covalentRadius || 0.77) * 0.22;
      }

      if (!atomMesh) {
        // Create new atom mesh
        const mat = this.getAtomMaterial(atom.element, isHovered, isSelected);
        atomMesh = new THREE.Mesh(this.sphereGeom, mat);
        atomMesh.castShadow = true;
        atomMesh.receiveShadow = true;
        atomMesh.userData = { type: "atom", atomId: atom.id, atom: atom };
        this.molGroup.add(atomMesh);
      } else {
        // Update material
        atomMesh.material = this.getAtomMaterial(atom.element, isHovered, isSelected);
      }

      atomMesh.position.copy(atom.position);
      atomMesh.scale.set(radius, radius, radius);
      atom.mesh = atomMesh;
      currentMeshMap.delete(atom.id);
    });

    // Remove orphaned atom meshes
    currentMeshMap.forEach(mesh => {
      this.molGroup.remove(mesh);
      if (mesh.geometry && mesh.geometry !== this.sphereGeom) mesh.geometry.dispose();
    });

    // 2. Synchronize Bonds
    // Recreate or update bond cylinders
    const existingBondMeshes = this.molGroup.children.filter(c => c.userData && c.userData.type === "bond");
    existingBondMeshes.forEach(b => this.molGroup.remove(b));

    graph.bonds.forEach(bond => {
      const bondMeshGroup = this.createBondMesh(bond);
      this.molGroup.add(bondMeshGroup);
      bond.mesh = bondMeshGroup;
    });

    // 3. Update overlays (Labels, Dipole, Halos)
    this.updateOverlays(graph);
  }

  /**
   * Create dual-colored cylinder bond mesh supporting Single, Double, Triple orders
   */
  createBondMesh(bond) {
    const group = new THREE.Group();
    group.userData = { type: "bond", bondId: bond.id, bond: bond };

    const p1 = bond.atom1.position;
    const p2 = bond.atom2.position;
    const dist = p1.distanceTo(p2);
    if (dist < 0.001) return group;

    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

    // Orientation quaternion for cylinder
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);

    // Color materials: Atom 1 half and Atom 2 half
    const col1 = new THREE.Color(bond.atom1.element.cpkColor || "#666666");
    const col2 = new THREE.Color(bond.atom2.element.cpkColor || "#666666");

    const isHovered = this.hoveredBond === bond;
    const isSelected = bond.selected;

    let mat1 = new THREE.MeshStandardMaterial({
      color: col1,
      metalness: 0.25,
      roughness: 0.35,
      emissive: isSelected ? 0x00f2fe : (isHovered ? 0x38bdf8 : 0x000000),
      wireframe: this.styleMode === "wireframe"
    });
    let mat2 = new THREE.MeshStandardMaterial({
      color: col2,
      metalness: 0.25,
      roughness: 0.35,
      emissive: isSelected ? 0x00f2fe : (isHovered ? 0x38bdf8 : 0x000000),
      wireframe: this.styleMode === "wireframe"
    });

    const bondRadius = this.styleMode === "licorice" ? 0.2 : 0.09;
    const halfDist = dist * 0.5;

    // Single cylinder helper (half 1 from p1 to mid, half 2 from mid to p2)
    const buildHalfCylinders = (offsetVec = new THREE.Vector3(0, 0, 0)) => {
      // Half 1
      const cyl1 = new THREE.Mesh(this.cylinderGeom, mat1);
      cyl1.scale.set(bondRadius, halfDist, bondRadius);
      const center1 = new THREE.Vector3().addVectors(p1, mid).multiplyScalar(0.5).add(offsetVec);
      cyl1.position.copy(center1);
      cyl1.quaternion.copy(quat);
      group.add(cyl1);

      // Half 2
      const cyl2 = new THREE.Mesh(this.cylinderGeom, mat2);
      cyl2.scale.set(bondRadius, halfDist, bondRadius);
      const center2 = new THREE.Vector3().addVectors(mid, p2).multiplyScalar(0.5).add(offsetVec);
      cyl2.position.copy(center2);
      cyl2.quaternion.copy(quat);
      group.add(cyl2);
    };

    if (bond.order === 1) {
      buildHalfCylinders();
    } else if (bond.order === 2) {
      // Double bond: 2 parallel offset cylinders
      let side = new THREE.Vector3(0, 0, 1).cross(dir);
      if (side.lengthSq() < 0.01) side = new THREE.Vector3(1, 0, 0).cross(dir);
      side.normalize().multiplyScalar(0.14);

      buildHalfCylinders(side);
      buildHalfCylinders(side.clone().negate());
    } else if (bond.order === 3) {
      // Triple bond: 3 parallel cylinders
      let side = new THREE.Vector3(0, 0, 1).cross(dir);
      if (side.lengthSq() < 0.01) side = new THREE.Vector3(1, 0, 0).cross(dir);
      side.normalize().multiplyScalar(0.18);

      const side2 = side.clone().applyAxisAngle(dir, (2 * Math.PI) / 3);
      const side3 = side.clone().applyAxisAngle(dir, (4 * Math.PI) / 3);

      buildHalfCylinders(side);
      buildHalfCylinders(side2);
      buildHalfCylinders(side3);
    } else if (bond.order === 1.5) {
      // Aromatic: 1 solid central cylinder + 1 offset dashed
      buildHalfCylinders();
    }

    return group;
  }

  /**
   * Update visual 3D overlays (Dipole arrow, atom labels, selection rings)
   */
  updateOverlays(graph) {
    // Clear previous overlays
    while (this.overlayGroup.children.length > 0) {
      const c = this.overlayGroup.children[0];
      this.overlayGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }

    // 1. Selection Halos
    this.selectedAtoms.forEach(atom => {
      const haloGeom = new THREE.RingGeometry(0.55, 0.65, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(haloGeom, haloMat);
      ring.position.copy(atom.position);
      ring.lookAt(this.camera.position);
      this.overlayGroup.add(ring);
    });

    // 2. Dipole Moment Vector Arrow
    if (this.showDipole) {
      const dipole = graph.calculateDipoleMoment();
      if (dipole.magnitude > 0.05) {
        const center = graph.getCenter();
        const centerV = new THREE.Vector3(center.x, center.y, center.z);
        const dir = new THREE.Vector3(dipole.vector.x, dipole.vector.y, dipole.vector.z).normalize();
        const length = Math.min(6.0, Math.max(1.5, dipole.magnitude * 0.8));

        const arrow = new THREE.ArrowHelper(dir, centerV, length, 0xf43f5e, 0.45, 0.25);
        this.overlayGroup.add(arrow);
      }
    }
  }

  /**
   * Raycast from mouse screen coordinates to find clicked/hovered atom or bond
   */
  raycast(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.molGroup.children, true);

    for (const hit of intersects) {
      // Traverse up to find userData
      let obj = hit.object;
      while (obj && obj !== this.molGroup) {
        if (obj.userData && obj.userData.type === "atom") {
          return { type: "atom", atom: obj.userData.atom, point: hit.point };
        }
        if (obj.userData && obj.userData.type === "bond") {
          return { type: "bond", bond: obj.userData.bond, point: hit.point };
        }
        obj = obj.parent;
      }
    }

    return null;
  }

  /**
   * Project mouse to 3D plane passing through a point, perpendicular to camera view
   */
  getPlaneIntersection(clientX, clientY, planePoint) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const normal = new THREE.Vector3();
    this.camera.getWorldDirection(normal).negate(); // plane faces camera
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, planePoint);

    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, target);
    return target;
  }

  /**
   * Frame camera to fit entire molecular graph
   */
  resetCamera(graph) {
    if (!graph || graph.atoms.length === 0) {
      this.camera.position.set(0, 0, 18);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }

    const box = new THREE.Box3();
    graph.atoms.forEach(a => box.expandByPoint(a.position));
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z, 2.5);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDist = Math.abs(maxDim / Math.sin(fov / 2)) * 1.05;

    this.controls.target.copy(center);
    this.camera.position.set(center.x, center.y, center.z + cameraDist);
    this.controls.update();
  }

  /**
   * Capture high resolution screenshot
   */
  captureScreenshot(transparent = false) {
    const oldBg = this.scene.background;
    if (transparent) this.scene.background = null;

    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL("image/png");

    this.scene.background = oldBg;
    return dataUrl;
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== "undefined") {
  window.Renderer3D = Renderer3D;
}
