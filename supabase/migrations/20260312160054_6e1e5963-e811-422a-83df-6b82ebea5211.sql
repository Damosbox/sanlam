UPDATE products SET category = 'non-vie' WHERE category IN ('non_vie', 'Non-Vie', 'Auto', 'Habitation');
UPDATE products SET category = 'vie' WHERE category IN ('Vie', 'Santé');