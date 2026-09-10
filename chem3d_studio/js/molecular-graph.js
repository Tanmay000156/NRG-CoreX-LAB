/**
 * Chem3D Studio - Molecular Graph Engine
 * Handles atoms, bonds, molecular topology, Hill formula calculation,
 * hybridization, rings, SMILES, and chemical file format export (MOL/XYZ/PDB).
 */

import { ELEMENTS, getElement } from './elements-data.js';

let atomCounter = 0;
let bondCounter = 0;

export class Atom {
  constructor(symbol, x = 0, y = 0, z = 0, id = null) {
    this.id = id !== null ? id : `atom_${++atomCounter}`;
    this.symbol = symbol.toUpperCase().charAt(0) + symbol.slice(1).toLowerCase();
    this.element = getElement(this.symbol);
    this.position = (typeof THREE !== "undefined") ? new THREE.Vector3(x, y, z) : { x, y, z };
    this.velocity = (typeof THREE !== "undefined") ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 };
    this.force = (typeof THREE !== "undefined") ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 };
    this.bonds = []; // list of Bond instances
    this.formalCharge = 0;
    this.partialCharge = 0;
    this.hybridization = "unknown";
    this.lonePairs = 0;
    this.selected = false;
    this.mesh = null; // Three.js mesh reference
    this.labelSprite = null;
  }

  getNeighbors() {
    return this.bonds.map(b => b.getOtherAtom(this));
  }

  getTotalBondOrder() {
    return this.bonds.reduce((sum, b) => sum + (b.order === 1.5 ? 1.5 : b.order), 0);
  }

  getValenceDeficit() {
    const totalOrder = this.getTotalBondOrder();
    const typical = this.element.typicalValency || 0;
    return typical - totalOrder;
  }

  getCoordinationNumber() {
    return this.bonds.length;
  }

  updateChargesAndHybridization() {
    const totalOrder = this.getTotalBondOrder();
    const coord = this.bonds.length;
    const valElectrons = this.element.valenceElectrons || 0;
    
    // Lone pairs calculation (octet or standard valence shell)
    // For typical main group: lonePairs = max(0, (valElectrons - totalOrder - formalCharge) / 2)
    let nonBonding = Math.max(0, valElectrons - totalOrder - this.formalCharge);
    this.lonePairs = Math.floor(nonBonding / 2);

    // Steric number = coordinated atoms + lone pairs
    const stericNumber = coord + this.lonePairs;
    if (stericNumber >= 6) {
      this.hybridization = "sp3d2"; // Octahedral
    } else if (stericNumber === 5) {
      this.hybridization = "sp3d"; // Trigonal bipyramidal
    } else if (stericNumber === 4) {
      this.hybridization = "sp3"; // Tetrahedral
    } else if (stericNumber === 3) {
      this.hybridization = "sp2"; // Trigonal planar
    } else if (stericNumber === 2) {
      this.hybridization = "sp"; // Linear
    } else {
      this.hybridization = coord === 1 ? "terminal" : "s";
    }

    // Rough partial charge estimation from neighbor electronegativities
    const myEN = this.element.electronegativity || 2.5;
    let sumDiff = 0;
    this.bonds.forEach(b => {
      const neighbor = b.getOtherAtom(this);
      const nEN = neighbor.element.electronegativity || 2.5;
      sumDiff += (nEN - myEN) * 0.15 * b.order;
    });
    this.partialCharge = +(sumDiff + this.formalCharge).toFixed(3);
  }
}

export class Bond {
  constructor(atom1, atom2, order = 1, id = null) {
    this.id = id !== null ? id : `bond_${++bondCounter}`;
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.order = order; // 1, 2, 3, or 1.5 (aromatic)
    this.mesh = null; // Three.js mesh reference
    this.selected = false;
  }

  getOtherAtom(atom) {
    if (this.atom1 === atom) return this.atom2;
    if (this.atom2 === atom) return this.atom1;
    return null;
  }

  getLength() {
    if (this.atom1.position.distanceTo) {
      return this.atom1.position.distanceTo(this.atom2.position);
    }
    const dx = this.atom1.position.x - this.atom2.position.x;
    const dy = this.atom1.position.y - this.atom2.position.y;
    const dz = this.atom1.position.z - this.atom2.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getIdealLength() {
    const r1 = this.atom1.element.covalentRadius || 0.77;
    const r2 = this.atom2.element.covalentRadius || 0.77;
    let base = (r1 + r2);
    // Shorten slightly for double and triple bonds
    if (this.order === 2) base *= 0.86;
    else if (this.order === 3) base *= 0.78;
    else if (this.order === 1.5) base *= 0.92;
    return base;
  }
}

export class MoleculeGraph {
  constructor() {
    this.atoms = [];
    this.bonds = [];
  }

  addAtom(symbol, x = 0, y = 0, z = 0, id = null) {
    const atom = new Atom(symbol, x, y, z, id);
    this.atoms.push(atom);
    this.updateAllHybridizations();
    return atom;
  }

  removeAtom(atomOrId) {
    const atom = typeof atomOrId === "string" ? this.atoms.find(a => a.id === atomOrId) : atomOrId;
    if (!atom) return false;

    // Remove all connected bonds
    const toRemoveBonds = [...atom.bonds];
    toRemoveBonds.forEach(b => this.removeBond(b));

    const idx = this.atoms.indexOf(atom);
    if (idx !== -1) {
      this.atoms.splice(idx, 1);
    }
    this.updateAllHybridizations();
    return true;
  }

  addBond(atom1, atom2, order = 1, id = null) {
    if (!atom1 || !atom2 || atom1 === atom2) return null;
    // Check if bond already exists
    const existing = this.getBondBetween(atom1, atom2);
    if (existing) {
      existing.order = order;
      this.updateAllHybridizations();
      return existing;
    }

    const bond = new Bond(atom1, atom2, order, id);
    this.bonds.push(bond);
    atom1.bonds.push(bond);
    atom2.bonds.push(bond);

    this.updateAllHybridizations();
    return bond;
  }

  removeBond(bondOrId) {
    const bond = typeof bondOrId === "string" ? this.bonds.find(b => b.id === bondOrId) : bondOrId;
    if (!bond) return false;

    const bIdx = this.bonds.indexOf(bond);
    if (bIdx !== -1) this.bonds.splice(bIdx, 1);

    const a1Idx = bond.atom1.bonds.indexOf(bond);
    if (a1Idx !== -1) bond.atom1.bonds.splice(a1Idx, 1);

    const a2Idx = bond.atom2.bonds.indexOf(bond);
    if (a2Idx !== -1) bond.atom2.bonds.splice(a2Idx, 1);

    this.updateAllHybridizations();
    return true;
  }

  getBondBetween(atom1, atom2) {
    return this.bonds.find(b => 
      (b.atom1 === atom1 && b.atom2 === atom2) || 
      (b.atom1 === atom2 && b.atom2 === atom1)
    ) || null;
  }

  clear() {
    this.atoms = [];
    this.bonds = [];
    atomCounter = 0;
    bondCounter = 0;
  }

  updateAllHybridizations() {
    this.atoms.forEach(a => a.updateChargesAndHybridization());
  }

  // Split into independent connected components
  getConnectedComponents() {
    const visited = new Set();
    const components = [];

    for (const atom of this.atoms) {
      if (!visited.has(atom)) {
        const compAtoms = [];
        const queue = [atom];
        visited.add(atom);

        while (queue.length > 0) {
          const curr = queue.shift();
          compAtoms.push(curr);
          for (const neighbor of curr.getNeighbors()) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }

        const compBonds = this.bonds.filter(b => compAtoms.includes(b.atom1) && compAtoms.includes(b.atom2));
        components.push({ atoms: compAtoms, bonds: compBonds });
      }
    }
    return components;
  }

  // Hill System formula: C first, then H, then remaining elements in alphabetical order
  calculateFormula(atomsList = null) {
    const atoms = atomsList || this.atoms;
    if (atoms.length === 0) return { plain: "", html: "" };

    const counts = {};
    for (const a of atoms) {
      counts[a.symbol] = (counts[a.symbol] || 0) + 1;
    }

    const symbols = Object.keys(counts);
    let ordered = [];

    if (counts["C"]) {
      ordered.push("C");
      if (counts["H"]) ordered.push("H");
      const rest = symbols.filter(s => s !== "C" && s !== "H").sort();
      ordered = ordered.concat(rest);
    } else {
      ordered = symbols.sort();
    }

    let plain = "";
    let html = "";

    for (const sym of ordered) {
      const count = counts[sym];
      plain += sym + (count > 1 ? count : "");
      html += sym + (count > 1 ? `<sub>${count}</sub>` : "");
    }

    return { plain, html, counts };
  }

  calculateMolecularWeight(atomsList = null) {
    const atoms = atomsList || this.atoms;
    return atoms.reduce((sum, a) => sum + (a.element.mass || 0), 0);
  }

  calculateElementalComposition(atomsList = null) {
    const atoms = atomsList || this.atoms;
    const totalMass = this.calculateMolecularWeight(atoms);
    if (totalMass === 0) return [];

    const massMap = {};
    for (const a of atoms) {
      massMap[a.symbol] = (massMap[a.symbol] || 0) + (a.element.mass || 0);
    }

    return Object.entries(massMap).map(([sym, mass]) => ({
      symbol: sym,
      mass: mass,
      percentage: +((mass / totalMass) * 100).toFixed(2),
      color: getElement(sym).cpkColor
    })).sort((a, b) => b.percentage - a.percentage);
  }

  // Dipole moment calculation (sum of q_i * r_i in Debye units, 1 e*Å ≈ 4.8 Debye)
  calculateDipoleMoment(atomsList = null) {
    const atoms = atomsList || this.atoms;
    if (atoms.length < 2) return { vector: { x: 0, y: 0, z: 0 }, magnitude: 0 };

    let dx = 0, dy = 0, dz = 0;
    // Center of mass
    let totalMass = 0;
    let cx = 0, cy = 0, cz = 0;
    atoms.forEach(a => {
      const m = a.element.mass || 12;
      totalMass += m;
      cx += a.position.x * m;
      cy += a.position.y * m;
      cz += a.position.z * m;
    });
    if (totalMass > 0) {
      cx /= totalMass; cy /= totalMass; cz /= totalMass;
    }

    atoms.forEach(a => {
      const q = a.partialCharge;
      dx += q * (a.position.x - cx);
      dy += q * (a.position.y - cy);
      dz += q * (a.position.z - cz);
    });

    const magEAngstrom = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const debye = magEAngstrom * 4.803; // convert e*Å to Debye
    return {
      vector: { x: dx, y: dy, z: dz },
      magnitude: +debye.toFixed(2)
    };
  }

  detectRings() {
    // DFS Cycle detection for small rings (3-8 atoms)
    const rings = [];
    const visited = new Set();

    const findCycles = (curr, start, path, depth) => {
      if (depth > 8) return;
      for (const neighbor of curr.getNeighbors()) {
        if (neighbor === start && depth >= 3) {
          const ringIds = [...path].map(a => a.id).sort().join(",");
          if (!rings.some(r => r.key === ringIds)) {
            rings.push({ key: ringIds, atoms: [...path] });
          }
        } else if (!visited.has(neighbor) && !path.includes(neighbor)) {
          visited.add(neighbor);
          findCycles(neighbor, start, [...path, neighbor], depth + 1);
          visited.delete(neighbor);
        }
      }
    };

    for (const a of this.atoms) {
      visited.add(a);
      findCycles(a, a, [a], 1);
    }
    return rings;
  }

  // Geometric center of molecule
  getCenter(atomsList = null) {
    const atoms = atomsList || this.atoms;
    if (atoms.length === 0) return { x: 0, y: 0, z: 0 };
    let x = 0, y = 0, z = 0;
    atoms.forEach(a => {
      x += a.position.x;
      y += a.position.y;
      z += a.position.z;
    });
    return { x: x / atoms.length, y: y / atoms.length, z: z / atoms.length };
  }

  // Measure angle between atom1 - atom2 - atom3 (atom2 is vertex)
  measureAngle(a1, a2, a3) {
    const v1 = {
      x: a1.position.x - a2.position.x,
      y: a1.position.y - a2.position.y,
      z: a1.position.z - a2.position.z
    };
    const v2 = {
      x: a3.position.x - a2.position.x,
      y: a3.position.y - a2.position.y,
      z: a3.position.z - a2.position.z
    };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const l2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (l1 * l2 === 0) return 0;
    let cosTheta = Math.max(-1, Math.min(1, dot / (l1 * l2)));
    return +(Math.acos(cosTheta) * (180 / Math.PI)).toFixed(1);
  }

  // Export to MDL MOL (V2000) format
  toMOL() {
    const now = new Date();
    let mol = `Chem3D-Studio\n  Generated by Chem3D Studio  ${now.toISOString()}\n\n`;
    const numAtoms = String(this.atoms.length).padStart(3, ' ');
    const numBonds = String(this.bonds.length).padStart(3, ' ');
    mol += `${numAtoms}${numBonds}  0  0  0  0  0  0  0  0999 V2000\n`;

    this.atoms.forEach(a => {
      const x = a.position.x.toFixed(4).padStart(10, ' ');
      const y = a.position.y.toFixed(4).padStart(10, ' ');
      const z = a.position.z.toFixed(4).padStart(10, ' ');
      const sym = a.symbol.padEnd(3, ' ');
      mol += `${x}${y}${z} ${sym} 0  0  0  0  0  0  0  0  0  0  0  0\n`;
    });

    this.bonds.forEach(b => {
      const idx1 = String(this.atoms.indexOf(b.atom1) + 1).padStart(3, ' ');
      const idx2 = String(this.atoms.indexOf(b.atom2) + 1).padStart(3, ' ');
      let orderCode = 1;
      if (b.order === 2) orderCode = 2;
      else if (b.order === 3) orderCode = 3;
      else if (b.order === 1.5) orderCode = 4; // aromatic in V2000
      mol += `${idx1}${idx2}  ${orderCode}  0  0  0  0\n`;
    });

    mol += "M  END\n";
    return mol;
  }

  // Export to XYZ format
  toXYZ() {
    let xyz = `${this.atoms.length}\nGenerated by Chem3D Studio\n`;
    this.atoms.forEach(a => {
      xyz += `${a.symbol} ${a.position.x.toFixed(4)} ${a.position.y.toFixed(4)} ${a.position.z.toFixed(4)}\n`;
    });
    return xyz;
  }

  // Export to PDB format
  toPDB() {
    let pdb = "HEADER    MOLECULE FROM CHEM3D STUDIO\n";
    this.atoms.forEach((a, i) => {
      const serial = String(i + 1).padStart(5, ' ');
      const name = a.symbol.padStart(4, ' ');
      const x = a.position.x.toFixed(3).padStart(8, ' ');
      const y = a.position.y.toFixed(3).padStart(8, ' ');
      const z = a.position.z.toFixed(3).padStart(8, ' ');
      pdb += `HETATM${serial} ${name} MOL A   1    ${x}${y}${z}  1.00  0.00          ${a.symbol.padStart(2, ' ')}\n`;
    });
    this.bonds.forEach(b => {
      const idx1 = String(this.atoms.indexOf(b.atom1) + 1).padStart(5, ' ');
      const idx2 = String(this.atoms.indexOf(b.atom2) + 1).padStart(5, ' ');
      pdb += `CONECT${idx1}${idx2}\n`;
    });
    pdb += "END\n";
    return pdb;
  }

  // Generate canonical SMILES string for organic & inorganic graphs
  toSMILES(atomsList = null) {
    const atoms = atomsList || this.atoms;
    if (atoms.length === 0) return "";
    
    // Fast lookup for monomolecular gases / ions
    if (atoms.length === 1) return `[${atoms[0].symbol}]`;

    // Simple SMILES recursive builder
    const visited = new Set();
    const ringClosures = new Map();
    let ringIndex = 1;

    // Build adjacency
    const adj = new Map();
    atoms.forEach(a => adj.set(a, []));
    this.bonds.forEach(b => {
      if (atoms.includes(b.atom1) && atoms.includes(b.atom2)) {
        adj.get(b.atom1).push({ neighbor: b.atom2, order: b.order, bond: b });
        adj.get(b.atom2).push({ neighbor: b.atom1, order: b.order, bond: b });
      }
    });

    // Start with a carbon atom, or an element with the most bonds
    const startAtom = [...atoms].sort((a, b) => {
      if (a.symbol === "C" && b.symbol !== "C") return -1;
      if (b.symbol === "C" && a.symbol !== "C") return 1;
      return b.bonds.length - a.bonds.length;
    })[0];

    const bondChar = (order) => {
      if (order === 2) return "=";
      if (order === 3) return "#";
      if (order === 1.5) return ":";
      return "";
    };

    const traverse = (atom, parentBond = null) => {
      visited.add(atom);
      let s = atom.symbol;
      if (atom.symbol !== "C" && atom.symbol !== "N" && atom.symbol !== "O" && 
          atom.symbol !== "S" && atom.symbol !== "P" && atom.symbol !== "F" && 
          atom.symbol !== "Cl" && atom.symbol !== "Br" && atom.symbol !== "I") {
        s = `[${atom.symbol}]`;
      }

      const neighbors = adj.get(atom) || [];
      const unvisited = [];

      for (const n of neighbors) {
        if (n.bond === parentBond) continue;
        if (visited.has(n.neighbor)) {
          // Ring closure
          let closureId;
          const key = [atom.id, n.neighbor.id].sort().join("-");
          if (!ringClosures.has(key)) {
            closureId = ringIndex++;
            ringClosures.set(key, closureId);
            s += `${bondChar(n.order)}${closureId}`;
          } else {
            closureId = ringClosures.get(key);
            s += `${bondChar(n.order)}${closureId}`;
          }
        } else {
          unvisited.push(n);
        }
      }

      for (let i = 0; i < unvisited.length; i++) {
        const next = unvisited[i];
        if (!visited.has(next.neighbor)) {
          const branch = bondChar(next.order) + traverse(next.neighbor, next.bond);
          if (i < unvisited.length - 1) {
            s += `(${branch})`;
          } else {
            s += branch;
          }
        }
      }
      return s;
    };

    return traverse(startAtom);
  }
}

if (typeof window !== "undefined") {
  window.Atom = Atom;
  window.Bond = Bond;
  window.MoleculeGraph = MoleculeGraph;
}
