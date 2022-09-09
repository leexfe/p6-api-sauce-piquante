// Importe app et express 
const { app, express } = require("./server");
// Importe routerSauces
const { routerSauces } = require("./routers/router-sauces")
// Importe routerAuth
const { routerAuth } = require("./routers/router-auth")
// Déclare la variable pour le port 3000:
const port = 3000;
//Invoque la librairie body-parser pour analyser le corp de la requête entrant
const bodyParser = require("body-parser"); 
// Invoque la librairie path pour interagir avec les chemins relatifs de fichiers
const path = require("path"); 

// Connection à la database
require("./mongo");

// MIDDLEWARE ----------------
// Envoie le bout de chemin à routerSauces:
app.use("/api/sauces", routerSauces)
// Envoie le bout de chemin à routerAuth:
app.use("/api/auth", routerAuth )
// Invoque la fonction bodyParser.json(): transforme JSON textuelle en variables accessibles JS sous req.body
app.use(bodyParser.json());
// Invoque la fonction bodyParser.urlencoded : pour les requêtes encodées en URL. (extended: true précise que l'objet req.body contiendra des valeurs de n'importe quel type au lieu de simplement des chaînes)
app.use(bodyParser.urlencoded({ extended: true }));

// Route pour afficher reponse via port 3000 :
app.get("/", (req, res) => res.send("hello world on port 3000"));

// lISTEN ---------------
// Invoque la fonction express.static qui rend le dossier accessible à tout public:
app.use("/images", express.static("images")); 
// CHEMIN ABSOLU  avec http localhost devant : on est sur que si on déplace index.js cela fonctionnera quand même
app.use("/images", express.static(path.join(__dirname, "images")));

app.listen(port, () => console.log("Listening on port" + port)); //le port du serveur est 3000  


