export const Ledger = {
  "name": "Ledger",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "name_arabic": {
      "type": "string"
    },
    "group_id": {
      "type": "string"
    },
    "is_system": {
      "type": "boolean",
      "default": false,
      "description": "System/inbuilt ledgers cannot be deleted"
    },
    "opening_balance": {
      "type": "number",
      "default": 0
    },
    "opening_balance_type": {
      "type": "string",
      "enum": [
        "Dr",
        "Cr"
      ]
    },
    "current_balance": {
      "type": "number",
      "default": 0
    },
    "balance_type": {
      "type": "string",
      "enum": [
        "Dr",
        "Cr"
      ]
    },
    "contact_person": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "city": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "vat_number": {
      "type": "string"
    },
    "business_name": {
      "type": "string",
      "description": "Business name for VAT customers"
    },
    "cr_number": {
      "type": "string",
      "description": "Commercial Registration number for VAT customers"
    },
    "address_proof": {
      "type": "string",
      "description": "Address proof document for VAT customers"
    },
    "credit_limit": {
      "type": "number"
    },
    "credit_days": {
      "type": "number"
    },
    "bank_name": {
      "type": "string"
    },
    "bank_account_number": {
      "type": "string"
    },
    "iban": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "customer_type": {
      "type": "string",
      "enum": [
        "VAT Customer",
        "General"
      ],
      "default": "General",
      "description": "Customer type: VAT Customer or General (Non-VAT) Customer"
    }
  },
  "required": [
    "name",
    "group_id"
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