/*jslint browser: true*/
/*jslint nomen: true*/
/*global createModelModule, createViewModule, _*/

// This should be your main point of entry for your app

window.addEventListener('load', function () {
    'use strict';
    var modelModule  = createModelModule(),
        viewModule   = createViewModule(),
        appContainer = document.getElementById('app-container'),
        toolbar      = new viewModule.Toolbar(),
        toolbarElement = toolbar.getElement(),
        fileChooser  = new viewModule.FileChooser(),
        imageCollectionModel = modelModule.loadImageCollectionModel() || new modelModule.ImageCollectionModel(),
        imageCollectionView  = new viewModule.ImageCollectionView(imageCollectionModel),
        collectionElement,
        temp;

    imageCollectionModel.addListener(function () {
        modelModule.storeImageCollectionModel(imageCollectionModel);
    });

    appContainer.appendChild(toolbarElement);
    imageCollectionView.setToolbar(toolbar);

    // Attach the file chooser to the page. You can choose to put this elsewhere, and style as desired
    appContainer.appendChild(fileChooser.getElement());
    collectionElement = imageCollectionView.getElement();
    appContainer.appendChild(collectionElement);

    // Demo that we can choose files and save to local storage. This can be replaced, later
    fileChooser.addListener(function (fileChooser, files, eventDate) {
        _.each(
            files,
            function (file) {
                imageCollectionModel.addImageModel(
                    new modelModule.ImageModel(
                        './images/' + file.name,
                        file.lastModifiedDate,
                        '',
                        0
                    )
                );
            }
        );

    
        modelModule.storeImageCollectionModel(imageCollectionModel);
        temp = imageCollectionView.getElement();
        appContainer.replaceChild(collectionElement, temp);
        collectionElement = temp;
    });
});
