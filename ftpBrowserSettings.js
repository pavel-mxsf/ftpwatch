// edit ftp login here

module.exports = function(){
    return {
        host:"internal.visualarch.eu", // ftp host name
        user:"ftpwtest", // ftp login
        password:"789x", // ftp password
        rootDir:"temp", // ftp root directory
        thumbWidth:800, // thumbnails width
        downloadConcurrency: 1, // number of files downloaded at once - limits network load
        resizeConcurrency: 4 // number of files resized at once - limits memory usage
    }
};
