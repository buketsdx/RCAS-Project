export  const Settings = {
  "name": "Settings",
  "type": "object",
  "properties": {
    "company_id": {
      "type": "string"
    },
    "setting_key": {
      "type": "string"
    },
    "setting_value": {
      "type": "string"
    },
    "category": {
      "type": "string"
    }
  },
  "required": [
    "setting_key"
  ],
  "rls": {
    "create": {
      "user_condition": {
        "role": "admin"
      }
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