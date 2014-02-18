ftpWatcher
==========

Browse ftp - find images - make thumbnails - show on blog-like page

Requirements
------------

Depends on gm installed - http://aheckmann.github.io/gm/ 
First install either GraphicsMagick or ImageMagick.

Install
-------

```
git clone https://github.com/pavel-mxsf/ftpwatch.git
cd ftpwatch
npm install
```

Configuration
-------------

Edit ftpBrowserSettings.js in root. Set ftp login credentials, browsing root, thumbnails size and how many files should be downloaded and resized at once.

Run
---
```
node app.js
```
Server is listening on port 3000

