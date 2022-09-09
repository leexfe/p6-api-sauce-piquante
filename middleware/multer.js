// Invoque la librairie qui permet de gérer les fichiers entrants dans les requêtes pour pouvoir lire les données en Form/Data
const multer = require("multer");

// Permet de configurer la destination et le nom du fichier image pour les fichiers entrants:
const storage = multer.diskStorage({
  destination: "images/",
  filename: function (req, file, callback) {
    callback(null, makeFilename(req, file)); //donc 1er argument req
  },
});

// Fabrique la constante fileName pour le retourner au middleware avant que le controller puisse l'utiliser :
function makeFilename(req, file) {
  console.log("req, file:", file);
  //Date.now évite les doublons pour les noms de fichiers entrants - originalname précise jpeg, tiff, png - replace supprime les espaces et remplace par un tiret
  const fileName = `${Date.now()}-${file.originalname}`.replace(/\s/g, "-"); 
  file.fileName = fileName;
  return fileName;
}

// Permet d'uploader une image sur le serveur à l'aide du storage configuré:
const upload = multer({ storage: storage }).single("image");


module.exports = { upload };
