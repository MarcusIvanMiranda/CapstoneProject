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
  $notes = trim($_POST['notes'] ?? '');
  if ($notes===''){ http_response_code(400); echo json_encode(['success'=>false,'message'=>'Note text required']); exit; }
  $stmt = $pdo->prepare("INSERT INTO note (notes) VALUES (?)");
  $stmt->execute([$notes]);
  $id = $pdo->lastInsertId();
  $row = $pdo->query("SELECT id,notes,created_at FROM note WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'data'=>$row]);
}catch(Throwable $e){
  http_response_code(500); echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
