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

  // RENAMED from time_unit to filter_type to match RecordScreen.tsx
  $filter_type = isset($_GET['filter_type']) ? strtolower(trim($_GET['filter_type'])) : 'all'; 
  
  // NEW parameter for status filtering
  $status_type = isset($_GET['status_type']) ? strtolower(trim($_GET['status_type'])) : 'all'; 

  if ($cat_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'cat_id is required']);
    exit;
  }

  // 1. Fetch the cat's normal heartbeat range
  $stmt_cat = $pdo->prepare("SELECT normal_heartbeat FROM cats WHERE id = ?");
  $stmt_cat->execute([$cat_id]);
  $cat_data = $stmt_cat->fetch(PDO::FETCH_ASSOC);

  $normal_heartbeat = $cat_data ? $cat_data['normal_heartbeat'] : null;
  list($min_bpm, $max_bpm) = [null, null];
  if ($normal_heartbeat && strpos($normal_heartbeat, '-') !== false) {
      list($min_bpm_str, $max_bpm_str) = explode('-', $normal_heartbeat);
      $min_bpm = intval(trim($min_bpm_str));
      $max_bpm = intval(trim($max_bpm_str));
  }

  $where_clause = " WHERE cat_id = ? ";
  $params = [$cat_id];

  // 2. Time-based filtering (Only apply if NOT 'all' and start_date is provided)
  if ($filter_type !== 'all' && !empty($start_date)) {

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Must be YYYY-MM-DD.']);
        exit;
    }
    
    switch ($filter_type) { // Using filter_type instead of time_unit
      case 'week':
        // Find the Monday of the selected week
        $stmt_week_start = $pdo->prepare("SELECT DATE_SUB(?, INTERVAL (DAYOFWEEK(?) - 2 + 7) % 7 DAY) AS week_start");
        $stmt_week_start->execute([$start_date, $start_date]);
        $week_start = $stmt_week_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 WEEK) ";
        $params[] = $week_start;
        $params[] = $week_start;
        break;

      case 'month':
        // Find the first day of the selected month
        $stmt_month_start = $pdo->prepare("SELECT DATE_FORMAT(?, '%Y-%m-01')");
        $stmt_month_start->execute([$start_date]);
        $month_start = $stmt_month_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 MONTH) ";
        $params[] = $month_start;
        $params[] = $month_start;
        break;

      case 'year':
        // Find the first day of the selected year
        $stmt_year_start = $pdo->prepare("SELECT DATE_FORMAT(?, '%Y-01-01')");
        $stmt_year_start->execute([$start_date]);
        $year_start = $stmt_year_start->fetchColumn();

        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 YEAR) ";
        $params[] = $year_start;
        $params[] = $year_start;
        break;

      case 'day':
      default:
        // Filter for the entire selected day
        $where_clause .= " AND recorded_at >= ? AND recorded_at < DATE_ADD(?, INTERVAL 1 DAY) ";
        $params[] = $start_date;
        $params[] = $start_date;
        break;
    }
  }
  
  // 3. Status-based filtering (Only apply if cat's range is available and status is not 'all')
  if ($status_type !== 'all' && $min_bpm !== null && $max_bpm !== null) {
      $status_condition = '';
      switch ($status_type) {
          case 'normal':
              $status_condition = " AND heartbeat >= ? AND heartbeat <= ? ";
              $params[] = $min_bpm;
              $params[] = $max_bpm;
              break;
          case 'abnormal':
              $status_condition = " AND (heartbeat < ? OR heartbeat > ?) ";
              $params[] = $min_bpm;
              $params[] = $max_bpm;
              break;
          case 'low':
              $status_condition = " AND heartbeat < ? ";
              $params[] = $min_bpm;
              break;
          case 'high':
              $status_condition = " AND heartbeat > ? ";
              $params[] = $max_bpm;
              break;
      }
      $where_clause .= $status_condition;
  }
  
  // Final SQL query
  $sql = "SELECT * FROM heartbeat_log $where_clause ORDER BY recorded_at ASC";
  
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  if (!$rows) {
    echo json_encode(['success' => false, 'message' => 'No heartbeat records found for this cat in the selected filters.']);
    exit;
  }

  echo json_encode(['success' => true, 'data' => $rows]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>