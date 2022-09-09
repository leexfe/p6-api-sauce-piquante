// Stocke dans mongoose la bibliothèque qui permet de communiquer avec le systeme de gestion de base de donnée mongoDB
const mongoose = require("mongoose");

// Stocke dans uniqueValidator le plugin "mongoose-unique-validator" qui assure la remontée des erreurs issues de la base de données.
const uniqueValidator = require("mongoose-unique-validator");

// uri représente pour la clé de connexion intégralement stocké dans le fichier.env
const uri = process.env.DB_URI;

// Connexion à mongoose :
mongoose
  .connect(uri)
  .then(() => console.log("Connected to Mongo!"))
  .catch((err) => console.error("Error connecting to Mongo: ", err));

// Fabrique le modèle (moule) du body de Schema pour chaque user qui s'enregistrera et se connectera à MongoDB:
const userSchema = new mongoose.Schema({
  //required pour une validation unique et ne pas accepter un autre email identique
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Ajoute un validateur unique pour chaque index unique déclaré dans le schéma.
userSchema.plugin(uniqueValidator);

// Fabrique la constante User d'après le model :
const User = mongoose.model("User", userSchema);

// Renvoie les objets mongoose dans index.js et User dans mongo.js
module.exports = { mongoose, User }; 
