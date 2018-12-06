//set variables
//var reportingYear = 3;
var searchResult
var lastSearch = undefined;
var markerNumber = 0;
var mapDiv;
var labelsHidden;
var mapResize;
var INFOwindow = google.maps.InfoWindow;
var overlays = {
    settings: {}
}
var textOverlays = {
    text: [],
};
var parcelTypeArray = [
    "Irrigated",
    "Not Irrigated",
    "Not Farmed",
    "Sold",
    "Farmed",
    "Transfered",
    "Leased",
]
var parcelType = [
    "#1174A7",//irrigated
    "#CF553A",//Not Irrigated
    "#BD3240",//Not Farmed
    "#003300",//Sold
    "#0B0B0B",//Farmed
    "#bdae32",//Transfered
    "#8f5a91",//Leased

]
var irrTypeArray = [
    "Drip",
    "Microsprinkler",
    "Sprinkler",
    "Borderstrip",
    "Furrow",
    "Flood (Level Basin)",
    "Dry Farming",
    "Fallow",
]
var IrrType = [
    "#B5D9EA",//drip
    "#F2D383",//microSprinkler
    "#E1854F",//sprinkler
    "#57C1E8",//borderStrip
    "#A9A8A9",//furrow
    "#AE8476",//floodLevelBasin
    "#ABADB3",//dryFarming
    "#DBDDE0",//fallow
]
var defaulticon = "../../Areas/Mpa/Common/Images/addwell.png";
var markerIcon = [
    "../../Areas/Mpa/Common/Images/well1.png",
    "../../Areas/Mpa/Common/Images/well2.png",
    "../../Areas/Mpa/Common/Images/well3.png",
    "../../Areas/Mpa/Common/Images/well4.png",
    "../../Areas/Mpa/Common/Images/well5.png",
    "../../Areas/Mpa/Common/Images/well6.png",
]
var wellTypeArray = [
    "Domestic Well",
    "Irrigation Well",
    "Monitoring Well",
    "Abandoned Well",
    "Abandoned Domestic",
    "Abandoned Irrigation",
]

var demoIcon = {
    lightblue: "../../Areas/Mpa/Common/Images/demoLightBlue.png",
    blue: "../../Areas/Mpa/Common/Images/demoBlue.png",
    purple: "../../Areas/Mpa/Common/Images/demoPurple.png",
    pink: "../../Areas/Mpa/Common/Images/demoPink.png",
    red: "../../Areas/Mpa/Common/Images/demoRed.png",
    orange: "../../Areas/Mpa/Common/Images/demoOrange.png",
    yellow: "../../Areas/Mpa/Common/Images/demoYellow.png",
    yellowgreen: "../../Areas/Mpa/Common/Images/demoYellowGreen.png",
    green: "../../Areas/Mpa/Common/Images/demoGreen.png",
    teal: "../../Areas/Mpa/Common/Images/demoTeal.png",
    cyan: "../../Areas/Mpa/Common/Images/demoCyan.png",
    black: "../../Areas/Mpa/Common/Images/demoBlack.png",
    white: "../../Areas/Mpa/Common/Images/demoWhite.png",
    dairies: "../../Areas/Mpa/Common/Images/demoDairies.png",
}


var mapscript = {
    initialize: function (mapElement) {
        mapResize = mapElement //this lets us keep the map element variable and use it later to resize the map
        initialize(mapElement);
        console.log("map script loaded");
        mapResize.height($(window).height() * .70);
        mapResize.width($(window).width());
        buttonListeners();
        //initMapButtons();
    },
    overlay: {
        recolor: function (array, color, icon) {
            var newArray = []
            for (val in array) {
                switch (array[val].type) {
                    case "POLYGON":
                        array[val].setMap(null) //remove old shape
                        var tempData = new google.maps.Polygon({
                            paths: array[val].getPath(),
                            strokeColor: color,
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: color,
                            fillOpacity: 0.35,
                        }) //copy old shape into new shape with new color
                        for (prop in array[val]) {
                            if (typeof array[val][prop] != 'object' && typeof array[val][prop] != "function" && prop.toString().search(/(\w+color)+/ig)) {
                                tempData[prop] = array[val][prop]; //add all the other data except functions, objects, and the old color
                            }
                        }

                        array[val] = tempData; //replace old shape
                        array[val].setMap(mapDiv); //set new shape to the map
                        newArray.push(array[val]); //push new shape to an array to send to infowindow
                        break;
                    case "MARKER":
                        
                        array[val].setMap(null) //remove old shape
                        var tempData = new google.maps.Marker({
                            position: array[val].getPosition(),
                            icon: icon,
                        }) //copy old shape into new shape with new color
                        for (prop in array[val]) {
                            if (typeof array[val][prop] != 'object' && typeof array[val][prop] != "function" && prop.toString().search(/(\w+color)+/ig)) {
                                tempData[prop] = array[val][prop]; //add all the other data except functions, objects, and the old color
                            }
                        }

                        array[val] = tempData; //replace old shape
                        array[val].setMap(mapDiv); //set new shape to the map
                        newArray.push(array[val]); //push new shape to an array to send to infowindow
                        break;
                    default: console.log('error determining type in mapscript.overlay.recolor')
                }

            }
            mapscript.marker.infowindow(newArray) //send new shapes to get infowindows
        }
    },
    addDrawingTools: function (shapes) {
        var drawingModesArr = []
        $.each(shapes, function (i, obj) {
            switch (obj.toString().toUpperCase()) {
                case 'MARKER':
                    drawingModesArr.push(google.maps.drawing.OverlayType.MARKER);
                    break;
                case 'POLYGON':
                    drawingModesArr.push(google.maps.drawing.OverlayType.POLYGON);
                    break;
                default:
                    console.log('error determining shape while adding drawing tools (mapScript/Map.addDrawingTools)');
            }
        });
        var drawingManager = new google.maps.drawing.DrawingManager({

            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: drawingModesArr,
            },
            drawingMode: drawingModesArr[0],
        });
        drawingManager.setMap(mapDiv);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', function (shapeObject) {
            overlayComplete(shapeObject);
        });
    },
    getGeoFromObject: function (object, tablename) {
        var GeoArray = []
        var temp = object;

        for (var i = 0; i < object.length; i++) {
            function recursiveSearch(object) {
                $.each(object, function (prop, val) {
                    //console.log(typeof object[prop])
                    if (typeof object[prop] === 'object') {
                        recursiveSearch(object[prop])
                    }
                    else if (object[prop].toString().search(/(POINT)+|(LINESTRING)+|(multipolygon)+|(linestring)+|(Polygon)+|(MultiPoint)+|(MultiLineString)+/ig) != -1) {
                        var temp2 = mapscript.parse.WKT(object[prop]) //returns google map icon
                        temp2.tableName = tablename;
                        for (prop2 in temp[i]) {
                            temp2[prop2] = temp[i][prop2]
                        }
                        GeoArray.push(temp2);
                    }

                })
            }
            recursiveSearch(object[i]);
        }


        return GeoArray;
    },
    getLatLngFromObject: function (object, tableName) {
        var GeoArray = []
        var LatLng = {};

        $.each(object, function (key, val) {
            marker = new google.maps.Marker({
                position: { lat: parseFloat(val.lat), lng: parseFloat(val.long) },
                name: val.cropName,
                field: val.field,
                fieldSize: val.fieldSize,
                flowUnits: val.flowUnits,
                turnoutId: val.turnoutId,
                tableName: tableName,
                type: "MARKER",
            });
            GeoArray.push(marker)
        })


        return GeoArray;
    },
    hideQuery: function (arr, query) {
        for (var i = 0; i < arr.length; i++) {
            for (var prop in arr[i]) {
                if (arr[i][prop]) {
                    if (arr[i][prop].toString().toUpperCase() === query.toUpperCase()) {
                        arr[i].setMap(null);
                    }
                }
            }
        }
    },
    showQuery: function (arr, query) {
        for (var i = 0; i < arr.length; i++) {
            for (var prop in arr[i]) {
                if (arr[i][prop]) {
                    if (arr[i][prop].toString().toUpperCase() === query.toUpperCase()) {
                        arr[i].setMap(mapDiv);
                    }
                }
            }
        }
    },
    marker: {
        infowindow: function (markers) {
            var temp = [];
            var content = '';
            for (prop in markers) {
                $.each(markers[prop], function (key, val) {
                    if (typeof val === 'function' || typeof val === 'object' || key.toString().search(/(GM)+|(_)+|(POSITION)+|(CLICKABLE)+|(CLOSURE)+|(TYPE)+|(capturing)+|(SET)+|(icon)+|(GET)+|(ADD)+|(VISIBLE)+|(guid)+|(lastupdated)+|(\bstroke\w)+|(content)|(\bfill\w)+|(lat)+|(long)+|(sturnoutkey)+|(ncropreportkey)+|(color)+|\b(ea)+$|\b(altapn)+$|(TABLENAME)+/ig) != -1) {
                    }
                    else {
                        content += "<p><strong>" + key + ": </strong>" + val + "</p>"
                    }
                })

                markers[prop].content = content;

                INFOwindow = new google.maps.InfoWindow;
                markers[prop].addListener('click', function (e) {
                    INFOwindow.setContent(this.content);
                    INFOwindow.setPosition(e.latLng);
                    INFOwindow.setZIndex(500000);
                    INFOwindow.open(mapDiv, this);
                });

                content = ""

            }
            //return temp;
        },
        infowindowCustom: function (markers, properties) {
            var temp = [];
            var contentString = '';

            for (prop in markers) {

                $.each(markers[prop], function (i, val) {
                    $.each(properties, function (j, val2) {
                        if (i.toString().toUpperCase() === val2.toString().toUpperCase()) {
                            contentString += '<strong>' + i + '</strong>:' + val + '<br>';
                        }
                    })
                });

                INFOwindow = new google.maps.InfoWindow;
                markers[prop].addListener('click', function (e) {
                    //INFOwindow.setContent(markers[prop].stationName); //content
                    INFOwindow.setContent(contentString);
                    INFOwindow.setPosition(e.latLng);
                    INFOwindow.setZIndex(500000);
                    INFOwindow.open(mapDiv, this);
                });
            }
        },
    },
    icon: {
        Recolor: function (arr, option) {
            $.each(arr, function (i, obj) {
                for (var prop in obj) {
                    if (typeof obj[prop] != 'function' && prop.toString().toUpperCase() === option.toUpperCase()) {
                        var result = obj[option.toUpperCase()]
                        switch (option.toUpperCase()) {
                            case "NO3":
                                if (result > 100) {
                                    obj.setIcon(demoIcon.red);
                                }
                                else if (result > 75) {
                                    obj.setIcon(demoIcon.orange);
                                }
                                else if (result > 60) {
                                    obj.setIcon(demoIcon.yellow);//                    TESTING
                                }                          //                        NO3
                                else if (result > 45) {    //                        DAIRY
                                    obj.setIcon(demoIcon.yellowgreen);//               2015-2016
                                }
                                else if (result > 30) {
                                    obj.setIcon(demoIcon.green);
                                }
                                else if (result > 15) {
                                    obj.setIcon(demoIcon.teal);
                                }
                                else if (result >= 0) {
                                    obj.setIcon(demoIcon.lightblue);
                                }
                                else {
                                    console.log('error figuring out result in Dairy_Wells_N03_2015_2016.');
                                }
                                break;
                            case "NO3N":
                                if (result > 100) {
                                    obj.setIcon(demoIcon.red);
                                }
                                else if (result > 75) {
                                    obj.setIcon(demoIcon.orange);
                                }
                                else if (result > 60) {
                                    obj.setIcon(demoIcon.yellow);//                  TESTING
                                }                          //                        NO3
                                else if (result > 45) {    //                        DAIRY
                                    obj.setIcon(demoIcon.yellowgreen);//             2015-2016
                                }
                                else if (result > 30) {
                                    obj.setIcon(demoIcon.green);
                                }
                                else if (result > 15) {
                                    obj.setIcon(demoIcon.teal);
                                }
                                else if (result >= 0) {
                                    obj.setIcon(demoIcon.lightblue);
                                }
                                else {
                                    console.log('error figuring out result in Dairy_Wells_N03_2015_2016.');
                                }
                                break;
                            case "CONDUCTIVITY":
                            case "EC":
                                if (result > 2000) {
                                    obj.setIcon(demoIcon.red);
                                }
                                else if (result > 1500) {
                                    obj.setIcon(demoIcon.orange);
                                }
                                else if (result > 1000) {//                          TESTING
                                    obj.setIcon(demoIcon.yellow);//                  ELECTRICAL
                                }                         //                         CONDUCTIVITY
                                else if (result > 750) {//                           DAIRY 2015-2016
                                    obj.setIcon(demoIcon.yellowgreen);
                                }
                                else if (result > 500) {
                                    obj.setIcon(demoIcon.green);
                                }
                                else if (result >= 0) {
                                    obj.setIcon(demoIcon.teal);
                                }
                                else {
                                    console.log('error figuring out result in Dairy_Wells_N03_2015_2016.');
                                }
                                break;
                            case "WELLTYPE":
                                switch (result.toString().toUpperCase()) {
                                    case "TEST": obj.setIcon(demoIcon.green);
                                        break;
                                    case "IRRIGATION":
                                    case "IW":
                                        obj.setIcon(demoIcon.lightblue);
                                        break;
                                    case "DOMESTIC":
                                    case "DW":
                                        obj.setIcon(demoIcon.purple);
                                        break;
                                    case "DAIRY": obj.setIcon(demoIcon.orange);
                                        break;
                                    case "GROUND WATER": obj.setIcon(demoIcon.red);
                                        break;
                                    case "MUNICIPAL": obj.setIcon(demoIcon.pink);
                                        break;
                                    default: console.log('error figuring out which icon to use for welltype in DAIRY_WELLS_N03_2015_2016');
                                }
                                break;
                            default: console.log("error in the big switch statement for DAIRY_WELLS_N03_2015_2016")
                        }
                    }
                }
            });
        },
    },
    init: {
        WTKJSON: function (data, tableName, icon) {
            var arr = [];
            var min = 0, max = 0;
            var contourValues = [];


            if (!overlays[tableName]) {
                overlays[tableName] = [];
            }


            function color_from_hue(hue) {
                var h = hue / 60;
                var c = 255;
                var x = (1 - Math.abs(h % 2 - 1)) * 255;
                var color;

                var i = Math.floor(h);
                if (i == 0) color = rgb_to_hex(c, x, 0);
                else if (i == 1) color = rgb_to_hex(x, c, 0);
                else if (i == 2) color = rgb_to_hex(0, c, x);
                else if (i == 3) color = rgb_to_hex(0, x, c);
                else if (i == 4) color = rgb_to_hex(x, 0, c);
                else color = rgb_to_hex(c, 0, x);

                return color;
            }

            function rgb_to_hex(red, green, blue) {
                var h = ((red << 16) | (green << 8) | (blue)).toString(16);
                // add the beginning zeros
                while (h.length < 6) h = '0' + h;
                return '#' + h;
            }


            function TestRainbowColor(steps) {
                var arr = [];
                var hue = 0;
                var step = 0;

                // hue is 360 degrees
                if (steps > 0) {
                    step = 360 / (steps);
                }


                // iterate the whole 360 degrees
                for (var i = 0; i < steps; i++) {
                    arr.push(color_from_hue(hue));
                    hue += step;
                }
                return arr
            }


            if (data[data.length - 1].CONTOUR) {
                for (var j = 0; j < data.length; j++) {
                    contourValues.push(data[j].CONTOUR);
                }
                contourValues.sort(function (a, b) { return a - b });
                contourValues = contourValues.filter(function (item, index, inputArray) { //this removes all duplicate entries from contourValues
                    return inputArray.indexOf(item) == index;
                });
                var steps = contourValues.length;
                var contourColorValues = TestRainbowColor(steps);

                $.each(contourValues, function (i, item) {
                    $('.contourLegend').append('<span style="border-left:' + contourColorValues[i] + ' solid 5px;padding-left:7.5px;margin-right:7.5px;">' + contourValues[i] + '</span></br>');
                })
            }

            for (var i = 0; i < data.length; i++) {
                var newmarker = mapscript.parse.WKT(data[i].Column1)
                for (var prop in data[i]) {// let's figure out the icon to use
                    var test = prop.toString().toUpperCase();
                    var result = data[i][prop];
                    if (test != "ID" && test != "COLUMN1" && test != "IDNO" && test != "OBJECTID") { //IGNORE THESE COLUMNS
                        if (test === "NO3" || test === "NO3N") { //NO3
                            //newmarker.contentString = '<p style=\"margin-bottom:5px;\"><strong>No3: </strong>' + result + 'MG/L</p>'
                            if (result > 100) {
                                icon = demoIcon.red;
                            }
                            else if (result > 75) {
                                icon = demoIcon.orange;
                            }
                            else if (result > 60) {
                                icon = demoIcon.yellow;//                        TESTING
                            }                          //                        NO3
                            else if (result > 45) {    //                        RESULT
                                icon = demoIcon.yellowgreen;//                   2010-2013
                            }
                            else if (result > 30) {
                                icon = demoIcon.green;
                            }
                            else if (result > 15) {
                                icon = demoIcon.teal;
                            }
                            else if (result >= 0) {
                                icon = demoIcon.lightblue;
                            }
                            else {
                                console.log('error figuring out result in DAIRY_DATA_2010_2013.');
                            }

                        }
                        else if (test === "EC" || test === "CONDUCTIVITY") { //EC
                            //newmarker.contentString = '<p style=\"margin-bottom:5px;\"><strong>Electrical Conductivity: </strong>' + result + '</p>'
                            if (result > 2000) {
                                icon = demoIcon.red;
                            }
                            else if (result > 1500) {
                                icon = demoIcon.orange;
                            }
                            else if (result > 1000) {//                          TESTING
                                icon = demoIcon.yellow;//                        ELECTRICAL
                            }                         //                         CONDUCTIVITY
                            else if (result > 750) {//                           2010-2014
                                icon = demoIcon.yellowgreen;
                            }
                            else if (result > 500) {
                                icon = demoIcon.green;
                            }
                            else if (result >= 0) {
                                icon = demoIcon.teal;
                            }
                            else {
                                console.log('error figuring out result in DAIRY_WELLS_2010_TO_2014.');
                            }
                        }
                        else if (test === "WELLTYPE") { //WELL TYPES
                            switch (result.toString().toUpperCase()) {
                                case "TEST": icon = demoIcon.green;
                                    break;
                                case "IRRIGATION":
                                case "IW":
                                    icon = demoIcon.lightblue;
                                    break;
                                case "DOMESTIC":
                                case "DW":
                                    icon = demoIcon.purple;
                                    break;
                                case "DAIRY": icon = demoIcon.orange;
                                    break;
                                case "GROUND WATER": icon = demoIcon.red;
                                    break;
                                case "MUNICIPAL": icon = demoIcon.pink;
                                    break;
                                default: console.log('error figuring out which icon to use for welltype in DAIRY_WELLS_N03_2015_2016');
                            }
                        }
                        else if (test === "WELL USE") { //WELL TYPES
                            //newmarker.contentString = '<p style=\"margin-bottom:5px;\"><strong>No3: </strong>' + result + 'MG/L</p>'
                            switch (result.toString().toUpperCase()) {
                                case "UNKNOWN": icon = demoIcon.purple;
                                    break;
                                case "RESIDENTIAL": icon = demoIcon.green;
                                    break;
                                case "IRRIGATION": icon = demoIcon.lightblue;
                                    break;
                                case "OBSERVATION": icon = demoIcon.orange;
                                    break;
                                default: console.log('Error switching well in Well_Locations_2016_wDepth')
                            }
                        }
                        else if (test === "SCORE") { //Score
                            //newmarker.contentString = '<p style=\"margin-bottom:5px;\"><strong>No3: </strong>' + result + 'MG/L</p>'
                            if (result >= 100) {
                                icon = demoIcon.green;
                            }
                            else if (result > 75) {
                                icon = demoIcon.yellowgreen;
                            }
                            else if (result > 50) {
                                icon = demoIcon.yellow;//                        SCORE DATA 
                            }                          //                        FOR TBWQC PWS
                            else if (result > 25) {    //                        
                                icon = demoIcon.orange;//                   
                            }
                            else if (result >= 0) {
                                icon = demoIcon.red;
                            }
                            else {
                                console.log('error figuring out result in ALL_DATA_SETS_N03_2010_2016_C.');
                            }
                        }
                        else if (test === "DAIRY") { //Is it on a dairy?
                            //newmarker.contentString = '<p style=\"margin-bottom:5px;\"><strong>No3: </strong>' + result + 'MG/L</p>'
                            if (result) {
                                icon = demoIcon.green;
                            }
                            else {
                                icon = demoIcon.red;
                            }
                        }
                        else if (test === 'CONTOUR') {
                            $.each(contourValues, function (i, value) {
                                if (value === result) {
                                    icon = contourColorValues[i];
                                }
                            })
                        }

                        if (newmarker.contentString === undefined) {
                            newmarker.contentString = '';
                        }


                        if (prop.toString().toUpperCase() === "NO3" || prop.toString().toUpperCase() === "NO3N") {
                            newmarker.contentString += '<p style=\"margin-bottom:5px;\"><strong>' + prop + ': </strong>' + data[i][prop] + ' mg/l</p>'
                        }
                        else if (prop.toString().toUpperCase() === "EC" || prop.toString().toUpperCase() === "CONDUCTIVITY") {
                            newmarker.contentString += '<p style=\"margin-bottom:5px;\"><strong>' + prop + ': </strong>' + data[i][prop] + ' umhos/cm</p>'
                        }
                        else if (prop.toString().toUpperCase() === "DAIRY") {
                            if (data[i][prop]) { //is it on a dairy?
                                newmarker.contentString += '<p style=\"margin-bottom:5px;\"><strong>' + prop + ': </strong>Yes</p>'
                            }
                            else {
                                newmarker.contentString += '<p style=\"margin-bottom:5px;\"><strong>' + prop + ': </strong>No</p>'
                            }
                        }
                        else {
                            newmarker.contentString += '<p style=\"margin-bottom:5px;\"><strong>' + prop + ': </strong>' + data[i][prop] + '</p>'
                        }
                    }
                }



                if (newmarker.type === "MARKER") {
                    var newShape = new google.maps.Marker({
                        position: newmarker.position,
                        icon: icon,
                        type: "MARKER",
                        contentString: newmarker.contentString,
                    })

                    if (newmarker.contentString != undefined) {
                        INFOwindow = new google.maps.InfoWindow;
                        newShape.addListener('click', function (e) {
                            INFOwindow.setContent(this.contentString);
                            INFOwindow.setPosition(e.latLng);
                            INFOwindow.setZIndex(500000);
                            INFOwindow.open(mapDiv, this);
                        });
                    }
                }
                else if (newmarker.type === "POLYGON") {
                    var newShape = new google.maps.Polygon({
                        paths: newmarker.getPaths(), //assume there may be more than one polygon getPaths() instead of getPath()
                        //paths:newmarker.temp,
                        strokeColor: icon,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: icon,
                        fillOpacity: 0.35,
                        type: "POLYGON",
                        contentString: newmarker.contentString,
                    })
                    if (newmarker.contentString != undefined) {
                        INFOwindow = new google.maps.InfoWindow;
                        newShape.addListener('click', function (e) {
                            INFOwindow.setContent(this.contentString);
                            INFOwindow.setPosition(e.latLng);
                            INFOwindow.setZIndex(500000);
                            INFOwindow.open(mapDiv, this);
                        });
                    }
                }
                else if (newmarker.type === "POLYLINE") {
                    var newShape = new google.maps.Polyline({
                        path: newmarker.getPath(),
                        geodesic: true,
                        strokeColor: icon,
                        strokeOpacity: 1.0,
                        strokeWeight: 2,
                        type: "POLYLINE",
                        contentString: newmarker.contentString,
                    })
                    if (newmarker.contentString != undefined) {
                        INFOwindow = new google.maps.InfoWindow;
                        newShape.addListener('click', function (e) {
                            INFOwindow.setContent(this.contentString);
                            INFOwindow.setPosition(e.latLng);
                            INFOwindow.setZIndex(500000);
                            INFOwindow.open(mapDiv, this);
                        });
                    }
                }
                else {
                    console.log("ERROR!")
                }

                for (var prop in data[i]) { //add the values to the marker icon
                    var test = prop.toString().toUpperCase();
                    if (test != "ID" && test != "COLUMN1" && test != "IDNO" && test != "OBJECTID" && test != "WELL_ID") {
                        newShape[prop] = data[i][prop];
                    }
                }

                markerNumber++
                newShape.overlayNumber = markerNumber;
                //newShape.id = data[i].Id;
                newShape.tableName = tableName;
                arr.push(newShape);
            }
            mapscript.save.misc(arr);
        }
    },
    save: {
        misc: function (array) {
            for (var i = 0; i < array.length; i++) {
                if (overlays[array[i].tableName] === undefined) {
                    overlays[array[i].tableName] = [];
                }
                if (array[i].type === "MARKER") {
                    overlays[array[i].tableName].push(array[i]);
                }
                else if (array[i].type === "POLYGON") {
                    overlays[array[i].tableName].push(array[i]);
                }
                else if (array[i].type === "POLYLINE") {
                    overlays[array[i].tableName].push(array[i]);
                }
                else {
                    overlays[array[i].tableName].push(array[i]);
                }
                //array[i].setMap(mapDiv); //we only want to save it to the overlays array, not place it on the map... yet
            }
        }
    },
    load: {
        everything: function () {
            var _parcelService = abp.services.app.parcel;
            //pull parcels
            _parcelService.getParcelsForMap().done(function (data) {
                pullParcelData(data);
                var _fieldWellData = abp.services.app.farmEvaluation
                //then pull fields
                _fieldWellData.getFieldsForMap(reportingYear).done(function (data) {
                    pullFieldData(data);
                    //then pull wells
                    _fieldWellData.getWellsForMap(reportingYear).done(function (data) {
                        pullWellData(data);
                    });
                });
            });
        },
        misc: function (array) {
            for (var i = 0; i < array.length; i++) {
                array[i].setMap(mapDiv);
            }
        }
    },
    hide: {
        table: function (array) {
            for (var i = 0; i < array.length; i++) {
                array[i].setMap(null);
            }
        }
    },
    arrSetMap: function (array, map) {
        $.each(array, function (i, val) {
            val.setMap(map);
        })
    },
    search: function (searchTerm) {
        if (overlays.foundItems === undefined) { //defines overlays.foundItems on first run.
            overlays.foundItems = [];
        }
        if (searchTerm === '') {
            mapscript.arrSetMap(overlays.foundItems, null); //setMap(null) for any previously found items
            mapscript.overlay.recolor(overlays.parcels, overlays.settings.polygonColor)//reset any previously searched items DO THIS AFTER HIDING FOUNDITEMS
            overlays.foundItems = [];
        }
        else {
            mapscript.arrSetMap(overlays.foundItems, null); //setMap(null) for any previously found items
            mapscript.overlay.recolor(overlays.parcels, overlays.settings.polygonColor) //reset any previously searched items DO THIS AFTER HIDING FOUNDITEMS
            overlays.foundItems = [];

            var regex = new RegExp('(' + searchTerm + ')', 'ig'); //create RegEx term using variable

            function recursiveSearch(object) {
                for (val in object) {
                    if (val.toString().search(/(apn)+|(\bfield\b)/ig) != -1 && object[val].toString().search(regex) != -1) { //look for the property containing "apn"
                        object.setMap(null)
                        overlays.foundItems.push(object) //add found item to array so we can fit bounds
                        break;
                    }
                    else if (typeof object[val] === "object" && typeof object[val] != "function" && val.toString().search(/(gm)|(founditems)|(anchorPoint)|(map)|(e3)|(position)|(icon)|(latLngs)|(changed)|(capture)|(\bwd\b)|(\bd\b)|(\bm\b)|(\bj\b)|(draggable)|(editable)/ig) === -1) { //ignores googles infinite objects
                        recursiveSearch(object[val]);//dig deeper if you need to
                    }
                }

            }
            recursiveSearch(overlays)
            if (overlays.foundItems != []) {
                mapscript.overlay.recolor(overlays.foundItems, 'red', '../../Areas/Mpa/Common/Images/searchIcon.png') //expects an array and a color
                mapscript.fitBoundsToArray(overlays.foundItems) //fit bounds to found items
            }
            else {

            }
        }

    },
    add: {
        button: {
            all: function () {
                initMapButtons()
            },
            custom: function (buttonText, id) {
                var addCustomButtonDiv = document.createElement('div');
                var AddShowHideFields = new addCustomButton(addCustomButtonDiv, mapDiv);
                addCustomButtonDiv.index = 2;
                mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addCustomButtonDiv);

                function addCustomButton(controlDiv, mapDiv) {
                    var controlUI = document.createElement('div');
                    $(controlUI).attr({
                        'title': buttonText,
                        'class': 'gmapButton in-map-buttons show-hide',
                        'id': id,
                    });
                    $(controlDiv).append(controlUI);
                    var controlText = document.createElement('div');
                    $(controlText)
                        .attr({
                            'class': 'in-map-buttons-text',
                        }).html(buttonText);
                    $(controlUI).append(controlText);
                }
            },
            search: function () {

                var searchBox = document.createElement('div');
                var searchCreate = new createSerachfield(searchBox, mapDiv);
                searchBox.index = 3;
                mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBox);
                function createSerachfield(controlDiv, mapDiv) {
                    var searchInput = document.createElement('input');
                    $(searchInput).attr({
                        'class': 'searchField form-element gmapButton in-map-search',
                        'type': 'text',
                        'placeholder': 'Search For APN/Field',
                    })
                    $(controlDiv).attr({
                        'class': 'searchFieldwrap'
                    })
                    $(controlDiv).append(searchInput);
                }

                var addCustomButtonDiv = document.createElement('div');
                var AddShowHideFields = new addCustomButton(addCustomButtonDiv, mapDiv);
                addCustomButtonDiv.index = 3;
                mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addCustomButtonDiv);

                function addCustomButton(controlDiv, mapDiv) {
                    var controlUI = document.createElement('div');
                    $(controlUI).attr({
                        'title': "Search",
                        'class': 'gmapButton in-map-buttons search',
                        'id': 'mapSearch',
                    });
                    $(controlDiv).append(controlUI);
                    var controlText = document.createElement('div');
                    $(controlText)
                        .attr({
                            'class': 'in-map-buttons-text',
                        }).html("Search");
                    $(controlUI).append(controlText);
                }
            },
        }
    },
    fitBounds: function (callMe) {
        var bounds = new google.maps.LatLngBounds();
        var nonEmptyArrays = 0;
        for (var prop in overlays) {
            if (overlays[prop].length > 0) {
                for (var i = 0; i < overlays[prop].length; i++) {
                    if (overlays[prop][i].type === "MARKER") {
                        bounds.extend(overlays[prop][i].getPosition());
                    }
                    else if (overlays[prop][i].tableName.toString().toUpperCase() === "COUNTY_BOUNDARY") {//exclude any tables here
                        console.log('french fries');
                    }
                    else {
                        var tempVerticies = overlays[prop][i].getPath();
                        for (var j = 0; j < tempVerticies.length; j++) {
                            bounds.extend(new google.maps.LatLng(tempVerticies.getAt(j).lat(), tempVerticies.getAt(j).lng()));
                        }
                    }
                }
                nonEmptyArrays++;
            }
        }
        if (!nonEmptyArrays) {
            console.log("No polygons, defaulting map location.")
            mapDiv.setZoom(11);
            mapDiv.setCenter({ lat: 35.9844234, lng: -119.1373632 });
            if (callMe) {
                callMe();
            }
        }
        else {
            mapDiv.fitBounds(bounds);
            if (callMe) {
                callMe();

            }
        }
    },
    fitBoundsToArray: function (array) {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < array.length; i++) {
            if (array[i].type === "MARKER") {
                bounds.extend(array[i].getPosition());
            }
            else {
                var tempVerticies = array[i].getPath();
                for (var j = 0; j < tempVerticies.length; j++) {
                    bounds.extend(new google.maps.LatLng(tempVerticies.getAt(j).lat(), tempVerticies.getAt(j).lng()));
                }
            }
        }
        mapDiv.fitBounds(bounds);
    },
    fitBoundsDefault: function () {
        mapDiv.setZoom(11);
        mapDiv.setCenter({ lat: 35.9844234, lng: -119.1373632 });
    },
    parse: {
        WKT: function (ps) {
            //console.log(ps);
            ps = ps.toString();
            var i, j, lat, lng, tmp, tmpArr = [],
                arr = [],
                //match '(' and ')' plus contents between them which contain anything other than '(' or ')'
                m = ps.match(/\([^\(\)]+\)/g),
                type = ps.match(/.+?(?= \()/);
            if (m !== null && type[0] !== "POINT") {
                for (i = 0; i < m.length; i++) {
                    //match all numeric strings
                    tmp = m[i].match(/-?\d+\.?\d*/g);
                    if (tmp !== null) {
                        //convert all the coordinate sets in tmp from strings to Numbers and convert to LatLng objects
                        for (j = 0, tmpArr = []; j < tmp.length; j += 2) {
                            lat = Number(tmp[j + 1]);
                            lng = Number(tmp[j]);
                            tmpArr.push({ lat: lat, lng: lng });
                        }
                        arr.push(tmpArr);
                    }
                }
                if (type[0] === "POLYGON" || type[0] === "MULTIPOLYGON") {
                    var newShape = new google.maps.Polygon({
                        paths: arr,
                        temp: arr,
                        type: "POLYGON",
                    })
                    return newShape
                }
                else if (type[0] === "LINESTRING") {
                    var newShape = new google.maps.Polyline({
                        path: arr[0],
                        geodesic: true,
                        type: "POLYLINE",
                    })
                    return newShape
                }
                else if (type[0] === "MULTILINESTRING") {
                    var newShape = new google.maps.Polyline({
                        paths: arr,
                        geodesic: true,
                        type: "POLYLINE",
                    })
                    return newShape
                }
            }
            else if (m !== null && type[0] === "POINT") {
                //tmp = m[0].match(/-?\d+\.?\d*/g);
                //return { lat: parseFloat(tmp[0]), lng: parseFloat(tmp[1]) };
                var begginning = "POINT (";
                var ending = ")";
                ps = ps.replace(begginning, "").replace(ending, "");
                var latlng = ps.split(" ");
                latlng = { lat: parseFloat(latlng[1]), lng: parseFloat(latlng[0]) }
                var newShape = new google.maps.Marker({
                    position: latlng,
                    type: "MARKER",
                })
                return newShape;
            }
            else {
                console.log('ERROR IN mapscript.Parse.WKT FUNCTION')
            }
        },
        WKTGetPosition: function (ps) {
            //console.log(ps);
            ps = ps.toString();
            var i, j, lat, lng, tmp, tmpArr = [],
                arr = [],
                //match '(' and ')' plus contents between them which contain anything other than '(' or ')'
                m = ps.match(/\([^\(\)]+\)/g),
                type = ps.match(/.+?(?= \()/);
            if (m !== null && type[0] !== "POINT") {
                for (i = 0; i < m.length; i++) {
                    //match all numeric strings
                    tmp = m[i].match(/-?\d+\.?\d*/g);
                    if (tmp !== null) {
                        //convert all the coordinate sets in tmp from strings to Numbers and convert to LatLng objects
                        for (j = 0, tmpArr = []; j < tmp.length; j += 2) {
                            lat = Number(tmp[j + 1]);
                            lng = Number(tmp[j]);
                            tmpArr.push({ lat: lat, lng: lng });
                        }
                        arr.push(tmpArr);
                    }
                }
                if (type[0] === "POLYGON" || type[0] === "MULTIPOLYGON") {

                    return arr
                }
                else if (type[0] === "LINESTRING") {

                    return arr[0]
                }
            }
            else if (m !== null && type[0] === "POINT") {
                //tmp = m[0].match(/-?\d+\.?\d*/g);
                //return { lat: parseFloat(tmp[0]), lng: parseFloat(tmp[1]) };
                var begginning = "POINT (";
                var ending = ")";
                ps = ps.replace(begginning, "").replace(ending, "");
                var latlng = ps.split(" ");
                latlng = { lat: parseFloat(latlng[1]), lng: parseFloat(latlng[0]) }

                return latlng;
            }
            else {
                console.log('ERROR IN mapscript.Parse.WKTGetPosition FUNCTION')
            }
        }
    }
}

//Global functions ------------------------------------------------------------------------------------------------------------------------------------------------
//convert marker wkt
function convertMarkerWKT(wkt) {
    var begginning = "POINT (";
    var ending = ")";
    wkt = wkt.replace(begginning, "").replace(ending, "");
    var latlng = wkt.split(" ");
    latlng = { lat: parseFloat(latlng[1]), lng: parseFloat(latlng[0]) }
    var newShape = new google.maps.Marker({
        position: latlng,
    })
    return newShape;
}
//fits the map to the bounds of the passed objects path
function fitMapToBounds(paths) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < paths.length; i++) {
        for (var j = 0; j < paths[i].length; j++) {
            bounds.extend(new google.maps.LatLng(paths[i].getAt(j).lat(), paths[i].getAt(j).lng()));
        }
    }
    mapDiv.fitBounds(bounds);
}
//searches for an object by name, then deletes it from the map, and the overlays object
function searchAndDestroy(nameKey, nameProp, myArray) {
    var tf = false
    for (var prop in myArray) {
        for (var j = 0; j < myArray[prop].length; j++) {
            if (myArray[prop][j][nameProp] === nameKey) {
                myArray[prop][j].setMap(null);
                myArray[prop].splice(j, 1);
                tf = true;
            }
        }
    }
    return tf;
}
//searches through an object and returns all properties that match namekey
function searchAndReturn(nameKey, nameProp, myArray) {
    var searchResults = []
    nameKey = nameKey.toUpperCase();
    for (var prop in myArray) {
        for (var j = 0; j < myArray[prop].length; j++) {
            if (myArray[prop][j][nameProp].toString().toUpperCase() === nameKey) {
                searchResults.push(myArray[prop][j]);
            }
        }
    }
    if (searchResults[0] === undefined) {
        return false;
    }
    else {
        return searchResults;
    }
}
//set map options
var myLatlng = new google.maps.LatLng(36.022958, -119.166430);
var myOptions = {
    center: myLatlng,
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
};
function _hideShowLabels() {
    console.log('labels changed ' + labelsHidden);
    var element = $('#labelsButton');
    if (!labelsHidden) {
        element.addClass('showLabels');
        element.removeClass('hideLabels');
        element.children().html('Show Labels');
        for (var i = 0; i < textOverlays.text.length; i++) {
            textOverlays.text[i].setMap(null);
        }
    }
    else {
        element.addClass('hideLabels');
        element.removeClass('showLabels');
        element.children().html('Hide Labels');
        for (var i = 0; i < textOverlays.text.length; i++) {
            textOverlays.text[i].setMap(mapDiv);
        }
    }
}
//create custom controls section -------------------------------------------------------------------------------------------

function createSerachfield(controlDiv, mapDiv) {
    var searchInput = document.createElement('input');
    $(searchInput).attr({
        'class': 'searchField form-element gmapButton in-map-search',
        'type': 'text',
        'placeholder': 'Search For APN',
    })
    $(controlDiv).attr({
        'class': 'searchFieldwrap'
    })
    $(controlDiv).append(searchInput);
}
function CenterControl(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Click to show or hide labels',
            'class': 'hideLabels gmapButton in-map-buttons',
            'id': 'labelsButton'
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        })
        .html('Hide Labels');
    $(controlUI).append(controlText);
}
function addShowHideWells(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Click to show or hide Wells',
            'class': 'hideWells gmapButton in-map-buttons',
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        }).html('Hide Wells');

    $(controlUI).append(controlText);
}
function addShowHideFields(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Click to show or hide Fields',
            'class': 'hideFields gmapButton in-map-buttons',
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        }).html('Hide Fields');

    $(controlUI).append(controlText);
}
function addPrintButton(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Print the Map',
            'class': 'gmapButton in-map-buttons',
            'id': 'PrintMap',
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        }).html('Print Map');
    $(controlUI).append(controlText);
}
function addShowHideParcels(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Click to show or hide Parcels',
            'class': 'hideParcels gmapButton in-map-buttons',
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        }).html('Hide Parcels');
    $(controlUI).append(controlText);
}
function createSerachButton(controlDiv, mapDiv) {
    var controlUI = document.createElement('div');
    $(controlUI)
        .attr({
            'title': 'Search',
            'class': 'searchButton gmapButton in-map-buttons',
        });
    $(controlDiv).append(controlUI);
    var controlText = document.createElement('div');
    $(controlText)
        .attr({
            'class': 'in-map-buttons-text',
        }).html('Search');
    $(controlUI).append(controlText);
}
// END create custom controls --------------------------------------------------------------------------------------------------
//text overlay function -----------------------------------------------------------------------------------------------
function TxtOverlay(pos, text, className, mapDiv, object) {
    this.pos = pos;
    this.txt_ = text;
    this.cls_ = className;
    this.map_ = mapDiv;
    this.div_ = null;
    this.setMap(mapDiv);
    textOverlays.text.push(this);
}
TxtOverlay.prototype = new google.maps.OverlayView();
TxtOverlay.prototype.onAdd = function () {
    var div = document.createElement('DIV');
    div.className = this.cls_;
    div.innerHTML = this.txt_;
    this.div_ = div;
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);
    div.style.left = position.x - (div.offsetWidth / 2) + 'px';
    div.style.top = position.y + 'px';
    var panes = this.getPanes();
    panes.floatPane.appendChild(div);
}
TxtOverlay.prototype.draw = function () {
    var overlayProjection = this.getProjection();
    var position = overlayProjection.fromLatLngToDivPixel(this.pos);
    var div = this.div_;
    div.style.left = position.x - (div.offsetWidth / 2) + 'px';
    div.style.top = position.y + 'px';
}
TxtOverlay.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
}
TxtOverlay.prototype.hide = function () {
    if (this.div_) {
        this.div_.style.visibility = "hidden";
    }
}
TxtOverlay.prototype.show = function () {
    if (this.div_) {
        this.div_.style.visibility = "visible";
    }
}
TxtOverlay.prototype.toggle = function () {
    if (this.div_) {
        if (this.div_.style.visibility == "hidden") {
            this.show();
        } else {
            this.hide();
        }
    }
}
TxtOverlay.prototype.toggleDOM = function () {
    if (this.getMap()) {
        this.setMap(null);
    } else {
        this.setMap(this.map_);
    }
}
var updateTextOverlay = function (newShape, mapDiv, object) {
    if (newShape.name != '' || newShape.name != null) {
        var vertices = newShape.getPath();
        var xy = [];
        for (var i = 0; i < vertices.getLength(); i++) {
            xy.push(vertices.getAt(i));
        }
        var bound = new google.maps.LatLngBounds();
        for (i = 0; i < xy.length; i++) {
            bound.extend(new google.maps.LatLng(xy[i].lat(), xy[i].lng()));
        }
        var pos = bound.getCenter();
        newTextOverlay = new TxtOverlay(pos, newShape.name, 'textOverlay', mapDiv, object)
    }
}
//Main map init function here----------------------------------------------------------------------------------------------------
function initMapButtons() {
    //THESE ARE CUSTOM BUTTONS ATTACHED TO THE MAP
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, mapDiv);
    centerControlDiv.index = 1;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(centerControlDiv);
    var addShowHideWellsDiv = document.createElement('div');
    var AddShowHideWells = new addShowHideWells(addShowHideWellsDiv, mapDiv);
    addShowHideWellsDiv.index = 1;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addShowHideWellsDiv);
    var addShowHideParcelsDiv = document.createElement('div');
    var AddShowHideParcels = new addShowHideParcels(addShowHideParcelsDiv, mapDiv);
    addShowHideParcelsDiv.index = 1;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addShowHideParcelsDiv);
    var addShowHideFieldsDiv = document.createElement('div');
    var AddShowHideFields = new addShowHideFields(addShowHideFieldsDiv, mapDiv);
    addShowHideFieldsDiv.index = 1;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addShowHideFieldsDiv);
    var addPrintButtonDiv = document.createElement('div');
    var AddShowHideFields = new addPrintButton(addPrintButtonDiv, mapDiv);
    addPrintButtonDiv.index = 2;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(addPrintButtonDiv);
    var searchBox = document.createElement('div');
    var searchCreate = new createSerachfield(searchBox, mapDiv);
    searchBox.index = 2;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBox);
    var searchbutton = document.createElement('div');
    var searchbuttonCreate = new createSerachButton(searchbutton, mapDiv);
    searchbutton.index = 3;
    mapDiv.controls[google.maps.ControlPosition.TOP_LEFT].push(searchbutton);
}



function initialize(mapElement) {
    searchResult
    lastSearch = undefined;
    markerNumber = 0;
    mapDiv;

    INFOwindow = google.maps.InfoWindow;
    var overlays = {
        settings: {
        }
    }
    textOverlays = {
        text: [],
    };
    mapDiv = new google.maps.Map(mapElement[0], myOptions);
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
                google.maps.drawing.OverlayType.MARKER,
                google.maps.drawing.OverlayType.POLYGON,
            ]
        },
    });
    drawingManager.setMap(mapDiv);
    google.maps.event.addListener(mapDiv, 'click', function () {
        INFOwindow.close();
    });


    google.maps.event.addListener(mapDiv, 'zoom_changed', function () {
        var zoomLevel = mapDiv.getZoom();
        if (zoomLevel > 14) {
            labelsHidden = true;
            _hideShowLabels();
        }
        else if (zoomLevel <= 14) {
            labelsHidden = false;
            _hideShowLabels();
        }
    })
}


function fitMapToPolygon(farmsPoly, bounds) {
    for (var i = 0; i < farmsPoly.length; i++) {
        var tempVerticies = farmsPoly[i].getPath();
        for (var j = 0; j < tempVerticies.length; j++) {
            bounds.extend(new google.maps.LatLng(tempVerticies.getAt(j).lat(), tempVerticies.getAt(j).lng()));
        }
    }
    return bounds;
}

//Fit the map to the bounds of polygons (if there are any)
function fitMapBounds(mapDiv, object) {
    var bounds = new google.maps.LatLngBounds();
    if (object.wells.length > 0 || object.fields.length > 0 || object.parcels.length > 0) {
        console.log("Polygons detected, fitting map to bounds.")
        for (var i = 0; i < overlays.wells.length; i++) {
            bounds.extend(object.wells[i].getPosition());
        }
        //console.log("Expanding bounds for Parcels")
        bounds = fitMapToPolygon(object.parcels, bounds);
        //console.log("Expanding bounds for Fields")
        bounds = fitMapToPolygon(object.fields, bounds);
        mapDiv.fitBounds(bounds);
    }
    else {
        console.log("No polygons, defaulting map location.")
        mapDiv.setZoom(11);
        mapDiv.setCenter({ lat: 35.9844234, lng: -119.1373632 });
    }
};


//PULL DATA FROM GEO-JSON ----------------------------------
function createParcel(shape, color) {
    var newShape = google.maps.Polygon;
    markerNumber++
    return new newShape({
        paths: shape.getPath(),
        strokeColor: "#000000",
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: color,
        fillOpacity: 0.35,
        name: name,
        type: "POLYGON",
        markerNum: markerNumber,
        deletable: false,
        editable: false,
        zIndex: markerNumber,
        userCreated: false,
        category: "parcel",
    });
}
function pullParcelData(data) {
    for (var a = 0; a < data.items.length; a++) {
        if (data.items[a].geometry != null && data.items[a].geometry != undefined) {
            var polyPath = mapscript.parse.WKT(data.items[a].geometry.geometry.wellKnownText);
            var tempShape = new google.maps.Polygon({
                paths: polyPath.temp
            })

            var newShape = createParcel(tempShape, parcelType[data.items[a].parcelStatus])

            newShape.county = data.items[a].county;
            newShape.creationTime = data.items[a].creationTime;
            newShape.irrigatedAcres = data.items[a].irrigatedAcres;
            newShape.parcelStatus = data.items[a].parcelStatus;
            newShape.name = data.items[a].apn
            newShape.totalAcres = data.items[a].totalAcres;

            INFOwindow = new google.maps.InfoWindow;
            newShape.addListener('click', function (e) {
                var contentString =
                    "<h4 class=\"infowindowHeader font-green\">APN #" + this.name + "</h4><hr class=\"infowindowHR\">" +
                    "<p style=\"margin-bottom:5px;\"><strong>Irrigated Acres: </strong>" + this.irrigatedAcres + '</p>' +
                    "<p style=\"margin-bottom:5px;\"><strong>Parcel Status: </strong>" + parcelTypeArray[this.parcelStatus] + '</p>' +
                    "<p style=\"margin-bottom:5px;\"><strong>Total Acres: </strong>" + this.totalAcres + '</p>' +
                    "<p style=\"margin-bottom:5px;\"><strong>County: </strong>" + this.county + '</p>' +
                    "<p style=\"margin-bottom:5px;\"><strong>Creation Time: </strong>" + this.creationTime + '</p>';
                INFOwindow.setContent(contentString);
                INFOwindow.setPosition(e.latLng);
                INFOwindow.setZIndex(500000);
                INFOwindow.open(mapDiv, this);
            });

            updateTextOverlay(newShape, mapDiv, overlays);

            overlays.parcels.push(newShape);
            newShape.setMap(mapDiv)
        }
        else {
            console.log("No geometry data entered for parcel: APN# " + data.items[a].apn)
        }

    }
}

function createField(shape, color) {
    var newShape = google.maps.Polygon;
    markerNumber++
    return new newShape({
        paths: shape.getPath(),
        //strokeColor: color,
        strokeColor: "#FAFF70",
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: color,
        fillOpacity: 0.35,
        name: name,
        type: "POLYGON",
        markerNum: markerNumber,
        deletable: false,
        editable: false,
        zIndex: markerNumber,
        userCreated: false,
        category: "field",
    });
}

function pullFieldData(data) {
    for (var a = 0; a < data.items.length; a++) {
        if (data != null) {
            if (data.items[a].fieldGeometry != null && data.items[a].fieldGeometry != undefined) {
                var polyPath = mapscript.parse.WKT(data.items[a].fieldGeometry.geometry.wellKnownText);
                var tempShape = new google.maps.Polygon({
                    path: polyPath.temp[0],
                })

                var newShape = createField(tempShape, IrrType[data.items[a].irrMethodPrimary]);

                newShape.irrMethodPrimary = data.items[a].irrMethodPrimary;
                newShape.acres = data.items[a].acres;
                newShape.cropType = data.items[a].cropType;
                newShape.cropVariety = data.items[a].cropVariety;
                newShape.name = data.items[a].fieldName
                newShape.practiceName = data.items[a].practiceName;
                newShape.id = data.items[a].id

                updateTextOverlay(newShape, mapDiv, overlays);

                INFOwindow = new google.maps.InfoWindow;
                newShape.addListener('click', function (e) {
                    var contentString =
                        "<h4 class=\"infowindowHeader font-green\">" + this.name + "</h4><hr class=\"infowindowHR\">" +
                        "<p style=\"margin-bottom:5px;\"><strong>Primary Irrigation: </strong>" + irrTypeArray[this.irrMethodPrimary] + "</p>" +
                        "<p style=\"margin-bottom:5px;\"><strong>Acres: </strong>" + this.acres + "</p>" +
                        "<p style=\"margin-bottom:5px;\"><strong>Crop Type: </strong>" + this.cropType + "</p>" +
                        "<p style=\"margin-bottom:5px;\"><strong>Crop Variety: </strong>" + this.cropVariety + "</p>" +
                        "<p style=\"margin-bottom:5px;\"><strong>Practice Name: </strong>" + this.practiceName + "</p>" +
                        "<p style=\"margin-bottom:5px;\"><button class=\"btn btn-primary blue EditFieldMap\" style=\"margin-top:10px;\" data-id=" + this.id + "><i class=\"fa fa-settings\"></i> Edit Field</button></p>";


                    INFOwindow.setContent(contentString);
                    INFOwindow.setPosition(e.latLng);
                    INFOwindow.setZIndex(500000);
                    INFOwindow.open(mapDiv, this);
                });

                overlays.fields.push(newShape);
                newShape.setMap(mapDiv);
            }
            else {
                console.log("No geometry data entered for field: " + data.items[a].fieldName)
            }
        }
        else {
            console.log('NO DATA, is it the correct reporting year?')
        }
    }
}

function createWell(shape) {
    var newShape = google.maps.Marker;
    markerNumber++
    var iconPNG = markerIcon[shape.type];
    if (iconPNG === '' || iconPNG === undefined) {
        iconPNG = defaulticon;
    }
    return new newShape({
        position: shape.getPosition(),
        icon: iconPNG,
        name: shape.wellID,
        type: "MARKER",
        markerNum: markerNumber,
        deletable: false,
        editable: false,
        zIndex: markerNumber,
        userCreated: false,
        category: "well",
        draggable: false,
    });
}

function pullWellData(data) {
    for (var a = 0; a < data.items.length; a++) {
        if (data.items[a].wellLocation != null && data.items[a].wellLocation != undefined) {
            var tempMarker = convertMarkerWKT(data.items[a].wellLocation.geometry.wellKnownText)
            tempMarker.type = data.items[a].type;

            var newMarker = createWell(tempMarker);

            newMarker.wellType = wellTypeArray[data.items[a].type];
            newMarker.name = data.items[a].wellID;
            newMarker.id = data.items[a].id;

            INFOwindow = new google.maps.InfoWindow;
            newMarker.addListener('click', function (e) {

                var contentString =
                    "<h4 class=\"infowindowHeader font-green\">" + this.name + "</h4><hr class=\"infowindowHR\">" +
                    "<p style=\"margin-bottom:5px;\"><strong>Well Type: </strong>" + this.wellType + '</p>' +
                    "<p style=\"margin-bottom:5px;\"><button class=\"btn btn-primary blue EditWellMap\"  style=\"margin-top:10px;\" data-id=" + this.id + "><i class=\"fa fa-settings\"></i> Edit Well</button></p>";
                INFOwindow.setContent(contentString);
                INFOwindow.setPosition(e.latLng);
                INFOwindow.setZIndex(500000);
                INFOwindow.open(mapDiv, this);
            });

            newMarker.setMap(mapDiv);

            overlays.wells.push(newMarker);
        }
        else {
            console.log("No geometry data entered for marker: " + data.items[a].wellID)
        }
    }
    fitMapBounds(mapDiv, overlays);
}
//Main map init function ENDS here----------------------------------------------------------------------------------------------------

//Search function---------------------------------------------------------------------------------------------------------------------------------------------------
function searchFunction(searchQuery) {
    var found = searchAndReturn(searchQuery.toString(), "name", overlays);

    if (!found) {
        if (lastSearch != undefined) {
            searchResult.setMap(null);
            var temp = searchAndReturn(lastSearch.name, "name", overlays);//returns array of results, but we only need one
            temp[0].setMap(mapDiv);
            lastSearch = undefined;
            console.log("reset last searched object");
        }
        if (searchQuery != "") {
            abp.message.warn("Search query not found.", "Not Found");
        }
        $('.searchField').focus();
    }
    else {
        INFOwindow.close();
        //assume there is only one found object
        found = found[0];
        if (found.type === "POLYGON") {
            if (lastSearch != undefined && lastSearch.type != "MARKER") {
                searchResult.setMap(null);
                var temp = searchAndReturn(lastSearch.name, "name", overlays);//returns array of results, but we only need one
                temp[0].setMap(mapDiv);
                console.log("reset last searched object");
                lastSearch = found;
            }
            else {
                lastSearch = found;
            }
            lastSearch.setMap(null);
            searchResult = new google.maps.Polygon({
                paths: found.getPaths(),
                strokeColor: "#ff0000",
                fillColor: "#ff0000",
                name: found.name,
                zIndex: markerNumber + 1,
            });
            if (lastSearch.category === "parcel") {
                searchResult.county = lastSearch.county;
                searchResult.creationTime = lastSearch.creationTime;
                searchResult.irrigatedAcres = lastSearch.irrigatedAcres;
                searchResult.parcelStatus = lastSearch.parcelStatus;
                searchResult.totalAcres = lastSearch.totalAcres;

                INFOwindow = new google.maps.InfoWindow;
                searchResult.addListener('click', function (e) {
                    var contentString =
                        "<strong>APN #" + this.name + "</strong>" +
                        "<br><strong>Irrigated Acres: </strong>" + this.irrigatedAcres +
                        "<br><strong>Parcel Status: </strong>" + parcelTypeArray[this.parcelStatus] +
                        "<br><strong>Total Acres: </strong>" + this.totalAcres +
                        "<br><strong>County: </strong>" + this.county +
                        "<br><strong>Creation Time: </strong>" + this.creationTime;
                    INFOwindow.setContent(contentString);
                    INFOwindow.setPosition(e.latLng);
                    INFOwindow.setZIndex(500000);
                    INFOwindow.open(mapDiv, this);
                });
            }
            else if (lastSearch.category === 'field') {
                searchResult.irrMethodPrimary = lastSearch.irrMethodPrimary;
                searchResult.acres = lastSearch.acres;
                searchResult.cropType = lastSearch.cropType;
                searchResult.cropVariety = lastSearch.cropVariety;
                searchResult.name = lastSearch.name
                searchResult.practiceName = lastSearch.practiceName;
                searchResult.id = lastSearch.id
                INFOwindow = new google.maps.InfoWindow;
                searchResult.addListener('click', function (e) {
                    var contentString =
                        "<strong>" + this.name + "</strong>" +
                        "<br><strong>Primary Irrigation: </strong>" + irrTypeArray[this.irrMethodPrimary] +
                        "<br><strong>Acres: </strong>" + this.acres +
                        "<br><strong>Crop Type: </strong>" + this.cropType +
                        "<br><strong>Crop Variety: </strong>" + this.cropVariety +
                        "<br><strong>Practice Name: </strong>" + this.practiceName +
                        "<br><a class=\"EditFieldMap\" data-id=" + this.id + ">Edit Field</a>";
                    INFOwindow.setContent(contentString);
                    INFOwindow.setPosition(e.latLng);
                    INFOwindow.setZIndex(500000);
                    INFOwindow.open(mapDiv, this);
                });
            }
            searchResult.setMap(mapDiv)
            var bounds = new google.maps.LatLngBounds();
            fitMapToPolygon([searchResult], bounds);
            mapDiv.fitBounds(bounds);
        }
        else if (found.type === "MARKER") {
            mapDiv.panTo(found.getPosition());
            mapDiv.setZoom(17);
            if (lastSearch != undefined) {
                searchResult.setMap(null);
                var temp = searchAndReturn(lastSearch.name, "name", overlays);//returns array of results, but we only need one
                temp[0].setMap(mapDiv);
                console.log("reset last searched object");
                lastSearch = found;
            }
            else {
                lastSearch = found;
            }
        }
        else {
            console.log("Something went wrong searching")
        }
    }
}
//END Search function---------------------------------------------------------------------------------------------------------------------------------------------------

//button click event listeners ----------------------------------------------------------------------------------------------------------------------------------------
function buttonListeners() {
    $(document).on('click', '.searchButton', function () {
        searchFunction($('.searchField').val());
    })
    $(document).on('keyup', '.searchField', function (e) {
        if (e.which == 13) {
            e.preventDefault();
            searchFunction($('.searchField').val());
        }
    })
    $(document).on('click', '.hideLabels', function () {
        labelsHidden = false;
        _hideShowLabels();
    })
    $(document).on('click', '.hideWells', function () {
        $(this).addClass('showWells');
        $(this).removeClass('hideWells');
        $(this).children().html('Show Wells');
        for (var i = 0; i < overlays.wells.length; i++) {
            overlays.wells[i].setMap(null);
        }
    })
    $(document).on('click', '.hideParcels', function () {
        $(this).addClass('showParcels');
        $(this).removeClass('hideParcels');
        $(this).children().html('Show Parcels');
        for (var i = 0; i < overlays.parcels.length; i++) {
            overlays.parcels[i].setMap(null);
        }
    })
    $(document).on('click', '.hideFields', function () {
        $(this).addClass('showFields');
        $(this).removeClass('hideFields');
        $(this).children().html('Show Fields');
        for (var i = 0; i < overlays.fields.length; i++) {
            overlays.fields[i].setMap(null);
        }
    })
    $(document).on('click', '.showLabels', function () {
        labelsHidden = true;
        _hideShowLabels();
    })
    $(document).on('click', '.showWells', function () {
        $(this).addClass('hideWells');
        $(this).removeClass('showWells');
        $(this).children().html('Hide Wells');
        for (var i = 0; i < overlays.wells.length; i++) {
            overlays.wells[i].setMap(mapDiv);
        }
    })
    $(document).on('click', '.showParcels', function () {
        $(this).addClass('hideParcels');
        $(this).removeClass('showParcels');
        $(this).children().html('Hide Parcels');
        for (var i = 0; i < overlays.parcels.length; i++) {
            overlays.parcels[i].setMap(mapDiv);
        }
    })
    $(document).on('click', '.showFields', function () {
        $(this).addClass('hideFields');
        $(this).removeClass('showFields');
        $(this).children().html('Hide Fields');
        for (var i = 0; i < overlays.fields.length; i++) {
            overlays.fields[i].setMap(mapDiv);
        }
    })
    $(document).on('click', '.show-hide', function () {
        if ($(this).text().search(/(show)/ig)) {
            $(this).find('.in-map-buttons-text').text($(this).text().replace(/(hide )/ig, 'Show '))
            $.each(overlays[$(this).attr('id')], function (i, val) {
                val.setMap(null);
            })
        }
        else {
            $(this).find('.in-map-buttons-text').text($(this).text().replace(/(show )/ig, 'Hide '))
            $.each(overlays[$(this).attr('id')], function (i, val) {
                val.setMap(mapDiv);
            })
        }
    })
    $(document).on('click', '#mapSearch', function () {
        mapscript.search($('.searchField').val());
    })
}
$(window).resize(function () {
    mapResize.height($(window).height() * .70);
    mapResize.width($(window).width());
})


// ------------------------------------------------------------- Print Map Function --------------------------------------------------------------//
$(document).on('click', '#PrintMap', function () {
    $('.gmapButton').hide();
    printMaps();
    $('.gmapButton').show();
});


function printMaps() {

    //var content = mapResize[0];
    //var newWindow = window.open();
    //newWindow.document.write(content.innerHTML);
    //newWindow.print();

    var body = $('body');
    var mapContainer = $('#MainMap');
    var mapContainerParent = mapContainer.parent();
    var printContainer = $('<div>');

    printContainer
        .addClass('print-container')
        .css('position', 'relative')
        .height('100%')
        .width('100%')
        .append(mapContainer)
        .prependTo(body);

    var content = body
        .children()
        .not('script')
        .not(printContainer)
        .detach();

    /*
     * Needed for those who use Bootstrap 3.x, because some of
     * its  styles ain't play nicely when printing.
     */
    var patchedStyle = $('<style>')
        .attr('media', 'print')
        .text('img { max-width: none !important; }' +
        'a[href]:after { content: ""; }')
        .appendTo('head');

    window.print();

    body.prepend(content);
    mapContainerParent.prepend(mapContainer);

    printContainer.remove();
    patchedStyle.remove();

    //------------------------------------------------------ testing

    //map = mapDiv
    //map.setOptions({
    //    mapTypeControl: false,
    //    zoomControl: false,
    //    streetViewControl: false,
    //    panControl: false
    //});

    //var popUpAndPrint = function () {
    //    dataUrl = [];

    //    $('#map-canvas canvas').filter(function () {
    //        dataUrl.push(this.toDataURL("image/png"));
    //    })

    //    var container = mapResize;
    //    var clone = container.clone();

    //    var width = container.clientWidth
    //    var height = container.clientHeight



    //    $(clone).find('canvas').each(function (i, item) {
    //        $(item).replaceWith(
    //            $('<img>')
    //                .attr('src', dataUrl[i]))
    //            .css('position', 'absolute')
    //            .css('left', '0')
    //            .css('top', '0')
    //            .css('width', width + 'px')
    //            .css('height', height + 'px');
    //    });

    //    var printWindow = window.open('', 'PrintMap',
    //        'width=' + width + ',height=' + height);



    //    printWindow.document.writeln($(clone).html());
    //    printWindow.document.close();
    //    printWindow.focus();
    //    printWindow.print();
    //    printWindow.close();

    //    map.setOptions({
    //        mapTypeControl: true,
    //        zoomControl: true,
    //        streetViewControl: true,
    //        panControl: true
    //    });
    //};

    //setTimeout(popUpAndPrint, 500);

}
