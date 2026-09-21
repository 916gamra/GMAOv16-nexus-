const fs = require('fs');
let content = fs.readFileSync('src/components/FamilyView.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "Layers, Cpu } from 'lucide-react';",
  "Layers, Cpu, Trash2, Edit2, AlertTriangle } from 'lucide-react';"
);

// 2. Props
content = content.replace(
  "onAddFamily,\n  onNavigateToTemplatesFiltered",
  "onAddFamily,\n  onUpdateFamily,\n  onDeleteFamily,\n  onNavigateToTemplatesFiltered"
);

// 3. States
content = content.replace(
  "const [form, setForm] = useState({ id_family: '', libelle: '' });",
  "const [form, setForm] = useState({ id_family: '', libelle: '' });\n  const [toEdit, setToEdit] = useState(null);\n  const [toDelete, setToDelete] = useState(null);"
);

// 4. Header
content = content.replace(
  /<th className="py-2.5 px-4">\s*<span>NB MACHINES<\/span> <span className="text-slate-400 font-normal text-\[10px\]">\(E\)<\/span>\s*<\/th>\s*<\/tr>/,
  `<th className="py-2.5 px-4">
                <span>NB MACHINES</span> <span className="text-slate-400 font-normal text-[10px]">(E)</span>
              </th>
              <th className="py-2.5 px-4 text-right">ACTIONS</th>
            </tr>`
);

// 5. Row
content = content.replace(
  /<ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" \/>\s*<\/button>\s*<\/td>\s*<\/tr>/g,
  `<ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setToEdit({ ...f })} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setToDelete(f)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>`
);

// 6. Modals
const modals = `
      {toEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Modifier Famille</h3>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateFamily(toEdit.id_family, toEdit); setToEdit(null); }} className="space-y-3">
              <div><label className="text-[11px] font-bold text-slate-500">ID Famille</label>
              <input type="text" value={toEdit.id_family} disabled className="mt-1 w-full h-10 px-3 rounded-xl bg-slate-100 text-slate-500 text-xs font-mono" /></div>
              <div><label className="text-[11px] font-bold text-slate-500">Libellé</label>
              <input type="text" value={toEdit.libelle} onChange={(e) => setToEdit({ ...toEdit, libelle: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs" /></div>
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
            <h3 className="font-bold text-lg text-slate-900">Supprimer la famille ?</h3></div>
            <p className="text-sm text-center text-slate-600">Confirmez-vous la suppression de <b>{toDelete.libelle}</b> ?</p>
            <div className="flex gap-2"><button onClick={() => setToDelete(null)} className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium">Annuler</button>
            <button onClick={() => { onDeleteFamily(toDelete.id_family); setToDelete(null); }} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-xs font-semibold">Supprimer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
content = content.replace(/<\/div>\s*< \/div>\s*\)\s*;\s*\}\s*$/m, ''); // remove bottom
content = content.replace(/<\/div>\s*\)\s*;\s*\}\s*$/, modals);

fs.writeFileSync('src/components/FamilyView.jsx', content);
console.log('FamilyView.jsx patched');
