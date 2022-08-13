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

    //Renvoie "image deja supprimée" ou product s'il ne la pas dans le backend //supprime image localement mais s'il ne l'a pas indique-le
    //.then(() => res.send({ message: "produit supprimé" }))
    //récupère product dans la DB:
    //.then((product) => res.send({ message: product })) //envoie message de succès au site web(client)
    .then((product) => sendClientResponse(product, res))
    // .then((product) => {
    //   if (product == null) {
    //     console.log("nothing to update");
    //     return res
    //       .status(404)
    //       .send({ message: "object not found in database" });
    //   }
    //   console.log("Update le Body by id! :", product);
    //   res.status(200).send({ message: "successfully updated" });
    // })
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
  const fileToDelete = imageUrl.split("/").pop(); //ne garde que la derniere partie
  return unlink(`images/${fileToDelete}`); //  unlink ne retourne rien mais pour bonne pratique placer un return à la fin d'une promesse //ici le unlink est déjà un promesse de part la methode asssocié à "fs/promises"
  // .then((res) => console.log ("file deleted",res))  //renvoyer ds la function  modifSauce en-dessous de deleteImage
  // //return unlink("images/" + fileToDelete.then(() => product);
  // .catch((err) => console.error("!!!!!!!!!!!!!!!!!!!","problem deleting file!!!!!", err))
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
  //on parse la chaine de caractere pour en faire un objet et recuperer

  //const payload = makePayload()//invoque la fonction makePayload
  //s'il ya une image hasNewImage est vrai (boolean)
  const hasNewImage = req.file != null; // != et non !== pour que null soit reconnu comme étant undefined
  const payload = makePayload(hasNewImage, req);
  //on definit un payload et s il n y a pas de nouvelle image il sera égal à req.body
  //let payload;
  // if (!hasNewImage) return body
  // console.log("hasNewImage", hasNewImage);
  //va chercher le product by id à partir du param url qu'il faut ensuite modifier en base de donnée(body tranformé en payload)
  Product.findByIdAndUpdate(id, payload) //payload en param pour le body qu'on va transformer et lui passer s'il ya une nouvelle image
    //envoie le produit à la fonction sendClientResponse
    .then((resdatabody) => sendClientResponse(resdatabody, res)) // si le sendClientResponse n'est pas nul on lui enchaine la promesse suivante deleteImage:
    // .then((resdatabody) => {
    //   if (resdatabody == null) {
    //     console.log("nothing to update");
    //     res.status(404).send({ message: "object not found in database" });
    //   }
    //   console.log("Update le Body by id! :", resdatabody);
    //   res.status(200).send({ message: "successfully uptated" });
    // })
    //s'il trouve le produit il l'enlève du serveur du dossier back dans images
    .then((product) => deleteImage(product))
    .then((res) => console.log("file deleted", res))
    //return unlink("images/" + fileToDelete.then(() => product);
    .catch((err) =>
      console.error("!!!!!!!!!!!!!!!!!!!", "problem deleting file!!!!!", err)
    );
  // .catch((err) => console.error(" problème sur le update!", err));
}

// fabrique nouveau payload si nouvelle image en fonction de la requète de modifysauceById
function makePayload(hasNewImage, req) {
  //if (!hasNewImage) payload = body
  if (!hasNewImage) return req.body; //pas de vouvelle image la fonction stoppe!
  console.log("hasNewImage", hasNewImage);
  const payload = JSON.parse(req.body.sauce);
  payload.imageUrl = makeImageUrl(req, req.file.fileName); //on passe un objet puis une propriété de l'objet que l'on vient de lui passer// revient à req.protocol + "://" + req.get("host") + "/images/" + fileName;
  // console.log("#################");
  console.log("et voici le payload", payload);
  console.log("nouvelle image à gérer");
  console.log("voici le body:", req.body.sauce);
  return payload;
}

// donne la réponse au client et informe s'il ya produit identique ou non à updater
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
    //.catch(console.error);
    .catch((err) => res.status(500).send(err));
}

function likeSauce(req, res) {
  const id = req.params.id; // const {params: {id}} = req
  const like = req.body.like;
  const userId = req.body.userId;
  //methode Array.includes !
  //si l'array ne contient pas le like alors le like n'est ni égal à 0, 1 ni -1 et on stoppe la fonction
  // methode qui facilit grandement et évite l'accumulation de if et else
  console.log("fonction likeSauce invoquée *********************");
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

//necessite res en argument pour renvoyer une reponse en cas d'erreur sur resetVote
//function updateLike(product, like, userId) {
function updateVote(product, like, userId, res) {
  //nécessite d'avoir la reponse pour renvoyer une erreur:

  //if (like === 1 || like === -1) return incrementVote(product, userId, like);//s'arrete direct avec le return et passe le relai à incrementVote si 1 ou -1 donc empeche de continuer pour avoir le return sur product.save

  //on place un return devant incrementVote car on a besoin de passer quelque chose dans le .then d'après dans likeSauce
  if (like === 1 || like === -1) return incrementVote(product, userId, like); //!!!!!!!!!!!!!!!!!!!!! attention  enlever return sur incrementVote si appel de fonction resetVote avant le return product.save() sinon ne continue pas !!!!!!!!!!!!
  //if (like === 1 || like === -1) incrementLike(product, userId);
  // if (like === 1) incrementLike(product, userId);
  // if (like === -1) incrementLike(product, userId);
  //if (like === -1) decrementLike(product, userId);
  // return resetLike(product, userId, res);

  //le return devant resetVote permet de renoyer l'erreur mais empeche de lire et de retourner le product.save

  //if (like === 0) resetVote(product, userId, res); ///nécessite d'avoir la reponse pour renvoyer une erreur
  if (like === 0) return resetVote(product, userId, res); ///nécessite d'avoir la reponse pour renvoyer une erreur//  resetVote doit aussi faire remonter le product donc on place un return à la fin de la fonction resetVote. Elle renvoie le product à updateVote qui est invoquée dans likeSauce

  //product.save(); //sauvegarde le produit

  // return product.save(); enlève ce return product.save() pour le placer dans la chaine de promises à la suite du .then qui appelle updateVote
  //!!!! obligé d'avoir une valeur de retour à passer à updateVote sinon updateVote ne passera rien au .then d'après
}

//le resetVote nécessite d'avoir la reponse pour renvoyer une erreur en cas de conflit si [usersLiked, usersDisliked] ont le même userId donc on passe res en argument:
function resetVote(product, userId, res) {
  const usersLiked = product.usersLiked; //const { usersLiked, usersDisliked } = product;
  const usersDisliked = product.usersDisliked;
  // CAS D'ERREUR :
  //const arrayToUpdate = usersLiked.includes(userId) ? usersLiked : usersDisliked //si oui on update usersliked sinon usersDisliked// risqué si pour une raison inconnue, le userId est soit dans aucun des deux, soit dans les deux
  // Méthode Array.every() vérifie toutes les valeurs dans un array: on applique la fonction à chaque élément de l'array:
  // si pour chacun des arrays de usersLiked et usersDisliked l'array inclus le userId c'est qu'on a une erreur car on ne peut pas avoir les deux en même temps
  //Promise.reject force à envoyer l'erreur dans le catch (err 500 interne server) du Product.findById à la fin du chainage de promesse dans la fonction likeSauce
  if ([usersLiked, usersDisliked].every((array) => array.includes(userId)))
    return Promise.reject(
      "Conflicting vote, there is a like and dislike for the same user !!!!!!!"
    );
  // return res.satus(500).send({
  //   message: "conflicting vote, impossible to like ans dislike together" });
  // Promise.reject force à aller dans le catch // attentio à specifier return devant le resetVote dans la fonction updatVote!

  // throw new Error("!!!!!!! Conflicting vote, there is a like and dislike for the same user !!!!!!!")

  // Méthode : array.some verifie si certaines des valeurs du array répondent à une condition
  // si un seul ne passe pas la validation alors message d'erreur car ! devant represente la negation
  //si pour chacun des arrays de usersLiked et usersDisliked, on (a aucun) on n'a pas au moins un userId dans chacun des tableaux alors erreur car vote vide

  if (![usersLiked, usersDisliked].some((array) => array.includes(userId)))
    return Promise.reject("Conflicting vote, because vote of user empty");// et donc automatiquement la préprogrammation du site fait que s'il ya ce conflit, il me l'efface de la bdd sur Mongo

  // updater le like ou le disLike
  //dans mongoDb provoquer conflit en intégrant le même userId dans usersLiked et usersDisliked affiche 500(internal server) et ERROR undefined dans console sans message particulier donc on utilise Promise.reject
  const voteToUpdate = usersLiked.includes(userId) ? usersLiked : usersDisliked;
  console.log("\\\\\\\\\\\\\\ VotetoUpdate  ////////", voteToUpdate);
  //on sait maintenant que le userId est soit dans l'un soit dans l'autre des tableaux usersLiked ou usersDisliked
  let arrayToUpdate = usersLiked.includes(userId) //let et non const pour pouvoir reassigner la variable!
    ? usersLiked
    : usersDisliked;
  // Méthode filter (): renvoie un array ou chaque element aura passer le test pour savoir s'il est différent de userId
  //filtre et récupère uniquement tout les id qui sont differents du userId
  const arrayWithoutUser = arrayToUpdate.filter((id) => id !== userId); //renvoie un nouvel arrayWithoutUser sans changer l'arrayToUpdate donc on va le réassigner:
  console.log("------------  arrayToUpdate-BEFORE", arrayToUpdate);
  console.log("------------ nouveau arrayWithoutUser-BEFORE", arrayWithoutUser);
  arrayToUpdate = arrayWithoutUser;
  console.log(
    "nouveau arrayWithoutUser-AFTER  +++++++++++++",
    arrayWithoutUser
  );
  console.log(" arrayToUpdate-AFTER  ++++++++++++++++", arrayToUpdate);
  return product; // fais remonter le product(en argument)à la fonction resetVote  qui est invoquée  dans la fonction updateVote
}

function incrementVote(product, userId, like) {
  // console.log("ancien like", product.likes);
  const usersLiked = product.usersLiked; //const { usersLiked, usersDisliked } = product;
  const usersDisliked = product.usersDisliked;
  // if (usersLiked.includes(userId)) return;//si l'utilisateur liké inclus  déjà le like de l'utilisateur stoppe
  // usersLiked.push(userId);
  // product.likes++;
  // console.log("like sur product  +++++++", product.likes);//les objets sont assignés par références tandis que les primitives sont assignées par valeurs
  // console.log("product after  +++++++++ ", product);

  // si like === 1 (? pour oui) on push dans usersLiked  sinon on push dans usersDisliked(: pour sinon)
  const votersArray = like === 1 ? usersLiked : usersDisliked; // conditional ternary operator
  console.log("update votersArray", votersArray);
  if (votersArray.includes(userId)) return product; //si l'utilisateur(voteur) liké inclus déjà le like de l'utilisateur stoppe et renvoie product
  votersArray.push(userId);

  let voteToUpdate = like === 1 ? ++product.likes : ++product.dislikes;
  voteToUpdate++;
  //like === 1 ? ++product.likes : ++product.dislikes;
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
