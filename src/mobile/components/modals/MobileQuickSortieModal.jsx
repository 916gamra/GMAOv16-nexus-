import { useState, useEffect, useMemo } from 'react';
import { X, Package, Check, AlertTriangle, Minus, Plus, Cpu, User } from 'lucide-react';

export default function MobileQuickSortieModal({
  isOpen,
  onClose,
  stockItems = [],
  machines = [],
  technicians = [],
  initialArticle = null,
  onAddMouvement,
  showToast,
}) {
  const [selectedRef, setSelectedRef] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialArticle) {
      setSelectedRef(initialArticle.ref || initialArticle.id || '');
    } else {
      setSelectedRef('');
    }
    setQuantite(1);
    setSelectedMachine('');
    setSelectedTechnician('');
    setDestination('');
    setSearchQuery('');
  }, [initialArticle, isOpen]);

  // Current selected part object
  const currentPart = useMemo(() => {
    return stockItems.find(
      (item) => String(item.ref) === String(selectedRef) || String(item.id) === String(selectedRef)
    );
  }, [stockItems, selectedRef]);

  // Filtered parts for quick selection
  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return stockItems.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return stockItems
      .filter(
        (it) =>
          String(it.ref || '').toLowerCase().includes(q) ||
          String(it.designation || '').toLowerCase().includes(q) ||
          String(it.famille || '').toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [stockItems, searchQuery]);

  if (!isOpen) return null;

  const availableStock = Number(currentPart?.quantite ?? currentPart?.stockFinal ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPart) {
      showToast?.('Veuillez sélectionner une pièce de rechange.', 'error');
      return;
    }
    const qteNum = Number(quantite);
    if (!qteNum || qteNum <= 0) {
      showToast?.('Veuillez saisir une quantité valide (> 0).', 'error');
      return;
    }
    if (qteNum > availableStock) {
      showToast?.(`Quantité insuffisante en stock (Disponible: ${availableStock}).`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const codeBon = `BS-${Date.now().toString().slice(-6)}`;
      const today = new Date().toISOString().split('T')[0];

      const mvtPayload = {
        code_bon: codeBon,
        ref: currentPart.ref,
        designation: currentPart.designation || currentPart.ref,
        quantite: qteNum,
        type: 'SORTIE',
        sens: 'Sortie',
        date: today,
        machine: selectedMachine || destination || 'Maintenance Générale',
        technicien: selectedTechnician || 'Technicien Médiaire',
        prix_unitaire: Number(currentPart.prix_unitaire || currentPart.prix || 0),
        id_zone: currentPart.id_zone || '',
      };

      if (onAddMouvement) {
        await onAddMouvement(mvtPayload);
      }

      showToast?.(`Sortie enregistrée avec succès (${qteNum} ${currentPart.designation})`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast?.("Erreur lors de l'enregistrement de la sortie.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Sortie PDR Rapide</h2>
              <p className="text-xs text-zinc-500">Enregistrement instantané au pied de machine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200/80 text-zinc-600 flex items-center justify-center hover:bg-zinc-300 transition"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Article Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              1. Pièce de Rechange (PDR)
            </label>
            {currentPart ? (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-800">{currentPart.ref}</div>
                  <div className="text-sm font-bold text-zinc-900 leading-snug">{currentPart.designation}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Emplacement: <span className="font-semibold text-zinc-700">{currentPart.emplacement || 'Non défini'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Stock Actuel</div>
                  <div className={`text-base font-black ${availableStock <= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {availableStock}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRef('')}
                    className="text-[11px] font-semibold text-emerald-700 underline mt-1 cursor-pointer"
                  >
                    Changer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Rechercher par référence, désignation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="max-h-36 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 bg-white">
                  {filteredParts.length === 0 ? (
                    <div className="p-3 text-xs text-center text-zinc-400">Aucune pièce trouvée</div>
                  ) : (
                    filteredParts.map((item) => {
                      const qty = Number(item.quantite ?? item.stockFinal ?? 0);
                      return (
                        <button
                          key={item.ref || item.id}
                          type="button"
                          onClick={() => {
                            setSelectedRef(item.ref || item.id);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-zinc-50 transition cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-zinc-900 mr-2">{item.ref}</span>
                            <span className="text-zinc-600 truncate">{item.designation}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              qty <= 0 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {qty} dispo
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              2. Quantité à prélever
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantite((prev) => Math.max(1, prev - 1))}
                className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                min="1"
                max={availableStock || 9999}
                value={quantite}
                onChange={(e) => setQuantite(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 h-12 text-center text-xl font-black rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setQuantite((prev) => (currentPart ? Math.min(availableStock, prev + 1) : prev + 1))}
                className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-800 font-bold flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition"
              >
                <Plus size={18} />
              </button>
            </div>
            {currentPart && quantite > availableStock && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                <AlertTriangle size={13} />
                La quantité dépasse le stock disponible ({availableStock}).
              </p>
            )}
          </div>

          {/* Machine / Destination Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              3. Machine de Destination
            </label>
            <div className="relative">
              <Cpu size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Sélectionner une machine (Optionnel) --</option>
                {machines.map((m) => (
                  <option key={m.id_machine_registered || m.id || m.nom} value={m.nom || m.id_machine_registered}>
                    {m.nom || m.id_machine_registered} {m.zone ? `(${m.zone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technician Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              4. Technicien Intervenant
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">-- Sélectionner le technicien --</option>
                {technicians.map((t) => (
                  <option key={t.id_technician || t.nom} value={t.nom}>
                    {t.nom} {t.specialite ? `(${t.specialite})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPart || availableStock <= 0}
              className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-98 transition shadow-md disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>Valider la Sortie</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
