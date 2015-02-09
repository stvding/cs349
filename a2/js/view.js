/*jslint browser: true*/
/*jslint nomen: true*/
/*global $, alert, console, _*/

/**
 * A function that creates and returns all of the model classes and constants.
  */
function createViewModule() {
    'use strict';

    var LIST_VIEW = 'LIST_VIEW',
        GRID_VIEW = 'GRID_VIEW',
        RATING_CHANGE = 'RATING_CHANGE';
    /**
     * An object representing a DOM element that will render the given ImageModel object.
     */
    var ImageRenderer = function (imageModel) {
        this.imageModel = imageModel;
        this.viewType = LIST_VIEW;
        this._init();
    };

    _.extend(ImageRenderer.prototype, {
        _init: function () {
            var imageRendererTemplate,
                that = this,
                metaDataDiv,
                thumbnailDiv;

            imageRendererTemplate = document.getElementById('image-renderer');
            this.imageRendererDiv = document.createElement('div');
            this.imageRendererDiv.appendChild(document.importNode(imageRendererTemplate.content, true));
            metaDataDiv  = this.imageRendererDiv.querySelector(".meta-data");

            function drawStars(index) {
                _.each(metaDataDiv.querySelectorAll('span[class*="icon-star"]'), function (star, indexLoop) {
                    if (index >= indexLoop) {
                        star.className = "icon-star-full";
                    } else {
                        star.className = "icon-star-empty";
                    }
                });
            }

            _.each(metaDataDiv.querySelectorAll('span[class*="icon-star"]'), function (star, index) {
                star.addEventListener('click', function () {
                    if (index + 1 === that.imageModel.getRating()) {
                        // clear rating if same rating selected
                        drawStars(-1);
                        that.imageModel.setRating(0);
                    } else {
                        drawStars(index);
                        that.imageModel.setRating(index + 1);
                    }
                });
            });

            drawStars(this.imageModel.getRating() - 1);

            thumbnailDiv = this.imageRendererDiv.querySelector(".thumbnail");
            thumbnailDiv.addEventListener('click', function () {
                var modalTemplate = document.getElementById('modal');
                document.body.appendChild(
                    document.importNode(modalTemplate.content, true)
                );
                document.querySelector('.insertscreen').innerHTML =
                    '<img src="' + that.imageModel.getPath() + '" />';
                document.querySelector('.modal').addEventListener('click', function () {
                    this.parentNode.removeChild(this);
                });
            });

            this.update();
        },

        update: function () {
            var thumbnailDiv, metaDataDiv,
                that = this;

            this.imageRendererDiv.className = "image-render " +
                (this.viewType === LIST_VIEW ? "list" : "grid");
            thumbnailDiv = this.imageRendererDiv.querySelector(".thumbnail");
            metaDataDiv  = this.imageRendererDiv.querySelector(".meta-data");
            thumbnailDiv.innerHTML = '<img src="' +
                this.imageModel.getPath() + '" />';

            metaDataDiv.querySelector('.image-name').innerHTML =
                this.imageModel.getName();
            metaDataDiv.querySelector('.image-date').innerHTML =
                this.imageModel.modificationDateToString();
        },
            

        /**
         * Returns an element representing the ImageModel, which can be attached to the DOM
         * to display the ImageModel.
         */
        getElement: function () {
            return this.imageRendererDiv;
        },

        /**
         * Returns the ImageModel represented by this ImageRenderer.
         */
        getImageModel: function () {
            return this.imageModel;
        },

        /**
         * Sets the ImageModel represented by this ImageRenderer, changing the element and its
         * contents as necessary.
         */
        setImageModel: function (imageModel) {
            this.imageModel = imageModel;
            this._init();
        },

        /**
         * Changes the rendering of the ImageModel to either list or grid view.
         * @param viewType A string, either LIST_VIEW or GRID_VIEW
         */
        setToView: function (viewType) {
            this.viewType = viewType;
            this.update();
        },

        /**
         * Returns a string of either LIST_VIEW or GRID_VIEW indicating which view type it is
         * currently rendering.
         */
        getCurrentView: function () {
            return this.viewType;
        }
    });

    /**
     * A factory is an object that creates other objects. In this case, this object will create
     * objects that fulfill the ImageRenderer class's contract defined above.
     */
    var ImageRendererFactory = function () {
    };

    _.extend(ImageRendererFactory.prototype, {
        /**
         * Creates a new ImageRenderer object for the given ImageModel
         */
        createImageRenderer: function (imageModel) {
            return new ImageRenderer(imageModel);
        }
    });

    /**
     * An object representing a DOM element that will render an ImageCollectionModel.
     * Multiple such objects can be created and added to the DOM (i.e., you shouldn't
     * assume there is only one ImageCollectionView that will ever be created).
     */
    var ImageCollectionView = function (collectionModel) {
        this.factory = new ImageRendererFactory();
        this.setImageCollectionModel(collectionModel);
        this.viewType = LIST_VIEW;
        this.ratingFilter = 0;
        this._init();
    };

    _.extend(ImageCollectionView.prototype, {
        _init: function () {
            var collectionTemplate, collectionDiv, that = this, imageRender;
            collectionTemplate = document.getElementById('image-collection');

            if (!this.collectionWrap) {
                // only create if not done already
                this.collectionWrap = document.createElement('div');
                this.collectionWrap.appendChild(document.importNode(collectionTemplate.content, true));
            }
            collectionDiv = this.collectionWrap.querySelector(".image-collection");
            collectionDiv.className = "image-collection " +
                (this.viewType === LIST_VIEW ? "list" : "grid");
            collectionDiv.innerHTML = "";

            this.renders = [];
            _.each(this.collectionModel.getImageModels(), function (imageModel) {
                imageRender = that.factory.createImageRenderer(imageModel);
                that.renders.push(imageRender);

                collectionDiv.appendChild(
                    imageRender.getElement()
                );
            });
        },

        setRatingFilter: function (rating) {
            this.ratingFilter = rating;
        },
        
        getRatingFilter: function (rating) {
            return this.ratingFilter;
        },

        setToolbar: function (toolbar) {
            var that = this;
            if (this.toolbar) {
                this.toolbar.removeListener(this.toolbarListener);
            }
            this.toolbar = toolbar;
            this.toolbarListener = function (toolbarRef, eventType, eventDate) {
                switch (eventType) {
                case LIST_VIEW:
                    that.setToView(LIST_VIEW);
                    that.updateRenders();
                    break;
                case GRID_VIEW:
                    that.setToView(GRID_VIEW);
                    that.updateRenders();
                    break;
                case RATING_CHANGE:
                    that.setRatingFilter(toolbar.getCurrentRatingFilter());
                    that.updateRenders();
                    break;
                }
            };
            toolbar.addListener(this.toolbarListener);
        },

        addRender: function (imageModel) {
            var imageRender = this.factory.createImageRenderer(imageModel);
            imageRender.setToView(this.getCurrentView());
            this.renders.push(imageRender);
        },

        removeRender: function (imageModel) {
            this.renders = _.without(this.renders, this.getImageRender(imageModel));
        },

        updateRenders: function () {
            var collectionDiv = this.collectionWrap.querySelector(".image-collection"),
                that = this;

            collectionDiv.className = "image-collection " +
                (this.viewType === LIST_VIEW ? "list" : "grid");
            collectionDiv.innerHTML = "";
            _.each(this.renders, function (imageRender) {
                if (imageRender.getImageModel().getRating() >= that.ratingFilter) {
                    collectionDiv.appendChild(imageRender.getElement());
                }
            });
        },
                
        /**
         * Returns an element that can be attached to the DOM to display the ImageCollectionModel
         * this object represents.
         */
        getElement: function () {
            return this.collectionWrap;
        },

        /**
         * Gets the current ImageRendererFactory being used to create new ImageRenderer objects.
         */
        getImageRendererFactory: function () {
            return this.factory;
        },

        /**
         * Sets the ImageRendererFactory to use to render ImageModels. When a *new* factory is provided,
         * the ImageCollectionView should redo its entire presentation, replacing all of the old
         * ImageRenderer objects with new ImageRenderer objects produced by the factory.
         */
        setImageRendererFactory: function (ImageRendererFactory) {
            this.factory = new ImageRendererFactory();
            this._init();
        },

        /**
         * Returns the ImageCollectionModel represented by this view.
         */
        getImageCollectionModel: function () {
            return this.collectionModel;
        },

        getImageRender: function (imageModel) {
            return _.find(this.renders, function (imageRender, index) {
                return imageRender.getImageModel() === imageModel;
            });
        },

        /**
         * Sets the ImageCollectionModel to be represented by this view. When setting the ImageCollectionModel,
         * you should properly register/unregister listeners with the model, so you will be notified of
         * any changes to the given model.
         */
        setImageCollectionModel: function (imageCollectionModel) {
            var imageRenders, that = this;
            if (this.collectionModel) {
                // need to unregister the listener
                this.collectionModel.removeListener(this.selfListener);
            }

            this.collectionModel = imageCollectionModel;
            this.selfListener = function (eventType, imageCollectionModelRef, imageModel, eventDate) {
                switch (eventType) {
                case 'IMAGE_META_DATA_CHANGED_EVENT':
                    that.getImageRender(imageModel).update();
                    that.updateRenders();
                    break;
                case 'IMAGE_ADDED_TO_COLLECTION_EVENT':
                    that.addRender(imageModel);
                    that.updateRenders();
                    break;
                case 'IMAGE_REMOVED_FROM_COLLECTION_EVENT':
                    that.removeRender(imageModel);
                    that.updateRenders();
                    break;
                default:
                    throw new Error("Unknown eventType in collectionModel notification: " + eventType);
                }
            };

            imageCollectionModel.addListener(this.selfListener);
        },

        /**
         * Changes the presentation of the images to either grid view or list view.
         * @param viewType A string of either LIST_VIEW or GRID_VIEW.
         */
        setToView: function (viewType) {
            this.viewType = viewType;
            _.each(this.renders, function (imageRender) {
                imageRender.setToView(viewType);
            });
        },

        /**
         * Returns a string of either LIST_VIEW or GRID_VIEW indicating which view type is currently
         * being rendered.
         */
        getCurrentView: function () {
            return this.viewType;
        }
    });

    /**
     * An object representing a DOM element that will render the toolbar to the screen.
     */
    var Toolbar = function () {
        this.listeners = [];
        this.viewType = LIST_VIEW;
        this.rating = 0;
        this._init();
    };

    _.extend(Toolbar.prototype, {
        _init: function () {
            var toolbarTemplate = document.getElementById('toolbar'),
                that = this;

            this.toolbarDiv = document.createElement('div');
            this.toolbarDiv.appendChild(document.importNode(toolbarTemplate.content, true));

            this.toolbarDiv.querySelector('.icon-list').addEventListener('click', function () {
                that.setToView(LIST_VIEW);
                that.toolbarDiv.querySelector('.icon-grid').className = 'icon-grid';
                this.className = 'icon-list disabled';
            });
            this.toolbarDiv.querySelector('.icon-grid').addEventListener('click', function () {
                that.setToView(GRID_VIEW);
                that.toolbarDiv.querySelector('.icon-list').className = 'icon-list';
                this.className = 'icon-grid disabled';
            });

            function drawStars(index) {
                _.each(that.toolbarDiv.querySelectorAll('span[class*="icon-star"]'), function (star, indexLoop) {
                    if (index >= indexLoop) {
                        star.className = "icon-star-full";
                    } else {
                        star.className = "icon-star-empty";
                    }
                });
            }
            _.each(this.toolbarDiv.querySelectorAll('span[class*="icon-star"]'), function (star, index) {
                star.addEventListener('click', function () {
                    if (index + 1 === that.getCurrentRatingFilter()) {
                        // clear rating if same rating selected
                        drawStars(-1);
                        that.setRatingFilter(0);
                    } else {
                        drawStars(index);
                        that.setRatingFilter(index + 1);
                    }
                });
            });
        },

        /**
         * Returns an element representing the toolbar, which can be attached to the DOM.
         */
        getElement: function () {
            return this.toolbarDiv;
        },

        /**
         * Registers the given listener to be notified when the toolbar changes from one
         * view type to another.
         * @param listener_fn A function with signature (toolbar, eventType, eventDate), where
         *                    toolbar is a reference to this object, eventType is a string of
         *                    either, LIST_VIEW, GRID_VIEW, or RATING_CHANGE representing how
         *                    the toolbar has changed (specifically, the user has switched to
         *                    a list view, grid view, or changed the star rating filter).
         *                    eventDate is a Date object representing when the event occurrejs/model.js
         */

        addListener: function (listener_fn) {
            this.listeners.push(listener_fn);
        },

        /**
         * Removes the given listener from the toolbar.
         */
        removeListener: function (listener_fn) {
            this.listeners = _.without(this.listeners, listener_fn);
        },

        notifyListeners: function (toolbar, eventType, eventDate) {
            _.each(this.listeners, function (callback) {
                callback(toolbar, eventType, eventDate);
            });
        },

        /**
         * Sets the toolbar to either grid view or list view.
         * @param viewType A string of either LIST_VIEW or GRID_VIEW representing the desired view.
         */
        setToView: function (viewType) {
            this.viewType = viewType;

            this.notifyListeners(this, viewType, new Date());
        },

        /**
         * Returns the current view selected in the toolbar, a string that is
         * either LIST_VIEW or GRID_VIEW.
         */
        getCurrentView: function () {
            return this.viewType;
        },

        /**
         * Returns the current rating filter. A number in the range [0,5], where 0 indicates no
         * filtering should take place.
         */
        getCurrentRatingFilter: function () {
            return this.rating;
        },

        /**
         * Sets the rating filter.
         * @param rating An integer in the range [0,5], where 0 indicates no filtering should take place.
         */
        setRatingFilter: function (rating) {
            console.log('setting rating to: ' + rating);
            this.rating = rating;

            this.notifyListeners(this, RATING_CHANGE, new Date());
        }
    });

    /**
     * An object that will allow the user to choose images to display.
     * @constructor
     */
    var FileChooser = function () {
        this.listeners = [];
        this._init();
    };

    _.extend(FileChooser.prototype, {
        // This code partially derived from: http://www.html5rocks.com/en/tutorials/file/dndfiles/
        _init: function () {
            var self = this;
            this.fileChooserDiv = document.createElement('div');
            var fileChooserTemplate = document.getElementById('file-chooser');
            this.fileChooserDiv.appendChild(document.importNode(fileChooserTemplate.content, true));
            var fileChooserInput = this.fileChooserDiv.querySelector('.files-input');
            fileChooserInput.addEventListener('change', function (evt) {
                var files = evt.target.files,
                    eventDate = new Date();
                _.each(
                    self.listeners,
                    function (listener_fn) {
                        listener_fn(self, files, eventDate);
                    }
                );
            });
        },

        /**
         * Returns an element that can be added to the DOM to display the file chooser.
         */
        getElement: function () {
            return this.fileChooserDiv;
        },

        /**
         * Adds a listener to be notified when a new set of files have been chosen.
         * @param listener_fn A function with signature (fileChooser, fileList, eventDate), where
         *                    fileChooser is a reference to this object, fileList is a list of files
         *                    as returned by the File API, and eventDate is when the files were chosen.
         */
        addListener: function (listener_fn) {
            if (!_.isFunction(listener_fn)) {
                throw new Error("Invalid arguments to FileChooser.addListener: " + JSON.stringify(arguments));
            }

            this.listeners.push(listener_fn);
        },

        /**
         * Removes the given listener from this object.
         * @param listener_fn
         */
        removeListener: function (listener_fn) {
            if (!_.isFunction(listener_fn)) {
                throw new Error("Invalid arguments to FileChooser.removeListener: " + JSON.stringify(arguments));
            }
            this.listeners = _.without(this.listeners, listener_fn);
        }
    });

    // Return an object containing all of our classes and constants
    return {
        ImageRenderer: ImageRenderer,
        ImageRendererFactory: ImageRendererFactory,
        ImageCollectionView: ImageCollectionView,
        Toolbar: Toolbar,
        FileChooser: FileChooser,

        LIST_VIEW: LIST_VIEW,
        GRID_VIEW: GRID_VIEW,
        RATING_CHANGE: RATING_CHANGE
    };
}
