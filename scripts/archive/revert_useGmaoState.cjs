const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'useGmaoState.js');
let content = fs.readFileSync(filePath, 'utf8');

// I need to clean up the multiple useEffects.
// The easiest way is to remove ALL of the syncEnterpriseDb blocks.

const regex = /  useEffect\(\(\) => \{\s+async function syncEnterpriseDb\(\) \{[\s\S]*?\}, \[\]\);\n/g;

content = content.replace(regex, "");

// Then I will append it exactly once right before the final return.
// The final return looks like:
//   return {
//     types,
//     setTypes,
// ...

const finalReturnIndex = content.lastIndexOf("  return {");
if (finalReturnIndex !== -1) {
  const syncEffect = `
  useEffect(() => {
    async function syncEnterpriseDb() {
      try {
        const sparePartService = new SparePartApplicationService();
        const machineService = new MachineApplicationService();
        const taskService = new TaskApplicationService();

        const idbParts = await sparePartService.listSpareParts();
        const idbMachines = await machineService.listMachines();
        const idbTasks = await taskService.listTasks();

        if (idbParts.length === 0 && rawStock.length > 0) {
           for (const p of rawStock) await sparePartService.createSparePart(p);
        } else if (idbParts.length > 0) {
           setRawStock(idbParts);
        }

        if (idbMachines.length === 0 && machines.length > 0) {
           for (const m of machines) await machineService.createMachine(m);
        } else if (idbMachines.length > 0) {
           setMachines(idbMachines);
        }

        if (idbTasks.length === 0 && mouvements.length > 0) {
           for (const t of mouvements) await taskService.createTask(t);
        } else if (idbTasks.length > 0) {
           setMouvements(idbTasks);
        }
      } catch(err) {
        console.error('Enterprise DB Sync Error:', err);
      }
    }
    // Only run once on mount
    syncEnterpriseDb();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
`;
  content = content.slice(0, finalReturnIndex) + syncEffect + content.slice(finalReturnIndex);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("useGmaoState cleaned and fixed.");
