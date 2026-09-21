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
  console.log(`Processing ${view.file}...`);

  // 1. Add lucide imports
  const lucideImports = ['ChevronLeft', 'ChevronRight', 'SlidersHorizontal', 'ArrowUpDown', 'ChevronDown', 'ArrowUp', 'ArrowDown'];
  for (const imp of lucideImports) {
    if (!content.includes(imp)) {
      content = content.replace(/import \{([^}]*)\}\s*from\s*'lucide-react';/, (match, p1) => {
        return `import { ${p1}, ${imp} } from 'lucide-react';`;
      });
    }
  }

  // 2. Add React imports if missing (useRef, useMemo, useEffect)
  if (!content.includes('useRef')) content = content.replace('useState', 'useState, useRef, useMemo, useEffect');
  else if (!content.includes('useMemo')) content = content.replace('useRef', 'useRef, useMemo');

  // 3. Find the `const filtered = ...` or `const filteredMachines = ...`
  let filteredVarName = 'filtered';
  if (content.includes('const filteredMachines =')) filteredVarName = 'filteredMachines';
  
  // 4. Inject states
  const stateInjection = `
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('${view.cols[0].k}');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortMenuRef = useRef(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortOrder]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedData = useMemo(() => {
    if (!sortField) return ${filteredVarName};
    return [...${filteredVarName}].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [${filteredVarName}, sortField, sortOrder]);

  const totalItems = sortedData.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const displayedData = pageSize === 0 ? sortedData : sortedData.slice(startIndex, startIndex + effectivePageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-700 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-700 shrink-0 font-bold" />
    );
  };
`;

  // We need to inject this right before `const handleSubmit` or return statement.
  if (!content.includes('const sortedData = useMemo')) {
    if (content.includes('const handleSubmit =')) {
      content = content.replace('const handleSubmit =', stateInjection + '\n  const handleSubmit =');
    } else {
      content = content.replace('return (', stateInjection + '\n  return (');
    }
  }

  // 4b. Sometimes `search` isn't a state but `mchSearch` etc. Let's fix the useEffect dependencies
  if (view.file === 'MachinesRegisteredView.jsx') {
      content = content.replace('[search, sortField, sortOrder]', '[mchSearch, mchFamilyFilter, mchTemplateFilter, mchZoneFilter, sortField, sortOrder]');
  }
  if (view.file === 'DesignationView.jsx') {
      content = content.replace('[search, sortField, sortOrder]', '[diagSearch, diagTypeFilter, sortField, sortOrder]');
  }
  if (view.file === 'TemplatesView.jsx') {
      content = content.replace('[search, sortField, sortOrder]', '[templateSearch, templateFamilyFilter, sortField, sortOrder]');
  }

  // 5. Replace `filtered.map` or `filteredMachines.map` with `displayedData.map`
  content = content.replace(new RegExp(`${filteredVarName}\\.map\\(`, 'g'), 'displayedData.map(');

  // 6. Inject Tri Button in the search bar div.
  const triButton = `
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={\`h-10 px-3 md:px-4 flex items-center gap-2 rounded-xl text-xs font-semibold border transition-all \${
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

  // Insert triButton after the search input. Find `<input type="text" ... placeholder="Rechercher... />`
  // This is tricky. Let's just find `placeholder="Rechercher` or similar and put it after its closing tag/div.
  // We can look for `className="... relative flex-1 ..."` which wraps the input usually.
  // Actually, replacing `placeholder="Rechercher` ... `/>` ... `</div>` is hard.
  // Let's use a simpler marker. Often the search input is in a div with a Search icon.
  // Let's manually identify insertion points by finding the parent div of the search input.
  if (!content.includes('ref={sortMenuRef}')) {
    content = content.replace(/(<input[^>]*placeholder="Rechercher[^>]*\/>[\s\S]*?<\/div>)/, `$1\n${triButton}`);
  }

  // 7. Add Pagination Footer
  const paginationFooter = `
      {/* Pagination Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Lignes par page :</span>
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {[100, 200, 500, 0].map((size) => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setCurrentPage(1); }}
                className={\`px-3 py-1 rounded-md text-xs font-bold transition-all \${
                  pageSize === size
                    ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }\`}
              >
                {size === 0 ? 'Tout' : size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Affichage <b className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</b> à <b className="text-slate-900">{Math.min(startIndex + effectivePageSize, totalItems)}</b> sur <b className="text-slate-900">{totalItems}</b>
          </div>
          {pageSize !== 0 && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Précédent
              </button>
              <span className="px-2 font-mono text-xs font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition"
              >
                Suivant
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
`;
  
  if (!content.includes('Lignes par page')) {
    // Insert before Add Modal
    if (content.includes('{showAddModal && (')) {
      content = content.replace('{showAddModal && (', paginationFooter + '\n      {showAddModal && (');
    } else if (content.includes('{toEdit && (')) {
      content = content.replace('{toEdit && (', paginationFooter + '\n      {toEdit && (');
    } else {
      content = content.replace('</AnimatedPage>', paginationFooter + '\n    </AnimatedPage>');
    }
  }

  // 8. Update Table Headers for Sorting
  // E.g. <th className="...">Code Zone</th> -> <th className="... cursor-pointer hover:bg-slate-100" onClick={() => handleSort('id_zone')}><div className="flex items-center gap-2">Code Zone {renderSortIcon('id_zone')}</div></th>
  for (const c of view.cols) {
    const thRegex = new RegExp(`(<th[^>]*>)\\s*${c.l}\\s*(<\\/th>)`, 'g');
    content = content.replace(thRegex, `$1<div className="flex items-center justify-between gap-2 cursor-pointer group hover:text-cyan-800" onClick={() => handleSort('${c.k}')}><span>${c.l}</span>{renderSortIcon('${c.k}')}</div>$2`);
  }

  fs.writeFileSync(`src/components/${view.file}`, content);
}

console.log('Done!');
