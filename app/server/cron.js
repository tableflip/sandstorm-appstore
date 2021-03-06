// SyncedCron.add({
//   name: 'Generate fake apps',
//   schedule: function(parser) {
//     return parser.text('every 5 seconds');
//   },
//   job: function() {
//     if (Apps.find().count() < 200)
//       return App.fakeApp();
//     else return 'full';
//   }
// });

// SyncedCron.add({
//   name: 'Approve/Reject fake apps',
//   schedule: function(parser) {
//     return parser.text('every 2 minutes');
//   },
//   job: function() {
//
//     Apps.find({approved: 1}).forEach(function(app) {
//
//       Apps.update(app._id, {$set: {approved: _.sample([0, 0, 0, 2, 3])}});
//
//     });
//
//   }
// });

// SyncedCron.add({
//   name: 'Update fake apps',
//   schedule: function(parser) {
//     return parser.text('every 3 seconds');
//   },
//   job: function() {
//
//     _.each(Meteor.server.sessions, function(session) {
//
//       var user = Meteor.users.findOne(session.userId);
//       if (!user || _.isEmpty(user.installedApps)) return false;
//
//       var app = Apps.findOne(_.sample(_.keys(user.installedApps)));
//
//       if (!app) return false;
//
//       Apps.update(app._id, {$push: {
//         versions: {
//           number: newVersion(_.last(app.versions).number),
//           changes: faker.lorem.sentences(2),
//           dateTime: new Date()
//         }
//       }});
//
//     });
//   }
// });
//
SyncedCron.add({
  name: 'Autoupdate apps',
  schedule: function(parser) {
    return parser.recur().on('01:00:00').time();
  },
  job: autoupdateApps
});

SyncedCron.start();

function newVersion(version) {

  var nums = version.split('.'),
      lIn = Math.floor(Math.random() * nums.length);

  nums[lIn] = parseInt(nums[lIn], 10) + 1;

  return nums.join('.');

}

function autoupdateApps() {

    Meteor.users.find({autoupdateApps: true}).forEach(function(user) {
      Genres.findIn('Updates Available', {}, {}, {userId: user._id}).forEach(function(app) {
        var set = {};

        // TODO: actually update the app!
        set['installedApps.' + app._id] = {
          version: app.latestVersion(),
          dateTime: new Date()
        };
        Meteor.users.update(user._id, {
          $set: set
        });
      });
    });

}

function oldDate() { var d = new Date(); d -= Math.random() * 1000 * 60 * 60 * 24 * 7; return new Date(d); }

App.fakeApp = function() {

  var categories = _.pluck(Categories.find({approved: 0}, {fields: {name: 1}}).fetch(), 'name'),
      users = _.pluck(Meteor.users.find({}, {fields: {_id: 1}}).fetch(), '_id'),
      app = {
        name: faker.company.bs(),
        categories: _.sample(categories, _.sample([1, 2, 3])),
        description: faker.lorem.paragraph(),
        image: 'http://www.gravatar.com/avatar/?d=retro',
        approved: 1,
        author: _.sample(users),
        versions: [{
          number: '0.0.1',
          dateTime: new Date()
        }],
        updatedAt: oldDate(),
        spkLink: 'http://exampleurl.com/spkfile.spk'
      };

  return Apps.insert(app);

};
