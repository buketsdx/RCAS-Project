export const AccountGroup = {
  "name": "AccountGroup",
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
    "parent_group_id": {
      "type": "string"
    },
    "nature": {
      "type": "string",
      "enum": [
        "Assets",
        "Liabilities",
        "Income",
        "Expenses",
        "Capital"
      ]
    },
    "is_primary": {
      "type": "boolean",
      "default": false
    },
    "affects_gross_profit": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "name",
    "nature"
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