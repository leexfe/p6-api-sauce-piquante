const mongoose = require("mongoose");

const { unlink } = require("fs"); //filesystem
//import {unlink} from 'fs'; crash

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

// Efface la sauce de la base de donnée et enlève de l'affichage sans enlever l'image du back

function deleteSauceById(req, res) {
  console.log("delete la sauce de mongo !!!");
  const id = req.params.id;

  Product.findByIdAndDelete(id)
    //Product.findOneAndDelete({_id: id})
    .then((product) => {
      console.log("product",product );
      deleteImage(product.imageUrl);
    })
    .then(() => res.send({ message: "fonctionne" }))
    .catch((err) => res.status(500).send({ message: err }));
}

// Effacer l'image stockée dans le dossier image du dossier back du projet:
function deleteImage(imageUrl) {
  const fileToDelete = imageUrl.split("/").pop(); //ne garde que la derniere partie
  if (fileToDelete == "") return;
  unlink(`images/${fileToDelete}`, (err) => {
    console.error("problème sur la suppression de l'image", err);
  });
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

module.exports = { getSauces, createSauce, getSauceById, deleteSauceById };
