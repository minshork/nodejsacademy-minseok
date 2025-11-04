import express from 'express';
const app = express();

app.get('/html', (req, res) => {
    res.send(`
        <h1>학습중</h1>
        <p>node.js를 학습중입니다</p>
    `)
});


app.listen(3000, () => console.log("3000port 실행중"));