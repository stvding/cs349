/*jslint browser: true*/
/*jslint nomen: true*/
/*global chai, describe, it, beforeEach, createModelModule, sinon*/
'use strict';

var expect = chai.expect;

describe('Provided unit tests', function () {
    describe('ImageModel', function () {
        var modelModule, imageModel;

        beforeEach(function () {
            modelModule = createModelModule();
            imageModel = new modelModule.ImageModel("sample_image.png", new Date(1), "sample_caption", 3);
        });

        it('raises an error if invalid arguments are specified', function () {
            var goodPath = "sample_image.png", goodDate = new Date(),
                goodCaption = "sample caption", goodRating = 2,
                badPath = 2, badDate = "february 7",
                badCaption = [], badRating = 6;

            expect(modelModule.ImageModel.bind(modelModule, badPath, goodDate, goodCaption, goodRating)).to.throw(Error);
            expect(modelModule.ImageModel.bind(modelModule, goodPath, badDate, goodCaption, goodRating)).to.throw(Error);
            expect(modelModule.ImageModel.bind(modelModule, goodPath, goodDate, badCaption, goodRating)).to.throw(Error);
            expect(modelModule.ImageModel.bind(modelModule, goodPath, goodDate, goodCaption, badRating)).to.throw(Error);
        });

        it('sets the rating correctly', function () {
            expect(imageModel.getRating()).to.equal(3);
            imageModel.setRating(1);
            expect(imageModel.getRating()).to.equal(1);
        });

        it('sets the caption correctly', function () {
            expect(imageModel.getCaption()).to.equal("sample_caption");
            imageModel.setCaption("another caption");
            expect(imageModel.getCaption()).to.equal("another caption");
        });

        /*
        it('updates the modfication time after setting the rating', function () {
            var initialDate = imageModel.getModificationDate(), newDate;

            imageModel.setRating(5);
            newDate = imageModel.getModificationDate();
            expect(newDate).to.not.eql(initialDate);
        });

        it('updates the modification time after setting the caption', function () {
            var initialDate = imageModel.getModificationDate(), newDate;

            imageModel.setCaption("another caption");
            newDate = imageModel.getModificationDate();
            expect(newDate).to.not.eql(initialDate);
        });
       */

        it('calls the listener after setting a caption', function () {
            var listener = sinon.spy();

            imageModel.addListener(listener);
            imageModel.setCaption("another caption");
            expect(listener.callCount, 'listener should be called once').to.equal(1);
            expect(listener.calledWith(sinon.match.date));
        });

        it('calls the listener after setting a rating', function () {
            var listener = sinon.spy();

            imageModel.addListener(listener);
            imageModel.setRating(5);
            expect(listener.callCount, 'listener should be called once').to.equal(1);
            expect(listener.calledWith(sinon.match.date));
        });

        it('removes the listener correctly', function () {
            var listener = sinon.spy();

            imageModel.addListener(listener);
            imageModel.setRating(5);
            expect(listener.callCount, 'listener should be called once').to.equal(1);

            imageModel.removeListener(listener);
            imageModel.setRating(2);
            expect(listener.callCount, 'listener should not be called agained').to.equal(1);
        });
    });

    describe('ImageCollectionModel', function () {
        var modelModule, imageModel, imageCollectionModel;

        beforeEach(function () {
            modelModule = createModelModule();
            imageModel = new modelModule.ImageModel("sample_image.png", new Date(1), "sample_caption", 3);
            imageCollectionModel = new modelModule.ImageCollectionModel();
        });

        it('is notified of changes to its imageModels', function () {
            var listener = sinon.spy();

            imageCollectionModel.addListener(listener);
            imageCollectionModel.addImageModel(imageModel);
            expect(imageCollectionModel.getImageModels().length).to.equal(1);
            expect(imageCollectionModel.getImageModels()[0]).to.eql(imageModel);
            expect(listener.callCount, 'listener is called once when adding an image model').to.equal(1);

            imageModel.setRating(0);
            expect(listener.callCount, 'listener is called when model changes').to.equal(2);
            imageModel.setCaption("blabla");
            expect(listener.callCount, 'listener is called when model changes').to.equal(3);
        });

        it('correctly removes an image model', function () {
            var listener = sinon.spy();

            imageCollectionModel.addListener(listener);
            imageCollectionModel.addImageModel(imageModel);
            expect(imageCollectionModel.getImageModels().length).to.equal(1);
            expect(imageCollectionModel.getImageModels()[0]).to.eql(imageModel);
            expect(listener.callCount, 'listener is called once when adding an image model').to.equal(1);

            imageModel.setRating(0);
            expect(listener.callCount, 'listener is called when model changes').to.equal(2);

            imageCollectionModel.removeImageModel(imageModel);
            expect(listener.callCount, 'listener is called when image is removed').to.equal(3);
            expect(imageCollectionModel.getImageModels().length).to.equal(0);

            imageModel.setRating(2);
            expect(listener.callCount, 'listener is not called when model changes').to.equal(3);

            // let's just check that the imagemodel is working still!
            expect(imageModel.getRating()).to.equal(2);
        });

        it('handles multiple images and their listeners', function () {
            var listener = sinon.spy(),
                listener2 = sinon.spy(),
                listener3 = sinon.spy(),
                imageModel2 = new modelModule.ImageModel("other_path",
                                                         new Date(),
                                                         "some_caption",
                                                         5);

            listener.withArgs('IMAGE_ADDED_TO_COLLECTION_EVENT');
            listener.withArgs('IMAGE_META_DATA_CHANGED_EVENT');
            listener.withArgs('IMAGE_REMOVED_FROM_COLLECTION_EVENT');

            imageCollectionModel.addListener(listener);
            imageCollectionModel.addImageModel(imageModel);
            imageCollectionModel.addImageModel(imageModel2);

            imageModel.addListener(listener2);
            imageModel2.addListener(listener3);

            expect(listener.withArgs('IMAGE_ADDED_TO_COLLECTION_EVENT')
                   .callCount, 'listener is called with ADD string when adding images').to.equal(2);
            expect(imageCollectionModel.getImageModels().length).to.equal(2);

            imageModel.setRating(4);
            expect(listener2.callCount, 'appropriate listener is called').to.equal(1);
            expect(listener3.callCount, 'appropriate listener is called').to.equal(0);
            expect(listener.withArgs('IMAGE_META_DATA_CHANGED_EVENT')
                   .callCount, 'collection listener with META string is called when image changes').to.equal(1);

            imageModel2.setRating(4);
            expect(listener2.callCount, 'appropriate listener is called').to.equal(1);
            expect(listener3.callCount, 'appropriate listener is called').to.equal(1);
            expect(listener.withArgs('IMAGE_META_DATA_CHANGED_EVENT').
                   callCount, 'collection listener is called with META string when image changes').to.equal(2);

            imageCollectionModel.removeImageModel(imageModel2);
            expect(imageCollectionModel.getImageModels()[0]).to.eql(imageModel);
            expect(imageCollectionModel.getImageModels().length).to.equal(1);
            expect(listener.withArgs('IMAGE_REMOVED_FROM_COLLECTION_EVENT').
                   callCount, 'collection listener with REMOVE string is called when image is removed').to.equal(1);

            imageModel2.setRating(2);
            expect(listener.callCount, 'collection listener is not called after model is deleted').to.equal(5);
            expect(listener2.callCount, 'appropriate listener is called').to.equal(1);
            expect(listener3.callCount, 'appropriate listener is called').to.equal(2);

            imageModel.setRating(2);
            expect(listener.withArgs('IMAGE_META_DATA_CHANGED_EVENT').
                   callCount, 'collection listener is called with META string').to.equal(3);
            expect(listener2.callCount, 'appropriate listener is called').to.equal(2);
            expect(listener3.callCount, 'appropriate listener is called').to.equal(2);

            imageCollectionModel.removeImageModel(imageModel);
            expect(imageCollectionModel.getImageModels().length).to.equal(0);
            expect(listener.withArgs('IMAGE_REMOVED_FROM_COLLECTION_EVENT').
                   callCount, 'collection listener is called with REMOVE string when image is removed').to.equal(2);
        });
    });
});
