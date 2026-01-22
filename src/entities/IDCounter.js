export const IDCounter = {
  "name": "IDCounter",
  "type": "object",
  "properties": {
    "entity_type": {
      "type": "string",
      "description": "Type of entity for ID generation"
    },
    "prefix": {
      "type": "string"
    },
    "last_number": {
      "type": "number",
      "default": 0
    },
    "padding": {
      "type": "number",
      "default": 5
    }
  },
  "required": [
    "entity_type",
    "prefix"
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