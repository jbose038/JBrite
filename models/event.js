const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: {type: Schema.Types.ObjectId, ref: 'User'},
  title: {type: String, index: true, unique: true, trim: true},
  location: String,
  date_start: String,
  date_end: String,
  description: String,
  org_name: String,
  org_comment: String,
  evt_type: String,
  evt_topic: String,
  payment: String,
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var EVT = mongoose.model('EVT', schema);

module.exports = EVT;
