export const WasteRecord = {
  "name": "WasteRecord",
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
    "waste_type": {
      "type": "string",
      "enum": [
        "Paper",
        "Plastic",
        "E-Waste",
        "Organic",
        "Metal",
        "Glass",
        "Hazardous",
        "Other"
      ]
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
        "Obsolescence",
        "Production Defect",
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
        "Recycling",
        "Landfill",
        "Incineration",
        "Donation",
        "Return to Vendor",
        "Composting"
      ]
    },
    "vendor_name": {
      "type": "string",
      "description": "Vendor associated with disposal or original purchase"
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
    "waste_type",
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
};
