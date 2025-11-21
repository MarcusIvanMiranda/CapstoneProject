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

    $input = json_decode(file_get_contents('php://input'), true);

    $catId = $input['cat_id'] ?? null;
    $text = trim($input['diagnostic_text'] ?? '');
    $logDate = $input['log_date'] ?? date('Y-m-d'); 

    if (!$catId || $text === '') {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Missing Cat ID or diagnostic text.']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO diagnostics (cat_id, diagnostic_text, log_date) VALUES (?, ?, ?)");
    $stmt->execute([$catId, $text, $logDate]);
    
    $id = $pdo->lastInsertId();
    $row = $pdo->query("SELECT id, diagnostic_text, log_date, created_at FROM diagnostics WHERE id={$id}")->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $row, 'message' => 'Diagnostic saved successfully.']);

} catch (Throwable $e) {
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>