import { supabase } from "@/integrations/supabase/client";

export const createMockClients = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-mock-clients');
    
    if (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
    
    console.log('Clients mock créés:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Erreur lors de la création des clients mock:', err);
    return { success: false, error: err };
  }
};
