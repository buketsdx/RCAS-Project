export const BranchDailyRecord = {
  "name": "BranchDailyRecord",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "branch_id": {
      "type": "string"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "opening_cash": {
      "type": "number",
      "default": 0
    },
    "closing_cash_actual": {
      "type": "number",
      "default": 0
    },
    "deposited_by": {
      "type": "string"
    },
    "cash_sales": {
      "type": "number",
      "default": 0
    },
    "cash_received": {
      "type": "number",
      "default": 0
    },
    "expenses": {
      "type": "number",
      "default": 0
    },
    "drawings": {
      "type": "number",
      "default": 0
    },
    "purchases": {
      "type": "number",
      "default": 0
    },
    "employee_expenses": {
      "type": "number",
      "default": 0
    },
    "bank_transfer": {
      "type": "number",
      "default": 0
    },
    "mada_pos": {
      "type": "number",
      "default": 0
    },
    "total_sales": {
      "type": "number",
      "default": 0
    },
    "online_order_sales": {
      "type": "number",
      "default": 0
    },
    "closing_cash_system": {
      "type": "number",
      "default": 0
    },
    "difference": {
      "type": "number",
      "default": 0
    },
    "status": {
      "type": "string",
      "enum": [
        "Open",
        "Closed"
      ],
      "default": "Open"
    },
    "notes": {
      "type": "string"
    },
    "opened_by": {
      "type": "string"
    },
    "closed_by": {
      "type": "string"
    }
  },
  "required": [
    "company_id",
    "branch_id",
    "date",
    "status"
  ],
  "rls": {
    "create": {
      "company_id": "{{user.data.company_id}}"
    },
    "read": {
      "company_id": "{{user.data.company_id}}"
    },
    "update": {
      "company_id": "{{user.data.company_id}}"
    }
  }
}