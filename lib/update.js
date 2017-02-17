var _ = require('underscore')

/**
 * @constructor Update
 */
var Update = function Update (updateQuery) {
  this.updateQuery = updateQuery
}

Update.prototype.update = function (docs) {
  if (!Array.isArray(docs)) {
    docs = [docs]
  }

  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i]
    var updates = Object.keys(this.updateQuery)

    for (var k = 0; k < updates.length; k++) {
      var key = updates[k]
      var properties = Object.keys(this.updateQuery[key])
      var p
      var prop

      switch (key) {
        case '$set':
          for (p = 0; p < properties.length; p++) {
            prop = properties[p]
            doc[prop] = this.updateQuery[key][prop]
          }

          break
        case '$inc':
          for (p = 0; p < properties.length; p++) {
            prop = properties[p]

            if (_.isFinite(doc[prop]) && _.isFinite(this.updateQuery[key][prop])) {
              doc[prop] = parseInt(doc[prop]) + parseInt(this.updateQuery[key][prop])
            }
          }

          break
        default:

      }
    }
  }

  return docs
}

module.exports = Update