export const VoucherLedgerEntry = {
  "name": "VoucherLedgerEntry",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "voucher_id": {
      "type": "string"
    },
    "ledger_id": {
      "type": "string"
    },
    "ledger_name": {
      "type": "string"
    },
    "debit_amount": {
      "type": "number",
      "default": 0
    },
    "credit_amount": {
      "type": "number",
      "default": 0
    },
    "narration": {
      "type": "string"
    }
  },
  "required": [
    "company_id",
    "voucher_id",
    "ledger_id"
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