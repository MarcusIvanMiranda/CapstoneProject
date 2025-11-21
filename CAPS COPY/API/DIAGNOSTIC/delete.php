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

    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Missing Diagnostic ID in query for deletion.']);
        exit;
    }

    $sql = "DELETE FROM diagnostics WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => "Diagnostic ID $id deleted successfully."]);
    } else {
        echo json_encode(['success' => false, 'message' => "Diagnostic ID $id not found."]);
    }

} catch (Throwable $e) {
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>