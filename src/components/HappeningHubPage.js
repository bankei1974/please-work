import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import DailyStaffingGraph from './DailyStaffingGraph';
import KarmaLeaderboard from './KarmaLeaderboard';
import StaffBirthdays from './StaffBirthdays';
import ExpectedPatientCensus from './ExpectedPatientCensus';
import DailyUpdates from './DailyUpdates';

const HappeningHubPage = () => {
    const { userProfile } = useAuthContext();
    const isManager = userProfile.role === 'Manager';
    const [selectedUnits, setSelectedUnits] = useState([]);
    const { data: units } = useCollection(db, 'units');

    const handleUnitChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedUnits(value);
    };

    return (
        <main className="p-8 overflow-y-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Happening Hub</h1>
            <div className="mb-8">
                <label className="label-style">Select Units:</label>
                <select multiple value={selectedUnits} onChange={handleUnitChange} className="input-style">
                    {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DailyStaffingGraph selectedUnits={selectedUnits} />
                <KarmaLeaderboard selectedUnits={selectedUnits} />
                <StaffBirthdays selectedUnits={selectedUnits} />
                <ExpectedPatientCensus selectedUnits={selectedUnits} units={units} isManager={isManager} />
                <DailyUpdates selectedUnits={selectedUnits} units={units} isManager={isManager} />
            </div>
        </main>
    );
};

export default HappeningHubPage;
