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
  EmployeeSalaryStrucure: []
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

const createEntity = (name) => ({
  list: async (sort) => {
    return Promise.resolve([...(storage[name] || [])]);
  },
  create: async (data) => {
    const newRecord = { ...data, id: Date.now() };
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

export const base44 = {
  auth: {
    me: async () => ({
      id: "1",
      full_name: "Rustam Ali",
      role: "Admin"
    }),
    logout: () => {
      console.log("Logging out...");
      window.location.reload();
    }
  },
  entities: {
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
    EmployeeSalaryStrucure: createEntity('EmployeeSalaryStrucure')
  }
};