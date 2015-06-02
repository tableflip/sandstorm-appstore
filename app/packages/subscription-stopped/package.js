Package.describe({
  name: 'richsilv:subscription-stopped',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Adds a reactive "stopped" method to subscription handles, which is updated by the built-in "onStop" callback',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.addFiles('subscription-stopped.js', ['client']);
  api.use('meteorhacks:flow-router@1.7.1', ['client'], {weak: true});
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('subscription-stopped');
  api.addFiles('subscription-stopped-tests.js');
});
