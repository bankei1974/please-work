import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ExpectedPatientCensus = ({ selectedUnits, units, isManager }) => {
    const [censusData, setCensusData] = useState({});
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            if (selectedUnits.length > 0) {
                const data = {};
                for (const unitId of selectedUnits) {
                    const docId = `${today}_${unitId}`;
                    const docRef = doc(db, 'expectedCensus', docId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        data[unitId] = docSnap.data();
                    } else {
                        data[unitId] = { total: '', admissions: '', discharges: '' };
                    }
                }
                setCensusData(data);
            }
        };
        fetchData();
    }, [selectedUnits, today]);

    const handleChange = (unitId, field, value) => {
        setCensusData(prevData => ({
            ...prevData,
            [unitId]: {
                ...prevData[unitId],
                [field]: value
            }
        }));
    };

    const handleSave = async (unitId) => {
        const docId = `${today}_${unitId}`;
        const docRef = doc(db, 'expectedCensus', docId);
        await setDoc(docRef, censusData[unitId], { merge: true });
        alert('Expected census data saved successfully!');
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Expected Census</h3>
            <div className="space-y-2 text-sm">
                {selectedUnits.map(unitId => (
                    <div key={unitId} className="bg-gray-700/50 p-2 rounded-md">
                        <h4 className="font-semibold mb-1">{units.find(u => u.id === unitId)?.name}</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="label-style text-xs">Total</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.total || ''}
                                    onChange={(e) => handleChange(unitId, 'total', e.target.value)}
                                    className="input-style p-1 text-xs"
                                    disabled={!isManager}
                                />
                            </div>
                            <div>
                                <label className="label-style text-xs">Admissions</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.admissions || ''}
                                    onChange={(e) => handleChange(unitId, 'admissions', e.target.value)}
                                    className="input-style p-1 text-xs"
                                    disabled={!isManager}
                                />
                            </div>
                            <div>
                                <label className="label-style text-xs">Discharges</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.discharges || ''}
                                    onChange={(e) => handleChange(unitId, 'discharges', e.target.value)}
                                    className="input-style p-1 text-xs"
                                    disabled={!isManager}
                                />
                            </div>
                        </div>
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

export default ExpectedPatientCensus;
