// const renvoie un objet donc mettre accolade ou

const { User } = require("../mongo"); // ../ car  fichier users dans controllers
const bcrypt = require("bcrypt"); // librairie de hashing
const jwt = require("jsonwebtoken");

// //promess async await //ici res est la réponse du serveur
//  // a partir du moment ou on invoque une fonction ce n'est plus une fonction mais sa valeur de retour
async function createUser(req, res) {
  //console.log("res", res.send);
  try {
    const { email, password } = req.body; //autre syntaxe plus elegante pour prendre req.body des 2 parametres
    const hashedPassword = await hashPassword(password);
    console.log("password", password);
    console.log("hashedPassword:", hashedPassword); //le hash ne va que dans un sens
    const user = new User({ email: email, password: hashedPassword });
    //le user reçoit la réponse nommmé res de la base de donnée et le res représente la réponse du serveur donc il y a conflit//pas de res dans le then!
    await user.save();
    res.status(201).send({ message: "Utilisateur enregistré ! " });
    //
  } catch (err) {
    res.status(409).send({ message: "Utilisateur non enregistré : " + err });
  } //problème côté user
}

function hashPassword(password) {
  //le hashPassword renvoie une promesse avec return
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds); //au lieu de comparer les mots de passe il va comparer les hashs
}

// async souvent accompagné du try catch, on va rajouter des cas d'erreur possible,(trouve pas de user ou probleme de connexion)
async function logUser(req, res) {
  //la fonction est invoquée avec express (app.post)
  try {
    const email = req.body.email;
    const password = req.body.password;
    //comparer email enregistré dans bdd et email inscrit dans input:
    //User.findOne({ email: email }).then(console.log);// le findOne est une promesse qui doit être résolue avec un await // v1
    const userInputMatchBdd = await User.findOne({ email: email });
    console.log("userInputMatchBdd", userInputMatchBdd);
    //compare le mdp au hash:
    const passwordMatchHash = await bcrypt.compare(
      password,
      userInputMatchBdd.password
    );
    if (!passwordMatchHash) {
      //si different, si il n'est pas bon
      res.status(403).send({ message: "Mot de passe incorrect" });
    }
    const token = createToken(email); // l'email en param match avec bdd
    if (passwordMatchHash) {
      //si match envoie status 200 if(passwordMatchHash) peut
      // res.status(200).send({ message: "Connexion réussie" });v1
      res.status(200).send({ userId: userInputMatchBdd._id, token: token }); //v1 sans ?devant id
     // res.status(200).send({ userId: userInputMatchBdd._id, token: token }); //v2 avec ? devant id
    }
    console.log("userInputMatchBdd", userInputMatchBdd);
    console.log("passwordMatchHash", passwordMatchHash);
  } catch (err) {
    res.status(500).send({ message: "Erreur interne" }); //error servor et pas coté user
  }
}

function createToken(email) {
  const jwtPassword = process.env.JWT_PASSWORD;
  // const token = jwt.sign({ email: email }, "pelican", { expiresIn: "24h" });//il ne suffit pas de retourner le payload décodé, il faut aussi le vérifier sinon on peut changer le mot de passe et obtenir quand même l'email, iat et exp
 //console.log(jwtPassword);
 // const token = jwt.verify({ email: email }, jwtPassword, { expiresIn: "24h" }); //si mot de passe invalide, nous renvoie : JsonWebTokenError: invalid signature

  //  TESTER VOIR comment réagit si le token a expiré : 1000ms
  // const token = jwt.verify({ email: email }, jwtPassword, { expiresIn: "1000ms" });//si mot de passe invalide, nous renvoie : JsonWebTokenError: invalid signature
  //pas deconsole.log pour le token dans cette fonction sinon erreur serveur 500
  //return token;
return jwt.sign({ email: email }, jwtPassword, { expiresIn: "24h" });
}

// function createToken refactoré:

// function createToken(email) {
//    return  jwt.sign({email : email}, "pelican", {expiresIn:"24h"})
//  }

//----------attention! Supprime tt les users ------------------------------------------------
//pour effacer tout les users: sinon depuis MongoAtlas dans users DROP
//User.deleteMany({}).then(())=>console.log("all removed")
//---------------------------------------------------------

//index a besoin du creatUser donc exporter module:
module.exports = { createUser, logUser };
