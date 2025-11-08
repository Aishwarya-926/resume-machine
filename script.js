document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    // IMPORTANT: Replace with your actual API key from OpenAI or another provider.
    const API_KEY = 'YOUR_API_KEY_HERE';
    const API_URL = 'https://api.openai.com/v1/chat/completions'; // Example for OpenAI

    // --- Selectors ---
    const resumeForm = document.getElementById('resume-form');
    const resumePreview = document.getElementById('resume-preview');
    const loadingOverlay = document.getElementById('loading-overlay');
    // ... (add other selectors as needed)

    // --- State & Data Management ---
    const getFormDataAsObject = () => {
        const formData = new FormData(resumeForm);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (!data[key]) { data[key] = []; }
            data[key].push(value);
        }
        return data;
    };

    const saveState = () => {
        const data = getFormDataAsObject();
        localStorage.setItem('resumeData', JSON.stringify(data));
        localStorage.setItem('resumeTemplate', document.getElementById('template-select').value);
        localStorage.setItem('resumeColor', document.getElementById('color-picker').value);
    };

    const loadState = () => {
        const data = JSON.parse(localStorage.getItem('resumeData'));
        const template = localStorage.getItem('resumeTemplate') || 'classic';
        const color = localStorage.getItem('resumeColor') || '#007bff';
        setData(data, template, color);
    };

    const setData = (data, template, color) => {
        document.getElementById('template-select').value = template;
        document.getElementById('color-picker').value = color;
        applyTemplateAndColor();

        // Clear existing dynamic entries
        document.querySelectorAll('.draggable-list').forEach(list => list.innerHTML = '');

        if (data) {
            // Populate simple fields
            ['name', 'title', 'email', 'phone', 'summary', 'skills'].forEach(id => {
                const el = document.getElementById(id);
                if (el && data[id]) { el.value = data[id][0]; }
            });

            // Populate dynamic experience entries
            if (data['exp-job-title']) {
                data['exp-job-title'].forEach((_, index) => {
                    const entry = addEntry('experience', false);
                    entry.querySelector('.job-title').value = data['exp-job-title'][index];
                    entry.querySelector('.company').value = data['exp-company'][index];
                    entry.querySelector('.dates').value = data['exp-dates'][index];
                    entry.querySelector('textarea').value = data['exp-desc'][index];
                });
            }
            // Populate dynamic education entries
            if (data['edu-degree']) {
                data['edu-degree'].forEach((_, index) => {
                    const entry = addEntry('education', false);
                    entry.querySelector('.degree').value = data['edu-degree'][index];
                    entry.querySelector('.institution').value = data['edu-institution'][index];
                    entry.querySelector('.year').value = data['edu-year'][index];
                });
            }
        }
        renderPreview();
    };

    // --- Core Render Function ---
    const renderPreview = () => {
        // ... (This function is largely the same as the "Pro" version)
        const formatDescription = (text) => text.split('\n').map(line => line.startsWith('- ') ? `<li>${line.substring(2)}</li>` : line).join('\n').replace(/<li>.*<\/li>/g, match => `<ul>${match}</ul>`).replace(/<\/ul>\n<ul>/g, '');
        const experienceHTML = Array.from(document.querySelectorAll('#experience-entries .entry')).map(entry => { /* ... */ }).join('');
        const educationHTML = Array.from(document.querySelectorAll('#education-entries .entry')).map(entry => { /* ... */ }).join('');
        const skillsHTML = document.getElementById('skills').value.split(',').map(s => s.trim()).filter(Boolean).map(skill => `<li>${skill}</li>`).join('');
        
        resumePreview.innerHTML = `
            <header class="resume-header">
                <h1 id="resume-name">${document.getElementById('name').value}</h1>
                <p id="resume-title">${document.getElementById('title').value}</p>
                <div class="contact-info"><span>${document.getElementById('email').value}</span> | <span>${document.getElementById('phone').value}</span></div>
            </header>
            <section class="resume-section"><h2>Summary</h2><p>${document.getElementById('summary').value}</p></section>
            <section class="resume-section"><h2>Work Experience</h2><div>${experienceHTML}</div></section>
            <section class="resume-section"><h2>Education</h2><div>${educationHTML}</div></section>
            <section class="resume-section"><h2>Skills</h2><ul id="resume-skills">${skillsHTML}</ul></section>
        `;
        saveState();
    };

    const addEntry = (section, shouldRender = true) => {
        const template = document.getElementById(`${section}-template`).content.cloneNode(true);
        const entry = template.querySelector('.entry');
        document.getElementById(`${section}-entries`).appendChild(template);
        if (shouldRender) renderPreview();
        return entry;
    };

    const applyTemplateAndColor = () => {
        resumePreview.className = 'resume-document ' + document.getElementById('template-select').value;
        document.documentElement.style.setProperty('--color-accent', document.getElementById('color-picker').value);
        saveState();
    };

    // --- AI Generation ---
    const generateBulletPoints = async (entryElement) => {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            alert('Please add your API key to script.js to use the AI feature.');
            return;
        }
        loadingOverlay.classList.remove('hidden');
        try {
            const jobTitle = entryElement.querySelector('.job-title').value;
            const company = entryElement.querySelector('.company').value;
            const prompt = `Generate 3-5 concise, professional resume bullet points for a ${jobTitle} at ${company}. Focus on achievements and responsibilities. Start each with an action verb. Format each bullet point on a new line starting with '- '.`;
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 150
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            
            const data = await response.json();
            const generatedText = data.choices[0].message.content.trim();

            const textarea = entryElement.querySelector('textarea');
            textarea.value += (textarea.value ? '\n' : '') + generatedText;
            renderPreview();

        } catch (error) {
            console.error('AI Generation Failed:', error);
            alert('Failed to generate content. Please check your API key and the console for errors.');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    };

    // --- Event Listeners ---
    resumeForm.addEventListener('input', renderPreview);
    document.getElementById('template-select').addEventListener('change', applyTemplateAndColor);
    document.getElementById('color-picker').addEventListener('input', applyTemplateAndColor);
    document.getElementById('print-btn').addEventListener('click', () => window.print());
    document.getElementById('reset-btn').addEventListener('click', () => { /* ... */ });
    document.getElementById('sample-btn').addEventListener('click', () => setData(sampleData, 'modern', '#3498db'));

    // Data Management
    document.getElementById('export-btn').addEventListener('click', () => {
        const data = JSON.stringify(getFormDataAsObject(), null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'resume-data.json'; a.click();
        URL.revokeObjectURL(url);
    });
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                setData(data, templateSelect.value, colorPicker.value);
            } catch { alert('Invalid JSON file.'); }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset file input
    });

    // Event Delegation for dynamic elements
    resumeForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-btn')) addEntry(e.target.closest('section').querySelector('.draggable-list').id.split('-')[0]);
        if (e.target.classList.contains('remove-btn')) { e.target.closest('.entry').remove(); renderPreview(); }
        if (e.target.classList.contains('ai-generate-btn')) generateBulletPoints(e.target.closest('.entry'));
    });
    
    // Drag and Drop Logic (from "Pro" version, unchanged)
    // ...

    // --- Initial Load & Sample Data ---
    const sampleData = { /* ... A large JSON object with sample resume data ... */ };
    loadState();
    if (document.querySelectorAll('#experience-entries .entry, #education-entries .entry').length === 0) {
        addEntry('experience', false);
        addEntry('education', false);
    }
    renderPreview();
});

// Full functions that were abbreviated
function renderPreview() {
    const formatDescription = (text) => text.split('\n').map(line => line.trim().startsWith('- ') ? `<li>${line.trim().substring(2)}</li>` : `<p>${line}</p>`).join('').replace(/<\/li><li>/g, '</li><li>').replace(/<p><\/p>/g, '').replace(/(<\/li>)(<p>)/g, '$1').replace(/(<\/p>)(<li>)/g, '$1<ul>$2').replace(/(<\/li>)(<li>)/g, '$1$2').replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul><ul>/g, '');
    const experienceHTML = Array.from(document.querySelectorAll('#experience-entries .entry')).map(entry => {const title = entry.querySelector('.job-title').value; const company = entry.querySelector('.company').value; const dates = entry.querySelector('.dates').value; const desc = formatDescription(entry.querySelector('textarea').value); return title ? `<div class="resume-entry"><h4>${title}</h4><div class="sub-heading"><span>${company}</span><span>${dates}</span></div>${desc}</div>` : '';}).join('');
    const educationHTML = Array.from(document.querySelectorAll('#education-entries .entry')).map(entry => {const degree = entry.querySelector('.degree').value; const institution = entry.querySelector('.institution').value; const year = entry.querySelector('.year').value; return degree ? `<div class="resume-entry"><div class="sub-heading"><h4>${degree}</h4><span>${year}</span></div><p>${institution}</p></div>` : '';}).join('');
    const skillsHTML = document.getElementById('skills').value.split(',').map(s => s.trim()).filter(Boolean).map(skill => `<li>${skill}</li>`).join('');
    resumePreview.innerHTML = `<header class="resume-header"><h1 id="resume-name">${document.getElementById('name').value}</h1><p id="resume-title">${document.getElementById('title').value}</p><div class="contact-info"><span>${document.getElementById('email').value}</span> | <span>${document.getElementById('phone').value}</span></div></header><section class="resume-section"><h2>Summary</h2><p>${document.getElementById('summary').value}</p></section><section class="resume-section"><h2>Work Experience</h2><div>${experienceHTML}</div></section><section class="resume-section"><h2>Education</h2><div>${educationHTML}</div></section><section class="resume-section"><h2>Skills</h2><ul id="resume-skills">${skillsHTML}</ul></section>`;
    saveState();
}

const sampleData = { "name": ["Alice Developer"], "title": ["Senior Full-Stack Engineer"], "email": ["alice.dev@email.com"], "phone": ["(123) 456-7890"], "summary": ["Innovative and deadline-driven software engineer with 8+ years of experience designing and developing user-centered digital products from initial concept to final, polished deliverable."], "exp-job-title": ["Senior Software Engineer", "Web Developer"], "exp-company": ["Tech Solutions Inc.", "Digital Creations LLC"], "exp-dates": ["Jan 2020 - Present", "Jun 2016 - Dec 2019"], "exp-desc": ["- Led a team of 5 engineers in the development of a scalable microservices architecture, improving system response time by 40%.\n- Architected and implemented a new CI/CD pipeline using Jenkins and Docker, reducing deployment time from 2 hours to 15 minutes.", "- Developed and maintained front-end features for over 15 client websites using React, Redux, and TypeScript.\n- Collaborated with UX designers to create responsive and accessible user interfaces, resulting in a 25% increase in user engagement."], "edu-degree": ["B.S. in Computer Science"], "edu-institution": ["State University"], "edu-year": ["2016"], "skills": ["JavaScript, TypeScript, React, Node.js, Python, Docker, AWS, CI/CD, Agile Methodologies"]};
