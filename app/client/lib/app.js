var helpers = {

  getUsername: function(_id) {

    var user = Meteor.users.findOne(_id);

    return user && user.username;

  },

  equal: function(a, b) {

    return a === b;

  },

  prune: function(string, length) {

    return s.prune(string, length);

  },

  routerSubsReady: function(name) {

    return name ? FlowRouter.subsReady(name) : FlowRouter.subsReady();

  },

  count: function(cursor) {

    return cursor.count();

  },

  skipLimit: function(iterable, skip, limit) {

    if (typeof iterable.fetch === 'function') iterable = iterable.fetch();
    if (!Array.isArray(iterable)) return [];

    if (limit) return iterable.slice(skip, skip + limit);
    else return iterable.slice(skip);

  },

  // DEBUGGING

  logThis: function() {

    console.log(this);

  }

};

_.forEach(helpers, function(val, key) {
  Template.registerHelper(key, val);
});
