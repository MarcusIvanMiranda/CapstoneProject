<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

function db(){
  static $pdo=null;
  if($pdo) return $pdo;
  $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION
  ]);
  return $pdo;
}
function save_image($fieldName='image'){
  if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) return null;
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($_FILES[$fieldName]['tmp_name']);
  $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
  if (!isset($allowed[$mime])) return null;
  $ext = $allowed[$mime];
  $dir = dirname(__DIR__,2).'/UPLOADS/owners';
  if(!is_dir($dir)) @mkdir($dir,0777,true);
  $name = time().'_'.bin2hex(random_bytes(4)).'.'.$ext;
  move_uploaded_file($_FILES[$fieldName]['tmp_name'], $dir.'/'.$name);
  return 'UPLOADS/owners/'.$name;
}

try{
  $id = intval($_POST['id'] ?? 0);
  if ($id<=0){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid ID']); exit; }

  $old = db()->prepare("SELECT image FROM owner WHERE id=?");
  $old->execute([$id]);
  $oldRow = $old->fetch(PDO::FETCH_ASSOC);
  if(!$oldRow){ http_response_code(404); echo json_encode(['success'=>false,'message'=>'Owner not found']); exit; }

  $name = trim($_POST['name'] ?? '');
  $phone = trim($_POST['phone'] ?? '');
  $email = trim($_POST['email'] ?? '');
  $address = trim($_POST['address'] ?? '');
  $password = $_POST['password'] ?? '';

  $imagePath = save_image('image');
  if ($imagePath && !empty($oldRow['image'])) {
    $abs = dirname(__DIR__,2).'/'.$oldRow['image'];
    if (is_file($abs)) @unlink($abs);
  }

  $fields = [];
  $vals   = [];
  if($name!==''){ $fields[]='name=?'; $vals[]=$name; }
  if($phone!==''){ $fields[]='phone=?'; $vals[]=$phone; }
  if($email!==''){ $fields[]='email=?'; $vals[]=$email; }
  if($address!==''){ $fields[]='address=?'; $vals[]=$address; }
  if($password!==''){ $fields[]='password=?'; $vals[]=password_hash($password,PASSWORD_BCRYPT); }
  if($imagePath){ $fields[]='image=?'; $vals[]=$imagePath; }

  if(empty($fields)){
    echo json_encode(['success'=>true,'message'=>'Nothing to update']); exit;
  }

  $vals[]=$id;
  $sql = "UPDATE owner SET ".implode(',',$fields)." WHERE id=?";
  db()->prepare($sql)->execute($vals);

  $row = db()->query("SELECT id,name,phone,email,address,image,created_at FROM owner WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'data'=>$row]);
}catch(Throwable $e){
  http_response_code(500); echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
