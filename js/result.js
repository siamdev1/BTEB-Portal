import { checkSession, toggleLoader } from './auth.js';
import { supabase } from './supabaseClient.js';

const rollInput = document.getElementById('rollInput');
const searchForm = document.getElementById('resultSearchForm');
const errorArea = document.getElementById('errorArea');
const resultOutput = document.getElementById('resultOutput');
const initialState = document.getElementById('initialState');

// Protected Route Init
async function init() {
    try {
        const session = await checkSession();
        document.body.classList.remove('opacity-0');

        // Fetch student roll from DB
        const { data, error } = await supabase
            .from('students')
            .select('board_roll')
            .eq('id', session.user.id)
            .single();

        if (data && data.board_roll) {
            rollInput.value = data.board_roll;
            fetchResults(data.board_roll); // Auto sync on load
        }
    } catch (err) {
        console.error("Auth failed:", err);
    }
}

async function fetchResults(roll) {
    if (!roll) return;

    toggleLoader(true);
    errorArea.classList.add('hidden');
    resultOutput.classList.add('hidden');
    initialState.classList.add('hidden');

    const targetUrl = `https://btebresultszone.com/api/student-results?roll=${roll.trim()}&curriculumId=diploma_in_engineering`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    let attempts = 0;
    const maxAttempts = 3;

    const fetchData = async () => {
        try {
            // Simultaneous lookup for DB Info
            const dbPromise = supabase
                .from('students')
                .select('full_name, reg_number')
                .eq('board_roll', roll.trim())
                .maybeSingle();

            const apiPromise = fetch(url);

            const [dbRes, apiRes] = await Promise.all([dbPromise, apiPromise]);

            if (!apiRes.ok) throw new Error(`Server error (${apiRes.status})`);
            const json = await apiRes.json();

            if (!json.success || !json.data || json.data.length === 0) {
                throw new Error('No records found for this roll number.');
            }

            renderResults(json.data[0], dbRes.data);
            toggleLoader(false);
            resultOutput.classList.remove('hidden');
        } catch (err) {
            if (attempts < maxAttempts) {
                attempts++;
                const delay = Math.pow(2, attempts) * 1000;
                setTimeout(fetchData, delay);
            } else {
                showError(err.message || 'Connection failed.');
                toggleLoader(false);
            }
        }
    };

    fetchData();
}

function renderResults(data, dbInfo) {
    const dbName = dbInfo ? dbInfo.full_name : "Name Not Found";

    // 1. Update Header Info
    document.getElementById('resNameDisplay').textContent = dbName;
    document.getElementById('resRollDisplay').textContent = `Roll: ${data.roll}`;
    document.getElementById('resRegulation').textContent = `Regulation: ${data.regulation}`;
    document.getElementById('resInstitute').textContent = data.institute?.name || 'Unknown Institute';
    document.getElementById('resInstituteMeta').textContent = `Code: ${data.institute?.code} | District: ${data.institute?.district}`;

    // 2. Populate Professional Transcript (LaTeX style)
    document.getElementById('ptInstName').textContent = (data.institute?.name || 'MYMENSINGH POLYTECHNIC INSTITUTE').toUpperCase();
    document.getElementById('ptInstMeta').textContent = `${data.institute?.district || 'Mymensingh'}, Bangladesh`;
    document.getElementById('ptName').textContent = dbName;
    document.getElementById('ptRoll').textContent = data.roll;
    document.getElementById('ptReg').textContent = dbInfo?.reg_number || '---';
    document.getElementById('ptInstitute').textContent = data.institute?.name || '---';
    document.getElementById('ptCode').textContent = data.institute?.code || '---';
    document.getElementById('ptDate').textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // 3. Calculate and Update CGPA
    const cgpa = calculateCGPA(data.latestResults);
    document.getElementById('resCgpa').textContent = cgpa;
    document.getElementById('ptTotalCgpa').textContent = cgpa;

    // 4. Handle Referred Subjects (Dashboard View)
    const referredArea = document.getElementById('referredArea');
    const referredList = document.getElementById('resReferredList');
    referredList.innerHTML = '';

    // 5. Populate Tables (Professional Template)
    const ptTableBody = document.getElementById('ptTableBody');
    const ptReferredBody = document.getElementById('ptReferredBody');
    const ptReferredWrapper = document.getElementById('ptReferredWrapper');
    ptTableBody.innerHTML = '';
    ptReferredBody.innerHTML = '';

    if (data.currentFailedSubjects && data.currentFailedSubjects.length > 0) {
        referredArea.classList.remove('hidden');
        ptReferredWrapper.style.display = 'block';
        data.currentFailedSubjects.forEach(sub => {
            // Dashboard Badge
            const badge = document.createElement('span');
            badge.className = 'bg-white text-red-600 text-[10px] font-black px-2 py-1 rounded border border-red-500/20';
            badge.textContent = `${sub.subCode} - ${sub.subName}`;
            referredList.appendChild(badge);

            // Print Row
            const row = `<tr>
                <td style="padding: 10px 0;">${sub.subCode}</td>
                <td style="padding: 10px 0;">${sub.subName}</td>
                <td style="padding: 10px 0;">${sub.type === 'T' ? 'Theory' : 'Practical'}</td>
            </tr>`;
            ptReferredBody.innerHTML += row;
        });
    } else {
        referredArea.classList.add('hidden');
        ptReferredWrapper.style.display = 'none';
    }

    // 6. Semester Breakdown (Both Views)
    const grid = document.getElementById('semesterGrid');
    grid.innerHTML = '';

    if (data.latestResults) {
        const sorted = [...data.latestResults].sort((a, b) => a.semester - b.semester);
        sorted.forEach(res => {
            const isPassed = res.gpa > 0;
            const dateStr = new Date(res.date).toLocaleDateString();

            // Dashboard Grid
            const card = document.createElement('div');
            card.className = 'glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col group hover:border-indigo-500/30 transition-all';
            card.innerHTML = `
                <div class="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center group-hover:bg-indigo-500/10 transition-colors">
                    <div class="flex items-center gap-2">
                        <span class="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                            ${getOrdinal(res.semester)} Semester
                        </span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isPassed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        ${isPassed ? 'Passed' : 'Failed'}
                    </span>
                </div>
                <div class="p-6 flex justify-between items-center">
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 text-slate-500">
                            <span class="material-symbols-outlined text-sm">calendar_month</span>
                            <span class="text-[10px] font-bold uppercase">${dateStr}</span>
                        </div>
                        ${res.failedSubjects && res.failedSubjects.length > 0 ? `
                            <div class="pt-1">
                                <p class="text-[9px] text-red-400 font-black uppercase mb-1">Referred:</p>
                                <div class="flex flex-wrap gap-1">
                                    ${res.failedSubjects.map(fs => `<span class="bg-red-500/10 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/10">${fs.subCode}</span>`).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="flex items-center gap-1.5 text-green-400 text-[10px] font-bold">
                                <span class="material-symbols-outlined text-sm">check_circle</span> ALL PASSED
                            </div>
                        `}
                    </div>
                    <div class="text-right">
                        <p class="text-4xl font-black ${isPassed ? 'text-white' : 'text-red-400'}">
                            ${res.gpa ? res.gpa.toFixed(2) : '0.00'}
                        </p>
                        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">GPA</p>
                    </div>
                </div>
            `;
            grid.appendChild(card);

            // Print Table Row
            const ptRow = `
                <tr style="${!isPassed ? 'background-color: #fff5f5;' : ''}">
                    <td style="padding: 15px; border-bottom: 1px solid #eee;">${getOrdinal(res.semester)} Semester</td>
                    <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; color: ${isPassed ? '#27ae60' : '#c23616'}">
                        ${isPassed ? 'Passed' : 'Failed'}
                    </td>
                    <td style="padding: 15px; border-bottom: 1px solid #eee;">${res.gpa ? res.gpa.toFixed(2) : '---'}</td>
                    <td style="padding: 15px; border-bottom: 1px solid #eee; font-size: 11px;">
                        ${res.failedSubjects && res.failedSubjects.length > 0 ? `Referred in ${res.failedSubjects.length} subjects` : '---'}
                    </td>
                </tr>
            `;
            ptTableBody.innerHTML += ptRow;
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function calculateCGPA(latestResults) {
    if (!latestResults) return '0.00';

    const weights = {
        1: 0.05, 2: 0.05, 3: 0.10, 4: 0.10,
        5: 0.20, 6: 0.20, 7: 0.20, 8: 0.10
    };

    let totalWeightedGPA = 0;
    latestResults.forEach(res => {
        const sem = res.semester;
        const gpa = res.gpa || 0;
        if (weights[sem] && gpa > 0) {
            totalWeightedGPA += (gpa * weights[sem]);
        }
    });

    return totalWeightedGPA.toFixed(2);
}

function showError(msg) {
    errorArea.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = msg;
    initialState.classList.add('hidden');
    resultOutput.classList.add('hidden');
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Search Handler
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchResults(rollInput.value);
});

// Image Export
document.getElementById('downloadImgBtn').addEventListener('click', async () => {
    const area = document.getElementById('professionalTranscript');
    if (typeof html2canvas === 'undefined') {
        alert("Image library not loaded yet. Please wait.");
        return;
    }

    const btn = document.getElementById('downloadImgBtn');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span><span>Generating Image...</span>';

    // Show template temporarily for capture
    area.classList.remove('hidden');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    area.style.top = '0';
    area.style.width = '800px'; // Standard profile width

    try {
        const canvas = await html2canvas(area, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `Transcript_${rollInput.value}.png`;
        link.href = image;
        link.click();
    } catch (err) {
        console.error("Export error:", err);
        alert("Export failed. Try printing as PDF instead.");
    } finally {
        area.classList.add('hidden');
        area.style.position = '';
        area.style.left = '';
        area.style.width = '';
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
});

init();
