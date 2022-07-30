console.log("hello world");
const { app, express } = require("./server");//on importe app et express depuis le fichier server
const port = 3000;
const bodyParser = require("body-parser"); //retourne un middleware
const path = require("path"); // fournit des fonctions utiles pour interagir avec les chemins relatifs de fichiers//fixer pour avoir un chemin absolu
const { upload } = require("./middleware/multer");

// Connection à la database
require("./mongo");
//--------------------
// CONTROLLERS
//--------------------
// Connection à users de controllers:
const { createUser, logUser } = require("./controllers/users");
//const { getSauces, createSauce , putSauceById} = require("./controllers/sauces"); // invoqué par app . donc express aura deux arguments
const { getSauces, createSauce , getSauceById } = require("./controllers/sauces"); // invoqué par app . donc express aura deux arguments
console.log(getSauces, "get Sauces depuis Index!");
// Pour Authentifier:
const { authenticateUser } = require("./middleware/auth");

//---------------------
// MIDDLEWARE
//---------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//il faut preciser quel dossier on veut rendre accessible
// ########## DOIT SE PLACER EN DESSOUS DE LA ROUTE EXPRESS.STATIC !!!!!!!!!!#########
//express va servir un dossier static = assets qui ne bouge pas
app.use("/images", express.static("images")); //rend le dossier accessible à tout public

//--------------------------------
// ROUTES
//------------------------------
//  Inscrire nouveau client:
app.post("/api/auth/signup", createUser); 

// Connecter client connu:
app.post("/api/auth/login", logUser);

//Récupérer sauces :
app.get("/api/sauces", authenticateUser, getSauces); //authenticateUser dans middleware/auth.js puis getSauces dans controllers/ sauces.js

// Affiche et Met à jour sauce sauce spécifique sélectionnée:
app.get("/api/sauces/:id", authenticateUser, getSauceById)// : devant id pour variable

// Créer sauce :
//upload est géré par le middleware dans le fichier index.js et createSauce s'execute dans sauce.js
//multer va rajouter un .file et .body sur la requète. La requète passe d'un middleware à un autre
app.post("/api/sauces", authenticateUser, upload, createSauce); //UPLOAD est déclaré en constante et require le chemin pour atteindre le fichier multer.js



// Afficher sauce : 
app.get("/", (req, res) => res.send("hello world one"));

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

