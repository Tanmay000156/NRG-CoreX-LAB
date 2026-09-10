/**
 * NRG Corex - Main Application Controller
 * Handles Opening Animation, Hub Launcher, Virtual Lab Demo,
 * 3D Molecular Simulation, 118 Elements Periodic Table, and NRG Energy Analysis.
 */

import { ELEMENTS, ELEMENT_LIST, getElement } from './elements-data.js';
import { MoleculeGraph } from './molecular-graph.js';
import { IUPACEngine } from './iupac-engine.js';
import { MolecularPhysics } from './molecular-physics.js';
import { Renderer3D } from './renderer3d.js';
import { AudioEffects } from './audio-effects.js';
import { PRESETS, loadPresetIntoGraph } from './presets.js';
import { NRGAnalyzer } from './nrg-analyzer.js';

class NRGCorexApp {
  constructor() {
    this.graph = new MoleculeGraph();
    this.physics = new MolecularPhysics(this.graph);
    this.iupacEngine = new IUPACEngine();
    this.nrgAnalyzer = new NRGAnalyzer(this.graph, this.physics);
    this.audio = new AudioEffects();

    this.activeTool = "select";
    this.selectedElementSymbol = "C";
    this.bondingSourceAtom = null;
    this.measureAtoms = [];
    this.activeTab = "chem"; // "chem" or "nrg"

    // Lab Demo State
    this.labState = {
      ph: 7.0,
      temp: 25,
      flameLevel: 1, // 0: off, 1: blue, 2: torch
      hasIndicator: false,
      color: "linear-gradient(180deg, #ec4899, #be185d)",
      reagents: []
    };

    this.initDOM();
    this.initIntroAnimation();
    this.initHubNavigation();
    this.initLabDemo();
    this.init3DWorkspace();
    this.initPeriodicTableModal();

    // Default starter molecule
    loadPresetIntoGraph("ethanol", this.graph, this.physics);
    this.updateAnalysis();
  }

  initDOM() {
    this.dom = {
      // Intro & Hub
      introScreen: document.getElementById("intro-screen"),
      btnSkipIntro: document.getElementById("btn-skip-intro"),
      viewHub: document.getElementById("view-hub"),
      btnLaunch3d: document.getElementById("btn-launch-3d"),
      btnLaunchLab: document.getElementById("btn-launch-lab"),
      btnHubAudio: document.getElementById("btn-hub-audio"),

      // Lab Demo
      viewLab: document.getElementById("view-lab"),
      btnLabBack: document.getElementById("btn-lab-back"),
      labFlaskLiquid: document.getElementById("lab-flask-liquid"),
      labFlameElement: document.getElementById("lab-flame-element"),
      labBurnerSlider: document.getElementById("lab-burner-slider"),
      labFlameText: document.getElementById("lab-flame-text"),
      labTempVal: document.getElementById("lab-temp-val"),
      labPhVal: document.getElementById("lab-ph-val"),
      labReactionLog: document.getElementById("lab-reaction-log"),
      btnLabReset: document.getElementById("btn-lab-reset"),

      // 3D Space
      view3d: document.getElementById("view-3d"),
      btn3dBackHub: document.getElementById("btn-3d-back-hub"),
      viewport: document.getElementById("canvas-container"),
      formulaText: document.getElementById("formula-display"),
      iupacText: document.getElementById("iupac-name"),
      commonNameText: document.getElementById("common-name"),
      categoryBadge: document.getElementById("category-badge"),
      molWeightText: document.getElementById("molecular-weight"),
      compositionBars: document.getElementById("composition-bars"),
      valencyStatus: document.getElementById("valency-status"),
      selectedAtomInfo: document.getElementById("selected-atom-info"),
      pubchemBadge: document.getElementById("pubchem-info"),
      atomCountText: document.getElementById("stat-atom-count"),
      bondCountText: document.getElementById("stat-bond-count"),
      fpsText: document.getElementById("stat-fps"),
      toolHint: document.getElementById("tool-hint"),
      toastContainer: document.getElementById("toast-container"),

      // Tabs
      tabBtnChem: document.getElementById("tab-btn-chem"),
      tabBtnNrg: document.getElementById("tab-btn-nrg"),
      tabContentChem: document.getElementById("tab-content-chem"),
      tabContentNrg: document.getElementById("tab-content-nrg"),

      // NRG Analysis Panel
      nrgTotalKcal: document.getElementById("nrg-total-kcal"),
      nrgTotalKj: document.getElementById("nrg-total-kj"),
      nrgHealthBadge: document.getElementById("nrg-health-badge"),
      nrgValEbond: document.getElementById("nrg-val-ebond"),
      nrgMeterEbond: document.getElementById("nrg-meter-ebond"),
      nrgValEangle: document.getElementById("nrg-val-eangle"),
      nrgMeterEangle: document.getElementById("nrg-meter-eangle"),
      nrgValEvdw: document.getElementById("nrg-val-evdw"),
      nrgMeterEvdw: document.getElementById("nrg-meter-evdw"),
      nrgValEelec: document.getElementById("nrg-val-eelec"),
      nrgMeterEelec: document.getElementById("nrg-meter-eelec"),
      nrgHomoVal: document.getElementById("nrg-homo-val"),
      nrgLumoVal: document.getElementById("nrg-lumo-val"),
      nrgGapVal: document.getElementById("nrg-gap-val"),
      nrgBboxVal: document.getElementById("nrg-bbox-val"),
      nrgSasaVal: document.getElementById("nrg-sasa-val"),
      btnRunAnneal: document.getElementById("btn-run-anneal"),

      // Full Periodic Table
      periodicModal: document.getElementById("periodic-modal"),
      btnOpenPt: document.getElementById("btn-open-pt"),
      btnClosePt: document.getElementById("btn-close-pt"),
      ptSearchInput: document.getElementById("pt-search-input"),
      ptGrid: document.getElementById("pt-18col-grid")
    };
  }

  /* ==========================================================================
     1. INTRO ANIMATION ("NRG COREX")
     ========================================================================== */
  initIntroAnimation() {
    // Play intro sound chime
    setTimeout(() => {
      this.audio.playChemicalSuccess();
    }, 400);

    // Auto open shutter window after 1.8s
    setTimeout(() => {
      if (this.dom.introScreen) {
        this.dom.introScreen.classList.add("open");
      }
    }, 1800);

    // Fade intro out completely after 2.8s
    const endIntro = () => {
      if (this.dom.introScreen) {
        this.dom.introScreen.classList.add("hide");
        setTimeout(() => {
          this.dom.introScreen.style.display = "none";
        }, 800);
      }
    };

    setTimeout(endIntro, 2800);

    if (this.dom.btnSkipIntro) {
      this.dom.btnSkipIntro.addEventListener("click", () => endIntro());
    }
  }

  /* ==========================================================================
     2. HUB LAUNCHER NAVIGATION
     ========================================================================== */
  initHubNavigation() {
    // Launch 3D Space
    if (this.dom.btnLaunch3d) {
      this.dom.btnLaunch3d.addEventListener("click", () => {
        this.dom.viewHub.classList.add("hidden");
        this.dom.view3d.classList.remove("hidden");
        this.audio.playClick();
        if (this.renderer) {
          this.renderer.onWindowResize();
          this.renderer.resetCamera(this.graph);
        }
      });
    }

    // Launch Lab Demo
    if (this.dom.btnLaunchLab) {
      this.dom.btnLaunchLab.addEventListener("click", () => {
        this.dom.viewHub.classList.add("hidden");
        this.dom.viewLab.classList.remove("hidden");
        this.audio.playClick();
      });
    }

    // Return to Hub from Lab
    if (this.dom.btnLabBack) {
      this.dom.btnLabBack.addEventListener("click", () => {
        this.dom.viewLab.classList.add("hidden");
        this.dom.viewHub.classList.remove("hidden");
        this.audio.playClick();
      });
    }

    // Return to Hub from 3D Space
    if (this.dom.btn3dBackHub) {
      this.dom.btn3dBackHub.addEventListener("click", () => {
        this.dom.view3d.classList.add("hidden");
        this.dom.viewHub.classList.remove("hidden");
        this.audio.playClick();
      });
    }

    // Hub audio toggle
    if (this.dom.btnHubAudio) {
      this.dom.btnHubAudio.addEventListener("click", () => {
        const isMuted = this.audio.toggleMute();
        this.dom.btnHubAudio.textContent = isMuted ? "🔇 Unmute" : "🔊 Sound ON";
        const btn3dAudio = document.getElementById("btn-toggle-audio");
        if (btn3dAudio) btn3dAudio.textContent = this.dom.btnHubAudio.textContent;
      });
    }
  }

  /* ==========================================================================
     3. VIRTUAL LAB DEMO (Maintenance Preview)
     ========================================================================== */
  initLabDemo() {
    const reagentBtns = document.querySelectorAll(".lab-reagent-btn");
    reagentBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const reagent = btn.dataset.reagent;
        this.applyLabReagent(reagent);
        this.audio.playBondSnap();
      });
    });

    if (this.dom.labBurnerSlider) {
      this.dom.labBurnerSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        this.labState.flameLevel = val;
        if (val === 0) {
          this.dom.labFlameElement.style.display = "none";
          this.dom.labFlameText.textContent = "Off (0%)";
          this.labState.temp = 25;
        } else if (val === 1) {
          this.dom.labFlameElement.style.display = "block";
          this.dom.labFlameElement.style.background = "radial-gradient(ellipse at bottom, #38bdf8 0%, #f59e0b 60%, transparent 80%)";
          this.dom.labFlameText.textContent = "Blue (Medium)";
          this.labState.temp = 65;
        } else if (val === 2) {
          this.dom.labFlameElement.style.display = "block";
          this.dom.labFlameElement.style.background = "radial-gradient(ellipse at bottom, #a855f7 0%, #00f2fe 70%, transparent 85%)";
          this.dom.labFlameText.textContent = "Roaring Torch (100°C)";
          this.labState.temp = 100;
        }
        if (this.dom.labTempVal) this.dom.labTempVal.textContent = `${this.labState.temp}°C`;
        this.audio.playClick();
      });
    }

    if (this.dom.btnLabReset) {
      this.dom.btnLabReset.addEventListener("click", () => {
        this.labState = {
          ph: 7.0,
          temp: 25,
          flameLevel: 1,
          hasIndicator: false,
          color: "linear-gradient(180deg, #38bdf8, #0284c7)",
          reagents: []
        };
        this.dom.labFlaskLiquid.style.background = this.labState.color;
        this.dom.labPhVal.textContent = "7.0";
        this.dom.labTempVal.textContent = "25°C";
        this.dom.labReactionLog.innerHTML = "<div>[Reset] Flask rinsed with distilled H₂O. Reagents cleared.</div>";
        this.audio.playDelete();
      });
    }
  }

  applyLabReagent(reagent) {
    const log = this.dom.labReactionLog;
    if (reagent === "hcl") {
      this.labState.ph = Math.max(1.0, +(this.labState.ph - 2.8).toFixed(1));
      if (this.labState.hasIndicator) {
        this.labState.color = "linear-gradient(180deg, #f8fafc, #cbd5e1)"; // Colorless in acid
      }
      log.innerHTML += `<div>+ Added 1.0 M HCl. Solution pH decreased to <strong>${this.labState.ph}</strong>.</div>`;
    } else if (reagent === "naoh") {
      this.labState.ph = Math.min(14.0, +(this.labState.ph + 3.2).toFixed(1));
      if (this.labState.hasIndicator && this.labState.ph >= 8.2) {
        this.labState.color = "linear-gradient(180deg, #ec4899, #be185d)"; // Vivid pink in base
      }
      log.innerHTML += `<div>+ Added 1.0 M NaOH. Solution pH increased to <strong>${this.labState.ph}</strong>.</div>`;
    } else if (reagent === "indicator") {
      this.labState.hasIndicator = true;
      if (this.labState.ph >= 8.2) {
        this.labState.color = "linear-gradient(180deg, #ec4899, #be185d)";
      } else {
        this.labState.color = "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.4))";
      }
      log.innerHTML += `<div>+ Added Phenolphthalein. Endpoint transition active (pink if pH > 8.2).</div>`;
    } else if (reagent === "cuso4") {
      this.labState.color = "linear-gradient(180deg, #0284c7, #0369a1)"; // Deep blue copper sol
      log.innerHTML += `<div>+ Dissolved CuSO₄ crystals. Deep blue Cu²⁺ coordination complex formed.</div>`;
    } else if (reagent === "fe") {
      this.labState.color = "linear-gradient(180deg, #10b981, #047857)"; // Green FeSO4
      log.innerHTML += `<div>+ Added Fe powder: Fe + CuSO₄ ➔ FeSO₄ + Cu(s) single displacement!</div>`;
    }

    if (this.dom.labFlaskLiquid) {
      this.dom.labFlaskLiquid.style.background = this.labState.color;
    }
    if (this.dom.labPhVal) {
      this.dom.labPhVal.textContent = String(this.labState.ph);
    }
    log.scrollTop = log.scrollHeight;
  }

  /* ==========================================================================
     4. 3D MOLECULAR WORKSPACE INITIALIZATION
     ========================================================================== */
  init3DWorkspace() {
    this.renderer = new Renderer3D(this.dom.viewport);
    this.setupInteractions();
    this.setupToolbarButtons();
    this.setupKeyboardShortcuts();
    this.setupTabNavigation();

    // 60 FPS animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupTabNavigation() {
    if (this.dom.tabBtnChem && this.dom.tabBtnNrg) {
      this.dom.tabBtnChem.addEventListener("click", () => {
        this.dom.tabBtnChem.classList.add("active");
        this.dom.tabBtnNrg.classList.remove("active");
        this.dom.tabContentChem.classList.remove("hidden");
        this.dom.tabContentNrg.classList.add("hidden");
        this.activeTab = "chem";
        this.audio.playClick();
      });

      this.dom.tabBtnNrg.addEventListener("click", () => {
        this.dom.tabBtnNrg.classList.add("active");
        this.dom.tabBtnChem.classList.remove("active");
        this.dom.tabContentNrg.classList.remove("hidden");
        this.dom.tabContentChem.classList.add("hidden");
        this.activeTab = "nrg";
        this.audio.playClick();
        this.updateNRGAnalysis();
      });
    }

    // Run NRG Annealing / Minimization
    if (this.dom.btnRunAnneal) {
      this.dom.btnRunAnneal.addEventListener("click", () => {
        this.showToast("Starting NRG Simulated Annealing Minimization...");
        this.physics.setTemperature(300); // warm up
        this.audio.playDeformStretch();

        let step = 0;
        const interval = setInterval(() => {
          step++;
          this.physics.step();
          if (step > 40) {
            this.physics.setTemperature(Math.max(0, 300 - (step - 40) * 8));
          }
          if (step >= 80) {
            clearInterval(interval);
            this.physics.setTemperature(0);
            this.physics.optimizeGeometry(60);
            this.renderer.syncGraph(this.graph);
            this.audio.playChemicalSuccess();
            this.updateAnalysis();
            this.showToast("NRG Ground State Achieved! Global energy minimum reached.");
          }
        }, 20);
      });
    }
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    if (this.physics.enabled || this.physics.draggedAtom) {
      this.physics.step();
    }

    this.renderer.syncGraph(this.graph);
    this.renderer.render();

    if (this.lastTime) {
      const delta = time - this.lastTime;
      const fps = Math.round(1000 / delta);
      if (this.dom.fpsText && Math.random() < 0.05) {
        this.dom.fpsText.textContent = `${fps} FPS`;
      }
    }
    this.lastTime = time;
  }

  async updateAnalysis() {
    const analysis = this.iupacEngine.analyze(this.graph);

    // Chemical Info Tab updates
    if (this.dom.formulaText) this.dom.formulaText.innerHTML = analysis.formulaHtml || "Empty";
    if (this.dom.iupacText) this.dom.iupacText.textContent = analysis.iupacName || "No structure";
    if (this.dom.commonNameText) this.dom.commonNameText.textContent = analysis.commonName !== "None" ? `(${analysis.commonName})` : "";
    if (this.dom.categoryBadge) this.dom.categoryBadge.textContent = analysis.category || "Organic";
    if (this.dom.molWeightText) this.dom.molWeightText.textContent = `${analysis.molecularWeight} g/mol`;

    if (this.dom.atomCountText) this.dom.atomCountText.textContent = `${this.graph.atoms.length} Atoms`;
    if (this.dom.bondCountText) this.dom.bondCountText.textContent = `${this.graph.bonds.length} Bonds`;

    if (this.dom.valencyStatus) {
      const report = analysis.valencyReport;
      if (report.issues.length === 0 && this.graph.atoms.length > 0) {
        this.dom.valencyStatus.className = "status-badge status-valid";
        this.dom.valencyStatus.innerHTML = `<span class="dot"></span> All Valencies Satisfied`;
      } else if (report.issues.length > 0) {
        const hasHyper = report.issues.some(i => i.includes("hypervalent") || i.includes("max"));
        this.dom.valencyStatus.className = hasHyper ? "status-badge status-error" : "status-badge status-warning";
        this.dom.valencyStatus.innerHTML = `<span class="dot"></span> ${report.issues[0]}`;
      } else {
        this.dom.valencyStatus.className = "status-badge status-neutral";
        this.dom.valencyStatus.innerHTML = `<span class="dot"></span> Ready`;
      }
    }

    if (this.dom.compositionBars) {
      this.dom.compositionBars.innerHTML = "";
      analysis.composition.forEach(c => {
        const item = document.createElement("div");
        item.className = "comp-row";
        item.innerHTML = `
          <div class="comp-label">
            <span class="color-chip" style="background: ${c.color}"></span>
            <span class="comp-sym">${c.symbol}</span>
            <span class="comp-pct">${c.percentage}%</span>
          </div>
          <div class="comp-bar-bg">
            <div class="comp-bar-fill" style="width: ${c.percentage}%; background: ${c.color}"></div>
          </div>
        `;
        this.dom.compositionBars.appendChild(item);
      });
    }

    const dipoleMagElem = document.getElementById("metric-dipole");
    if (dipoleMagElem) dipoleMagElem.textContent = `${analysis.dipoleMoment.magnitude} D`;
    const geomElem = document.getElementById("metric-geometry");
    if (geomElem) geomElem.textContent = analysis.geometry || "VSEPR";

    this.updateSelectedAtomInspector();
    this.updateNRGAnalysis();
  }

  updateNRGAnalysis() {
    const nrg = this.nrgAnalyzer.computeFullNRG();

    if (this.dom.nrgTotalKcal) this.dom.nrgTotalKcal.textContent = nrg.totalEnergyKcal.toFixed(2);
    if (this.dom.nrgTotalKj) this.dom.nrgTotalKj.textContent = `(${nrg.totalEnergyKj.toFixed(2)} kJ/mol)`;

    if (this.dom.nrgHealthBadge) {
      this.dom.nrgHealthBadge.className = `status-badge status-${nrg.stabilityClass}`;
      this.dom.nrgHealthBadge.innerHTML = `<span class="dot"></span> ${nrg.stabilityRating}`;
    }

    if (this.dom.nrgValEbond) this.dom.nrgValEbond.textContent = `${nrg.eBond.toFixed(2)} kcal/mol`;
    if (this.dom.nrgMeterEbond) this.dom.nrgMeterEbond.style.width = `${Math.min(100, (nrg.eBond / (nrg.totalEnergyKcal || 1)) * 100)}%`;

    if (this.dom.nrgValEangle) this.dom.nrgValEangle.textContent = `${nrg.eAngle.toFixed(2)} kcal/mol`;
    if (this.dom.nrgMeterEangle) this.dom.nrgMeterEangle.style.width = `${Math.min(100, (nrg.eAngle / (nrg.totalEnergyKcal || 1)) * 100)}%`;

    if (this.dom.nrgValEvdw) this.dom.nrgValEvdw.textContent = `${nrg.eVdW.toFixed(2)} kcal/mol`;
    if (this.dom.nrgMeterEvdw) this.dom.nrgMeterEvdw.style.width = `${Math.min(100, (nrg.eVdW / (nrg.totalEnergyKcal || 1)) * 100)}%`;

    if (this.dom.nrgValEelec) this.dom.nrgValEelec.textContent = `${nrg.eElec.toFixed(2)} kcal/mol`;
    if (this.dom.nrgMeterEelec) this.dom.nrgMeterEelec.style.width = `${Math.min(100, Math.abs(nrg.eElec) * 5)}%`;

    if (this.dom.nrgHomoVal) this.dom.nrgHomoVal.textContent = `${nrg.homo} eV`;
    if (this.dom.nrgLumoVal) this.dom.nrgLumoVal.textContent = `${nrg.lumo} eV`;
    if (this.dom.nrgGapVal) this.dom.nrgGapVal.textContent = `${nrg.gap} eV`;

    if (this.dom.nrgBboxVal) {
      const b = nrg.boundingBox;
      this.dom.nrgBboxVal.textContent = `${b.x} × ${b.y} × ${b.z} Å`;
    }
    if (this.dom.nrgSasaVal) this.dom.nrgSasaVal.textContent = `${nrg.sasa} Å²`;
  }

  updateSelectedAtomInspector() {
    if (!this.dom.selectedAtomInfo) return;
    if (this.renderer.selectedAtoms.length === 1) {
      const a = this.renderer.selectedAtoms[0];
      const neighbors = a.getNeighbors().map(n => `${n.symbol}#${n.id}`).join(", ") || "None";
      this.dom.selectedAtomInfo.innerHTML = `
        <div class="atom-card">
          <div class="atom-card-header">
            <span class="atom-badge" style="background: ${a.element.cpkColor}; color: ${a.element.symbol === 'H' ? '#000' : '#fff'}">
              ${a.symbol}
            </span>
            <div>
              <div class="atom-title">${a.element.name} (Z = ${a.element.number})</div>
              <div class="atom-sub">Hybridization: <strong>${a.hybridization.toUpperCase()}</strong></div>
            </div>
          </div>
          <div class="atom-props-grid">
            <div><span class="lbl">Valence:</span> ${a.getTotalBondOrder()} / ${a.element.typicalValency}</div>
            <div><span class="lbl">Formal Charge:</span> ${a.formalCharge >= 0 ? '+' : ''}${a.formalCharge}</div>
            <div><span class="lbl">Partial Charge:</span> ${a.partialCharge} e</div>
            <div><span class="lbl">Coordination:</span> ${a.getCoordinationNumber()}</div>
            <div><span class="lbl">Covalent Radius:</span> ${a.element.covalentRadius} Å</div>
            <div><span class="lbl">vdW Radius:</span> ${a.element.vdwRadius} Å</div>
          </div>
          <div class="atom-bonds-row"><span class="lbl">Bonds:</span> ${neighbors}</div>
        </div>
      `;
    } else if (this.renderer.selectedAtoms.length > 1) {
      this.dom.selectedAtomInfo.innerHTML = `
        <div class="text-sm text-cyan">
          ${this.renderer.selectedAtoms.length} atoms selected. Click "Measure Angle" or press Delete.
        </div>
      `;
    } else {
      this.dom.selectedAtomInfo.innerHTML = `
        <div class="text-xs text-muted">Click any atom in 3D to inspect hybridization, formal charge, and local coordination.</div>
      `;
    }
  }

  setupInteractions() {
    const canvas = this.renderer.renderer.domElement;
    let isMouseDown = false;
    let isDraggingAtom = false;
    let activeDragAtom = null;

    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      isMouseDown = true;

      const hit = this.renderer.raycast(e.clientX, e.clientY);

      if (this.activeTool === "select") {
        if (hit && hit.type === "atom") {
          if (e.shiftKey) {
            const idx = this.renderer.selectedAtoms.indexOf(hit.atom);
            if (idx >= 0) this.renderer.selectedAtoms.splice(idx, 1);
            else this.renderer.selectedAtoms.push(hit.atom);
          } else {
            this.renderer.selectedAtoms = [hit.atom];
          }
          this.audio.playClick();
          this.updateAnalysis();
        } else if (!hit) {
          if (!e.shiftKey) this.renderer.selectedAtoms = [];
          this.updateAnalysis();
        }
      } else if (this.activeTool === "drag" || this.activeTool === "deform") {
        if (hit && hit.type === "atom") {
          isDraggingAtom = true;
          activeDragAtom = hit.atom;
          this.renderer.controls.enabled = false;

          const intersection = this.renderer.getPlaneIntersection(e.clientX, e.clientY, hit.atom.position);
          if (intersection) {
            this.physics.startDragging(hit.atom, intersection);
            this.audio.playDeformStretch();
          }
        }
      } else if (this.activeTool === "bond") {
        if (hit && hit.type === "atom") {
          if (!this.bondingSourceAtom) {
            this.bondingSourceAtom = hit.atom;
            this.renderer.selectedAtoms = [hit.atom];
            this.showToast(`Selected ${hit.atom.symbol}#${hit.atom.id}. Now click another atom to bond!`);
            this.audio.playClick();
          } else {
            if (this.bondingSourceAtom !== hit.atom) {
              const existing = this.graph.getBondBetween(this.bondingSourceAtom, hit.atom);
              if (existing) {
                if (existing.order === 1) existing.order = 2;
                else if (existing.order === 2) existing.order = 3;
                else if (existing.order === 3) this.graph.removeBond(existing);
              } else {
                this.graph.addBond(this.bondingSourceAtom, hit.atom, 1);
                this.audio.playBondSnap();
              }
              this.showToast(`Connected ${this.bondingSourceAtom.symbol} and ${hit.atom.symbol}!`);
              this.bondingSourceAtom = null;
              this.renderer.selectedAtoms = [];
              this.updateAnalysis();
            } else {
              this.bondingSourceAtom = null;
              this.renderer.selectedAtoms = [];
            }
          }
        } else if (hit && hit.type === "bond") {
          hit.bond.order = (hit.bond.order % 3) + 1;
          this.audio.playClick();
          this.graph.updateAllHybridizations();
          this.updateAnalysis();
          this.showToast(`Changed bond order to ${hit.bond.order}`);
        }
      } else if (this.activeTool === "cut") {
        if (hit && hit.type === "atom") {
          this.graph.removeAtom(hit.atom);
          this.audio.playDelete();
          this.renderer.selectedAtoms = [];
          this.updateAnalysis();
          this.showToast(`Deleted atom ${hit.atom.symbol}`);
        } else if (hit && hit.type === "bond") {
          this.graph.removeBond(hit.bond);
          this.audio.playDelete();
          this.updateAnalysis();
          this.showToast("Severed bond");
        }
      } else if (this.activeTool === "place") {
        let targetPos = new THREE.Vector3(0, 0, 0);
        if (hit && hit.point) {
          targetPos = hit.point.clone().add(new THREE.Vector3(1.2, 0, 0));
        } else {
          const plane = this.renderer.getPlaneIntersection(e.clientX, e.clientY, new THREE.Vector3(0, 0, 0));
          if (plane) targetPos = plane;
        }

        const newAtom = this.graph.addAtom(this.selectedElementSymbol, targetPos.x, targetPos.y, targetPos.z);
        this.audio.playAtomSpawn();
        this.showToast(`Placed new ${newAtom.element.name} (${newAtom.symbol})`);
        this.updateAnalysis();
      } else if (this.activeTool === "measure") {
        if (hit && hit.type === "atom") {
          this.measureAtoms.push(hit.atom);
          this.renderer.selectedAtoms = [...this.measureAtoms];

          if (this.measureAtoms.length === 2) {
            const dist = hit.atom.position.distanceTo(this.measureAtoms[0].position);
            this.showToast(`Distance: ${dist.toFixed(3)} Å`);
          } else if (this.measureAtoms.length === 3) {
            const angle = this.graph.measureAngle(this.measureAtoms[0], this.measureAtoms[1], this.measureAtoms[2]);
            this.showToast(`Angle around ${this.measureAtoms[1].symbol}: ${angle}°`);
            this.measureAtoms = [];
          }
          this.audio.playClick();
          this.updateAnalysis();
        }
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      const hit = this.renderer.raycast(e.clientX, e.clientY);
      if (hit && hit.type === "atom") {
        this.renderer.hoveredAtom = hit.atom;
        this.renderer.hoveredBond = null;
        canvas.style.cursor = this.activeTool === "cut" ? "crosshair" : "pointer";
      } else if (hit && hit.type === "bond") {
        this.renderer.hoveredBond = hit.bond;
        this.renderer.hoveredAtom = null;
        canvas.style.cursor = "pointer";
      } else {
        this.renderer.hoveredAtom = null;
        this.renderer.hoveredBond = null;
        canvas.style.cursor = "default";
      }

      if (isDraggingAtom && activeDragAtom) {
        const intersection = this.renderer.getPlaneIntersection(e.clientX, e.clientY, activeDragAtom.position);
        if (intersection) {
          this.physics.updateDragTarget(intersection);
          this.updateAnalysis();
        }
      }
    });

    window.addEventListener("pointerup", () => {
      if (isDraggingAtom) {
        this.physics.stopDragging();
        isDraggingAtom = false;
        activeDragAtom = null;
        this.renderer.controls.enabled = true;
        this.updateAnalysis();
      }
      isMouseDown = false;
    });
  }

  setupToolbarButtons() {
    const toolButtons = document.querySelectorAll(".tool-btn");
    toolButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        toolButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeTool = btn.dataset.tool;
        this.bondingSourceAtom = null;
        this.measureAtoms = [];
        this.audio.playClick();
        this.updateToolHint();
      });
    });

    const elemChips = document.querySelectorAll(".element-chip");
    elemChips.forEach(chip => {
      chip.addEventListener("click", () => {
        elemChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.selectedElementSymbol = chip.dataset.symbol;
        this.activeTool = "place";
        toolButtons.forEach(b => b.classList.toggle("active", b.dataset.tool === "place"));
        this.audio.playClick();
        this.showToast(`Selected ${this.selectedElementSymbol}. Click in 3D canvas to place.`);
        this.updateToolHint();
      });
    });

    const presetSelect = document.getElementById("preset-select");
    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val) {
          loadPresetIntoGraph(val, this.graph, this.physics);
          this.renderer.resetCamera(this.graph);
          this.audio.playChemicalSuccess();
          this.updateAnalysis();
          this.showToast(`Loaded preset: ${PRESETS[val].name}`);
        }
      });
    }

    const btnAddH = document.getElementById("btn-add-h");
    if (btnAddH) {
      btnAddH.addEventListener("click", () => {
        const { newAtoms } = this.physics.addHydrogens();
        this.audio.playChemicalSuccess();
        this.renderer.syncGraph(this.graph);
        this.updateAnalysis();
        this.showToast(`Added ${newAtoms.length} Hydrogen atoms according to VSEPR valency!`);
      });
    }

    const btnClean3d = document.getElementById("btn-clean-3d");
    if (btnClean3d) {
      btnClean3d.addEventListener("click", () => {
        this.physics.optimizeGeometry(120);
        this.renderer.syncGraph(this.graph);
        this.renderer.resetCamera(this.graph);
        this.audio.playClick();
        this.updateAnalysis();
        this.showToast("3D Molecular geometry minimized & relaxed!");
      });
    }

    const btnClear = document.getElementById("btn-clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        this.graph.clear();
        this.renderer.selectedAtoms = [];
        this.bondingSourceAtom = null;
        this.audio.playDelete();
        this.updateAnalysis();
        this.showToast("Workspace cleared");
      });
    }

    const btnPhysics = document.getElementById("btn-toggle-physics");
    if (btnPhysics) {
      btnPhysics.addEventListener("click", () => {
        this.physics.enabled = !this.physics.enabled;
        btnPhysics.classList.toggle("active", this.physics.enabled);
        btnPhysics.innerHTML = this.physics.enabled ? "<span>⏸</span> Pause Physics" : "<span>▶</span> Resume Physics";
        this.showToast(this.physics.enabled ? "Real-time physics active" : "Physics paused: free plastic deformation mode");
      });
    }

    const tempSlider = document.getElementById("temp-slider");
    const tempVal = document.getElementById("temp-val");
    if (tempSlider) {
      tempSlider.addEventListener("input", (e) => {
        const t = parseInt(e.target.value, 10);
        this.physics.setTemperature(t);
        if (tempVal) tempVal.textContent = `${t} K`;
      });
    }

    const styleButtons = document.querySelectorAll(".style-btn");
    styleButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        styleButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderer.styleMode = btn.dataset.style;
        this.renderer.syncGraph(this.graph);
        this.audio.playClick();
      });
    });

    const btnDipole = document.getElementById("btn-toggle-dipole");
    if (btnDipole) {
      btnDipole.addEventListener("click", () => {
        this.renderer.showDipole = !this.renderer.showDipole;
        btnDipole.classList.toggle("active", this.renderer.showDipole);
        this.renderer.updateOverlays(this.graph);
      });
    }

    const btnAudio = document.getElementById("btn-toggle-audio");
    if (btnAudio) {
      btnAudio.addEventListener("click", () => {
        const isMuted = this.audio.toggleMute();
        btnAudio.innerHTML = isMuted ? "🔇 Unmute" : "🔊 Sound ON";
      });
    }

    const btnExportMol = document.getElementById("btn-export-mol");
    if (btnExportMol) btnExportMol.addEventListener("click", () => this.downloadFile("molecule.mol", this.graph.toMOL(), "chemical/x-mdl-molfile"));
    const btnExportXyz = document.getElementById("btn-export-xyz");
    if (btnExportXyz) btnExportXyz.addEventListener("click", () => this.downloadFile("molecule.xyz", this.graph.toXYZ(), "text/plain"));
    const btnExportPdb = document.getElementById("btn-export-pdb");
    if (btnExportPdb) btnExportPdb.addEventListener("click", () => this.downloadFile("molecule.pdb", this.graph.toPDB(), "chemical/x-pdb"));
    const btnExportPng = document.getElementById("btn-export-png");
    if (btnExportPng) {
      btnExportPng.addEventListener("click", () => {
        const dataUrl = this.renderer.captureScreenshot();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${this.graph.calculateFormula().plain || "molecule"}.png`;
        a.click();
      });
    }

    const btnCopyIupac = document.getElementById("btn-copy-iupac");
    if (btnCopyIupac) {
      btnCopyIupac.addEventListener("click", () => {
        const name = this.dom.iupacText.textContent;
        navigator.clipboard.writeText(name);
        this.showToast(`Copied IUPAC name: "${name}"`);
      });
    }
  }

  updateToolHint() {
    if (!this.dom.toolHint) return;
    const hints = {
      select: "Click to select and inspect an atom. Shift+click for multi-select. Drag canvas to orbit camera.",
      drag: "Click and drag any atom in 3D. Connected bonds will elastic stretch & flex naturally.",
      deform: "Deform Mode: Pull and bend bonds. Toggle physics off to keep deformed shapes.",
      bond: "Clubbing / Bonding: Click first atom, then click second atom to create or strengthen bonds.",
      cut: "Scissor Tool: Click any bond to sever it, or click an atom to disintegrate it.",
      place: `Click anywhere in 3D space to spawn a new ${this.selectedElementSymbol} atom.`,
      measure: "Select 2 atoms for distance, or 3 atoms for bond angle in degrees."
    };
    this.dom.toolHint.textContent = hints[this.activeTool] || "";
  }

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        const btn = document.getElementById("btn-toggle-physics");
        if (btn) btn.click();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (this.renderer.selectedAtoms.length > 0) {
          const toRemove = [...this.renderer.selectedAtoms];
          toRemove.forEach(a => this.graph.removeAtom(a));
          this.renderer.selectedAtoms = [];
          this.audio.playDelete();
          this.updateAnalysis();
          this.showToast("Deleted selected atom(s)");
        }
      } else if (e.key === "h" || e.key === "H") {
        const btn = document.getElementById("btn-add-h");
        if (btn) btn.click();
      } else if (e.key === "c" || e.key === "C") {
        const btn = document.getElementById("btn-clean-3d");
        if (btn) btn.click();
      } else if (e.key === "r" || e.key === "R") {
        this.renderer.resetCamera(this.graph);
      }
    });
  }

  /* ==========================================================================
     5. COMPLETE 118-ELEMENT PERIODIC TABLE MODAL
     ========================================================================== */
  initPeriodicTableModal() {
    if (this.dom.btnOpenPt && this.dom.periodicModal) {
      this.dom.btnOpenPt.addEventListener("click", () => {
        this.dom.periodicModal.classList.add("open");
        this.render118PeriodicGrid("all");
      });
    }
    if (this.dom.btnClosePt && this.dom.periodicModal) {
      this.dom.btnClosePt.addEventListener("click", () => {
        this.dom.periodicModal.classList.remove("open");
      });
    }

    // Search filter
    if (this.dom.ptSearchInput) {
      this.dom.ptSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.render118PeriodicGrid("all", query);
      });
    }

    // Category filter chips
    const filterChips = document.querySelectorAll(".pt-filter-chip");
    filterChips.forEach(chip => {
      chip.addEventListener("click", () => {
        filterChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const filter = chip.dataset.filter;
        this.render118PeriodicGrid(filter);
      });
    });
  }

  render118PeriodicGrid(filterCategory = "all", searchQuery = "") {
    const grid = this.dom.ptGrid;
    if (!grid) return;
    grid.innerHTML = "";

    ELEMENT_LIST.forEach(elem => {
      // Filter logic
      if (filterCategory !== "all" && elem.category !== filterCategory) return;
      if (searchQuery) {
        const matchSym = elem.symbol.toLowerCase().includes(searchQuery);
        const matchName = elem.name.toLowerCase().includes(searchQuery);
        const matchNum = String(elem.number) === searchQuery;
        if (!matchSym && !matchName && !matchNum) return;
      }

      const cell = document.createElement("div");
      cell.className = `pt-cell-118 pt-cat-${elem.category}`;
      // Set grid row & col for IUPAC layout if no search filter
      if (!searchQuery && filterCategory === "all") {
        cell.style.gridRow = elem.period;
        cell.style.gridColumn = elem.group;
      }

      cell.innerHTML = `
        <span class="pt-cell-num">${elem.number}</span>
        <span class="pt-cell-sym" style="color: ${elem.cpkColor === '#FFFFFF' ? '#fff' : elem.cpkColor}">${elem.symbol}</span>
        <span class="pt-cell-name">${elem.name}</span>
      `;

      cell.addEventListener("click", () => {
        this.selectedElementSymbol = elem.symbol;
        this.activeTool = "place";
        this.dom.periodicModal.classList.remove("open");
        this.audio.playClick();
        this.showToast(`Equipped ${elem.name} (${elem.symbol}, Z = ${elem.number}). Click 3D canvas to place.`);
        this.updateToolHint();

        // Update active quick chip if present
        const quickChips = document.querySelectorAll(".element-chip");
        quickChips.forEach(c => c.classList.toggle("active", c.dataset.symbol === elem.symbol));
      });

      grid.appendChild(cell);
    });
  }

  showToast(message) {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${filename}`);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.nrgApp = new NRGCorexApp();
});
