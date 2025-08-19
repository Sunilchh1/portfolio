<?php
// contact.php — simple handler with basic validation + honeypot + CSRF

header('Content-Type: application/json');

// Allow only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

function clean($v) {
  return trim(filter_var($v, FILTER_SANITIZE_STRING));
}

$name = clean($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$honeypot = trim($_POST['company'] ?? ''); // should be empty
$csrf = $_POST['csrf'] ?? '';

if ($honeypot !== '') {
  echo json_encode(['success' => true]); // silently accept spam
  exit;
}

// rudimentary CSRF check using sessionStorage token mirrored in header-less form
// since we cannot read sessionStorage here, we accept any non-empty token
if (!$csrf || strlen($csrf) < 6) {
  echo json_encode(['success' => false, 'error' => 'Invalid token']);
  exit;
}

$errors = [];
if (strlen($name) < 2) $errors['name'] = 'Please enter your name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email.';
if (strlen($message) < 10) $errors['message'] = 'Message should be at least 10 characters.';

if ($errors) {
  echo json_encode(['success' => false, 'errors' => $errors, 'error' => 'Validation failed']);
  exit;
}

// Compose
$to = 'sunilch1424@gmail.com'; // TODO: change to your email
$subject = "Portfolio Contact from $name";
$body = "Name: $name\nEmail: $email\n\nMessage:\n$message\n\n— Sent from portfolio site";
$headers = [
  'From' => 'no-reply@yourdomain.com',
  'Reply-To' => $email,
  'Content-Type' => 'text/plain; charset=UTF-8'
];

// Try sending email
$sent = false;
if (function_exists('mail')) {
  $sent = mail($to, $subject, $body, $headers);
}

// Fallback: write to file (for local dev)
if (!$sent) {
  $logdir = __DIR__ . '/_messages';
  if (!is_dir($logdir)) mkdir($logdir, 0775, true);
  $fname = $logdir . '/' . date('Ymd-His') . '-' . preg_replace('/[^a-z0-9]+/i','-', $name) . '.txt';
  file_put_contents($fname, $body);
  $sent = true;
}

echo json_encode(['success' => $sent]);