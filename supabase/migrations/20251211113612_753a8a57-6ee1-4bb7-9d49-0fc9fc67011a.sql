-- =====================================================
-- ÉTAPE 1 : Créer le trigger pour générer automatiquement les profils
-- =====================================================

-- Créer le trigger pour appeler handle_new_user() lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ÉTAPE 2 : Créer les profils pour TOUS les utilisateurs existants qui n'en ont pas
-- =====================================================

INSERT INTO public.profiles (id, email, display_name, provider)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
  u.raw_app_meta_data->>'provider'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;