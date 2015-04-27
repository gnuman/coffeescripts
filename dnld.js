var  request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var tar = require('tar-fs');

// Url Path to be downloaded
var URL = 'https://api.github.com/repos/gnuman/test/tarball/v3';
// Name of downloded gzip
var dnldTar = 'v3.tar.gz';
// Path to where extracted zip files go
var extractPath = '/tmp';

var options = {
    headers: {'user-agent': 'node.js'},
    tls: {
	rejectUnauthorized:false
    },
    uri: URL
};


function extractZip(gzFile){
    fs.createReadStream(gzFile).
	pipe(zlib.Unzip()).
	pipe(tar.extract(extractPath))
};
    
var data = request(options)
    .pipe(fs.createWriteStream(dnldTar))
    .on('close', function () {
	extractZip(dnldTar)
    });


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
