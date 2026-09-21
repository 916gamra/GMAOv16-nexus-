const fs = require('fs');
let content = fs.readFileSync('src/components/MachinesRegisteredView.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "CheckCircle2,\n  AlertTriangle\n} from 'lucide-react';",
  "CheckCircle2,\n  AlertTriangle,\n  Trash2, Edit2\n} from 'lucide-react';"
);

// 2. Props
content = content.replace(
  "onNavigateToZone\n})",
  "onNavigateToZone,\n  onUpdateMachine,\n  onDeleteMachine\n})"
);

// 3. States
content = content.replace(
  "const [mchSearch, setMchSearchLocal] = useState('');",
  "const [mchSearch, setMchSearchLocal] = useState('');\n  const [toEdit, setToEdit] = useState(null);\n  const [toDelete, setToDelete] = useState(null);"
);

// 4. Header
content = content.replace(
  /<th className="py-2.5 px-4 text-right">Interventions<\/th>\s*<\/tr>/,
  `<th className="py-2.5 px-4 text-right">Interventions</th>
                <th className="py-2.5 px-4 text-right">ACTIONS</th>
              </tr>`
);

// 5. Row
content = content.replace(
  /<td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">\s*\{sortiesCount\} sorties\s*<\/td>\s*<\/tr>/g,
  `<td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      {sortiesCount} sorties
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setToEdit({ ...m })} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setToDelete(m)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>`
);

// 6. Modals
const modals = `
      {toEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Modifier Machine</h3>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateMachine(toEdit.id_machine_registered, toEdit); setToEdit(null); }} className="space-y-3">
              <div><label className="text-[11px] font-bold text-slate-500">ID Machine</label>
              <input type="text" value={toEdit.id_machine_registered} disabled className="mt-1 w-full h-10 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-mono" /></div>
              
              <div><label className="text-[11px] font-bold text-slate-500">Désignation</label>
              <input type="text" value={toEdit.designation} onChange={(e) => setToEdit({ ...toEdit, designation: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Famille</label>
                  <CustomSelect value={toEdit.id_family} onChange={(val) => {
                    setToEdit({ ...toEdit, id_family: val, id_templates: '' });
                  }} options={families.map(f => ({ value: f.id_family, label: f.id_family }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Modèle (Template)</label>
                  <CustomSelect value={toEdit.id_templates} onChange={(val) => setToEdit({ ...toEdit, id_templates: val })} options={templates.filter(t => t.id_family === toEdit.id_family).map(t => ({ value: t.id_templates, label: t.id_templates }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Zone par Défaut</label>
                  <CustomSelect value={toEdit.id_zone_default} onChange={(val) => setToEdit({ ...toEdit, id_zone_default: val })} options={zones.map(z => ({ value: z.id_zone, label: z.id_zone }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Technicien</label>
                  <CustomSelect value={toEdit.technician} onChange={(val) => setToEdit({ ...toEdit, technician: val })} options={technicians.map(t => ({ value: t.nom, label: t.nom }))} />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500">Statut</label>
                <CustomSelect value={toEdit.status || 'En Service'} onChange={(val) => setToEdit({ ...toEdit, status: val })} options={[{value: 'En Service', label: 'En Service'}, {value: 'En Panne', label: 'En Panne'}, {value: 'Arrêt', label: 'Arrêt'}]} />
              </div>

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setToEdit(null)} className="flex-1 h-10 rounded-xl bg-slate-100 text-xs font-medium">Annuler</button>
                <button type="submit" className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-semibold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex flex-col items-center text-center"><AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
            <h3 className="font-bold text-lg text-slate-900">Supprimer la machine ?</h3></div>
            <p className="text-sm text-center text-slate-600">Confirmez-vous la suppression de <b>{toDelete.id_machine_registered}</b> ?</p>
            <div className="flex gap-2"><button onClick={() => setToDelete(null)} className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">Annuler</button>
            <button onClick={() => { onDeleteMachine(toDelete.id_machine_registered); setToDelete(null); }} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-semibold">Supprimer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
content = content.replace(/<\/div>\s*< \/div>\s*\)\s*;\s*\}\s*$/m, ''); // remove bottom
content = content.replace(/<\/div>\s*\)\s*;\s*\}\s*$/, modals);

fs.writeFileSync('src/components/MachinesRegisteredView.jsx', content);
console.log('MachinesRegisteredView.jsx patched');
