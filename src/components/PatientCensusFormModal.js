import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Helper to generate 15-minute intervals
const generateTimeIntervals = () => {
    const intervals = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            intervals.push(time);
        }
    }
    return intervals;
};

const allTimeIntervals = generateTimeIntervals();

const PatientCensusFormModal = ({ isOpen, onClose, db, propSelectedDate }) => {
    const [date, setDate] = useState('');
    // Use a Map to store census counts for each interval, keyed by time string
    const [censusDataByInterval, setCensusDataByInterval] = useState(new Map());
    const [loadingCensus, setLoadingCensus] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const today = propSelectedDate || new Date().toISOString().split('T')[0];
            setDate(today);

            const fetchCensusData = async () => {
                setLoadingCensus(true);
                const q = query(collection(db, 'patientCensus'), where('date', '==', today));
                const querySnapshot = await getDocs(q);
                const fetchedData = new Map();
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Store doc.id along with censusCount for updates/deletes
                    fetchedData.set(data.startTime, { id: doc.id, censusCount: data.censusCount });
                });

                // Initialize all intervals with fetched data or 0
                const initialCensus = new Map();
                allTimeIntervals.forEach(interval => {
                    initialCensus.set(interval, fetchedData.get(interval)?.censusCount || ''); // Use empty string for empty input
                });
                setCensusDataByInterval(initialCensus);
                setLoadingCensus(false);
            };

            fetchCensusData();
        } else {
            // Reset state when modal closes
            setDate('');
            setCensusDataByInterval(new Map());
            setLoadingCensus(true);
        }
    }, [isOpen, db, propSelectedDate]);

    const handleCensusChange = (interval, value) => {
        setCensusDataByInterval(prev => {
            const newMap = new Map(prev);
            newMap.set(interval, value === '' ? '' : Number(value)); // Store as number or empty string
            return newMap;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            for (const [interval, count] of censusDataByInterval.entries()) {
                const censusCount = Number(count);
                if (isNaN(censusCount) || censusCount < 0) {
                    // Skip invalid entries or handle error
                    continue;
                }

                const q = query(collection(db, 'patientCensus'), where('date', '==', date), where('startTime', '==', interval));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Update existing document
                    const docToUpdate = querySnapshot.docs[0];
                    if (censusCount === 0) {
                        // If count is 0, delete the entry
                        await deleteDoc(doc(db, 'patientCensus', docToUpdate.id));
                    } else {
                        await updateDoc(doc(db, 'patientCensus', docToUpdate.id), {
                            censusCount,
                            updatedAt: serverTimestamp()
                        });
                    }
                } else {
                    // Add new document only if count is greater than 0
                    if (censusCount > 0) {
                        await addDoc(collection(db, 'patientCensus'), {
                            date,
                            startTime: interval,
                            endTime: interval, // For 15-min intervals, start and end time are the same
                            censusCount,
                            createdAt: serverTimestamp()
                        });
                    }
                }
            }
            alert('Patient census saved successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving patient census:', error);
            alert('Failed to save patient census. See console for details.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enter Patient Census (15-min intervals)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-style">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input-style"
                        required
                        disabled // Date should be selected from ReportsPage
                    />
                </div>

                <div className="max-h-80 overflow-y-auto border border-gray-700 rounded-md p-2">
                    {loadingCensus ? (
                        <p>Loading census data...</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {allTimeIntervals.map(interval => (
                                <div key={interval} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                                    <label className="text-white text-sm">{interval}</label>
                                    <input
                                        type="number"
                                        value={censusDataByInterval.get(interval) || ''}
                                        onChange={(e) => handleCensusChange(interval, e.target.value)}
                                        className="w-20 input-style text-right"
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Census</button>
                </div>
            </form>
        </Modal>
    );
};

export default PatientCensusFormModal;