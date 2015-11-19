'use strict';

(function (angular) {
  angular
    .module('eCommercePluginWidget')
    .controller('WidgetSingleCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'ECommerceSDK', '$sce', 'LAYOUTS', '$rootScope', 'Buildfire', 'ViewStack',
      function ($scope, DataStore, TAG_NAMES, ECommerceSDK, $sce, LAYOUTS, $rootScope, Buildfire, ViewStack) {
        var WidgetSingle = this;
        WidgetSingle.listeners = {};
        WidgetSingle.data = null;
        WidgetSingle.item = null;
        //create new instance of buildfire carousel viewer
        WidgetSingle.view = null;

        WidgetSingle.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        var currentView = ViewStack.getCurrentView();

        var currentStoreName = "";

        var getProduct = function (storeName, handle) {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              console.log("===============================", result);
              WidgetSingle.item = result;
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Single product Details', err);
            };
          ECommerceSDK.getProduct(storeName, handle).then(success, error);
        };

        /*
         * Fetch user's data from datastore
         */

        var init = function () {
          var success = function (result) {
              WidgetSingle.data = result.data;
              if (!WidgetSingle.data.design)
                WidgetSingle.data.design = {};
              if (!WidgetSingle.data.content)
                WidgetSingle.data.content = {};
              if (!WidgetSingle.data.settings)
                WidgetSingle.data.settings = {};
              if (WidgetSingle.data.content.storeName) {
                currentStoreName = WidgetSingle.data.content.storeName;
              }
              if (!WidgetSingle.data.design.itemListLayout) {
                WidgetSingle.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
              }
              if (WidgetSingle.data.content.storeName && currentView.params.handle)
                getProduct(WidgetSingle.data.content.storeName, currentView.params.handle);
            }
            , error = function (err) {
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.SHOPIFY_INFO).then(success, error);
        };

        var onUpdateCallback = function (event) {
          setTimeout(function () {
            if (event && event.tag) {
              switch (event.tag) {
                case TAG_NAMES.SHOPIFY_INFO:
                  WidgetSingle.data = event.data;
                  if (!WidgetSingle.data.design)
                    WidgetSingle.data.design = {};
                  if (!WidgetSingle.data.design.itemListLayout) {
                    WidgetSingle.data.design.itemListLayout = LAYOUTS.itemListLayout[0].name;
                  }
                  if (!WidgetSingle.data.content.storeName) {
                    WidgetSingle.item = null;
                    currentStoreName = "";
                  }

                  if (WidgetSingle.data.content.storeName && currentStoreName != WidgetSingle.data.content.storeName) {
                    WidgetSingle.item = null;
                    getProduct(WidgetSingle.data.content.storeName, currentView.params.handle);
                  }
                  if (!WidgetSingle.data.content.storeName)
                    ViewStack.popAllViews();
                  break;
              }
              $scope.$digest();
            }
          }, 0);
        };

        /**
         * DataStore.onUpdate() is bound to listen any changes in datastore
         */
        DataStore.onUpdate().then(null, null, onUpdateCallback);

        $scope.$on("$destroy", function () {
          for (var i in WidgetSingle.listeners) {
            if(WidgetSingle.listeners.hasOwnProperty(i)) {
              WidgetSingle.listeners[i]();
            }
          }
          DataStore.clearListener();
        });

        WidgetSingle.listeners['CAROUSEL_LOADED'] = $rootScope.$on("Carousel2:LOADED", function () {
          WidgetSingle.view = null;
          if (!WidgetSingle.view) {
            WidgetSingle.view = new buildfire.components.carousel.view("#carousel2", [], "WideScreen");
          }
          if (WidgetSingle.item && WidgetSingle.item.images) {
            var imageArray = WidgetSingle.item.images.map(function (item) {
              return {iconUrl: item.src, title : ""};
            });
            console.log(")))))))))))))))))))))))))", imageArray);
            WidgetSingle.view.loadItems(imageArray, null, "WideScreen");
          } else {
            WidgetSingle.view.loadItems([]);
          }
        });

        WidgetSingle.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
          console.log("SINGLE:", view.template, 'Item_Details');
          if(view.template === 'Item_Details') {
            $scope.$destroy();
          }
        });

        init();
      }]);
})(window.angular);