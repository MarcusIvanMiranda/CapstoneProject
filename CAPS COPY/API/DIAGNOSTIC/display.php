<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

try {
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $catId = $_GET['cat_id'] ?? null;

    if (!$catId) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Missing Cat ID in query.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, diagnostic_text, log_date, created_at FROM diagnostics WHERE cat_id = ? ORDER BY created_at DESC");
    $stmt->execute([$catId]);
    
    $diagnostics = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $diagnostics]);

} catch (Throwable $e) {
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>