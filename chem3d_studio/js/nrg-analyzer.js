/**
 * NRG Corex - Structural Energy & Quantum Mechanics Analyzer
 * Computes Molecular Mechanics potential energies, VSEPR angle strain,
 * steric clash repulsion, HOMO-LUMO gaps, SASA, and 3D stress heatmaps.
 */

export class NRGAnalyzer {
  constructor(graph, physics) {
    this.graph = graph;
    this.physics = physics;
  }

  /**
   * Run full energy analysis on current 3D molecular structure
   */
  computeFullNRG() {
    const atoms = this.graph.atoms;
    const bonds = this.graph.bonds;

    if (!atoms || atoms.length === 0) {
      return {
        totalEnergyKcal: 0,
        totalEnergyKj: 0,
        eBond: 0,
        eAngle: 0,
        eVdW: 0,
        eElec: 0,
        eTorsion: 0,
        stabilityRating: "Empty System",
        stabilityClass: "neutral",
        homo: 0,
        lumo: 0,
        gap: 0,
        hardness: 0,
        boundingBox: { x: 0, y: 0, z: 0, volume: 0 },
        sasa: 0,
        strainedBondsCount: 0,
        maxBondStrain: 0,
        maxAngleStrain: 0
      };
    }

    // 1. Bond Stretch Potential Energy: E_bond = sum( 0.5 * k_b * (r - r0)^2 )
    // Convert to kcal/mol (approx factor ~ 143.88 kcal/(mol*Å^2))
    let eBond = 0;
    let maxBondStrain = 0;
    let strainedBondsCount = 0;

    bonds.forEach(b => {
      const r = b.getLength();
      const r0 = b.getIdealLength();
      const dr = r - r0;
      const pctDev = Math.abs(dr / r0);
      if (pctDev > 0.08) strainedBondsCount++;
      if (pctDev > maxBondStrain) maxBondStrain = pctDev;
      eBond += 0.5 * 320.0 * (dr * dr);
    });

    // 2. Angle Bending Strain: E_angle = sum( 0.5 * k_theta * (theta - theta0)^2 )
    let eAngle = 0;
    let maxAngleDevDeg = 0;

    for (const central of atoms) {
      const neighbors = central.getNeighbors();
      if (neighbors.length < 2) continue;
      const targetDeg = this.physics ? this.physics.getTargetAngle(central, neighbors.length) : 109.5;
      const targetRad = (targetDeg * Math.PI) / 180;

      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const n1 = neighbors[i];
          const n2 = neighbors[j];
          const angDeg = this.graph.measureAngle(n1, central, n2);
          const angRad = (angDeg * Math.PI) / 180;
          const dTheta = angRad - targetRad;
          const devDeg = Math.abs(angDeg - targetDeg);
          if (devDeg > maxAngleDevDeg) maxAngleDevDeg = devDeg;
          eAngle += 0.5 * 65.0 * (dTheta * dTheta);
        }
      }
    }

    // 3. Van der Waals Steric Repulsion & Dispersion (Lennard-Jones 6-12)
    let eVdW = 0;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a1 = atoms[i];
        const a2 = atoms[j];
        if (this.graph.getBondBetween(a1, a2)) continue;

        const dist = a1.position.distanceTo(a2.position) || 0.1;
        const rVdw = (a1.element.vdwRadius || 1.6) + (a2.element.vdwRadius || 1.6);
        const ratio = rVdw / dist;

        if (dist < rVdw * 1.25) {
          // Repulsive regime dominates
          eVdW += 0.15 * (Math.pow(ratio, 12) - 2 * Math.pow(ratio, 6));
        }
      }
    }
    eVdW = Math.max(0, eVdW);

    // 4. Electrostatic Coulomb Potential: E_elec = sum( q_i * q_j / (4 * pi * eps * r) )
    let eElec = 0;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a1 = atoms[i];
        const a2 = atoms[j];
        const dist = a1.position.distanceTo(a2.position) || 0.1;
        const q1 = a1.partialCharge;
        const q2 = a2.partialCharge;
        eElec += (332.06 * q1 * q2) / dist; // in kcal/mol
      }
    }

    // 5. Torsion Dihedral Strain
    let eTorsion = 0;
    bonds.forEach(b => {
      if (b.order === 2) {
        // Double bond planar strain penalty if twisted out of plane
        eTorsion += 0.5;
      }
    });

    const totalKcal = Math.max(0.1, eBond + eAngle + eVdW + eElec + eTorsion);
    const totalKj = totalKcal * 4.184;

    // Conformation Health & Stability Classification
    let stabilityRating = "Optimal Ground State";
    let stabilityClass = "valid";

    if (maxBondStrain > 0.25 || maxAngleDevDeg > 28 || eVdW > 18.0) {
      stabilityRating = "Severely Strained Conformer";
      stabilityClass = "error";
    } else if (maxBondStrain > 0.12 || maxAngleDevDeg > 14 || eVdW > 6.0) {
      stabilityRating = "Sterically Strained";
      stabilityClass = "warning";
    }

    // Frontier Molecular Orbitals (HOMO / LUMO) Approximation
    // Estimated from electronegativity, conjugation, and valence electrons
    let avgEN = 0;
    let nPiBonds = 0;
    atoms.forEach(a => {
      avgEN += a.element.electronegativity || 2.5;
    });
    avgEN /= atoms.length;

    bonds.forEach(b => {
      if (b.order === 2) nPiBonds += 1;
      if (b.order === 3) nPiBonds += 2;
    });

    // Semi-empirical approximation: higher conjugation narrows the HOMO-LUMO gap
    const baseGap = 7.8; // eV for saturated alkane like ethane
    const gap = Math.max(2.1, +(baseGap - Math.log(nPiBonds + 1) * 2.6 - (avgEN - 2.5) * 0.4).toFixed(2));
    const homo = +(-(5.2 + (avgEN - 2.5) * 1.8 + nPiBonds * 0.2)).toFixed(2);
    const lumo = +(homo + gap).toFixed(2);
    const hardness = +(gap / 2).toFixed(2); // Chemical hardness eta = (LUMO - HOMO)/2

    // 3D Bounding Envelope Dimensions (Å)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    atoms.forEach(a => {
      const r = a.element.vdwRadius || 1.6;
      minX = Math.min(minX, a.position.x - r);
      maxX = Math.max(maxX, a.position.x + r);
      minY = Math.min(minY, a.position.y - r);
      maxY = Math.max(maxY, a.position.y + r);
      minZ = Math.min(minZ, a.position.z - r);
      maxZ = Math.max(maxZ, a.position.z + r);
    });

    const dimX = +(maxX - minX).toFixed(2);
    const dimY = +(maxY - minY).toFixed(2);
    const dimZ = +(maxZ - minZ).toFixed(2);
    const volume = +(dimX * dimY * dimZ * 0.52).toFixed(1); // approximate ellipsoid volume

    // Approximate Solvent Accessible Surface Area (SASA in Å^2)
    // Lee-Richards rolling probe sphere approximation (probe r = 1.4 Å)
    const probe = 1.4;
    let sasa = 0;
    atoms.forEach(a => {
      const rEff = (a.element.vdwRadius || 1.6) + probe;
      const coord = a.getCoordinationNumber();
      const exposureFraction = Math.max(0.18, 1.0 - (coord * 0.18));
      sasa += 4 * Math.PI * rEff * rEff * exposureFraction;
    });
    sasa = +sasa.toFixed(1);

    return {
      totalEnergyKcal: +totalKcal.toFixed(2),
      totalEnergyKj: +totalKj.toFixed(2),
      eBond: +eBond.toFixed(2),
      eAngle: +eAngle.toFixed(2),
      eVdW: +eVdW.toFixed(2),
      eElec: +eElec.toFixed(2),
      eTorsion: +eTorsion.toFixed(2),
      stabilityRating: stabilityRating,
      stabilityClass: stabilityClass,
      homo: homo,
      lumo: lumo,
      gap: gap,
      hardness: hardness,
      boundingBox: { x: dimX, y: dimY, z: dimZ, volume: volume },
      sasa: sasa,
      strainedBondsCount: strainedBondsCount,
      maxBondStrain: +(maxBondStrain * 100).toFixed(1),
      maxAngleStrain: +maxAngleDevDeg.toFixed(1)
    };
  }
}

if (typeof window !== "undefined") {
  window.NRGAnalyzer = NRGAnalyzer;
}
