const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    content: {type: String, trim: true, required: true},
    createdAt: {type: Date, default: Date.now}
  }, {
    toJSON: { virtuals: true},
    toObject: {virtuals: true}
  });
  schema.plugin(mongoosePaginate);
  var Entry = mongoose.model('Entry', schema);
  
  module.exports = Entry;