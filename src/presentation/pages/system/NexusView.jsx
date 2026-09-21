import { useState, useMemo } from 'react';
import AnimatedPage from '../../components/common/AnimatedPage';
import {
  GitBranch,
  Layers,
  ArrowRight,
  Package,
  Cpu,
  MapPin,
  Tag,
  Users,
  Wrench,
  Boxes,
  FingerprintPattern,
  Factory,
  Zap,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { HubIcon } from '../../components/common/icons/HubIcon';
import { CategoryIcon } from '../../components/common/icons/CategoryIcon';
import { SpokeIcon } from '../../components/common/icons/SpokeIcon';
import { CubeIcon } from '../../components/common/icons/CubeIcon';
import { LayersIcon } from '../../components/common/icons/LayersIcon';
import { Machine } from '../../../core/domain';

// Helper: Check if 2 machines/BOMs are identical (Twins)

export default function NexusView({
  types = [],
  diagnostics = [],
  families = [],
  templates = [],
  blueprints = [],
  zones = [],
  technicians = [],
  operations = [],
  machines = [],
  stockItems = [],
  compFamilies = [],
  compTemplates = [],
  partTypes = [],
  warehouseItems = [],
  mouvements = [],
  onNavigate = () => {},
}) {
  const [selectedMachineCode, setSelectedMachineCode] = useState('');

  // Find active selected machine for the Nexus Inspector
  const selectedMachine = useMemo(() => {
    if (!selectedMachineCode && machines.length > 0) {
      return machines[0];
    }
    return machines.find((m) => m.id_machine_registered === selectedMachineCode) || machines[0] || null;
  }, [selectedMachineCode, machines]);

  // Extract machine's real lifecycle PDR consumptions from Mouvements
  const machinePdrHistory = useMemo(() => {
    if (!selectedMachine) return [];
    
    // Domain-Driven Design: Let the Machine instance figure out its own PDR history
    const machineInstance = new Machine(selectedMachine);
    const relatedMvts = machineInstance.getPDRHistory(mouvements);

    const map = new Map();
    relatedMvts.forEach((m) => {
      const ref = m.ref || m.id_article || 'PDR-REF';
      const existing = map.get(ref) || { ref, count: 0, totalQty: 0, lastDate: m.date };
      existing.count += 1;
      existing.totalQty += Math.abs(Number(m.quantite || m.qte) || 1);
      if (m.date && m.date > existing.lastDate) existing.lastDate = m.date;
      map.set(ref, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [selectedMachine, mouvements]);

  // Find linked blueprint for selected machine
  const linkedBlueprint = useMemo(() => {
    if (!selectedMachine) return null;
    return (
      blueprints.find((b) => b.id_blueprint === selectedMachine.id_blueprint) ||
      blueprints.find((b) => b.id_templates === selectedMachine.id_templates) ||
      null
    );
  }, [selectedMachine, blueprints]);

  // Find potential twin machines for selected machine
  const twinMachines = useMemo(() => {
    if (!selectedMachine) return [];
    return machines.filter(
      (m) =>
        m.id_machine_registered !== selectedMachine.id_machine_registered &&
        (m.id_blueprint === selectedMachine.id_blueprint ||
          (m.id_templates === selectedMachine.id_templates && m.id_family === selectedMachine.id_family))
    );
  }, [selectedMachine, machines]);

  return (
    <AnimatedPage className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Nexus Matrix : Architecture & Schéma des Liaisons GMAO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Visualisez l'interconnexion complète, la structure <b>BOM (Bill of Materials)</b> à 4 niveaux et les formules de calcul
            reliant <b className="text-blue-600">Stock PDR</b>, <b className="text-emerald-600">Machines (avec Blueprints)</b>,{' '}
            <b className="text-amber-600">Entrepôt Parts</b> et <b className="text-purple-600">Zones & Équipes</b>.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Stock PDR</div>
            <div className="text-xs font-mono font-bold text-blue-700">{stockItems.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Machines</div>
            <div className="text-xs font-mono font-bold text-emerald-700">{machines.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Blueprints</div>
            <div className="text-xs font-mono font-bold text-indigo-700">{blueprints.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">Entrepôt</div>
            <div className="text-xs font-mono font-bold text-amber-700">{warehouseItems.length}</div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Pillar 1: Stock PDR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">1. Stock PDR</h3>
                  <div className="text-[11px] text-slate-500">Type • Diag • Stock Actuel</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('stock')}
                className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-50 transition"
                title="Ouvrir Stock PDR"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Level 1: Type */}
              <div
                onClick={() => onNavigate('types')}
                className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 cursor-pointer hover:bg-cyan-100/70 transition"
              >
                <div className="font-bold text-cyan-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-600" />
                    <span>L1 : Type ({types.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-cyan-500" />
                </div>
                <div className="text-[11px] text-cyan-800 mt-1">
                  Catégorie parent : Mécanique, Fixation, Pneumatique...
                </div>
                <div className="mt-2 pt-1 border-t border-cyan-200/60 font-mono text-[9.5px] text-cyan-900">
                  Formule : <span className="font-semibold">=COUNTIF(Stock!D:D, [@id_type])</span>
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* Level 2: Diagnostic */}
              <div
                onClick={() => onNavigate('designations')}
                className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition"
              >
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>L2 : Diagnostic ({diagnostics.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  Motifs d'usure ou pannes rattachés à chaque Type.
                </div>
                <div className="mt-2 pt-1 border-t border-amber-200/60 font-mono text-[9.5px] text-amber-900">
                  Liaison : <span className="font-semibold">[@id_diag] → Diagnostic!B:B</span>
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* Central Output: Stock */}
              <div
                onClick={() => onNavigate('stock')}
                className="p-3.5 rounded-xl bg-slate-900 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Stock Actuel (PDR Focus)</span>
                  <span className="font-mono text-cyan-400 font-bold">{stockItems.length} refs</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Formules Excel en temps réel & Rapprochement journalier.
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800 font-mono text-[9.5px] text-emerald-400 flex items-center justify-between">
                  <span>Actuel : = E + F - G</span>
                  <span className="text-slate-400 text-[9px]">=Initial+Entrées-Sorties</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Machines Hierarchy with Blueprints */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">2. Groupe Machines</h3>
                  <div className="text-[11px] text-slate-500">Family • Template • Blueprint • MCH</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('machines')}
                className="text-slate-400 hover:text-emerald-600 p-1 rounded-lg hover:bg-slate-50 transition"
                title="Ouvrir Machines Registered"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* L1: Family */}
              <div
                onClick={() => onNavigate('families')}
                className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200 cursor-pointer hover:bg-cyan-100/70 transition"
              >
                <div className="font-bold text-cyan-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HubIcon className="w-3.5 h-3.5 text-cyan-600" />
                    <span>L1 : Family ({families.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-cyan-500" />
                </div>
                <div className="text-[10.5px] text-cyan-800 mt-0.5">
                  Famille technologique (POL, AMBO, REPO, DET...)
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* L2: Templates */}
              <div
                onClick={() => onNavigate('templates')}
                className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition"
              >
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CategoryIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>L2 : Templates ({templates.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[10.5px] text-amber-800 mt-0.5">
                  Modèles génériques du constructeur rattachés à la famille.
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* L3: Blueprints (BOM 4-Tabs) */}
              <div
                onClick={() => onNavigate('blueprints')}
                className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 cursor-pointer hover:bg-indigo-100/80 transition"
              >
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FingerprintPattern className="w-3.5 h-3.5 text-indigo-600" />
                    <span>L3 : Blueprints BOM ({blueprints.length})</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 text-[9.5px] font-bold">4-Tabs</span>
                </div>
                <div className="text-[10.5px] text-indigo-800 mt-0.5">
                  Document maître : Specs + Components + Parts + PDR théoriques.
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* L4: Registered Machines */}
              <div
                onClick={() => onNavigate('machines')}
                className="p-3 rounded-xl bg-slate-900 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Machines Registered</span>
                  <span className="font-mono text-emerald-400 font-bold">{machines.length} unités</span>
                </div>
                <div className="text-[10.5px] text-slate-300 mt-0.5">
                  Hérite du Blueprint (optionnel) + Zone + Technicien.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Entrepôt Parts & Components */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">3. Entrepôt Parts</h3>
                  <div className="text-[11px] text-slate-500">Comp • Templates • Parts Ref</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('entrepot')}
                className="text-slate-400 hover:text-amber-600 p-1 rounded-lg hover:bg-slate-50 transition"
                title="Ouvrir Entrepôt"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* L1: Comp Families */}
              <div
                onClick={() => onNavigate('comp_families')}
                className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer hover:bg-emerald-100/70 transition"
              >
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <SpokeIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>L1 : Comp Families ({compFamilies.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-[10.5px] text-emerald-800 mt-0.5">
                  Codes composants : EXT, VER, CYL, MOT...
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* L2: Comp Templates */}
              <div
                onClick={() => onNavigate('comp_templates')}
                className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer hover:bg-blue-100/70 transition"
              >
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CubeIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>L2 : Comp Templates ({compTemplates.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                </div>
                <div className="text-[10.5px] text-blue-800 mt-0.5">
                  Modèles (EXT-01, VER-01) ➔ Alimente Tab 2 Blueprint.
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* L3: Part Types & Designations */}
              <div
                onClick={() => onNavigate('part_types')}
                className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 cursor-pointer hover:bg-purple-100/70 transition"
              >
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LayersIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>L3 : Part Types ({partTypes.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-purple-500" />
                </div>
                <div className="text-[10.5px] text-purple-800 mt-0.5">
                  Références de pièces (VIS-M8) ➔ Alimente Tab 3 Blueprint.
                </div>
              </div>

              <div className="flex justify-center text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>

              {/* Central Output: Warehouse items */}
              <div
                onClick={() => onNavigate('entrepot')}
                className="p-3 rounded-xl bg-slate-900 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Stock Entrepôt (Parts & Comp)</span>
                  <span className="font-mono text-amber-400 font-bold">{warehouseItems.length} items</span>
                </div>
                <div className="text-[10.5px] text-slate-300 mt-0.5">
                  Magasin centralisé indépendant du Stock PDR.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Industrial Philosophy & Zones */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">4. Zones & Équipes</h3>
                  <div className="text-[11px] text-slate-500">Ateliers • Physiques • Mouvements</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('zones')}
                className="text-slate-400 hover:text-purple-600 p-1 rounded-lg hover:bg-slate-50 transition"
                title="Ouvrir Zones"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Zones card */}
              <div
                onClick={() => onNavigate('zones')}
                className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 cursor-pointer hover:bg-purple-100/70 transition"
              >
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-purple-600" />
                    <span>Zones & Ateliers ({zones.length})</span>
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-purple-500" />
                </div>
                <div className="text-[10.5px] text-purple-800 mt-1 space-y-0.5">
                  <div className="truncate">• <b>FM:</b> Fabrication Mécanique (Usinage)</div>
                  <div className="truncate">• <b>Détourage:</b> Cisaillement & Ébavurage</div>
                  <div className="truncate">• <b>Presses:</b> Hydr. 200T-400T & Inj. Bakélite</div>
                  <div className="truncate">• <b>Finition:</b> Polissage, Satinage & Lignes FEMB</div>
                </div>
              </div>

              {/* Users & Teams */}
              <div
                onClick={() => onNavigate('utilisateurs')}
                className="grid grid-cols-2 gap-2 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 transition">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>Techs</span>
                  </div>
                  <div className="text-[10.5px] font-mono text-blue-700 mt-0.5">{technicians.length} membres</div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 hover:bg-indigo-100/70 transition">
                  <div className="font-bold text-indigo-900 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-indigo-600" />
                    <span>Opérations</span>
                  </div>
                  <div className="text-[10.5px] font-mono text-indigo-700 mt-0.5">{operations.length} profils</div>
                </div>
              </div>

              {/* Central Output: Movements */}
              <div
                onClick={() => onNavigate('sortie')}
                className="p-3 rounded-xl bg-slate-900 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Mouvements (Sortie Rapide)</span>
                  <span className="font-mono text-cyan-400 font-bold">{mouvements.length} ops</span>
                </div>
                <div className="text-[10.5px] text-slate-300 mt-0.5">
                  Alimente l'historique de consommation de chaque machine.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Nexus Inspector & Twin Machine Detector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Nexus Machine Inspector & Détecteur de Machines Jumelles (Twins)
              </h3>
              <p className="text-[11px] text-slate-500">
                Sélectionnez une machine pour extraire son empreinte BOM réelle, ses PDR consommées et comparer avec les autres machines.
              </p>
            </div>
          </div>

          {/* Machine Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMachine?.id_machine_registered || ''}
              onChange={(e) => setSelectedMachineCode(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {machines.map((m) => (
                <option key={m.id_machine_registered} value={m.id_machine_registered}>
                  {m.id_machine_registered} • {m.designation || m.nom || 'Machine'} ({m.id_family || ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMachine && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            {/* Card 1: Machine Identity & Linked Blueprint */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Identité Machine</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedMachine.status || 'En Service'}
                </span>
              </div>
              <div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {selectedMachine.id_machine_registered}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {selectedMachine.designation || selectedMachine.nom || 'Machine Industrielle'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Famille :</span>
                  <span className="font-semibold text-cyan-700">{selectedMachine.id_family || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modèle Template :</span>
                  <span className="font-semibold text-amber-700">{selectedMachine.id_templates || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zone / Secteur :</span>
                  <span className="font-semibold text-purple-700">{selectedMachine.id_zone_default || selectedMachine.id_zone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Technicien assigné :</span>
                  <span className="font-semibold text-blue-700">{selectedMachine.technician || '—'}</span>
                </div>
              </div>

              {/* Linked Blueprint Box */}
              <div className="mt-3 p-3 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                <div className="text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FingerprintPattern className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Blueprint Associé</span>
                  </span>
                  {selectedMachine.id_blueprint ? (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      {selectedMachine.id_blueprint}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Non assigné</span>
                  )}
                </div>
                {linkedBlueprint ? (
                  <div className="mt-1.5 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">{linkedBlueprint.libelle}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Plan: {linkedBlueprint.ref_plan || 'N/A'} • {linkedBlueprint.revision || 'Rev-A'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Cette machine fonctionne avec les paramètres d'usine de base. Vous pouvez lui assigner un Blueprint pour formaliser son BOM.
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Real PDR Consumed over Machine Lifecycle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>PDR Consommées Réellement (Mouvements)</span>
                </span>
                <span className="text-[10.5px] font-mono font-bold text-slate-600">
                  {machinePdrHistory.length} articles
                </span>
              </div>

              {machinePdrHistory.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {machinePdrHistory.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{p.ref}</div>
                        <div className="text-[10px] text-slate-400">Dernier remplacement : {p.lastDate || '—'}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-[11px]">
                          Qté : {p.totalQty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                  <ShieldCheck className="w-8 h-8 text-emerald-500/70 mb-1" />
                  <div className="text-xs font-semibold text-slate-600">Aucune panne ou sortie PDR enregistrée</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">Machine neuve ou sans maintenance corrective récente.</div>
                </div>
              )}
            </div>

            {/* Card 3: Twin Machines Analysis */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Machines Jumelles Potentielles (Twins)</span>
                </span>
                <span className="text-[10.5px] font-mono font-bold text-indigo-700">
                  {twinMachines.length} trouvées
                </span>
              </div>

              <div className="text-xs text-slate-600">
                Machines partageant la même famille technologique et le même modèle de base :
              </div>

              {twinMachines.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {twinMachines.map((tm) => (
                    <div
                      key={tm.id_machine_registered}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{tm.id_machine_registered}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {tm.id_zone_default || tm.id_zone || 'Atelier'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {tm.designation || tm.nom}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                  <Cpu className="w-8 h-8 text-slate-300 mb-1" />
                  <div className="text-xs font-semibold text-slate-600">Machine unique dans son segment</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">Aucun autre modèle identique n'est actuellement enregistré.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Industrial Philosophy Summary Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.16),0_6px_16px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Fils Conducteurs & Philosophie Industrielle CIOB</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-cyan-300">
            Excel Twin 100% Offline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-cyan-300">1. Machine Neuve (Jour 1)</div>
            <div className="text-slate-300 text-[11px]">
              Créée avec seulement <b>Family</b> + <b>Template</b>. Le Blueprint reste optionnel car ses composants réels sont découverts avec le temps.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300">2. Vie & Enrichissement</div>
            <div className="text-slate-300 text-[11px]">
              Au fur et à mesure des interventions, la machine enregistre ses <b>Components</b> (EXT/VER), <b>Parts</b> (VIS/RIV) et <b>PDR</b> réelles.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-amber-300">3. Blueprint Maître (BOM)</div>
            <div className="text-slate-300 text-[11px]">
              Document officiel regroupant les 4 Tabs (Specs, Comp, Parts, PDR). Les machines jumelles (Twins) partagent le même Blueprint.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-indigo-300">4. Nexus & PDR Focus</div>
            <div className="text-slate-300 text-[11px]">
              Le Stock PDR est le cœur opérationnel : la formule <b className="text-white">= E + F - G</b> garantit la disponibilité continue de l'usine.
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
