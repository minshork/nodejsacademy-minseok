import express from "express";
import path from 'path';
import { fileURLToPath } from "url";

const app = express();

// 파일 가져오고싶을 때 쓰는 경로설정
const __filename = fileURLToPath(import.meta.url);
// C:\node\test03\server.js
const __dirname = path.dirname(__filename);
// C:\node\test03
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log("3000port 접속 완료"));

