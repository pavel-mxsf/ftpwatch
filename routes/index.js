exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.main = function(req, res){
    res.render('partials/main', {});
};