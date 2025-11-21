<?php
header('Content-Type: application/json');

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'vet_clinic';

const POSSIBLE_DISEASES = [
    'Cardiomyopathies' => [
        ['name' => 'Hypertrophic Cardiomyopathy (HCM)', 'range' => '>220 bpm'],
        ['name' => 'Dilated Cardiomyopathy (DCM)', 'range' => 'elevated heart rate'],
        ['name' => 'Restrictive Cardiomyopathy (RCM)', 'range' => 'often associated with tachycardia']
    ],
    'Arrhythmias (Abnormal Rhythms)' => [
        ['name' => 'Bradycardia', 'range' => '<140 bpm'],
        ['name' => 'Third-Degree Atrioventricular (AV) Block', 'range' => '40-65 bpm'],
        ['name' => 'Tachycardia', 'range' => '>220 bpm'],
        ['name' => 'Supraventricular Tachycardia (SVT)', 'range' => '150-380 bpm'],
        ['name' => 'Ventricular Tachycardia (VT)', 'range' => '>240 bpm'],
        ['name' => 'Sinus Arrhythmia', 'range' => '140-220 bpm']
    ],
    'Congenital Heart Defects' => [
        ['name' => 'Ventricular Septal Defect (VSD)', 'range' => 'high-end of the normal range or above'],
        ['name' => 'Patent Ductus Arteriosus (PDA)', 'range' => 'elevated']
    ]
];

function getMatchingDiseases(int $bpm, string $normalRange): string {
    $matchingDiseases = [];
    $normalRangeParts = explode('-', $normalRange);
    $normalMin = intval(trim($normalRangeParts[0] ?? 0));
    $normalMax = intval(trim($normalRangeParts[1] ?? 0));


    if ($bpm >= $normalMin && $bpm <= $normalMax) {
        return '';
    }

    foreach (POSSIBLE_DISEASES as $group => $diseases) {
        $groupMatches = [];
        foreach ($diseases as $disease) {
            $rangeText = $disease['range'];
            $rangeMatch = false;

            if (str_contains($rangeText, '<')) {
                $value = intval(preg_replace('/[^0-9]/', '', $rangeText));
                if ($bpm < $value) {
                    $rangeMatch = true;
                }
            } elseif (str_contains($rangeText, '>')) {
                $value = intval(preg_replace('/[^0-9]/', '', $rangeText));
                if ($bpm > $value) {
                    $rangeMatch = true;
                }
            } elseif (str_contains($rangeText, '-')) {
                $parts = explode('-', preg_replace('/[^0-9-]/', '', $rangeText));
                $min = intval(trim($parts[0]));
                $max = intval(trim($parts[1]));
                if ($bpm >= $min && $bpm <= $max) {
                    $rangeMatch = true;
                }
            } elseif (str_contains(strtolower($rangeText), 'elevated') || str_contains(strtolower($rangeText), 'tachycardia')) {

                if (!empty($normalMax) && $bpm > $normalMax) {
                    $rangeMatch = true;
                }
            } elseif (str_contains(strtolower($rangeText), 'normal')) {
                continue;
            }

            if ($rangeMatch) {
                $groupMatches[] = "{$disease['name']}: {$disease['range']}";
            }
        }

        if (count($groupMatches) > 0) {
            $matchingDiseases[] = "{$group}:\n" . implode("\n", $groupMatches);
        }
    }

    return implode("\n\n", $matchingDiseases);
}

try {
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $heartbeat   = intval($_POST['heartbeat'] ?? 0);
    $device_name = trim($_POST['device_name'] ?? '');

    if (empty($device_name) || $heartbeat <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Device name and heartbeat are required.']);
        exit;
    }


    $stmt = $pdo->prepare("SELECT id, normal_heartbeat, disease FROM cat WHERE device_name = ?");
    $stmt->execute([$device_name]);
    $cat = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cat) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Cat with this device name not found.']);
        exit;
    }
    $cat_id = $cat['id'];
    $normal_heartbeat = $cat['normal_heartbeat'] ?? '140-220';
    $cat_disease = $cat['disease'] ?? 'Normal';

    $possible_diseases_text = '';
    if (strtolower($cat_disease) === 'normal') {
        $possible_diseases_text = getMatchingDiseases($heartbeat, $normal_heartbeat);
    }
    
    $stmt = $pdo->prepare("INSERT INTO heartbeat_log (cat_id, heartbeat, possible_diseases) VALUES (?, ?, ?)");
    $stmt->execute([$cat_id, $heartbeat, $possible_diseases_text]);

    echo json_encode(['success' => true, 'message' => 'Heartbeat logged successfully.']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>