export const CustiodyWallet = {
  "name": "CustodyWallet",
  "type": "object",
  "properties": {
    "wallet_id": {
      "type": "string",
      "description": "Auto-generated unique wallet ID"
    },
    "name": {
      "type": "string"
    },
    "holder_name": {
      "type": "string"
    },
    "holder_type": {
      "type": "string",
      "enum": [
        "Employee",
        "Agent",
        "Partner",
        "Other"
      ]
    },
    "balance": {
      "type": "number",
      "default": 0
    },
    "currency": {
      "type": "string",
      "default": "SAR"
    },
    "purpose": {
      "type": "string"
    },
    "contact_phone": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "holder_name"
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