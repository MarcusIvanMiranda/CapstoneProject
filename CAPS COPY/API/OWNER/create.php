<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

function db() {
  static $pdo = null;
  if ($pdo) return $pdo;
  $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  ]);
  return $pdo;
}

function save_image($fieldName = 'image') {
  if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) return null;

  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($_FILES[$fieldName]['tmp_name']);
  $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
  if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Invalid image type. Use JPG/PNG/WEBP.']);
    exit;
  }

  $ext = $allowed[$mime];
  $dir = dirname(__DIR__,2) . DIRECTORY_SEPARATOR . 'UPLOADS' . DIRECTORY_SEPARATOR . 'owners';
  if (!is_dir($dir)) { @mkdir($dir, 0777, true); }
  $name = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
  $dest = $dir . DIRECTORY_SEPARATOR . $name;
  if (!move_uploaded_file($_FILES[$fieldName]['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Failed to save image.']);
    exit;
  }
  return 'UPLOADS/owners/' . $name;
}

try {
  $name = trim($_POST['name'] ?? '');
  $phone = trim($_POST['phone'] ?? '');
  $email = trim($_POST['email'] ?? '');
  $address = trim($_POST['address'] ?? '');
  $password = $_POST['password'] ?? '';

  if ($name === '' || $phone === '' || $email === '' || $address === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'All fields are required.']);
    exit;
  }

  $hash = password_hash($password, PASSWORD_BCRYPT);
  $imagePath = save_image('image');

  $stmt = db()->prepare("INSERT INTO owner (name, phone, email, address, password, image) VALUES (?,?,?,?,?,?)");
  $stmt->execute([$name, $phone, $email, $address, $hash, $imagePath]);

  $id = db()->lastInsertId();
  $row = db()->query("SELECT id,name,phone,email,address,image,created_at FROM owner WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);

  echo json_encode(['success'=>true,'data'=>$row]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
