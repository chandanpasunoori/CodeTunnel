var db = require('../db');

exports.home = function (req, res) {
	var currentPage = parseInt(req.param('page')) || 1;
	db.collection('blogPosts').getPage(currentPage, 5, function (err, page) {
		if (err) req.next(err);
		// If current page is greater than the total number of pages then show 404
		if ((currentPage > page.totalPages) && (page.totalPages > 0)) req.next();
		var viewModel = {
			totalPages: page.totalPages,
			currentPage: currentPage,
			blogPosts: page.blogPosts
		};
		res.renderView('blog/index', viewModel);
	});
};

exports.portfolio = function (req, res) {
	var viewModel = {
		title: 'My Portfolio',
		bannerText: 'My Portfolio'
	};
	res.renderView('blog/portfolio', viewModel);
};

exports.resume = function (req, res) {
	var viewModel = {
		title: 'Hire Me!',
		bannerText: 'Hire Me!'
	};
	res.renderView('blog/resume', viewModel);
};

exports.post = function (req, res) {
	if (!req.blogPost) req.next();
	var viewModel = {
		blogPost: req.blogPost
	};
	res.renderView('blog/post', viewModel);
};

exports.newPost = function (req, res) {
	var viewModel = {
		title: 'New Post',
		bannerText: 'New Post',
		blogPost: false
	};
	res.renderView('blog/postForm', viewModel);
};

exports.editPost = function (req, res) {
	if (!req.blogPost) req.next();
	var viewModel = {
		title: 'Edit Post',
		bannerText: 'Edit Post',
		blogPost: req.blogPost
	};
	res.renderView('blog/postForm', viewModel);
};

exports.createPost = function (req, res) {
	// Create slug from title.
	var slug = convertToSlug(req.param('postTitle'));

	// Slugs must be unique so check if a post exists with the new slug.
	db.collection('blogPosts').findOne({ slug: slug }, function (err, blogPost) {
		if (err) return req.next(err);

		// If no blog post exists with the new slug then insert new blog post.
		if (!blogPost) {
			db.collection('blogPosts').insert({
					date: new Date(),
					author: req.user._id,
					title: req.param('postTitle'),
					slug: slug,
					content: req.param('postContent'),
					comments: []
				}, function (err, result) {
					if (err) return req.next(err);
					db.collection('users').updateById(req.user._id, {
						$unset: { activePost: 0 }
					});
					res.redirect('/blog/post/' + slug);
				});
		}
		else {
			req.next(new Error('Blog post already exists with that slug. Change your title.'));
		}
	});
};

exports.updatePost = function (req, res) {

	if (req.param('deletePost')) {
		db.collection('blogPosts').remove({ slug: req.param('slug') });
		return res.redirect('/');
	}

	// Create slug from title.
	var newSlug = convertToSlug(req.param('postTitle'));

	// Slugs must be unique so check if a post exists with the new slug.
	db.collection('blogPosts').findOne({ slug: newSlug }, function (err, blogPost) {
		if (err) return req.next(err);

		if (!blogPost || newSlug === req.blogPost.slug) {
			db.collection('blogPosts').update({ slug: req.blogPost.slug }, {
					$set: {
						editDate: new Date(),
						title: req.param('postTitle'),
						slug: newSlug,
						content: req.param('postContent')
					}
				}, function (err) {
					if (err) return req.next(err);
					res.redirect('/blog/post/' + newSlug);
				});
		}
		else {
			res.next(new Error('Blog post already exists with that slug. Change your title.'));
		}
	});
};

exports.createComment = function (req, res) {
	if (!req.blogPost) req.next();
	var comments = req.blogPost.comments;
	var comment = {
		_id: comments.length > 0 ? comments[comments.length - 1]._id + 1 : 0,
		author: req.user._id,
		date: new Date(),
		content: req.param('commentContent')
	};
	db.collection('blogPosts').updateById(req.blogPost._id, {
			'$push': { comments: comment }
		}, function (err, results) {
			if (err) req.next(err);
			if (!req.xhr)
				res.redirect('/blog/post/' + req.blogPost.slug + '#comment-' + comment._id);
			else
				db.collection('users').findOne({ _id: comment.author }, function (err, user) {
					if (err) req.next(err);
					comment.author = user;
					var viewModel = {
						blogPost: req.blogPost,
						comment: comment
					};
					res.render('blog/comment', viewModel);
				});
		});
};

exports.deleteComment = function (req, res) {
	if (!req.blogPost) req.next();
	db.collection('blogPosts').updateById(req.blogPost._id, {
			'$pull': { comments: { _id: req.comment._id } }
		}, function (err, results) {
			if (err) req.next(err);
			if (!req.xhr)
				res.redirect('/blog/post/' + req.blogPost.slug + '#comments');
			else
				res.json({ success: true });
		});
};

exports.autoSave = function (req, res) {
	db.collection('users').updateById(req.user._id, {
		$set: {
			activePost: {
				title: req.param('postTitle'),
				content: req.param('postContent')
			}
		}
	}, function (err, result) {
		if (err) return req.next(err);
		res.json({ success: true });
	});
};

exports.legacyRedirect = function (req, res) {
	var legacyId = parseInt(req.param('legacyId'));
	db.collection('legacyBlogPostMappings').findOne( { id: legacyId }, function (err, legacyMapping) {
		if (err) return req.next(err);
		res.redirect('/blog/post/' + legacyMapping.slug, 301);
	});
};

function convertToSlug(text) {
	return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}