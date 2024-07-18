const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfPoppler = require('pdf-poppler');

// Function to sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9]/g, '');
}

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.files || !req.files.pdf) {
            return res.status(400).send('No file uploaded.');
        }

        const pdfFile = req.files.pdf;
        const sanitizedFilename = sanitizeFilename(path.parse(pdfFile.name).name) + path.extname(pdfFile.name);
        const uniqueFolder = new Date().getTime().toString();
        const uploadPath = path.join(__dirname, '..', 'uploads', uniqueFolder, sanitizedFilename);

        // Ensure the directory exists
        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

        await pdfFile.mv(uploadPath);

        const imagesDir = path.join(__dirname, '..', 'uploads', uniqueFolder, 'images');
        fs.mkdirSync(imagesDir);

        const options = {
            format: 'png',
            out_dir: imagesDir,
            out_prefix: path.parse(sanitizedFilename).name,
            page: null
        };

        await pdfPoppler.convert(uploadPath, options);

        const pdfPages = fs.readdirSync(imagesDir).map(file => `/${uniqueFolder}/images/${file}`);

        res.json({ pdfPages, filename: path.join(uniqueFolder, sanitizedFilename) });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).send('Error uploading PDF.');
    }
};

exports.splitPDF = async (req, res) => {
    try {
        const { ranges, filename } = req.body;
        if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
            return res.status(400).send('Invalid ranges provided.');
        }

        const uploadPath = path.join(__dirname, '..', 'uploads', filename);
        const uploadDir = path.dirname(uploadPath);
        const pdfDoc = await PDFDocument.load(fs.readFileSync(uploadPath));

        const splitFiles = [];

        for (const range of ranges) {
            const { start, end } = range;
            if (start < 1 || end > pdfDoc.getPages().length || start > end) {
                return res.status(400).send('Invalid page range.');
            }

            const newPdfDoc = await PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: end - start + 1 }, (_, i) => i + start - 1));

            for (const page of copiedPages) {
                newPdfDoc.addPage(page);
            }

            const newPdfBytes = await newPdfDoc.save();
            const newPdfPath = path.join(uploadDir, 'output', `split_${start}_${end}.pdf`);

            // Ensure the directory exists
            fs.mkdirSync(path.join(uploadDir, 'output'), { recursive: true });

            fs.writeFileSync(newPdfPath, newPdfBytes);

            const stats = fs.statSync(newPdfPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            splitFiles.push({
                name: `split_${start}_${end}.pdf`,
                url: `/${filename.replace('\\', '/').split('/')[0]}/output/split_${start}_${end}.pdf`,
                size: fileSizeInMB
            });
        }

        res.json({ files: splitFiles });
    } catch (error) {
        console.error('Error splitting PDF:', error);
        res.status(500).send('Error splitting PDF.');
    }
};
