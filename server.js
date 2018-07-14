'use strict'

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static(path.resolve(__dirname)))
app.use(express.static(path.resolve(__dirname, 'assets')))
app.use(express.static(path.resolve(__dirname, 'assets', 'images')))

app.set('view engine', 'pug')

app.get(('/'), (req, res) => {
	res.render('splash')
})

app.post('/app', upload.array(), (req, res, next) => {
	console.log('got the request')
	res.render('index', {data: res.body}, (err, html) => {
		console.log(html)
		if (err) throw err
		res.send(html)
	})
})

let port = process.env.PORT || 3001

app.listen(port, () => {
	console.log('Example app listening on port ' + port)
})
