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

  $owner_id = isset($_GET['owner_id']) ? intval($_GET['owner_id']) : 0;
  $id       = isset($_GET['id']) ? intval($_GET['id']) : 0;

  // Single cat by id (include owner name)
  if ($id>0){
    $stmt=$pdo->prepare("SELECT c.*, o.name AS owner_name
                         FROM cat c
                         LEFT JOIN owner o ON o.id = c.owner_id
                         WHERE c.id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if(!$row){ http_response_code(404); echo json_encode(['success'=>false,'message'=>'Cat not found']); exit; }
    echo json_encode(['success'=>true,'data'=>$row]); exit;
  }

  // Cats by owner_id (include owner name)
  if ($owner_id>0){
    $stmt=$pdo->prepare("SELECT c.*, o.name AS owner_name
                         FROM cat c
                         LEFT JOIN owner o ON o.id = c.owner_id
                         WHERE c.owner_id=?
                         ORDER BY c.created_at DESC");
    $stmt->execute([$owner_id]);
    $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'data'=>$rows]); exit;
  }

  // All cats (include owner name)
  $stmt=$pdo->query("SELECT c.*, o.name AS owner_name
                     FROM cat c
                     LEFT JOIN owner o ON o.id = c.owner_id
                     ORDER BY c.created_at DESC");
  $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'data'=>$rows]);
}catch(Throwable $e){
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}