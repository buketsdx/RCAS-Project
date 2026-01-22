import { base44 } from '@/api/base44Client';

export async function generateUniqueID(entityType, prefix) {
  const counters = await base44.entities.IDCounter.list();
  let counter = counters.find(c => c.entity_type === entityType);
  
  if (!counter) {
    counter = await base44.entities.IDCounter.create({
      entity_type: entityType,
      prefix: prefix,
      last_number: 0,
      padding: 5
    });
  }
  
  const newNumber = (counter.last_number || 0) + 1;
  await base44.entities.IDCounter.update(counter.id, { last_number: newNumber });
  
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