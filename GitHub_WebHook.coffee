# Simple GitHub Webhook Listener
express = require 'express'
bodyParser = require 'body-parser'
crypto = require 'crypto'
bufPack = require 'bufferpack'
dnld = require 'dnld'
rackspace = require 'rackspace'
fs = require 'fs'
rmdir = require 'rimraf'

app = express()

PORT = process.argv[2] or process.env.PORT or 8081
AUTH_SECRET = process.argv[3] or process.env.SECRET_TOKEN or 'test'
watchEvent = 'release'
pathExtract = '/tmp/OpenLearning/'


uploadFilePath = 'OpenLearning'
confFileName = 'defaultdata.json'

rmdirCallback = (err) ->
    if err
        console.log err


cleanTmpFolder = (tarFileFolder) ->
    try
        console.log "Cleaning up tmp dir",tarFileFolder
        repoNames = fs.readdirSync tarFileFolder+'/../..'
        for folder in repoNames
            rmdir pathExtract+folder,(error)->
               if error
                    console.log error
    catch e
        console.log e

# Callbak when upload finishes 
uploadCallback = (err,tarFileFolder) ->
    cleanTmpFolder tarFileFolder

# Callback method which receives path of the tarball folder         
getExtractFileName = (err,tarFileFolder) ->
    if(err)
        cleanTmpFolder tarFileFolder
        return 
    try
        projectData = JSON.parse( fs.readFileSync(tarFileFolder+'/'+confFileName).toString() )     
        rackspace.upload(tarFileFolder,projectData.name+"-"+projectData.version,uploadCallback)
    catch error
        console.log "error in parsing ",tarFileFolder+'/'+confFileName
        cleanTmpFolder tarFileFolder
        return         


processRelease = (data) ->
    dnldTarName = data.release.tag_name + '.tar.gz'
    uploadFile = data.repository.name+"."+data.release.tag_name
    # Singnature Url to  be downloaded,name of the tarball,callback function,name of the program      
    extractPath = pathExtract + data.repository.name + '/'
    rmdir extractPath,(err) -> 
        if err
            console.log err
    dnld.downloadRelease(data.release.tarball_url,dnldTarName,extractPath,getExtractFileName)
 
# Process Hook
hooks = (ghEvent, data) ->
    #console.log 'Process Event'
    if ghEvent == watchEvent
       # to do Make async
       processRelease(data)
    
# Sign a payload
getSignature = (payload) ->
    hmac = crypto.createHmac 'sha1', AUTH_SECRET
    hmac.update payload
    return 'sha1=' + hmac.digest('hex')

# Constant-Time Comparison Function (to avoid timing attacks)
secureCompare = (a, b) ->
    bufA = new Buffer a
    bufB = new Buffer b
    
    return false if a is '' or b is '' or bufA.length isnt bufB.length
    
    result = 0
    l = bufPack.unpack bufA.length + 'B', bufA
    result |= byte ^ l.shift() for byte in bufB
    
    return (result is 0)

# JSON Parsing & Authentication Middleware
app.use bodyParser.json
    verify: (req, res, buf) ->
        signature = req.headers['x-hub-signature']
        if not secureCompare (getSignature buf), signature
            res.status 401
            res.send 'FAIL: Unauthorized'
            throw {'message': 'Unauthorized'}

# GitHub webhook request handler
app.post '/', (req, res) ->
    res.send 'OK\n'
    hooks req.headers['x-github-event'], req.body

# Start the Server
app.listen PORT, -> console.log 'listening on *:' + PORT

# Test with: `ngrok 8081`
