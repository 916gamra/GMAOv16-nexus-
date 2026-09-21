import { useCallback } from 'react';

/**
 * A generic hook to handle CRUD operations for any entity in the application.
 * @param {Function} setEntityState - State setter function for the entity array (e.g. setZones).
 * @param {string} idKey - The property name that acts as the primary key (e.g. 'id_zone', 'id').
 * @param {Function} [onUpdateSideEffects] - Optional callback to handle cascading updates (e.g. update technicians when a zone changes).
 */
export function useGenericCRUD(setEntityState, idKey = 'id', onUpdateSideEffects = null) {
  /**
   * Adds a new item to the entity list.
   * @param {Object} newItem - The new entity object to add.
   */
  const handleAdd = useCallback(
    (newItem) => {
      setEntityState((prev) => [...prev, newItem]);
    },
    [setEntityState]
  );

  /**
   * Updates an existing item in the entity list.
   * @param {string|number} id - The ID of the entity to update.
   * @param {Object} updatedItem - The complete updated entity object.
   */
  const handleUpdate = useCallback(
    (id, updatedItem) => {
      setEntityState((prev) => {
        const oldItem = prev.find((item) => item[idKey] === id);
        const newState = prev.map((item) => (item[idKey] === id ? updatedItem : item));

        // Execute any side effects (like cascading updates) outside state mapping if needed,
        // but if the side effect requires state updates of other entities, it's better passed via callback.
        if (oldItem && onUpdateSideEffects) {
          // use a timeout to avoid setting other states inside a state setter
          setTimeout(() => onUpdateSideEffects(oldItem, updatedItem), 0);
        }
        return newState;
      });
    },
    [setEntityState, idKey, onUpdateSideEffects]
  );

  /**
   * Deletes an item from the entity list.
   * @param {string|number} id - The ID of the entity to delete.
   */
  const handleDelete = useCallback(
    (id) => {
      setEntityState((prev) => prev.filter((item) => item[idKey] !== id));
    },
    [setEntityState, idKey]
  );

  return { handleAdd, handleUpdate, handleDelete };
}
