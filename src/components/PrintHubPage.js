import React, { useState } from 'react';
import './print.css';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import { where } from 'firebase/firestore';
import FourWeekSchedule from './FourWeekSchedule';
import * as XLSX from 'xlsx';

const PrintHubPage = () => {
    const [scheduleType, setScheduleType] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    const { data: units } = useCollection(db, 'units');
    const { data: jobTitles } = useCollection(db, 'jobTitles');
    const { data: statuses } = useCollection(db, 'statuses');

    const shiftsQuery = () => {
        if (scheduleType === 'daily') {
            let queries = [where('date', '==', selectedDate)];
            if (selectedUnits.length) {
                queries.push(where('unitId', 'in', selectedUnits));
            }
            if (selectedRoles.length) {
                queries.push(where('jobTitle', 'in', selectedRoles));
            }
            if (selectedStatuses.length) {
                queries.push(where('status', 'in', selectedStatuses));
            }
            return queries;
        } else {
            const endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 28);
            let queries = [
                where('date', '>=', selectedDate),
                where('date', '<=', endDate.toISOString().split('T')[0])
            ];
            if (selectedUnits.length) {
                queries.push(where('unitId', 'in', selectedUnits));
            }
            if (selectedRoles.length) {
                queries.push(where('jobTitle', 'in', selectedRoles));
            }
            if (selectedStatuses.length) {
                queries.push(where('status', 'in', selectedStatuses));
            }
            return queries;
        }
    };

    const { data: shifts } = useCollection(db, 'shifts', shiftsQuery());
    const { data: staff } = useCollection(db, 'users');

    const handleUnitChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedUnits(value);
    };

    const handleRoleChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedRoles(value);
    };

    const handleStatusChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedStatuses(value);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        const data = shifts.map(shift => {
            const staffMember = staff.find(s => s.id === shift.staffId);
            return {
                'Name': staffMember?.fullName,
                'Unit': units.find(u => u.id === shift.unitId)?.name,
                'Role': shift.jobTitle,
                'Status': shift.status,
                'Date': shift.date,
                'Start Time': shift.startTime,
                'End Time': shift.endTime,
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staffing Report");
        XLSX.writeFile(wb, "staffing_report.xlsx");
    };

    return (
        <main className="p-8 overflow-y-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Print Hub</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <label className="label-style">Schedule Type:</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1">
                            <input type="radio" name="scheduleType" value="daily" checked={scheduleType === 'daily'} onChange={e => setScheduleType(e.target.value)} />
                            Daily
                        </label>
                        <label className="flex items-center gap-1">
                            <input type="radio" name="scheduleType" value="four-week" checked={scheduleType === 'four-week'} onChange={e => setScheduleType(e.target.value)} />
                            Four-Week
                        </label>
                    </div>
                </div>
                <div>
                    <label className="label-style">Select Date:</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-style" />
                </div>
                <div>
                    <label className="label-style">Select Units:</label>
                    <select multiple value={selectedUnits} onChange={handleUnitChange} className="input-style">
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label-style">Select Roles:</label>
                    <select multiple value={selectedRoles} onChange={handleRoleChange} className="input-style">
                        {jobTitles.map(role => (
                            <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label-style">Select Statuses:</label>
                    <select multiple value={selectedStatuses} onChange={handleStatusChange} className="input-style">
                        {statuses.map(status => (
                            <option key={status.id} value={status.name}>{status.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end mb-4 gap-4">
                <button onClick={handleExport} className="btn-secondary">Export to Excel</button>
                <button onClick={handlePrint} className="btn-primary">Print Report</button>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700" id="printable-area">
                {scheduleType === 'daily' ? (
                    <>
                        <h2 className="text-2xl font-semibold mb-4">Staffing Report for {selectedDate}</h2>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Unit</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.map(shift => {
                                    const staffMember = staff.find(s => s.id === shift.staffId);
                                    return (
                                        <tr key={shift.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-4">{staffMember?.fullName}</td>
                                            <td className="p-4">{units.find(u => u.id === shift.unitId)?.name}</td>
                                            <td className="p-4">{shift.jobTitle}</td>
                                            <td className="p-4">{shift.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <FourWeekSchedule shifts={shifts} staff={staff} units={units} startDate={selectedDate} />
                )}
            </div>
        </main>
    );
};

export default PrintHubPage;
