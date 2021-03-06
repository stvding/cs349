'use strict';

var expect = chai.expect;
describe('Demo tests', function() {

    it('Some tests', function() {
        /*
         We're using Mocha and Chai to do unit testing.

         Mocha is what sets up the tests (the "describe" and "it" portions), while
         Chai does the assertion/expectation checking.

         Links:
         Mocha: http://mochajs.org
         Chai: http://chaijs.com

         Note: This is a bunch of tests in one it; you'll probably want to separate them
         out into separate groups to make debugging easier. It's also more satisfying
         to see a bunch of unit tests pass on the results page :)
        */

        // Here is the most basic test you could think of:
        expect(1==1, '1==1').to.be.ok;

        // You can also for equality:
        expect(1, '1 should equal 1').to.equal(1);

        // JavaScript can be tricky with equality tests
        expect(1=='1', "1 should == '1'").to.be.true;

        // Make sure you understand the differences between == and ===
        expect(1==='1', "1 shouldn't === '1'").to.be.false;

        // Use eql for deep comparisons
        expect([1] == [1], "[1] == [1] should be false because they are different objects").to.be.false;

        expect([1], "[1] eqls [1] should be true").to.eql([1]);
    });

    it('Callback demo unit test', function() {
        /*
        Suppose you have a function or object that accepts a callback function,
        which should be called at some point in time (like, for example, a model
        that will notify listeners when an event occurs). Here's how you can test
        whether the callback is ever called.
         */

        // First, we'll create a function that takes a callback, which the function will
        // later call with a single argument. In tests below, we'll use models that
        // take listeners that will be later called
        var functionThatTakesCallback = function(callbackFn) {
            return function(arg) {
                callbackFn(arg);
            };
        };

        // Now we want to test if the function will ever call the callbackFn when called.
        // To do so, we'll use Sinon's spy capability (http://sinonjs.org/)
        var spyCallbackFn = sinon.spy();

        // Now we'll create the function with the callback
        var instantiatedFn = functionThatTakesCallback(spyCallbackFn);

        // This instantiated function should take a single argument and call the callbackFn with it:
        instantiatedFn("foo");

        // Now we can check that it was called:
        expect(spyCallbackFn.called, 'Callback function should be called').to.be.ok;

        // We can check the number of times called:
        expect(spyCallbackFn.callCount, 'Number of times called').to.equal(1);

        // And we can check that it got its argument correctly:
        expect(spyCallbackFn.calledWith('foo'), 'Argument verification').to.be.true;

        // Or, equivalently, get the first argument of the first call:
        expect(spyCallbackFn.args[0][0], 'Argument verification 2').to.equal('foo');

        // This should help you understand the listener testing code below
    });
});

describe('Activity Store Model', function() {
    it ('adds data points correctly', function() {
        var activityModel = new ActivityStoreModel();
        var my_data_point1 = new ActivityData("test activity", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 25);
        activityModel.addActivityDataPoint(my_data_point1);
        expect(activityModel.getActivityDataPoints().length).to.equal(1);
        expect(activityModel.getActivityDataPoints()[0]).to.eql(my_data_point1);

        var my_data_point2 = new ActivityData("test activity 2", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 35);
        activityModel.addActivityDataPoint(my_data_point2);
        expect(activityModel.getActivityDataPoints().length).to.equal(2);
        expect(activityModel.getActivityDataPoints()).to.eql([ my_data_point1, my_data_point2 ]);
    });

    it ('removes data points correctly', function() {
        var activityModel = new ActivityStoreModel();
        var my_data_point1 = new ActivityData("test activity", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 25);
        activityModel.addActivityDataPoint(my_data_point1);
        expect(activityModel.getActivityDataPoints().length).to.equal(1);
        expect(activityModel.getActivityDataPoints()[0]).to.eql(my_data_point1);

        var my_data_point2 = new ActivityData("test activity 2", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 35);
        activityModel.addActivityDataPoint(my_data_point2);
        expect(activityModel.getActivityDataPoints().length).to.equal(2);
        expect(activityModel.getActivityDataPoints()[1]).to.eql(my_data_point2);

        activityModel.removeActivityDataPoint(my_data_point2);
        expect(activityModel.getActivityDataPoints().length).to.equal(1);
        expect(activityModel.getActivityDataPoints()[0]).to.eql(my_data_point1);

        activityModel.removeActivityDataPoint(my_data_point1);
        expect(activityModel.getActivityDataPoints().length).to.equal(0);
    });

    it ('calls the listener after adding a data point', function() {
        var activityModel = new ActivityStoreModel();
        var my_data_point1 = new ActivityData("test activity", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 25);
        var my_data_point2 = new ActivityData("test activity 2", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 35);
        var firstListener = sinon.spy();

        activityModel.addListener(firstListener);
        activityModel.addActivityDataPoint(my_data_point1);

        expect(firstListener.callCount, 'firstListener should be called once').to.equal(1);
        expect(firstListener.called, 'Listener should be called').to.be.ok;
        expect(firstListener.calledWith('ACTIVITY_DATA_ADDED_EVENT', sinon.match.any, my_data_point1), 'AcivityModel argument verification').to.be.true;

        // test listener removal
        activityModel.removeListener(firstListener);
        activityModel.addActivityDataPoint(my_data_point1);
        activityModel.addActivityDataPoint(my_data_point2);
        expect(firstListener.callCount, 'firstListener should be called twice (deletion and removal)').to.equal(1);
    });

    it ('calls the listener after removing a data point, IFF the data point exists', function() {
        var activityModel = new ActivityStoreModel();
        var my_data_point1 = new ActivityData("test activity", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 25);
        var my_data_point2 = new ActivityData("test activity 2", {energyLevel: 10, stressLevel: 10, happinessLevel: 10}, 35);
        var firstListener = sinon.spy();

        activityModel.addListener(firstListener);
        activityModel.addActivityDataPoint(my_data_point1);

        // should not alert listeners
        activityModel.removeActivityDataPoint(my_data_point2);
        expect(firstListener.callCount, 'firstListener should not be called when data point does not exist').to.equal(1);

        // should alert listeners
        activityModel.removeActivityDataPoint(my_data_point1);
        expect(firstListener.callCount, 'firstListener should be called twice (deletion and removal)').to.equal(2);
        expect(firstListener.called, 'Listener should be called').to.be.ok;
        expect(firstListener.calledWith('ACTIVITY_DATA_REMOVED_EVENT', sinon.match.any, my_data_point1), 'AcivityModel argument verification').to.be.true;

    });

});

describe('Graph Model', function() {
    it('calls listeners upon graph selection', function() {
        var graphModel = new GraphModel();
        var firstListener = sinon.spy();

        graphModel.addListener(firstListener);
        graphModel.selectGraph("MyGraph");

        expect(firstListener.called, 'GraphModel listener should be called').to.be.ok;
        expect(firstListener.calledWith('GRAPH_SELECTED_EVENT', sinon.match.any, 'MyGraph'), 'GraphModel argument verification').to.be.true;

        var secondListener = sinon.spy();
        graphModel.addListener(secondListener);
        graphModel.selectGraph("MyGraph");
        expect(firstListener.callCount, 'GraphModel first listener should have been called twice').to.equal(2);
        expect(secondListener.called, "GraphModel second listener should have been called").to.be.ok;
        expect(secondListener.calledWith('GRAPH_SELECTED_EVENT', sinon.match.any, 'MyGraph'), 'GraphModel argument verification').to.be.true;
    });

    it('removes listeners correctly', function() {
        var graphModel = new GraphModel();
        var firstListener = sinon.spy();
        var secondListener = sinon.spy();

        graphModel.addListener(firstListener);
        graphModel.addListener(secondListener);
        graphModel.selectGraph("MyGraph");

        expect(firstListener.callCount, 'GraphModel first listener should have been called once').to.equal(1);
        expect(secondListener.callCount, 'GraphModel second listener should have been called once').to.equal(1);

        graphModel.removeListener(firstListener);
        graphModel.selectGraph("MyGraph");

        expect(firstListener.callCount, 'GraphModel first listener should have been called once').to.equal(1);
        expect(secondListener.callCount, 'GraphModel second listener should have been called twice').to.equal(2);
    });

    it('returns the current graph name', function() {
        var graphModel = new GraphModel();

        graphModel.selectGraph("MyGraph");
        expect(graphModel.getNameOfCurrentlySelectedGraph()).to.equal("MyGraph");

        graphModel.selectGraph("MyGraph2");
        expect(graphModel.getNameOfCurrentlySelectedGraph()).to.equal("MyGraph2");
    });

    it('returns the available graph names', function() {
        //TODO
    });
});


