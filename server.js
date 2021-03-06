'use strict'
const express = require('express');
const app = express();
const cors = require('cors');

const superagent = require('superagent');
const override = require('method-override');
require('dotenv').config();
const pg = require('pg');
app.use(override('_method'));
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });
const PORT = process.env.PORT;

app.use(cors());
app.set('view engine', 'ejs')
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// app.get('/',(req,res)=>{
//     res.render('pages/index');
// });
app.post('/new', addBookToDB);
app.get('/', getAllBooks);
app.post('/edit', edaitSelected);
app.get('/books/:book_id', getSpecificBook);
app.post('/books/:id', edit); 
app.delete('/books/:id', deleteBook); 
app.put('/books/:id', handleUpdate);



app.get('/error', (req, res) => {
    res.render('pages/error');
});

app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
});
app.post('/searches', handelSearches);


app.get('*', (req, res) => {
    res.render('pages/error');

});

function edit(req, res){
    let id = req.params.id;
    let sqlQuery = `SELECT * FROM books WHERE id = ${id}`;

    client.query(sqlQuery).then(data => {
       
        res.render('pages/books/'+id);
    }).catch(error =>{
        console.log(error); 
    });
}
function deleteBook(req, res){
    let id = req.params.id;
 
    let deleteQuery = 'DELETE FROM books WHERE id=$1';
    let safevalue = [id]; 

    client.query(deleteQuery, safevalue).then(() =>{
        res.redirect('/'); 


    }).catch(error =>{
        console.log('an error occurred while deleting from DB ...'+error); 

    }); 
}

function handleUpdate(req,res){
    let id = req.params.id;
    let title = req.body.title;
    let author =  req.body.authors;
    let description =  req.body.decr;
    let isbn =  req.body.isbn;
    let sqlQuery = `UPDATE books SET title=$1 ,authors=$2, isbn=$3,  decr=$4  WHERE id =$5`;
    let value = [title,author, isbn,  description, id];
    client.query(sqlQuery,value).then(data => {
        res.redirect('/books/'+id);
    }).catch(error =>{
        console.log(error); 
    });
}
function addBookToDB(req, res) {
    // console.log(req.body)
    // let { image, title, authors, decr, isbn, bookshelf } = req.body
   let SQL= `insert into books(image, title, authors, decr, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)returning *;`;
    // let SQL = `INSERT INTO books (image, title, authors, decr, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
    let reqBody = req.body;
    let values = [reqBody.image, reqBody.title, reqBody.authors, reqBody.decr, reqBody.isbn, reqBody.bookshelf];

    client.query(SQL, values)
        .then((data) => {
            console.log(data);
            res.redirect('/');
        }).catch(error => {
            res.render('/pages/error');
    
    
        });
}


function getAllBooks(req, res) {
    let SQL = `SELECT * FROM books;`;
    client.query(SQL)
        .then(data => {
        console.log(data);
            res.render('pages/index', { booksList: data.rows ,total: data.rowCount});
        }).catch(error => {
            res.render('/pages/error');
    
    
        });
}



function edaitSelected(req,res){
    // console.log(req.body)
    // res.render('pages/books/show', {book:req.body})
    let SQL= `insert into books(image, title, authors, decr, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)returning *;`;
    // let SQL = `INSERT INTO books (image, title, authors, decr, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
    let reqBody = req.body;
    let values = [reqBody.image, reqBody.title, reqBody.authors, reqBody.decr, reqBody.isbn, reqBody.bookshelf];

    client.query(SQL, values)
        .then((data) => {
            console.log(data);
            res.redirect('/');
        }).catch(error => {
            res.render('/pages/error');
    
    
        });


}


function getSpecificBook(req,res){
    let SQL = `SELECT * FROM books WHERE id=$1`;
    let id = req.params.book_id;
    let values =[id];
    client.query(SQL,values)
    .then(data=>{
        // console.log(data.rows)
        res.render('pages/books/detail',{book: data.rows[0]});
    }).catch(error => {
        res.render('/pages/error');


    });
}

function handelSearches(req, res) {


    const url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.select}+${req.body.input}`
    // const url =`https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor`


    console.log(req.body);
    superagent.get(url).then(data => {

        // console.log(data.body.items);
        let searchBook = data.body.items;
        let newBook = searchBook.map(data => new Book(data));
        // console.log(newBook);
        res.render('pages/searches/show', { books: newBook })

    }).catch(error => {
        res.render('/pages/error');


    });
}
function Book(data) {
    this.title = data.volumeInfo.title ? data.volumeInfo.title : "No Title Available";
    this.authors = data.volumeInfo.authors ? data.volumeInfo.authors : "No Authors";;
    this.image = data.volumeInfo.imageLinks.thumbnail ? data.volumeInfo.imageLinks.thumbnail : "https://i.imgur.com/J5LVHEL.jpg";
    this.decr = data.volumeInfo.description ? data.volumeInfo.description : "No description available";
}





client.connect()
.then(()=>{
    app.listen(PORT, () => console.log('server is listening to ' + PORT));
}).catch(error => {
    console.log('error loading page '+error);
});