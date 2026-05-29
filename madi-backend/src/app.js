const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/users', require('./routes/users'));

app.get('/delete-account', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>마디 - 계정 삭제</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 480px; margin: 60px auto; padding: 0 24px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #555; line-height: 1.6; }
    ol { padding-left: 20px; line-height: 2; }
    .warning { background: #fff3cd; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #856404; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>계정 삭제 방법</h1>
  <p>마디 앱에서 아래 절차에 따라 계정을 삭제할 수 있습니다.</p>
  <ol>
    <li>앱을 실행한 후 하단 <strong>설정</strong> 탭으로 이동합니다.</li>
    <li>하단의 <strong>회원탈퇴</strong> 버튼을 누릅니다.</li>
    <li>확인 메시지에서 <strong>탈퇴</strong>를 선택합니다.</li>
  </ol>
  <div class="warning">
    ⚠️ 탈퇴 시 모든 연습 기록과 계정 정보가 즉시 삭제되며 복구할 수 없습니다.
  </div>
</body>
</html>`);
});

app.use(auth);
app.use('/api/practices', require('./routes/practices'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/packs', require('./routes/packs'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/ads', require('./routes/ads'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류' });
});

module.exports = app;
