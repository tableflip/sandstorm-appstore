/*****************************************************************************/
/* Server Only Methods */
/*****************************************************************************/
var Future = Npm.require('fibers/future');

Meteor.startup(function () {
  if (Categories.find().count() === 0) {
    Meteor.call('seedCatagories')
  }
  if (Meteor.users.find().count() === 0) {
    Meteor.call('seedUser')
  }
})

Meteor.methods({
  'user/toggleAutoupdate': function() {

    this.unblock();
    if (!this.userId) return false;

    var user = Meteor.users.findOne(this.userId);
    return Meteor.users.update(this.userId, {
      $set: {
        autoupdateApps: !(user && user.autoupdateApps)
      }
    });

  },

  'user/uninstallApp': function(appId) {

    this.unblock();
    if (!this.userId) return false;

    var unset = {};

    unset['installedApps.' + appId] = true;
    return Meteor.users.update(this.userId, {
      $unset: unset
    });

  },

  'user/installApp': function(appId) {

    // TODO: actually install the app!
    this.unblock();
    if (!this.userId) return false;
    var app = Apps.findOne(appId);
    if (!app) return false;

    var set = {};

    set['installedApps.' + appId] = {
      version: _.last(app.versions),
      dateTime: new Date()
    };
    return Meteor.users.update(this.userId, {
      $set: set
    });

  },

  'user/updateApp': function(appId) {

    // TODO: actually update the app!
    this.unblock();
    if (!this.userId) return false;
    var app = Apps.findOne(appId);
    if (!app) return false;

    var set = {},
        userId = this.userId;

    set['installedApps.' + appId] = {
      version: app.latestVersion(),
      dateTime: new Date()
    };
    // The update is recorded only after an interval as livedata will automatically
    // inform the client, which will result in the UI updating.  We need to give
    // the "app updated" animation time to play before this happens.
    Meteor.setTimeout(function() {
      Meteor.users.update(userId, {
        $set: set
      });
    }, 3000);
    return true;

  },

  'user/updateAllApps': function() {

    // TODO: actually update the apps!
    this.unblock();
    if (!this.userId) return false;

    Genres.findIn('Updates Available', {}, {}, this).forEach(function(app) {

      Meteor.call('user/updateApp', app._id);

    });

    return true;

  },

  'user/save-app': function(app) {

    this.unblock();
    if (!this.userId) return false;

    // check(app, Schemas.AppsBase);  TODO: should we be validating here? User should be able to save in place.
    Meteor.users.update(this.userId, {$set: {savedApp: app}});

  },

  'user/delete-saved-app': function() {

    this.unblock();
    if (!this.userId) return false;

    Meteor.users.update(this.userId, {$unset: {savedApp: 1}});

  },

  'user/submit-app': function(app) {

    var fut = new Future();

    this.unblock();
    if (!this.userId) return false;
    if (this.userId !== app.author) throw new Meteor.Error('wrong author', 'Can only submit app by logged-in user');

    Apps.insert(app, function(err, res) {
      console.log(err, res);
      if (err) throw new Meteor.Error(err.message);
      else fut.return(res);
    });

    return fut.wait();

  },

  'user/chip-in': function(appId, amount) {

    this.unblock();

    check(amount, Number);
    check(amount, Match.Where(function(amount) {return (0 < amount) && (40 >= amount);}));

    var user = Meteor.users.findOne(this.userId),
        app = Apps.findOne(appId);

    if (!user) throw new Meteor.Error('no authenticated user', 'Cannot chip in if user is not authenticated');
    if (!Apps.findOne(appId)) throw new Meteor.Error('no matching app', 'Cannot chip in for an app which is not in the database');

    // TODO: Actually make a payment
    console.log('User ' + user.username + ' wants to chip in ' + amount + ' for the app ' + app.name);

    return true;

  },

  'user/flag-app': function(appId, flag) {

    this.unblock();
    if (!this.userId) return false;

    if (!Apps.findOne(appId)) throw new Meteor.Error('no matching app', 'Cannot submit a review for an app which is not in the database');

    var userFlag = {},
        appFlag = {};

    appFlag['flags.' + this.userId] = flag;
    userFlag['flags.' + appId] = flag;

    Apps.update(appId, {$set: appFlag});
    Meteor.users.update(this.userId, {$set: userFlag});

    return true;

  },

  'user/review-app': function(appId, review) {

    this.unblock();
    if (!this.userId) return false;

    check(review.stars, Match.Where(function(stars) {return (0 < stars) && (5 >= stars);}));
    check(review.stars, Match.Integer);
    check(review.text, String);
    check(review.text, Match.Where(function(text) {return text.length > 0;}));

    if (!Apps.findOne(appId)) throw new Meteor.Error('no matching app', 'Cannot submit a review for an app which is not in the database');

    var userReviewObj = {};

    review.createdAt = new Date();
    userReviewObj['appReviews.' + appId] = review;

    Meteor.users.update(this.userId, {$set: userReviewObj});

    return true;

  },

  'apps/togglePrivate': function(appId) {

    this.unblock();
    var app = Apps.findOne(appId);
    if (!app || app.author !== this.userId) return false;

    Apps.update(appId, {$set: {public: !app.public}});

    return true;

  },

  'seedCatagories': function () {
    var cats = [ 
      { name: 'Social', showSummary: true },
      { name: 'Project Management', showSummary: true },
      { name: 'Publishing', showSummary: true },
      { name: 'Games', showSummary: true },
      { name: 'Email', showSummary: true },
      { name: 'Media', showSummary: true },
      { name: 'Science', showSummary: true },
      { name: 'Accounting', showSummary: true },
      { name: 'Productivity', showSummary: true } ]
    _.each(cats, function (cat) {
      Categories.insert(cat)
    })
  },

  'seedUser': function () {
    var user = {
      username: 'tableflip',
      fullname: 'tableflip admin',
      email: 'richard@tableflip.io'
    }
    Meteor.users.insert(user)
  }

});
