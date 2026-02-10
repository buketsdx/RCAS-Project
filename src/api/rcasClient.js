
import { localStorageAdapter } from './adapters/localStorageAdapter';
import { supabaseAdapter } from './adapters/supabaseAdapter';
import { insforgeAdapter } from './adapters/insforgeAdapter';
import { firebaseAdapter } from './adapters/firebaseAdapter';
import { restApiAdapter } from './adapters/restApiAdapter';

// Current active adapter
let currentAdapter = localStorageAdapter;
let isInitialized = false;

// Context for Multi-tenancy
let currentContext = {
  companyId: null,
  userId: null
};

// Initialize the client based on stored configuration
const initializeClient = async () => {
  if (isInitialized) return;

  try {
    const savedConfig = localStorage.getItem('rcas_db_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      
      switch (config.provider) {
        case 'insforge':
          currentAdapter = insforgeAdapter;
          await insforgeAdapter.initialize(config);
          break;
        case 'supabase':
          currentAdapter = supabaseAdapter;
          await supabaseAdapter.initialize(config);
          break;
        case 'firebase':
          currentAdapter = firebaseAdapter;
          await firebaseAdapter.initialize(config);
          break;
        case 'rest_api':
          currentAdapter = restApiAdapter;
          await restApiAdapter.initialize(config);
          break;
        case 'local_storage':
        default:
          currentAdapter = localStorageAdapter;
          await localStorageAdapter.initialize();
          break;
      }
    } else {
      // Check for Environment Variables (InsForge or Supabase)
      const envInsforgeUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
      const envInsforgeKey = import.meta.env.VITE_INSFORGE_ANON_KEY;
      
      const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const envSupabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (envInsforgeUrl && envInsforgeKey) {
        console.log("Initializing InsForge from Environment Variables");
        currentAdapter = insforgeAdapter;
        await insforgeAdapter.initialize({
          provider: 'insforge',
          baseUrl: envInsforgeUrl,
          anonKey: envInsforgeKey
        });
      } else if (envSupabaseUrl && envSupabaseKey) {
        console.log("Initializing Supabase from Environment Variables");
        currentAdapter = supabaseAdapter;
        await supabaseAdapter.initialize({
          provider: 'supabase',
          supabaseUrl: envSupabaseUrl,
          supabaseKey: envSupabaseKey
        });
      } else {
        // Default to local storage
        currentAdapter = localStorageAdapter;
        await localStorageAdapter.initialize();
      }
    }
  } catch (error) {
    console.error("Failed to initialize database adapter:", error);
    // Fallback to local storage on error
    currentAdapter = localStorageAdapter;
    await localStorageAdapter.initialize();
  }
  
  isInitialized = true;
};

// Auto-initialize
initializeClient();

const createEntity = (name) => ({
  list: async (filters) => {
    if (!isInitialized) await initializeClient();
    return currentAdapter.list(name, currentContext);
  },
  create: async (data) => {
    if (!isInitialized) await initializeClient();
    return currentAdapter.create(name, data, currentContext);
  },
  update: async (id, data) => {
    if (!isInitialized) await initializeClient();
    return currentAdapter.update(name, id, data, currentContext);
  },
  delete: async (id) => {
    if (!isInitialized) await initializeClient();
    return currentAdapter.delete(name, id, currentContext);
  }
});

export const rcas = {
  setContext: (context) => {
    currentContext = { ...currentContext, ...context };
  },
  
  // Method to switch providers at runtime
  configure: async (config) => {
    localStorage.setItem('rcas_db_config', JSON.stringify(config));
    isInitialized = false; // Force re-init
    await initializeClient();
    return true;
  },

  getProvider: () => currentAdapter.name,

  // Raw query builder access (for complex queries)
  from: (table) => {
    // Note: This assumes synchronous access to client which might be risky if not initialized
    // We'll try to auto-init if possible, but 'from' returns a builder synchronously usually.
    if (!isInitialized) {
       // We can't await here. This method assumes client is ready or we return a proxy/promise.
       // For now, we'll assume initialization happened at app start.
       // If strict safety needed, we might need a different pattern.
       console.warn("RCAS Client accessed before async init complete. This may fail.");
    }
    return currentAdapter.from(table);
  },

  // Remote Procedure Call
  rpc: async (fn, args) => {
    if (!isInitialized) await initializeClient();
    return currentAdapter.rpc(fn, args);
  },

  auth: {
    onAuthStateChange: (callback) => {
       // This might need to handle async init internally
       if (!isInitialized) {
         initializeClient().then(() => {
           return currentAdapter.auth.onAuthStateChange(callback);
         });
         // Return a dummy unsubscribe if init is pending? 
         // Ideally we await init before calling this, but hooks like useEffect run sync-ish.
         // We'll try to delegate immediately.
       }
       return currentAdapter.auth.onAuthStateChange(callback);
    },
    getSession: async () => {
      if (!isInitialized) await initializeClient();
      return currentAdapter.auth.getSession ? currentAdapter.auth.getSession() : { data: { session: null }, error: null };
    },
    login: async (username, password) => {
      if (!isInitialized) await initializeClient();
      return currentAdapter.auth.login(username, password);
    },
    loginWithGoogle: async (data) => {
      // If adapter supports it, use it, otherwise mock or error
      if (currentAdapter.auth.loginWithGoogle) {
        return currentAdapter.auth.loginWithGoogle(data);
      }
      // Fallback for local storage (mock behavior from original file)
      return localStorageAdapter.auth.loginWithGoogle ? localStorageAdapter.auth.loginWithGoogle(data) : null;
    },
    register: async (data) => {
      if (!isInitialized) await initializeClient();
      return currentAdapter.auth.register(data);
    },
    addUserToCompany: async (companyId, email, role) => {
      // This is logic specific, might need to be in adapter or service layer
      // For now, delegate if possible or keep logic here? 
      // Original logic was tightly coupled to storage.User
      // We'll try to delegate to a custom method if it exists, or fallback to generic update
      if (currentAdapter.auth.addUserToCompany) {
        return currentAdapter.auth.addUserToCompany(companyId, email, role);
      }
      return null; 
    },
    getCompanyUsers: async (companyId) => {
      if (currentAdapter.auth.getCompanyUsers) {
        return currentAdapter.auth.getCompanyUsers(companyId);
      }
      return [];
    },
    requestPasswordReset: async (email) => {
      if (currentAdapter.auth.requestPasswordReset) {
        return currentAdapter.auth.requestPasswordReset(email);
      }
      return { message: "Not supported by this provider" };
    },
    resetPassword: async (email, otp, newPassword) => {
      if (currentAdapter.auth.resetPassword) {
        return currentAdapter.auth.resetPassword(email, otp, newPassword);
      }
      return { success: false };
    },
    me: async () => {
      if (!isInitialized) await initializeClient();
      return currentAdapter.auth.me();
    },
    logout: async () => {
      if (!isInitialized) await initializeClient();
      return currentAdapter.auth.logout();
    }
  },

  entities: {
    // Users
    User: createEntity('User'),

    // Company & Settings
    Company: createEntity('Company'),
    Branch: createEntity('Branch'),
    Currency: createEntity('Currency'),
    
    // Masters
    AccountGroup: createEntity('AccountGroup'),
    Ledger: createEntity('Ledger'),
    StockGroup: createEntity('StockGroup'),
    StockItem: createEntity('StockItem'),
    Unit: createEntity('Unit'),
    Godown: createEntity('Godown'),
    CostCenter: createEntity('CostCenter'),
    VoucherType: createEntity('VoucherType'),
    
    // Transactions
    Voucher: createEntity('Voucher'),
    VoucherItem: createEntity('VoucherItem'),
    VoucherLedgerEntry: createEntity('VoucherLedgerEntry'),
    
    // Payroll
    Employee: createEntity('Employee'),
    SalaryComponent: createEntity('SalaryComponent'),
    Payroll: createEntity('Payroll'),
    
    // Special
    CustodyWallet: createEntity('CustodyWallet'),
    CustodyTransaction: createEntity('CustodyTransaction'),
    FlowerWaste: createEntity('FlowerWaste'),
    BankReconciliation: createEntity('BankReconciliation'),
    ZATCAInvoice: createEntity('ZATCAInvoice'),
    IDCounter: createEntity('IDCounter'),
    EmployeeSalaryStrucure: createEntity('EmployeeSalaryStrucure'),
    Settings: createEntity('Settings'),
    BranchDailyRecord: createEntity('BranchDailyRecord'),
    StylistServiceEntry: createEntity('StylistServiceEntry'),
    Booking: createEntity('Booking')
  },
  
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // This might need an adapter too (Storage Bucket)
        // For now, keep local mock
        await new Promise(resolve => setTimeout(resolve, 500));
        return { file_url: URL.createObjectURL(file) };
      }
    }
  }
};
