export const EmployeeSalaryStrucure = {
  "name": "EmployeeSalaryStructure",
  "type": "object",
  "properties": {
    "employee_id": {
      "type": "string"
    },
    "component_id": {
      "type": "string"
    },
    "component_name": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "Earning",
        "Deduction"
      ]
    },
    "calculation_type": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    },
    "percentage": {
      "type": "number"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "employee_id",
    "component_id"
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