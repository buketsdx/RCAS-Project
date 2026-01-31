import { rcas } from '@/api/rcasClient';

export async function generateUniqueID(entityType, prefix) {
  const counters = await rcas.entities.IDCounter.list();
  let counter = counters.find(c => c.entity_type === entityType);
  
  if (!counter) {
    counter = await rcas.entities.IDCounter.create({
      entity_type: entityType,
      prefix: prefix,
      last_number: 0,
      padding: 5
    });
  }
  
  const newNumber = (counter.last_number || 0) + 1;
  await rcas.entities.IDCounter.update(counter.id, { last_number: newNumber });
  
  const paddedNumber = String(newNumber).padStart(counter.padding || 5, '0');
  return `${prefix}${paddedNumber}`;
}

export const ID_PREFIXES = {
  EMPLOYEE: 'EMP',
  BRANCH: 'BR',
  VOUCHER: 'VCH',
  SALES: 'INV',
  PURCHASE: 'PUR',
  RECEIPT: 'REC',
  PAYMENT: 'PAY',
  JOURNAL: 'JRN',
  CONTRA: 'CTR',
  STOCK_ITEM: 'ITM',
  LEDGER: 'LED',
  WALLET: 'WAL',
  WASTE: 'WST',
  SALARY_COMP: 'SLC'
};