var oldSubscribe = Meteor.subscribe;

function stopped(handleObjs) {
  return _.every(handleObjs, function(sub) {
    return sub.handle.stopped();
  });
}

function ready(handleObjs) {
  return _.every(handleObjs, function(sub) {
    return sub.handle.ready();
  });
}

Meteor.startup(function() {
  if (window.FlowRouter) {
    FlowRouter.newSubs = new ReactiveVar([]);
    FlowRouter.oldSubs = new ReactiveVar([]);

    FlowRouter.allStopped = function() {
      console.log(FlowRouter.oldSubs.get());
      return stopped(FlowRouter.oldSubs.get());
    };
  }
});

Meteor.subscribe = function() {

  var args = Array.prototype.slice.call(arguments, 0),
      pubName = args.shift(),
      lastItem = args[args.length - 1],
      callbacks = {},
      stopped = new ReactiveVar(false),
      oldOnStop,
      oldOnReady,
      methodArguments,
      handleObj = {};

  if (lastItem) {
    if (_.isFunction(lastItem)) {
      callbacks.onReady = lastItem;
      args.pop();
    }
    else if (lastItem.onReady || lastItem.onStop) {
      oldOnReady = lastItem.onReady;
      oldOnStop = lastItem.onStop;
      args.pop();
    }
  }
  if (!_.isEmpty(callbacks)) args.pop();

  callbacks.onStop = function() {
    stopped.set(true);
    if (window.FlowRouter) {
      var oldSubs = FlowRouter.oldSubs.get();

      oldSubs = _.reject(oldSubs, function(sub) {
        return sub.handle.subscriptionId === handleObj.handle.subscriptionId;
      });

      FlowRouter.oldSubs.set(oldSubs);
    }
    oldOnStop && oldOnStop.apply(this, arguments);
  };

  if (window.FlowRouter) {
    callbacks.onReady = function() {
      var newSubs = FlowRouter.newSubs.curValue;
      newSubs.push(handleObj);
      FlowRouter.newSubs.set(newSubs);
      oldOnReady && oldOnReady.apply(this, arguments);
    };
  }
  else callbacks.onReady = oldOnReady;

  methodArguments = [pubName].concat(args).concat(callbacks);
  handleObj.handle = oldSubscribe.apply(this, methodArguments);
  handleObj.handle.stopped = function() {
    return stopped.get();
  };

  if (window.FlowRouter) {
    var oldStop = handleObj.handle.stop;
    handleObj.handle.stop = function() {
      var _this = this,
          newSubs = FlowRouter.newSubs.get(),
          oldSubs = FlowRouter.oldSubs.get(),
          subHandleIdx;

      _.find(newSubs, function(sub, idx) {
        if (sub.handle.subscriptionId === _this.subscriptionId) {
          subHandleIdx = idx;
          return true;
        }
      });

      if (subHandleIdx) {
        oldSubs = oldSubs.concat(newSubs.splice(subHandleIdx, 1));
        FlowRouter.newSubs.set(newSubs);
        FlowRouter.oldSubs.set(oldSubs);
      }
      oldStop && oldStop.apply(this, arguments);
    };
  }

  return handleObj.handle;
};
