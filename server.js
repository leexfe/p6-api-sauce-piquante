const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

//middleware server-------------------
app.use(cors());
app.use(express.json());


module.exports = { app , express };
