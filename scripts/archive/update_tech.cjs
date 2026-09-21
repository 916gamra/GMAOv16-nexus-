const fs = require('fs');

let content = fs.readFileSync('src/components/TechniciansView.jsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { Users, Plus, Search, MapPin, Sparkles, ArrowRight } from 'lucide-react';",
  "import { Users, Plus, Search, MapPin, Sparkles, ArrowRight, Trash2, Edit2, AlertTriangle } from 'lucide-react';"
);

// 2. Add props
content = content.replace(
  "onAddTechnician,\n  onOpenAddZoneModal,\n  onNavigateToZoneFiltered\n})",
  "onAddTechnician,\n  onUpdateTechnician,\n  onDeleteTechnician,\n  onOpenAddZoneModal,\n  onNavigateToZoneFiltered\n})"
);

// 3. Add states
content = content.replace(
  "const [showAddModal, setShowAddModal] = useState(false);",
  "const [showAddModal, setShowAddModal] = useState(false);\n  const [techToEdit, setTechToEdit] = useState(null);\n  const [techToDelete, setTechToDelete] = useState(null);"
);

// 4. Update Header
content = content.replace(
  /<th className="py-2.5 px-4 text-right">([\s\S]*?)<\/th>\s*<\/tr>/,
  `<th className="py-2.5 px-4 text-right">
                <span>NB SORTIES / INTERVENTIONS</span> <span className="text-slate-400 font-normal text-[10px]">(F)</span>
              </th>
              <th className="py-2.5 px-4 text-right">
                ACTIONS
              </th>
            </tr>`
);

// 5. Update Row
content = content.replace(
  /<td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">\s*\{sortiesCount\} sorties\s*<\/td>\s*<\/tr>/g,
  `<td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    {sortiesCount} sorties
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setTechToEdit({ ...t })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTechToDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>`
);

fs.writeFileSync('src/components/TechniciansView.jsx', content);
console.log('updated table');
