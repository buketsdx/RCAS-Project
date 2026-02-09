
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const globalEntities = ['User', 'Company', 'Currency', 'Settings'];

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
    // Auto-inject Company ID for non-global entities
    if (context?.companyId && !newRecord.company_id && !globalEntities.includes(entityName)) {
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

    loginWithGoogle: async (data) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      if (data.token) {
        // Exchange Google ID Token for Supabase Session
        const { data: result, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: data.token,
        });
        if (error) throw error;
        return result.user;
      } 
      
      // Fallback: If no token (should not happen with updated Login.jsx), try OAuth flow (redirects)
      const { data: result, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // This path redirects, so it won't return immediately
      return null;
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
