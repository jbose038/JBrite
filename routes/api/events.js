const express = require('express');
const EVT = require('../../models/question');
const catchErrors = require('../../lib/async-error');

const router = express.Router();

// Index
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const events = await EVT.paginate({}, {
    sort: {createdAt: -1}, 
    populate: 'author',
    page: page, limit: limit
  });
  res.json({events: events.docs, page: events.page, pages: events.pages});   
}));

// Read
router.get('/:id', catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id).populate('author');
  res.json(event);
}));

// Create
router.post('', catchErrors(async (req, res, next) => {
  var event = new EVT({
    author: user._id,
    title: req.body.title,
    location: req.body.location,
    date_start: req.body.date_start,
    date_end: req.body.date_end,
    description: req.body.description,
    org_name: req.body.org_name,
    org_comment: req.body.org_comment,
    evt_type: req.body.evt_type,
    evt_topic: req.body.evt_topic,
    payment: req.body.payment,
    maxJoined: req.body.maxJoined
  });
  await event.save();
  res.json(event)
}));

// Put
router.put('/:id', catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  if (!event) {
    return next({status: 404, msg: 'Not exist question'});
  }
  if (event.author && event.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  title: req.body.title;
  location: req.body.location;
  date_start: req.body.date_start;
  date_end: req.body.date_end;
  description: req.body.description;
  org_name: req.body.org_name;
  org_comment: req.body.org_comment;
  evt_type: req.body.evt_type;
  evt_topic: req.body.evt_topic;
  payment: req.body.payment;
  maxJoined: req.body.maxJoined;
  await question.save();
  res.json(question);
}));

// Delete
router.delete('/:id', catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  if (!event) {
    return next({status: 404, msg: 'Not exist question'});
  }
  if (event.author && event.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  await EVT.findOneAndRemove({_id: req.params.id});
  res.json({msg: 'deleted'});
}));


//payment = free
router.post('events/new/free',catchErrors(async (req,res,next) =>{
}));

//payment = paid
router.post('events/new/paid',catchErrors(async (req,res,next) =>{
}));
module.exports = router;