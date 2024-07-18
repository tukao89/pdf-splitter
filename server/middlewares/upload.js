const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

module.exports = (req, res, next) => {
    if (!req.files || !req.files.pdf) {
        return res.status(400).send('No file uploaded.');
    }

    const pdfFile = req.files.pdf;
    const uploadPath = path.join(uploadDir, pdfFile.name);

    pdfFile.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);
        next();
    });
};
