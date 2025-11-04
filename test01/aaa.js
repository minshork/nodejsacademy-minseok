import express from 'express';
const app = express();

app.get('/home', (req, res) =>{
    // req == request 요청을 뜻하는 변수 이름
    // res == reponse 응답을 뜻하는 변수 이름

    res.send(`
        <h1>방명록</h1>
        <p>여기는 예제입니다</p>
    `);
});

// app.listen ==> 위 코드를 모두 실행하는 것
app.listen(3000, () => {
    console.log("3000port 실행중");
});