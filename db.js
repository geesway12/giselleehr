const DB_NAME = 'FacilityDB';
const DB_VERSION = 1;
let db;
let dbReady = false;

// Open IndexedDB
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
    db.createObjectStore('registers', { autoIncrement: true });
  }
};

request.onsuccess = event => {
  db = event.target.result;
  dbReady = true;
  console.log('Database initialized successfully.');

  // Notify other scripts that the database is ready
  if (typeof onDatabaseReady === 'function') {
    onDatabaseReady();
  }
};

request.onerror = event => {
  console.error("IndexedDB error:", event.target.errorCode);
};

// ✅ Save data to a store
function saveData(storeName, data) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.put(data);

  request.onsuccess = () => {
    console.log(`Data saved to ${storeName}.`);
  };

  request.onerror = event => {
    console.error(`Error saving to ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Get all data from store
function getAllData(storeName, callback) {
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
}

// ✅ Get single record by key
function getDataByKey(storeName, key, callback) {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.get(key);

  request.onsuccess = () => {
    callback(request.result);
  };

  request.onerror = event => {
    console.error(`Error retrieving from ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Delete record
function deleteData(storeName, key) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.delete(key);

  request.onsuccess = () => {
    console.log(`Deleted key ${key} from ${storeName}.`);
  };

  request.onerror = event => {
    console.error(`Error deleting from ${storeName}:`, event.target.errorCode);
  };
}

// ✅ Clear store
function clearStore(storeName) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const request = store.clear();

  request.onsuccess = () => {
    console.log(`Cleared all data from ${storeName}.`);
  };

  request.onerror = event => {
    console.error(`Error clearing ${storeName}:`, event.target.errorCode);
  };
}
