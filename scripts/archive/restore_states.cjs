const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const missingStates = `
  // Filter States
  const [stockSearch, setStockSearch] = useState('');
  const deferredStockSearch = useDeferredValue(stockSearch);
  const [stockTypeFilter, setStockTypeFilter] = useState('ALL');
  const [stockAlertOnly, setStockAlertOnly] = useState(false);

  const [mchSearch, setMchSearch] = useState('');
  const deferredMchSearch = useDeferredValue(mchSearch);
  const [mchFamilyFilter, setMchFamilyFilter] = useState('ALL');
  const [mchTemplateFilter, setMchTemplateFilter] = useState('ALL');
  const [mchZoneFilter, setMchZoneFilter] = useState('ALL');

  const [diagTypeFilter, setDiagTypeFilter] = useState('ALL');
  const [opZoneFilter, setOpZoneFilter] = useState('ALL');
  const [techZoneFilter, setTechZoneFilter] = useState('ALL');
  const [templateFamilyFilter, setTemplateFamilyFilter] = useState('ALL');

  // Modal States
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserModalType, setAddUserModalType] = useState('TECHNICIEN');
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);

  // Filtered Stock Items`;

code = code.replace(/  \/\/ Filtered Stock Items/, missingStates);
fs.writeFileSync('src/App.jsx', code);
