  var express = require('express');
  var router = express.Router();
  
  /* GET users listing. */
  router.get('/overview', (req, res, next) => {
    res.render('organize/overview', {title : 'organize/overview'});
  });

  router.get('/pricing', (req, res, next) => {
    res.render('organize/pricing', {title : 'organize/pricing'});
  });

  router.get('/blog', (req, res, next) => {
    res.render('organize/blog', {title : 'organize/blog'});
  });

  router.get('/resources', (req, res, next) => {
    res.render('organize/resources', {title : 'organize/resources'});
  });
  
  module.exports = router;
  