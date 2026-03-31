import { openDB, type IDBPDatabase } from "idb";

interface QueuedScan {
  id: string;
  qrToken: string;
  clientTime: string;
  stationId: string;
  synced: boolean;
}

const DB_NAME = "hopp-checkin-offline";
const STORE_NAME = "scans";
const DB_VERSION = 1;

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("synced", "synced");
      }
    },
  });
}

export async function queueScan(
  qrToken: string,
  stationId: string
): Promise<QueuedScan> {
  const db = await getDb();
  const scan: QueuedScan = {
    id: crypto.randomUUID(),
    qrToken,
    clientTime: new Date().toISOString(),
    stationId,
    synced: false,
  };
  await db.put(STORE_NAME, scan);
  return scan;
}

export async function getUnsyncedScans(): Promise<QueuedScan[]> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return (all as QueuedScan[]).filter((s) => !s.synced);
}

export async function markSynced(ids: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const id of ids) {
    const scan = await tx.store.get(id);
    if (scan) {
      scan.synced = true;
      await tx.store.put(scan);
    }
  }
  await tx.done;
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return (all as QueuedScan[]).filter((s) => !s.synced).length;
}

export async function clearSyncedScans(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const all = await tx.store.getAll();
  for (const scan of all) {
    if (scan.synced) {
      await tx.store.delete(scan.id);
    }
  }
  await tx.done;
}
