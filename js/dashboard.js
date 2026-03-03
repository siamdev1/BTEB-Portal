import { supabase } from './supabaseClient.js';
import { checkSession, logout, toggleLoader } from './auth.js';

async function init() {
    toggleLoader(true);
    try {
        const session = await checkSession();
        if (!session) return;

        // 1. Fetch Student Profile
        const { data: profile, error: profileError } = await supabase
            .from('students')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) throw profileError || new Error("Profile not found");

        // 2. Update Basic Info
        document.getElementById('userName').textContent = profile.full_name || 'Student';
        document.getElementById('userAvatar').src = profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=random`;
        document.getElementById('dashDept').textContent = profile.department || 'N/A';
        document.getElementById('dashSemester').textContent = profile.semester || 'N/A';

        // 3. Calculate Profile Completion
        const completion = calculateCompletion(profile);
        document.getElementById('dashProfileDone').textContent = `${completion}%`;

        // 4. Fetch Latest Results for GPA
        if (profile.board_roll) {
            fetchLatestGPA(profile.board_roll);
        }

        // Show body
        document.body.classList.remove('opacity-0');

    } catch (err) {
        console.error("Dashboard Init Error:", err);
    } finally {
        toggleLoader(false);
    }
}

function calculateCompletion(p) {
    const fields = [
        'father_name', 'mother_name', 'blood_group', 'dob',
        'polytechnic_name', 'department', 'semester',
        'ssc_gpa', 'ssc_board', 'present_address',
        'permanent_address', 'photo_url', 'board_roll', 'reg_number'
    ];
    let filled = 0;
    fields.forEach(f => { if (p[f]) filled++; });
    return Math.round((filled / fields.length) * 100);
}

async function fetchLatestGPA(roll) {
    const targetUrl = `https://btebresultszone.com/api/student-results?roll=${roll.trim()}&curriculumId=diploma_in_engineering`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const json = await response.json();

        if (json.success && json.data && json.data.length > 0) {
            const data = json.data[0];
            if (data.latestResults && data.latestResults.length > 0) {
                // Find the latest semester result (highest semester number)
                const latest = data.latestResults.reduce((prev, current) =>
                    (prev.semester > current.semester) ? prev : current
                );
                document.getElementById('dashGpa').textContent = latest.gpa ? latest.gpa.toFixed(2) : '0.00';
            }
        }
    } catch (err) {
        console.error("GPA fetch error:", err);
    }
}

// Event Listeners
document.getElementById('logoutBtn').addEventListener('click', logout);

init();
