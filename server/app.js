const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const archiver = require('archiver');
const app = express();
const cron = require('node-cron');

app.use(fileUpload());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(cors());

const pdfRoutes = require('./routes/api');
app.use('/api', pdfRoutes);

app.get('/', (req, res) => {
    res.send('Hello from codehelpers.io - pdf splitter server!');
});

// Endpoint to download all split files as a zip
app.get('/api/download/:folder', (req, res) => {
    const folder = req.params.folder;
    const folderPath = path.join(__dirname, 'uploads', folder, 'output');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=split_files_${folder}.zip`);

    const archive = archiver('zip');
    archive.pipe(res);

    fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        archive.file(filePath, { name: file });
    });

    archive.finalize();
});

// Cron job to remove old folders (created more than 3 hours ago)
cron.schedule('0 * * * *', () => {
    const uploadDir = path.join(__dirname, 'uploads');
    const now = Date.now();
    const hours = 3 * 60 * 60 * 1000;

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading upload directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                if (now - stats.mtime.getTime() > hours) {
                    fs.rmdir(filePath, { recursive: true }, (err) => {
                        if (err) {
                            console.error('Error removing old folder:', err);
                        } else {
                            console.log(`Removed old folder: ${filePath}`);
                        }
                    });
                }
            });
        });
    });
});


const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
