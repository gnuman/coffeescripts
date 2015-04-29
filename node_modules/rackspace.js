var pkgcloud = require('pkgcloud');
var recursive = require('recursive-readdir');
var fs = require('fs');


var cloudfiles = pkgcloud.storage.createClient({
   provider: 'rackspace',
   username: 'openlearning.activityblocks',
   apiKey: 'b7da842b6b7f4e879f706a59e0064acd',
   region: 'SYD'
});


function getFiles(tmpDirName,callback){
	recursive(tmpDirName, function (err, files) {
  		// Files is an array of filename
  		if(!err)
  			callback(files) 
  		else
  			console.log("Error in get Files ",err)
	});

};

function getRemoteName(fileName,tmpDirName,appName){
	return fileName.replace(tmpDirName,appName)
};


function uploadCDN(remoteURL,actualURL){
	var readStream = fs.createReadStream(actualURL);

	var writeStream = cloudfiles.upload({
    	container: 'test-openlearning.io',
    	remote: remoteURL
 	});

 	writeStream.on('error', function(err) {
    	// handle your error case
    	console.log("error has occured while uploding the file ",err)
 	});

 	writeStream.on('success', function(file) {
    // success, file will be a File model
    	console.log("file is successfully uploded")
 	});	
 	readStream.pipe(writeStream);
};




// Function to upload files to CDN
// tmepDirName is where we have extracted tar file which is been released by user 
// appName is Application name + version 
function upload(tmpDirName,appName){
	// Search files recursively 
  
	getFiles(tmpDirName,function(files){
			// its list of files from which need to extract /tmp and then release convention name
			for (var i = 0; i < files.length; i++) { 
				var remote = getRemoteName(files[i],tmpDirName,appName);
				uploadCDN(remote,files[i]);				
			}
		}
	);	

};


module.exports = {
  'upload': upload
};
