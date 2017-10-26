// Initiate the map
var map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 41.7456012,
            lng: -72.6989092
        },
        zoom: 13
    });
    ko.applyBindings(new ViewModel());
}
// Error meggage if google map not loaded
function googleError() {
    document.getElementById('error').innerHTML = "<h2>Google Maps is not loading. Please try refreshing the page later.</h2>";
}

// Individual School constructor
var School = function (data) {
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.id = ko.observable(data.id);
    this.marker = ko.observable();
    this.phone = ko.observable('');
    this.description = ko.observable('');
    this.address = ko.observable('');
    this.rating = ko.observable('');
    this.url = ko.observable('');
    this.canonicalUrl = ko.observable('');
    this.contentString = ko.observable('');
};

// View modal
var ViewModel = function () {
    var self = this;
    this.schoolList = ko.observableArray([]);
    // Creating school list
    locations.forEach(function (schoolItem) {
        self.schoolList.push(new School(schoolItem));
    });
    // Initiating info window
    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });
    // initiating marker
    var marker;
    // Generating info window with foursqare API
    self.schoolList().forEach(function (schoolItem) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(schoolItem.lat(), schoolItem.lng()),
            map: map,
            animation: google.maps.Animation.DROP
        });
        schoolItem.marker = marker;
        fetch('https://api.foursquare.com/v2/venues/' + schoolItem.id() + '?v=20131016&client_id=442IQVWDHRBERVO0DAOAGUZUULDRBIYO04LJC0ZSUO0TJAQ1&client_secret=WXW40HK5YKK4TRRWOB0GKXFQ400JL5FABTUNBRQVTOU21JA4')
            .then((res) => res.json())
            .then((data) => {
                var result = data.response.venue;
                var contact = result.hasOwnProperty('contact') ? result.contact : '';
                if (contact.hasOwnProperty('formattedPhone')) {
                    schoolItem.phone(contact.formattedPhone || '');
                }

                var location = result.hasOwnProperty('location') ? result.location : '';
                if (location.hasOwnProperty('address')) {
                    schoolItem.address(location.address || '');
                }

                var description = result.hasOwnProperty('description') ? result.description : '';
                schoolItem.description(description || '');

                var rating = result.hasOwnProperty('rating') ? result.rating : '';
                schoolItem.rating(rating || 'none');

                var url = result.hasOwnProperty('url') ? result.url : '';
                schoolItem.url(url || '');

                schoolItem.canonicalUrl(result.canonicalUrl);
                var contentString = `
                    <div id="iWindow">
                    <h4> ${ schoolItem.name()}  </h4>
                    <p>Information from Foursquare:</p>
                    <p> ${schoolItem.phone()}</p>
                    <p> ${schoolItem.address()}</p>
                    <p>${schoolItem.description()}</p>
                    <p>Rating:${schoolItem.rating()}</p>
                    <p><a href="${schoolItem.url()}"> ${schoolItem.url()} </a></p>
                    <p><a target="_blank" href="${schoolItem.canonicalUrl()}">Foursquare Page</a></p>
                    <p><a target="_blank" href="https://www.google.com/maps/dir/Current+Location/${schoolItem.lat()},${schoolItem.lng()}">Directions</a></p></div>
                    `;

                infowindow.setContent(contentString);

                google.maps.event.addListener(schoolItem.marker, 'click', function () {
                    infowindow.open(map, this);
                    schoolItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        schoolItem.marker.setAnimation(null);
                    }, 500);
                    infowindow.setContent(contentString);
                    map.setCenter(schoolItem.marker.getPosition());
                });

            }).catch(
            function (e) {
                infowindow.setContent('<h5>Foursquare data is unavailable. Please try refreshing later.</h5>');
            }
            );
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, this);
            schoolItem.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                schoolItem.marker.setAnimation(null);
            }, 1000);
        });
    });
    // triggering click event on list item
    self.showInfo = function (schoolItem) {
        google.maps.event.trigger(schoolItem.marker, 'click');
    };
    // Show and hide filters
    self.toggleNav = ko.observable(false);
    this.navStatus = ko.pureComputed(function () {
        return self.toggleNav() === false ? 'nav' : 'navClosed';
    }, this);

    self.hideElements = function (toggleNav) {
        self.toggleNav(true);
        return true;
    };

    self.showElements = function (toggleNav) {
        self.toggleNav(false);
        return true;
    };
    // Filtering based on input text
    self.visible = ko.observableArray();
    self.schoolList().forEach(function (place) {
        self.visible.push(place);
    });

    self.userInput = ko.observable('');
    self.filterMarkers = function () {
        var searchInput = self.userInput().toLowerCase();
        self.visible.removeAll();
        self.schoolList().forEach(function (place) {
            place.marker.setVisible(false);
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };

};