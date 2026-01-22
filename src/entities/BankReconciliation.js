export const BankReconciliation = {
  "name": "BankReconciliation",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "bank_ledger_id": {
      "type": "string"
    },
    "voucher_id": {
      "type": "string"
    },
    "voucher_date": {
      "type": "string",
      "format": "date"
    },
    "voucher_number": {
      "type": "string"
    },
    "voucher_type": {
      "type": "string"
    },
    "amount": {
      "type": "number"
    },
    "transaction_type": {
      "type": "string",
      "enum": [
        "Deposit",
        "Withdrawal"
      ]
    },
    "cheque_number": {
      "type": "string"
    },
    "cheque_date": {
      "type": "string",
      "format": "date"
    },
    "bank_date": {
      "type": "string",
      "format": "date"
    },
    "is_reconciled": {
      "type": "boolean",
      "default": false
    },
    "remarks": {
      "type": "string"
    }
  },
  "required": [
    "bank_ledger_id",
    "voucher_id"
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