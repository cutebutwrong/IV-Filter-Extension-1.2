/* The following updates the HTML if not present */
if($('#iv_filter_container').length == 0){
	/* SJ: set IV default on first run, use localStorage */
	if ( (localStorage.getItem('iv_value') in window) ||
	     (localStorage.getItem('iv_ltgt') in window) ||
	     (localStorage.getItem('max_distance') in window)
	    ) {
		/* SJ FIX: always resets */
		localStorage.setItem('iv_value', 0); /* SJ: 96 = 43/45 IV */
		localStorage.setItem('iv_ltgt', "gt");
		localStorage.setItem('max_distance', 30000);
	}
    
	/* SJ: add buttons */
	$HTML =  '<div id="select_big_four"><input type="button" name="select_big_four" value="Big Four" id="select_big_four_btn" style="top: 194px; left: 238px; position: fixed;"></div>';
	$HTML += '<div id="select_rares"><input type="button" name="select_rares" value="Rares" id="select_rares_btn" style="top: 234px; left: 251px; position: fixed;"></div>';
	$('#select_all').after($HTML);
	
	$('#select_big_four_btn').bind('click', function() {
		var arrBigFour = [ 149, 143, 131, 113 ]; /* Dragonite, Snorlax, Lapras, Chansey */
		for(var p=0; p< arrBigFour.length;p++) {
			checkPokemon(arrBigFour[p]);
			$('#checkbox_'+arrBigFour[p]).prop('checked', true);
		}
		inserted = 0;
	});
	$('#select_rares_btn').bind('click', function() {
		/* Gyarados, Venusaur, Charizard, Blastoise, Arcanine, Alakazam, Machamp, Golem, Muk, Exeggutor, Hitmonlee, Lickitung, Rhydon, Aerodactyl, Vaporeon, Jolteon, Flareon, Tangela, Ditto */
		var arrRares = [ 130, 3, 6, 9, 59, 65, 68, 76, 89, 103, 106, 107, 108, 112, 142, 113, 134, 135, 136, 137, 114, 132 ];
		for(var p=0; p< arrRares.length;p++) {
			checkPokemon(arrRares[p]);
			$('#checkbox_'+arrRares[p]).prop('checked', true);
		}
		inserted = 0;
	});

	/* SJ change: to tidy layout */
	$HTML = '<div id="iv_filter_container" style="padding: 10px; font-family: -apple-system, Helvetica, Arial, sans-serif; display: block;">';
	$HTML += 'IV <select id="IV_FILTER_LTGT">';
	$HTML += '<option value="gt" ' + ('gt'==localStorage.getItem('iv_ltgt') ? 'selected="selected"' : '') + '>&gt;<option>';
	$HTML += '<option value="eq" ' + ('eq'==localStorage.getItem('iv_ltgt') ? 'selected="selected"' : '') + '>=<option>';
	$HTML += '<option value="lt" ' + ('lt'==localStorage.getItem('iv_ltgt') ? 'selected="selected"' : '') + '>&lt;<option></select>\n';
	$HTML += '<select id="IV_FILTER_VALUE">\n';
	$HTML += '<option value="" disabled="disabled">Select IV value</option>';
	for( i = 45; i >= 0; i--){
		var rndPerc = Math.round(i/45*100);
		$HTML += '<option value="'+rndPerc+'" ' + (rndPerc==localStorage.getItem('iv_value') ? 'selected="selected">' : '>') + rndPerc + '%</option>\n';
	} 
	$HTML += '</select>\n';
	$HTML += '<p />Within <input type="text" id="MAX_DISTANCE" value="' + localStorage.getItem('max_distance') + '" /> m';
	$HTML += '</div>';
	
	$('#select_all').after($HTML);
}

/* New functions */
function getIVFilter(){
	return localStorage.getItem('iv_value');
}

function setIVFilter(){
	localStorage.setItem('iv_value', parseInt($('#IV_FILTER_VALUE').val()));
	console.log("IV_FILTER_VALUE changed to %s", localStorage.getItem('iv_value'));
	localStorage.setItem('iv_ltgt', "gt");
	switch ( $('#IV_FILTER_LTGT').val() ) {
		case "lt":
			localStorage.setItem('iv_ltgt', "lt");
			break;
		case "eq":
			localStorage.setItem('iv_ltgt', "eq");
			break;
	}
	console.log("IV_FILTER_LTGT changed to %s", localStorage.getItem('iv_ltgt'));
};
$('#IV_FILTER_VALUE').on('change', function(){
	setIVFilter();
	forceReloadPokemons();
});
$('#IV_FILTER_LTGT').on('change', function(){
	setIVFilter();
	forceReloadPokemons();
});
$('#MAX_DISTANCE').on('change', function(){
	/* SJ: between 500m and 30km */
	console.log("MAX_DISTANCE %s", parseInt($('#MAX_DISTANCE').val()) );
	if ( (parseInt($('#MAX_DISTANCE').val()) < 100) || (parseInt($('#MAX_DISTANCE').val()) > 30000) || (parseInt($('#MAX_DISTANCE').val()) === NaN ) ) {
		localStorage.setItem('max_distance', 30000);
	} else {
		localStorage.setItem('max_distance', parseInt($('#MAX_DISTANCE').val()));
	}
	$('#MAX_DISTANCE').val(localStorage.getItem('max_distance'));
	console.log("MAX_DISTANCE changed to %s", localStorage.getItem('max_distance'));
	forceReloadPokemons();
});

/* forceReloadPokemons */
function forceReloadPokemons() {
	var $checkedMons = [];
	// store checked mons
	$(".filter_checkbox input:checked").each(function(){
		$checkedMons.push($(this));
	});
	// remove all mons
	for (var key in pokeDict) {
		uncheckPokemon(key);
	};
  	inserted = 0;
	processNewPokemons({});
	// Add back pokemon
	$($checkedMons).each(function(){
        var tmpPokemon = pokeDict[this.val()];
        if (tmpPokemon['show_filter']) {
          $(this).prop('checked', true);
          checkPokemon($(this).val());
        }          
	});
	var mons = '&mons=';
  	
  	for (var i in pokeDict) {
    	if (isPokemonChecked(i) || shouldTurnFilterOff()) {
      	mons += i + ',';
    	}
  	}
  	
  	mons = mons.slice(0, -1);
  	  
  	var doneFunction = function(data) {
  		//console.log(">>>>> data is:");
  		//console.log(data);
    	var newPokemons = data['pokemons'];
    	var meta = data['meta'];
    	    
    	timeOffset = Math.floor(Date.now() / 1000) - parseInt(meta['time']);
  	  	processNewPokemons(newPokemons);
  	  	reloadPokemons();
  	}
  
	$.ajax({
		type: 'GET',
		url: 'query2.php?since='+ inserted + mons
	}).done(doneFunction);

};


/* New version of processNewPokemons */
function processNewPokemons(newPokemons) {
  var shouldHide = true;
  if (map.getZoom() >= 14 || (markers.length + newPokemons.length) <= 15) {
    // shouldHide = false;
  }
  
  for (var i = 0; i < newPokemons.length; ++i) {
    if (!newPokemons[i]['disguise']) {
      newPokemons[i]['disguise'] = 0;
    }
    
    if (!newPokemons[i]['attack']) {
      newPokemons[i]['attack'] = -1;
    }
    
    if (!newPokemons[i]['defence']) {
      newPokemons[i]['defence'] = -1;
    }
    
    if (!newPokemons[i]['stamina']) {
      newPokemons[i]['stamina'] = -1;
    }
    
    if (!newPokemons[i]['move1']) {
      newPokemons[i]['move1'] = -1;
    }
    
    if (!newPokemons[i]['move2']) {
      newPokemons[i]['move2'] = -1;
    }
    
    var pokemon = new Pokemon(newPokemons[i]['pokemon_id'], new Point(newPokemons[i]['lat'], newPokemons[i]['lng']), newPokemons[i]['despawn'], newPokemons[i]['disguise'], newPokemons[i]['attack'], newPokemons[i]['defence'], newPokemons[i]['stamina'], newPokemons[i]['move1'], newPokemons[i]['move2']);
    var currentUnixTime = Math.floor(Date.now() / 1000) - timeOffset;
    
    /* SJ: added filters for less than and equal to as well as more than */
    var pkmnIv = Math.round((parseInt(newPokemons[i]['attack'])+parseInt(newPokemons[i]['defence'])+parseInt(newPokemons[i]['stamina']))/45*100);
    var isIV = (pkmnIv >= localStorage.getItem('iv_value'));
    switch(localStorage.getItem('iv_ltgt')) {
	case 'lt':
		isIV = (pkmnIv <= localStorage.getItem('iv_value'));
		break;
	case 'eq':
		isIV = (pkmnIv == localStorage.getItem('iv_value'));
		break;
    }
    var isDistance = true;
    if ( isLocationSet() ) {
	isDistance = (pokemon.howFarAway() <= localStorage.getItem('max_distance'));
    }
    
        
    if (currentUnixTime < pokemon.despawn && isIV && isDistance) {
      var index = indexOfPokemons(pokemon, pokemons);
      if (index == -1) {
        pokemons.push(pokemon);        
        
        var markerLocation = new L.LatLng(pokemon.center.lat, pokemon.center.lng);

        var iconDimension = 36;
        var iconOptions = {
          iconSize: [iconDimension, iconDimension],
          iconAnchor: [iconDimension/2, iconDimension],
          popupAnchor: [0, -iconDimension],
          zIndexOffset: -1000,
          html : pokeHTML(pokemon, shouldHide)
        }
        var htmlIcon = new L.HtmlIcon(iconOptions);

        var marker = new L.Marker(markerLocation, {icon: htmlIcon});
        if (isPokemonChecked(pokemon.id) || shouldTurnFilterOff()) {
          marker.addTo(map);
        }
        
        marker.bindPopup("");
        markers.push(marker);
        marker.addEventListener('click', function(e) {
          selectedMarker = e.target;
          var index = -1;
          for (var i = 0; i < markers.length; ++i) {
            if (markers[i] == selectedMarker) {
              index = i;
              break;
            }
          }
          if (index != -1) {
            selectedMarker.bindPopup(infoWindowString(pokemons[index]));
          }
        });
        
        if (parseFloat(newPokemons[i]['lat']) == hashPokemonLat && parseFloat(newPokemons[i]['lng']) == hashPokemonLng) {
          hashPokemonLat = 0;
          hashPokemonLng = 0;
          selectedMarker = marker;
          selectedMarker.bindPopup(infoWindowString(pokemon));
          selectedMarker.openPopup();
        }
      }
    }
  }
  refreshPokemons();
}

/* SJ: added location functions */
function isLocationSet() {
	if (!locationMarker) {
		return false;
	} else {
		return true;
	}
}
function toRadians ( numDegrees ) {
	return numDegrees / (Math.PI / 180);
}
function distanceAsTheCrowFlies(lat1,lon1,lat2,lon2) {	
	/* only as accurate as the GPS */
	var e = Math, ra = e.PI/180;
	var b = lat1 * ra, c = lat2 * ra, d = b - c;
	var g = lon1 * ra - lon2 * ra;
	var f = 2 * e.asin(e.sqrt(e.pow(e.sin(d/2), 2) + e.cos(b) * e.cos(c) * e.pow(e.sin(g/2), 2)));
	return Math.round(f * 6378.137 * 1000); /* metres */
}
function getDistance(lat2,lon2) {
	if(!isLocationSet()) {
		return -1;
	} else {
		var lat1 = locationMarker.getLatLng().lat;
		var lon1 = locationMarker.getLatLng().lng;
		return distanceAsTheCrowFlies(lat1,lon1,lat2,lon2);
	}
}
function formatDistance(numMetres) {
	// console.log("numMetres is %s", numMetres);
	if (Number.isInteger(numMetres) && numMetres >= 0) {
		var strDistance = "" + numMetres + "m";
		if (numMetres > 1000 ) {
			strDistance = (Math.round(numMetres / 100) / 10);
			strDistance += "km";
		}
		return strDistance;	
	}
	return "";
}

function Pokemon(pokemon_id, center, despawn, disguise, attack, defence, stamina, move1, move2) {
  this.id = pokemon_id;
  this.center = center;
  this.despawn = parseInt(despawn);
  this.disguise = parseInt(disguise);
  this.attack = parseInt(attack);
  this.defence = parseInt(defence);
  this.stamina = parseInt(stamina);
  this.move1 = parseInt(move1);
  this.move2 = parseInt(move2);
  
  this.isEqual = function(pokemon) {
    return (this.id == pokemon.id && 
            this.center.lat == pokemon.center.lat &&
            this.center.lng == pokemon.center.lng &&
            this.despawn == pokemon.despawn);
  }
  
  this.remainingTime = function() {
    var currentUnixTime = Math.floor(Date.now() / 1000) - timeOffset;
    var remain = this.despawn - currentUnixTime;
    return remain;
  }
  /* SJ: added distance function for when position is set */
  this.howFarAway = function() {
    var distance = getDistance(this.center.lat,this.center.lng);
    // console.log("distance changed to %s", distance);
    return distance;
  }  
}

function infoWindowString(pokemon) {
  
  var disguiseString = "";
  if (pokemon.disguise != 0) {
    disguiseString = " (" + getDisguisePokemonName(pokemon) + ")";
  }
  
  var ivString = "<b>IV</b>: unknown";
  
  var movesetString = "<b>Moveset</b>: unknown";
  if (pokemon.attack != -1 && pokemon.defence != -1 && pokemon.stamina != -1 && pokemon.move1 != -1 && pokemon.move2 != -1) {
    ivString = "<b>IV</b>: "+ pokemon.attack + " | " + pokemon.defence + " | " + pokemon.stamina + " (" + Math.floor((pokemon.attack + pokemon.defence + pokemon.stamina)/45 * 100) + "%)";
    movesetString = "<b>Moveset:</b><br />" + getMoveName(pokemon.move1) + " | " + getMoveName(pokemon.move2);
  }
  
  ivString += "<br />";
  movesetString += "<br /><br />";
  
  /* SJ: added distance display */
  var distanceString = ' | <a target="_blank" href="http://maps.google.com/maps?q=' + pokemon.center.lat + ',' + pokemon.center.lng + '&zoom=14">Maps</a>';
  if (isLocationSet()) {
	distanceString += " &gt; " + formatDistance(pokemon.howFarAway());
  }
  
  return '<b>' + getPokemonName(pokemon) + disguiseString + "</b><br />" + ivString + movesetString + timeToString(pokemon.remainingTime()) + distanceString;
}

/* only if run as stand alone */
forceReloadPokemons();