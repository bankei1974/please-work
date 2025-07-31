import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import NewStaffSchedulingPage from './NewStaffSchedulingPage';
import NewManagerSchedulingPage from './NewManagerSchedulingPage';
import StaffAndUnitManagementPage from './StaffAndUnitManagementPage';
import StaffManagementPage from './StaffManagementPage';
import ReportsPage from './ReportsPage';
import AIInsightsPage from './AIInsightsPage';
import StaffingLevelsPage from './StaffingLevelsPage';
import StaffProfilePage from './StaffProfilePage';
import HelpOutHubPage from './HelpOutHubPage';
import StaffKarmaPage from './StaffKarmaPage';
import { Users, CalendarDays, BarChart2, Sparkles, LogOut, ChevronsLeft, ChevronsRight, TrendingUp, Handshake } from 'lucide-react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

const MainApp = () => {
    const { user: currentUser, userProfile, logout } = useAuthContext();
    const isManager = userProfile.role === 'Manager';
    const [activePage, setActivePage] = useState(() => isManager ? 'scheduling' : 'my-schedule');
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const onSignOut = logout;

    const handleViewProfile = (staffId) => {
        setSelectedStaffId(staffId);
        setActivePage('staff-profile');
    };

    useEffect(() => {
        // Daily Staff Karma for login/viewing schedule
        if (userProfile && currentUser) {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            if (userProfile.lastLoginDate !== today) {
                const userRef = doc(db, 'users', userProfile.id);
                const newKarma = (userProfile.staffKarma || 0) + 1;
                console.log("Attempting to update user profile:", {
                    currentUserUid: currentUser.uid,
                    userProfileId: userProfile.id,
                    userProfileRole: userProfile.role,
                    newKarma: newKarma,
                    lastLoginDate: today,
                });
                updateDoc(userRef, {
                    staffKarma: newKarma,
                    lastLoginDate: today,
                }).then(() => {
                    console.log("User profile updated successfully. Attempting to add karma transaction:", {
                        staffId: userProfile.id,
                        date: today,
                        karmaChange: 1,
                        reason: 'Daily Login',
                        transactionType: 'Award',
                        timestamp: new Date(),
                    });
                    // Log the karma transaction
                    addDoc(collection(db, 'karmaTransactions'), {
                        staffId: userProfile.id,
                        date: today,
                        karmaChange: 1,
                        reason: 'Daily Login',
                        transactionType: 'Award',
                        timestamp: new Date(),
                    });
                }).catch(error => console.error("Error updating staff karma for daily login:", error));
            }
        }
    }, [userProfile, currentUser]);

    const renderPage = () => {
        if (!isManager) {
            switch (activePage) {
                case 'my-schedule': return <NewStaffSchedulingPage />;
                case 'help-out-hub': return <HelpOutHubPage />;
                case 'my-karma': return <StaffKarmaPage />;
                default: return <NewStaffSchedulingPage />;
            }
        }
        switch (activePage) {
            case 'management': return <StaffAndUnitManagementPage />;
            case 'staff-management': return <StaffManagementPage onViewProfile={handleViewProfile} />;
            case 'staff-profile': return <StaffProfilePage staffId={selectedStaffId} />;
            case 'scheduling': return <NewManagerSchedulingPage onViewProfile={handleViewProfile} />;
            case 'staffing-levels': return <StaffingLevelsPage />;
            case 'reports': return <ReportsPage />;
            case 'ai-insights': return <AIInsightsPage />;
            case 'help-out-hub': return <HelpOutHubPage />;
            default: return <NewManagerSchedulingPage />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <style>{`.input-style { background-color: #374151 !important; border: 1px solid #4B5563; border-radius: 0.5rem; padding: 0.75rem 1rem; width: 100%; color: black !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { color: black !important; -webkit-text-fill-color: black !important; -webkit-box-shadow: 0 0 0 30px #374151 inset !important; box-shadow: 0 0 0 30px #374151 inset !important; } .login-input { color: black !important; } .login-input input { color: black !important; } .input-style::placeholder { color: black !important; } .input-style:focus { outline: none; ring: 2px; ring-color: #3B82F6; } .label-style { display: block; font-size: 0.875rem; font-weight: 500; color: #D1D5DB; margin-bottom: 0.25rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #2563EB; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #1D4ED8; } .btn-secondary { padding: 0.5rem 1rem; background-color: #4B5563; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #6B7280; } .btn-danger { padding: 0.5rem 1rem; background-color: #DC2626; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-danger:hover { background-color: #B91C1C; } .nav-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; font-size: 1.125rem; font-weight: 600; color: #9CA3AF; border-radius: 0.75rem; transition: background-color 0.2s, color 0.2s; } .nav-link:hover { background-color: #374151; color: white; } .nav-link.active { background-color: #1D4ED8; color: white; }`}</style>
            <aside className={`bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 p-4 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="p-4 text-2xl font-bold text-white flex items-center justify-between">
                    {!isSidebarCollapsed && <span>The Huddle</span>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-gray-400 hover:text-white">
                        {isSidebarCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                    </button>
                </div>
                <nav className="flex-1 space-y-2 mt-8">
                    {isManager ? (<>
                        <button onClick={() => setActivePage('management')} title={isSidebarCollapsed ? "Units, Roles, Statuses" : ""} className={`nav-link ${activePage === 'management' ? 'active' : ''}`}><Users /> {!isSidebarCollapsed && "Units, Roles, Statuses"}</button>
                        <button onClick={() => setActivePage('staff-management')} title={isSidebarCollapsed ? "Staff Management" : ""} className={`nav-link ${activePage === 'staff-management' ? 'active' : ''}`}><Users /> {!isSidebarCollapsed && "Staff Management"}</button>
                        <button onClick={() => setActivePage('scheduling')} title={isSidebarCollapsed ? "Staff Scheduling" : ""} className={`nav-link ${activePage === 'scheduling' ? 'active' : ''}`}><CalendarDays /> {!isSidebarCollapsed && "Staff Scheduling"}</button>
                        <button onClick={() => setActivePage('staffing-levels')} title={isSidebarCollapsed ? "Staffing Levels" : ""} className={`nav-link ${activePage === 'staffing-levels' ? 'active' : ''}`}><TrendingUp /> {!isSidebarCollapsed && "Staffing Levels"}</button>
                        <button onClick={() => setActivePage('reports')} title={isSidebarCollapsed ? "Reports" : ""} className={`nav-link ${activePage === 'reports' ? 'active' : ''}`}><BarChart2 /> {!isSidebarCollapsed && "Reports"}</button>
                        <button onClick={() => setActivePage('ai-insights')} title={isSidebarCollapsed ? "AI Insights" : ""} className={`nav-link ${activePage === 'ai-insights' ? 'active' : ''}`}><Sparkles /> {!isSidebarCollapsed && "AI Insights"}</button>
                        <button onClick={() => setActivePage('help-out-hub')} title={isSidebarCollapsed ? "Help Out Hub" : ""} className={`nav-link ${activePage === 'help-out-hub' ? 'active' : ''}`}><Handshake /> {!isSidebarCollapsed && "Help Out Hub"}</button>
                    </>) : (<>
                        <button onClick={() => setActivePage('my-schedule')} title={isSidebarCollapsed ? "My Schedule" : ""} className={`nav-link ${activePage === 'my-schedule' ? 'active' : ''}`}><CalendarDays /> {!isSidebarCollapsed && "My Schedule"}</button>
                        <button onClick={() => setActivePage('help-out-hub')} title={isSidebarCollapsed ? "Help Out Hub" : ""} className={`nav-link ${activePage === 'help-out-hub' ? 'active' : ''}`}><Handshake /> {!isSidebarCollapsed && "Help Out Hub"}</button>
                        <button onClick={() => setActivePage('my-karma')} title={isSidebarCollapsed ? "My Karma" : ""} className={`nav-link ${activePage === 'my-karma' ? 'active' : ''}`}><Sparkles /> {!isSidebarCollapsed && "My Karma"}</button>
                    </>)}
                </nav>
                <div className="mt-auto">
                    <button onClick={onSignOut} title={isSidebarCollapsed ? "Sign Out" : ""} className="flex items-center gap-4 w-full px-4 py-3 text-lg font-semibold text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-xl">
                        <LogOut /> {!isSidebarCollapsed && "Sign Out"}
                    </button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-auto">
                {renderPage()}
            </div>
        </div>
    );
};

export default MainApp;