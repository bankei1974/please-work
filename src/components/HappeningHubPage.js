import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleUnitChange = (e) => {
        const { value, checked } = e.target;
        setSelectedUnits(prev =>
            checked ? [...prev, value] : prev.filter(u => u !== value)
        );
    };

    return (
        <main className="p-8 overflow-y-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Happening Hub</h1>
            <div className="mb-8 bg-gray-800 p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-2 flex justify-between items-center">
                    Filter by Unit
                    <button onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="text-gray-400 hover:text-white text-sm">
                        {isFilterExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                </h3>
                {isFilterExpanded && (
                    <div className="flex flex-wrap gap-2">
                        {units.map(unit => (
                            <label key={unit.id} className="flex items-center gap-1 text-white text-sm">
                                <input
                                    type="checkbox"
                                    value={unit.id}
                                    checked={selectedUnits.includes(unit.id)}
                                    onChange={handleUnitChange}
                                    className="h-4 w-4 rounded"
                                />
                                {unit.name}
                            </label>
                        ))}
                    </div>
                )}
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
