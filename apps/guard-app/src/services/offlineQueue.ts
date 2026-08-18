import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@guard_offline_queue';

export interface PendingEntry {
  localId: string;
  name: string;
  purpose: string;
  purposeNote?: string;
  unitId: string;
  phone?: string;
  photoUrl?: string;
  timestamp: string;
}

/**
 * Enqueue a visitor entry for later sync when offline.
 */
export async function enqueue(entry: Omit<PendingEntry, 'localId' | 'timestamp'>): Promise<PendingEntry> {
  const pending: PendingEntry = {
    ...entry,
    localId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const queue = await getQueue();
  queue.push(pending);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return pending;
}

/**
 * Get all queued entries.
 */
export async function getQueue(): Promise<PendingEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Remove a synced entry from the queue.
 */
export async function dequeue(localId: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.filter((e) => e.localId !== localId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

/**
 * Sync all queued entries to the server.
 * Returns the number of successfully synced entries.
 */
export async function syncAll(
  postFn: (entry: PendingEntry) => Promise<boolean>,
): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  let synced = 0;
  for (const entry of queue) {
    try {
      const ok = await postFn(entry);
      if (ok) {
        await dequeue(entry.localId);
        synced++;
      }
    } catch {
      // Stop on first failure (network still down)
      break;
    }
  }

  return synced;
}

/**
 * Get the count of pending entries.
 */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
