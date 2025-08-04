import React, { useState, useMemo, useEffect } from 'react';
import CustomTooltip from './CustomTooltip';
import DailyStaffingGraph from './DailyStaffingGraph';
import StaffingLevelsModal from './StaffingLevelsModal';
import PatientCensusModal from './PatientCensusModal';
import PatientCensusTable from './PatientCensusTable';
import StaffingLevelsTable from './StaffingLevelsTable';
import { useCollection } from '../hooks/useCollection';
import { where, doc, updateDoc } from 'firebase/firestore';
import { createUtcDateFromCentralTime } from '../utils/timezoneHelpers';

import { db } from '../firebase';
import { useAuthContext } from '../context/AuthContext';

const ReportsPage = () => {
    const { userProfile: currentUserProfile } = useAuthContext();
    const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

    const { data: units } = useCollection(db, 'units');

    // Load preferences from user profile on mount
    useEffect(() => {
        if (currentUserProfile && currentUserProfile.preferences) {
            if (currentUserProfile.preferences.selectedUnit) {
                setSelectedUnit(currentUserProfile.preferences.selectedUnit);
            }
            if (currentUserProfile.preferences.selectedDate) {
                setSelectedDate(currentUserProfile.preferences.selectedDate);
            }
        }
    }, [currentUserProfile]);

    // Save preferences to user profile when selectedUnit or selectedDate changes
    useEffect(() => {
        if (currentUserProfile && db) {
            const userRef = doc(db, 'users', currentUserProfile.id);
            updateDoc(userRef, {
                preferences: {
                    ...currentUserProfile.preferences,
                    selectedUnit,
                    selectedDate,
                },
            }).catch(error => console.error("Error saving user preferences:", error));
        }
    }, [selectedUnit, selectedDate, currentUserProfile, db]);

    const patientCensusQuery = useMemo(() => {
        if (selectedUnit && selectedDate) {
            const docId = `${selectedDate}_${selectedUnit}`;
            // This is a way to query for a specific document by its ID.
            // Firestore's `where` clause doesn't directly support querying by ID in a collection query,
            // so we use the special `__name__` field.
            return [where('__name__', '==', docId)];
        }
        // Return a query that will never match anything if no unit or date is selected
        return [where('__name__', '==', 'no-selection')];
    }, [selectedDate, selectedUnit]);

    const { data: patientCensusDocs } = useCollection(db, 'patientCensus', patientCensusQuery);

    const patientCensusDataForGraph = useMemo(() => {
        if (patientCensusDocs && patientCensusDocs.length > 0 && patientCensusDocs[0].census) {
            return patientCensusDocs[0].census;
        }
        return {};
    }, [patientCensusDocs]);

    const staffingLevelsQuery = useMemo(() => {
        if (selectedUnit && selectedDate) {
            const docId = `${selectedDate}_${selectedUnit}`;
            return [where('__name__', '==', docId)];
        }
        return [where('__name__', '==', 'no-selection')];
    }, [selectedDate, selectedUnit]);

    const { data: staffingLevelsDocs } = useCollection(db, 'staffingLevels', staffingLevelsQuery);

    const staffingLevelsDataForGraph = useMemo(() => {
        if (staffingLevelsDocs && staffingLevelsDocs.length > 0 && staffingLevelsDocs[0].levels) {
            return staffingLevelsDocs[0].levels;
        }
        return {};
    }, [staffingLevelsDocs]);

    // This will need to be derived from shifts data later
    const shiftsQuery = useMemo(() => {
        if (!selectedDate) {
            // Return a query that will never match anything if no date is selected
            return [where('__name__', '==', 'no-date-selected')];
        }

        // Get the day before the selected date to catch overnight shifts
        const d = new Date(selectedDate + 'T00:00:00Z'); // Treat date as UTC to avoid timezone issues
        d.setUTCDate(d.getUTCDate() - 1);
        const previousDate = d.toISOString().split('T')[0];

        const queries = [where("date", "in", [selectedDate, previousDate])];
        if (selectedUnit) {
            queries.push(where("unitId", "==", selectedUnit));
        }
        return queries;
    }, [selectedDate, selectedUnit]);

    const { data: shifts } = useCollection(db, 'shifts', shiftsQuery);
    const { data: staffList } = useCollection(db, 'users');

    const productiveStaffData = useMemo(() => {
        const staffCounts = Array(96).fill(0); // 96 15-minute intervals in a day
        const staffNamesPerInterval = Array(96).fill(null).map(() => []); // Store names for each interval
        const nonProductiveStatuses = new Set(['PTO', 'EIB', 'Call out', 'Non-Productive', 'Orientation', 'Preferred Off']);

        if (!selectedDate) return [];

        // Establish the reporting day's boundaries in UTC, assuming the date is in Central Time.
        const selectedDayStartUTC = createUtcDateFromCentralTime(selectedDate, 0, 0, 0);
        const selectedDayEndUTC = createUtcDateFromCentralTime(selectedDate, 23, 59, 59);

        if (!selectedDayStartUTC || !selectedDayEndUTC) return [];

        shifts.forEach(shift => {
            const staffMember = staffList.find(staff => staff.id === shift.staffId);

            if (staffMember && (staffMember.jobTitle === 'Registered Nurse' || staffMember.jobTitle === 'LPN')) {
                const shiftStatuses = Array.isArray(shift.status) ? shift.status : [shift.status];
                const isProductive = shiftStatuses.every(status => !nonProductiveStatuses.has(status));

                if (isProductive && shift.shiftStartDateTime && shift.shiftEndDateTime) {
                    const shiftStartUtc = new Date(shift.shiftStartDateTime);
                    const shiftEndUtc = new Date(shift.shiftEndDateTime);

                    // The shift times are already in UTC from Firestore.
                    // We just need to find the part of the shift that falls within our selected day (in UTC).
                    const effectiveStart = new Date(Math.max(shiftStartUtc.getTime(), selectedDayStartUTC.getTime()));
                    const effectiveEnd = new Date(Math.min(shiftEndUtc.getTime(), selectedDayEndUTC.getTime()));

                    if (effectiveStart < effectiveEnd) {
                        let current = new Date(effectiveStart);

                        while (current < effectiveEnd) {
                            // Calculate the interval index based on the UTC time relative to the start of the Central Time day.
                            const diffInMillis = current.getTime() - selectedDayStartUTC.getTime();
                            const minutesIntoDay = diffInMillis / (1000 * 60);
                            const intervalIndex = Math.floor(minutesIntoDay / 15);

                            if (intervalIndex >= 0 && intervalIndex < 96) {
                                staffCounts[intervalIndex]++;
                                if (staffMember.fullName) {
                                    staffNamesPerInterval[intervalIndex].push(staffMember.fullName);
                                }
                            }
                            // Move to the next 15-minute interval
                            current.setUTCMinutes(current.getUTCMinutes() + 15);
                        }
                    }
                }
            }
        });

        return Array.from({ length: 96 }, (_, i) => {
            const hour = Math.floor(i / 4);
            const minute = (i % 4) * 15;
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            return {
                time,
                'Productive Staff': staffCounts[i],
                productiveStaffNames: staffNamesPerInterval[i],
            };
        });
    }, [shifts, staffList, selectedDate]);

    const graphData = useMemo(() => {
        const mergedData = productiveStaffData.map(prod => {
            const censusCount = patientCensusDataForGraph[prod.time] ? parseInt(patientCensusDataForGraph[prod.time], 10) : 0;
            const minStaff = staffingLevelsDataForGraph[prod.time] ? parseInt(staffingLevelsDataForGraph[prod.time].min, 10) : 0;
            const optimalStaff = staffingLevelsDataForGraph[prod.time] ? parseInt(staffingLevelsDataForGraph[prod.time].optimal, 10) : 0;
            return {
                ...prod,
                'Patient Census': isNaN(censusCount) ? 0 : censusCount,
                'Minimum Staff': isNaN(minStaff) ? 0 : minStaff,
                'Optimal Staff': isNaN(optimalStaff) ? 0 : optimalStaff,
            };
        });
        return mergedData;
    }, [productiveStaffData, patientCensusDataForGraph, staffingLevelsDataForGraph]);

    return (
        <main className="p-8 overflow-y-auto flex-1 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Reports & Analytics</h1>
                <div className="flex gap-4">
                    <button onClick={() => setIsPatientCensusModalOpen(true)} className="btn-secondary">Input Patient Census</button>
                </div>
            </div>
            <div className="flex gap-4 mb-4">
                <div>
                    <label className="label-style">Select Unit:</label>
                    <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="input-style">
                        <option value="">All Units</option>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label-style">Select Date:</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-style" />
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 h-[400px] flex flex-col">
                <h2 className="text-2xl font-semibold mb-4">Daily Staffing Graph</h2>
                <div className="h-[300px]">
                    <DailyStaffingGraph graphData={graphData} />
                </div>
            </div>
            {selectedUnit && selectedDate && (
                <PatientCensusTable selectedUnit={units.find(u => u.id === selectedUnit)} selectedDate={selectedDate} />
            )}
            {selectedUnit && selectedDate && (
                <StaffingLevelsTable selectedUnit={units.find(u => u.id === selectedUnit)} selectedDate={selectedDate} />
            )}
            <PatientCensusModal isOpen={isPatientCensusModalOpen} onClose={() => setIsPatientCensusModalOpen(false)} db={db} selectedDate={selectedDate} />
        </main>
    );
};

export default ReportsPage;