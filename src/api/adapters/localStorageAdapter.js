
// In-memory storage for data (mirrors localStorage)
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
  Settings: [],
  BranchDailyRecord: []
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

export const localStorageAdapter = {
  name: 'local_storage',
  
  initialize: async () => {
    initializeStorage();
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    let data = storage[entityName] || [];
    
    // Filter by Company ID if context is set and entity is not global
    const globalEntities = ['User', 'Company', 'Currency', 'Settings']; 
    if (context?.companyId && !globalEntities.includes(entityName)) {
      data = data.filter(item => item.company_id === context.companyId);
    }

    return Promise.resolve([...data]);
  },

  create: async (entityName, data, context) => {
    const newRecord = { ...data, id: Date.now() };
    
    // Auto-inject Company ID
    if (context?.companyId && !newRecord.company_id) {
      newRecord.company_id = context.companyId;
    }

    if (!storage[entityName]) storage[entityName] = [];
    storage[entityName].push(newRecord);
    saveStorage();
    return Promise.resolve(newRecord);
  },

  update: async (entityName, id, data) => {
    if (!storage[entityName]) storage[entityName] = [];
    const index = storage[entityName].findIndex(item => item.id === id);
    if (index !== -1) {
      storage[entityName][index] = { ...storage[entityName][index], ...data, id };
    }
    saveStorage();
    return Promise.resolve({ ...data, id });
  },

  delete: async (entityName, id) => {
    if (!storage[entityName]) storage[entityName] = [];
    storage[entityName] = storage[entityName].filter(item => item.id !== id);
    saveStorage();
    return Promise.resolve({ success: true });
  },

  // Auth specific methods
  auth: {
    login: async (username, password) => {
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
    
    register: async ({ username, password, email, full_name }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const existingUser = storage.User.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        (email && u.email?.toLowerCase() === email.toLowerCase())
      );
      if (existingUser) throw new Error("Username or Email already exists");

      const newId = storage.User.length > 0 ? Math.max(...storage.User.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        username,
        password,
        email,
        full_name,
        role: 'Employee',
        allowed_companies: [],
        avatar: null
      };
      storage.User.push(newUser);
      saveStorage();
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    },

    me: async () => null,
    logout: async () => Promise.resolve(),

    addUserToCompany: async (companyId, email, role) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = storage.User.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("User not found");
      if (!user.allowed_companies) user.allowed_companies = [];
      if (!user.allowed_companies.includes(companyId)) {
        user.allowed_companies.push(companyId);
      }
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

    requestPasswordReset: async (email) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = storage.User.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        console.warn(`Password reset requested for non-existent email: ${email}`);
        return { message: "If an account exists, a reset link has been sent." };
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = otp;
      user.resetOtpExpires = Date.now() + 15 * 60 * 1000;
      saveStorage();
      console.log(`[MOCK EMAIL] Password Reset OTP for ${email}: ${otp}`);
      return { success: true, message: "OTP sent to email (Check Console)", dev_otp: otp };
    },

    resetPassword: async (email, otp, newPassword) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = storage.User.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user || user.resetOtp !== otp || Date.now() > user.resetOtpExpires) {
        throw new Error("Invalid or expired OTP");
      }
      user.password = newPassword;
      user.resetOtp = null;
      user.resetOtpExpires = null;
      saveStorage();
      return { success: true, message: "Password updated successfully" };
    }
  }
};
