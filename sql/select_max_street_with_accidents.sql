-- C:/Users/ak1/Apps/collision/sql/select_max_street_with_accidents.sql
.header on
.mode csv
.once C:/Users/ak1/Apps/collision/output/max_street_with_accidents.csv
SELECT
  on_street_id,
--   cross_street_id,
--   off_street_id,
--   MAX(number_of_persons_injured),
--   MAX(number_of_persons_killed),
--   MAX(number_of_pedestrians_injured),
--   MAX(number_of_pedestrians_killed),
--   MAX(number_of_cyclists_injured),
--   MAX(number_of_cyclists_killed),
--   MAX(number_of_cyclists_killed),
--   MAX(number_of_motorists_injured),
  MAX(number_of_motorists_killed)
FROM collision c
-- INNER join street s ON (
--     c.cross_street_id = s.id
--     OR c.off_street_id = s.id
--     OR c.on_street_id = s.id
--   )
GROUP BY
  on_street_id,
  cross_street_id,
  off_street_id
--   number_of_persons_injured,
--   number_of_persons_killed,
--   number_of_pedestrians_injured,
--   number_of_pedestrians_killed,
--   number_of_cyclists_injured,
--   number_of_cyclists_killed,
--   number_of_cyclists_killed,
--   number_of_motorists_injured,
--   number_of_motorists_killed
-- LEFT join street cs ON c.cross_street_id = cs.id
  -- LEFT join street os ON c.off_street_id = os.id
  -- LEFT join street ons ON c.on_street_id = ons.id
  -- ORDER BY
  --   unique_key,
  --   injuries,
  --   killed,
  --   street_type,
  --   date;
--   ORDER BY MAX(number_of_motorists_injured) DESC, 
  ORDER BY MAX(number_of_motorists_killed) DESC
  LIMIT 20;