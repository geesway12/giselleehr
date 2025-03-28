const DB_NAME = 'FacilityDB';
const DB_VERSION = 1;
let db;
let dbReady = false;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = event => {
  db = event.target.result;

  if (!db.objectStoreNames.contains('patients')) {
    db.createObjectStore('patients', { keyPath: 'patientId' });
  }

  if (!db.objectStoreNames.contains('visits')) {
    db.createObjectStore('visits', { autoIncrement: true });
  }

  if (!db.objectStoreNames.contains('registers')) {
    db.createObjectStore('registers', { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains('register_entries')) {
    db.createObjectStore('register_entries', { autoIncrement: true });
  }
};

request.onsuccess = event => {
  db = event.target.result;
  dbReady = true;
  console.log('✅ IndexedDB initialized');

  if (typeof window.onDatabaseReady === 'function') {
    window.onDatabaseReady();
  }
};

request.onerror = event => {
  console.error('❌ IndexedDB error:', event.target.errorCode);
};

async function ensureStoreExists(storeName) {
  if (db.objectStoreNames.contains(storeName)) return;

  db.close();
  const newVersion = db.version + 1;
  const upgradeRequest = indexedDB.open(DB_NAME, newVersion);

  upgradeRequest.onupgradeneeded = event => {
    const upgradeDb = event.target.result;
    upgradeDb.createObjectStore(storeName, { autoIncrement: true });
    console.log(`📦 Created store: ${storeName}`);
  };

  upgradeRequest.onsuccess = event => {
    db = event.target.result;
    console.log(`🔄 DB upgraded to version ${newVersion}`);
  };

  upgradeRequest.onerror = event => {
    console.error('❌ Store creation error:', event.target.errorCode);
  };
}

// Save data
async function saveData(storeName, data, callback) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.put(data);

  request.onsuccess = () => {
    console.log(`✅ Saved to ${storeName}`, data);
    if (callback) callback();
  };

  request.onerror = event => {
    console.error(`❌ Failed to save to ${storeName}:`, event.target.errorCode);
  };
}

// Get all data
async function getAllData(storeName, callback) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const data = [];

  store.openCursor().onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      data.push(cursor.value);
      cursor.continue();
    } else {
      callback(data);
    }
  };

  tx.onerror = event => {
    console.error(`❌ Error reading ${storeName}:`, event.target.errorCode);
  };
}

// Get by key
async function getDataByKey(storeName, key, callback) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.get(key);

  request.onsuccess = () => callback(request.result);
  request.onerror = event => {
    console.error(`❌ Failed to get from ${storeName}`, event.target.errorCode);
  };
}

// Delete by key
async function deleteData(storeName, key, callback) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.delete(key);

  request.onsuccess = () => {
    console.log(`🗑️ Deleted ${key} from ${storeName}`);
    if (callback) callback();
  };

  request.onerror = event => {
    console.error(`❌ Failed to delete from ${storeName}`, event.target.errorCode);
  };
}

// Clear a store
async function clearStore(storeName) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.clear();
}
