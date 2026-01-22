export const employee = {
  "name": "Employee",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "employee_code": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "name_arabic": {
      "type": "string"
    },
    "designation": {
      "type": "string"
    },
    "department": {
      "type": "string"
    },
    "date_of_joining": {
      "type": "string",
      "format": "date"
    },
    "date_of_birth": {
      "type": "string",
      "format": "date"
    },
    "gender": {
      "type": "string",
      "enum": [
        "Male",
        "Female"
      ]
    },
    "nationality": {
      "type": "string"
    },
    "iqama_number": {
      "type": "string"
    },
    "passport_number": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "basic_salary": {
      "type": "number"
    },
    "housing_allowance": {
      "type": "number"
    },
    "transport_allowance": {
      "type": "number"
    },
    "other_allowances": {
      "type": "number"
    },
    "gosi_number": {
      "type": "string"
    },
    "bank_name": {
      "type": "string"
    },
    "bank_account": {
      "type": "string"
    },
    "iban": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "employee_code"
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