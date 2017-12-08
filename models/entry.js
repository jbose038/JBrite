const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    apply:{type: Boolean},
    org: {type:String},
    reason: {type:String},
    event: { type: Schema.Types.ObjectId, ref: 'EVT' },
    survey: {type: Boolean, default: false},
    review: {type:String},
    answer: {type:String},
    createdAt: {type: Date, default: Date.now},
    favorite:{type: Boolean, default: false}
  }, {
    toJSON: { virtuals: true},
    toObject: {virtuals: true}
  });
  schema.plugin(mongoosePaginate);
  var EntryList = mongoose.model('Entry', schema);
  
  module.exports = EntryList;