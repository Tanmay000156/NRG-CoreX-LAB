/**
 * Chem3D Studio - Molecular Mechanics & Interactive Deformation Physics
 * Implements real-time VSEPR angle bending, harmonic bond stretching,
 * van der Waals repulsion, thermal agitation, and automatic hydrogen saturation.
 */

export class MolecularPhysics {
  constructor(graph) {
    this.graph = graph;
    this.enabled = true;
    this.damping = 0.82;
    this.timeStep = 0.035;
    this.temperature = 0; // 0 to 500 Kelvin (thermal vibration)
    this.draggedAtom = null;
    this.dragTargetPosition = (typeof THREE !== "undefined") ? new THREE.Vector3() : { x: 0, y: 0, z: 0 };
    
    // Force constants
    this.kBond = 28.0;         // Bond spring stiffness
    this.kAngle = 12.0;        // VSEPR angle bending stiffness
    this.kRepulsion = 1.8;     // Non-bonded steric clash repulsion
    this.kVdWCutoff = 4.5;     // Ångströms cutoff for vdW
  }

  setTemperature(kelvin) {
    this.temperature = Math.max(0, Math.min(600, kelvin));
  }

  startDragging(atom, targetPos) {
    this.draggedAtom = atom;
    this.dragTargetPosition.copy ? this.dragTargetPosition.copy(targetPos) : Object.assign(this.dragTargetPosition, targetPos);
  }

  updateDragTarget(targetPos) {
    if (this.dragTargetPosition.copy) {
      this.dragTargetPosition.copy(targetPos);
    } else {
      Object.assign(this.dragTargetPosition, targetPos);
    }
  }

  stopDragging() {
    this.draggedAtom = null;
  }

  /**
   * Main physics step - runs in requestAnimationFrame
   */
  step() {
    if (!this.enabled && !this.draggedAtom) return;

    const atoms = this.graph.atoms;
    const bonds = this.graph.bonds;

    // Reset forces
    for (const a of atoms) {
      a.force.set ? a.force.set(0, 0, 0) : (a.force = { x: 0, y: 0, z: 0 });
    }

    // 1. Bond Stretch / Compression Forces (Hooke's Law: F = -k (r - r0))
    for (const b of bonds) {
      const a1 = b.atom1;
      const a2 = b.atom2;
      const dx = a2.position.x - a1.position.x;
      const dy = a2.position.y - a1.position.y;
      const dz = a2.position.z - a1.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      const r0 = b.getIdealLength();

      const delta = dist - r0;
      const fMag = this.kBond * delta;

      const fx = (dx / dist) * fMag;
      const fy = (dy / dist) * fMag;
      const fz = (dz / dist) * fMag;

      a1.force.x += fx;
      a1.force.y += fy;
      a1.force.z += fz;

      a2.force.x -= fx;
      a2.force.y -= fy;
      a2.force.z -= fz;
    }

    // 2. VSEPR Angle Bending Forces
    // For every atom with >= 2 bonded neighbors, penalize deviation from target angle
    for (const central of atoms) {
      const neighbors = central.getNeighbors();
      if (neighbors.length < 2) continue;

      const targetAngleDeg = this.getTargetAngle(central, neighbors.length);
      const targetRad = (targetAngleDeg * Math.PI) / 180;

      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const n1 = neighbors[i];
          const n2 = neighbors[j];

          // Vector central -> n1
          const v1x = n1.position.x - central.position.x;
          const v1y = n1.position.y - central.position.y;
          const v1z = n1.position.z - central.position.z;
          const len1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z) || 0.001;

          // Vector central -> n2
          const v2x = n2.position.x - central.position.x;
          const v2y = n2.position.y - central.position.y;
          const v2z = n2.position.z - central.position.z;
          const len2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z) || 0.001;

          const dot = (v1x * v2x + v1y * v2y + v1z * v2z) / (len1 * len2);
          const currentAngle = Math.acos(Math.max(-1, Math.min(1, dot)));
          const angleDiff = currentAngle - targetRad;

          // Cross product to find perpendicular bending vector
          const cx = v1y * v2z - v1z * v2y;
          const cy = v1z * v2x - v1x * v2z;
          const cz = v1x * v2y - v1y * v2x;
          const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz) || 0.001;

          // Force normal to v1 in the plane of v1 & v2
          // p1 = cross(v1, cross(v1, v2))
          const p1x = (v1y * cz - v1z * cy) / (len1 * cLen);
          const p1y = (v1z * cx - v1x * cz) / (len1 * cLen);
          const p1z = (v1x * cy - v1y * cx) / (len1 * cLen);

          const p2x = (v2y * (-cz) - v2z * (-cy)) / (len2 * cLen);
          const p2y = (v2z * (-cx) - v2x * (-cz)) / (len2 * cLen);
          const p2z = (v2x * (-cy) - v2y * (-cx)) / (len2 * cLen);

          const torque = this.kAngle * angleDiff;
          n1.force.x -= p1x * torque;
          n1.force.y -= p1y * torque;
          n1.force.z -= p1z * torque;

          n2.force.x -= p2x * torque;
          n2.force.y -= p2y * torque;
          n2.force.z -= p2z * torque;

          central.force.x += (p1x + p2x) * torque;
          central.force.y += (p1y + p2y) * torque;
          central.force.z += (p1z + p2z) * torque;
        }
      }
    }

    // 3. Non-bonded Steric Repulsion (Prevents atomic overlap)
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a1 = atoms[i];
        const a2 = atoms[j];
        // Skip directly bonded atoms
        if (this.graph.getBondBetween(a1, a2)) continue;

        const dx = a2.position.x - a1.position.x;
        const dy = a2.position.y - a1.position.y;
        const dz = a2.position.z - a1.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

        const rVdW = (a1.element.vdwRadius || 1.6) + (a2.element.vdwRadius || 1.6);
        if (dist < rVdW * 1.1) {
          const overlap = (rVdW * 1.1) - dist;
          const repForce = this.kRepulsion * Math.pow(overlap, 2);

          const fx = (dx / dist) * repForce;
          const fy = (dy / dist) * repForce;
          const fz = (dz / dist) * repForce;

          a1.force.x -= fx;
          a1.force.y -= fy;
          a1.force.z -= fz;

          a2.force.x += fx;
          a2.force.y += fy;
          a2.force.z += fz;
        }
      }
    }

    // 4. Thermal Agitation (Jiggle / Temperature)
    if (this.temperature > 0) {
      const amp = (this.temperature / 300) * 0.45;
      for (const a of atoms) {
        if (a === this.draggedAtom) continue;
        a.force.x += (Math.random() - 0.5) * amp;
        a.force.y += (Math.random() - 0.5) * amp;
        a.force.z += (Math.random() - 0.5) * amp;
      }
    }

    // 5. Apply Dragging Constraint
    if (this.draggedAtom) {
      const springK = 80.0;
      const dx = this.dragTargetPosition.x - this.draggedAtom.position.x;
      const dy = this.dragTargetPosition.y - this.draggedAtom.position.y;
      const dz = this.dragTargetPosition.z - this.draggedAtom.position.z;

      this.draggedAtom.force.x += dx * springK;
      this.draggedAtom.force.y += dy * springK;
      this.draggedAtom.force.z += dz * springK;
      this.draggedAtom.position.set ? 
        this.draggedAtom.position.set(this.dragTargetPosition.x, this.dragTargetPosition.y, this.dragTargetPosition.z) :
        Object.assign(this.draggedAtom.position, this.dragTargetPosition);
      this.draggedAtom.velocity.set ? this.draggedAtom.velocity.set(0, 0, 0) : (this.draggedAtom.velocity = { x: 0, y: 0, z: 0 });
    }

    // 6. Integration (Euler with velocity damping)
    for (const a of atoms) {
      if (a === this.draggedAtom) continue;

      const mass = a.element.mass || 12.0;
      const ax = a.force.x / mass;
      const ay = a.force.y / mass;
      const az = a.force.z / mass;

      a.velocity.x = (a.velocity.x + ax * this.timeStep) * this.damping;
      a.velocity.y = (a.velocity.y + ay * this.timeStep) * this.damping;
      a.velocity.z = (a.velocity.z + az * this.timeStep) * this.damping;

      // Cap maximum velocity for stability
      const vMag = Math.sqrt(a.velocity.x * a.velocity.x + a.velocity.y * a.velocity.y + a.velocity.z * a.velocity.z);
      if (vMag > 5.0) {
        a.velocity.x = (a.velocity.x / vMag) * 5.0;
        a.velocity.y = (a.velocity.y / vMag) * 5.0;
        a.velocity.z = (a.velocity.z / vMag) * 5.0;
      }

      a.position.x += a.velocity.x * this.timeStep;
      a.position.y += a.velocity.y * this.timeStep;
      a.position.z += a.velocity.z * this.timeStep;
    }
  }

  /**
   * Determine ideal VSEPR angle based on hybridization and coordination
   */
  getTargetAngle(central, numNeighbors) {
    const hyb = central.hybridization;
    if (hyb === "sp") return 180.0;
    if (hyb === "sp2") return 120.0;
    if (hyb === "sp3") {
      if (central.symbol === "O") return 104.5; // Water bent
      if (central.symbol === "N") return 107.3; // Ammonia trigonal pyramidal
      return 109.47; // Ideal tetrahedral
    }
    if (hyb === "sp3d") return 120.0;
    if (hyb === "sp3d2") return 90.0;

    // Fallbacks
    if (numNeighbors === 2) return 180.0;
    if (numNeighbors === 3) return 120.0;
    if (numNeighbors === 4) return 109.5;
    return 109.5;
  }

  /**
   * Clean & Optimize 3D Geometry: Multi-pass steepest descent relaxation
   */
  optimizeGeometry(steps = 150) {
    const oldTemp = this.temperature;
    this.temperature = 0;
    for (let s = 0; s < steps; s++) {
      this.step();
    }
    this.temperature = oldTemp;
  }

  /**
   * Automatically saturate all unfilled valencies with Hydrogen atoms!
   */
  addHydrogens() {
    const newAtoms = [];
    const newBonds = [];
    const currentAtoms = [...this.graph.atoms];

    for (const atom of currentAtoms) {
      if (atom.symbol === "H") continue;
      const deficit = atom.getValenceDeficit();
      if (deficit <= 0) continue;

      const numToAdd = Math.floor(deficit);
      const rBond = (atom.element.covalentRadius || 0.77) + 0.31; // Bond length to H
      const vectors = this.calculateHydrogenPlacementVectors(atom, numToAdd);

      vectors.forEach(v => {
        const hPos = {
          x: atom.position.x + v.x * rBond,
          y: atom.position.y + v.y * rBond,
          z: atom.position.z + v.z * rBond
        };
        const hAtom = this.graph.addAtom("H", hPos.x, hPos.y, hPos.z);
        const bond = this.graph.addBond(atom, hAtom, 1);
        newAtoms.push(hAtom);
        newBonds.push(bond);
      });
    }

    this.graph.updateAllHybridizations();
    this.optimizeGeometry(80);
    return { newAtoms, newBonds };
  }

  /**
   * Geometry vector math to place hydrogens symmetrically in 3D
   */
  calculateHydrogenPlacementVectors(atom, count) {
    const neighbors = atom.getNeighbors();
    const existingDirs = neighbors.map(n => {
      const dx = n.position.x - atom.position.x;
      const dy = n.position.y - atom.position.y;
      const dz = n.position.z - atom.position.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      return { x: dx / len, y: dy / len, z: dz / len };
    });

    const results = [];

    if (existingDirs.length === 0) {
      // 0 neighbors: build canonical frame
      if (count === 1) return [{ x: 1, y: 0, z: 0 }];
      if (count === 2) return [{ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }];
      if (count === 3) {
        return [
          { x: 1, y: 0, z: 0 },
          { x: -0.5, y: Math.sqrt(3) / 2, z: 0 },
          { x: -0.5, y: -Math.sqrt(3) / 2, z: 0 }
        ];
      }
      if (count === 4) {
        // Tetrahedral
        return [
          { x: 1, y: 1, z: 1 },
          { x: 1, y: -1, z: -1 },
          { x: -1, y: 1, z: -1 },
          { x: -1, y: -1, z: 1 }
        ].map(v => {
          const l = Math.sqrt(3);
          return { x: v.x / l, y: v.y / l, z: v.z / l };
        });
      }
    }

    if (existingDirs.length === 1) {
      const v0 = existingDirs[0];
      // Build perpendicular basis (v0, p1, p2)
      let arbitrary = Math.abs(v0.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      // p1 = cross(v0, arbitrary)
      let p1x = v0.y * arbitrary.z - v0.z * arbitrary.y;
      let p1y = v0.z * arbitrary.x - v0.x * arbitrary.z;
      let p1z = v0.x * arbitrary.y - v0.y * arbitrary.x;
      const l1 = Math.sqrt(p1x * p1x + p1y * p1y + p1z * p1z) || 1;
      p1x /= l1; p1y /= l1; p1z /= l1;

      // p2 = cross(v0, p1)
      const p2x = v0.y * p1z - v0.z * p1y;
      const p2y = v0.z * p1x - v0.x * p1z;
      const p2z = v0.x * p1y - v0.y * p1x;

      if (count === 1) {
        // Straight opposite
        return [{ x: -v0.x, y: -v0.y, z: -v0.z }];
      } else if (count === 2) {
        // Bent 109.5 or 120
        const cosTheta = -Math.cos((109.5 / 2) * (Math.PI / 180));
        const sinTheta = Math.sin((109.5 / 2) * (Math.PI / 180));
        return [
          { x: cosTheta * (-v0.x) + sinTheta * p1x, y: cosTheta * (-v0.y) + sinTheta * p1y, z: cosTheta * (-v0.z) + sinTheta * p1z },
          { x: cosTheta * (-v0.x) - sinTheta * p1x, y: cosTheta * (-v0.y) - sinTheta * p1y, z: cosTheta * (-v0.z) - sinTheta * p1z }
        ];
      } else if (count === 3) {
        // Tetrahedral umbrella pointing opposite to v0
        // angle to -v0 is 70.5° (cos = 1/3, sin = sqrt(8)/3)
        const cosA = 1 / 3;
        const sinA = Math.sqrt(8) / 3;
        for (let k = 0; k < 3; k++) {
          const phi = (k * 2 * Math.PI) / 3;
          const px = Math.cos(phi) * p1x + Math.sin(phi) * p2x;
          const py = Math.cos(phi) * p1y + Math.sin(phi) * p2y;
          const pz = Math.cos(phi) * p1z + Math.sin(phi) * p2z;
          results.push({
            x: -v0.x * cosA + px * sinA,
            y: -v0.y * cosA + py * sinA,
            z: -v0.z * cosA + pz * sinA
          });
        }
        return results;
      }
    }

    if (existingDirs.length === 2) {
      const v0 = existingDirs[0];
      const v1 = existingDirs[1];
      // Bisector pointing away from v0 and v1
      const bx = -(v0.x + v1.x);
      const by = -(v0.y + v1.y);
      const bz = -(v0.z + v1.z);
      const bLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const nbx = bx / bLen, nby = by / bLen, nbz = bz / bLen;

      // Normal to plane of v0 and v1
      const nx = v0.y * v1.z - v0.z * v1.y;
      const ny = v0.z * v1.x - v0.x * v1.z;
      const nz = v0.x * v1.y - v0.y * v1.x;
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const nnx = nx / nLen, nny = ny / nLen, nnz = nz / nLen;

      if (count === 1) {
        return [{ x: nbx, y: nby, z: nbz }];
      } else if (count === 2) {
        // Split above and below the plane (like tetrahedral CH2)
        const angle = (109.5 / 2) * (Math.PI / 180);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        return [
          { x: nbx * cosA + nnx * sinA, y: nby * cosA + nny * sinA, z: nbz * cosA + nnz * sinA },
          { x: nbx * cosA - nnx * sinA, y: nby * cosA - nny * sinA, z: nbz * cosA - nnz * sinA }
        ];
      }
    }

    if (existingDirs.length === 3) {
      // Umbrella vector opposite to the centroid of the 3 neighbors
      const sumX = -(existingDirs[0].x + existingDirs[1].x + existingDirs[2].x);
      const sumY = -(existingDirs[0].y + existingDirs[1].y + existingDirs[2].y);
      const sumZ = -(existingDirs[0].z + existingDirs[1].z + existingDirs[2].z);
      const len = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ) || 1;
      return [{ x: sumX / len, y: sumY / len, z: sumZ / len }];
    }

    // Default random outward vector
    return [{ x: 0, y: 1, z: 0 }];
  }
}

if (typeof window !== "undefined") {
  window.MolecularPhysics = MolecularPhysics;
}
