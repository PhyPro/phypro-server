'use strict'

const express = require('express')
const path = require('path')

const app = express()

app.use(express.static(path.resolve(__dirname)))
app.use(express.static(path.resolve(__dirname, 'assets')))
app.use(express.static(path.resolve(__dirname, 'assets', 'images')))

app.set('view engine', 'pug')

app.get(('/'), (req, res) => {
	res.render('index')
})

let port = process.env.PORT || 3001

app.listen(port, () => {
	console.log('Example app listening on port ' + port)
})
