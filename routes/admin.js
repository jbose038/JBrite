const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');

function needAdmin(req,res,next) {
    if(req.user && req.user.isAdmin)
        next();
    else{
        req.flash('danger', 'NOT Admin user');
        res.redirect('/');
    }
}

router.get('/', needAdmin, catchErrors( async(req,res,next) =>{
    res.render('admin/index');
}))



module.exports = router;