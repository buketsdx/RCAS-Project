export const ZATCAInvoice = {
  "name": "ZATCAInvoice",
  "type": "object",
  "properties": {
    "voucher_id": {
      "type": "string"
    },
    "invoice_uuid": {
      "type": "string"
    },
    "invoice_hash": {
      "type": "string"
    },
    "qr_code": {
      "type": "string"
    },
    "submission_status": {
      "type": "string",
      "enum": [
        "Pending",
        "Submitted",
        "Accepted",
        "Rejected",
        "Cleared"
      ]
    },
    "submission_date": {
      "type": "string",
      "format": "date-time"
    },
    "zatca_response": {
      "type": "string"
    },
    "clearance_status": {
      "type": "string"
    },
    "warning_messages": {
      "type": "string"
    },
    "error_messages": {
      "type": "string"
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