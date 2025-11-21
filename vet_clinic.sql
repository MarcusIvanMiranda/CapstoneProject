-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 19, 2025 at 10:16 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vet_clinic`
--

-- --------------------------------------------------------

--
-- Table structure for table `cat`
--

CREATE TABLE `cat` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `breed` varchar(120) NOT NULL,
  `birthdate` date NOT NULL,
  `disease` varchar(255) DEFAULT NULL,
  `device_name` varchar(120) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `normal_heartbeat` varchar(255) DEFAULT NULL,
  `current_status` varchar(50) DEFAULT NULL COMMENT 'The latest recorded status (e.g., Active, Taking Shower, etc.)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cat`
--

INSERT INTO `cat` (`id`, `owner_id`, `name`, `breed`, `birthdate`, `disease`, `device_name`, `image`, `created_at`, `normal_heartbeat`, `current_status`) VALUES
(1, 1, 'Molang', 'Golden Retriever', '2023-06-19', 'normal', 'cat1', 'UPLOADS/owners/1763233568_da6e3974.jpg', '2025-10-05 13:48:00', '180 - 210', 'Taking Shower'),
(6, 1, 'browny', 'Golden Retriever', '2024-11-17', 'normal', 'Max', 'UPLOADS/owners/1763264653_3d2f4372.jpg', '2025-11-16 03:44:13', '100 - 120', 'N/A');

-- --------------------------------------------------------

--
-- Table structure for table `cat_status_log`
--

CREATE TABLE `cat_status_log` (
  `id` int(11) NOT NULL COMMENT 'Unique ID for the status log entry',
  `cat_id` int(11) NOT NULL COMMENT 'Foreign key linking to the cat table',
  `status` varchar(50) NOT NULL COMMENT 'The selected activity (e.g., Active, Taking Shower, etc.)',
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'The date and time the status was recorded'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diagnostics`
--

CREATE TABLE `diagnostics` (
  `id` int(11) NOT NULL COMMENT 'Unique ID for the diagnostic entry',
  `cat_id` int(11) NOT NULL COMMENT 'Foreign key linking to the cats table',
  `diagnostic_text` text NOT NULL COMMENT 'The detailed notes entered by the user in the modal',
  `log_date` date NOT NULL COMMENT 'The date the user selected in the input field (when the diagnostic was performed/logged)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'The date and time the record was created in the database'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `diagnostics`
--

INSERT INTO `diagnostics` (`id`, `cat_id`, `diagnostic_text`, `log_date`, `created_at`) VALUES
(1, 1, 'Complete History \n- Obtain detailed history on breathing, appetite, lethargy, activity level, and any episodes of fainting (syncope) or acute hind-limb paralysis (saddle thrombus).\n\n-To identify clinical signs of heart failure or thromboembolism.\n\n-History of rapid or labored breathing (tachypnea/dyspnea), lethargy, or acute pain/paralysis in the rear limbs.\n\n\nPhysical Examination\n-Auscultation (listening) to the heart and lungs, palpation of peripheral pulses, and assessment of heart rate and rhythm.\n\n-To detect heart abnormalities and signs of congestive heart failure (CHF).\n\nHeart murmur (systolic murmur), gallop rhythm (extra heart sound), arrhythmia, and potentially pulmonary crackles (fluid in lungs) or hypothermia in advanced/emergency cases.', '2025-10-05', '2025-10-05 14:56:44'),
(4, 1, 'hi', '2025-10-17', '2025-10-17 02:22:18'),
(9, 1, 'take medication 3x a week', '2025-11-16', '2025-11-16 03:49:39'),
(10, 1, 'jiasd', '2025-11-17', '2025-11-16 19:19:18');

-- --------------------------------------------------------

--
-- Table structure for table `heartbeat_log`
--

CREATE TABLE `heartbeat_log` (
  `id` int(11) UNSIGNED NOT NULL,
  `cat_id` int(11) NOT NULL,
  `heartbeat` int(11) NOT NULL,
  `possible_diseases` text DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `heartbeat_log`
--

INSERT INTO `heartbeat_log` (`id`, `cat_id`, `heartbeat`, `possible_diseases`, `recorded_at`) VALUES
(1, 1, 71, '', '2025-10-05 14:00:23'),
(2, 1, 230, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:01:23'),
(3, 1, 78, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:02:23'),
(4, 1, 48, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-05 14:03:23'),
(5, 1, 55, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-05 14:04:23'),
(6, 1, 106, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:07:23'),
(7, 1, 99, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:09:23'),
(8, 1, 71, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:11:23'),
(9, 1, 190, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:16:01'),
(10, 1, 71, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:18:01'),
(11, 1, 93, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:19:01'),
(12, 1, 79, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:20:01'),
(13, 1, 97, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:21:01'),
(14, 1, 76, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:22:01'),
(15, 1, 124, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:23:01'),
(16, 1, 92, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:24:02'),
(17, 1, 57, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-05 14:25:02'),
(18, 1, 90, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:27:49'),
(19, 1, 78, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:28:49'),
(20, 1, 65, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-05 14:29:49'),
(21, 1, 70, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:30:49'),
(22, 1, 80, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:31:49'),
(23, 1, 78, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:32:49'),
(24, 1, 99, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:34:49'),
(25, 1, 70, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:35:49'),
(26, 1, 72, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:36:49'),
(27, 1, 43, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-05 14:37:49'),
(28, 1, 68, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:38:49'),
(29, 1, 88, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:39:49'),
(30, 1, 75, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:40:49'),
(31, 1, 75, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-05 14:41:49'),
(32, 1, 83, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-06 10:00:25'),
(33, 1, 195, NULL, '2025-10-17 01:27:00'),
(34, 1, 120, NULL, '2025-10-17 01:23:00'),
(35, 1, 230, 'Tachycardia: >220 bpm', '2025-10-17 01:19:00'),
(36, 1, 178, NULL, '2025-10-17 01:15:00'),
(37, 1, 145, NULL, '2025-10-17 01:11:00'),
(38, 1, 150, NULL, '2025-10-17 01:07:00'),
(39, 1, 80, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-17 01:03:00'),
(40, 1, 165, NULL, '2025-10-17 00:59:00'),
(41, 1, 182, NULL, '2025-10-17 00:55:00'),
(42, 1, 210, NULL, '2025-10-17 00:51:00'),
(43, 1, 135, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-17 00:47:00'),
(44, 1, 190, NULL, '2025-10-17 00:43:00'),
(45, 1, 115, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-17 00:39:00'),
(46, 1, 160, NULL, '2025-10-17 00:35:00'),
(47, 1, 205, NULL, '2025-10-17 00:31:00'),
(48, 1, 170, NULL, '2025-10-16 23:00:00'),
(49, 1, 95, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-16 21:30:00'),
(50, 1, 225, 'Tachycardia: >220 bpm', '2025-10-16 19:00:00'),
(51, 1, 140, NULL, '2025-10-16 16:45:00'),
(52, 1, 188, NULL, '2025-10-16 13:00:00'),
(53, 1, 105, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-16 10:30:00'),
(54, 1, 165, NULL, '2025-10-16 07:15:00'),
(55, 1, 190, NULL, '2025-10-16 04:00:00'),
(56, 1, 205, NULL, '2025-10-16 02:30:00'),
(57, 1, 130, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-16 00:00:00'),
(58, 1, 175, NULL, '2025-10-15 06:00:00'),
(59, 1, 110, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-14 03:00:00'),
(60, 1, 200, NULL, '2025-10-13 10:00:00'),
(61, 1, 75, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm\nThird-Degree Atrioventricular (AV) Block: 40-65 bpm', '2025-10-12 01:00:00'),
(62, 1, 155, NULL, '2025-10-11 12:00:00'),
(63, 1, 195, NULL, '2025-10-10 08:00:00'),
(64, 1, 125, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-10-09 05:00:00'),
(65, 1, 180, NULL, '2025-10-08 02:00:00'),
(66, 1, 185, NULL, '2025-10-03 04:00:00'),
(67, 1, 215, NULL, '2025-09-29 00:00:00'),
(68, 1, 140, NULL, '2025-09-25 09:00:00'),
(69, 1, 90, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-09-19 23:00:00'),
(70, 1, 170, NULL, '2025-09-15 11:00:00'),
(71, 1, 105, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-09-10 06:00:00'),
(72, 1, 160, NULL, '2025-08-01 02:00:00'),
(73, 1, 115, 'Arrhythmias (Abnormal Rhythms):\nBradycardia: <140 bpm', '2025-06-15 07:00:00'),
(74, 1, 130, 'Arrhythmias (Abnormal Rhythms):\r\nBradycardia: <140 bpm', '2026-03-20 01:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `note`
--

CREATE TABLE `note` (
  `id` int(11) NOT NULL,
  `notes` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `note`
--

INSERT INTO `note` (`id`, `notes`, `created_at`) VALUES
(1, 'hi', '2025-10-13 01:38:42'),
(3, 'yo', '2025-10-17 02:20:05'),
(5, 'kakain mamaya', '2025-11-16 03:42:03');

-- --------------------------------------------------------

--
-- Table structure for table `owner`
--

CREATE TABLE `owner` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(40) NOT NULL,
  `email` varchar(160) NOT NULL,
  `address` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `owner`
--

INSERT INTO `owner` (`id`, `name`, `phone`, `email`, `address`, `password`, `image`, `created_at`) VALUES
(1, 'Marcus Ivan Miranda', '09057319606', 'mmarcusivanmiranda@gmail.com', 'San Pedro 2', '$2y$10$PuKkhORWB1QqF7C1C0MhMu.KY4q5XDSW8Oow9r6pyu8IWqU4kMVq2', 'UPLOADS/owners/1759672040_96bc96ad.jpg', '2025-10-05 13:47:20'),
(6, 'Renz Reoliquio', '09057319606', 'renz@gmail.com', 'San Pedro 2', '$2y$10$AREzUTuu4MGr4bi4SzmVW.vH3QQJe44nb.JtmHUsO3xx5gv8VFeUi', 'UPLOADS/owners/1763264481_f42c513f.png', '2025-11-16 03:41:21');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(160) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cat`
--
ALTER TABLE `cat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cat_owner` (`owner_id`);

--
-- Indexes for table `cat_status_log`
--
ALTER TABLE `cat_status_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_status_cat` (`cat_id`);

--
-- Indexes for table `diagnostics`
--
ALTER TABLE `diagnostics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_diagnostic_cat` (`cat_id`);

--
-- Indexes for table `heartbeat_log`
--
ALTER TABLE `heartbeat_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cat_id` (`cat_id`);

--
-- Indexes for table `note`
--
ALTER TABLE `note`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `owner`
--
ALTER TABLE `owner`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_owner_email` (`email`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token` (`token`),
  ADD KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cat`
--
ALTER TABLE `cat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cat_status_log`
--
ALTER TABLE `cat_status_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique ID for the status log entry';

--
-- AUTO_INCREMENT for table `diagnostics`
--
ALTER TABLE `diagnostics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique ID for the diagnostic entry', AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `heartbeat_log`
--
ALTER TABLE `heartbeat_log`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `note`
--
ALTER TABLE `note`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `owner`
--
ALTER TABLE `owner`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cat`
--
ALTER TABLE `cat`
  ADD CONSTRAINT `fk_cat_owner` FOREIGN KEY (`owner_id`) REFERENCES `owner` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cat_status_log`
--
ALTER TABLE `cat_status_log`
  ADD CONSTRAINT `fk_status_cat` FOREIGN KEY (`cat_id`) REFERENCES `cat` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `heartbeat_log`
--
ALTER TABLE `heartbeat_log`
  ADD CONSTRAINT `fk_cat_id` FOREIGN KEY (`cat_id`) REFERENCES `cat` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
