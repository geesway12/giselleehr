// db.js
const DB_NAME = 'FacilityDB';
const DB_VERSION = 2; // Incremented version for schema changes
let db;
let dbReady = false;

// Database initialization
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = event => {
  const db = event.target.result;
  
  // Create object stores if they don't exist
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

  // Add version change handler
  db.onversionchange = () => {
    db.close();
    console.log('Database is outdated, closing connection');
  };

  if (typeof window.onDatabaseReady === 'function') {
    window.onDatabaseReady();
  }
};

request.onerror = event => {
  console.error('❌ IndexedDB initialization error:', event.target.error);
};

// Database operations
const dbHandler = {
  async execute(storeName, operation, data = null, key = null) {
    if (!dbReady) throw new Error('Database not initialized');
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Object store ${storeName} not found`);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);

      let request;
      switch (operation) {
        case 'save':
          request = store.put(data);
          break;
        case 'getAll':
          request = store.getAll();
          break;
        case 'get':
          request = store.get(key);
          break;
        case 'delete':
          request = store.delete(key);
          break;
        default:
          reject(new Error('Invalid operation'));
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }
};

// Public API
async function saveData(storeName, data) {
  try {
    await dbHandler.execute(storeName, 'save', data);
    console.log(`✅ Saved to ${storeName}:`, data);
    return true;
  } catch (error) {
    console.error(`❌ Error saving to ${storeName}:`, error);
    throw error;
  }
}

async function getAllData(storeName) {
  try {
    const data = await dbHandler.execute(storeName, 'getAll');
    return data;
  } catch (error) {
    console.error(`❌ Error reading from ${storeName}:`, error);
    throw error;
  }
}

async function getDataByKey(storeName, key) {
  try {
    const data = await dbHandler.execute(storeName, 'get', null, key);
    return data;
  } catch (error) {
    console.error(`❌ Error getting from ${storeName}:`, error);
    throw error;
  }
}

async function deleteData(storeName, key) {
  try {
    await dbHandler.execute(storeName, 'delete', null, key);
    console.log(`🗑️ Deleted from ${storeName}:`, key);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting from ${storeName}:`, error);
    throw error;
  }
}

// Utility functions
function clearDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// Export for browser usage
window.dbAPI = {
  saveData,
  getAllData,
  getDataByKey,
  deleteData,
  clearDatabase
};