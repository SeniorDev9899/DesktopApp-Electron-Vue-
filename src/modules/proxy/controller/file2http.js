const fs = require('fs');
const { promisify } = require('util');

const exists = promisify(fs.exists);

module.exports = async (req, res) => {
    const filePath = decodeURIComponent(req.query.url);
    const bool = await exists(filePath);
    if (bool) {
        res.sendFile(filePath);
        return;
    }
    res.sendStatus(404);
};
