export const SalaryComponent = {
  "name": "SalaryComponent",
  "type": "object",
  "properties": {
    "component_id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "name_arabic": {
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
      "type": "string",
      "enum": [
        "Fixed",
        "Percentage of Basic",
        "Percentage of Gross",
        "Formula",
        "Days Based"
      ]
    },
    "default_value": {
      "type": "number"
    },
    "percentage": {
      "type": "number"
    },
    "formula": {
      "type": "string"
    },
    "is_taxable": {
      "type": "boolean",
      "default": false
    },
    "affects_gosi": {
      "type": "boolean",
      "default": false
    },
    "is_mandatory": {
      "type": "boolean",
      "default": false
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "type",
    "calculation_type"
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