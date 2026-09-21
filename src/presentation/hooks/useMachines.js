import { useState, useEffect, useCallback, useMemo } from 'react';
import { Container } from '../../core/di/Container.js';
import { MachineApplicationService } from '../../application/services/MachineApplicationService.js';
import { Logger } from '../../core/logger/LoggerService.js';

export function useMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const machineService = useMemo(() => Container.resolve('machineService') ? new MachineApplicationService() : null, []);

  const fetchMachines = useCallback(async () => {
    if (!machineService) return;
    setLoading(true);
    try {
      const data = await machineService.listMachines();
      setMachines(data || []);
      setError(null);
    } catch (err) {
      Logger.error('Failed to fetch machines:', err, 'useMachines');
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [machineService]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const addMachine = async (machineData) => {
    if (!machineService) return;
    try {
      const created = await machineService.createMachine({
        ...machineData,
        id: machineData.id_machine_registered || machineData.id || `MCH-${Date.now()}`
      });
      setMachines(prev => [...prev, created]);
      return created;
    } catch (err) {
      Logger.error('Failed to add machine:', err, 'useMachines');
      throw err;
    }
  };

  const updateMachine = async (id, machineData) => {
    if (!machineService) return;
    try {
      const updated = await machineService.updateMachine(id, machineData);
      setMachines(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } catch (err) {
      Logger.error('Failed to update machine:', err, 'useMachines');
      throw err;
    }
  };

  const deleteMachine = async (id) => {
    if (!machineService) return;
    try {
      await machineService.deleteMachine(id);
      setMachines(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      Logger.error('Failed to delete machine:', err, 'useMachines');
      throw err;
    }
  };

  return {
    machines,
    loading,
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    refetch: fetchMachines
  };
}
