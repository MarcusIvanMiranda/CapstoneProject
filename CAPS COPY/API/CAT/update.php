<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

function db(){
  static $pdo=null; if($pdo) return $pdo;
  $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION
  ]);
  return $pdo;
}
function save_image($field='image'){
  if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) return null;
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($_FILES[$field]['tmp_name']);
  $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
  if (!isset($allowed[$mime])) return null;
  $ext = $allowed[$mime];
  $dir = dirname(__DIR__,2).'/UPLOADS/owners'; // or .../UPLOADS/cats
  if(!is_dir($dir)) @mkdir($dir,0777,true);
  $name = time().'_'.bin2hex(random_bytes(4)).'.'.$ext;
  move_uploaded_file($_FILES[$field]['tmp_name'], $dir.'/'.$name);
  return 'UPLOADS/owners/'.$name;
}

try{
  $id                 = intval($_POST['id'] ?? 0);
  $name               = trim($_POST['name'] ?? '');
  $breed              = trim($_POST['breed'] ?? '');
  $birthdate          = trim($_POST['birthdate'] ?? '');
  $disease            = trim($_POST['disease'] ?? '');
  $device             = trim($_POST['device_name'] ?? '');
  $normal_heartbeat   = trim($_POST['normal_heartbeat'] ?? '');

  if ($id<=0 || $name==='' || $breed==='' || $birthdate===''){
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'id, name, breed, birthdate are required']); exit;
  }

  $updates = [
    'name' => $name, 'breed' => $breed, 'birthdate' => $birthdate,
    'disease' => $disease, 'device_name' => $device,
    'normal_heartbeat' => $normal_heartbeat
  ];
  $params = [];
  $set_clause = [];

  foreach($updates as $key => $value){
    $set_clause[] = "`$key` = ?";
    $params[] = $value;
  }

  $imagePath = save_image('image');
  if($imagePath){
    $set_clause[] = "`image` = ?";
    $params[] = $imagePath;
  }

  $params[] = $id;

  $sql = "UPDATE `cat` SET ".implode(', ', $set_clause)." WHERE id = ?";
  $stmt = db()->prepare($sql);
  $stmt->execute($params);

  $row = db()->query("SELECT * FROM cat WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'data'=>$row]);
}catch(Throwable $e){
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
?>