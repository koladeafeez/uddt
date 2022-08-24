const express = require('express'),
    router = express.Router(),
    faqService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');

// create
router.post( '/',[ auth, accessControl.isAdmin], faqService.create );
//update
router.put( '/:faqId', [ auth, accessControl.isAdmin ], faqService.update );

// get by id
router.get( '/:faqId', [ auth, accessControl.isCarOwner ], faqService.get );

// delete
router.delete( '/:faqId', [ accessControl.isAdmin ], faqService.delete );

// get All
router.get('/',[auth,accessControl.isCarOwner],faqService.getAll)


module.exports = router;