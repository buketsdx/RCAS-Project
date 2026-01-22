export const Branch = {
  "name": "Branch",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "branch_code": {
      "type": "string",
      "description": "Auto-generated unique branch code"
    },
    "name": {
      "type": "string"
    },
    "name_arabic": {
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
    "manager_name": {
      "type": "string"
    },
    "is_head_office": {
      "type": "boolean",
      "default": false
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name"
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