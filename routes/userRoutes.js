var userController = require('../controllers/userController');

exports.register = function (app) {
	// Setup user routes.
	app.get('/login', userController.login);
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});
	app.get('/user/create', userController.profile);
	app.post('/user/create', userController.create);
};