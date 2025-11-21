<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$terms = <<<EOT
By using this application, you agree to the following Terms and Conditions:

1) Your data may be stored securely in our system.
2) You must provide accurate information when registering.
3) We are not liable for data loss caused by external factors.
4) You consent to the use of your data for veterinary monitoring.

Version: 2025-09-01
EOT;

echo json_encode([
  'success' => true,
  'version' => '2025-09-01',
  'text' => $terms,
]);
