export const currency = {
  "name": "Currency",
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "ISO currency code e.g. SAR, USD"
    },
    "name": {
      "type": "string"
    },
    "symbol": {
      "type": "string"
    },
    "exchange_rate": {
      "type": "number",
      "description": "Exchange rate to base currency (SAR)"
    },
    "decimal_places": {
      "type": "number",
      "default": 2
    },
    "is_base_currency": {
      "type": "boolean",
      "default": false
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "code",
    "name"
  ],
  "rls": {
    "create": {
      "user_condition": {
        "role": "admin"
      }
    },
    "read": {},
    "update": {
      "user_condition": {
        "role": "admin"
      }
    },
    "delete": {
      "user_condition": {
        "role": "admin"
      }
    }
  }
}