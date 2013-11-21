//
// BEGIN TrivialCV module
//

var es = es || {}
es.ucm = es.ucm || {}
es.ucm.fdi = es.ucm.fdi || {}
es.ucm.fdi.trivialcv = es.ucm.fdi.trivialcv || {}
es.ucm.fdi.trivialcv.loadModule = function ($, global, window, undefined) {

function parseUrl (url) {
  var i, pair, params, length
    , a = window.document.createElement("a")
    , result = {};

  a.href = url;
  
  result['url'] = url;
  result['protocol'] = a.protocol.substring(0, a.protocol.length - 1);
  result['host'] = a.host;
  result['port'] = a.port;
  result['path'] = a.pathname;
  result['params'] = {};

  params = a.search.substr(1);
  params = params.split('&');
  length = params.length
  for(i = 0; i < length; i++) {
    pair = params[i].split('=');
    result.params[pair[0]] = pair[1];
  }
  return result;
}

function getScos() {
  if (DEBUG) {
    var mockScos = []
      , mockSco = null
      , mockRequest = $.Deferred();
	
    mockSco = {}
    mockSco["id"] = '12345';
    mockSco["href"] = '/mod/sco/view.php?id=6789';
    mockSco["name"] = 'SCO 1';
    mockSco["report"] = '/mod/sco/report.php?id=6789';
    mockScos.push(mockSco);

    mockSco = {}
    mockSco["id"] = '54321';
    mockSco["href"] = '/mod/sco/view.php?id=9876';
    mockSco["name"] = 'SCO 2';
    mockSco["report"] = '/mod/sco/report.php?id=9876';
    mockScos.push(mockSco);

    mockRequest.resolve(mockScos);
    
    return mockRequest;
  }
  var moodleUrl = baseUrl+"/mod/scorm/index.php?id="+courseId
    , request = $.ajax(moodleUrl)
    , chained;
  chained = request.then( function (contenido) {
    var i, scoLink, scoHref, sco
      , scos = []
      , rows = $("div#content tr:gt(0)", contenido)
      , rowsLength = rows.length;
    for(i = 0; i < rowsLength; i++) {
      scoLink = $("td:nth-child(2) a", rows[i])
      scoHref = scoLink.attr("href");
      scoUrl = parseUrl(scoHref);
      
      sco = {}
      sco["id"] = scoUrl.params.id;
      sco["href"] = scoUrl.url;
      sco["name"] = scoLink.text();
      sco["report"] = $("td:nth-child(4) a", rows[i]).attr("href");
      scos.push(sco);
    }
    return scos;
  });
  return chained;
}


function scoreComparator (a,b) { 
  if(a.score > b.score) {
    return -1
  } else if (a.score < b.score){
    return 1
  }
  return 0
}

function getRank(scoId) {
  if (DEBUG) {
    var mockScoresArray = []
      , mockStudent = null
      , mockRequest = $.Deferred();
	
    mockStudent = '/user/view.php?id=11111';
    mockScoresArray[mockStudent] = {};
    mockScoresArray[mockStudent]["href"] = mockStudent;
    mockScoresArray[mockStudent]["name"] = 'Estudiante 1';
    mockScoresArray[mockStudent]["score"] = 12;
    mockScoresArray.push(mockStudent);
    
    mockStudent = '/user/view.php?id=22222';
    mockScoresArray[mockStudent] = {};
    mockScoresArray[mockStudent]["href"] = mockStudent;
    mockScoresArray[mockStudent]["name"] = 'Estudiante 2';
    mockScoresArray[mockStudent]["score"] = 30;
    mockScoresArray.push(mockStudent);

    mockStudent = '/user/view.php?id=33333';
    mockScoresArray[mockStudent] = {};
    mockScoresArray[mockStudent]["href"] = mockStudent;
    mockScoresArray[mockStudent]["name"] = 'Estudiante 3';
    mockScoresArray[mockStudent]["score"] = 25;
    mockScoresArray.push(mockStudent);
    
    mockRequest.resolve(mockScoresArray);
    
    return mockRequest;
  }
  var moodleUrl = baseUrl+"/mod/scorm/report.php?id="+scoId
    , request = $.ajax(moodleUrl)
    , chained;
  
  chained = request.then(function (contenido) {
    var i, studentScore, student, score, key
      , scores = {}
      , scoresArray = []
      , rows = $("div#scormtablecontainer tr:gt(0)", contenido), rowsLength = rows.length;
    for(i = 0; i < rowsLength; i++) {
      studentScore = $("td:nth-child(3) a", rows[i]);
      student = studentScore.attr("href");

      scores[student] = scores[student] || {};
      scores[student]["href"] = student;
      scores[student]["name"] = studentScore.text();
      
      score = parseFloat($("td:nth-child(7)", rows[i]).text());
      if ( !scores[student]["score"] ) {
        scores[student]["score"] = score;
      } else {
        scores[student]["score"]= Math.max(scores[student]["score"], score);
      }
    }
    
    for(key in scores) {
      if (scores.hasOwnProperty(key)) {
        scoresArray.push(scores[key]);
      }
    }
    scoresArray.sort(scoreComparator);
    return scoresArray;
  });
  return chained;
}

function getRanks() {
  if (DEBUG) {
    var mockRequest = getRank();
    
    return mockRequest.then( function (data) {
      var mockRanks = []
        , mockChained = $.Deferred();
      mockRanks['12345'] = data;
      mockRanks['54321'] = data;
      mockChained.resolve(mockRanks);
      return mockChained;
    });
  }
  function saveRank (scoId, ranks) {
    function saveRankForSco (scoRank) {
      ranks[scoId] = scoRank;
    }
    return saveRankForSco
  }

  var request = getScos()
    , chained;
  chained = request.then(function (scos) {
      var i, rank
        , ranks = {}
        , requests=[]
        , scosLength = scos.length;
      for(i = 0; i < scosLength; i++) {
        rank = getRank(scos[i].id);
        rank.then(saveRank(scos[i].id, ranks))
        requests.push(rank)
      }
      return $.when.apply($, requests).then(function() {
        return ranks;
      });
  })
  
  return chained;
}

function encodeFormUrlEncode(data) {
  var i
    , result = ""
    , dataLength = data.length;

  for (i=0; i < dataLength; i++) {
    if (i > 0) {
      result += "&"
    }
    result += encodeURIComponent(data[i].name)+"="+encodeURIComponent(data[i].value)
  }

  return result;
}

function updateRanksFile () {
  if (DEBUG) {
    var mockRequest = $.Deferred();
    mockRequest.resolve();
    console.log('updateRanksFile called');
    return mockRequest;
  }
  var request = getRanks()
    , chained;

  chained = request.then(function (ranks) {
    var i
      , moodleUrl = baseUrl+"/files/index.php"
      , data = [ {name: 'id', value : courseId, type: 'regular' }
        , {name: 'choose', value : '', type: 'regular'}
        , {name: 'wdir', value : '/', type: 'regular'}
        , {name: 'action', value : 'edit', type: 'regular'}
        , {name: 'sesskey', value : sesskey, type: 'regular'}
        , {name: 'file', value : '/trivialcv-ranking.txt', type: 'regular'}
        , {name: 'text', value : JSON.stringify(ranks), type: 'regular'}
      ]
      , formData = encodeFormUrlEncode(data);
    
    return $.ajax({url : moodleUrl, type : 'POST', data : formData});
  });

  return chained;
}

function encodeFormMultipartFormData(data, boundary) {
  var formData = '--' + boundary + '\r\n'
    , length = data.length
    , i;

  for (i=0; i < length; i++) {
    if (i > 0) {
      formData += '--' + boundary + '\r\n';
    }
    formData += 'Content-Disposition: form-data; name="'+data[i].name+'"'
    if (data[i].type == "file") {
      formData += '; filename="'+data[i].filename+'"\r\n'
        + 'Content-Type: text/plain'
    }
    formData += '\r\n\r\n' + data[i].value + '\r\n';
  }

  formData += '--' + boundary + '--'+ '\r\n';
  return formData;
}

function uploadRanksFile() {
  if (DEBUG) {
    var mockRequest = $.Deferred();
    mockRequest.resolve();
    console.log('uploadRanksFile called');
    return mockRequest;
  }
  var request = getRanks()
    , chained;

  chained = request.then(function (ranks) {

    var moodleUrl = baseUrl+"/files/index.php"
      , data = [ {name: 'id', value : courseId, type: 'regular' }
        , {name: 'choose', value : '', type: 'regular'}
        , {name: 'wdir', value : '/', type: 'regular'}
        , {name: 'action', value : 'upload', type: 'regular'}
        , {name: 'sesskey', value : sesskey, type: 'regular'}
        , {name: 'MAX_FILE_SIZE', value : '52428800', type: 'regular'}
        , {name: 'save', value : 'Subir este archivo', type: 'regular'}
        , {name: 'userfile', value : JSON.stringify(ranks), filename: 'trivialcv-ranking.txt', type: 'file'}
      ]
      , boundary = "----4UBJmfT8ymSp2w"
      , requestContentType = "multipart/form-data; boundary="+boundary
      , formData = encodeFormMultipartFormData(data, boundary);
    return $.ajax({url : moodleUrl, type: 'POST', contentType: requestContentType, data : formData });


/*
    var moodleUrl = baseUrl+"/files/index.php"
      , data = [ {name: 'id', value : courseId, type: 'regular' }
        , {name: 'choose', value : '', type: 'regular'}
        , {name: 'wdir', value : '/', type: 'regular'}
        , {name: 'action', value : 'upload', type: 'regular'}
        , {name: 'sesskey', value : sesskey, type: 'regular'}
        , {name: 'MAX_FILE_SIZE', value : '52428800', type: 'regular'}
        , {name: 'save', value : 'Subir este archivo', type: 'regular'}
        , {name: 'userfile', value : JSON.stringify(ranks), filename: 'trivialcv-ranking.txt', type: 'file'}
      ],
      length = data.length;
    var formData = new FormData();
    for (i=0; i < length; i++) {
      if (data[i].type == "file") {
        var blob = new Blob([data[i].value], {type:'text/plain'})
        formData.append(data[i].name, blob, data[i].filename);
      } else {
        formData.append(data[i].name, data[i].value);
      }
    }
    return $.ajax({url : moodleUrl, type: 'POST', contentType: false, processData: false, data : formData });
*/

  });
  return chained;
}

function storeRanks() {
  if (DEBUG) {
    var mockRequest = $.Deferred();
    mockRequest.resolve();
    console.log('storeRanks called');
    return mockRequest;
  }
  var moodleUrl = baseUrl+"/file.php/"+courseId+"/trivialcv-ranking.txt"
    , request = $.ajax(moodleUrl, {cache:false})
    , chained;

  chained = request.then(updateRanksFile, uploadRanksFile);
//  chained = request.then(uploadRanksFile);
  return chained;
}

function getStoredRank(scoId) {
  if (DEBUG) {
    var mockRequest = getRanks();    
    return mockRequest.then( function (data) {
      var mockChained = $.Deferred();
      mockChained.resolve(data[scoId]);
      return mockChained;
    });
  }
  var moodleUrl = baseUrl+"/file.php/"+courseId+"/trivialcv-ranking.txt"
    , request = $.ajax(moodleUrl, {cache:false})
    , chained;

  chained = request.then(function (data){
     var o = JSON.parse(data);
     return o[scoId];
  });

  return chained;
}

function listRank(scoId, containerSelector) {
  var request = getStoredRank(scoId)
    , chained;
  
  chained = request.then(function (scores) {
    var container = $(containerSelector)
      , entry
      , list;
      
      container.empty();
      list = $('<ol></ol>');
      container.append(list);
      $.each(scores, function(index, score) {
        list.append('<li>'+score.name + ' ('+score.score+' puntos)</li>');
      });
  });
  
  return chained;
}

function generateListRankCode(scoId) {
  var pos = window.location.href.lastIndexOf('/')
    , baseUrl = window.location.href.substr(0, pos)
    , url = baseUrl+"/trivialcv.js";
  var code = "<script type=\"text/javascript\">(function (window, undefined) { window.document.write('<div id=\"scormRankList\"></div>'); var script = document.createElement('script');script.onload = function() { var script = document.createElement('script');script.onload = function() { $.noConflict(); es.ucm.fdi.trivialcv.loadModule(jQuery, es.ucm.fdi.trivialcv, window).done(function (module) { if (module !== false) {modulo.listRank('"+scoId+"', '#scormRankList');}}); }; script.src=window.location.protocol+'//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'; window.document.getElementsByTagName('head')[0].appendChild(script); };script.src='"+url+"'; window.document.getElementsByTagName('head')[0].appendChild(script);})(window);</script>"
  
  return code;
}

/* 
var url
  , linksLogin = $("div.logininfo a", window.document)
  , userProfileLink = linksLogin[0].href
  , pos = userProfileLink.indexOf("/user/view.php");

if (pos != -1 ) {
  userProfileLink = userProfileLink.substring(0,pos);
}

url = parseUrl(userProfileLink);
var protocol = url.protocol
  , host = url.host
  , path = url.path;
var pathLength = url.path.length
if (pathLength > 0 && path[pathLength-1] === "/") {
  path = path.substring(0, pathLength-1);
}


// Module definitions
var baseUrl = protocol+"://"+host+path;

courseId = parseUrl(window.location.href).params.id
sesskey = parseUrl(linksLogin[1].href).params.sesskey
*/
global.getScos = getScos;
global.getRank = getRank;
global.getRanks = getRanks;
global.storeRanks = storeRanks;
global.getStoredRank = getStoredRank;
global.listRank = listRank;
global.generateListRankCode = generateListRankCode;

function generateConfig(url) {
  if (DEBUG) {
    var mockResult = {};
    mockResult.baseUrl = 'http://example.com/moodle';
    mockResult.courseId = '7777';
    mockResult.error = false;
  }
  var pos, path
    , result = {}
    , fileUrl = parseUrl(url)
    , path = fileUrl.path;

  pos = path.indexOf('/file.php/');
  if ( pos > 0 ) { 
    result.baseUrl = fileUrl.protocol+"://"+fileUrl.host+path.substring(0, pos);
    
    pos += '/file.php/'.length;
    path = path.substr(pos);
    pos = path.indexOf('/')

    result.courseId = parseInt(path.substring(0, pos));
    result.error = false;
  } else {
    pos = path.indexOf('/course/view.php');
    if ( pos > 0 ) {
      result.baseUrl = fileUrl.protocol+"://"+fileUrl.host+path.substring(0, pos);      
      result.courseId = fileUrl.params.id;
      result.error = false;
    } else {
      result.baseUrl = 'error';
      result.courseId = -1;
      result.error = true;
    }
  }  
  return result;
}

var DEBUG = false;

var config = generateConfig(window.location.href)
  , baseUrl = config.baseUrl
  , courseId = config.courseId
  , error = config.error
  , sesskey = null
  , deferred = $.Deferred();

if (DEBUG) {
  sesskey = 'xFsee33';
  deferred.resolve(global);
} else {
  if (!error) { 
    $.ajax(baseUrl+'/course/view.php?id='+courseId)
    .done(function (content){
      var linksLogin = $("div.logininfo a", content)
      sesskey = parseUrl(linksLogin[1].href).params.sesskey
      deferred.resolve(global);
    });
  } else {
    deferred.resolve(false);
  }
}

return deferred;
}

//
// End TrivialCV Module
//