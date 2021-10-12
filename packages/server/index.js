const express = require('express');

const dotenv = require('dotenv');
dotenv.config();
console.log(process.env.SECRET_MESSAGE)

const port = process.env.PORT || 5080;
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port, (e) => {
  e ? console.error(`Error: ${e.message}`) : console.log(`listening on Port: ${port}`);
})

