const fs = require('fs');

const views = [
  'ZonesView.jsx', 'OperationsView.jsx', 'FamilyView.jsx', 
  'TypeView.jsx', 'TemplatesView.jsx', 'TechniciansView.jsx', 
  'DesignationView.jsx', 'MachinesRegisteredView.jsx'
];

for (const file of views) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');

  // We want to replace the `className={`h-9 md:h-10 px-3 md:px-4 flex items-center gap-2 rounded-xl text-xs font-semibold border transition-all ${ ... }`}
  // with the exact classes from StockView: 
  // className={`h-9 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${ ... ? 'bg-cyan-50 text-cyan-800 border-cyan-300 ring-1 ring-cyan-200 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
  
  content = content.replace(
    /className=\{\`h-9 md:h-10 px-3 md:px-4 flex items-center gap-2 rounded-xl text-xs font-semibold border transition-all \$\{([^\?]+)\?\s*'[^']+'\s*:\s*'[^']+'\s*\}\`\}/g, 
    "className={`h-9 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${$1? 'bg-cyan-50 text-cyan-800 border-cyan-300 ring-1 ring-cyan-200 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}"
  );

  // We should also replace the popover width and position to match StockView if it's currently absolute right-0 md:left-0
  content = content.replace(
    /className="absolute right-0 md:left-0 mt-2 w-64/g, 
    'className="absolute left-0 md:right-0 md:left-auto mt-2 w-64'
  );

  fs.writeFileSync(`src/components/${file}`, content);
}

console.log("Fixed classes!");
