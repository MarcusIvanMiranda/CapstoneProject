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
  $notes = $pdo->query("SELECT id,notes,created_at FROM note ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'data'=>$notes]);
}catch(Throwable $e){
  http_response_code(500); echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
