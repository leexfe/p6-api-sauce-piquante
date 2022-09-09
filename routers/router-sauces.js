const express = require("express");
// Importe les fonctions   getSauces, createSauce, getSauceById, deleteSauceById, modifySauceById et likeSauce
const {
  getSauces,
  getSauceById,
  createSauce,
  modifySauceById,
  deleteSauceById,
  likeSauce,
} = require("../controllers/sauces");
// Importe la fonction authenticateUser
const { authenticateUser } = require("../middleware/auth");
// Importe la fonction upload
const { upload } = require("../middleware/multer");
// importe le module body-parser pour traiter les données envoyées par les utilisateurs
const bodyParser = require("body-parser");
// créé un routeur pour gérer les routes de l'application:
const routerSauces = express.Router();

routerSauces.use(bodyParser.json());
// routerSauces utilise la fonction authenticateUser avant chaque appelle de fonctions liées au CRUD:
routerSauces.use(authenticateUser);

//Routes destinées à l'utilisateur qui permet l'exécution de fonction pour créer et gérer des données concernant les sauces:
routerSauces.get("/", getSauces);
routerSauces.post("/", upload, createSauce);
routerSauces.get("/:id", getSauceById);
routerSauces.delete("/:id", deleteSauceById);
routerSauces.put("/:id", upload, modifySauceById);
routerSauces.post("/:id/like", likeSauce);

module.exports = { routerSauces };
