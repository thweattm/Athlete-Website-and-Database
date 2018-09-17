-- Mike Thweatt
-- CS340
-- Final Database Project

-- Create Table SQL Queries:

DROP TABLE IF EXISTS athlete;
DROP TABLE IF EXISTS coach;
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS endorsements;
DROP TABLE IF EXISTS college;


CREATE TABLE college(
	id int NOT NULL AUTO_INCREMENT,
	city varchar(255) NOT NULL,
	state varchar(255) NOT NULL,
	schoolName varchar(255) NOT NULL,
	CONSTRAINT collegeName UNIQUE (city, state, schoolName),
	PRIMARY KEY (id)
)ENGINE=InnoDB;


CREATE TABLE team(
	id int NOT NULL AUTO_INCREMENT,
	city varchar(255) NOT NULL,
	state varchar(255) NOT NULL,
	teamName varchar(255) NOT NULL,
	coachID int UNIQUE,
	CONSTRAINT fullTeam UNIQUE (city, state, teamName),
	PRIMARY KEY (id),
	FOREIGN KEY (coachID) REFERENCES coach(id) ON DELETE SET NULL
)ENGINE=InnoDB;


CREATE TABLE athlete(
	id int NOT NULL AUTO_INCREMENT,
	firstName varchar(255) NOT NULL,
	lastName varchar(255) NOT NULL,
	jerseyNumber int,
	teamID int,
	collegeID int,
	CONSTRAINT athleteName UNIQUE (firstName, lastName, jerseyNumber),
	PRIMARY KEY (id),
	FOREIGN KEY (teamID) REFERENCES team(id) ON DELETE SET NULL,
	FOREIGN KEY (collegeID) REFERENCES college(id) ON DELETE SET NULL
)ENGINE=InnoDB;


CREATE TABLE coach(
	id int NOT NULL AUTO_INCREMENT,
	firstName varchar(255) NOT NULL,
	lastName varchar(255) NOT NULL,
	teamID int UNIQUE,
	PRIMARY KEY (id),
	FOREIGN KEY (teamID) REFERENCES team(id) ON DELETE SET NULL
)ENGINE=InnoDB;


CREATE TABLE company(
	id int NOT NULL AUTO_INCREMENT,
	companyName varchar(255) NOT NULL UNIQUE,
	notes varchar(255),
	PRIMARY KEY (id)
)ENGINE=InnoDB;


CREATE TABLE endorsement(
	id int NOT NULL AUTO_INCREMENT,
	athleteID int NOT NULL,
	companyID int NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT pk_endorse UNIQUE (athleteID, companyID)
)ENGINE=InnoDB;
