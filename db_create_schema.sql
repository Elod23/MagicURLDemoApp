

CREATE DATABASE IF NOT EXISTS `auth` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE auth;

CREATE TABLE IF NOT EXISTS `usersWithLogin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` varchar(100),
  PRIMARY KEY (id)
);