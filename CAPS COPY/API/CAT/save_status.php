<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    http_response_code(405);
    exit();
}


$db_host = 'localhost'; 
$db_user = 'root'; 
$db_pass = ''; 
$db_name = 'vet_clinic'; 


$conn = null;
try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $json_data = file_get_contents("php://input");
    $data = json_decode($json_data, true);

    if (empty($data['cat_id']) || empty($data['status'])) {
        echo json_encode(['success' => false, 'message' => 'Missing cat_id or status.']);
        http_response_code(400);
        exit();
    }

    $cat_id = $data['cat_id'];
    $status = $data['status'];
    
    $sql = "UPDATE cat SET current_status = :status WHERE id = :cat_id";
    $stmt = $conn->prepare($sql);
    
    $stmt->bindParam(':status', $status, PDO::PARAM_STR);
    $stmt->bindParam(':cat_id', $cat_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Status updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update cat status.']);
    }

} catch (PDOException $e) {
    error_log("Database Error: " . $e->getMessage()); 
    echo json_encode(['success' => false, 'message' => 'Database connection or query failed.']);
    http_response_code(500);
} catch (Exception $e) {
    error_log("General Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
    http_response_code(500);
} finally {
    $conn = null;
}
?>