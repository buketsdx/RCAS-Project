export const Voucher = {
  "name": "Voucher",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "voucher_type": {
      "type": "string",
      "enum": [
        "Sales",
        "Purchase",
        "Receipt",
        "Payment",
        "Contra",
        "Journal",
        "Credit Note",
        "Debit Note",
        "Sales Order",
        "Purchase Order",
        "Delivery Note",
        "Receipt Note"
      ]
    },
    "voucher_number": {
      "type": "string"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "reference_number": {
      "type": "string"
    },
    "reference_date": {
      "type": "string",
      "format": "date"
    },
    "party_ledger_id": {
      "type": "string"
    },
    "party_name": {
      "type": "string"
    },
    "narration": {
      "type": "string"
    },
    "gross_amount": {
      "type": "number",
      "default": 0
    },
    "discount_amount": {
      "type": "number",
      "default": 0
    },
    "vat_amount": {
      "type": "number",
      "default": 0
    },
    "net_amount": {
      "type": "number",
      "default": 0
    },
    "amount_in_words": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "Draft",
        "Confirmed",
        "Cancelled"
      ],
      "default": "Confirmed"
    },
    "is_posted": {
      "type": "boolean",
      "default": true
    },
    "billing_address": {
      "type": "string"
    },
    "shipping_address": {
      "type": "string"
    },
    "payment_terms": {
      "type": "string"
    },
    "due_date": {
      "type": "string",
      "format": "date"
    },
    "customer_vat_number": {
      "type": "string",
      "description": "Customer VAT number for VAT invoices"
    },
    "customer_business_name": {
      "type": "string",
      "description": "Customer business name for VAT invoices"
    },
    "customer_cr_number": {
      "type": "string",
      "description": "Customer Commercial Registration number for VAT invoices"
    },
    "customer_address_proof": {
      "type": "string",
      "description": "Customer address proof for VAT invoices"
    },
    "customer_type": {
      "type": "string",
      "enum": [
        "VAT Customer",
        "General"
      ],
      "description": "Customer type: VAT Customer or General (Non-VAT) Customer"
    }
  },
  "required": [
    "voucher_type",
    "date"
  ],
  "rls": {
    "create": {
      "$or": [
        {
          "company_id": "{{user.data.company_id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "read": {
      "$or": [
        {
          "company_id": "{{user.data.company_id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "update": {
      "$or": [
        {
          "company_id": "{{user.data.company_id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    },
    "delete": {
      "$or": [
        {
          "company_id": "{{user.data.company_id}}"
        },
        {
          "user_condition": {
            "role": "admin"
          }
        }
      ]
    }
  }
}