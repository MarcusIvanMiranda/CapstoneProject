<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

try{
  $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION
  ]);
  $id = intval($_POST['id'] ?? 0);
  if ($id<=0){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid ID']); exit; }

  $img = $pdo->prepare("SELECT image FROM owner WHERE id=?");
  $img->execute([$id]);
  $row = $img->fetch(PDO::FETCH_ASSOC);
  $pdo->prepare("DELETE FROM owner WHERE id=?")->execute([$id]);

  if ($row && !empty($row['image'])) {
    $abs = dirname(__DIR__,2).'/'.$row['image'];
    if (is_file($abs)) @unlink($abs);
  }

  echo json_encode(['success'=>true]);
}catch(Throwable $e){
  http_response_code(500); echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
