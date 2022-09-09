// invoque la librairie jsonwebtoken pour maintenir la session côté client au lieu de stocker les sessions sur le serveur
const jwt = require("jsonwebtoken");

// Authentifie l'utilisateur:
function authenticateUser(req, res, next) {
  //stocke dans header la valeur de "Authorization" du header de la requète (bearer + token) :
  const header = req.header("Authorization");
  if (header == null) return res.status(403).send({ message: "Invalid" });
  // ne conserve que la chaine du token après l'espace en sectionnant la partie "Bearer" de la const header :
  const token = header.split(" ")[1];
  if (token == null)
    return res.status(403).send({ message: "Token cannot be null" });
  // on passe le token à vérifier et le mot de passe en arguments:
  jwt.verify(token, process.env.JWT_PASSWORD, (err) => {
    if (err) return res.status(403).send({ message: "Token invalid " + err });
    console.log("Le token est bien valide, donc next, on peut continuer");
    next();
  });
}

module.exports = { authenticateUser };
