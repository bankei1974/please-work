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
        <main className="p-4">
            <h1 className="text-2xl font-bold text-white mb-4">Happening Hub</h1>
            <div className="mb-4 bg-gray-800 p-2 rounded-lg shadow-lg">
                <h3 className="text-md font-semibold text-white mb-2 flex justify-between items-center">
                    Filter by Unit
                    <button onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="text-gray-400 hover:text-white text-xs">
                        {isFilterExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                </h3>
                {isFilterExpanded && (
                    <div className="flex flex-wrap gap-1">
                        {units.map(unit => (
                            <label key={unit.id} className="flex items-center gap-1 text-white text-xs">
                                <input
                                    type="checkbox"
                                    value={unit.id}
                                    checked={selectedUnits.includes(unit.id)}
                                    onChange={handleUnitChange}
                                    className="h-3 w-3 rounded"
                                />
                                {unit.name}
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <DailyStaffingGraph selectedUnits={selectedUnits} />
                </div>
                <div className="grid grid-rows-2 gap-4">
                    <KarmaLeaderboard selectedUnits={selectedUnits} />
                    <StaffBirthdays selectedUnits={selectedUnits} />
                </div>
                <div className="col-span-3">
                    <ExpectedPatientCensus selectedUnits={selectedUnits} units={units} isManager={isManager} />
                </div>
                <div className="col-span-3">
                    <DailyUpdates selectedUnits={selectedUnits} units={units} isManager={isManager} />
                </div>
            </div>
        </main>
    );
};

export default HappeningHubPage;
