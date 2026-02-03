
import { createClient } from '@supabase/supabase-js';

let supabase = null;

export const supabaseAdapter = {
  name: 'supabase',
  
  initialize: async (config) => {
    if (!config?.supabaseUrl || !config?.supabaseKey) {
      throw new Error("Supabase URL and Key are required");
    }
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    if (!supabase) throw new Error("Supabase not initialized");
    
    let query = supabase.from(entityName).select('*');
    
    // Filter by Company ID
    const globalEntities = ['User', 'Company', 'Currency', 'Settings']; 
    if (context?.companyId && !globalEntities.includes(entityName)) {
      query = query.eq('company_id', context.companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  create: async (entityName, data, context) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const newRecord = { ...data };
    // Auto-inject Company ID
    if (context?.companyId && !newRecord.company_id) {
      newRecord.company_id = context.companyId;
    }

    const { data: result, error } = await supabase
      .from(entityName)
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (entityName, id, data) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const { data: result, error } = await supabase
      .from(entityName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (entityName, id) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const { error } = await supabase
      .from(entityName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  auth: {
    login: async (username, password) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (error) throw error;
      return data.user;
    },
    
    register: async ({ email, password, full_name }) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      });
      if (error) throw error;
      return data.user;
    },

    me: async () => {
      if (!supabase) return null;
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },

    logout: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
    }
  }
};
