var apiUrl = 'https://ns2.codehelpers.io';
var totalPages = 0;

document.getElementById('pdf-file').addEventListener('change', function () {
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('pdf', file);

        // Hide the upload button and file input
        fileInput.style.display = 'none';
        document.getElementById('upload-form').querySelector('button').style.display = 'none';

        showLoading('upload');
        fetch(apiUrl + '/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                // Store the filename for later use
                window.uploadedFilename = data.filename;
                // Clear previous PDF preview
                document.getElementById('pdf-preview').innerHTML = '';
                // Display PDF preview
                displayPDFPreview(data.pdfPages);
                hideLoading('upload');
                totalPages = data.pdfPages.length; // Update total pages

                // Move to step 2
                showStep(2);
            })
            .catch(error => {
                console.error('Error:', error);
                hideLoading('upload');
            });
    } else {
        alert('Please select a PDF file!');
    }
});
document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('pdf', file);

        // Hide the upload button and file input
        fileInput.style.display = 'none';
        e.target.querySelector('button').style.display = 'none';

        showLoading('upload');
        fetch(apiUrl + '/api/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                // Store the filename for later use
                window.uploadedFilename = data.filename;
                // Clear previous PDF preview
                document.getElementById('pdf-preview').innerHTML = '';
                // Display PDF preview
                displayPDFPreview(data.pdfPages);
                hideLoading('upload');
                totalPages = data.pdfPages.length; // Update total pages

                // Move to step 2
                showStep(2);
            })
            .catch(error => {
                console.error('Error:', error);
                hideLoading('upload');
            });
    }
});

function displayPDFPreview(pages) {
    const previewDiv = document.getElementById('pdf-preview');
    previewDiv.innerHTML = '';

    pages.forEach((page, index) => {
        const pageContainer = document.createElement('div');
        pageContainer.classList.add('pdf-page-container');
        pageContainer.style.position = 'relative';

        const img = document.createElement('img');
        img.src = apiUrl + page;
        img.alt = `Page ${index + 1}`;
        img.classList.add('pdf-page');
        img.dataset.pageNumber = index + 1;

        // Add range name to image
        const rangeName = document.createElement('div');
        rangeName.classList.add('range-name');
        rangeName.textContent = `${index + 1}`;
        rangeName.style.position = 'absolute';
        rangeName.style.top = '10px';
        rangeName.style.right = '10px';
        rangeName.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        rangeName.style.color = 'white';
        rangeName.style.padding = '2px 5px';
        rangeName.style.borderRadius = '5px';

        pageContainer.appendChild(img);
        pageContainer.appendChild(rangeName);
        previewDiv.appendChild(pageContainer);
    });
}

document.getElementById('add-range').addEventListener('click', function () {
    const lastEndPage = getLastEndPage();
    const rangeInputContainer = document.createElement('div');
    rangeInputContainer.classList.add('range-input', 'd-flex', 'mb-2');

    // Add range name label
    const rangeIndex = document.querySelectorAll('.range-input').length + 1;
    const rangeNameLabel = document.createElement('div');
    rangeNameLabel.classList.add('mr-2', 'range-name');
    rangeNameLabel.textContent = `${rangeIndex}`;
    rangeInputContainer.appendChild(rangeNameLabel);

    const startLabel = document.createElement('div');
    startLabel.classList.add('form-group', 'mr-2');
    const startLabelContent = document.createElement('label');
    startLabelContent.textContent = 'Start Page';
    startLabel.appendChild(startLabelContent);
    const startInput = document.createElement('input');
    startInput.type = 'number';
    startInput.classList.add('form-control', 'start-page');
    startInput.min = '1';
    startInput.value = lastEndPage + 1; // Pre-fill with previous range's end page + 1
    startLabel.appendChild(startInput);

    const endLabel = document.createElement('div');
    endLabel.classList.add('form-group', 'mr-2');
    const endLabelContent = document.createElement('label');
    endLabelContent.textContent = 'End Page';
    endLabel.appendChild(endLabelContent);
    const endInput = document.createElement('input');
    endInput.type = 'number';
    endInput.classList.add('form-control', 'end-page');
    endInput.min = '1';
    endLabel.appendChild(endInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('btn', 'btn-danger', 'btn-remove-range');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function () {
        rangeInputContainer.remove();
        updateRangeCount();
        updatePreviewWithRanges();
    });

    rangeInputContainer.appendChild(startLabel);
    rangeInputContainer.appendChild(endLabel);
    rangeInputContainer.appendChild(removeButton);

    document.getElementById('split-ranges').appendChild(rangeInputContainer);

    updateRangeCount();

    // Update preview on input change
    startInput.addEventListener('input', updatePreviewWithRanges);
    endInput.addEventListener('input', updatePreviewWithRanges);
    endInput.addEventListener('input', validateEndPage);
});

document.getElementById('split-pdf').addEventListener('click', function () {
    const ranges = getSplitRanges();

    showLoading('split');
    fetch(apiUrl + '/api/split', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ranges: ranges, filename: window.uploadedFilename })
    })
        .then(response => response.json())
        .then(data => {
            const downloadLinksDiv = document.getElementById('download-links');
            downloadLinksDiv.innerHTML = '';

            data.files.forEach(file => {
                const link = document.createElement('a');
                link.href = apiUrl + file.url;
                link.target = '_blank';
                link.textContent = `Download ${file.name} (${file.size} MB)`;
                downloadLinksDiv.appendChild(link);
            });

            const downloadAllButton = document.getElementById('download-all');
            downloadAllButton.href = apiUrl + `/api/download/${window.uploadedFilename.replace('\\', '/').split('/')[0]}`;

            hideLoading('split');

            // Move to step 3
            showStep(3);
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoading('split');
        });
});

document.getElementById('generate-ranges').addEventListener('click', function () {
    const splitEach = parseInt(document.getElementById('split-each').value) || 1;
    generateRanges(splitEach);
});

document.getElementById('split-another').addEventListener('click', function () {
    // Reset steps and go back to step 1
    //resetSteps();
    //showStep(1);
    //// Show the upload button and file input again
    //const fileInput = document.getElementById('pdf-file');
    //fileInput.style.display = 'block';
    //document.querySelector('#upload-form button').style.display = 'block';
    window.location.reload();
});

function getSplitRanges() {
    const ranges = [];
    const rangeInputs = document.querySelectorAll('.range-input');

    rangeInputs.forEach((input, index) => {
        const startPage = parseInt(input.querySelector('.start-page').value);
        const endPage = parseInt(input.querySelector('.end-page').value);

        if (!isNaN(startPage) && !isNaN(endPage) && startPage > 0 && endPage >= startPage) {
            ranges.push({ start: startPage, end: endPage });
        }
    });

    return ranges;
}

function updatePreviewWithRanges() {
    const ranges = getSplitRanges();
    const previewImages = document.querySelectorAll('.pdf-page-container');

    previewImages.forEach(imgContainer => {
        const img = imgContainer.querySelector('img');
        img.style.border = '';
    });

    const colors = ['red', 'green', 'blue', 'orange', 'purple'];
    ranges.forEach((range, index) => {
        const color = colors[index % colors.length];
        for (let page = range.start; page <= range.end; page++) {
            const imgContainer = document.querySelector(`.pdf-page-container [data-page-number="${page}"]`).parentElement;
            if (imgContainer) {
                const img = imgContainer.querySelector('img');
                img.style.border = `2px solid ${color}`;
                // Update range name position
                const rangeName = imgContainer.querySelector('.range-name');
                rangeName.textContent = `${index + 1}`;
                rangeName.style.backgroundColor = color;
            }
        }
        $('.range-input:eq(' + index + ') .range-name').css({
            color: color
        })
    });
}

function validateEndPage() {
    const endPage = parseInt(this.value);
    if (endPage > totalPages) {
        alert(`End Page cannot be greater than the total number of pages (${totalPages}).`);
        this.value = totalPages;
    }
}

function getLastEndPage() {
    const rangeInputs = document.querySelectorAll('.range-input');
    if (rangeInputs.length === 0) return 0;

    const lastRangeInput = rangeInputs[rangeInputs.length - 1];
    return parseInt(lastRangeInput.querySelector('.end-page').value) || 0;
}

function generateRanges(splitEach) {
    const splitRangesContainer = document.getElementById('split-ranges');
    splitRangesContainer.innerHTML = ''; // Clear existing ranges

    for (let i = 1; i <= totalPages; i += splitEach) {
        const rangeInputContainer = document.createElement('div');
        rangeInputContainer.classList.add('range-input', 'd-flex', 'mb-2');

        const rangeIndex = document.querySelectorAll('.range-input').length + 1;
        const rangeNameLabel = document.createElement('div');
        rangeNameLabel.classList.add('mr-2', 'range-name');
        rangeNameLabel.textContent = `${rangeIndex}`;
        rangeInputContainer.appendChild(rangeNameLabel);

        const startLabel = document.createElement('div');
        startLabel.classList.add('form-group', 'mr-2');
        const startLabelContent = document.createElement('label');
        startLabelContent.textContent = 'Start Page';
        startLabel.appendChild(startLabelContent);
        const startInput = document.createElement('input');
        startInput.type = 'number';
        startInput.classList.add('form-control', 'start-page');
        startInput.min = '1';
        startInput.value = i; // Set start page
        startLabel.appendChild(startInput);

        const endLabel = document.createElement('div');
        endLabel.classList.add('form-group', 'mr-2');
        const endLabelContent = document.createElement('label');
        endLabelContent.textContent = 'End Page';
        endLabel.appendChild(endLabelContent);
        const endInput = document.createElement('input');
        endInput.type = 'number';
        endInput.classList.add('form-control', 'end-page');
        endInput.min = '1';
        endInput.value = Math.min(i + splitEach - 1, totalPages); // Set end page
        endLabel.appendChild(endInput);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn', 'btn-danger', 'btn-remove-range');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function () {
            rangeInputContainer.remove();
            updateRangeCount();
            updatePreviewWithRanges();
        });

        rangeInputContainer.appendChild(startLabel);
        rangeInputContainer.appendChild(endLabel);
        rangeInputContainer.appendChild(removeButton);

        splitRangesContainer.appendChild(rangeInputContainer);

        // Update preview on input change
        startInput.addEventListener('input', updatePreviewWithRanges);
        endInput.addEventListener('input', updatePreviewWithRanges);
        endInput.addEventListener('input', validateEndPage);
    }

    updateRangeCount();
    updatePreviewWithRanges(); // Update preview with new ranges
}

function updateRangeCount() {
    const rangeCount = document.querySelectorAll('.range-input').length;
    document.getElementById('range-count').textContent = `(${rangeCount})`;
}

// Ensure the initial range inputs also update the preview
document.querySelectorAll('.start-page, .end-page').forEach(input => {
    input.addEventListener('input', updatePreviewWithRanges);
});

function showLoading(type) {
    if (type === 'upload') {
        document.getElementById('loading-upload').classList.remove('d-none');
    } else if (type === 'split') {
        document.getElementById('loading-split').classList.remove('d-none');
    }
}

function hideLoading(type) {
    if (type === 'upload') {
        document.getElementById('loading-upload').classList.add('d-none');
    } else if (type === 'split') {
        document.getElementById('loading-split').classList.add('d-none');
    }
}

function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.add('d-none');
    });
    document.getElementById(`step-${stepNumber}`).classList.remove('d-none');
}

function resetSteps() {
    document.getElementById('upload-form').reset();
    document.getElementById('pdf-preview').innerHTML = '';
    document.getElementById('split-ranges').innerHTML = `
        <h2>Select Split Ranges <span id="range-count">(0)</span></h2>
        <div class="range-input d-flex mb-2">
            <div class="form-group mr-2">
                <label>Start Page</label>
                <input type="number" class="form-control start-page" min="1">
            </div>
            <div class="form-group mr-2">
                <label>End Page</label>
                <input type="number" class="form-control end-page" min="1">
            </div>
            <button type="button" class="btn btn-danger btn-remove-range">Remove</button>
        </div>
        <button id="add-range" class="btn btn-secondary mb-2">Add Range</button>
        <div class="form-group">
            <label for="split-each">Split each</label>
            <input type="number" id="split-each" class="form-control" value="1" min="1">
            <button id="generate-ranges" class="btn btn-info mt-2">Generate Ranges</button>
        </div>
    `;
    document.getElementById('download-links').innerHTML = '';

    // Reattach event listeners
    document.getElementById('add-range').addEventListener('click', function () {
        const lastEndPage = getLastEndPage();
        const rangeInputContainer = document.createElement('div');
        rangeInputContainer.classList.add('range-input', 'd-flex', 'mb-2');

        const rangeIndex = document.querySelectorAll('.range-input').length + 1;
        const rangeNameLabel = document.createElement('div');
        rangeNameLabel.classList.add('mr-2');
        rangeNameLabel.textContent = `${rangeIndex}`;
        rangeInputContainer.appendChild(rangeNameLabel);

        const startLabel = document.createElement('div');
        startLabel.classList.add('form-group', 'mr-2');
        const startLabelContent = document.createElement('label');
        startLabelContent.textContent = 'Start Page';
        startLabel.appendChild(startLabelContent);
        const startInput = document.createElement('input');
        startInput.type = 'number';
        startInput.classList.add('form-control', 'start-page');
        startInput.min = '1';
        startInput.value = lastEndPage + 1; // Pre-fill with previous range's end page + 1
        startLabel.appendChild(startInput);

        const endLabel = document.createElement('div');
        endLabel.classList.add('form-group', 'mr-2');
        const endLabelContent = document.createElement('label');
        endLabelContent.textContent = 'End Page';
        endLabel.appendChild(endLabelContent);
        const endInput = document.createElement('input');
        endInput.type = 'number';
        endInput.classList.add('form-control', 'end-page');
        endInput.min = '1';
        endLabel.appendChild(endInput);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('btn', 'btn-danger', 'btn-remove-range');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function () {
            rangeInputContainer.remove();
            updateRangeCount();
            updatePreviewWithRanges();
        });

        rangeInputContainer.appendChild(startLabel);
        rangeInputContainer.appendChild(endLabel);
        rangeInputContainer.appendChild(removeButton);

        document.getElementById('split-ranges').appendChild(rangeInputContainer);

        // Update preview on input change
        startInput.addEventListener('input', updatePreviewWithRanges);
        endInput.addEventListener('input', updatePreviewWithRanges);
        endInput.addEventListener('input', validateEndPage);
    });

    document.getElementById('generate-ranges').addEventListener('click', function () {
        const splitEach = parseInt(document.getElementById('split-each').value) || 1;
        generateRanges(splitEach);
    });
}
