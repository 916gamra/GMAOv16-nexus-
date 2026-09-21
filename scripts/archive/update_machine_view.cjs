const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'presentation', 'pages', 'MachinesRegisteredView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Import useMachines
content = content.replace(
  /import \{ RoboticHand \} from '\.\.\/components\/common\/icons\/RoboticHand';/,
  "import { RoboticHand } from '../components/common/icons/RoboticHand';\nimport { useMachines } from '../hooks/useMachines';"
);

// Remove machines from props and use the hook
content = content.replace(
  /export default function MachinesRegisteredView\(\{[\s\S]*?mchSearch = '',\s*setMchSearch = \(\) => \{\},/,
  `export default function MachinesRegisteredView({
  families = [],
  templates = [],
  zones = [],
  technicians = [],
  mouvements = [],
  mchFamilyFilter = 'ALL',
  setMchFamilyFilter = () => {},
  mchTemplateFilter = 'ALL',
  setMchTemplateFilter = () => {},
  mchZoneFilter = 'ALL',
  setMchZoneFilter = () => {},
  mchSearch = '',
  setMchSearch = () => {},`
);

// We still have onOpenAddMachine, onUpdateMachine, onDeleteMachine in props.
// We should replace them inside the component with the hook methods.
content = content.replace(
  /onUpdateMachine = \(\) => \{\},[\s\n]*onDeleteMachine = \(\) => \{\},/,
  "" // Remove them from props
);

content = content.replace(
  /export default function MachinesRegisteredView\(\{([\s\S]*?)\}\) \{/,
  `export default function MachinesRegisteredView({$1}) {
  const { machines, loading, updateMachine: onUpdateMachine, deleteMachine: onDeleteMachine } = useMachines();`
);

// If loading is true, we can show a skeleton or just let it render empty temporarily.
// There is already a LoadingSkeleton we can use if we want, but let's just use it transparently.

fs.writeFileSync(filePath, content, 'utf8');
console.log("MachinesRegisteredView updated to use custom hook.");
