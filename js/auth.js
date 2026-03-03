import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;

        toggleLoader(true);
        try {
            let column = 'email';
            if (!identifier.includes('@')) {
                // If numeric, assume it's board_roll or reg_number
                column = isNaN(identifier) ? 'email' : 'board_roll';
            }

            // 1. Direct Table Select (Demo Mode)
            const { data: student, error: loginError } = await supabase
                .from('students')
                .select('*')
                .or(`email.eq.${identifier},board_roll.eq.${identifier},reg_number.eq.${identifier}`)
                .eq('password', password)
                .single();

            if (loginError || !student) {
                throw new Error('Invalid credentials. Please try again.');
            }

            // 2. Set Demo Session
            const userData = {
                user: { id: student.id, email: student.email },
                full_name: student.full_name,
                is_demo: true
            };
            localStorage.setItem('demo_session', JSON.stringify(userData));

            // 3. Finalize Login -> Dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Login Error:', error.message);
            alert('Login failed: ' + error.message);
        } finally {
            toggleLoader(false);
        }
    });
}

// Session Check Function (Demo Mode)
export async function checkSession() {
    const demoSession = localStorage.getItem('demo_session');

    if (!demoSession) {
        showAccessDenied();
        throw new Error("No session found, access denied.");
    }

    return JSON.parse(demoSession);
}

function showAccessDenied() {
    // Stop any page logic and show a premium Error UI
    document.body.innerHTML = `
        <div class="bg-hero min-h-screen flex items-center justify-center px-6">
            <div class="glass-card max-w-md w-full p-10 text-center rounded-[2.5rem] animate-fade-in border border-white/10 shadow-2xl">
                <div class="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span class="material-symbols-outlined text-red-400 text-5xl">lock_person</span>
                </div>
                <h1 class="text-3xl font-bold font-outfit text-white mb-4">Access Denied</h1>
                <p class="text-slate-400 mb-10 leading-relaxed">
                    You must be logged in to access this portal. Please sign in to your BTEB student account.
                </p>
                <div class="space-y-4">
                    <a href="login.html" class="btn-premium w-full block py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/20">
                        Sign In Now
                    </a>
                    <a href="index.html" class="glass w-full block py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-colors">
                        Back to Home
                    </a>
                </div>
            </div>
            
            <!-- Background Decoration -->
            <div class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-50">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full"></div>
            </div>
        </div>
    `;
    document.body.classList.remove('opacity-0');
    document.body.style.overflow = 'hidden';
}

// Logout Function (Demo Mode)
export async function logout() {
    localStorage.removeItem('demo_session');
    window.location.href = 'index.html';
}

// Global Loader Utility
export function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        if (show) {
            loader.classList.add('active');
        } else {
            loader.classList.remove('active');
        }
    }
}
