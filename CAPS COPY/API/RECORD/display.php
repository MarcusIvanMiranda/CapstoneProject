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

  $cat_id = isset($_GET['cat_id']) ? intval($_GET['cat_id']) : 0;
  $start_date = isset($_GET['start_date']) ? trim($_GET['start_date']) : null;
  $time_unit = isset($_GET['time_unit']) ? strtolower(trim($_GET['time_unit'])) : 'day';

  if ($cat_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'cat_id is required']);
    exit;
  }

 
  $where_clause = " WHERE cat_id = ? ";
  $params = [$cat_id];

  if (!empty($start_date)) {

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Must be YYYY-MM-DD.']);
        exit;
    }
    
    $end_date = null;
    $start_datetime = $start_date . ' 00:00:00';
    
    switch ($time_unit) {
      case 'week':

        $stmt_week_start = $pdo->prepare("SELECT DATE_SUB(?, INTERVAL (DAYOFWEEK(?) - 2 + 7) % 7 DAY) AS week_start");
        $stmt_week_start->execute([$start_date, $start_date]);
        $week_start = $stmt_week_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 WEEK) ";
        $params[] = $week_start;
        $params[] = $week_start;
        break;

      case 'month':

        $stmt_month_start = $pdo->prepare("SELECT DATE_FORMAT(?, '%Y-%m-01')");
        $stmt_month_start->execute([$start_date]);
        $month_start = $stmt_month_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 MONTH) ";
        $params[] = $month_start;
        $params[] = $month_start;
        break;

      case 'year':

        $stmt_year_start = $pdo->prepare("SELECT DATE_FORMAT(?, '%Y-01-01')");
        $stmt_year_start->execute([$start_date]);
        $year_start = $stmt_year_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 YEAR) ";
        $params[] = $year_start;
        $params[] = $year_start;
        break;

      case 'day':
      default:

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 DAY) ";
        $params[] = $start_date;
        $params[] = $start_date;
        break;
    }
  }


  $sql = "SELECT * FROM heartbeat_log $where_clause ORDER BY recorded_at ASC";
  
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  if (!$rows) {
    echo json_encode(['success' => false, 'message' => 'No heartbeat records found for this cat in the selected time range.']);
    exit;
  }

  echo json_encode(['success' => true, 'data' => $rows]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>