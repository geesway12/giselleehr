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

  // NOTE: We do NOT create dynamic register stores here because they are added later
};

request.onsuccess = event => {
  db = event.target.result;
  dbReady = true;
  console.log('✅ IndexedDB initialized successfully');

  if (typeof window.onDatabaseReady === 'function') {
    window.onDatabaseReady();
  }
};

request.onerror = event => {
  console.error('❌ IndexedDB error:', event.target.errorCode);
};

// ✅ Utility to create store dynamically if it doesn't exist
async function ensureStoreExists(storeName) {
  if (db.objectStoreNames.contains(storeName)) return;

  db.close();
  const newVersion = db.version + 1;

  const upgradeRequest = indexedDB.open(DB_NAME, newVersion);

  upgradeRequest.onupgradeneeded = event => {
    const upgradeDB = event.target.result;
    if (!upgradeDB.objectStoreNames.contains(storeName)) {
      upgradeDB.createObjectStore(storeName, { autoIncrement: true });
      console.log(`📦 Created object store: ${storeName}`);
    }
  };

  upgradeRequest.onsuccess = event => {
    db = event.target.result;
    console.log(`🔄 Database upgraded to version ${newVersion}`);
  };

  upgradeRequest.onerror = event => {
    console.error('❌ Failed to create new store:', event.target.errorCode);
  };
}

// ✅ Save data to a store (with optional dynamic store creation)
async function saveData(storeName, data) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.put(data);

  request.onsuccess = () => {
    console.log(`✅ Data saved to ${storeName}:`, data);
  };

  request.onerror = event => {
    console.error(`❌ Error saving to ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Get all records
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
    console.error(`❌ Error reading from ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Get single record by key
async function getDataByKey(storeName, key, callback) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.get(key);

  request.onsuccess = () => callback(request.result);
  request.onerror = event => {
    console.error(`❌ Error retrieving from ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Delete by key
async function deleteData(storeName, key) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.delete(key);

  request.onsuccess = () => {
    console.log(`🗑️ Deleted key ${key} from ${storeName}`);
  };

  request.onerror = event => {
    console.error(`❌ Error deleting from ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Clear a whole store
async function clearStore(storeName) {
  await ensureStoreExists(storeName);
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.clear();

  request.onsuccess = () => {
    console.log(`🧹 Cleared all data from ${storeName}`);
  };

  request.onerror = event => {
    console.error(`❌ Error clearing ${storeName}:`, event.target.errorCode);
  };
}
