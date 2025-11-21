<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

try {
  $pdo = new PDO(
    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );

  $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
  $q  = trim($_GET['q'] ?? '');

  if ($id > 0) {
    $stmt = $pdo->prepare("SELECT o.id,o.name,o.phone,o.email,o.address,o.image,o.created_at,
                                   (SELECT COUNT(*) FROM cat c WHERE c.owner_id=o.id) AS cat_count
                            FROM owner o WHERE o.id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      http_response_code(404);
      echo json_encode(['success'=>false,'message'=>'Owner not found']); exit;
    }
    echo json_encode(['success'=>true,'data'=>$row]); exit;
  }

  if ($q !== '') {
    $stmt = $pdo->prepare("SELECT o.id,o.name,o.phone,o.email,o.address,o.image,o.created_at,
                                   (SELECT COUNT(*) FROM cat c WHERE c.owner_id=o.id) AS cat_count
                            FROM owner o
                            WHERE o.name LIKE :q OR o.email LIKE :q
                            ORDER BY o.created_at DESC");
    $stmt->execute([':q' => "%{$q}%"]);
  } else {
    $stmt = $pdo->query("SELECT o.id,o.name,o.phone,o.email,o.address,o.image,o.created_at,
                                (SELECT COUNT(*) FROM cat c WHERE c.owner_id=o.id) AS cat_count
                         FROM owner o
                         ORDER BY o.created_at DESC");
  }

  $owners = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $ownersTotal = $pdo->query("SELECT COUNT(*) FROM owner")->fetchColumn();
  $catsTotal   = $pdo->query("SELECT COUNT(*) FROM cat")->fetchColumn();

  echo json_encode(['success'=>true,'count'=>$ownersTotal,'cats_total'=>$catsTotal,'data'=>$owners]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
