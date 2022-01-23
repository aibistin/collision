-- C:/Users/ak1/Apps/collision/sql/select_street_with_accidents.sql
WITH on_streets AS (
  SELECT
    s.id AS id,
    s.name AS name,
    s.zip_code AS zip_code,
    s.borough_code AS borough_code
  FROM collision c
  INNER join street s ON c.on_street_id = s.id
),
off_streets AS (
  SELECT
    s.id AS id,
    s.name AS name,
    s.zip_code AS zip_code,
    s.borough_code AS borough_code
  FROM collision c
  INNER join street s ON c.off_street_id = s.id
),
cross_streets AS (
  SELECT
    s.id AS id,
    s.name AS name,
    s.zip_code AS zip_code,
    s.borough_code AS borough_code
  FROM collision c
  INNER join street s ON c.cross_street_id = s.id
)
SELECT
  ons.name,
  os.name,
  cs.name,
  COALESCE(ons.zip_code, os.zip_code, cs.zip_code, 'No Zip'),
  number_of_persons_injured,
  number_of_persons_killed,
  number_of_pedestrians_injured,
  number_of_pedestrians_killed,
  number_of_cyclists_injured,
  number_of_cyclists_killed,
  number_of_cyclists_killed,
  number_of_motorists_injured,
  number_of_motorists_killed,
  date
FROM collision c
INNER JOIN on_streets ons ON c.on_street_id = ons.id
INNER JOIN off_streets os ON c.off_street_id = os.id
INNER JOIN cross_streets cs ON c.off_street_id = cs.id
WHERE
  (
    ons.name like '%65 pl%'
    OR os.name like '%65 pl%'
    OR cs.name like '%65 pl%'
  )
  AND (
    ons.borough_code = 'q'
    OR os.borough_code = 'q'
    OR cs.borough_code = 'q'
  )
  AND (
    number_of_persons_injured > 0
    OR number_of_persons_killed > 0
  )