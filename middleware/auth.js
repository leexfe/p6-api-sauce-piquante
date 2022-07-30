const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
  console.log("authenticate user");
  const header = req.header("Authorization");
  if (header == null) return res.status(403).send({ message: "Invalid" });

  const token = header.split(" ")[1];
  if (token == null)
    return res.status(403).send({ message: "Token cannot be null" });
  //on passe le token à vérifier et le mot de passe dans les deux premiers arguments:
  //fonction callback  qui remplace la promesse passée en troisieme argument et qui recupère res de authenticateUser
  jwt.verify(token, process.env.JWT_PASSWORD, (err, decoded) => {
    if (err) return res.status(403).send({ message: "Token invalid " + err });
    console.log("Le token est bien valide, donc next, on peut continuer");
    next(); //next represente pour la fonction getSauces avec les anciens param (decoded,res)
  });
}

module.exports = { authenticateUser };
