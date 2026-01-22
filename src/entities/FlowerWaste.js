export const FlowerrWaste = {
  "name": "FlowerWaste",
  "type": "object",
  "properties": {
    "waste_id": {
      "type": "string",
      "description": "Auto-generated unique waste ID"
    },
    "date": {
      "type": "string",
      "format": "date"
    },
    "branch_id": {
      "type": "string"
    },
    "stock_item_id": {
      "type": "string"
    },
    "stock_item_name": {
      "type": "string"
    },
    "quantity": {
      "type": "number"
    },
    "unit": {
      "type": "string"
    },
    "waste_reason": {
      "type": "string",
      "enum": [
        "Expired",
        "Damaged",
        "Wilted",
        "Pest Infestation",
        "Storage Issue",
        "Transportation Damage",
        "Customer Return",
        "Other"
      ]
    },
    "cost_value": {
      "type": "number"
    },
    "disposal_method": {
      "type": "string",
      "enum": [
        "Composting",
        "Disposal",
        "Donation",
        "Recycling"
      ]
    },
    "recorded_by": {
      "type": "string"
    },
    "notes": {
      "type": "string"
    },
    "image_url": {
      "type": "string"
    }
  },
  "required": [
    "date",
    "stock_item_id",
    "quantity",
    "waste_reason"
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