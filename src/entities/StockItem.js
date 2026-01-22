export const StockItem = {
  "name": "StockItem",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "name_arabic": {
      "type": "string"
    },
    "alias": {
      "type": "string"
    },
    "part_number": {
      "type": "string"
    },
    "barcode": {
      "type": "string"
    },
    "group_id": {
      "type": "string"
    },
    "unit_id": {
      "type": "string"
    },
    "alternate_unit_id": {
      "type": "string"
    },
    "conversion_factor": {
      "type": "number"
    },
    "opening_qty": {
      "type": "number",
      "default": 0
    },
    "opening_rate": {
      "type": "number",
      "default": 0
    },
    "opening_value": {
      "type": "number",
      "default": 0
    },
    "current_qty": {
      "type": "number",
      "default": 0
    },
    "current_value": {
      "type": "number",
      "default": 0
    },
    "cost_price": {
      "type": "number"
    },
    "selling_price": {
      "type": "number"
    },
    "mrp": {
      "type": "number"
    },
    "reorder_level": {
      "type": "number"
    },
    "minimum_qty": {
      "type": "number"
    },
    "maximum_qty": {
      "type": "number"
    },
    "gst_applicable": {
      "type": "boolean",
      "default": true
    },
    "vat_rate": {
      "type": "number",
      "default": 15
    },
    "hsn_code": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "image_url": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "unit_id"
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