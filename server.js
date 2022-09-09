// Permet de créer un server web . librairie de Node.js
const express = require("express"); 
// Initialise une nouvelle instance de express
const app = express();
// Charge les paramètres d'environnement à partir du fichier .env
require("dotenv").config();
// Securité de connexion Cross Origin Resource Sharing: restreint les requête HTTP aux domaines autorisés et empêche d'envoyer des requêtes à d'autres sites :
const cors = require("cors");

// Middleware server-------------------
// l'application utilise la fonction middleware CORS et permet de répondre aux demandes de contrôle en amont :
//(le partage des ressources entre les origines). Afin que votre serveur soit accessible par d'autres origines (domaines).
app.use(cors());
// l'application utilise la fonction middleware express.json pour analyser les requete json entrantes :
app.use(express.json());


module.exports = { app, express };    
