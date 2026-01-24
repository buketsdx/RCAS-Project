# Quick Reference - VAT Customer & Save Fix

## ✅ What Was Fixed

### 1. File Save Issue
- **Problem**: Sales/Purchase invoices wouldn't save
- **Fix**: Added comprehensive error handling, retry logic, and proper mutation state management

### 2. VAT Customer Details
- **Problem**: VAT Customer fields (VAT Number, Business Name, CR, Address Proof) not showing
- **Fix**: Added database fields and form UI to capture and display VAT customer information

---

## 📋 How to Use

### Creating a New Sales Invoice with VAT Customer

1. **Click "New Sales Invoice"** button
2. **Select Customer Type**: 
   - Choose "VAT Customer" from dropdown
3. **Select Customer**:
   - Choose from list OR click "New Customer"
4. **If New Customer**:
   - Enter Customer Type: "VAT Customer"
   - Enter Name (required)
   - Enter VAT Number
   - Enter Business Name
   - Enter CR Number
   - Enter Address Proof reference
   - Fill other details (address, city, phone, email)
   - Click "Create Customer"
5. **Customer Details Auto-Populate**:
   - VAT Number
   - Business Name
   - CR Number
   - Address Proof
6. **Add Invoice Items** (stock items, quantity, rate, VAT%)
7. **Click "Save Invoice"**
8. **Confirmation**: "Invoice saved successfully" appears
9. **Redirect**: Automatically redirects to Sales list

### Managing VAT Customers

1. **Go to Customers page**
2. **Click "+ Add Customer"**
3. **Select "VAT Customer"**
4. **Fill Required Fields**:
   - Name (required)
   - VAT Number
   - Business Name
   - CR Number
   - Address Proof
5. **Click "Add Customer"**
6. **To Edit**: Click pencil icon on customer row
7. **To Delete**: Click trash icon (confirm deletion)

---

## 🗂️ Database Changes

### New Fields in Ledger (Customer Master)
- `business_name` - Business/Trading name for VAT customers
- `cr_number` - Commercial Registration number
- `address_proof` - Address proof document reference

### New Fields in Voucher (Invoice Master)
- `customer_vat_number` - Customer's VAT number
- `customer_business_name` - Customer's business name
- `customer_cr_number` - Customer's CR number
- `customer_address_proof` - Customer's address proof
- `customer_type` - Type of customer (VAT Customer or General)

---

## 🐛 Error Handling

If you see error messages like:
- "Failed to save invoice. Please try again." → Check network connection
- "Required field missing" → Ensure all required fields are filled
- "Invalid data" → Check field formats

**Check Browser Console** (F12) for detailed error logs to troubleshoot.

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `src/entities/Ledger.js` | Added VAT customer fields |
| `src/entities/Voucher.js` | Added VAT detail fields |
| `src/pages/SalesInvoice.jsx` | Added VAT form section + save fix |
| `src/pages/PurchaseInvoice.jsx` | Save fix with error handling |
| `src/pages/Customers.jsx` | Added VAT customer editing |

---

## ✨ Features

✅ Auto-populate VAT fields from customer database  
✅ Conditional display based on customer type  
✅ Create VAT customers inline from invoice  
✅ Error handling with user-friendly messages  
✅ Retry logic for failed saves  
✅ Auto-redirect after successful save  

---

## 🔧 Troubleshooting

### Invoice won't save
1. Check all required fields are filled
2. Check network connection
3. Open browser console (F12) for error details
4. Try refreshing page and retry

### VAT fields not showing
1. Ensure you selected "VAT Customer" in dropdown
2. Try refreshing the page
3. Verify customer has customer_type = "VAT Customer"

### Customer not appearing in dropdown
1. Ensure customer was created successfully (see toast notification)
2. Select correct "Customer Type" filter at top
3. Refresh page if needed

---

## 📞 Next Steps

To extend this to other invoice types:
- CreditNoteForm.jsx
- DebitNoteForm.jsx
- SalesOrderForm.jsx
- PurchaseOrderForm.jsx

Contact development team if you need these implemented.
