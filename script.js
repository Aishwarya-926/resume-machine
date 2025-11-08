document.addEventListener('DOMContentLoaded', () => {
    // --- State Management & Selectors ---
    const resumeForm = document.getElementById('resume-form');
    const resumePreview = document.getElementById('resume-preview');
    const printBtn = document.getElementById('print-btn');
    const resetBtn = document.getElementById('reset-btn');
    const templateSelect = document.getElementById('template-select');
    const colorPicker = document.getElementById('color-picker');

    const saveState = () => {
        const formData = new FormData(resumeForm);
        const data = {};
        formData.forEach((value, key) => {
            if (!data[key]) { data[key] = []; }
            data[key].push(value);
        });
        localStorage.setItem('resumeData', JSON.stringify(data));
        localStorage.setItem('resumeTemplate', templateSelect.value);
        localStorage.setItem('resumeColor', colorPicker.value);
    };

    const loadState = () => {
        const data = JSON.parse(localStorage.getItem('resumeData'));
        const template = localStorage.getItem('resumeTemplate') || 'classic';
        const color = localStorage.getItem('resumeColor') || '#007bff';

        templateSelect.value = template;
        colorPicker.value = color;
        applyTemplateAndColor();

        if (data) {
            Object.keys(data).forEach(key => {
                const inputs = resumeForm.querySelectorAll(`[name="${key}"]`);
                if (inputs.length === data[key].length) {
                    inputs.forEach((input, index) => {
                        input.value = data[key][index];
                    });
                }
            });
        }
    };
    
    // --- Core Render Function ---
    const renderPreview = () => {
        const data = new FormData(resumeForm);
        
        const formatDescription = (text) => {
            return text.split('\n')
                .map(line => line.startsWith('- ') ? `<li>${line.substring(2)}</li>` : line)
                .join('\n')
                .replace(/<li>.*<\/li>/g, match => `<ul>${match}</ul>`)
                .replace(/<\/ul>\n<ul>/g, ''); // Join adjacent lists
        };
        
        const experienceHTML = Array.from(document.querySelectorAll('#experience-entries .entry')).map(entry => {
            const title = entry.querySelector('.job-title').value;
            const company = entry.querySelector('.company').value;
            const dates = entry.querySelector('.dates').value;
            const desc = formatDescription(entry.querySelector('textarea').value);
            return title ? `<div class="resume-entry"><h4>${title}</h4><div class="sub-heading"><span>${company}</span><span>${dates}</span></div>${desc}</div>` : '';
        }).join('');

        const educationHTML = Array.from(document.querySelectorAll('#education-entries .entry')).map(entry => {
            const degree = entry.querySelector('.degree').value;
            const institution = entry.querySelector('.institution').value;
            const year = entry.querySelector('.year').value;
            return degree ? `<div class="resume-entry"><div class="sub-heading"><h4>${degree}</h4><span>${year}</span></div><p>${institution}</p></div>` : '';
        }).join('');

        const skillsHTML = document.getElementById('skills').value.split(',')
            .map(skill => skill.trim()).filter(Boolean)
            .map(skill => `<li>${skill}</li>`).join('');

        resumePreview.innerHTML = `
            <header class="resume-header">
                <h1 id="resume-name">${document.getElementById('name').value}</h1>
                <p id="resume-title">${document.getElementById('title').value}</p>
                <div class="contact-info">
                    <span id="resume-email">${document.getElementById('email').value}</span> | 
                    <span id="resume-phone">${document.getElementById('phone').value}</span>
                </div>
            </header>
            <section class="resume-section"><h2>Summary</h2><p id="resume-summary">${document.getElementById('summary').value}</p></section>
            <section class="resume-section"><h2>Work Experience</h2><div id="resume-experience">${experienceHTML}</div></section>
            <section class="resume-section"><h2>Education</h2><div id="resume-education">${educationHTML}</div></section>
            <section class="resume-section"><h2>Skills</h2><ul id="resume-skills">${skillsHTML}</ul></section>
        `;
        saveState();
    };

    // --- Dynamic Entry & Customization ---
    const addEntry = (section) => {
        const template = document.getElementById(`${section}-template`).content.cloneNode(true);
        const entry = template.querySelector('.entry');
        // Assign unique names for FormData
        const timestamp = Date.now();
        entry.querySelectorAll('input, textarea').forEach(input => {
            const baseName = input.className;
            input.name = `${section}-${baseName}-${timestamp}`;
        });
        document.getElementById(`${section}-entries`).appendChild(template);
    };

    const applyTemplateAndColor = () => {
        resumePreview.className = 'resume-document ' + templateSelect.value;
        document.documentElement.style.setProperty('--color-accent', colorPicker.value);
        saveState();
    };
    
    // --- Event Listeners ---
    resumeForm.addEventListener('input', renderPreview);
    templateSelect.addEventListener('change', applyTemplateAndColor);
    colorPicker.addEventListener('input', applyTemplateAndColor);
    printBtn.addEventListener('click', () => window.print());
    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
            resumeForm.reset();
            localStorage.clear();
            document.querySelectorAll('.draggable-list').forEach(list => list.innerHTML = '');
            addEntry('experience'); addEntry('education');
            loadState(); renderPreview();
        }
    });

    // Event delegation for adding, removing, and dragging
    document.querySelector('.editor-panel').addEventListener('click', (e) => {
        if (e.target.classList.contains('add-btn')) addEntry(e.target.dataset.section);
        if (e.target.classList.contains('remove-btn')) {
            e.target.closest('.entry').remove();
            renderPreview();
        }
    });

    let draggedItem = null;
    document.querySelectorAll('.draggable-list').forEach(list => {
        list.addEventListener('dragstart', e => {
            draggedItem = e.target.closest('.entry');
            setTimeout(() => e.target.closest('.entry').classList.add('dragging'), 0);
        });
        list.addEventListener('dragend', e => {
            setTimeout(() => draggedItem.classList.remove('dragging'), 0);
            draggedItem = null;
            renderPreview();
        });
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            const entry = e.target.closest('.entry');

            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });
    });
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.entry:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // --- Initial Load ---
    loadState();
    if(document.getElementById('experience-entries').children.length === 0) addEntry('experience');
    if(document.getElementById('education-entries').children.length === 0) addEntry('education');
    renderPreview();
});
