# Sales Invoice - Customer Type Enhancement

## Overview
Enhanced the Sales Invoice form to support two types of customers with a customer type selection dropdown and ability to create new customers directly from the invoice form.

## User Request
"New Sales Invoice me Customer ko Customer Type karo VAT Customer & General(Non Vat Customer) Custumer Name me saved Customers se data fetch kar le agar nahi hai to wahi se hum new custumers bana sake"

**Translation:** In New Sales Invoice, make Customer Type options VAT Customer & General (Non-VAT) Customer. Fetch customer name from saved customers. If customer doesn't exist, allow creating new customers from there.

## Implementation Details

### 1. **Ledger Entity Update** (`/src/entities/Ledger.js`)
Added new field to Ledger entity:
```javascript
"customer_type": {
  "type": "string",
  "enum": [
    "VAT Customer",
    "General"
  ],
  "default": "General",
  "description": "Customer type: VAT Customer or General (Non-VAT) Customer"
}
```

**Purpose:** Track whether each customer is VAT-registered or a general customer

### 2. **Sales Invoice Form Updates** (`/src/pages/SalesInvoice.jsx`)

#### **New State Variables:**
```javascript
// Customer type filter
const [customerType, setCustomerType] = useState('General');

// New customer dialog state
const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);

// New customer form data
const [newCustomer, setNewCustomer] = useState({
  name: '',
  customer_type: 'General',
  vat_number: '',
  contact_person: '',
  address: '',
  city: '',
  phone: '',
  email: ''
});
```

#### **Updated Customer Filtering:**
```javascript
// Filter ledgers based on selected customer type
const partyLedgers = ledgers.filter(l => {
  return l.customer_type === customerType;
});
```

#### **New Customer Creation Mutation:**
```javascript
const createCustomerMutation = useMutation({
  mutationFn: async (customerData) => {
    // Creates new Ledger entry with customer type
    const ledgerData = {
      name: customerData.name,
      group_id: 'sundry-debtors',
      customer_type: customerData.customer_type,
      vat_number: customerData.vat_number || '',
      contact_person: customerData.contact_person || '',
      address: customerData.address || '',
      city: customerData.city || '',
      phone: customerData.phone || '',
      email: customerData.email || '',
      is_active: true
    };
    return rcas.entities.Ledger.create(ledgerData);
  },
  onSuccess: (newLedger) => {
    // Refresh ledger data
    queryClient.invalidateQueries({ queryKey: ['ledgers'] });
    // Auto-populate the new customer in the form
    setFormData(prev => ({
      ...prev,
      party_ledger_id: newLedger.id,
      party_name: newLedger.name,
      billing_address: newLedger.address || ''
    }));
    // Close dialog and reset form
    setShowNewCustomerDialog(false);
    toast.success('Customer created successfully');
  }
});
```

### 3. **UI/UX Enhancements**

#### **Customer Type Selection:**
- Located at top of Customer Information section
- Dropdown with two options:
  - **VAT Customer** - For customers with VAT registration
  - **General (Non-VAT Customer)** - For regular customers without VAT
- Changes in customer type automatically:
  - Filters available customers
  - Clears selected customer
  - Updates new customer dialog default type

#### **Customer Selection:**
- Dropdown populated based on selected customer type
- Shows saved customers matching the type
- Only shows relevant customers (VAT customers don't appear in General filter)

#### **New Customer Button:**
- "+ New Customer" button next to customer dropdown
- Opens modal dialog for creating new customer
- Button spans full width in 2-column layout

#### **New Customer Dialog:**
Modal form with following fields:
- **Customer Type** dropdown (pre-set to match selected type)
- **Customer Name*** (required)
- **VAT Number** (shown only for VAT Customer type)
- **Contact Person**
- **Address** (textarea)
- **City**
- **Phone**
- **Email**

**Features:**
- Conditional VAT Number field (only shows for VAT Customer type)
- Form validation (Customer Name is required)
- Loading state during creation
- Cancel and Create buttons
- Auto-closes after successful creation
- Auto-populates form with newly created customer

### 4. **User Workflow**

#### **Scenario 1: Select Existing Customer**
1. Open New Sales Invoice
2. Select Customer Type (VAT Customer or General)
3. Choose from dropdown of existing customers
4. Customer details auto-populate
5. Proceed to add items and save

#### **Scenario 2: Create New Customer**
1. Open New Sales Invoice
2. Select Customer Type
3. Click "+ New Customer" button
4. Fill in customer details in dialog
5. Click "Create Customer"
6. Customer is created and auto-selected in the form
7. Proceed to add items and save

### 5. **Key Features**

✅ **Customer Type Filtering**: Separate VAT and General customers  
✅ **Saved Customer Fetch**: Auto-populate from Ledger database  
✅ **Inline Customer Creation**: Create customers without leaving invoice form  
✅ **Smart Dialogs**: Modal dialog for new customer entry  
✅ **Auto-Population**: New customers automatically selected after creation  
✅ **Conditional Fields**: VAT Number only shows for VAT customers  
✅ **Data Validation**: Required fields enforced  
✅ **Visual Feedback**: Toast notifications for success/errors  
✅ **Mobile Responsive**: Works on all screen sizes  

### 6. **Database Schema**

**Ledger Entity Fields Used:**
- `name` - Customer name
- `customer_type` - "VAT Customer" or "General"
- `vat_number` - VAT registration number (for VAT customers)
- `contact_person` - Contact person name
- `address` - Customer address
- `city` - City name
- `phone` - Phone number
- `email` - Email address
- `group_id` - Set to 'sundry-debtors' for customer records
- `is_active` - Set to true for new customers

### 7. **Data Flow**

```
User opens Sales Invoice
    ↓
Selects Customer Type (VAT Customer / General)
    ↓
Sees filtered list of existing customers
    ↓
Either:
   A) Select existing customer → Auto-populate form
   B) Click "New Customer" → Open dialog → Fill details → Create → Auto-select
```

### 8. **Integration with Existing Features**

- ✅ Works with auto-generated invoice codes
- ✅ Works with VAT calculations
- ✅ Works with item management
- ✅ Customer details saved to voucher record
- ✅ Compatible with all existing invoice fields
- ✅ Maintains data integrity

### 9. **Styling**

- **Customer Type Section**: Full width dropdown
- **Customer Selection**: 2-column layout with "New Customer" button
- **New Customer Dialog**: Modal overlay with card styling
- **Icons**: Plus icon for new customer button, X icon for close
- **Colors**: Emerald accent for save/create actions, slate for text

### 10. **Error Handling**

- Toast notifications for success (customer created)
- Form validation prevents empty customer names
- Disabled submit button until required fields filled
- Proper loading states during mutation

## Testing Checklist

✅ Customer Type dropdown appears and filters correctly  
✅ VAT and General customers show in separate lists  
✅ "New Customer" button opens dialog  
✅ Dialog closes on cancel  
✅ Dialog closes on successful creation  
✅ New customer appears in list after creation  
✅ New customer auto-selects in form  
✅ Customer details auto-populate from selection  
✅ Form can be saved with created customer  
✅ Invoice displays customer type correctly  
✅ Mobile responsive design works  

## Related Features

- Auto-generated invoice codes (still functional)
- VAT calculations (now works with customer type)
- Customer ledger management
- Print Invoice with customer details

## Files Modified

1. **`/src/entities/Ledger.js`**
   - Added `customer_type` field with "VAT Customer" and "General" options

2. **`/src/pages/SalesInvoice.jsx`**
   - Added customer type state management
   - Added new customer dialog state
   - Created new customer mutation
   - Updated customer filtering logic
   - Enhanced Customer Information section UI
   - Added modal dialog for new customer creation

## Version Info

- React: 19.2.0
- React Query: 5.90.19
- Tailwind CSS: Latest
- Icons: lucide-react (Plus, X)

## Deployment Notes

- No breaking changes to existing invoices
- Existing customers default to "General" type if customer_type is empty
- New customers can only be created with at least a name
- Customer type is immutable after creation (good practice - can add edit ability later)

## Future Enhancements

1. Add ability to edit customer type after creation
2. Add customer groups/categories
3. Add customer credit limit management
4. Add customer discount rules
5. Add customer payment terms
6. Add customer-specific pricing
