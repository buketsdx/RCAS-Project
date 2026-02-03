// RCAS Data Bridge Client with Local Storage Persistence

// In-memory storage for data
const storage = {
  Company: [],
  Branch: [],
  Currency: [],
  AccountGroup: [],
  Ledger: [],
  StockGroup: [],
  StockItem: [],
  Unit: [],
  Godown: [],
  CostCenter: [],
  VoucherType: [],
  Voucher: [],
  VoucherItem: [],
  VoucherLedgerEntry: [],
  Employee: [],
  SalaryComponent: [],
  Payroll: [],
  CustodyWallet: [],
  CustodyTransaction: [],
  FlowerWaste: [],
  BankReconciliation: [],
  ZATCAInvoice: [],
  IDCounter: [],
  EmployeeSalaryStrucure: [],
  User: [],
  Settings: []
};

// Initialize storage from localStorage
const initializeStorage = () => {
  try {
    const saved = localStorage.getItem('rcas_data');
    if (saved) {
      const parsedData = JSON.parse(saved);
      Object.keys(parsedData).forEach(key => {
        if (storage.hasOwnProperty(key)) {
          storage[key] = parsedData[key];
        }
      });
    }

    // Seed default admin user if no users exist
    if (!storage.User || storage.User.length === 0) {
      storage.User = [{
        id: 1,
        username: 'admin',
        password: '123',
        full_name: 'System Administrator',
        role: 'Super Admin',
        email: 'admin@rcas.com'
      }];
      saveStorage();
    }
  } catch (e) {
    console.log('Failed to load from localStorage:', e);
  }
};

// Save storage to localStorage
const saveStorage = () => {
  try {
    localStorage.setItem('rcas_data', JSON.stringify(storage));
  } catch (e) {
    console.log('Failed to save to localStorage:', e);
  }
};

// Initialize on load
initializeStorage();

// Context for Multi-tenancy
let currentContext = {
  companyId: null,
  userId: null
};

const createEntity = (name) => ({
  list: async (sort) => {
    let data = storage[name] || [];
    
    // Filter by Company ID if context is set and entity is not global
    // Global entities: User, Company, Currency (maybe), Settings (maybe)
    const globalEntities = ['User', 'Company', 'Currency']; 
    if (currentContext.companyId && !globalEntities.includes(name)) {
      data = data.filter(item => item.company_id === currentContext.companyId);
    }

    return Promise.resolve([...data]);
  },
  create: async (data) => {
    const newRecord = { ...data, id: Date.now() };
    
    // Auto-inject Company ID
    if (currentContext.companyId && !newRecord.company_id) {
      newRecord.company_id = currentContext.companyId;
    }

    if (!storage[name]) storage[name] = [];
    storage[name].push(newRecord);
    saveStorage();
    return Promise.resolve(newRecord);
  },
  update: async (id, data) => {
    if (!storage[name]) storage[name] = [];
    const index = storage[name].findIndex(item => item.id === id);
    if (index !== -1) {
      storage[name][index] = { ...storage[name][index], ...data, id };
    }
    saveStorage();
    return Promise.resolve({ ...data, id });
  },
  delete: async (id) => {
    if (!storage[name]) storage[name] = [];
    storage[name] = storage[name].filter(item => item.id !== id);
    saveStorage();
    return Promise.resolve({ success: true });
  }
});

export const rcas = {
  setContext: (context) => {
    currentContext = { ...currentContext, ...context };
  },
  auth: {
    login: async (username, password) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = storage.User.find(u => 
        (u.username.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) && 
        u.password === password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      throw new Error("Invalid username or password");
    },
    loginWithGoogle: async ({ email, name, picture }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find existing user by email
      let user = storage.User.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        // Create new user if not exists
        const newId = storage.User.length > 0 ? Math.max(...storage.User.map(u => u.id)) + 1 : 1;
        user = {
          id: newId,
          username: email.split('@')[0], // Generate username from email
          email: email,
          full_name: name,
          password: null, // No password for OAuth users
          role: 'Employee', // Default role
          avatar: picture
        };
        storage.User.push(user);
        saveStorage();
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    register: async ({ username, password, email, full_name }) => {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if username or email already exists
      const existingUser = storage.User.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        (email && u.email?.toLowerCase() === email.toLowerCase())
      );

      if (existingUser) {
        throw new Error("Username or Email already exists");
      }

      const newId = storage.User.length > 0 ? Math.max(...storage.User.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        username,
        password,
        email,
        full_name,
        role: 'Employee', // Default role for new signups
        allowed_companies: [], // Initialize with no company access
        avatar: null
      };

      storage.User.push(newUser);
      saveStorage();

      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    },
    addUserToCompany: async (companyId, email, role) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = storage.User.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("User not found");

      if (!user.allowed_companies) user.allowed_companies = [];
      if (!user.allowed_companies.includes(companyId)) {
        user.allowed_companies.push(companyId);
      }
      
      // Update role for this context? 
      // Simplified: Global role for now, or we need a CompanyUser map.
      // For this MVP, we'll stick to the user's global role or update it.
      if (role) user.role = role; 

      saveStorage();
      return user;
    },
    getCompanyUsers: async (companyId) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return storage.User.filter(u => 
        u.allowed_companies?.includes(companyId) || u.role === 'Super Admin'
      );
    },
    me: async () => {
      // In a real app, this would validate the token
      return null;
    },
    logout: () => {
      return Promise.resolve();
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
    Settings: createEntity('Settings')
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Mock upload - return a local blob URL
        await new Promise(resolve => setTimeout(resolve, 500));
        return { file_url: URL.createObjectURL(file) };
      }
    }
  }
};
