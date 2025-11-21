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
    $date = $_GET['date'] ?? null;
    $range = $_GET['range'] ?? 'day';

    if (!$catId || !$date) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Missing Cat ID or date in query.']);
        exit;
    }
    
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Expected YYYY-MM-DD.']);
        exit;
    }

    $sql = "SELECT heartbeat, recorded_at, possible_diseases FROM heartbeat_log WHERE cat_id = ? AND ";
    $params = [$catId];

    switch (strtolower($range)) {
        case 'day':
            $sql .= "DATE(recorded_at) = ?";
            $params[] = $date;
            break;
        case 'week':
            $sql .= "YEARWEEK(recorded_at, 1) = YEARWEEK(?, 1)";
            $params[] = $date;
            break;
        case 'month':
            $sql .= "YEAR(recorded_at) = YEAR(?) AND MONTH(recorded_at) = MONTH(?)";
            $params[] = $date;
            $params[] = $date;
            break;
        case 'year':
            $sql .= "YEAR(recorded_at) = YEAR(?)";
            $params[] = $date;
            break;
        default:
            http_response_code(400); 
            echo json_encode(['success' => false, 'message' => 'Invalid range parameter.']);
            exit;
    }
    
    $sql .= " ORDER BY recorded_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $heartbeat_logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $heartbeat_logs]);

} catch (Throwable $e) {
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>