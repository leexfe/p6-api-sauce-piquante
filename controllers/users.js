// l'objet User (entre accolade) requiert la page fichier mongo
const { User } = require("../mongo");
// Invoque la Bibliothèque de hachage de mot de passe
const bcrypt = require("bcrypt");
// Invoque la Bibliothèque qui permet l'échange sécurisé de jetons(tokens d'authentification)
const jwt = require("jsonwebtoken");

//  Créer un nouvel utilisateur (user) avec son identifiant (Hachage du mot de passe de l'utilisateur, ajout de l'utilisateur à la base de données):
async function createUser(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    //attend la valeur retournée par la fonction hashedPassword qu'on a attribuée à hashPassword :
    const hashedPassword = await hashPassword(password);
    // On stocke dans user le nouvel objet User créé qui a une propriété email et password (MongoDB va attribuer à l'objet un _id):
    const user = new User({ email: email, password: hashedPassword });
    //attend d'avoir sauvegardé le user avant d'envoyer la réponse:
    await user.save();
    res.status(201).send({ message: "Utilisateur enregistré ! " });
  } catch (err) {
    res.status(409).send({ message: "Utilisateur non enregistré : " + err });
  }
}

// Transforme le mot de passe en chaine de caractère pour le rendre unique :
function hashPassword(password) {
  // Facteur de coût (2^10)pour augmenter le nombre de tours de hachage(cycle de calcul pour obtenir le hachage final) :
  const saltRounds = 10;
  // Prend le mot de passe suivi d'une valeure salée ajoutée au mdp et hash l'ensemble :
  return bcrypt.hash(password, saltRounds);
}

// Connecter un client déjà connu (Vérification des informations d'identification de l'utilisateur, renvoie l _id de l'utilisateur depuis la base de données et un token web JSON signé (contenant également l'_id de l'utilisateur).
async function logUser(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    // attend de trouver l'email du User enregistré dans la bdd qui correspond à l'email inscrit dans le input et attribue sa valeur à userInputMatchBdd:
    const userInputMatchBdd = await User.findOne({ email: email });
    // attend de comparer le mdp inscrit dans le input avec le password hashé enregistré dans la bdd et attribue sa valeur à passwordMatchHash:
    const passwordMatchHash = await bcrypt.compare(
      password,
      userInputMatchBdd.password
    );
    // si mdp du input different du mdp de bdd, il est incorrect:
    if (!passwordMatchHash) {
      res.status(403).send({ message: "Mot de passe incorrect" });
    }
    //On stocke dans token la valeur de retour de la fonction createToken à laquelle on a passé l'email en argument:  :
    const token = createToken(email);
    // si le mdp du input correspond au mdp de la bdd, renvoie un status 200 et passe la réponse avec l'id de l'utilisateur et le jeton d'authentification:
    if (passwordMatchHash) {
      res.status(200).send({ userId: userInputMatchBdd._id, token: token });
    }
  } catch (err) {
    res.status(500).send({ message: "Erreur interne" }); //error côté server et pas coté user
  }
}

// Créer un jeton d'authentification à partir de l'email de l'utilisateur en paramètre:
function createToken(email) {
  // attribue à jwtPassword le mdp du JWT caché dans le fichier .env
  const jwtPassword = process.env.JWT_PASSWORD;
  // retourne un objet avec les données de l'email à signer avec le mdp jwtPassword, et l'option qui indique la durée de validité du jwt:
  return jwt.sign({ email: email }, jwtPassword, { expiresIn: "24h" });
}

module.exports = { createUser, logUser };
