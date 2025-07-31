
import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import UnitStaffingTimeline from './UnitStaffingTimeline';

import { db } from '../firebase';

const StaffingLevelsPage = () => {
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: units, loading: unitsLoading } = useCollection(db, 'units');

    return (
        <main className="p-8 overflow-y-auto h-full">
            <h1 className="text-4xl font-bold text-white mb-8">Manage Staffing Levels</h1>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                    {/* Date Selector */}
                    <div>
                        <label htmlFor="date-select" className="label-style">Select Date</label>
                        <input
                            id="date-select"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-style"
                        />
                    </div>

                    {/* Unit Selector */}
                    <div>
                        <label htmlFor="unit-select" className="label-style">Select Unit</label>
                        <select
                            id="unit-select"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="input-style"
                            disabled={unitsLoading}
                        >
                            <option value="" disabled>{unitsLoading ? 'Loading...' : 'Select a unit'}</option>
                            {units.map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedUnit && selectedDate ? (
                    <UnitStaffingTimeline db={db} unitId={selectedUnit} date={selectedDate} />
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>Please select a date and a unit to view or manage staffing levels.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default StaffingLevelsPage;
