// edit ftp login here

module.exports = function(){
    return {
        host:"internal.visualarch.eu",
        user:"ftpwtest",
        password:"789",
        rootDir:"temp",
        thumbWidth:800,
        downloadConcurrency: 4,
        resizeConcurrency: 4
    }
};
