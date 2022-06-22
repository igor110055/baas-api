-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 29, 2021 at 11:04 AM
-- Server version: 10.4.19-MariaDB
-- PHP Version: 7.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `xpaystructure`
--

-- --------------------------------------------------------

--
-- Table structure for table `cms`
--

CREATE TABLE `cms` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactNumber` bigint(20) NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `siteLogo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `terms` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `privacy` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_us`
--

CREATE TABLE `contact_us` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagefile` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `response` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `response_imagefile` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','replied') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loadcard`
--

CREATE TABLE `loadcard` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(11) NOT NULL,
  `amount` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partnerFee` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardLoadFee` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finalAmount` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentType` enum('erc20','xif') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardField` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'cardNumber' COMMENT 'cardNumber',
  `status` enum('pending','confirm','cancelByUser','cancelByAdmin','loaded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `loaded_at` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loadId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_securities`
--

CREATE TABLE `password_securities` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `google2fa_enable` tinyint(1) NOT NULL DEFAULT 0,
  `google2fa_secret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_image` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(11) NOT NULL,
  `paymentType` enum('alipay','wechat','erc20','xif','free','link') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double(8,2) NOT NULL,
  `account` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','confirm','cancelByUser','cancelByAdmin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permission_role`
--

CREATE TABLE `permission_role` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plan`
--

CREATE TABLE `plan` (
  `id` int(10) UNSIGNED NOT NULL,
  `planName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double(8,2) NOT NULL,
  `year` int(11) NOT NULL,
  `eLearning` double(8,2) NOT NULL,
  `rewardPoint` double(8,2) NOT NULL,
  `mangoCoinEarn` double(8,2) NOT NULL,
  `referralFee` double(8,2) NOT NULL,
  `status` enum('active','deactive','Expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `planImage` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rejected_user_card`
--

CREATE TABLE `rejected_user_card` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(200) NOT NULL,
  `last_name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `contactNumber` varchar(200) NOT NULL,
  `cardNumber` varchar(200) DEFAULT NULL,
  `jdbCardNumber1` varchar(300) DEFAULT NULL,
  `jdbCardNumber2` varchar(300) DEFAULT NULL,
  `cardStatus` enum('unpaid','paid','pending','assigned','verified','blocked','rejected') NOT NULL,
  `jdbCardStatus1` enum('unpaid','paid','pending','assigned','verified','blocked','rejected') NOT NULL,
  `jdbCardStatus2` enum('unpaid','paid','pending','assigned','verified','blocked','rejected') NOT NULL,
  `selfie` varchar(191) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test`
--

CREATE TABLE `test` (
  `time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `jdbCardNumber` varchar(191) NOT NULL,
  `bp_user_id` varchar(191) NOT NULL,
  `acc_number` varchar(191) NOT NULL,
  `auth_stat` varchar(50) DEFAULT NULL,
  `dr_amount` decimal(10,2) UNSIGNED NOT NULL,
  `cr_amount` decimal(10,2) UNSIGNED NOT NULL,
  `end_bal` decimal(10,2) UNSIGNED NOT NULL,
  `trn_ref_number` varchar(191) NOT NULL,
  `trn_code` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `executed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maiden_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pep` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','active','deactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `countryCode` int(11) NOT NULL,
  `cardNumber` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbCardNumber1` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbCardNumber2` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cardStatus` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `jdbCardStatus1` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jdbCardStatus2` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL,
  `google2fa_enable` tinyint(1) NOT NULL DEFAULT 0,
  `google2fa_secret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google2fa_qr` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cardCount` int(11) NOT NULL DEFAULT 0,
  `appid` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_kyc_approved` enum('0','1') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `kycres` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_usd` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_btc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_eth` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address1` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `d_country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inspectionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `urnNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbAccountNo1` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbAccountNo2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_kyc_details` enum('0','1') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `vendor_id` int(11) UNSIGNED DEFAULT NULL,
  `img_sign` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_fee` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_applied` tinyint(3) UNSIGNED DEFAULT NULL,
  `is_doc_downloaded` tinyint(3) UNSIGNED DEFAULT NULL,
  `kyc_country` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `response_check` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_updates`
--

CREATE TABLE `users_updates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maiden_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pep` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','active','deactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `countryCode` int(11) NOT NULL,
  `cardNumber` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbCardNumber1` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbCardNumber2` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cardStatus` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `jdbCardStatus1` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `jdbCardStatus2` enum('unpaid','paid','pending','assigned','verified','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `google2fa_enable` tinyint(1) NOT NULL DEFAULT 0,
  `google2fa_secret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google2fa_qr` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cardCount` int(11) NOT NULL DEFAULT 0,
  `appid` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_kyc_approved` enum('0','1') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `kycres` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_usd` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_btc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance_eth` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address1` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `d_country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inspectionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `urnNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbAccountNo1` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jdbAccountNo2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_kyc_details` enum('0','1') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `vendor_id` int(11) UNSIGNED DEFAULT NULL,
  `img_sign` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_fee` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_finexus`
--

CREATE TABLE `user_finexus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nric_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `residential_address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_postalcode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `security_ans` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_sign` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `passport_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_finexus_updates`
--

CREATE TABLE `user_finexus_updates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nric_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sex` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `residential_address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_postalcode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailing_state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `security_ans` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_sign` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `passport_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_jdb`
--

CREATE TABLE `user_jdb` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cardnumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nationality` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `occupation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_employee` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_public_staff` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_student` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_general_customer` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `book` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_issued_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_date` date DEFAULT NULL,
  `book_exp_date` date DEFAULT NULL,
  `birth_place` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_district` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_province` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residing_place` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residing_district` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residing_province` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img_sign` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selfie` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_link_existing` tinyint(2) UNSIGNED DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_kyc_details`
--

CREATE TABLE `user_kyc_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cms`
--
ALTER TABLE `cms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_us`
--
ALTER TABLE `contact_us`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `loadcard`
--
ALTER TABLE `loadcard`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `password_securities`
--
ALTER TABLE `password_securities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`);

--
-- Indexes for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `permission_role_role_id_foreign` (`role_id`);

--
-- Indexes for table `plan`
--
ALTER TABLE `plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rejected_user_card`
--
ALTER TABLE `rejected_user_card`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_user_role_id_foreign` (`role_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `users_updates`
--
ALTER TABLE `users_updates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `user_finexus`
--
ALTER TABLE `user_finexus`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_finexus_updates`
--
ALTER TABLE `user_finexus_updates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_jdb`
--
ALTER TABLE `user_jdb`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_kyc_details`
--
ALTER TABLE `user_kyc_details`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cms`
--
ALTER TABLE `cms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contact_us`
--
ALTER TABLE `contact_us`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2435;

--
-- AUTO_INCREMENT for table `loadcard`
--
ALTER TABLE `loadcard`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=671;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `password_securities`
--
ALTER TABLE `password_securities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=371;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `plan`
--
ALTER TABLE `plan`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rejected_user_card`
--
ALTER TABLE `rejected_user_card`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2373;

--
-- AUTO_INCREMENT for table `users_updates`
--
ALTER TABLE `users_updates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_finexus`
--
ALTER TABLE `user_finexus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=754;

--
-- AUTO_INCREMENT for table `user_finexus_updates`
--
ALTER TABLE `user_finexus_updates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_jdb`
--
ALTER TABLE `user_jdb`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1206;

--
-- AUTO_INCREMENT for table `user_kyc_details`
--
ALTER TABLE `user_kyc_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1337;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
