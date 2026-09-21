const fs = require('fs');

const views = [
  { file: 'ZonesView.jsx', cols: [{k:'id_zone', l:'Code Zone'}, {k:'libelle', l:'Libellé'}] },
  { file: 'OperationsView.jsx', cols: [{k:'id_operation', l:'ID'}, {k:'nom', l:'Nom'}, {k:'id_zone', l:'Zone'}, {k:'type_profil', l:'Profil'}] },
  { file: 'FamilyView.jsx', cols: [{k:'id_family', l:'Code Famille'}, {k:'designation', l:'Désignation'}] },
  { file: 'TypeView.jsx', cols: [{k:'id_type', l:'Type Ref'}, {k:'description', l:'Description'}] },
  { file: 'TemplatesView.jsx', cols: [{k:'id_templates', l:'Modèle'}, {k:'designation', l:'Désignation'}, {k:'id_family', l:'Famille'}] },
  { file: 'TechniciansView.jsx', cols: [{k:'nom', l:'Nom'}, {k:'id_zone', l:'Zone par défaut'}] },
  { file: 'DesignationView.jsx', cols: [{k:'id_diag', l:'Diagnostic'}, {k:'designation', l:'Désignation'}, {k:'id_type', l:'Type'}] },
  { file: 'MachinesRegisteredView.jsx', cols: [{k:'id_machine_registered', l:'ID Machine'}, {k:'designation', l:'Désignation'}, {k:'id_family', l:'Famille'}, {k:'id_templates', l:'Modèle'}, {k:'id_zone_default', l:'Zone'}, {k:'technician', l:'Technicien'}, {k:'status', l:'Statut'}] }
];

for (const view of views) {
  let content = fs.readFileSync(`src/components/${view.file}`, 'utf8');

  // Check if already injected
  if (content.includes('Trier par')) {
    console.log(`${view.file} already has Tri button.`);
    continue;
  }

  const triButton = `
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={\`h-9 md:h-10 px-3 md:px-4 flex items-center gap-2 rounded-xl text-xs font-semibold border transition-all \${
              showSortMenu || sortField !== '${view.cols[0].k}' || sortOrder !== 'asc'
                ? 'bg-cyan-50 text-cyan-800 border-cyan-200 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }\`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Tri : <b className="font-mono text-slate-900">{sortField.toUpperCase()}</b> ({sortOrder === 'asc' ? 'A→Z' : 'Z→A'})</span>
            <ChevronDown className={\`w-3 h-3 text-slate-400 transition-transform \${showSortMenu ? 'rotate-180' : ''}\`} />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 md:left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                  Trier par
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                ${view.cols.map(c => `
                <button
                  onClick={() => {
                    if (sortField === '${c.k}') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('${c.k}');
                      setSortOrder('asc');
                    }
                  }}
                  className={\`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition \${
                    sortField === '${c.k}'
                      ? 'bg-cyan-50 text-cyan-800'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }\`}
                >
                  <span>${c.l}</span>
                  {sortField === '${c.k}' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-600 shrink-0" /> : <ArrowDown className="w-3 h-3 text-cyan-600 shrink-0" />
                  )}
                </button>
                `).join('')}
              </div>
            </div>
          )}
        </div>
`;

  // Insert it after the Search Input's parent div.
  // The search input is inside a div like `<div className="relative flex-1 md:w-64 max-w-sm">...</div>`
  // A safe way is to find `<Search className="..." />` then find the next `</div>` and insert it there.
  let searchIdx = content.indexOf('<Search className=');
  if (searchIdx === -1) searchIdx = content.indexOf('<Search ');

  if (searchIdx !== -1) {
    let divEndIdx = content.indexOf('</div>', searchIdx);
    if (divEndIdx !== -1) {
      divEndIdx += 6; // length of '</div>'
      content = content.substring(0, divEndIdx) + '\n' + triButton + '\n' + content.substring(divEndIdx);
      fs.writeFileSync(`src/components/${view.file}`, content);
      console.log(`Injected Tri button into ${view.file}`);
    } else {
      console.log(`Failed to find closing div for search in ${view.file}`);
    }
  } else {
    console.log(`Failed to find Search in ${view.file}`);
  }
}
