const multer = require("multer"),

//specify file name to store and storage location
storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname );
  }
}),
   
//validate file mime type
fileFilter = (req, file, cb) => {
  try {
    //reject file
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/svg' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/pdf'){

      cb(null, true);
    }else{
      cb('Sorry, this form accepts only documents or images', false);
    }
  } catch (error) {
    handleError(error, res);
  }
},
  
//limit upload
upload = multer({ 
  storage: storage,
  limits:{ fileSize: 1024 * 1024 *10 },
  fileFilter: fileFilter,
});

module.exports = { upload };