const STORAGE_KEY = 'custody_transaction_types';

export const DEFAULT_TYPES = [
  { value: 'Deposit', label: 'Deposit (Add Funds)', nature: 'Deposit' },
  { value: 'Withdrawal', label: 'Withdrawal (Spend Funds)', nature: 'Withdrawal' },
  { value: 'Transfer', label: 'Transfer (To Another Wallet)', nature: 'Transfer' }
];

export const getStoredTypes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addStoredType = (type) => {
  const types = getStoredTypes();
  types.push(type);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  return types;
};

export const getAllTypes = () => {
  return [...DEFAULT_TYPES, ...getStoredTypes()];
};

export const getTransactionNature = (typeValue) => {
  const type = getAllTypes().find(t => t.value === typeValue);
  return type ? type.nature : 'Withdrawal'; // Default to withdrawal if unknown
};