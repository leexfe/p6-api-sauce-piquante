//Importe les fonctions createUser et logUser
const { createUser, logUser } = require("../controllers/users")

const express = require("express")
const routerAuth = express.Router()

//Routes destinées à l'utilisateur qui permet l'exécution de fonctions pour créer et gérer des données concernant l'enregistrement de l'utilisateur:
routerAuth.post("/signup", createUser)
routerAuth.post("/login", logUser)

module.exports = {routerAuth}