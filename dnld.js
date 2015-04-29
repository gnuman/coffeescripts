var  request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var tar = require('tar-fs');
var filewalker = require('filewalker');

// Url Path to be downloaded
//var URL = 'https://api.github.com/repos/gnuman/test/tarball/v3';
// Name of downloded gzip
//var dnldTar = 'v3.tar.gz';



function extractZip(gzFile,extractPath){
    console.log(gzFile);
    console.log(extractPath);
    fs.createReadStream(gzFile).
	   pipe(zlib.Unzip()).
	   pipe(tar.extract(extractPath));
     
};
    

function getExtractedFileName(extractPath,callback){
  var dirName;
  filewalker(extractPath,{recursive: false})
    .on('dir', function(p) {
      dirName = p;
    })
    .on('error', function(err) {
      console.error(err);
    })
    .on('done', function() {
      console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
      if(this.dirs!=1){
        console.log("Error after extracting the tar file ");
      }
      callback(extractPath+dirName);  
    })
  .walk();
};

function downloadRelease(URL,tarName,programName,calllback){
  // Path to where extracted zip files go
  var extractPath = '/tmp/OpenLearning/'+programName + '/';
  
  var options = {
      headers: {'user-agent': 'node.js'},
      tls: {
        rejectUnauthorized:false
      },
      uri: URL
  };

  var data = request(options)
    .pipe(fs.createWriteStream(tarName))
    .on('close', function () {
         extractZip(tarName,extractPath);
         getExtractedFileName(extractPath,calllback);
    });
};

module.exports = {
  'downloadRelease': downloadRelease
};

/*
   Another way of extracting files 
   var tar = require('tar');
   var mkdirp = require('mkdirp');
   var path = require('path');

   function decompress(tarball){
    fs.createReadStream(tarball)
        .on('error', console.log)
        .pipe(zlib.Unzip())
        .pipe(tar.Parse())
        .on('entry', function(entry) {
            var isDir     = 'Directory' === entry.type;
            var fullpath  = path.join(extractPath, entry.path);
            var directory = isDir ? fullpath : path.dirname(fullpath);
            mkdirp(directory, function(err) {
              if (err) throw err;
                if (! isDir) {
                    entry.pipe(fs.createWriteStream(fullpath));
              }
            });
        });
	
    };

*/
