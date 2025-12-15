SELECT setval(
  pg_get_serial_sequence('product', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM product),
  true
);