-- Run once as root:  mysql -u root -p < infra/mysql/init.sql
-- One database per service. Services never read each other's tables;
-- they talk over HTTP through the gateway.

CREATE DATABASE IF NOT EXISTS sos_db;
CREATE DATABASE IF NOT EXISTS rescue_db;

CREATE USER IF NOT EXISTS 'flood'@'localhost' IDENTIFIED BY 'floodpass';

GRANT ALL PRIVILEGES ON sos_db.* TO 'flood'@'localhost';
GRANT ALL PRIVILEGES ON rescue_db.* TO 'flood'@'localhost';
FLUSH PRIVILEGES;
