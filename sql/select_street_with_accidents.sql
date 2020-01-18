-- C:/Users/ak1/Apps/collision/sql/select_street_with_accidents.sql
.header on
.mode csv
.once C:/Users/ak1/Apps/collision/output/street_with_accidents_output.txt
SELECT
  CASE
    -- WHEN cs.name IS NOT NULL THEN 'On ' || ons.name || ', x ' || cs.name || ', off ' || os.name
    -- WHEN os.name IS NOT NULL THEN 'On ' || ons.name || ', off ' || os.name
    -- WHEN ons.name IS NOT NULL THEN 'On ' || ons.name
    -- ELSE 'Dunno: ' || COALESCE(s.name, 'No street name')
    WHEN ons.name like '%65 pl%' THEN 'On ' || ons.name || ', off ' || COALESCE(os.name, ' ') || ', x ' || COALESCE(cs.name, ' ')
    WHEN os.name like '%65 pl%' THEN 'Off ' || os.name || ', on ' || COALESCE(ons.name, ' ') || ', x ' || COALESCE(cs.name, ' ')
    WHEN cs.name like '%65 pl%' THEN 'X ' || cs.name || ', on ' || COALESCE(ons.name, ' ') || ', off ' || COALESCE(os.name, ' ')
    WHEN cs.name like '%65 pl%' 
        THEN 'X ' || cs.name 
        || ', on ' || COALESCE(ons.name, ' ') || ', off ' || COALESCE(os.name, ' ')
  END street_type,
  COALESCE(s.zip_code, 'No Zip') as zip,
  CASE
    number_of_persons_injured
    WHEN 0 THEN 'no injuries'
    WHEN 1 THEN number_of_persons_injured || ' injured'
    ELSE number_of_persons_injured || ' injuries'
  END injuries,
  CASE
    number_of_persons_killed
    WHEN 0 THEN 'no deaths'
    ELSE number_of_persons_killed || ' killed'
  END killed,
  CASE
    number_of_pedestrians_injured
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_pedestrians_injured || ' pedestrian injured'
    ELSE number_of_pedestrians_injured || ' pedestrians injured'
  END pedestrians_i,
  CASE
    number_of_pedestrians_killed
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_pedestrians_killed || ' pedestrian killed'
    ELSE number_of_pedestrians_killed || ' pedestrians killed'
  END pedestrians_k,
  CASE
    number_of_cyclists_injured
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_cyclists_injured || ' cyclist injured'
    ELSE number_of_cyclists_injured || ' cyclists injured'
  END cyclists_i,
  CASE
    number_of_cyclists_killed
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_cyclists_killed || ' cyclist killed'
    ELSE number_of_cyclists_killed || ' cyclists killed'
  END cyclists_k,
  CASE
    number_of_motorists_injured
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_motorists_injured || ' motorist injured'
    ELSE number_of_motorists_injured || ' motorists injured'
  END motorists_i,
  CASE
    number_of_motorists_killed
    WHEN 0 THEN NULL
    WHEN 1 THEN number_of_motorists_killed || ' motorist killed'
    ELSE number_of_motorists_killed || ' motorists killed'
  END motorists_k,
  date
FROM collision c
INNER join street s ON (
    c.cross_street_id = s.id
    OR c.off_street_id = s.id
    OR c.on_street_id = s.id
  )
LEFT join street cs ON c.cross_street_id = cs.id
LEFT join street os ON c.off_street_id = os.id
LEFT join street ons ON c.on_street_id = ons.id
WHERE
  (
    s.name like '%65 pl%'
    OR ons.name like '%65 pl%'
    OR cs.name like '%65 pl%'
    OR os.name like '%65 pl%'
  )
  AND s.borough_code = 'q'
  AND (
    number_of_persons_injured > 0
    OR number_of_persons_killed > 0
  )
ORDER BY
  unique_key,
  injuries,
  killed,
  street_type,
  date;

-- .system C:/Users/ak1/Apps/collision/sql/street_with_accidents_output.txt