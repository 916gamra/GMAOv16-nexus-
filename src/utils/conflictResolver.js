/**
 * Conflict Resolver for offline-first data sync
 */
export class ConflictResolver {
  static resolveByTimestamp(localItem, remoteItem) {
    const localTime = new Date(localItem.updatedAt || localItem.timestamp || 0).getTime();
    const remoteTime = new Date(remoteItem.updatedAt || remoteItem.timestamp || 0).getTime();

    if (localTime >= remoteTime) {
      return { winner: 'local', item: localItem };
    }
    return { winner: 'remote', item: remoteItem };
  }
}
