
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'WindTest', pageName: 'index' });
};

exports.simulate = function(req, res){
    res.render('simulate', { title: 'WindTest Client Simulation!', pageName: 'simulate' });
};

exports.blank = function(req, res){
    res.render('blank');
};

exports.doc = function(req, res){
    res.render('doc', { title: 'WindTest Client Simulation!', pageName: 'doc' });
};