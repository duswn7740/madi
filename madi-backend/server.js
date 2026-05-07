const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버 실행중: http://localhost:${PORT}`);
});
