-- Update Auto products with optional flags and price modifiers
UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(coverages, '{responsabilite_civile,optional}', 'false'),
      '{responsabilite_civile,price_modifier}', '0'
    ),
    '{vol_incendie,optional}', 'true'
  ),
  '{vol_incendie,price_modifier}', '3000'
)
WHERE category = 'Auto' AND name = 'Auto Confort';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{bris_glace,optional}', 'true'),
  '{bris_glace,price_modifier}', '1500'
)
WHERE category = 'Auto' AND name = 'Auto Confort';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{assistance,optional}', 'true'),
  '{assistance,price_modifier}', '2000'
)
WHERE category = 'Auto' AND name = 'Auto Confort';

-- Update Auto Essentielle
UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{responsabilite_civile,optional}', 'false'),
  '{responsabilite_civile,price_modifier}', '0'
)
WHERE category = 'Auto' AND name = 'Auto Essentielle';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(coverages, '{vol_incendie,optional}', 'true'),
      '{vol_incendie,price_modifier}', '3000'
    ),
    '{bris_glace,optional}', 'true'
  ),
  '{bris_glace,price_modifier}', '1500'
)
WHERE category = 'Auto' AND name = 'Auto Essentielle';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{assistance,optional}', 'true'),
  '{assistance,price_modifier}', '2000'
)
WHERE category = 'Auto' AND name = 'Auto Essentielle';

-- Update Auto Premium
UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{responsabilite_civile,optional}', 'false'),
  '{responsabilite_civile,price_modifier}', '0'
)
WHERE category = 'Auto' AND name = 'Auto Premium';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{vol_incendie,optional}', 'false'),
  '{vol_incendie,price_modifier}', '0'
)
WHERE category = 'Auto' AND name = 'Auto Premium';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{conducteur,optional}', 'true'),
  '{conducteur,price_modifier}', '2500'
)
WHERE category = 'Auto' AND name = 'Auto Premium';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(coverages, '{vehicule_remplacement,optional}', 'true'),
  '{vehicule_remplacement,price_modifier}', '3500'
)
WHERE category = 'Auto' AND name = 'Auto Premium';

-- Update Santé products
UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(coverages, '{hospitalisation,optional}', 'false'),
              '{hospitalisation,price_modifier}', '0'
            ),
            '{consultation,optional}', 'false'
          ),
          '{consultation,price_modifier}', '0'
        ),
        '{pharmacie,optional}', 'true'
      ),
      '{pharmacie,price_modifier}', '3000'
    ),
    '{optique,optional}', 'true'
  ),
  '{optique,price_modifier}', '2000'
)
WHERE category = 'Santé';

-- Update Habitation products
UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(coverages, '{incendie,optional}', 'false'),
                  '{incendie,price_modifier}', '0'
                ),
                '{responsabilite_civile,optional}', 'false'
              ),
              '{responsabilite_civile,price_modifier}', '0'
            ),
            '{vol,optional}', 'true'
          ),
          '{vol,price_modifier}', '2500'
        ),
        '{degats_eaux,optional}', 'true'
      ),
      '{degats_eaux,price_modifier}', '1500'
    ),
    '{bris_glace,optional}', 'true'
  ),
  '{bris_glace,price_modifier}', '1000'
)
WHERE category = 'Habitation';

-- Update other products
UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(coverages, '{vol,optional}', 'false'),
              '{vol,price_modifier}', '0'
            ),
            '{casse,optional}', 'true'
          ),
          '{casse,price_modifier}', '1500'
        ),
        '{oxydation,optional}', 'true'
      ),
      '{oxydation,price_modifier}', '1000'
    ),
    '{panne,optional}', 'true'
  ),
  '{panne,price_modifier}', '2000'
)
WHERE category = 'Électronique';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(coverages, '{capital_garanti,optional}', 'false'),
              '{capital_garanti,price_modifier}', '0'
            ),
            '{rendement,optional}', 'false'
          ),
          '{rendement,price_modifier}', '0'
        ),
        '{versements_libres,optional}', 'true'
      ),
      '{versements_libres,price_modifier}', '0'
    ),
    '{retrait_partiel,optional}', 'true'
  ),
  '{retrait_partiel,price_modifier}', '0'
)
WHERE category = 'Épargne';

UPDATE products SET coverages = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(coverages, '{intemperies,optional}', 'false'),
              '{intemperies,price_modifier}', '0'
            ),
            '{incendie,optional}', 'false'
          ),
          '{incendie,price_modifier}', '0'
        ),
        '{vol_betail,optional}', 'true'
      ),
      '{vol_betail,price_modifier}', '2000'
    ),
    '{maladie_animaux,optional}', 'true'
  ),
  '{maladie_animaux,price_modifier}', '1500'
)
WHERE category = 'Agricole';