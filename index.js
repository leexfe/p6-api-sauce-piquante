console.log("hello world");
const { app, express } = require("./server");//on importe app et express depuis le fichier server
const port = 3000;
const bodyParser = require("body-parser"); //retourne un middleware
const path = require("path"); // fournit des fonctions utiles pour interagir avec les chemins relatifs de fichiers//fixer pour avoir un chemin absolu


// Connection à la database
require("./mongo");
//--------------------
// CONTROLLERS
//--------------------
// Connection à users de controllers:
const { createUser, logUser } = require("./controllers/users");
//const { getSauces, createSauce , putSauceById} = require("./controllers/sauces"); // invoqué par app . donc express aura deux arguments
const { getSauces, createSauce , getSauceById, deleteSauceById, modifySauceById } = require("./controllers/sauces"); // invoqué par app . donc express aura deux arguments
console.log(getSauces, "get Sauces depuis Index!");


//---------------------
// MIDDLEWARE
//---------------------
// Pour Authentifier:
const { authenticateUser } = require("./middleware/auth");
// Pour télécharger l'image et la ranger dans le dossier image
const { upload } = require("./middleware/multer");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/images", express.static("images")); //rend le dossier accessible à tout public

//--------------------------------
// ROUTES
//------------------------------
//  Inscrire un  nouveau client:
app.post("/api/auth/signup", createUser); 

// Connecter un client déjà connu:
app.post("/api/auth/login", logUser);

// Récupérer et afficher toutes les sauces stockées dans la base de donnée :
app.get("/api/sauces", authenticateUser, getSauces); //authenticateUser dans middleware/auth.js puis getSauces dans controllers/ sauces.js

// Afficher la sauce spécifique sélectionnée:
app.get("/api/sauces/:id", authenticateUser, getSauceById)// : devant id pour variable

// Poster une nouvelle sauce sur le site :
app.post("/api/sauces", authenticateUser, upload, createSauce); //UPLOAD est déclaré en constante et require le chemin pour atteindre le fichier multer.js

// Effacer une sauce spécifique via son identifiant : 
app.delete("/api/sauces/:id", authenticateUser, deleteSauceById);// 

// Modifier le contenu d'une sauce :
app.put("/api/sauces/:id", authenticateUser, upload, modifySauceById);

// afficher reponse via port 3000 : 
app.get("/", (req, res) => res.send("hello world on port 3000"));

// listen
console.log("-----------------------");
console.log("dirname: ", __dirname); //bonne pratique
//le chemin global sera:
console.log("path.join(__dirname)", path.join(__dirname, "images")); // si on déplace l'index.js il retrouvera
//express.static toujours placé en dessous de sa route post pour createSauce : CHEMIN RELATIF:
app.use("/images", express.static("images")); //rend le dossier accessible à tout public
// CHEMIN ABSOLU  avec http localhost devant : on est sur que si on déplace index.js cela fonctionnera quand même
app.use("/images", express.static(path.join(__dirname, "images")));

app.listen(port, () => console.log("Listening on port" + port)); //le port du serveur est 3000

//------------------------------------------------------------------------------------------------

