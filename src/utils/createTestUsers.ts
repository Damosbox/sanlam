import { supabase } from "@/integrations/supabase/client";

export const createTestUsers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-test-users');
    
    if (error) {
      console.error('Erreur:', error);
      return { success: false, error };
    }
    
    console.log('Utilisateurs de test créés:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Erreur lors de la création des utilisateurs:', err);
    return { success: false, error: err };
  }
};
