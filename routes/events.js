const express = require('express');
const EVT = require('../models/event');
const User = require('../models/user');
const EntryList = require('../models/entry');
const router = express.Router();
const catchErrors = require('../lib/async-error');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const mimetypes = {
  "image/jpeg" : "jpg",
  "image/gif" : "gif",
  "image/png" : "png"
};
const upload = multer({
  dest: 'tmp',
  fileFilter: (req, file, cb) => {
    var ext = mimetypes[file.mimetype];
    if (!ext){
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
})

function validateEvent(form, options) {
  var title = form.title || "";
  var location = form.location || "";
  var date_start = form.date_start || "";
  var date_end = form.date_end || "";
  var org_name = form.org_name || "";
  var org_comment = form.org_comment || "";
  var evt_type = form.evt_type || "Select the type of event";
  var evt_topic = form.evt_topic || "Select a topic";
  var maxJoined = form.maxJoined || 0;

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
  if (maxJoined < 1){return 'Max Join value should be at least 1'}

  return null;
}
function validateSurvey(req,res,next) {
  var org = req.body.org || "";
  var reason = req.body.reason || "";

  org = org.trim();
  reason = reason.trim();

  if (!org || !reason)
  {
    req.flash('danger', 'fill the body');
    res.redirect('/');
  }
  else
  {
    next();
  }
}

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}
function needAdmin(req, res, next) {
  if (req.isAdmin) {
      next();
  } else {
    req.flash('danger', 'NOT ADMIN User');
    res.redirect('/');
  }
}



router.get('/', needAuth, catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {location: {'$regex': term, '$options': 'i'}},
      {evt_type: {'$regex': term, '$options': 'i'}},
      {evt_topic: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const events = await EVT.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('events/list', {events: events, term: term});
}));


router.get('/new', needAuth, catchErrors(async (req, res, next) => {
  res.render('events/new', {messages: req.flash()});
}));

router.post('/', needAuth, upload.single('img'), catchErrors(async (req,res,next) => {
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
    evt_topic: req.body.evt_topic,
    payment: req.body.payment,
    maxJoined: req.body.maxJoined
  });
  if (req.file) {
    const dest = path.join(__dirname, '../public/images/uploads/');
    console.log("File ->", req.file);
    const filename = req.file.filename + "." + mimetypes[req.file.mimetype];
    await fs.move(req.file.path, dest + filename);
    event.img = "/images/uploads/" + filename;
  }
  await event.save();
  req.flash('success', 'Registered successfully');
  res.redirect('/');
}));

router.post('/:id/favorite', needAuth, catchErrors(async (req,res,body) => {
  const event = await EVT.findById(req.params.id);
  var user = await EntryList.findOne({author: req.user._id, event: event});

  if(!user)
  {
    USER = req.user;
    var entrylist = new EntryList({
      author: USER._id,
      event: event,
      favorite: true
    });

    await entrylist.save();
  }
  else
  {
    if(user.favorite)
    {
      req.flash('danger', 'Already added event');
      return res.redirect('back');
    }
    else
    {
      user.favorite = true;
      await user.save();
    }
    
  }
  
  req.flash('success', 'Successfully added');
  res.redirect('back');
}));

router.post('/:id/entry', needAuth, catchErrors(async (req,res,body) => {
  
  const event = await EVT.findById(req.params.id);
  var user = await EntryList.findOne({author: req.user._id, event: event});
  if(user.apply)
  {
    req.flash('danger', 'You already joined');
    return res.redirect('back');
  }

  user = req.user;

  if(!user)
  {
    var entrylist = new EntryList({
      author: user._id,
      event: event,
      apply: true
    });

    await entrylist.save();
  }
  else
  {
    user.apply = true;
  }
  

  event.numJoined++;
  await user.save();
  await event.save();
  req.flash('success', 'Successfully joined');
  res.redirect('back');
}));
router.post('/:id/survey', needAuth, validateSurvey, catchErrors(async (req,res,body) => {

  const event = await EVT.findById(req.params.id);
  var user = await EntryList.findOne({author: req.user._id, event: event});

  user.survey = true;
  user.org = req.body.org;
  user.reason = req.body.reason;

  await user.save();
  req.flash('success', 'Successfully joined');
  res.redirect('back');
}));
router.post('/:id/review', needAuth, catchErrors(async (req,res,body) => {
  
  const event = await EVT.findById(req.params.id);
  var user = await EntryList.findOne({author: req.user._id, event: event});

  user.review = req.body.review;

  await user.save();
  req.flash('success', 'Successfully registered');
  res.redirect('back');
}));
router.post('/:id/answer', needAuth, catchErrors(async (req,res,body) => {
  
  const event = await EVT.findById(req.params.id);
  var ety = await EntryList.findOne({author: req.user._id, event: event});
  ety.answer = req.body.answer;

  await ety.save();
  await event.save();
  req.flash('success', 'Successfully answered');
  res.redirect('back');
}));
router.delete('/:id/answer', needAuth, catchErrors(async (req,res,body) => {
  
  const event = await EVT.findById(req.params.id);
  var ety = await EntryList.findOne({author: req.user._id, event: event});
  ety.answer = req.body.answer;

  await ety.save();
  await event.save();
  req.flash('success', 'Successfully answered');
  res.redirect('back');
}));

router.get('/:id', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id).populate('author');
  const entrylists = await EntryList.find({event: event.id}).populate('author');
  //console.log(entrylists);
  res.render('events/detail', {event: event, entrylists: entrylists});
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Deleted Successfully.');
  res.redirect('/events');
}));

/*  참가한 자신 목록에서 삭제 */
router.delete('/:id/entry', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  var lst = await EntryList.findOneAndRemove({author: req.user._id, event: event});
  
  lst.survey = false;
  event.numJoined--;
  await event.save();

  req.flash('success', 'Canceled Successfully.');
  res.redirect('back');
}));


router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const event = await EVT.findById(req.params.id);
  res.render('events/edit', {event: event});
}));

router.put('/:id', needAuth, upload.single('img'), catchErrors(async (req, res, next) => {
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

  if (req.file) {
    const dest = path.join(__dirname, '../public/images/uploads/');
    console.log("File ->", req.file);
    const filename = req.file.filename + "." + mimetypes[req.file.mimetype];
    await fs.move(req.file.path, dest + filename);
    event.img = "/images/uploads/" + filename;
  }
  await event.save();
  req.flash('success', 'Updated successfully.');
  res.redirect('/list');
}));

module.exports = router;