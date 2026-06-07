-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: super8
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `films`
--

DROP TABLE IF EXISTS `films`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `films` (
  `id` varchar(120) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `fichier_url` varchar(1000) NOT NULL,
  `duree` int NOT NULL,
  `annee` smallint DEFAULT NULL,
  `annee_fin` smallint DEFAULT NULL,
  `date_label` varchar(100) DEFAULT NULL,
  `description` text,
  `poster_url` varchar(1000) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `films`
--

LOCK TABLES `films` WRITE;
/*!40000 ALTER TABLE `films` DISABLE KEYS */;
INSERT INTO `films` VALUES ('bobine-1','Bobine 1','/videos/1971_H.264.mp4',1263,1971,NULL,'','','/thumbnails/bobine-1.png','2026-06-07 09:07:08','2026-06-07 09:07:17'),('bobine-10','Bobine 10','/videos/dam-ben_H.264.mp4',1247,1975,NULL,'','','/thumbnails/bobine-10.png','2026-06-07 10:40:49','2026-06-07 10:41:06'),('bobine-11','Bobine 11','/videos/damien_H.264.mp4',1626,1973,NULL,'','','/thumbnails/bobine-11.png','2026-06-07 10:43:10','2026-06-07 10:46:22'),('bobine-12','Bobine 12','/videos/la leyre_H.264.mp4',406,1989,NULL,'','','/thumbnails/bobine-12.png','2026-06-07 10:44:56','2026-06-07 10:45:32'),('bobine-13','Bobine 13','/videos/la-reunion_H.264.mp4',1045,1989,NULL,'','','/thumbnails/bobine-13.png','2026-06-07 10:48:11','2026-06-07 10:48:24'),('bobine-14','Bobine 14','/videos/lmq_H.264.mp4',1166,1990,NULL,'','','/thumbnails/bobine-14.png','2026-06-07 10:50:26','2026-06-07 10:50:55'),('bobine-15','Bobine 15','/videos/mariage-parent-dam_H.264.mp4',892,1970,1971,'','','/thumbnails/bobine-15.png','2026-06-07 10:54:32','2026-06-07 10:54:44'),('bobine-16','Bobine 16','/videos/plage-kayak1_H.264.mp4',881,1991,NULL,'','','/thumbnails/bobine-16.png','2026-06-07 10:56:33','2026-06-07 10:56:42'),('bobine-17','Bobine 17','/videos/Volan-Lmq-78_H.264.mp4',733,1978,NULL,'','','/thumbnails/bobine-17.png','2026-06-07 10:57:37','2026-06-07 10:57:49'),('bobine-18','Bobine 18','/videos/lmq-volan_H.264.mp4',1027,1986,NULL,'','','/thumbnails/bobine-18.png','2026-06-07 11:07:39','2026-06-07 11:07:56'),('bobine-19','Bobine 19','/videos/1982_H.264.mp4',1342,1982,NULL,'','','/thumbnails/bobine-19.png','2026-06-07 12:07:14','2026-06-07 12:08:06'),('bobine-2','Bobine 2','/videos/71-72_H.264.mp4',1586,1971,1972,'','','/thumbnails/bobine-2.png','2026-06-07 09:08:09','2026-06-07 09:08:20'),('bobine-3','Bobine 3','/videos/75-76_H.264.mp4',1258,1975,1976,'','','/thumbnails/bobine-3.png','2026-06-07 09:08:55','2026-06-07 09:09:06'),('bobine-4','Bobine 4 ','/videos/1976_H.264.mp4',1308,1976,NULL,'','','/thumbnails/bobine-4.png','2026-06-07 09:12:13','2026-06-07 09:12:35'),('bobine-5','Bobine 5','/videos/1978_H.264.mp4',1415,1978,NULL,'','','/thumbnails/bobine-5.png','2026-06-07 09:14:41','2026-06-07 09:14:54'),('bobine-6','Bobine 6','/videos/1978-79_H.264.mp4',1275,1978,1979,'','','/thumbnails/bobine-6.png','2026-06-07 09:16:48','2026-06-07 09:17:00'),('bobine-7','Bobine 7','/videos/1980_H.264.mp4',1409,1980,NULL,'','','/thumbnails/bobine-7.png','2026-06-07 09:22:04','2026-06-07 09:22:20'),('bobine-8','Bobine 8','/videos/1981_H.264.mp4',1251,1981,NULL,'','','/thumbnails/bobine-8.png','2026-06-07 09:24:38','2026-06-07 09:25:13'),('bobine-9','Bobine 9','/videos/Anniversaire-Pacha_H.264.mp4',441,1985,NULL,'','','/thumbnails/bobine-9.png','2026-06-07 10:39:02','2026-06-07 10:39:11');
/*!40000 ALTER TABLE `films` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referentiel`
--

DROP TABLE IF EXISTS `referentiel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referentiel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categorie` enum('branche','personne','evenement','lieu') NOT NULL,
  `valeur` varchar(255) NOT NULL,
  `couleur` varchar(7) DEFAULT NULL,
  `branche` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorie_valeur` (`categorie`,`valeur`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referentiel`
--

LOCK TABLES `referentiel` WRITE;
/*!40000 ALTER TABLE `referentiel` DISABLE KEYS */;
INSERT INTO `referentiel` VALUES (1,'personne','de la Salle Pierre',NULL,'de la Salle','2026-06-06 13:36:50'),(2,'lieu','La Marquèze',NULL,NULL,'2026-06-06 13:36:50'),(3,'branche','de la Salle','#e05c5c',NULL,'2026-06-06 13:36:50'),(4,'personne','de la Salle Pia',NULL,'de la Salle','2026-06-06 14:27:06'),(12,'evenement','Mariage',NULL,NULL,'2026-06-07 11:13:12'),(13,'lieu','Volan',NULL,NULL,'2026-06-07 11:13:12'),(19,'personne','de la Salle Benjamin',NULL,'de la Salle','2026-06-07 11:16:05'),(21,'branche','Amis',NULL,NULL,'2026-06-07 11:16:29'),(24,'branche','de Montard','#e0945c',NULL,'2026-06-07 11:17:20'),(25,'branche','de Ravignan','#c8a96e',NULL,'2026-06-07 11:17:32'),(26,'branche','Gard','#5cb85c',NULL,'2026-06-07 11:17:43'),(27,'branche','Sénéclauze','#5ca8e0',NULL,'2026-06-07 11:17:50'),(28,'personne','de la Salle Damien',NULL,'de la Salle','2026-06-07 11:21:09'),(29,'lieu','Rue Chaptal',NULL,NULL,'2026-06-07 11:21:09'),(43,'personne','Dennery Amélie',NULL,'Amis','2026-06-07 11:28:12'),(48,'personne','Gard Marie-Rose',NULL,'Gard','2026-06-07 11:33:13'),(49,'lieu','Loubejac',NULL,NULL,'2026-06-07 11:33:13'),(53,'personne','de la Salle Antonin',NULL,'de la Salle','2026-06-07 12:10:06'),(54,'personne','de Montard Raphaël',NULL,'de Montard','2026-06-07 12:10:06'),(62,'personne','Sénéclauze Régis',NULL,NULL,'2026-06-07 12:14:00'),(65,'evenement','Anniversaire',NULL,NULL,'2026-06-07 12:17:33'),(84,'personne','de la Salle Bertrand',NULL,NULL,'2026-06-07 12:32:21');
/*!40000 ALTER TABLE `referentiel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `segments`
--

DROP TABLE IF EXISTS `segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `segments` (
  `id` char(36) NOT NULL,
  `film_id` varchar(120) NOT NULL,
  `tc_debut` int NOT NULL,
  `tc_fin` int NOT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `personnes` json DEFAULT NULL,
  `evenements` json DEFAULT NULL,
  `lieux` json DEFAULT NULL,
  `branches` json DEFAULT NULL,
  `date_label` varchar(100) DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `film_id` (`film_id`),
  CONSTRAINT `segments_ibfk_1` FOREIGN KEY (`film_id`) REFERENCES `films` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `segments`
--

LOCK TABLES `segments` WRITE;
/*!40000 ALTER TABLE `segments` DISABLE KEYS */;
INSERT INTO `segments` VALUES ('010d8c5d-e2e9-402f-93fe-b9077becd505','bobine-12',1,47,'Descente de la Leyre','[\"de la Salle Antonin\", \"de la Salle Benjamin\"]','[]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 12:27:02','2026-06-07 12:27:02'),('0b36f5a8-a3a3-443c-a5e9-63daf94e61ef','bobine-2',2,247,'','[\"de la Salle Pierre\"]','[]','[]','[\"de la Salle\"]','','','2026-06-07 11:10:23','2026-06-07 11:10:23'),('0c2dd3c7-2352-43d3-b190-0dcc83c095ce','bobine-13',534,539,'','[\"de la Salle Pia\"]','[]','[]','[\"de la Salle\"]','','','2026-06-07 12:29:28','2026-06-07 12:29:28'),('1b14e239-d95d-4872-8a30-e12ab38cf6ef','bobine-15',0,47,'Shooting de la mariée','[\"de la Salle Pia\"]','[\"Mariage\"]','[\"Volan\"]','[\"de la Salle\"]','','','2026-06-07 11:13:12','2026-06-07 11:13:12'),('27fdfda8-61a3-4761-979b-6ae7f8153dd3','bobine-14',0,43,'Étang d\'Hirieu','[\"de la Salle Benjamin\", \"de la Salle Damien\"]','[]','[\"La Marquèze\"]','[\"de la Salle\", \"de Montard\"]','','','2026-06-07 12:31:06','2026-06-07 12:31:06'),('309e664e-815e-4c09-99a0-6b1684d890c7','bobine-6',0,3,'','[\"Gard Marie-Rose\", \"de la Salle Damien\"]','[]','[\"Loubejac\"]','[\"de la Salle\", \"Gard\"]','','','2026-06-07 11:33:13','2026-06-07 11:33:13'),('3129e749-22a6-403d-a404-f933b1f1089a','bobine-8',2,37,'','[\"de la Salle Benjamin\", \"de la Salle Damien\"]','[]','[\"Volan\"]','[\"de la Salle\"]','','','2026-06-07 12:12:08','2026-06-07 12:12:08'),('35aa47c6-f130-4538-a74b-c158f406580c','bobine-9',0,9,'Croisère annviersaire Pacha','[\"de la Salle Pierre\"]','[\"Anniversaire\"]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 12:17:33','2026-06-07 12:17:33'),('5341fa74-cf25-4296-9e94-85b99507fd46','bobine-3',1,50,'Cours rue Chaptal','[\"de la Salle Damien\"]','[]','[\"Rue Chaptal\"]','[\"de la Salle\"]','','','2026-06-07 11:21:09','2026-06-07 11:21:09'),('61eed6ef-a9c1-439f-a1a8-3130be012653','bobine-1',6,51,'Pause café','[\"de la Salle Pierre\", \"de la Salle Pia\"]','[]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 09:19:01','2026-06-07 09:19:01'),('6a347dbe-56ff-4dfa-a986-32aeaf76a325','bobine-18',0,28,'420','[\"de la Salle Antonin\", \"de la Salle Benjamin\"]','[]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 12:24:57','2026-06-07 12:24:57'),('6b72ebfa-bda1-426a-8e69-85c03b3a0f7f','bobine-7',0,22,'','[\"de la Salle Antonin\", \"de Montard Raphaël\"]','[]','[\"La Marquèze\"]','[\"de la Salle\", \"de Montard\"]','','','2026-06-07 12:10:06','2026-06-07 12:10:06'),('75a77c23-a8db-445c-8c9f-9518d83f59bd','bobine-5',1,34,'Paques ?','[\"de la Salle Benjamin\", \"de la Salle Damien\", \"Dennery Amélie\"]','[]','[\"Volan\"]','[\"de la Salle\"]','','','2026-06-07 11:26:48','2026-06-07 11:28:12'),('8360647e-c42e-4c40-bac4-adee27de889b','bobine-16',1,35,'','[\"de la Salle Bertrand\"]','[]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 12:32:21','2026-06-07 12:32:21'),('9aff6067-1de7-4a82-8a4e-5a15744110b6','bobine-11',4,20,'','[\"de la Salle Pia\"]','[]','[\"La Marquèze\"]','[\"de la Salle\"]','','','2026-06-07 11:14:17','2026-06-07 11:14:17'),('9ccde3c2-771f-4e1b-82f2-8d27394e6580','bobine-4',1,24,'','[\"de la Salle Damien\", \"de la Salle Benjamin\"]','[]','[\"Volan\"]','[\"de la Salle\"]','','','2026-06-07 11:24:07','2026-06-07 11:24:07'),('b84acf86-2fde-484a-bfcb-710f6fa5f06b','bobine-10',3,85,'Chez les de France','[\"de la Salle Benjamin\"]','[]','[]','[\"de la Salle\", \"Amis\"]','','','2026-06-07 11:16:05','2026-06-07 11:16:29'),('c0d720c8-4749-4942-8315-eb468b1df9d0','bobine-19',0,19,'','[\"Sénéclauze Régis\"]','[]','[\"Volan\"]','[\"Sénéclauze\"]','','','2026-06-07 12:14:00','2026-06-07 12:14:00'),('f282f05e-6467-43dc-894b-65859853d507','bobine-17',0,15,'','[\"de la Salle Benjamin\", \"de la Salle Damien\"]','[]','[\"Volan\"]','[\"de la Salle\"]','','','2026-06-07 11:25:35','2026-06-07 11:25:35');
/*!40000 ALTER TABLE `segments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07 13:20:26
