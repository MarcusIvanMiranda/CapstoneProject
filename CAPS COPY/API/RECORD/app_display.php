<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Renamed from 'time_unit' to 'filter_type' to match frontend
    $cat_id = isset($_GET['cat_id']) ? intval($_GET['cat_id']) : 0;
    $start_date = isset($_GET['start_date']) ? trim($_GET['start_date']) : null;
    $filter_type = isset($_GET['filter_type']) ? strtolower(trim($_GET['filter_type'])) : 'all'; // Default to 'all'

    if ($cat_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'cat_id is required']);
        exit;
    }

    $where_clause = " WHERE cat_id = ? ";
    $params = [$cat_id];

    // Only apply date filtering if type is not 'all' and start_date is provided
    if ($filter_type !== 'all' && !empty($start_date)) {
        
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid date format. Must be YYYY-MM-DD.']);
            exit;
        }
        
        $start_interval = null;
        $end_interval = null;

        // Use precise date boundaries based on filter type
        switch ($filter_type) {
            case 'week':
                // Get the date of the previous Monday (start of the ISO week)
                $stmt_week_start = $pdo->prepare("SELECT DATE_FORMAT(DATE_SUB(STR_TO_DATE(?, '%Y-%m-%d'), INTERVAL (DAYOFWEEK(STR_TO_DATE(?, '%Y-%m-%d')) - 2 + 7) % 7 DAY), '%Y-%m-%d')");
                $stmt_week_start->execute([$start_date, $start_date]);
                $calculated_start_date = $stmt_week_start->fetchColumn();
                $end_interval = '1 WEEK';
                break;

            case 'month':
                // Get the first day of the month
                $stmt_month_start = $pdo->prepare("SELECT DATE_FORMAT(STR_TO_DATE(?, '%Y-%m-%d'), '%Y-%m-01')");
                $stmt_month_start->execute([$start_date]);
                $calculated_start_date = $stmt_month_start->fetchColumn();
                $end_interval = '1 MONTH';
                break;

            case 'year':
                // Get the first day of the year
                $stmt_year_start = $pdo->prepare("SELECT DATE_FORMAT(STR_TO_DATE(?, '%Y-%m-%d'), '%Y-01-01')");
                $stmt_year_start->execute([$start_date]);
                $calculated_start_date = $stmt_year_start->fetchColumn();
                $end_interval = '1 YEAR';
                break;

            case 'day':
            default:
                // For 'day', the start date is the date itself
                $calculated_start_date = $start_date;
                $end_interval = '1 DAY';
                break;
        }

        if ($calculated_start_date && $end_interval) {
            // Ensure comparison starts at 00:00:00 on the calculated start date
            $where_clause .= " AND recorded_at >= CONCAT(?, ' 00:00:00') ";
            $params[] = $calculated_start_date;
            
            // Ensure comparison ends just before the next period starts
            $where_clause .= " AND recorded_at < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL $end_interval) ";
            $params[] = $calculated_start_date;
        }
    }


    $sql = "SELECT * FROM heartbeat_log $where_clause ORDER BY recorded_at ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        // Only return success=false if filtering was applied and found nothing, 
        // OR if a cat ID was given and there are no records at all.
        echo json_encode(['success' => false, 'message' => 'No heartbeat records found for this dog in the selected time range.']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => $rows]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
?>