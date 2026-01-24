export const Company = {
  "name": "Company",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Company name"
    },
    "name_arabic": {
      "type": "string",
      "description": "Company name in Arabic"
    },
    "address": {
      "type": "string"
    },
    "city": {
      "type": "string"
    },
    "country": {
      "type": "string",
      "default": "Saudi Arabia"
    },
    "postal_code": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "website": {
      "type": "string"
    },
    "vat_number": {
      "type": "string",
      "description": "VAT Registration Number"
    },
    "cr_number": {
      "type": "string",
      "description": "Commercial Registration Number"
    },
    "financial_year_start": {
      "type": "string",
      "format": "date"
    },
    "financial_year_end": {
      "type": "string",
      "format": "date"
    },
    "currency": {
      "type": "string",
      "default": "SAR"
    },
    "logo_url": {
      "type": "string"
    },
    "password": {
      "type": "string",
      "description": "Company password for access control"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name"
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