const mongoose = require("mongoose");
//------------------- unlink v1 ---------------------------------
//const { unlink } = require("fs"); //filesystem api
//revient à écrire:
//const  unlink = require("fs").unlink; //filesystem api
//import {unlink} from 'fs'; NON! crash!!
//------------------unlink v2 ------------------------------------
// On transforme le unlink en promesse avec la methode promises.unlink
//const { unlink } = require("fs").promises.unlink;
const { unlink } = require("fs/promises");

//on fait communiquer les nouveaux produits avec la base de donnée
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

//pour envoyer dans mongoDB:
const Product = mongoose.model("Product", productSchema); // produit créé dans create sauce

// Affiche toutes les sauces sur la page sauces(all sauces):
function getSauces(req, res) {
  console.log("get sauces!");
  console.log("le token existe! et il est validé dans getSauces ");
  // Product.find({}).then((products) => console.log({ "message": products }));
  //Product.deleteMany({});//efface tt les products
  Product.find({})
    .then((products) => res.send(products))
    .catch((error) => res.status(500).send(error));
}

// Affiche la sauce spécifique qui a été sélectionnée à partir la page sauces:
function getSauceById(req, res) {
  const id = req.params.id; //syntaxe plus propre const {id} = req.params
  console.log("guette le get!", "----------------------- params");
  console.log("params", req.params);
  Product.findById(id)
    .then((product) => {
      console.log("id du produit sélectionné:", product);
      res.status(200).send(product);
    })
    .catch((err) => res.status(500).send(err));
}

// Supprime la sauce de la base de donnée et enlève  l'image de l'affichage

function deleteSauceById(req, res) {
  const id = req.params.id;
  Product.findByIdAndDelete(id) //ordonne la suppression de l'id de l'image vers MongoDB
    .then((product) => sendClientResponse(product, res))
    .then((productitem) => deleteImage(productitem))
    .then((res) => console.log("file deleted", res))
    .catch((err) => res.status(500).send({ message: err }));
  console.log("delete la sauce de mongo !!!");
}

// Supprime l'image stockée dans le dossier image dans le serveur local de notre backend  :
//function deleteImage(imageUrl) {

function deleteImage(product) {
  //si null tu t'arretes
  if (product == null) return "n'existe pas dans la base de donnée"; //monggose ne renvoie pas d'erreur s'il ne trouve rien dans la base de donnée. à nous de créer cette condition
  const imageUrl = product.imageUrl; //recupère l'imageUrl de product
  const fileToDelete = imageUrl.split("/").pop();
  return unlink(`images/${fileToDelete}`); //  unlink ne retourne rien mais pour bonne pratique placer un return à la fin d'une promesse //ici le unlink est déjà un promesse de part la methode asssocié à "fs/promises"
}

// Fabrique l'URL d'une image à partir de son nom de fichier
function makeImageUrl(req, fileName) {
  return req.protocol + "://" + req.get("host") + "/images/" + fileName;
}

// Modifier  le contenu de la sauce :
function modifySauceById(req, res) {
  const id = req.params.id; // const {params: {id}} = req //autre syntaxe +courte
  const body = req.body; // syntaxe courte : const {body, file} = req
  const file = req.file;
  console.log({ body, id, file }); //affiche le nouveau body que j'ai moi meme modifié
  //s'il ya une image hasNewImage est vrai (boolean)
  const hasNewImage = req.file != null; // != et non !== pour que null soit reconnu comme étant undefined
  const payload = makePayload(hasNewImage, req);
  //on definit un payload et s il n y a pas de nouvelle image il sera égal à req.body
  // console.log("hasNewImage", hasNewImage);

  //va chercher le product by id à partir du param url qu'il faut ensuite modifier en base de donnée(body tranformé en payload)
  Product.findByIdAndUpdate(id, payload) //payload en param pour le body qu'on va transformer et lui passer s'il ya une nouvelle image
    //envoie le produit à la fonction sendClientResponse
    .then((resdatabody) => sendClientResponse(resdatabody, res)) //enchaine la promesse suivante deleteImage si sendClient non nul:
    .then((product) => deleteImage(product)) //s'il trouve le produit il l'enlève du serveur du dossier back dans images
    .then((res) => console.log("file deleted", res))
    .catch((err) =>
      console.error("!!!!!!!!!!!!!!!!!!!", "problem deleting file!!!!!", err)
    );
}

// fabrique nouveau payload si nouvelle image en fonction de la requète de modifysauceById
function makePayload(hasNewImage, req) {
  //if (!hasNewImage) payload = body
  if (!hasNewImage) return req.body; //pas de vouvelle image la fonction stoppe!
  console.log("hasNewImage", hasNewImage);
  const payload = JSON.parse(req.body.sauce);
  payload.imageUrl = makeImageUrl(req, req.file.fileName); //on passe un objet puis une propriété de l'objet que l'on vient de lui passer// revient à passer req.protocol + "://" + req.get("host") + "/images/" + fileName;
  console.log("et voici le payload", payload);
  console.log("nouvelle image à gérer");
  console.log("voici le body:", req.body.sauce);
  return payload;
}

// Donne la réponse au client et informe s'il ya produit identique ou non à updater
function sendClientResponse(product, res) {
  //product représente pour resdatabody
  //product represente pour la reponse de la bdd renvoyée par mongo
  if (product == null) {
    console.log("nothing to update");
    return res.status(404).send({ message: "object not found in database" });
  }
  console.log("Update le Body by id! :", product);
  return Promise.resolve(res.status(200).send(product)).then(() => product); // on ne peut pas placer un .then directement derrière un res.send donc obligé de de passer l'ensemble entre parenthèse collé à la méthode Promise.resolve
}

// Créer et Ajouter une nouvelle sauce avec de nouvelles données que l'on va remplir dans le body de la requète:
function createSauce(req, res) {
  //le res ici concerne express qui nous donne accès à un objet réponse
  console.log("req protocol", req.protocol + "://" + req.get("host")); // host pour 3000 et  req.originalUrl pour api/sauces
  console.log("dirname", __dirname); //chemin
  const body = req.body; // syntaxe courte : const {body, file} = req
  const file = req.file;
  console.log({ file });
  const fileName = file.fileName; //revient à écrire : const {fileName} = file //represente pour imageUrl
  const sauceData = JSON.parse(body.sauce);
  //const sauceData = req.body.sauce;
  console.log("sauceData", sauceData);
  const { name, manufacturer, description, mainPepper, heat, userId } =
    sauceData; //revient à sauce.name, sauce.manufacturer , sauce.description...
  // Fabrique l'URL d'une image à partir de son nom de fichier
  function makeImageUrl(req, fileName) {
    return req.protocol + "://" + req.get("host") + "/images/" + fileName;
  }
  //affiche url ------------------------------
  const imageUrl = req.file.destination + req.file.filename; //l'url du file:// pour voir le chemin
  console.log("imageUrl", imageUrl);
  //-----------------------------------------
  //créer le nouvel objet product
  const product = new Product({
    userId: userId,
    name: name,
    manufacturer: manufacturer,
    description: description,
    mainPepper: mainPepper,
    imageUrl: makeImageUrl(req, fileName), //req.protocol + "://" + req.get("host") + "/images/" + fileName;
    heat: heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  product
    .save() // methode pour sauvegarder le body
    .then((message) => res.status(201).send({ message })) //attention au conflit (internal servor error 500) pour cela on a nommé message à la place de res qui represente le param de la fonction createSauce et non la reponse(message) de product.
    .catch((err) => res.status(500).send(err));
}

// Notifier Like ou Dislike:

function likeSauce(req, res) {
  const id = req.params.id; // const {params: {id}} = req
  const like = req.body.like;
  const userId = req.body.userId;
  //methode Array.includes !
  //si l'array ne contient pas le like alors le like n'est ni égal à 0, 1 ni -1 et on stoppe la fonction
  console.log("fonction likeSauce invoquée *********************");
  //si le like different de -1, 0 ou 1 renvoie message d'erreur
  if (![-1, 0, 1].includes(like))
    return res.status(403).send({ message: "bad request, invalid like value" });
  console.log(
    "*********************** ce message apparait si like vaut -1, 0, 1"
  );
  Product.findById(id)
    .then((product) => updateVote(product, like, userId, res)) //nécessite d'avoir la reponse pour renvoyer une erreur
    .then((productsave) => productsave.save())
    .then((productsendres) => {
      console.log("the productsave to like is:", productsendres);
      sendClientResponse(productsendres, res); // on neut en voyer qu'une seule reponse
    })
    .catch((err) => res.status(500).send(err));
}

// Met à jour le vote :
//nécessite d'avoir la reponse pour renvoyer une erreur:
function updateVote(product, like, userId, res) {
  //on place un return devant incrementVote car on a besoin de passer quelque chose dans le .then d'après dans likeSauce
  if (like === 1 || like === -1) return incrementVote(product, userId, like);
  if (like === 0) return resetVote(product, userId, res); //nécessite d'avoir la reponse pour renvoyer une erreur
}

// initialise le vote de l'utilisateur à zero :
function resetVote(product, userId, res) {
  console.log("reset vote BEFORE ###################################", product);
  const usersLiked = product.usersLiked; //const { usersLiked, usersDisliked } = product;
  const usersDisliked = product.usersDisliked;

  if ([usersLiked, usersDisliked].every((array) => array.includes(userId)))
    return Promise.reject(
      "Conflicting vote, there is a like and dislike for the same user !!!!!!!"
    );
  if (![usersLiked, usersDisliked].some((array) => array.includes(userId)))
    return Promise.reject("Conflicting vote, because vote of user empty"); // et donc automatiquement la préprogrammation du site fait que s'il ya ce conflit, il me l'efface de la bdd sur Mongo
  if (usersLiked.includes(userId)) {
    --product.likes;
    product.usersLiked = product.usersLiked.filter((id) => id !== userId);
  } else {
    --product.dislikes;
    product.usersDisliked = product.usersDisliked.filter((id) => id !== userId);
  }
  console.log(
    "######################################## reset vote AFTER",
    product
  );
  return product; // fais remonter le product(en argument)à la fonction resetVote  qui est invoquée  dans la fonction updateVote
}

function incrementVote(product, userId, like) {
  const usersLiked = product.usersLiked; //const { usersLiked, usersDisliked } = product;
  const usersDisliked = product.usersDisliked;
  const votersArray = like === 1 ? usersLiked : usersDisliked; // conditional ternary operator
  console.log("update votersArray", votersArray);
  if (votersArray.includes(userId)) return product; //si l'utilisateur(voteur) liké inclus déjà le like de l'utilisateur stoppe et renvoie product
  votersArray.push(userId); //push le userId dans le array
  let voteToUpdate = like === 1 ? ++product.likes : ++product.dislikes;
  voteToUpdate++;

  console.log(" voteToUpdate !!!!!!!!!!!!", voteToUpdate);
  console.log(" product apres vote !!!!!!!!!!!", product);
  return product; // attention à bien retourner product
}

function decrementLike(product, userId) {
  const usersDisliked = product.usersDisliked;
  if (usersDisliked.includes(userId)) return;
  usersDisliked.push(userId);
  product.dislikes++;
  console.log("product.usersDisliked - - - -", product.usersDisliked);
  console.log("product after dislike - - - -", product);
}

module.exports = {
  getSauces,
  createSauce,
  getSauceById,
  deleteSauceById,
  modifySauceById,
  likeSauce,
};
