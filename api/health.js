module.exports = function handler(req, res) {
    res.status(200).json({
        is_success: true,
        official_email: process.env.EMAIL
    });
};
