/**
 * Chem3D Studio - IUPAC Nomenclature & Chemical Intelligence Engine
 * Provides offline organic & inorganic IUPAC name generation, functional group analysis,
 * VSEPR geometry determination, and asynchronous online PubChem / Cactus enrichment.
 */

// Dictionary of standard inorganic and hallmark organic molecules
const KNOWN_MOLECULES = {
  // Inorganic
  "H2O": { iupac: "Oxidane (Water)", common: "Water", category: "Inorganic hydride", geometry: "Bent (104.5°)" },
  "H2O2": { iupac: "Dioxidane", common: "Hydrogen peroxide", category: "Peroxide", geometry: "Non-planar open-book" },
  "H3N": { iupac: "Azane (Ammonia)", common: "Ammonia", category: "Inorganic hydride", geometry: "Trigonal pyramidal (107°)" },
  "H4N2": { iupac: "Diazane", common: "Hydrazine", category: "Inorganic hydride", geometry: "Gauche conformer" },
  "CO2": { iupac: "Carbon dioxide", common: "Carbonic anhydride / Dry ice", category: "Carbon oxide", geometry: "Linear (180°)" },
  "CO": { iupac: "Carbon monoxide", common: "Carbon monoxide", category: "Carbon oxide", geometry: "Linear" },
  "O2S": { iupac: "Sulfur dioxide", common: "Sulfur dioxide", category: "Sulfur oxide", geometry: "Bent (119°)" },
  "O3S": { iupac: "Sulfur trioxide", common: "Sulfuric anhydride", category: "Sulfur oxide", geometry: "Trigonal planar (120°)" },
  "H2O4S": { iupac: "Sulfuric acid", common: "Oil of vitriol", category: "Mineral acid", geometry: "Tetrahedral around S" },
  "H2O3S": { iupac: "Sulfurous acid", common: "Sulfurous acid", category: "Mineral acid", geometry: "Pyramidal around S" },
  "HNO3": { iupac: "Nitric acid", common: "Aqua fortis", category: "Mineral acid", geometry: "Planar around N" },
  "HNO2": { iupac: "Nitrous acid", common: "Nitrous acid", category: "Mineral acid", geometry: "Planar" },
  "H3O4P": { iupac: "Phosphoric acid", common: "Orthophosphoric acid", category: "Mineral acid", geometry: "Tetrahedral around P" },
  "ClH": { iupac: "Hydrogen chloride", common: "Hydrochloric acid", category: "Hydrogen halide", geometry: "Linear" },
  "BrH": { iupac: "Hydrogen bromide", common: "Hydrobromic acid", category: "Hydrogen halide", geometry: "Linear" },
  "HI": { iupac: "Hydrogen iodide", common: "Hydriodic acid", category: "Hydrogen halide", geometry: "Linear" },
  "FH": { iupac: "Hydrogen fluoride", common: "Hydrofluoric acid", category: "Hydrogen halide", geometry: "Linear" },
  "H2S": { iupac: "Sulfane", common: "Hydrogen sulfide", category: "Inorganic hydride", geometry: "Bent (92°)" },
  "CHN": { iupac: "Formonitrile", common: "Hydrogen cyanide / Prussic acid", category: "Cyanide", geometry: "Linear (180°)" },
  "O3": { iupac: "Trioxygen", common: "Ozone", category: "Allotrope", geometry: "Bent (116.8°)" },
  "O2": { iupac: "Dioxygen", common: "Oxygen gas", category: "Diatomic molecule", geometry: "Linear" },
  "N2": { iupac: "Dinitrogen", common: "Nitrogen gas", category: "Diatomic molecule", geometry: "Linear" },
  "H2": { iupac: "Dihydrogen", common: "Hydrogen gas", category: "Diatomic molecule", geometry: "Linear" },
  "Cl2": { iupac: "Dichlorine", common: "Chlorine gas", category: "Halogen", geometry: "Linear" },
  "Br2": { iupac: "Dibromine", common: "Bromine liquid", category: "Halogen", geometry: "Linear" },
  "F2": { iupac: "Difluorine", common: "Fluorine gas", category: "Halogen", geometry: "Linear" },
  "I2": { iupac: "Diiodine", common: "Iodine crystal", category: "Halogen", geometry: "Linear" },
  "F6S": { iupac: "Sulfur hexafluoride", common: "Sulfur hexafluoride", category: "Inorganic halide", geometry: "Octahedral (90°)" },
  "Cl5P": { iupac: "Phosphorus pentachloride", common: "Phosphorus pentachloride", category: "Inorganic halide", geometry: "Trigonal bipyramidal" },
  "Cl3P": { iupac: "Phosphorus trichloride", common: "Phosphorus trichloride", category: "Inorganic halide", geometry: "Trigonal pyramidal" },
  "BF3": { iupac: "Trifluoroborane", common: "Boron trifluoride", category: "Lewis acid", geometry: "Trigonal planar (120°)" },
  "NO": { iupac: "Nitrogen monoxide", common: "Nitric oxide", category: "Nitrogen oxide", geometry: "Linear" },
  "N2O": { iupac: "Dinitrogen monoxide", common: "Nitrous oxide / Laughing gas", category: "Nitrogen oxide", geometry: "Linear" },
  "NO2": { iupac: "Nitrogen dioxide", common: "Nitrogen dioxide", category: "Nitrogen oxide", geometry: "Bent (134°)" },

  // Simple Hydrocarbons & Organics
  "CH4": { iupac: "Methane", common: "Natural gas / Marsh gas", category: "Alkane", geometry: "Tetrahedral (109.5°)" },
  "C2H6": { iupac: "Ethane", common: "Ethane", category: "Alkane", geometry: "Staggered / Eclipsed" },
  "C3H8": { iupac: "Propane", common: "LPG component", category: "Alkane", geometry: "Tetrahedral backbone" },
  "C4H10": { iupac: "Butane", common: "Lighter gas", category: "Alkane", geometry: "Anti-conformer" },
  "C5H12": { iupac: "Pentane", common: "n-Pentane", category: "Alkane", geometry: "Zig-zag chain" },
  "C6H14": { iupac: "Hexane", common: "n-Hexane", category: "Alkane", geometry: "Zig-zag chain" },
  "C2H4": { iupac: "Ethene", common: "Ethylene", category: "Alkene", geometry: "Planar (120°)" },
  "C2H2": { iupac: "Ethyne", common: "Acetylene", category: "Alkyne", geometry: "Linear (180°)" },
  "CH4O": { iupac: "Methanol", common: "Wood alcohol", category: "Alcohol", geometry: "Tetrahedral / Bent C-O-H" },
  "C2H6O": { iupac: "Ethanol", common: "Grain alcohol / Drinking alcohol", category: "Alcohol", geometry: "Tetrahedral / Bent" },
  "C3H8O": { iupac: "Propan-1-ol / Propan-2-ol", common: "Isopropanol / Propyl alcohol", category: "Alcohol", geometry: "Tetrahedral" },
  "C3H8O3": { iupac: "Propane-1,2,3-triol", common: "Glycerol / Glycerin", category: "Polyol", geometry: "Flexible polyol" },
  "C2H6O2": { iupac: "Ethane-1,2-diol", common: "Ethylene glycol (Antifreeze)", category: "Diol", geometry: "Gauche diol" },
  "CH2O": { iupac: "Methanal", common: "Formaldehyde / Formalin", category: "Aldehyde", geometry: "Trigonal planar (120°)" },
  "C2H4O": { iupac: "Ethanal", common: "Acetaldehyde", category: "Aldehyde", geometry: "Planar carbonyl" },
  "C3H6O": { iupac: "Propan-2-one", common: "Acetone", category: "Ketone", geometry: "Trigonal planar carbonyl" },
  "CH2O2": { iupac: "Methanoic acid", common: "Formic acid (Ant sting acid)", category: "Carboxylic acid", geometry: "Planar acid group" },
  "C2H4O2": { iupac: "Ethanoic acid", common: "Acetic acid / Vinegar", category: "Carboxylic acid", geometry: "Planar carboxyl group" },
  "C3H6O2": { iupac: "Propanoic acid", common: "Propionic acid", category: "Carboxylic acid", geometry: "Planar carboxyl" },
  "C2H2O4": { iupac: "Ethanedioic acid", common: "Oxalic acid", category: "Dicarboxylic acid", geometry: "Planar / Centrosymmetric" },
  "CH5N": { iupac: "Methanamine", common: "Methylamine", category: "Amine", geometry: "Pyramidal N" },
  "C2H7N": { iupac: "Ethanamine / Dimethylamine", common: "Ethylamine", category: "Amine", geometry: "Pyramidal N" },
  "CH3NO": { iupac: "Formamide", common: "Methanamide", category: "Amide", geometry: "Planar resonance amide" },
  "C2H5NO": { iupac: "Acetamide", common: "Ethanamide", category: "Amide", geometry: "Planar amide" },
  "C2H3N": { iupac: "Acetonitrile", common: "Cyanomethane / ACN", category: "Nitrile", geometry: "Linear C-C#N" },
  "C6H6": { iupac: "Benzene", common: "Benzene / [6]Annulene", category: "Aromatic hydrocarbon", geometry: "Planar hexagonal (D6h)" },
  "C7H8": { iupac: "Methylbenzene", common: "Toluene", category: "Aromatic", geometry: "Planar ring with methyl" },
  "C6H6O": { iupac: "Phenol", common: "Carbolic acid", category: "Aromatic alcohol", geometry: "Planar ring" },
  "C6H7N": { iupac: "Benzenamine", common: "Aniline", category: "Aromatic amine", geometry: "Nearly planar ring" },
  "C7H6O2": { iupac: "Benzoic acid", common: "Benzoic acid", category: "Aromatic acid", geometry: "Coplanar ring & carboxyl" },
  "C7H6O": { iupac: "Benzaldehyde", common: "Almond essence", category: "Aromatic aldehyde", geometry: "Planar" },
  "C6H12": { iupac: "Cyclohexane", common: "Cyclohexane", category: "Cycloalkane", geometry: "Chair conformation" },
  "C5H10": { iupac: "Cyclopentane", common: "Cyclopentane", category: "Cycloalkane", geometry: "Envelope conformation" },
  "C4H8": { iupac: "Cyclobutane", common: "Cyclobutane", category: "Cycloalkane", geometry: "Puckered square" },
  "C3H6": { iupac: "Cyclopropane", common: "Cyclopropane", category: "Cycloalkane", geometry: "Planar equilateral triangle (strained 60°)" },
  "C8H10N4O2": { iupac: "1,3,7-Trimethylpurine-2,6-dione", common: "Caffeine", category: "Alkaloid / Purine", geometry: "Fused bicyclic planar system" },
  "C9H8O4": { iupac: "2-Acetyloxybenzoic acid", common: "Aspirin (Acetylsalicylic acid)", category: "Analgesic / Ester-Acid", geometry: "Ortho-substituted aromatic" },
  "C8H9NO2": { iupac: "N-(4-hydroxyphenyl)acetamide", common: "Paracetamol / Acetaminophen", category: "Analgesic", geometry: "Para-substituted aromatic" },
  "C6H12O6": { iupac: "D-Glucopyranose / (2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal", common: "D-Glucose / Blood sugar", category: "Aldohexose / Monosaccharide", geometry: "Pyranose chair" },
  "C3H7NO2": { iupac: "2-Aminopropanoic acid", common: "L-Alanine", category: "Amino acid", geometry: "Chiral tetrahedral alpha-carbon" },
  "C2H5NO2": { iupac: "2-Aminoacetic acid", common: "Glycine", category: "Amino acid", geometry: "Achiral amino acid" }
};

export class IUPACEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Primary entry point: analyzes molecule graph and returns complete chemical information.
   * @param {MoleculeGraph} graph
   * @param {Array<Atom>} atomsList optional subset of atoms
   */
  analyze(graph, atomsList = null) {
    const atoms = atomsList || graph.atoms;
    if (!atoms || atoms.length === 0) {
      return {
        formula: "",
        formulaHtml: "",
        molecularWeight: 0,
        iupacName: "Empty Workspace",
        commonName: "None",
        category: "N/A",
        geometry: "N/A",
        smiles: "",
        composition: [],
        dipoleMoment: { magnitude: 0, vector: { x: 0, y: 0, z: 0 } },
        valencyReport: { isValid: true, issues: [] },
        functionalGroups: [],
        hybridizationSummary: {}
      };
    }

    const formulaObj = graph.calculateFormula(atoms);
    const mw = graph.calculateMolecularWeight(atoms);
    const composition = graph.calculateElementalComposition(atoms);
    const dipole = graph.calculateDipoleMoment(atoms);
    const smiles = graph.toSMILES(atoms);
    const valencyReport = this.checkValencies(atoms);
    const hybridizationSummary = this.summarizeHybridization(atoms);

    // 1. Check known lookup dictionary first
    let result = null;
    if (KNOWN_MOLECULES[formulaObj.plain]) {
      const known = KNOWN_MOLECULES[formulaObj.plain];
      result = {
        formula: formulaObj.plain,
        formulaHtml: formulaObj.html,
        molecularWeight: +mw.toFixed(3),
        iupacName: known.iupac,
        commonName: known.common,
        category: known.category,
        geometry: known.geometry,
        smiles: smiles,
        composition: composition,
        dipoleMoment: dipole,
        valencyReport: valencyReport,
        functionalGroups: this.detectFunctionalGroups(atoms),
        hybridizationSummary: hybridizationSummary,
        source: "database"
      };
    } else {
      // 2. Run rule-based algorithmic IUPAC analyzer
      const algoResult = this.generateSystematicIUPAC(graph, atoms, formulaObj);
      result = {
        formula: formulaObj.plain,
        formulaHtml: formulaObj.html,
        molecularWeight: +mw.toFixed(3),
        iupacName: algoResult.iupacName,
        commonName: algoResult.commonName,
        category: algoResult.category,
        geometry: algoResult.geometry,
        smiles: smiles,
        composition: composition,
        dipoleMoment: dipole,
        valencyReport: valencyReport,
        functionalGroups: algoResult.functionalGroups || this.detectFunctionalGroups(atoms),
        hybridizationSummary: hybridizationSummary,
        source: "algorithmic"
      };
    }

    return result;
  }

  /**
   * Valency & Octet validation checker
   */
  checkValencies(atoms) {
    const issues = [];
    let isValid = true;

    for (const a of atoms) {
      const currentOrder = a.getTotalBondOrder();
      const typical = a.element.typicalValency;
      const diff = typical - currentOrder;

      if (a.symbol === "C") {
        if (currentOrder > 4) {
          isValid = false;
          issues.push(`Atom #${a.id} (C) is hypervalent with ${currentOrder} bonds (max 4 allowed).`);
        } else if (currentOrder < 4) {
          issues.push(`Atom #${a.id} (C) has an open valence (${4 - currentOrder} unfilled bond${4 - currentOrder > 1 ? 's' : ''}).`);
        }
      } else if (a.symbol === "H") {
        if (currentOrder > 1) {
          isValid = false;
          issues.push(`Atom #${a.id} (H) has ${currentOrder} bonds (Hydrogen can only form 1).`);
        }
      } else if (a.symbol === "O") {
        if (currentOrder > 3) {
          issues.push(`Atom #${a.id} (O) exceeds normal divalent bonding (current: ${currentOrder}).`);
        }
      } else if (a.symbol === "N") {
        if (currentOrder > 4) {
          isValid = false;
          issues.push(`Atom #${a.id} (N) exceeds tetracovalent bonding (current: ${currentOrder}).`);
        }
      }
    }

    return { isValid, issues };
  }

  /**
   * Summarize hybridization distribution across atoms
   */
  summarizeHybridization(atoms) {
    const counts = {};
    for (const a of atoms) {
      counts[a.hybridization] = (counts[a.hybridization] || 0) + 1;
    }
    return counts;
  }

  /**
   * Detect functional groups present in molecule
   */
  detectFunctionalGroups(atoms) {
    const groups = new Set();

    for (const a of atoms) {
      if (a.symbol === "O") {
        const neighbors = a.getNeighbors();
        // Alcohol or Ether
        if (neighbors.length === 2) {
          const hasH = neighbors.some(n => n.symbol === "H");
          const hasC = neighbors.some(n => n.symbol === "C");
          if (hasH && hasC) groups.add("Alcohol (-OH)");
          else if (neighbors.filter(n => n.symbol === "C").length === 2) groups.add("Ether (C-O-C)");
        }
        // Carbonyl C=O
        const doubleBondToC = a.bonds.find(b => b.order === 2 && b.getOtherAtom(a).symbol === "C");
        if (doubleBondToC) {
          const c = doubleBondToC.getOtherAtom(a);
          const cNeighbors = c.getNeighbors().filter(n => n !== a);
          const hasOH = cNeighbors.some(n => n.symbol === "O" && n.getNeighbors().some(nn => nn.symbol === "H"));
          const hasH = cNeighbors.some(n => n.symbol === "H");
          const hasO_R = cNeighbors.some(n => n.symbol === "O" && !n.getNeighbors().some(nn => nn.symbol === "H"));
          const hasN = cNeighbors.some(n => n.symbol === "N");

          if (hasOH) groups.add("Carboxylic Acid (-COOH)");
          else if (hasO_R) groups.add("Ester (-COO-R)");
          else if (hasN) groups.add("Amide (-CONH2)");
          else if (hasH) groups.add("Aldehyde (-CHO)");
          else groups.add("Ketone (C=O)");
        }
      } else if (a.symbol === "N") {
        const cNeighbors = a.getNeighbors().filter(n => n.symbol === "C");
        const tripleBondToC = a.bonds.find(b => b.order === 3 && b.getOtherAtom(a).symbol === "C");
        if (tripleBondToC) {
          groups.add("Nitrile (-C≡N)");
        } else if (cNeighbors.length > 0) {
          groups.add("Amine (-NH2 / -NR2)");
        }
      } else if (a.symbol === "F" || a.symbol === "Cl" || a.symbol === "Br" || a.symbol === "I") {
        groups.add(`Haloalkane (-${a.symbol})`);
      } else if (a.symbol === "S") {
        groups.add("Organosulfur / Thiol");
      }
    }

    return Array.from(groups);
  }

  /**
   * Systematic algorithmic organic IUPAC solver
   */
  generateSystematicIUPAC(graph, atoms, formulaObj) {
    const carbonAtoms = atoms.filter(a => a.symbol === "C");
    const functionalGroups = this.detectFunctionalGroups(atoms);

    // If no carbon is present, name as inorganic compound
    if (carbonAtoms.length === 0) {
      return this.nameInorganicCompound(atoms, formulaObj);
    }

    // Check for rings
    const rings = graph.detectRings();
    const sixMemberedRings = rings.filter(r => r.atoms.length === 6);
    
    // Check for Benzene ring
    for (const r of sixMemberedRings) {
      const ringCarbons = r.atoms.filter(a => a.symbol === "C");
      if (ringCarbons.length === 6) {
        // Check for alternating or aromatic bonds
        const ringBonds = graph.bonds.filter(b => ringCarbons.includes(b.atom1) && ringCarbons.includes(b.atom2));
        const doubleCount = ringBonds.filter(b => b.order === 2 || b.order === 1.5).length;
        if (doubleCount >= 3) {
          // Benzene core detected!
          return this.nameBenzeneDerivative(r.atoms, atoms, graph, functionalGroups);
        }
      }
    }

    // Cycloalkane detection
    if (rings.length > 0) {
      const ring = rings[0];
      const ringSize = ring.atoms.length;
      const roots = ["", "", "", "cycloprop", "cyclobut", "cyclopent", "cyclohex", "cyclohept", "cyclooct"];
      if (ringSize >= 3 && ringSize <= 8) {
        const root = roots[ringSize] || `cyclo${ringSize}`;
        return {
          iupacName: `${root}ane derivative`,
          commonName: `Substituted ${root}ane`,
          category: "Cycloalkane",
          geometry: ringSize === 6 ? "Chair/Boat conformer" : "Ring conformation",
          functionalGroups: functionalGroups
        };
      }
    }

    // Acyclic carbon chain search
    const longestChain = this.findLongestCarbonChain(carbonAtoms);
    const nC = longestChain.length;

    const prefixRoots = [
      "", "meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec",
      "undec", "dodec", "tridec", "tetradec", "pentadec"
    ];
    const rootName = prefixRoots[nC] || `poly(${nC})`;

    // Check unsaturations in longest chain
    let hasDouble = false;
    let hasTriple = false;
    for (let i = 0; i < longestChain.length - 1; i++) {
      const b = graph.getBondBetween(longestChain[i], longestChain[i + 1]);
      if (b) {
        if (b.order === 2) hasDouble = true;
        if (b.order === 3) hasTriple = true;
      }
    }

    let infix = "an";
    if (hasDouble && hasTriple) infix = "enyn";
    else if (hasDouble) infix = "en";
    else if (hasTriple) infix = "yn";

    // Determine principal suffix
    let suffix = "e";
    let category = "Alkane";
    if (functionalGroups.includes("Carboxylic Acid (-COOH)")) {
      suffix = "oic acid";
      category = "Carboxylic Acid";
    } else if (functionalGroups.includes("Ester (-COO-R)")) {
      suffix = "oate";
      category = "Ester";
    } else if (functionalGroups.includes("Amide (-CONH2)")) {
      suffix = "amide";
      category = "Amide";
    } else if (functionalGroups.includes("Nitrile (-C≡N)")) {
      suffix = "nitrile";
      category = "Nitrile";
    } else if (functionalGroups.includes("Aldehyde (-CHO)")) {
      suffix = "al";
      category = "Aldehyde";
    } else if (functionalGroups.includes("Ketone (C=O)")) {
      suffix = "one";
      category = "Ketone";
    } else if (functionalGroups.includes("Alcohol (-OH)")) {
      suffix = "ol";
      category = "Alcohol";
    } else if (functionalGroups.includes("Amine (-NH2 / -NR2)")) {
      suffix = "amine";
      category = "Amine";
    } else if (hasDouble) {
      suffix = "e";
      category = "Alkene";
    } else if (hasTriple) {
      suffix = "e";
      category = "Alkyne";
    }

    let assembled = `${rootName}${infix}${suffix.startsWith('o') || suffix.startsWith('a') ? suffix : (infix === 'an' && suffix === 'e' ? 'e' : suffix)}`;
    // Format nicely e.g., "propane", "ethanol", "propanoic acid"
    if (assembled === "ethanooic acid") assembled = "ethanoic acid";
    if (assembled === "methanooic acid") assembled = "methanoic acid";
    if (assembled === "propanooic acid") assembled = "propanoic acid";
    if (assembled === "ethanoal") assembled = "ethanal";
    if (assembled === "methanoal") assembled = "methanal";
    if (assembled === "propanoal") assembled = "propanal";
    if (assembled === "ethanool") assembled = "ethanol";
    if (assembled === "methanool") assembled = "methanol";
    if (assembled === "propanoone") assembled = "propan-2-one";

    // Capitalize first letter
    const finalName = assembled.charAt(0).toUpperCase() + assembled.slice(1);

    return {
      iupacName: finalName,
      commonName: `${finalName} homologue`,
      category: category,
      geometry: nC <= 2 ? "Linear / Tetrahedral" : "Sp3 Zig-zag conformation",
      functionalGroups: functionalGroups
    };
  }

  nameBenzeneDerivative(ringAtoms, allAtoms, graph, functionalGroups) {
    const ringSet = new Set(ringAtoms);
    const substituents = [];

    ringAtoms.forEach((ra, idx) => {
      const exocyclic = ra.getNeighbors().filter(n => !ringSet.has(n));
      for (const exo of exocyclic) {
        if (exo.symbol === "O") {
          const hasH = exo.getNeighbors().some(n => n.symbol === "H");
          if (hasH) substituents.push({ name: "hydroxy", type: "phenol" });
        } else if (exo.symbol === "N") {
          substituents.push({ name: "amino", type: "aniline" });
        } else if (exo.symbol === "C") {
          // Check if carboxylic, aldehyde, or methyl
          const cNeighbors = exo.getNeighbors();
          const hasCarbonyl = cNeighbors.some(n => n.symbol === "O" && graph.getBondBetween(exo, n).order === 2);
          if (hasCarbonyl) {
            substituents.push({ name: "carboxy", type: "benzoic acid" });
          } else {
            substituents.push({ name: "methyl", type: "toluene" });
          }
        } else if (exo.symbol === "Cl") substituents.push({ name: "chloro", type: "chlorobenzene" });
        else if (exo.symbol === "Br") substituents.push({ name: "bromo", type: "bromobenzene" });
        else if (exo.symbol === "F") substituents.push({ name: "fluoro", type: "fluorobenzene" });
        else if (exo.symbol === "I") substituents.push({ name: "iodo", type: "iodobenzene" });
      }
    });

    if (substituents.some(s => s.type === "benzoic acid")) {
      return { iupacName: "Benzoic acid", commonName: "Benzenecarboxylic acid", category: "Aromatic Carboxylic Acid", geometry: "Planar ring (sp2)" };
    }
    if (substituents.some(s => s.type === "phenol")) {
      return { iupacName: "Phenol", commonName: "Carbolic acid / Hydroxybenzene", category: "Aromatic Alcohol", geometry: "Planar ring (sp2)" };
    }
    if (substituents.some(s => s.type === "aniline")) {
      return { iupacName: "Aniline", commonName: "Benzenamine / Aminobenzene", category: "Aromatic Amine", geometry: "Planar ring (sp2)" };
    }
    if (substituents.some(s => s.type === "toluene")) {
      return { iupacName: "Methylbenzene", commonName: "Toluene", category: "Aromatic Hydrocarbon", geometry: "Planar ring with sp3 methyl" };
    }

    return {
      iupacName: "Substituted Benzene",
      commonName: "Arene derivative",
      category: "Aromatic compound",
      geometry: "Planar hexagonal ring (sp2 carbons)",
      functionalGroups: functionalGroups
    };
  }

  nameInorganicCompound(atoms, formulaObj) {
    const counts = formulaObj.counts || {};
    const syms = Object.keys(counts);

    // Binary compound nomenclature: e.g. Di-X Tri-Y-ide
    const greek = ["", "mono", "di", "tri", "tetra", "penta", "hexa", "hepta", "octa", "nona", "deca"];

    if (syms.length === 1) {
      const elem = atoms[0].element;
      const count = counts[syms[0]];
      const prefix = greek[count] || "";
      return {
        iupacName: `${prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : ""}${elem.name.toLowerCase()}`,
        commonName: `${elem.name} elemental form`,
        category: "Elemental substance",
        geometry: count === 1 ? "Atomic" : count === 2 ? "Linear (diatomic)" : "Polyatomic cluster"
      };
    }

    return {
      iupacName: `Inorganic compound (${formulaObj.plain})`,
      commonName: "Inorganic cluster / molecule",
      category: "Inorganic compound",
      geometry: "VSEPR determined coordinates"
    };
  }

  findLongestCarbonChain(carbons) {
    if (carbons.length === 0) return [];
    if (carbons.length === 1) return [carbons[0]];

    let longest = [];

    const dfs = (curr, path, visited) => {
      if (path.length > longest.length) {
        longest = [...path];
      }
      for (const n of curr.getNeighbors()) {
        if (n.symbol === "C" && !visited.has(n)) {
          visited.add(n);
          dfs(n, [...path, n], visited);
          visited.delete(n);
        }
      }
    };

    // Try starting from terminal or low-degree carbons
    for (const c of carbons) {
      const visited = new Set([c]);
      dfs(c, [c], visited);
    }

    return longest;
  }

  /**
   * Online PubChem asynchronous enrichment
   * Queries PubChem PUG REST API by SMILES to get official IUPAC name,
   * CAS registry, and property data when network connection is available.
   */
  async fetchOnlinePubChem(smiles) {
    if (!smiles || smiles.length < 2) return null;
    if (this.cache.has(smiles)) return this.cache.get(smiles);

    try {
      const encoded = encodeURIComponent(smiles);
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/property/IUPACName,Title,MolecularWeight,XLogP,Complexity,ExactMass/JSON`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second max timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      const prop = data?.PropertyTable?.Properties?.[0];
      if (prop) {
        const enriched = {
          iupacName: prop.IUPACName || null,
          title: prop.Title || null,
          xlogp: prop.XLogP ?? null,
          complexity: prop.Complexity ?? null,
          exactMass: prop.ExactMass ?? null
        };
        this.cache.set(smiles, enriched);
        return enriched;
      }
    } catch (e) {
      // Offline or network error - fail gracefully
    }
    return null;
  }
}

if (typeof window !== "undefined") {
  window.IUPACEngine = IUPACEngine;
}
