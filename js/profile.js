import { supabase } from './supabaseClient.js';
import { checkSession, toggleLoader } from './auth.js';

let currentUser = null;
let currentTheme = 'modern';

let profileData = {
    name: '', father: '', mother: '', phone: '', email: '', dob: '',
    marital: '', religion: '', blood: '', nationality: 'Bangladeshi',
    linkedin: '', portfolio: '', presentAddr: '', permanentAddr: '',
    polytechnic: '', department: '', semester: '', boardRoll: '', regNumber: '', sscGpa: '', sscBoard: '',
    education: [],
    hardSkills: [], softSkills: [], projects: [], certifications: [], languages: [],
    photo: null
};

const certCategories = ["PSC", "JSC", "SSC", "HSC", "Diploma", "BSC", "MSc", "Other"];

// --- Initialization ---
async function init() {
    toggleLoader(true);
    try {
        const session = await checkSession();
        if (!session) return;
        currentUser = session.user;

        // Load Basic Profile Data
        const { data: profile, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (profile) {
            mapProfileToData(profile);
            fillForm();
            updateCV();
            updateProgress();
            document.body.classList.remove('opacity-0');

            if (profile.board_roll) {
                fetchAndRenderResults(profile.board_roll);
            }
        }
    } catch (err) {
        console.error('Init error:', err);
    } finally {
        toggleLoader(false);
    }
}

function mapProfileToData(p) {
    profileData.name = p.full_name || '';
    profileData.father = p.father_name || '';
    profileData.mother = p.mother_name || '';
    profileData.phone = p.mobile || '';
    profileData.email = p.email || '';
    profileData.dob = p.dob || '';
    profileData.blood = p.blood_group || '';
    profileData.presentAddr = p.present_address || '';
    profileData.permanentAddr = p.permanent_address || '';
    profileData.polytechnic = p.polytechnic_name || '';
    profileData.department = p.department || '';
    profileData.semester = p.semester || '';
    profileData.boardRoll = p.board_roll || '';
    profileData.regNumber = p.reg_number || '';
    profileData.sscGpa = p.ssc_gpa || '';
    profileData.sscBoard = p.ssc_board || '';

    // Photo
    if (p.photo_url) {
        profileData.photo = p.photo_url;
        document.getElementById('profile-preview').src = p.photo_url;
        document.getElementById('header-avatar').src = p.photo_url;
    }

    // Dynamic Profile Data (JSONB)
    if (p.professional_profile) {
        const pp = p.professional_profile;
        profileData.marital = pp.marital || '';
        profileData.religion = pp.religion || '';
        profileData.nationality = pp.nationality || 'Bangladeshi';
        profileData.linkedin = pp.linkedin || '';
        profileData.portfolio = pp.portfolio || '';
        profileData.education = pp.education || [];
        profileData.hardSkills = pp.hardSkills || [];
        profileData.softSkills = pp.softSkills || [];
        profileData.projects = pp.projects || [];
        profileData.certifications = pp.certifications || [];
        profileData.languages = pp.languages || [];
    }
}

function fillForm() {
    document.getElementById('fullName').value = profileData.name;
    document.getElementById('fatherName').value = profileData.father;
    document.getElementById('motherName').value = profileData.mother;
    document.getElementById('mobile').value = profileData.phone;
    document.getElementById('email').value = profileData.email;
    document.getElementById('dob').value = profileData.dob;
    document.getElementById('maritalStatus').value = profileData.marital;
    document.getElementById('religion').value = profileData.religion;
    document.getElementById('bloodGroup').value = profileData.blood;
    document.getElementById('nationality').value = profileData.nationality;
    document.getElementById('linkedin').value = profileData.linkedin;
    document.getElementById('portfolio').value = profileData.portfolio;
    document.getElementById('presentAddress').value = profileData.presentAddr;
    document.getElementById('permanentAddress').value = profileData.permanentAddr;

    document.getElementById('polytechnicName').value = profileData.polytechnic;
    document.getElementById('department').value = profileData.department;
    document.getElementById('semester').value = profileData.semester;
    document.getElementById('boardRoll').value = profileData.boardRoll;
    document.getElementById('regNumber').value = profileData.regNumber;
    document.getElementById('sscGpa').value = profileData.sscGpa;
    document.getElementById('sscBoard').value = profileData.sscBoard;

    renderEducation();
    renderSkills();
    renderProjects();
    renderMore();
}

// --- Tab Logic ---
window.switchTab = (tabId) => {
    document.querySelectorAll('.form-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + tabId).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + tabId).classList.add('active');
};

// --- Dynamic Educational Logic ---
function renderEducation() {
    const container = document.getElementById('education-list');
    container.innerHTML = profileData.education.map((edu, i) => `
        <div class="glass-card p-5 space-y-4 relative animate-fade-in border border-indigo-500/10">
            <div class="flex justify-between items-center border-b border-white/5 pb-3">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Credential #${i + 1}</span>
                <button type="button" class="text-gray-500 hover:text-red-400 remove-edu-btn" data-index="${i}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="lg:col-span-1">
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase">Certificate</label>
                    <select class="form-input text-xs edu-field" data-index="${i}" data-field="category">
                        ${certCategories.map(cat => `<option value="${cat}" ${edu.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="md:col-span-2 lg:col-span-2">
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase">Institute Name</label>
                    <input type="text" class="form-input text-xs edu-field" placeholder="University / College / School" value="${edu.institute || ''}" data-index="${i}" data-field="institute">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase">Group / Dept</label>
                    <input type="text" class="form-input text-xs edu-field" placeholder="Ex: Science" value="${edu.group || ''}" data-index="${i}" data-field="group">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase">Result (GPA/CGPA)</label>
                    <input type="text" class="form-input text-xs edu-field" placeholder="Ex: 3.90" value="${edu.result || ''}" data-index="${i}" data-field="result">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase">Passing Year</label>
                    <input type="number" class="form-input text-xs edu-field" placeholder="YYYY" value="${edu.year || ''}" data-index="${i}" data-field="year">
                </div>
            </div>
        </div>
    `).join('');

    // Attach listeners
    container.querySelectorAll('.remove-edu-btn').forEach(btn => {
        btn.onclick = () => {
            profileData.education.splice(btn.dataset.index, 1);
            renderEducation();
            updateCV();
            updateProgress();
        };
    });
    container.querySelectorAll('.edu-field').forEach(input => {
        input.oninput = (e) => {
            profileData.education[e.target.dataset.index][e.target.dataset.field] = e.target.value;
            updateCV();
            updateProgress();
        };
    });
}

document.getElementById('addEducationBtn').onclick = () => {
    profileData.education.push({ category: 'Diploma', institute: '', group: '', result: '', year: '' });
    renderEducation();
    updateProgress();
};

// --- Projects Logic ---
function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = profileData.projects.map((p, i) => `
        <div class="glass-card p-4 space-y-2 relative animate-fade-in border border-indigo-500/10">
            <button type="button" class="absolute top-2 right-2 text-gray-400 hover:text-red-400 remove-proj-btn" data-index="${i}"><i class="fas fa-times"></i></button>
            <input type="text" class="form-input text-xs proj-field" placeholder="Project Title" value="${p.title || ''}" data-index="${i}" data-field="title">
            <input type="text" class="form-input text-xs proj-field" placeholder="Tech Used" value="${p.tech || ''}" data-index="${i}" data-field="tech">
            <input type="url" class="form-input text-xs proj-field" placeholder="Project Link (Optional)" value="${p.link || ''}" data-index="${i}" data-field="link">
        </div>
    `).join('');

    container.querySelectorAll('.remove-proj-btn').forEach(btn => {
        btn.onclick = () => {
            profileData.projects.splice(btn.dataset.index, 1);
            renderProjects();
            updateCV();
        };
    });
    container.querySelectorAll('.proj-field').forEach(input => {
        input.oninput = (e) => {
            profileData.projects[e.target.dataset.index][e.target.dataset.field] = e.target.value;
            updateCV();
        };
    });
}

document.getElementById('addProjectBtn').onclick = () => {
    profileData.projects.push({ title: '', tech: '', link: '' });
    renderProjects();
};

// --- Skills Logic ---
function renderSkills() {
    ['hard', 'soft'].forEach(type => {
        const container = document.getElementById(type + '-skills-container');
        container.innerHTML = profileData[type + 'Skills'].map((skill, i) => `
            <span class="tag-pill px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs flex items-center gap-2 group hover:bg-white/20 transition-all">
                ${skill}
                <i class="fas fa-times cursor-pointer opacity-50 hover:opacity-100" onclick="removeSkill('${type}', ${i})"></i>
            </span>
        `).join('');
    });
}

window.removeSkill = (type, index) => {
    profileData[type + 'Skills'].splice(index, 1);
    renderSkills();
    updateCV();
    updateProgress();
};

function addSkill(type) {
    const input = document.getElementById(type + '-skill-input');
    const value = input.value.trim();
    if (value && !profileData[type + 'Skills'].includes(value)) {
        profileData[type + 'Skills'].push(value);
        input.value = '';
        renderSkills();
        updateCV();
        updateProgress();
    }
}

document.getElementById('addHardSkillBtn').onclick = () => addSkill('hard');
document.getElementById('addSoftSkillBtn').onclick = () => addSkill('soft');
document.getElementById('hard-skill-input').onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('hard'); } };
document.getElementById('soft-skill-input').onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('soft'); } };

// --- Cert & Lang Logic ---
function renderMore() {
    const certList = document.getElementById('cert-list');
    certList.innerHTML = profileData.certifications.map((c, i) => `
        <div class="flex gap-2 animate-fade-in relative group">
            <input type="text" class="form-input text-xs flex-1 cert-field" placeholder="Certification Name (e.g. Cisco CCNA)" value="${c.name || ''}" data-index="${i}">
            <button type="button" class="text-gray-500 hover:text-red-400 remove-cert-btn" data-index="${i}"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const langList = document.getElementById('lang-list');
    langList.innerHTML = profileData.languages.map((l, i) => `
        <div class="flex gap-2 animate-fade-in relative group">
            <input type="text" class="form-input text-xs flex-1 lang-field" placeholder="Language (e.g. English)" value="${l.name || ''}" data-index="${i}">
            <button type="button" class="text-gray-500 hover:text-red-400 remove-lang-btn" data-index="${i}"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    // Listeners
    certList.querySelectorAll('.cert-field').forEach(input => {
        input.oninput = (e) => { profileData.certifications[e.target.dataset.index].name = e.target.value; updateCV(); };
    });
    certList.querySelectorAll('.remove-cert-btn').forEach(btn => {
        btn.onclick = () => { profileData.certifications.splice(btn.dataset.index, 1); renderMore(); updateCV(); };
    });
    langList.querySelectorAll('.lang-field').forEach(input => {
        input.oninput = (e) => { profileData.languages[e.target.dataset.index].name = e.target.value; updateCV(); };
    });
    langList.querySelectorAll('.remove-lang-btn').forEach(btn => {
        btn.onclick = () => { profileData.languages.splice(btn.dataset.index, 1); renderMore(); updateCV(); };
    });
}

document.getElementById('addCertificationBtn').onclick = () => { profileData.certifications.push({ name: '' }); renderMore(); };
document.getElementById('addLanguageBtn').onclick = () => { profileData.languages.push({ name: '' }); renderMore(); };

// --- Form Synchro ---
document.querySelectorAll('.form-input').forEach(input => {
    if (input.id === 'hard-skill-input' || input.id === 'soft-skill-input') return;
    input.oninput = () => {
        const id = input.id;
        if (id === 'fullName') profileData.name = input.value;
        else if (id === 'fatherName') profileData.father = input.value;
        else if (id === 'motherName') profileData.mother = input.value;
        else if (id === 'mobile') profileData.phone = input.value;
        else if (id === 'email') profileData.email = input.value;
        else if (id === 'dob') profileData.dob = input.value;
        else if (id === 'maritalStatus') profileData.marital = input.value;
        else if (id === 'religion') profileData.religion = input.value;
        else if (id === 'bloodGroup') profileData.blood = input.value;
        else if (id === 'nationality') profileData.nationality = input.value;
        else if (id === 'linkedin') profileData.linkedin = input.value;
        else if (id === 'portfolio') profileData.portfolio = input.value;
        else if (id === 'presentAddress') profileData.presentAddr = input.value;
        else if (id === 'permanentAddress') profileData.permanentAddr = input.value;
        else if (id === 'polytechnicName') profileData.polytechnic = input.value;
        else if (id === 'department') profileData.department = input.value;
        else if (id === 'semester') profileData.semester = input.value;
        else if (id === 'boardRoll') profileData.boardRoll = input.value;
        else if (id === 'regNumber') profileData.regNumber = input.value;
        else if (id === 'sscGpa') profileData.sscGpa = input.value;
        else if (id === 'sscBoard') profileData.sscBoard = input.value;

        updateCV();
        updateProgress();
    };
});

// --- Photo Upload ---
document.getElementById('photoUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    toggleLoader(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('student-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('student-assets')
            .getPublicUrl(filePath);

        profileData.photo = publicUrl;
        document.getElementById('profile-preview').src = publicUrl;
        document.getElementById('header-avatar').src = publicUrl;

        await supabase
            .from('students')
            .update({ photo_url: publicUrl })
            .eq('id', currentUser.id);

        alert('Photo updated!');
        updateCV();
        updateProgress();
    } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed. Using local preview temporarily.');
        // Fallback to local preview
        const reader = new FileReader();
        reader.onload = (re) => {
            profileData.photo = re.target.result;
            document.getElementById('profile-preview').src = re.target.result;
            document.getElementById('header-avatar').src = re.target.result;
            updateCV();
        };
        reader.readAsDataURL(file);
    } finally {
        toggleLoader(false);
    }
});

// --- Progress Logic ---
function updateProgress() {
    let filled = 0;
    const coreFields = [profileData.name, profileData.email, profileData.phone, profileData.photo, profileData.presentAddr, profileData.boardRoll];
    coreFields.forEach(f => { if (f) filled++ });

    // Dynamic sections
    if (profileData.education.length > 0) filled++;
    if (profileData.hardSkills.length > 0) filled++;

    const fieldsCount = 8;
    const percentage = Math.min(Math.round((filled / fieldsCount) * 100), 100);

    // 1. Update Sidebar Indicators
    const textElement = document.getElementById('progress-text');
    if (textElement) textElement.textContent = `${percentage}%`;

    const circle = document.getElementById('progress-circle');
    if (circle) {
        const circumference = 314.15; // 2 * PI * 50
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    // 2. Update Header Indicators (Profile 0% Complete)
    const headerText = document.getElementById('completionText');
    if (headerText) headerText.textContent = `Profile ${percentage}% Complete`;

    const headerCircle = document.getElementById('completionCircle');
    if (headerCircle) {
        const h_circumference = 113.1; // 2 * PI * 18
        const h_offset = h_circumference - (percentage / 100) * h_circumference;
        headerCircle.style.strokeDashoffset = h_offset;
    }
}

// --- Theme Selection ---
document.getElementById('theme-modern').onclick = () => setTheme('modern');
document.getElementById('theme-executive').onclick = () => setTheme('executive');

function setTheme(t) {
    currentTheme = t;
    document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.remove('bg-indigo-500');
        b.classList.add('bg-white/5');
    });
    document.getElementById('theme-' + t).classList.add('bg-indigo-500');
    document.getElementById('theme-' + t).classList.remove('bg-white/5');
    updateCV();
}

// --- CV Preview Logic ---
window.closeZoom = () => {
    document.getElementById('cvZoomModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
};

document.getElementById('cvPreviewWrapper').onclick = () => {
    document.getElementById('cvZoomModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateCV();
};

function updateCV() {
    const container = document.getElementById('cv-to-print');
    const zoomedContainer = document.getElementById('zoomed-cv-content');
    const photo = profileData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'U')}&background=6366f1&color=fff&size=200`;

    const sortedEdu = [...profileData.education].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

    let cvHtml = '';
    if (currentTheme === 'modern') {
        cvHtml = `
            <div style="display:flex; height:100%; gap:25px; text-align:left; color:#1e293b;">
                <div style="width:35%; background:#f1f5f9; padding:25px 15px; border-radius:15px;">
                    <img src="${photo}" style="width:100%; border-radius:15px; margin-bottom:20px; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <h4 style="color:#6366f1; border-bottom:1px solid #cbd5e1; padding-bottom:5px; font-size:11px; font-weight:700;">CONTACT</h4>
                    <div style="font-size:9.5px; line-height:1.6; margin-top:10px; color:#334155;">
                        ${profileData.phone ? `<p style="margin-bottom:3px;"><i class="fas fa-phone" style="width:15px;"></i> ${profileData.phone}</p>` : ''}
                        ${String(profileData.email).toLowerCase() !== 'undefined' ? `<p style="margin-bottom:3px;"><i class="fas fa-envelope" style="width:15px;"></i> ${profileData.email}</p>` : ''}
                        ${profileData.linkedin ? `<p style="margin-bottom:3px;"><i class="fab fa-linkedin" style="width:15px;"></i> LinkedIn</p>` : ''}
                    </div>
                    <h4 style="color:#6366f1; border-bottom:1px solid #cbd5e1; padding-bottom:5px; margin-top:25px; font-size:11px; font-weight:700;">PERSONAL</h4>
                    <div style="font-size:9px; line-height:1.6; margin-top:10px; color:#475569;">
                        <p><b>Father:</b> ${profileData.father || '---'}</p>
                        <p><b>Mother:</b> ${profileData.mother || '---'}</p>
                        <p><b>DOB:</b> ${profileData.dob || '---'}</p>
                        <p><b>Blood:</b> ${profileData.blood || '---'}</p>
                    </div>
                    ${profileData.languages.length > 0 ? `
                        <h4 style="color:#6366f1; border-bottom:1px solid #cbd5e1; padding-bottom:5px; margin-top:25px; font-size:11px; font-weight:700;">LANGUAGES</h4>
                        <p style="font-size:9px; margin-top:10px;">${profileData.languages.map(l => l.name).join(', ')}</p>
                    ` : ''}
                </div>
                <div style="width:65%; padding:10px 0;">
                    <h1 style="font-size:24px; font-weight:700; color:#0f172a; margin:0;">${profileData.name || 'FULL NAME'}</h1>
                    <p style="color:#6366f1; font-weight:600; font-size:11px; margin-top:5px; letter-spacing:1px; text-transform:uppercase;">${profileData.department || 'Student'}</p>
                    
                    <h3 style="border-left:4px solid #6366f1; padding-left:10px; font-size:12px; background:#f8fafc; padding:4px 10px; margin-top:20px; font-weight:700;">EDUCATION</h3>
                    <div style="margin-top:10px; font-size:10px; color:#334155;">
                        ${sortedEdu.map(edu => edu.institute ? `
                            <div style="margin-bottom:10px;">
                                <div style="display:flex; justify-content:space-between; font-weight:700;">
                                    <span>${edu.category} - ${edu.group}</span>
                                    <span style="color:#6366f1;">${edu.year}</span>
                                </div>
                                <div style="font-size:9px;">${edu.institute}</div>
                                <div style="font-size:8.5px; color:#64748b;">Result: ${edu.result}</div>
                            </div>
                        ` : '').join('')}
                        ${!sortedEdu.length ? '<p style="font-size:9px; color:#94a3b8;">Add education items from the form.</p>' : ''}
                    </div>

                    <h3 style="border-left:4px solid #6366f1; padding-left:10px; font-size:12px; background:#f8fafc; padding:4px 10px; margin-top:20px; font-weight:700;">TECHNICAL SKILLS</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">
                        ${profileData.hardSkills.map(s => `<span style="background:#eef2ff; border:1px solid #c7d2fe; padding:2px 8px; border-radius:4px; font-size:8.5px; color:#4338ca;">${s}</span>`).join('')}
                    </div>

                    <h3 style="border-left:4px solid #6366f1; padding-left:10px; font-size:12px; background:#f8fafc; padding:4px 10px; margin-top:20px; font-weight:700;">PROJECTS</h3>
                    ${profileData.projects.map(p => p.title ? `
                        <div style="margin:8px 0; font-size:9.5px; border-bottom:1px dashed #e2e8f0; padding-bottom:5px;">
                            <b>${p.title}</b><br><span style="color:#64748b;">Tech: ${p.tech}</span>
                        </div>
                    ` : '').join('')}
                </div>
            </div>`;
    } else {
        // Executive Template
        cvHtml = `
            <div style="color:#1e293b;">
                <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:15px; margin-bottom:20px;">
                    <h1 style="font-size:24px; font-weight:700; margin:0; text-transform:uppercase;">${profileData.name || 'FULL NAME'}</h1>
                    <p style="font-size:10px; margin:5px 0;">
                        ${profileData.phone} | ${profileData.email} | ${profileData.presentAddr}
                    </p>
                </div>

            <h4 style="background:#000; color:#fff; padding:3px 10px; font-size:10px; text-transform:uppercase;">Academic Background</h4>
            <table style="width:100%; font-size:9.5px; border-collapse:collapse; margin:10px 0; text-align:left;">
                <tr style="border-bottom:1px solid #000; background:#f5f5f5;">
                    <th style="padding:6px; border:1px solid #ddd;">Degree</th>
                    <th style="padding:6px; border:1px solid #ddd;">Institute & Group</th>
                    <th style="padding:6px; border:1px solid #ddd;">Year</th>
                    <th style="padding:6px; border:1px solid #ddd;">Result</th>
                </tr>
                ${sortedEdu.map(edu => edu.institute ? `
                    <tr>
                        <td style="padding:6px; border:1px solid #ddd;">${edu.category}</td>
                        <td style="padding:6px; border:1px solid #ddd;">${edu.institute}<br><span style="font-size:8px;">(${edu.group})</span></td>
                        <td style="padding:6px; border:1px solid #ddd;">${edu.year}</td>
                        <td style="padding:6px; border:1px solid #ddd;">${edu.result}</td>
                    </tr>
                ` : '').join('')}
            </table>

            <h4 style="background:#000; color:#fff; padding:3px 10px; font-size:10px; text-transform:uppercase; margin-top:15px;">Technical Expertise</h4>
            <p style="font-size:9.5px; margin:10px 0; line-height:1.5;">${profileData.hardSkills.join(', ')}</p>

            <h4 style="background:#000; color:#fff; padding:3px 10px; font-size:10px; text-transform:uppercase; margin-top:15px;">Projects & Experience</h4>
            ${profileData.projects.map(p => p.title ? `<p style="font-size:9.5px; margin:5px 0;"><b>${p.title}:</b> ${p.tech}</p>` : '').join('')}

            <div style="display:flex; gap:20px; font-size:9.5px; margin-top:15px; text-align:left;">
                <div style="flex:1; border:1px solid #000; padding:10px;"><b style="display:block; border-bottom:1px solid #000; margin-bottom:5px;">Languages</b>${profileData.languages.map(l => l.name).join(', ')}</div>
                <div style="flex:1; border:1px solid #000; padding:10px;"><b style="display:block; border-bottom:1px solid #000; margin-bottom:5px;">Certifications</b>${profileData.certifications.map(c => c.name).join(', ')}</div>
            </div>
        </div>`;
    }

    container.innerHTML = cvHtml;
    if (zoomedContainer) zoomedContainer.innerHTML = cvHtml;
}

// --- Save Action ---
document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();
    toggleLoader(true);

    try {
        const professional_profile = {
            marital: profileData.marital,
            religion: profileData.religion,
            nationality: profileData.nationality,
            linkedin: profileData.linkedin,
            portfolio: profileData.portfolio,
            education: profileData.education,
            hardSkills: profileData.hardSkills,
            softSkills: profileData.softSkills,
            projects: profileData.projects,
            certifications: profileData.certifications,
            languages: profileData.languages
        };

        const clean = (val) => (val === "" || val === undefined || val === null) ? null : val;

        const updates = {
            full_name: clean(profileData.name),
            father_name: clean(profileData.father),
            mother_name: clean(profileData.mother),
            mobile: clean(profileData.phone),
            email: clean(profileData.email),
            dob: clean(profileData.dob),
            blood_group: clean(profileData.blood),
            present_address: clean(profileData.presentAddr),
            permanent_address: clean(profileData.permanentAddr),
            polytechnic_name: clean(profileData.polytechnic),
            department: clean(profileData.department),
            semester: clean(profileData.semester),
            board_roll: clean(profileData.boardRoll),
            reg_number: clean(profileData.regNumber),
            ssc_gpa: clean(profileData.sscGpa),
            ssc_board: clean(profileData.sscBoard),
            professional_profile: professional_profile // JSONB column
        };

        const { error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', currentUser.id);

        if (error) throw error;
        alert('Universal Profile Updated Successfully!');
    } catch (err) {
        console.error('Save error:', err);
        alert('Error: ' + err.message);
    } finally {
        toggleLoader(false);
    }
};

// --- PDF & Print Logic ---
document.getElementById('downloadPdf').onclick = () => {
    const element = document.getElementById('zoomed-cv-content');
    const opt = {
        margin: 0,
        filename: `${profileData.name || 'Student'}_CV.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily remove transform for clean capture
    const originalTransform = element.style.transform;
    element.style.transform = 'scale(1)';

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform;
    });
};

window.printCV = () => {
    const modal = document.getElementById('cvZoomModal');
    const element = document.getElementById('zoomed-cv-content');

    // Ensure the modal is VISIBLE for the print engine to pick up its styles (it will be hidden by media query anyway)
    const wasHidden = modal.classList.contains('hidden');
    if (wasHidden) modal.classList.remove('hidden');

    const originalTransform = element.style.transform;
    element.style.transform = 'scale(1)';

    window.print();

    element.style.transform = originalTransform;
    if (wasHidden) modal.classList.add('hidden');
};

// --- Result Sync Logic (Legacy Support) ---
async function fetchAndRenderResults(roll) {
    const resultsSection = document.getElementById('resultsSection');
    const loadingArea = document.getElementById('resultsLoading');
    const grid = document.getElementById('semesterGrid');

    resultsSection.classList.remove('hidden');

    const targetUrl = `https://btebresultszone.com/api/student-results?roll=${roll.trim()}&curriculumId=diploma_in_engineering`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        const json = await response.json();

        if (json.success && json.data && json.data.length > 0) {
            const data = json.data[0];
            renderProfileResults(data.latestResults);
            document.getElementById('profileCgpa').textContent = calculateProfileCGPA(data.latestResults);
            loadingArea.classList.add('hidden');
        } else {
            loadingArea.innerHTML = '<p class="text-slate-400">No academic records found for this roll number.</p>';
        }
    } catch (err) {
        console.error("Result sync error:", err);
        loadingArea.innerHTML = '<p class="text-red-400">Failed to sync academic records.</p>';
    }
}

function renderProfileResults(results) {
    const grid = document.getElementById('semesterGrid');
    grid.innerHTML = '';
    if (!results) return;

    const sorted = [...results].sort((a, b) => a.semester - b.semester);
    sorted.forEach(res => {
        const isPassed = res.gpa > 0;
        const card = document.createElement('div');
        card.className = 'glass-card p-6 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                    ${getOrdinalSign(res.semester)} Semester
                </span>
                <span class="text-xl font-black ${isPassed ? 'text-white' : 'text-red-400'}">
                    ${res.gpa ? res.gpa.toFixed(2) : '0.00'}
                </span>
            </div>
            <div class="flex justify-between items-center mt-2">
                <div class="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                    <i class="fas fa-calendar-alt"></i> ${new Date(res.date).toLocaleDateString()}
                </div>
                <div class="${isPassed ? 'text-green-400' : 'text-red-400'} text-[9px] font-black uppercase tracking-widest">
                    ${isPassed ? 'Passed' : 'Failed'}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function calculateProfileCGPA(latestResults) {
    if (!latestResults) return '0.00';
    const weights = { 1: 0.05, 2: 0.05, 3: 0.10, 4: 0.10, 5: 0.20, 6: 0.20, 7: 0.20, 8: 0.10 };
    let totalWeightedGPA = 0;
    latestResults.forEach(res => {
        const sem = res.semester;
        const gpa = res.gpa || 0;
        if (weights[sem] && gpa > 0) totalWeightedGPA += (gpa * weights[sem]);
    });
    return totalWeightedGPA.toFixed(2);
}

function getOrdinalSign(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

init();
