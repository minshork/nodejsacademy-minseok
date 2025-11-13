import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/welcome', (req, res) => {
    const { name, age } = req.query;
    const userName = name || '고객';
    const userAge = Number(age) || 0;

    let message = '';
    if(userAge >= 18){
        message = '성년이시네요';
    }
    else if(userAge == 0){
        message = '나이 입력 하세요';
    }
    else{
        message = '미성년이십니다';
    };

    res.send(`
        <h1>안녕하세요 ${userName}</h1>
        <h2>당신의 나이는 ${userAge}살이군요</h2>
        <h3>${message}</h3>
        <a href='/'>다시 입력하기</a>
    `);
});

app.listen(3000, () => console.log('연결성공'));