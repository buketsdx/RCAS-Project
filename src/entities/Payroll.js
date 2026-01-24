export const Payrooll = {
  "name": "Payroll",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "payroll_code": {
      "type": "string",
      "description": "Unique payroll code (auto-generated)"
    },
    "employee_id": {
      "type": "string"
    },
    "employee_name": {
      "type": "string"
    },
    "month": {
      "type": "string"
    },
    "year": {
      "type": "number"
    },
    "working_days": {
      "type": "number"
    },
    "present_days": {
      "type": "number"
    },
    "basic_salary": {
      "type": "number",
      "description": "Salary snapshot at time of payroll processing"
    },
    "housing_allowance": {
      "type": "number",
      "description": "Allowance snapshot at time of payroll processing"
    },
    "transport_allowance": {
      "type": "number",
      "description": "Allowance snapshot at time of payroll processing"
    },
    "other_allowances": {
      "type": "number",
      "description": "Allowance snapshot at time of payroll processing"
    },
    "overtime_hours": {
      "type": "number"
    },
    "overtime_amount": {
      "type": "number"
    },
    "gross_salary": {
      "type": "number"
    },
    "gosi_employee": {
      "type": "number"
    },
    "gosi_employer": {
      "type": "number"
    },
    "loan_deduction": {
      "type": "number"
    },
    "other_deductions": {
      "type": "number"
    },
    "total_deductions": {
      "type": "number"
    },
    "net_salary": {
      "type": "number"
    },
    "status": {
      "type": "string",
      "enum": [
        "Draft",
        "Processed",
        "Paid"
      ],
      "default": "Draft"
    },
    "payment_date": {
      "type": "string",
      "format": "date"
    }
  },
  "required": [
    "employee_id",
    "month",
    "year"
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