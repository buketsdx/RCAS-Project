export  const VoucherType = {
  "name": "VoucherType",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "parent_type": {
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
    "abbreviation": {
      "type": "string"
    },
    "numbering_method": {
      "type": "string",
      "enum": [
        "Automatic",
        "Manual"
      ]
    },
    "starting_number": {
      "type": "number"
    },
    "prefix": {
      "type": "string"
    },
    "suffix": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "parent_type"
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