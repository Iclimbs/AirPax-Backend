require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerjsdoc = require("swagger-jsdoc");
const swaggerui = require("swagger-ui-express");
const connection = require("./connection/connection");
const path = require('node:path');
const app = express();


app.use(express.json());
app.use(cors());

app.use("/api/v1/", require("./routes/routes"));

app.use('/public', express.static(path.join(__dirname, 'public')));


app.listen(process.env.Port, async () => {
    try {
        await connection;
        console.log(`Server is Up & Running At Port ${process.env.Port}`);
    } catch (error) {
        console.log(error);
    }
});