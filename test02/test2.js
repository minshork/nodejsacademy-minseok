import express from 'express';
const app = express();

// 이방식은 검색방식에 이용됨
// ex를 검색했을 때 어떤결과가 나오도록
app.get('/mul/:a', (req, res) => {
    const a = req.params.a.slice(0, 2);
    const b = req.params.a.slice(-2);
    const c = Number(a) * Number(b);
    res.send(`곱하기 값 1020 => 10 * 20 == ${c}`);
});

// http://localhost:3000/mul/1020
app.listen(3000, () => console.log("3000port 작동중"));