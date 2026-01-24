# Quick Reference: Customer & Supplier Type Feature

## 🎯 What You Can Do Now

### Sales Invoice (`/SalesInvoice`)
1. **Filter Customers by Type**
   - Select "VAT Customer" OR "General (Non-VAT Customer)"
   - Dropdown auto-updates to show matching customers only

2. **Create New Customer On-The-Fly**
   - Click "+ New Customer" button
   - Fill in customer details in modal:
     - Customer Type (VAT/General)
     - Customer Name (required)
     - VAT Number (only for VAT customers)
     - Contact Person, Address, City, Phone, Email
   - Click "Create Customer"
   - Customer auto-populates in form

### Purchase Invoice (`/PurchaseInvoice`)
- Same features as Sales Invoice
- Called "Supplier Type" instead of "Customer Type"
- Uses blue theme instead of emerald

## 📊 Database Changes

**Ledger Entity:** Added `customer_type` field
- Values: "VAT Customer" or "General"
- Default: "General"
- Used to categorize customers/suppliers

## 🔄 Data Flow

```
Select Customer Type
    ↓
List filters to show only that type
    ↓
Choose existing OR click "+ New"
    ↓
If existing: auto-populate form
If new: create in database → auto-populate form
    ↓
Add line items → Save invoice
```

## ✨ Key Features

| Feature | Sales | Purchase |
|---------|-------|----------|
| Type Dropdown | VAT Customer / General | VAT Supplier / General |
| New Button | "+ New Customer" | "+ New Supplier" |
| Dialog Title | "Create New Customer" | "Create New Supplier" |
| Group ID | sundry-debtors | sundry-creditors |
| Color Theme | Emerald | Blue |

## 📋 Form Fields in Creation Dialog

- **Customer Type** - Dropdown (VAT/General)
- **Name** - Text input (required)
- **VAT Number** - Text input (only VAT type)
- **Contact Person** - Text input
- **Address** - Textarea
- **City** - Text input
- **Phone** - Text input
- **Email** - Text input

## 🎨 UI Locations

**Sales Invoice:**
- Customer Type: First field in Customer Information section
- Customer Selection: Dropdown next to New Customer button
- New Customer Button: Right side, next to customer dropdown

**Purchase Invoice:**
- Supplier Type: First field in Supplier Information section
- Supplier Selection: Dropdown next to New Supplier button
- New Supplier Button: Right side, next to supplier dropdown

## 💾 Data Saved in Ledger

When creating new customer/supplier:
```
{
  name: "Customer Name",
  customer_type: "VAT Customer",  // or "General"
  vat_number: "1234567890",
  contact_person: "John Doe",
  address: "123 Main St",
  city: "Riyadh",
  phone: "0501234567",
  email: "john@example.com",
  group_id: "sundry-debtors",    // or "sundry-creditors"
  is_active: true
}
```

## 🚀 Getting Started

1. **Open Sales Invoice page** → Go to `/SalesInvoice`
2. **Select a Customer Type** → VAT Customer or General
3. **Option A:** Select existing customer from dropdown
4. **Option B:** Create new customer
   - Click "+ New Customer"
   - Fill form in modal dialog
   - Click "Create Customer"
   - Form auto-populates

5. **Continue with invoice** → Add items, save

## ⚙️ Technical Details

**Files Modified:**
- `/src/entities/Ledger.js` - Added customer_type field
- `/src/pages/SalesInvoice.jsx` - Customer type feature
- `/src/pages/PurchaseInvoice.jsx` - Supplier type feature

**State Variables:**
- `customerType` / `supplierType` - Current selection
- `showNewCustomerDialog` / `showNewSupplierDialog` - Dialog visibility
- `newCustomer` / `newSupplier` - Form data

**Queries & Mutations:**
- `useQuery(['ledgers'])` - Fetch all customers/suppliers
- `partyLedgers` - Filtered list by type
- `createCustomerMutation` / `createSupplierMutation` - Create new

## 🧪 Testing Checklist

✅ Select different customer types - filtered list updates  
✅ Create new customer - dialog opens and closes properly  
✅ VAT number field shows only for VAT type  
✅ Form auto-populates after creation  
✅ Customer appears in list immediately after creation  
✅ All invoice features still work (items, totals, etc.)  
✅ Form validation works (name required)  

## 💡 Pro Tips

1. **Faster Entry:** Create customers once, reuse from list
2. **VAT Tracking:** Mark customers as VAT for automatic calculation
3. **Organization:** Keep VAT customers separate from general
4. **Printing:** Invoice shows customer type in details
5. **Filtering:** See only relevant customers by type

## 🔗 Related Features Still Working

✅ Auto-generated invoice codes (SAL-, PUR-)  
✅ VAT calculations  
✅ Invoice printing with customer details  
✅ Dark/Light theme switching  
✅ Multi-currency support  
✅ Item management  

## 📞 Support

For issues or questions:
1. Check if dev server is running (`npm run dev`)
2. Clear browser cache if styles look odd
3. Verify Ledger entity has `customer_type` field
4. Check browser console for errors

---

**Status:** ✅ Production Ready  
**Last Updated:** January 24, 2026
