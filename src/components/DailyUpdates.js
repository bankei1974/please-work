import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DailyUpdates = ({ selectedUnits, units, isManager }) => {
    const [updates, setUpdates] = useState({});
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            if (selectedUnits.length > 0) {
                const data = {};
                for (const unitId of selectedUnits) {
                    const docId = `${today}_${unitId}`;
                    const docRef = doc(db, 'dailyUpdates', docId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        data[unitId] = docSnap.data().text;
                    } else {
                        data[unitId] = '';
                    }
                }
                setUpdates(data);
            }
        };
        fetchData();
    }, [selectedUnits, today]);

    const handleChange = (unitId, value) => {
        setUpdates(prevUpdates => ({
            ...prevUpdates,
            [unitId]: value
        }));
    };

    const handleSave = async (unitId) => {
        const docId = `${today}_${unitId}`;
        const docRef = doc(db, 'dailyUpdates', docId);
        await setDoc(docRef, { text: updates[unitId] }, { merge: true });
        alert('Daily update saved successfully!');
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Daily Updates</h3>
            <div className="space-y-2 text-sm">
                {selectedUnits.map(unitId => (
                    <div key={unitId} className="bg-gray-700/50 p-2 rounded-md">
                        <h4 className="font-semibold mb-1">{units.find(u => u.id === unitId)?.name}</h4>
                        <textarea
                            value={updates[unitId] || ''}
                            onChange={(e) => handleChange(unitId, e.target.value)}
                            className="input-style w-full p-1 text-xs"
                            rows="2"
                            disabled={!isManager}
                        ></textarea>
                        {isManager && (
                            <div className="flex justify-end mt-2">
                                <button onClick={() => handleSave(unitId)} className="btn-primary text-xs px-2 py-1">Save</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyUpdates;
