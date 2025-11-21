<?php
// CAPS/API/OWNER/reset_password.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle CORS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Security: Turn off display errors to prevent HTML output
ini_set('display_errors', 'Off');
error_reporting(E_ALL);

// Database constants
const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

function db(){
  static $pdo=null;
  if($pdo) return $pdo;
  
  try {
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION
    ]);
  } catch (PDOException $e) {
      error_log("DB Connection Error: " . $e->getMessage());
      sendResponse(false, 'Database connection failed.', [], 500);
  }
  return $pdo;
}

function sendResponse($success, $message, $data = [], $statusCode = 400) {
    if ($success) $statusCode = 200;
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

function getJsonData() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Invalid data received.', [], 400);
    }
    return $data;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method.', [], 405);
}

try {
    $data = getJsonData();
    $token = trim($data['token'] ?? '');
    $new_password = $data['new_password'] ?? '';

    if (empty($token) || empty($new_password)) {
        sendResponse(false, 'Missing token or new password.');
    }
    
    // Check password length
    if (strlen($new_password) < 6) {
        sendResponse(false, 'New password must be at least 6 characters long.');
    }

    $pdo = db();
    $current_time = date('Y-m-d H:i:s');
    
    // 1. Validate the token and check for expiry
    // NOTE: You need a `password_resets` table with `email`, `token`, and `expires_at` columns.
    $stmt = $pdo->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > ?");
    $stmt->execute([$token, $current_time]);
    $reset_row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reset_row) {
        sendResponse(false, 'Invalid or expired reset token. Please request a new one.', [], 401);
    }

    $email = $reset_row['email'];
    
    // 2. Hash the new password securely
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    
    // 3. Update the password and delete the token in a transaction
    $pdo->beginTransaction();

    $update_stmt = $pdo->prepare("UPDATE owner SET password = ? WHERE email = ?");
    $update_stmt->execute([$hashed_password, $email]);

    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    $pdo->commit();

    sendResponse(true, 'Password successfully updated. You can now log in with your new password.');

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Password Update API Error: " . $e->getMessage() . " on line " . $e->getLine());
    sendResponse(false, 'A server error occurred during password update.', [], 500);
}
?>