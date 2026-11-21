-- Databases created before enum columns were mapped as VARCHAR still have
-- native MySQL ENUM columns, which reject any newly added value.
-- New databases are created correctly and don't need this.

ALTER TABLE sos_db.sos_requests
  MODIFY category VARCHAR(24) NOT NULL,
  MODIFY channel  VARCHAR(16) NOT NULL,
  MODIFY status   VARCHAR(16) NOT NULL;

ALTER TABLE sos_db.sos_status_history
  MODIFY from_status VARCHAR(16) NULL,
  MODIFY to_status   VARCHAR(16) NOT NULL;

ALTER TABLE rescue_db.rescue_teams
  MODIFY type   VARCHAR(24) NOT NULL,
  MODIFY status VARCHAR(16) NOT NULL;

ALTER TABLE rescue_db.rescue_assignments
  MODIFY status VARCHAR(16) NOT NULL;
