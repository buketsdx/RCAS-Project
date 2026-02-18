
let apiUrl = '';
let apiKey = '';

const mapEntityToResource = (entityName) => {
  if (entityName === 'IDCounter') return 'id_counters';
  if (entityName === 'Settings') return 'settings';
  return entityName;
};

export const restApiAdapter = {
  name: 'rest_api',
  
  initialize: async (config) => {
    if (!config?.apiUrl) {
      throw new Error("API URL is required");
    }
    apiUrl = config.apiUrl;
    apiKey = config.apiKey || '';
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    if (!apiUrl) throw new Error("API not initialized");
    
    const resource = mapEntityToResource(entityName);

    const params = new URLSearchParams();
    if (context?.companyId) params.append('company_id', context.companyId);

    const response = await fetch(`${apiUrl}/${resource}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  },

  get: async (entityName, id, context) => {
    if (!apiUrl) throw new Error("API not initialized");

    const resource = mapEntityToResource(entityName);
    const params = new URLSearchParams();
    if (context?.companyId) params.append('company_id', context.companyId);

    const queryString = params.toString();
    const url = queryString
      ? `${apiUrl}/${resource}/${id}?${queryString}`
      : `${apiUrl}/${resource}/${id}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  },

  create: async (entityName, data, context) => {
    if (!apiUrl) throw new Error("API not initialized");

    const resource = mapEntityToResource(entityName);

    const payload = { ...data };
    if (context?.companyId) payload.company_id = context.companyId;

    const response = await fetch(`${apiUrl}/${resource}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  },

  update: async (entityName, id, data) => {
    if (!apiUrl) throw new Error("API not initialized");

    const resource = mapEntityToResource(entityName);

    const response = await fetch(`${apiUrl}/${resource}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  },

  delete: async (entityName, id) => {
    if (!apiUrl) throw new Error("API not initialized");

    const resource = mapEntityToResource(entityName);

    const response = await fetch(`${apiUrl}/${resource}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return { success: true };
  },

  auth: {
    login: async (username, password) => {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error("Login failed");
      return await response.json();
    },
    
    register: async (data) => {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Registration failed");
      return await response.json();
    },

    me: async () => {
      // Implementation depends on API
      return null; 
    },

    logout: async () => {
      // Client side cleanup
    },
    
    addUserToCompany: async (companyId, email, role) => {
        const response = await fetch(`${apiUrl}/auth/invite`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ companyId, email, role })
          });
          if (!response.ok) throw new Error("Invite failed");
          return await response.json();
    },

    getCompanyUsers: async (companyId) => {
        const response = await fetch(`${apiUrl}/companies/${companyId}/users`, {
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json' 
            }
          });
          if (!response.ok) return [];
          return await response.json();
    },
    
    requestPasswordReset: async (email) => {
        return { message: "Check server logs or email service" };
    },
    
    resetPassword: async (email, otp, newPassword) => {
        return { success: false, message: "Not implemented" };
    }
  }
};
