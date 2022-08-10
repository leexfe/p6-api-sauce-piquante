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
  console.log("----------------------- params");
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
    //Product.findOneAndDelete({_id: id})
    // .then((product) => {
    //    console.log("product",product );
    //    //deleteImage(product.imageUrl);
    //    deleteImage(product);
    //  })
    .then(deleteImage) //Renvoie "image deja supprimée" ou product s'il ne la pas dans le backend //supprime image localement mais s'il ne l'a pas indique-le
    //.then(() => res.send({ message: "produit supprimé" }))
    //récupère product dans la DB:
    .then((product) => res.send({ message: product })) //envoie message de succès au site web(client)
    .catch((err) => res.status(500).send({ message: err }));
  console.log("delete la sauce de mongo !!!");
}

// Supprime l'image stockée dans le dossier image dans le serveur local de notre backend  :
//function deleteImage(imageUrl) {
function deleteImage(product) {
  const imageUrl = product.imageUrl; //recupère l'imageUrl de product
  const fileToDelete = imageUrl.split("/").pop(); //ne garde que la derniere partie
  //if (fileToDelete == " ")return  ;
  //passe en argument ce que l'on veut enlever (fonctionn asynchrone avec une promesse car ('fs').promises.unlink)
  // v1 :
  // unlink(`images/${fileToDelete}`, (err) => {
  //   console.error("problème sur la suppression de l'image", err);
  // });
  // v2 :
  return unlink(`images/${fileToDelete}`).then(() => product); //renvoie une promesse qui ne va pas résoudre si elle return elle reject et le .then(()=> product) qui retourne product ne sera pas envoyé et donc le catch(err 500) de deleteSauceById sera toujours invoqué en cas de problème.
  //on a rajouté un .then car le return de unlink nous donnait une réponse undefined
  // return "image déjà supprimée du serveur local"; //return pour product
  //return product; //return pour product
}

// Modifier  le contenu de la sauce :

function modifySauceById(req, res) {
  const body = req.body; // syntaxe courte : const {body, file} = req
  const file = req.file;
  
  //recuperer l'id ds params de l'url:
  const params = req.params;
  //le id est à l'intérieur de params qui est à l'intérieur de req
  const id = params.id;
  console.log({ body, file, params });
  //const sauceData = JSON.parse(body.sauce);// s'il n y a pas de fichier image changé cela provoque une erreur interne 500 car il manque une donnée dans le body et il ne trouve pas ce qu'il cherche donc on rajoute une condition: mais on ne peut pas faire un const à l'intérieur d'un if: si body.sauce différent de null
  // let sauceData;

  // // Dans le cas ou il n y a pas d'image changée:

  // if (body.sauce != null) {
  //   sauceData = JSON.parse(body.sauce);
  // }
  // console.log("_________________");
  // console.log("body.sauce", body.sauce);
  // const { name, manufacturer, description, mainPepper, heat, userId } =
  //   sauceData;

  // Product.findByIdAndUpdate(id, {
  //   name,
  //   manufacturer,
  //   description,
  //   mainPepper,
  //   heat,
  //   userId,
  // })
  //   .then((res) => console.log("FIND ID AND UPDATE", res))
  //   .catch(console.error);
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
    imageUrl: makeImageUrl(req, fileName),
    heat: heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  product
    .save()
    .then((message) => res.status(201).send({ message })) //attention au conflit (internal servor error 500) pour cela on a nommé message à la place de res qui represente le param de la fonction createSauce et non la reponse(message) de product.
    //.catch(console.error);
    .catch((err) => res.status(500).send(err));
}

//la fonction checkToken va loger l'erreur et le decoded

module.exports = {
  getSauces,
  createSauce,
  getSauceById,
  deleteSauceById,
  modifySauceById,
};
