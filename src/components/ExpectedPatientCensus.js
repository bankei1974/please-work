import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ExpectedPatientCensus = ({ selectedUnits, units }) => {
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
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4">Expected Patient Census for {today}</h3>
            <div className="space-y-4">
                {selectedUnits.map(unitId => (
                    <div key={unitId} className="bg-gray-700/50 p-4 rounded-md">
                        <h4 className="text-lg font-semibold mb-2">{units.find(u => u.id === unitId)?.name}</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label-style">Total</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.total || ''}
                                    onChange={(e) => handleChange(unitId, 'total', e.target.value)}
                                    className="input-style"
                                />
                            </div>
                            <div>
                                <label className="label-style">Admissions</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.admissions || ''}
                                    onChange={(e) => handleChange(unitId, 'admissions', e.target.value)}
                                    className="input-style"
                                />
                            </div>
                            <div>
                                <label className="label-style">Discharges</label>
                                <input
                                    type="number"
                                    value={censusData[unitId]?.discharges || ''}
                                    onChange={(e) => handleChange(unitId, 'discharges', e.target.value)}
                                    className="input-style"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => handleSave(unitId)} className="btn-primary">Save</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpectedPatientCensus;
