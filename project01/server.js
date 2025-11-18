import express from 'express'
import 'dotenv/config'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'


const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// post방식 데이터를 읽어주는
app.use(express.urlencoded({ extended : true}))
// 정적파일( html, css등을 허락)
app.use(express.static(__dirname))


const pool = mysql.createPool({
    host : process.env.DB_HOST,
    port : process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME,
})
const TABLE = process.env.TABLE

try{
    await pool.query('select 1')
    console.log('db 연결 성공')
}catch (e) {
    console.error('db연결 실패 : ', e.message)
}

app.get('/', (req, res)=>{
    res.sendFile( path.join( __dirname, 'index.html'))
})

// 조회작업
app.get('/list', async (req, res)=>{
    try{
       const [rows] = await pool.query(
        `select id, author, title, content,
         date_format( CONVERT_TZ(created_at, '+00:00', '+09:00'),
         '%Y-%m-%d %H:%i') as created_at
        from \`${TABLE}\` order by id desc `
       )

       const listHtml = rows.length === 0 ? 
            `<li>아직 등록된 메모가 없습니다</li>`
       : rows.map( (item) =>
            `<li>
                <div class="post-main">
                    <strong class="post-title">${item.title}</strong>
                    <span class="author">${item.author}</span>
                    <span class="date">${item.created_at}</span>
                </div>
                <p class="message">${item.content} </p>
                <div class="post-actions">
                    <form action="/edit" method="get" target="_top" >
                        <input type="hidden" name="id" value="${item.id}" />
                        <button class="btn edtbtn" type="submit">수정</button>
                    </form>
                    <form action="/delete" method="post" target="_top" >
                        <input type="password" name="password" placeholder="비밀번호"
                           class="password-input" required/>
                        <input type="hidden" name="id" value="${item.id}" />
                        <button class="btn delbtn" type="submit">삭제</button>
                    </form>
                </div>
            </li>`
       ).join('')

        res.send(`
                <!doctype html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <link rel="stylesheet" href="./style.css" />
                    </head>
                    <body>
                        <ul class="post-list">
                            ${listHtml}
                        </ul>
                    </body>
                </html> 
            `)    
    }catch (e){
       console.error('목록 조회 에러' , e)
       res.status(500).send('목록을 조회하는중 오류가 발생하였습니다') 
    }
})

// 추가작업
app.post("/add", async (req, res) =>{
    const { author, password, title, content } = req.body
    if(!author || !password || !title || !content ){
        return res.redirect('/?msg=' + encodeURIComponent('작성자, 비밀번호, 제목, 내용를 모두 입력하세요'))
    }

    try{
        await pool.execute(
            `insert into \`${TABLE}\` (author, password, title, content) 
            values (?, ?, ?, ?)`, [author, password, title, content]
        )
        res.redirect('/?msg=' + encodeURIComponent('메모가 등록되었습니다'))
    }catch (e) {
        console.error('등록 에러', e)
        res.redirect('/?msg=' + encodeURIComponent('메모등록중 오류가 발생했습니다'))
    }
})

//수정화면 작업
app.get("/edit", async (req, res) =>{
    const id = Number( req.query.id || 0 )
    const {msg} = req.query
    if(!id) {
        return res.redirect('/?msg=' + encodeURIComponent('잘못된 요청'))
    }

    try{
        const [rows] = await pool.query(
        ` select id, author, title, content,
         date_format( CONVERT_TZ(created_at, '+00:00', '+09:00'),
         '%Y-%m-%d %H:%i') as created_at
        from \`${TABLE}\` where id = ? `, [id]
        )

        if( rows.length === 0 ){
            return res.redirect('/?msg=' + encodeURIComponent('해당하는 메모를 찾을수 없스브니다 '))
        }
        const note = rows[0]
        res.send(`
                <!doctype html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <link rel="stylesheet" href="./style.css" />
                    </head>
                    <body>
                        <header class="container">
                            <h1>메모 수정</h1>
                          ${msg ? `<div class="notice">${msg}</div>` : ''}  
                        </header>
                        <main>
                            <section class="card">
                                <p>작성자 : ${note.author} / 작성일 : ${note.created_at} </p>
                                <form action="/edit" method="post" class="form-grid">
                                    <input type="hidden" name="id" value="${note.id}" />
                                    <label class="full">
                                        <span>제목*</span>
                                        <input name="title" value="${note.title}" required />
                                    </label>
                                    <label class="full">
                                        <span>내용*</span>
                                        <textarea name="content" rows=4 required >${note.content}</textarea>
                                    </label>
                                    <label class="full">
                                        <span>비밀번호*</span>
                                        <input type="password" name="password"  required />
                                    </label>
                                    <div class="full right">
                                        <a href="/" class="btn canclebtn">취소</a>
                                        <button type="submit">저장</button>
                                    </div>                                    
                                </form>
                            </section>
                        </main>
                    </body>
                </html>
            `)
    }catch (e) {
        console.error('수정 화면 에러', e)
        res.redirect('/?msg=' + encodeURIComponent('수정화면 조회중 에러 발생'))
    }
})

// 수정화면의 저장
app.post("/edit", async (req, res) =>{
    const id = Number( req.body.id || 0)
    const { title, content, password} = req.body
    if(!id || !title || !content || !password) {
        return res.redirect('/?msg=' + encodeURIComponent("잘못된 수정요청 입니다"))
    }
    try{
        const [rows] = await pool.query(`
                select id, password from \`${TABLE}\` where id = ?`, [id])
        if(rows.length === 0){
            return res.redirect('/?msg=' + encodeURIComponent('해당 메모를 찾을수 없습니다'))
        }

        const note = rows[0]
        if( note.password !== password ){
            return res.redirect('/?msg=' + encodeURIComponent('비밀번호가 일치하지 않습니다'))
        }
        await pool.execute(`
                update \`${TABLE}\` set title=?, content = ? where id = ?`,
                [title, content, id]
            )
            res.redirect('/?msg='+encodeURIComponent('메모 수정 완료'))
    }catch (e) {
        console.error( "메모수정에러", e)
         res.redirect('/?msg='+encodeURIComponent('메모 수정 에러'))
    }

})

const PORT = process.env.PORT || 3000
app.listen( PORT, ()=>{ 
    console.log(`서버 실행 성공, http://localhost:${PORT}`)
})