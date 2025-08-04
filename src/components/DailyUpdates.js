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
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Daily Updates for {today}</h3>
            <div className="space-y-4">
                {selectedUnits.map(unitId => (
                    <div key={unitId} className="bg-gray-700/50 p-4 rounded-md">
                        <h4 className="text-lg font-semibold mb-2">{units.find(u => u.id === unitId)?.name}</h4>
                        <textarea
                            value={updates[unitId] || ''}
                            onChange={(e) => handleChange(unitId, e.target.value)}
                            className="input-style w-full"
                            rows="4"
                            disabled={!isManager}
                        ></textarea>
                        {isManager && (
                            <div className="flex justify-end mt-4">
                                <button onClick={() => handleSave(unitId)} className="btn-primary">Save</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyUpdates;
