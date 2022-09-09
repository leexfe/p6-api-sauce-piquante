// invoque la librairie mongoose pour pouvoir communiquer avec la base de donnée enregistrée dans MongoDB
const mongoose = require("mongoose");
// invoque la methode promises de la librairie file system
const { unlink } = require("fs/promises");

// Défini un schéma mongoose qui représente le contenu d'une sauce:
const productSchema = new mongoose.Schema({
  userId: String,
  name: String,
  manufacturer: String,
  description: String,
  mainPepper: String,
  imageUrl: { type: String, required: true }, // important les required
  heat: Number,
  likes: Number,
  dislikes: Number,
  usersLiked: [String],
  usersDisliked: [String],
});

// Créer une instance d'un modele mongoose :
const Product = mongoose.model("Product", productSchema); // produit créé dans create sauce

// Récupérer et afficher toutes les sauces stockées dans la base de donnée :
function getSauces(req, res) {
  Product.find({})
    .then((products) => res.send(products))
    .catch((error) => res.status(500).send(error));
}

// Renvoie la sauce avec l’_id fourni qui a été sélectionnée à partir de la page sauces:
function getSauceById(req, res) {
  const id = req.params.id;
  Product.findById(id)
    .then((product) => {
      res.status(200).send(product);
    })
    .catch((err) => res.status(500).send(err));
}

// Supprime la sauce de la base de donnée via son identifiant et supprime l'image de l'affichage :
function deleteSauceById(req, res) {
  const id = req.params.id;
  //ordonne la suppression de l'id de l'image vers MongoDB
  Product.findByIdAndDelete(id)
    .then((product) => sendClientResponse(product, res))
    .then((productitem) => deleteImage(productitem))
    .then((res) => console.log("file deleted", res))
    .catch((err) => res.status(500).send({ message: err }));
}

// Supprime l'image stockée dans le dossier image du serveur de mon backend :
function deleteImage(product) {
  if (product == null) return "n'existe pas dans la base de donnée";
  // stocke dans imageUrl l'adresse url de l'image du product:
  const imageUrl = product.imageUrl;
  // stocke dans fileToDelete la dernière partie de l'adresse url de l'image:
  const fileToDelete = imageUrl.split("/").pop();
  //La fonction unlink prend un chemin vers le fichier à supprimer comme argument.
  return unlink(`images/${fileToDelete}`); // unlink ne retourne rien mais pour bonne pratique placer un return à la fin d'une promesse //ici le unlink est déjà un promesse de part la methode associé à "fs/promises"
}

// Fabrique l'URL d'une image à partir de son nom de fichier :
function makeImageUrl(req, fileName) {
  return req.protocol + "://" + req.get("host") + "/images/" + fileName;
}

// Modifie le contenu textuel et/ou l'image de la sauce :
function modifySauceById(req, res) {
  const id = req.params.id;
  // hasNewImage est vrai (boolean), il représente pour un fichier image qui n'est pas undefined:
  const hasNewImage = req.file != null;
  // La variable payload représente pour la valeur de retour de la fonction makePayload:
  const payload = makePayload(hasNewImage, req);
  // Méthode qui cherche le Product via le params (url) de son identifiant, passe en argument le nouveau payload et le sauvegarde si le body a été transformé :
  Product.findByIdAndUpdate(id, payload)
    //passe la data du produit à la fonction sendClientResponse et s'il n'est pas nul enchaine la promesse suivante deleteImage :
    .then((resdatabody) => sendClientResponse(resdatabody, res))
    //s'il trouve le produit il l'enlève du serveur du dossier back dans images
    .then((product) => deleteImage(product))
    .then((res) => console.log("File Deleted", res))
    .catch((err) => console.error("Problem Deleting File", err));
}

// Fabrique un nouveau payload et s'il n y a pas de nouvelle image il sera égal à req.body :
function makePayload(hasNewImage, req) {
  if (!hasNewImage) return req.body;
  const payload = JSON.parse(req.body.sauce);
  //attribue à payload.imageUrl la valeur de retour de la fonction makeImageUrl:
  payload.imageUrl = makeImageUrl(req, req.file.fileName);
  return payload;
}

// Renvoie la réponse au client et informe s'il ya un produit identique ou non à updater :
function sendClientResponse(product, res) {
  //product représente pour resdatabody et pour la reponse de la bdd renvoyée par mongo :
  if (product == null) {
    console.log("nothing to update");
    return res.status(404).send({ message: "object not found in database" });
  }
  console.log("Update le Body by id :", product);
  return Promise.resolve(res.status(200).send(product)).then(() => product); // on ne peut pas placer un .then directement derrière un res.send donc on passe l'ensemble entre parenthèse et collé à la méthode Promise.resolve
}

// Créer et Ajouter une nouvelle sauce avec de nouvelles données attribuées au contenu du produit:
//express nous donne accès à un objet réponse
function createSauce(req, res) {
  // Récupère le body sur la requète et stocke dans body:
  const body = req.body;
  // Récupère l'objet file dans la requète et stocke dans file:
  const file = req.file;
  // Stocke le nom du fichier image issu de l'objet file dans fileName:
  const fileName = file.fileName;
  // Converti les données JSON en objet JavaScript et stocke dans sauceData:
  const sauceData = JSON.parse(body.sauce);
  // Attribue les nouvelles données du body à sauceData :(sauce.name, sauce.manufacturer,..)
  const { name, manufacturer, description, mainPepper, heat, userId } =
    sauceData;
  // Appelle la fonction makeImageUrl et Fabrique l'URL d'une image à partir de son nom de fichier
  makeImageUrl(req, fileName);

  // Créer le nouvel objet Product:
  const product = new Product({
    userId: userId,
    name: name,
    manufacturer: manufacturer,
    description: description,
    mainPepper: mainPepper,
    imageUrl: makeImageUrl(req, fileName),
    heat: heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  product
    .save() // methode de l'objet Product et product est une instance d'un modele mongoose (appartient à la librairie) pour sauvegarder
    .then((message) => res.status(201).send({ message })) //attention au conflit (internal servor error 500) pour cela on a nommé message à la place de res qui represente le param de la fonction createSauce et non la reponse(message) de product.
    .catch((err) => res.status(500).send(err));
}

// Notifier Like ou Dislike:
function likeSauce(req, res) {
  const id = req.params.id;
  const like = req.body.like;
  const userId = req.body.userId;
  // méthode Array.includes: si l'array ne contient pas le like alors le like n'est ni égal à 0, 1 ni -1 et on stoppe la fonction et renvoie un message d'erreur:
  if (![-1, 0, 1].includes(like))
    return res.status(403).send({ message: "bad request, invalid like value" });
  // méthode findById pour retrouver le produit via son id:
  Product.findById(id)
    .then((product) => updateVote(product, like, userId, res))
    .then((productsave) => productsave.save()) //Promise.reject
    .then((productsendres) => {
      console.log("the productsave to like is:", productsendres);
      sendClientResponse(productsendres, res); // on ne peut envoyer qu'une seule reponse
    })
    .catch((err) => res.status(500).send(err));
}

// Met à jour le vote (nécessite d'avoir la reponse pour renvoyer une erreur) :
function updateVote(product, like, userId, res) {
  if (like === 1 || like === -1) return incrementVote(product, userId, like);
  if (like === 0) return resetVote(product, userId, res); //nécessite d'avoir la reponse pour renvoyer une erreur
}

// Réinitialise le vote de l'utilisateur à zero :
function resetVote(product, userId, res) {
  const usersLiked = product.usersLiked;
  const usersDisliked = product.usersDisliked;
  //si le même userId est inclu dans les tableaux userliked et userDisliked:
  if (usersLiked.includes(userId) && usersDisliked.includes(userId))
    // renvoie une promesse déclarée comme rejetée
    return Promise.reject(
      "Conflicting vote, there is a like and dislike for the same user !!!!!!!"
    );
  //s'il n y a pas au moins un userId inclue dans l'ensemble des deux tableaux:
  if (![usersLiked, usersDisliked].some((array) => array.includes(userId)))
    //renvoie false et la promesse déclarée comme rejetée
    return Promise.reject("Conflicting vote, because vote of user is empty");
  // si usersLiked inclue déjà le même userId , enlève un likes à product:
  if (usersLiked.includes(userId)) {
    --product.likes;
    //supprime le userId de la liste des utilisateurs qui ont likes le produit (ne conserve que les id differents de userId dans le nouveau tableau)
    product.usersLiked = product.usersLiked.filter((id) => id !== userId);
  }
  // si usersDisliked inclue déjà le même userId , enlève un dislikes à product:
  else {
    --product.dislikes;
    //supprime le userId de la liste des utilisateurs qui ont dislikes le produit.
    product.usersDisliked = product.usersDisliked.filter((id) => id !== userId);
  }
  return product; // fais remonter le product(en argument) à la fonction resetVote  qui est invoquée  dans la fonction updateVote
}

// Incrémente le likes ou le dislikes:
function incrementVote(product, userId, like) {
  const usersLiked = product.usersLiked;
  const usersDisliked = product.usersDisliked;
  // conditional ternary operator: si like est égale à 1 alors votersArray vaudra la valeur pour userLiked sinon pour la valeur de usersDisliked:
  const votersArray = like === 1 ? usersLiked : usersDisliked;
  //si l'utilisateur(voteur) liké inclus déjà le like de l'utilisateur stoppe et return product (empeche de liké plusieurs fois le meme produit)
  if (votersArray.includes(userId)) return product;
  votersArray.push(userId); //push le userId dans le array
  let voteToUpdate = like === 1 ? ++product.likes : ++product.dislikes;
  voteToUpdate++;
  return product; // retourne product à updateVote
}

module.exports = {
  getSauces,
  createSauce,
  getSauceById,
  deleteSauceById,
  modifySauceById,
  likeSauce,
};
