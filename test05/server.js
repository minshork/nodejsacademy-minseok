import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('.'));
// public == . 둘다 default 값으로 가능함

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/welcome', (req, res) => {
    const { name } = req.query;
    res.send(`<h1>안녕하세요, ${name}님 정말 반갑습니다</h1>`);
});

app.listen(3000, () => console.log("연결 성공했습니다."));

