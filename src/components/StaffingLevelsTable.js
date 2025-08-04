import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const StaffingLevelsTable = ({ selectedUnit, selectedDate }) => {
    const [staffingLevels, setStaffingLevels] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (selectedUnit && selectedDate) {
                const docId = `${selectedDate}_${selectedUnit.id}`;
                const docRef = doc(db, 'staffingLevels', docId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setStaffingLevels(docSnap.data().levels);
                } else {
                    // Initialize with empty data if no document exists
                    const initialData = {};
                    for (let i = 0; i < 24 * 4; i++) {
                        const hours = Math.floor(i / 4).toString().padStart(2, '0');
                        const minutes = ((i % 4) * 15).toString().padStart(2, '0');
                        initialData[`${hours}:${minutes}`] = { min: '', optimal: '' };
                    }
                    setStaffingLevels(initialData);
                }
            }
        };
        fetchData();
    }, [selectedUnit, selectedDate]);

    const handleLevelChange = (time, type, value) => {
        setStaffingLevels(prevLevels => ({
            ...prevLevels,
            [time]: {
                ...prevLevels[time],
                [type]: value
            }
        }));
    };

    const handleSave = async () => {
        if (selectedUnit && selectedDate) {
            const docId = `${selectedDate}_${selectedUnit.id}`;
            const docRef = doc(db, 'staffingLevels', docId);
            await setDoc(docRef, { levels: staffingLevels }, { merge: true });
            alert('Staffing levels saved successfully!');
        }
    };

    const timeIntervals = Array.from({ length: 24 * 4 }, (_, i) => {
        const hours = Math.floor(i / 4).toString().padStart(2, '0');
        const minutes = ((i % 4) * 15).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    });

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Staffing Levels for {selectedUnit?.name} on {selectedDate}</h3>
            <div className="grid grid-cols-4 gap-4">
                {timeIntervals.map(time => (
                    <div key={time} className="flex items-center gap-2">
                        <label className="w-16">{time}</label>
                        <input
                            type="number"
                            placeholder="Min"
                            value={staffingLevels[time]?.min || ''}
                            onChange={(e) => handleLevelChange(time, 'min', e.target.value)}
                            className="input-style w-20"
                        />
                        <input
                            type="number"
                            placeholder="Optimal"
                            value={staffingLevels[time]?.optimal || ''}
                            onChange={(e) => handleLevelChange(time, 'optimal', e.target.value)}
                            className="input-style w-20"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={handleSave} className="btn-primary">Save Staffing Levels</button>
            </div>
        </div>
    );
};

export default StaffingLevelsTable;
