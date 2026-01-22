export const CustodyTransaction = {
  "name": "CustodyTransaction",
  "type": "object",
  "properties": {
    "transaction_id": {
      "type": "string"
    },
    "wallet_id": {
      "type": "string"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "type": {
      "type": "string",
      "enum": [
        "Deposit",
        "Withdrawal",
        "Transfer"
      ]
    },
    "amount": {
      "type": "number"
    },
    "currency": {
      "type": "string",
      "default": "SAR"
    },
    "reference": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "transfer_to_wallet_id": {
      "type": "string"
    }
  },
  "required": [
    "wallet_id",
    "date",
    "type",
    "amount"
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