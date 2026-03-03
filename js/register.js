import { supabase } from './supabaseClient.js';
import { toggleLoader } from './auth.js';

// Handle "Other" Department selection
document.getElementById('departmentSelect').addEventListener('change', (e) => {
    const otherWrapper = document.getElementById('otherDeptWrapper');
    if (e.target.value === 'Other') {
        otherWrapper.classList.remove('hidden');
        document.getElementById('otherDepartment').setAttribute('required', 'true');
    } else {
        otherWrapper.classList.add('hidden');
        document.getElementById('otherDepartment').removeAttribute('required');
    }
});

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const boardRoll = document.getElementById('boardRoll').value.trim();
    const regNumber = document.getElementById('regNumber').value.trim();
    const session = document.getElementById('session').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();
    const semester = document.getElementById('semester').value;
    const password = document.getElementById('password').value;

    // Resolve Department
    const deptSelect = document.getElementById('departmentSelect').value;
    const otherDept = document.getElementById('otherDepartment').value.trim();
    const department = deptSelect === 'Other' ? otherDept : deptSelect;

    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    console.log('Attempting registration with email:', `"${email}"`);
    toggleLoader(true);
    try {
        // 1. Check if user already exists
        const { data: existingUser } = await supabase
            .from('students')
            .select('id')
            .or(`email.eq.${email},board_roll.eq.${boardRoll}`)
            .single();

        if (existingUser) {
            throw new Error('User with this email or roll already exists.');
        }

        // 2. Insert into students table directly (Demo Mode)
        const newUserId = crypto.randomUUID();
        const { error: dbError } = await supabase
            .from('students')
            .insert([
                {
                    id: newUserId,
                    full_name: fullName,
                    board_roll: boardRoll,
                    reg_number: regNumber,
                    session: session,
                    mobile: mobile,
                    email: email,
                    department: department, // Added department
                    semester: semester, // Added semester
                    password: password, // Storing password directly for demo
                    is_verified: true   // Auto-verify for demo
                }
            ]);

        if (dbError) throw dbError;

        // 3. Log in immediately
        const userData = {
            user: { id: newUserId, email: email },
            full_name: fullName
        };
        localStorage.setItem('demo_session', JSON.stringify(userData));

        // 4. Redirect to Dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Registration Error:', error.message);
        alert('Error: ' + error.message);
    } finally {
        toggleLoader(false);
    }
});
