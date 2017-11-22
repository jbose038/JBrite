const express = require('express');
const EVT = require('../models/event');
const router = express.Router();
const catchErrors = require('../lib/async-error');
const multer = require('multer');

function validateEvent(form, options) {
  var title = form.title || "";
  var location = form.location || "";
  var date_start = form.date_start || "";
  var date_end = form.date_end || "";
  var org_name = form.org_name || "";
  var org_comment = form.org_comment || "";
  var evt_type = form.evt_type || "Select the type of event";
  var evt_topic = form.evt_topic || "Select a topic";

  title = title.trim();
  location = location.trim();
  date_start = date_start.trim();
  date_end = date_end.trim();
  org_name = org_name.trim();;
  org_comment = org_comment.trim();

  if (!title) {return 'title is required.';}
  if (!location) {return 'location is required.';}
  if (!date_start) {return 'date is required.';}
  if (!date_end) {return 'date is required.';}
  if (date_start > date_end) {return 'corrent date is required';}
  if (!org_name) {return 'organization name is required.';}
  if (!org_comment) {return 'organization description is required.';}
  if (evt_type == "Select the type of event") {return 'event type is required.';}
  if (evt_topic == "Select a topic") {return 'event topic is required.';}

  return null;
}

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

router.get('/', needAuth, catchErrors(async (req, res, next) => {
  const events = await EVT.find({});
  res.render('events/list', {events: events});
}));

/*
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {location: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const events = await EVT.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('events/list', {events: events, term: term});
}));
*/

router.get('/new', needAuth, (req, res, next) => {
  res.render('events/new', {messages: req.flash()});
});

router.post('/', needAuth, catchErrors(async (req,res,next) => {
  const err = validateEvent(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var event = await EVT.findOne({title:req.body.title});
  console.log('create???',event)
  if (event) {
    req.flash('danger', 'Event already exists.');
    return res.redirect('back');
  }
  const user = req.user;
  event = new EVT({
    author: user._id,
    title: req.body.title,
    location: req.body.location,
    date_start: req.body.date_start,
    date_end: req.body.date_end,
    description: req.body.description,
    org_name: req.body.org_name,
    org_comment: req.body.org_comment,
    evt_type: req.body.evt_type,
    evt_topic: req.body.evt_topic
  });
  await event.save();
  req.flash('success', 'Registered successfully');
  res.redirect('/');
}))

router.get('/:id', catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  res.render('events/detail', {event: event});
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Deleted Successfully.');
  res.redirect('/events');
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  res.render('events/edit', {event: event});
}));

router.put('/:id', needAuth, catchErrors(async (req, res, next) => {
  const err = validateEvent(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  const event = await EVT.findById({_id: req.params.id});

  event.title = req.body.title;
  event.location = req.body.location;
  event.date_start = req.body.date_start;
  event.date_end = req.body.date_end;
  event.description = req.body.description;
  event.org_name = req.body.org_name;
  event.org_comment = req.body.org_comment;
  event.evt_type = req.body.evt_type;
  event.evt_topic = req.body.evt_topic;
  event.payment = req.body.payment;

  await event.save();
  req.flash('success', 'Updated successfully.');
  res.redirect('/');
}));

module.exports = router;