<?php
// request_password_reset.php

// 1. Set all headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 2. Handle CORS preflight request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit; 
}

// 3. Turn off display errors to prevent HTML output from PHP warnings
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
      // Log connection error and send a generic 500 response
      error_log("DB Connection Error: " . $e->getMessage());
      sendResponse(false, 'Database connection failed.', [], 500);
  }
  return $pdo;
}

// Helper function for standardized response
function sendResponse($success, $message, $data = [], $statusCode = 400) {
    if ($success) $statusCode = 200;
    http_response_code($statusCode);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

// Helper function to get JSON data from the request body
function getJsonData() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // Log invalid JSON for debugging
        error_log("Invalid JSON received: " . $json);
        sendResponse(false, 'Invalid data received.', [], 400);
    }
    return $data;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method.', [], 405);
}

try {
    $data = getJsonData();
    $email = trim($data['email'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, 'Valid email is required.', [], 400);
    }

    $pdo = db();

    // Check if the user exists
    $stmt = $pdo->prepare("SELECT id FROM owner WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() === 0) {
        sendResponse(true, 'If the email address exists in our system, a password reset link has been sent to your inbox.');
    }

    // Generate a token (Expires in 1 hour)
    $token = bin2hex(random_bytes(32)); 
    $expiry_time = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Clear existing tokens and insert the new one
    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
    $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expiry_time]);
    $pdo->commit();

    // Email sending placeholder
    $reset_url = "http://{$_SERVER['HTTP_HOST']}/password_reset?token=" . $token; 
    error_log("Password Reset Link for $email: $reset_url"); 

    sendResponse(true, 'If the email address exists in our system, a password reset link has been sent to your inbox.');

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Log the detailed error on the server side
    error_log("Password Reset API Error: " . $e->getMessage() . " on line " . $e->getLine());
    sendResponse(false, 'A server error occurred during the reset process.', [], 500);
}
?>