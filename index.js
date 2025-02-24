require('dotenv').config()
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const port = process.env.PORT || 5000
const app = express()

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));






app.get('/', (req, res) => {
    res.send('Hello from BD_Pay Server..')
  })
  
  app.listen(port, () => {
    console.log(`BD_Pay is running on port ${port}`)
  })