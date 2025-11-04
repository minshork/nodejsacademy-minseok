import express from 'express';
const app = express();

app.get('/who', (req, res) => {
    const { name, age } = req.query;
    const er = "고객";
    res.send(`안녕하세요 ${name || er}님 ${age} 반갑습니다`);
});

// http://localhost:3000/who?name=이순신&age=25
app.listen(3000, () => console.log("연결되었습니다"));