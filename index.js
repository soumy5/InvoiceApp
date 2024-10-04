const express = require("express");
const app = express();
const routes = require("./routes");
const helpers =require("./helpers");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const fileupload=require('express-fileupload');

require("dotenv").config()
app.use(cookieParser())
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload())

app.use("/", routes);

app.use(function (req, res) {
    res.status(404).send(helpers.response("404", "error", "Sorry can not find that!"));
});

app.listen(process.env.HTTP_PORT, () => {
    console.log(`Server running on port ${process.env.HTTP_PORT}`);
})

module.exports = app;