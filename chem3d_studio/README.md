# ⚛ Chem3D Studio

An interactive 3D molecular visualization, manipulation, and chemical intelligence software for chemistry research and education.

## ✨ Key Features

1. **Interactive 3D Manipulation**:
   - **Take & Place Atoms**: Quick element palette (H, C, N, O, P, S, Cl, Br, I, Na, Fe...) + Complete interactive 118-Element Periodic Table modal.
   - **Club & Bond**: Connect atoms to form single, double, or triple covalent bonds, or click existing bonds to cycle bond orders.
   - **Deform & Spring Physics**: Interactive real-time molecular mechanics:
     - Harmonic Hooke's spring forces for covalent bonds.
     - VSEPR angle bending forces ($sp^3$ tetrahedral $109.5^\circ$, $sp^2$ planar $120^\circ$, $sp$ linear $180^\circ$, $sp^3d^2$ octahedral $90^\circ$).
     - Van der Waals steric repulsion to prevent atom overlapping.
     - Drag any atom to stretch, flex, and pull the entire molecule organically.
     - Toggle physics to freeze deformations into strained conformations, or click **Clean 3D** to relax to ground state!
   - **Thermal Agitation (Jiggle)**: Adjust temperature (0 K to 400 K) to simulate molecular vibrations.
   - **Auto-Saturate Hydrogens**: One-click automatically calculates open valence sites in 3D geometry and adds Hydrogen atoms.
   - **Measure Tool**: Measure exact bond lengths in Ångströms (select 2 atoms) or bond angles in degrees (select 3 atoms).

2. **Chemical Intelligence & IUPAC Engine**:
   - **Systematic IUPAC Nomenclature Engine**: Identifies alkanes, alkenes, alkynes, alcohols, carboxylic acids, aldehydes, ketones, esters, amides, amines, nitriles, cycloalkanes, and aromatics (benzene derivatives).
   - **Inorganic & Hallmark Database**: Instant recognition of common molecules ($H_2O$, $NH_3$, $CO_2$, $H_2SO_4$, $HNO_3$, $SF_6$, Aspirin, Caffeine, Glucose, etc.).
   - **Online PubChem Integration**: Asynchronously queries PubChem REST API by generated SMILES to fetch official verified chemical title, XLogP, and complexity.
   - **Hill System Formula**: Clean formatted molecular formula with subscripts (e.g. $C_2H_5OH$).
   - **Molar Mass & Composition**: Calculates molar mass ($g/mol$) and dynamic percentage mass breakdown bar.
   - **Valency & Octet Validation**: Real-time warning for unsatisfied valencies, free radicals, or hypervalent carbons ("Texas carbon").
   - **Atom Inspector**: Click any atom in 3D to see its exact element, oxidation state, hybridization ($sp^3, sp^2\dots$), formal charge, partial charge ($e$), and bonded neighbors.
   - **Dipole Vector**: 3D vector arrow displaying overall molecular polarity and Debye magnitude.

3. **Multi-Mode 3D Graphics**:
   - **Ball & Stick**: Sleek metallic CPK spheres with dual-tone gradient cylinders.
   - **Space-Filling (CPK)**: Scaled by Van der Waals radii.
   - **Licorice**: Thick bonded tubes.
   - **Wireframe**: Futuristic holographic wireframe.

4. **Export Formats**:
   - MDL Molfile (`.mol`)
   - Cartesian Coordinates (`.xyz`)
   - Protein Data Bank (`.pdb`)
   - High-Resolution PNG Screenshot

---

## 🚀 How to Launch

### Option 1: Double Click
Double click `launch.bat` in this folder.

### Option 2: PowerShell
```powershell
.\launch.ps1
```

### Option 3: Direct Python
```bash
py server.py
```
This automatically starts the local server at `http://localhost:8000/index.html` and launches your default web browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Pause / Resume real-time physics |
| <kbd>H</kbd> | Saturate with Hydrogens |
| <kbd>C</kbd> | Clean & Optimize 3D Geometry |
| <kbd>R</kbd> | Reset Camera View |
| <kbd>Delete</kbd> | Delete selected atom(s) |
