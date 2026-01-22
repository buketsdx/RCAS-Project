export const VoucherItem = {
  "name": "VoucherItem",
  "type": "object",
  "properties": {
    "voucher_id": {
      "type": "string"
    },
    "stock_item_id": {
      "type": "string"
    },
    "stock_item_name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "godown_id": {
      "type": "string"
    },
    "quantity": {
      "type": "number"
    },
    "unit": {
      "type": "string"
    },
    "rate": {
      "type": "number"
    },
    "discount_percent": {
      "type": "number",
      "default": 0
    },
    "discount_amount": {
      "type": "number",
      "default": 0
    },
    "amount": {
      "type": "number"
    },
    "vat_rate": {
      "type": "number",
      "default": 15
    },
    "vat_amount": {
      "type": "number",
      "default": 0
    },
    "total_amount": {
      "type": "number"
    }
  },
  "required": [
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