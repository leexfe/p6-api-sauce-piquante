// // Database
const uniqueValidator = require("mongoose-unique-validator"); //pas nécessaire
const mongoose = require("mongoose");

//--------------------------------------------------
// ici const uri représente la clé de connexion en integralité stocké dans le fichier.env

const uri = process.env.DB_URI;
console.log(uri); //affiche dans terminal !
//---------------------------------------------------------------

// TEST avec ${variable} et mdp stocké dans .env affiche Error connecting to Mongo: MongoParseError: Password contains unescaped characters!!!!
//const password = "kirikool65"; //v1
//const password = process.env.DB_PASSWORD;//v2
//console.log("password",password);

// const username = "felixbacon"; //v1
//const username = process.env.DB_USER; //v2
//console.log("username",username);

//const uri = `mongodb+srv://felixbacon:${password}@cluster0.zeor7jv.mongodb.net/?retryWrites=true&w=majority`; //v1
// //const db = process.env.DB_NAME;
//const uri = `mongodb+srv://${username}:${password}@cluster0.zeor7jv.mongodb.net/?retryWrites=true&w=majority`; //v2 pas de name affiche test.user ds mongoDB
//-----------------------------------------------------

mongoose
  .connect(uri)
  .then(() => console.log("Connected to Mongo!"))
  .catch((err) => console.error("Error connecting to Mongo: ", err));

// Fabrique le moule(model): à quoi chaque users va ressembler dans le body du Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, //required pour validation unique et ne pas accepter un autre email identique
  password: { type: String, required: true },
});

userSchema.plugin(uniqueValidator); //pas utile car plugin deja présent dans le projet de base ou  mongoose

// // fabrique la constante user d'après le model :
const User = mongoose.model("User", userSchema);

module.exports = { mongoose, User }; //renvoie mongoose dans index.js et User dans mongo.js
// //le module.exports renvoie un objet donc mettre accolade pour la  const {User} = require("../mongo")
