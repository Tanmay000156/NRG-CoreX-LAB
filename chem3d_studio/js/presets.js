/**
 * Chem3D Studio - Preset Molecules Library
 * Pre-configured 3D molecular structures with accurate coordinates and bond orders.
 */

export const PRESETS = {
  water: {
    name: "Water (H₂O)",
    formula: "H2O",
    category: "Inorganic",
    atoms: [
      { sym: "O", x: 0, y: 0, z: 0 },
      { sym: "H", x: 0.957, y: 0, z: 0 },
      { sym: "H", x: -0.24, y: 0.927, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 0, a2: 2, order: 1 }
    ]
  },
  methane: {
    name: "Methane (CH₄)",
    formula: "CH4",
    category: "Alkane",
    atoms: [
      { sym: "C", x: 0, y: 0, z: 0 },
      { sym: "H", x: 0.628, y: 0.628, z: 0.628 },
      { sym: "H", x: -0.628, y: -0.628, z: 0.628 },
      { sym: "H", x: -0.628, y: 0.628, z: -0.628 },
      { sym: "H", x: 0.628, y: -0.628, z: -0.628 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 },
      { a1: 0, a2: 4, order: 1 }
    ]
  },
  ammonia: {
    name: "Ammonia (NH₃)",
    formula: "H3N",
    category: "Inorganic",
    atoms: [
      { sym: "N", x: 0, y: 0, z: 0.116 },
      { sym: "H", x: 0, y: 0.94, z: -0.27 },
      { sym: "H", x: 0.814, y: -0.47, z: -0.27 },
      { sym: "H", x: -0.814, y: -0.47, z: -0.27 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 }
    ]
  },
  carbon_dioxide: {
    name: "Carbon Dioxide (CO₂)",
    formula: "CO2",
    category: "Inorganic",
    atoms: [
      { sym: "C", x: 0, y: 0, z: 0 },
      { sym: "O", x: -1.16, y: 0, z: 0 },
      { sym: "O", x: 1.16, y: 0, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 2 },
      { a1: 0, a2: 2, order: 2 }
    ]
  },
  ethene: {
    name: "Ethene (C₂H₄)",
    formula: "C2H4",
    category: "Alkene",
    atoms: [
      { sym: "C", x: -0.665, y: 0, z: 0 },
      { sym: "C", x: 0.665, y: 0, z: 0 },
      { sym: "H", x: -1.23, y: 0.92, z: 0 },
      { sym: "H", x: -1.23, y: -0.92, z: 0 },
      { sym: "H", x: 1.23, y: 0.92, z: 0 },
      { sym: "H", x: 1.23, y: -0.92, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 2 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 },
      { a1: 1, a2: 4, order: 1 },
      { a1: 1, a2: 5, order: 1 }
    ]
  },
  ethyne: {
    name: "Ethyne / Acetylene (C₂H₂)",
    formula: "C2H2",
    category: "Alkyne",
    atoms: [
      { sym: "C", x: -0.6, y: 0, z: 0 },
      { sym: "C", x: 0.6, y: 0, z: 0 },
      { sym: "H", x: -1.66, y: 0, z: 0 },
      { sym: "H", x: 1.66, y: 0, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 3 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 1, a2: 3, order: 1 }
    ]
  },
  ethanol: {
    name: "Ethanol (C₂H₅OH)",
    formula: "C2H6O",
    category: "Alcohol",
    atoms: [
      { sym: "C", x: -1.2, y: -0.2, z: 0 },
      { sym: "C", x: 0.1, y: 0.5, z: 0 },
      { sym: "O", x: 1.2, y: -0.3, z: 0 },
      { sym: "H", x: -1.2, y: -0.8, z: 0.9 },
      { sym: "H", x: -1.2, y: -0.8, z: -0.9 },
      { sym: "H", x: -2.0, y: 0.5, z: 0 },
      { sym: "H", x: 0.1, y: 1.1, z: 0.9 },
      { sym: "H", x: 0.1, y: 1.1, z: -0.9 },
      { sym: "H", x: 2.0, y: 0.1, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 1, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 },
      { a1: 0, a2: 4, order: 1 },
      { a1: 0, a2: 5, order: 1 },
      { a1: 1, a2: 6, order: 1 },
      { a1: 1, a2: 7, order: 1 },
      { a1: 2, a2: 8, order: 1 }
    ]
  },
  acetone: {
    name: "Acetone (C₃H₆O)",
    formula: "C3H6O",
    category: "Ketone",
    atoms: [
      { sym: "C", x: 0, y: 0.2, z: 0 },
      { sym: "O", x: 0, y: 1.4, z: 0 },
      { sym: "C", x: -1.3, y: -0.6, z: 0 },
      { sym: "C", x: 1.3, y: -0.6, z: 0 },
      { sym: "H", x: -1.3, y: -1.2, z: 0.9 },
      { sym: "H", x: -1.3, y: -1.2, z: -0.9 },
      { sym: "H", x: -2.1, y: 0.05, z: 0 },
      { sym: "H", x: 1.3, y: -1.2, z: 0.9 },
      { sym: "H", x: 1.3, y: -1.2, z: -0.9 },
      { sym: "H", x: 2.1, y: 0.05, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 2 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 },
      { a1: 2, a2: 4, order: 1 },
      { a1: 2, a2: 5, order: 1 },
      { a1: 2, a2: 6, order: 1 },
      { a1: 3, a2: 7, order: 1 },
      { a1: 3, a2: 8, order: 1 },
      { a1: 3, a2: 9, order: 1 }
    ]
  },
  acetic_acid: {
    name: "Acetic Acid (CH₃COOH)",
    formula: "C2H4O2",
    category: "Carboxylic Acid",
    atoms: [
      { sym: "C", x: -0.7, y: -0.3, z: 0 },
      { sym: "C", x: 0.7, y: 0.2, z: 0 },
      { sym: "O", x: 1.1, y: 1.35, z: 0 },
      { sym: "O", x: 1.5, y: -0.85, z: 0 },
      { sym: "H", x: 2.4, y: -0.6, z: 0 },
      { sym: "H", x: -0.8, y: -0.9, z: 0.9 },
      { sym: "H", x: -0.8, y: -0.9, z: -0.9 },
      { sym: "H", x: -1.35, y: 0.5, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 1, a2: 2, order: 2 },
      { a1: 1, a2: 3, order: 1 },
      { a1: 3, a2: 4, order: 1 },
      { a1: 0, a2: 5, order: 1 },
      { a1: 0, a2: 6, order: 1 },
      { a1: 0, a2: 7, order: 1 }
    ]
  },
  benzene: {
    name: "Benzene (C₆H₆)",
    formula: "C6H6",
    category: "Aromatic",
    atoms: [
      { sym: "C", x: 0, y: 1.4, z: 0 },
      { sym: "C", x: 1.21, y: 0.7, z: 0 },
      { sym: "C", x: 1.21, y: -0.7, z: 0 },
      { sym: "C", x: 0, y: -1.4, z: 0 },
      { sym: "C", x: -1.21, y: -0.7, z: 0 },
      { sym: "C", x: -1.21, y: 0.7, z: 0 },
      { sym: "H", x: 0, y: 2.48, z: 0 },
      { sym: "H", x: 2.15, y: 1.24, z: 0 },
      { sym: "H", x: 2.15, y: -1.24, z: 0 },
      { sym: "H", x: 0, y: -2.48, z: 0 },
      { sym: "H", x: -2.15, y: -1.24, z: 0 },
      { sym: "H", x: -2.15, y: 1.24, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 2 },
      { a1: 1, a2: 2, order: 1 },
      { a1: 2, a2: 3, order: 2 },
      { a1: 3, a2: 4, order: 1 },
      { a1: 4, a2: 5, order: 2 },
      { a1: 5, a2: 0, order: 1 },
      { a1: 0, a2: 6, order: 1 },
      { a1: 1, a2: 7, order: 1 },
      { a1: 2, a2: 8, order: 1 },
      { a1: 3, a2: 9, order: 1 },
      { a1: 4, a2: 10, order: 1 },
      { a1: 5, a2: 11, order: 1 }
    ]
  },
  sulfur_hexafluoride: {
    name: "Sulfur Hexafluoride (SF₆)",
    formula: "F6S",
    category: "Hypervalent Octahedral",
    atoms: [
      { sym: "S", x: 0, y: 0, z: 0 },
      { sym: "F", x: 1.56, y: 0, z: 0 },
      { sym: "F", x: -1.56, y: 0, z: 0 },
      { sym: "F", x: 0, y: 1.56, z: 0 },
      { sym: "F", x: 0, y: -1.56, z: 0 },
      { sym: "F", x: 0, y: 0, z: 1.56 },
      { sym: "F", x: 0, y: 0, z: -1.56 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 0, a2: 2, order: 1 },
      { a1: 0, a2: 3, order: 1 },
      { a1: 0, a2: 4, order: 1 },
      { a1: 0, a2: 5, order: 1 },
      { a1: 0, a2: 6, order: 1 }
    ]
  },
  caffeine: {
    name: "Caffeine (C₈H₁₀N₄O₂)",
    formula: "C8H10N4O2",
    category: "Alkaloid",
    atoms: [
      { sym: "N", x: -0.9, y: 1.15, z: 0 },
      { sym: "C", x: 0.35, y: 1.6, z: 0 },
      { sym: "O", x: 0.6, y: 2.8, z: 0 },
      { sym: "N", x: 1.35, y: 0.65, z: 0 },
      { sym: "C", x: 1.05, y: -0.7, z: 0 },
      { sym: "C", x: -0.3, y: -1.15, z: 0 },
      { sym: "C", x: -1.2, y: -0.15, z: 0 },
      { sym: "O", x: -2.4, y: -0.4, z: 0 },
      { sym: "N", x: 2.1, y: -1.6, z: 0 },
      { sym: "C", x: 1.35, y: -2.6, z: 0 },
      { sym: "N", x: -0.05, y: -2.4, z: 0 },
      { sym: "C", x: -2.05, y: 2.05, z: 0 },
      { sym: "C", x: 2.75, y: 1.05, z: 0 },
      { sym: "C", x: 3.55, y: -1.6, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 1 },
      { a1: 1, a2: 2, order: 2 },
      { a1: 1, a2: 3, order: 1 },
      { a1: 3, a2: 4, order: 1 },
      { a1: 4, a2: 5, order: 2 },
      { a1: 5, a2: 6, order: 1 },
      { a1: 6, a2: 7, order: 2 },
      { a1: 6, a2: 0, order: 1 },
      { a1: 4, a2: 8, order: 1 },
      { a1: 8, a2: 9, order: 1 },
      { a1: 9, a2: 10, order: 2 },
      { a1: 10, a2: 5, order: 1 },
      { a1: 0, a2: 11, order: 1 },
      { a1: 3, a2: 12, order: 1 },
      { a1: 8, a2: 13, order: 1 }
    ]
  },
  aspirin: {
    name: "Aspirin (C₉H₈O₄)",
    formula: "C9H8O4",
    category: "Analgesic",
    atoms: [
      // Benzene ring
      { sym: "C", x: -1.4, y: 0.6, z: 0 },
      { sym: "C", x: -0.7, y: 1.8, z: 0 },
      { sym: "C", x: 0.7, y: 1.8, z: 0 },
      { sym: "C", x: 1.4, y: 0.6, z: 0 },
      { sym: "C", x: 0.7, y: -0.6, z: 0 },
      { sym: "C", x: -0.7, y: -0.6, z: 0 },
      // Carboxylic acid
      { sym: "C", x: -2.9, y: 0.6, z: 0 },
      { sym: "O", x: -3.5, y: 1.6, z: 0 },
      { sym: "O", x: -3.5, y: -0.5, z: 0 },
      { sym: "H", x: -4.4, y: -0.4, z: 0 },
      // Acetoxy ester
      { sym: "O", x: -1.3, y: -1.8, z: 0 },
      { sym: "C", x: -0.6, y: -2.95, z: 0 },
      { sym: "O", x: 0.6, y: -3.05, z: 0 },
      { sym: "C", x: -1.45, y: -4.2, z: 0 }
    ],
    bonds: [
      { a1: 0, a2: 1, order: 2 },
      { a1: 1, a2: 2, order: 1 },
      { a1: 2, a2: 3, order: 2 },
      { a1: 3, a2: 4, order: 1 },
      { a1: 4, a2: 5, order: 2 },
      { a1: 5, a2: 0, order: 1 },
      { a1: 0, a2: 6, order: 1 },
      { a1: 6, a2: 7, order: 2 },
      { a1: 6, a2: 8, order: 1 },
      { a1: 8, a2: 9, order: 1 },
      { a1: 5, a2: 10, order: 1 },
      { a1: 10, a2: 11, order: 1 },
      { a1: 11, a2: 12, order: 2 },
      { a1: 11, a2: 13, order: 1 }
    ]
  }
};

export function loadPresetIntoGraph(presetKey, graph, physics = null) {
  const preset = PRESETS[presetKey];
  if (!preset) return false;

  graph.clear();
  const createdAtoms = [];

  preset.atoms.forEach(a => {
    const atom = graph.addAtom(a.sym, a.x, a.y, a.z);
    createdAtoms.push(atom);
  });

  preset.bonds.forEach(b => {
    const a1 = createdAtoms[b.a1];
    const a2 = createdAtoms[b.a2];
    if (a1 && a2) {
      graph.addBond(a1, a2, b.order);
    }
  });

  graph.updateAllHybridizations();
  if (physics) {
    physics.optimizeGeometry(60);
  }
  return true;
}

if (typeof window !== "undefined") {
  window.PRESETS = PRESETS;
  window.loadPresetIntoGraph = loadPresetIntoGraph;
}
