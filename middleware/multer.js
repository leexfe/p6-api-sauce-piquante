const multer = require("multer");

// Permet d'envoyer à la bonne destination le fichier image au bon format pou
const storage = multer.diskStorage({
  destination: "images/",
  filename: function (req, file, callback) {
    callback(null, makeFilename(req, file)); //donc 1er argument req
  },
});

  // Recupere la requete pour coller const fileName ds la requete
function makeFilename(req, file) {

  console.log("req, file:", file);
  const fileName = `${Date.now()}-${file.originalname}`.replace(/\s/g, "-"); //Date.now pour eviter les doublons pour les noms envoyés enregistrés// originalname pour preciser jpeg ou tiff ou png...
  //replace permet de supprimer les espaces(voir Whitespace) et les remplace en 2 eme param avec un tiret
  //req.fileName = fileName
  file.fileName = fileName;
  return fileName; // on retourne un nom de fichier qui transforme la requète avant que le controller  puisse l'utiliser pour y générer une réponse
}

const upload = multer({ storage: storage }).single("image");
//const upload = multer({ storage }).single("image"); qd clé et valeur ont le même nom on peut garder qu'un seul nommage

  module.exports =   { upload };
