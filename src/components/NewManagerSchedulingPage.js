import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCollection } from '../hooks/useCollection';
import ShiftModal from './ShiftModal';
import PublishModal from './PublishModal';
import ApplyTemplateModal from './ApplyTemplateModal';
import { Search, ChevronLeft, ChevronRight, Send, FilePlus, User } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { where, doc, updateDoc, addDoc, deleteDoc, deleteField, collection, writeBatch, orderBy } from 'firebase/firestore';
import TodaysView from './TodaysView';
import StaffList from './StaffList';

import { db } from '../firebase';

const NewManagerSchedulingPage = ({ onViewProfile }) => {
    const [startDate, setStartDate] = useState(new Date());
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [selectedShiftInfo, setSelectedShiftInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTodaysView, setShowTodaysView] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
    const [selectedStaffForTemplate, setSelectedStaffForTemplate] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, content: null, x: 0, y: 0 });
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [selectedJobTitles, setSelectedJobTitles] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [isUnitFilterExpanded, setIsUnitFilterExpanded] = useState(false);
    const [isJobTitleFilterExpanded, setIsJobTitleFilterExpanded] = useState(false);
    const [isStatusFilterExpanded, setIsStatusFilterExpanded] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPendingShiftsExpanded, setIsPendingShiftsExpanded] = useState(true);

    const handleDateChange = (e) => {
        setSelectedDate(new Date(e.target.value));
    };

    const usersPath = `users`;
    const shiftsPath = `shifts`;
    const unitsPath = `units`;
    const jobTitlesPath = `jobTitles`;
    const statusesPath = `statuses`;

    const { data: fetchedStaffList, loading: staffLoading } = useCollection(db, usersPath);
    const [staffData, setStaffData] = useState([]);

    useEffect(() => {
        if (fetchedStaffList) {
            setStaffData(fetchedStaffList);
        }
    }, [fetchedStaffList]);
    const { data: shifts } = useCollection(db, shiftsPath);
    const { data: openShifts = [] } = useCollection(db, 'openShifts');

    const pendingShifts = useMemo(() => {
        return openShifts.filter(shift => shift.claimStatus === 'pending');
    }, [openShifts]);

    const handleApproveShift = async (shift) => {
        if (!window.confirm(`Are you sure you want to approve this shift for ${shift.claimedByName}?`)) {
            return;
        }
        try {
            const { claimedBy, claimedByName, startTime, endTime, ...restOfShiftData } = shift;

            const newShiftData = {
                ...restOfShiftData,
                staffId: claimedBy,
                claimStatus: 'approved',
                shiftStartDateTime: startTime.toDate().toISOString(),
                shiftEndDateTime: endTime.toDate().toISOString(),
            };

            await addDoc(collection(db, 'shifts'), newShiftData);
            await deleteDoc(doc(db, 'openShifts', shift.id));

            alert('Shift approved and moved to staff schedule!');
        } catch (error) {
            console.error("Error approving shift:", error);
            alert('Failed to approve shift. Please try again.');
        }
    };

    const handleRejectShift = async (shift) => {
        if (!window.confirm(`Are you sure you want to reject this shift for ${shift.claimedByName}?`)) {
            return;
        }
        try {
            const shiftRef = doc(db, 'openShifts', shift.id);
            await updateDoc(shiftRef, {
                claimStatus: 'open',
                claimedBy: deleteField(),
                claimedByName: deleteField(),
            });
            alert('Shift rejected and returned to open shifts.');
        } catch (error) {
            console.error("Error rejecting shift:", error);
            alert('Failed to reject shift. Please try again.');
        }
    };
    const { data: units } = useCollection(db, unitsPath);
    const { data: jobTitles } = useCollection(db, jobTitlesPath);
    const { data: statuses } = useCollection(db, statusesPath);

    const { data: staffingLevels } = useCollection(db, 'staffingLevels', [
        where('date', '<=', selectedDate.toISOString().split('T')[0])
    ], ["date", "desc"]);

    const unitsMap = useMemo(() => {
        if (!units) return {};
        return units.reduce((acc, unit) => {
            acc[unit.id] = unit;
            return acc;
        }, {});
    }, [units]);
    
    const sortedStaffList = useMemo(() =>
        [...staffData].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
    , [staffData]);

    const filteredStaff = useMemo(() => {
        let currentStaff = [...sortedStaffList];

        if (searchQuery) {
            currentStaff = currentStaff.filter(s => s.fullName && s.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Only filter by job title if a job title is selected
        if (selectedJobTitles.length > 0) {
            currentStaff = currentStaff.filter(staff => selectedJobTitles.includes(staff.jobTitle));
        }

        return currentStaff;
    }, [sortedStaffList, searchQuery, selectedJobTitles]);

    const filteredShifts = useMemo(() => {
        if (!shifts) return [];
        let currentShifts = [...shifts];

        // Filter shifts based on selected units
        if (selectedUnits.length > 0) {
            currentShifts = currentShifts.filter(shift => selectedUnits.includes(unitsMap[shift.unitId]?.name));
        }

        // Filter shifts based on selected statuses
        if (selectedStatuses.length > 0) {
            currentShifts = currentShifts.filter(shift =>
                shift.status && Array.isArray(shift.status) && shift.status.some(s => selectedStatuses.includes(s))
            );
        }

        return currentShifts;
    }, [shifts, selectedUnits, selectedStatuses, unitsMap]);

    const todaysViewShifts = useMemo(() => {
        if (!shifts) return [];
        let currentShifts = [...shifts];

        if (selectedUnits.length > 0) {
            currentShifts = currentShifts.filter(shift => selectedUnits.includes(unitsMap[shift.unitId]?.name));
        }

        const staffIds = filteredStaff.map(staff => staff.id);
        currentShifts = currentShifts.filter(shift => staffIds.includes(shift.staffId));

        return currentShifts;
    }, [shifts, selectedUnits, filteredStaff, unitsMap]);
    
    const dates = Array.from({ length: 28 }, (_, i) => { const date = new Date(startDate); date.setDate(date.getDate() + i); return date; });
    const handleWeekChange = (days) => setStartDate(prev => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + days); return newDate; });
    const handleOpenShiftModal = (staff, date, shift = null) => { setSelectedShiftInfo({ staff, date, shift }); setIsShiftModalOpen(true); };

    const handleOpenShiftClick = (shift) => {
        // This is where you'd implement the logic for a manager clicking an open shift
        // For example, opening a modal to approve/deny the shift, or reassign it.
        console.log("Manager clicked open shift:", shift);
        // You might want to open a specific modal for open shifts here
        // For now, we'll just log it.
    };
    const handleOpenApplyTemplateModal = (staff) => { setSelectedStaffForTemplate(staff); setIsApplyTemplateModalOpen(true); };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedStaff = Array.from(staffData);
        const [removed] = reorderedStaff.splice(result.source.index, 1);
        reorderedStaff.splice(result.destination.index, 0, removed);

        setStaffData(reorderedStaff);
    };
    const handleMouseEnter = (e, shift) => {
        const content = (
            <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${unitsMap[shift.unitId]?.color || 'bg-gray-600'}`}></div>
                <span>{(shift.status && Array.isArray(shift.status)) ? shift.status.join(', ') : 'N/A'}</span>
            </div>
        );
        setTooltip({ visible: true, content, x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, content: null, x: 0, y: 0 });
    };

    const statusSymbols = useMemo(() => {
        return statuses.reduce((acc, status) => {
            if (status.name) {
                acc[status.name] = status.symbol || '';
            }
            return acc;
        }, {});
    }, [statuses]);
    
    const workloadColor = (rating) => { if (rating >= 4) return 'bg-green-500'; if (rating === 3) return 'bg-yellow-500'; if (rating <= 2) return 'bg-red-500'; return 'hidden'; };
    
    const getShiftDateObjects = (shift) => {
        let shiftStart = null;
        let shiftEnd = null;

        if (shift.shiftStartDateTime) {
            shiftStart = new Date(shift.shiftStartDateTime);
        } else if (shift.startTime?.seconds) {
            shiftStart = new Date(shift.startTime.seconds * 1000);
        }

        if (shift.shiftEndDateTime) {
            shiftEnd = new Date(shift.shiftEndDateTime);
        } else if (shift.endTime?.seconds) {
            shiftEnd = new Date(shift.endTime.seconds * 1000);
        }

        if (shiftStart && shiftEnd && !isNaN(shiftStart) && !isNaN(shiftEnd)) {
            return { shiftStart, shiftEnd };
        }

        return { shiftStart: null, shiftEnd: null };
    }

    const formatShiftTime = (shift) => {
        const { shiftStart, shiftEnd } = getShiftDateObjects(shift);

        if (shiftStart && shiftEnd) {
            const options = {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'America/Chicago',
            };
            const startTimeString = new Intl.DateTimeFormat('en-US', options).format(shiftStart);
            const endTimeString = new Intl.DateTimeFormat('en-US', options).format(shiftEnd);
            return `${startTimeString} - ${endTimeString}`;
        }

        return 'Invalid time';
    }

    const getDayColoring = (date) => {
        const minStaff = 4;
        const optStaff = 6;
        if (!shifts) return 'bg-gray-800';
        const dayShifts = shifts.filter(s => s.date === date.toISOString().split('T')[0] && Array.isArray(s.status) && s.status.includes('Productive'));
        if (dayShifts.length === 0) return 'bg-gray-800';

        const slots = Array(48).fill(0); // 30-min slots
        dayShifts.forEach(shift => {
            const { shiftStart, shiftEnd } = getShiftDateObjects(shift);
            if(shiftStart && shiftEnd) {
                const options = {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: false,
                    timeZone: 'America/Chicago',
                };
                const startParts = new Intl.DateTimeFormat('en-US', options).formatToParts(shiftStart).reduce((acc, part) => { if(part.type !== 'literal') acc[part.type] = part.value; return acc; }, {});
                const endParts = new Intl.DateTimeFormat('en-US', options).formatToParts(shiftEnd).reduce((acc, part) => { if(part.type !== 'literal') acc[part.type] = part.value; return acc; }, {});

                const start = Math.floor(parseInt(startParts.hour) * 2 + parseInt(startParts.minute) / 30);
                const end = Math.ceil(parseInt(endParts.hour) * 2 + parseInt(endParts.minute) / 30);

                for (let i = start; i < end; i++) {
                    slots[i]++;
                }
            }
        });

        const belowMin = slots.filter(s => s < minStaff).length;
        const atMin = slots.filter(s => s >= minStaff).length;
        const atOpt = slots.filter(s => s >= optStaff).length;
        
        if (belowMin / 48 > 0.3) return 'bg-red-900/50';
        if (atOpt / 48 > 0.7) return 'bg-green-900/50';
        if (atMin / 48 > 0.7) return 'bg-blue-900/50';
        return 'bg-yellow-900/50';
    };

    return (
        <main className="p-8 flex-1 flex flex-col h-full">
            <div className="flex justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white">Staff Scheduling</h1>
                    <div className="relative mt-4 flex items-center">
                        <Search className="text-gray-400 ml-3" size={20}/>
                        <input type="text" placeholder="Search staff..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-style w-64 pl-10"/>
                    </div>
                </div>
                {!showTodaysView && <div className="flex items-center gap-4">
                    <button onClick={() => handleWeekChange(-7)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronLeft/></button>
                    <span className="text-xl font-semibold">{dates[0].toLocaleDateString()} - {dates[27].toLocaleDateString()}</span>
                    <button onClick={() => handleWeekChange(7)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronRight/></button>
                </div>}
                <div className="text-right flex flex-col items-end gap-2">
                    <button onClick={() => setIsPublishModalOpen(true)} className="btn-primary flex items-center gap-2"><Send size={18}/> Publish Schedule</button>
                    <button onClick={() => setShowTodaysView(!showTodaysView)} className="btn-secondary">{showTodaysView ? "Show Full Schedule" : "Show Today's View"}</button>
                    
                </div>
            </div>

            {/* Pending Shifts for Approval Section */}
            <div className="mb-8 bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Pending Shifts for Approval ({pendingShifts.length})</h2>
                    <button
                        onClick={() => setIsPendingShiftsExpanded(!isPendingShiftsExpanded)}
                        className="text-gray-400 hover:text-white text-sm"
                    >
                        {isPendingShiftsExpanded ? 'Hide' : 'Show'}
                    </button>
                </div>
                {isPendingShiftsExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingShifts.length === 0 ? (
                            <p className="text-gray-400">No shifts pending approval.</p>
                        ) : (
                            pendingShifts.map(shift => (
                                <div key={shift.id} className="bg-gray-700 p-4 rounded-lg shadow-md">
                                    <p className="font-bold">{unitsMap[shift.unitId]?.name || shift.unitId}</p>
                                    <p className="text-sm">{new Date(shift.startTime.seconds * 1000).toLocaleDateString()} {new Date(shift.startTime.seconds * 1000).toLocaleTimeString()} - {new Date(shift.endTime.seconds * 1000).toLocaleTimeString()}</p>
                                    <p className="text-sm text-blue-400">Claimed by: {shift.claimedByName}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleApproveShift(shift)}
                                            className="btn-primary flex-1"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRejectShift(shift)}
                                            className="btn-danger flex-1"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Original header and search bar */}
            

            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 mb-4">
                {/* Unit Filter */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-2 flex justify-between items-center">
                        Filter by Unit
                        <button onClick={() => setIsUnitFilterExpanded(!isUnitFilterExpanded)} className="text-gray-400 hover:text-white text-sm">
                            {isUnitFilterExpanded ? 'Hide' : 'Show'}
                        </button>
                    </h3>
                    {isUnitFilterExpanded && (
                        <div className="flex flex-wrap gap-2">
                            {units.map(unit => (
                                <label key={unit.id} className="flex items-center gap-1 text-white text-sm">
                                    <input
                                        type="checkbox"
                                        value={unit.name}
                                        checked={selectedUnits.includes(unit.name)}
                                        onChange={(e) => {
                                            const { value, checked } = e.target;
                                            setSelectedUnits(prev =>
                                                checked ? [...prev, value] : prev.filter(u => u !== value)
                                            );
                                        }}
                                        className="h-4 w-4 rounded"
                                    />
                                    {unit.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Title Filter */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-2 flex justify-between items-center">
                        Filter by Job Title
                        <button onClick={() => setIsJobTitleFilterExpanded(!isJobTitleFilterExpanded)} className="text-gray-400 hover:text-white text-sm">
                            {isJobTitleFilterExpanded ? 'Hide' : 'Show'}
                        </button>
                    </h3>
                    {isJobTitleFilterExpanded && (
                        <div className="flex flex-wrap gap-2">
                            {jobTitles.map(jobTitle => (
                                <label key={jobTitle.id} className="flex items-center gap-1 text-white text-sm">
                                    <input
                                        type="checkbox"
                                        value={jobTitle.name}
                                        checked={selectedJobTitles.includes(jobTitle.name)}
                                        onChange={(e) => {
                                            const { value, checked } = e.target;
                                            setSelectedJobTitles(prev =>
                                                checked ? [...prev, value] : prev.filter(jt => jt !== value)
                                            );
                                        }}
                                        className="h-4 w-4 rounded"
                                    />
                                    {jobTitle.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-2 flex justify-between items-center">
                        Filter by Status
                        <button onClick={() => setIsStatusFilterExpanded(!isStatusFilterExpanded)} className="text-gray-400 hover:text-white text-sm">
                            {isStatusFilterExpanded ? 'Hide' : 'Show'}
                        </button>
                    </h3>
                    {isStatusFilterExpanded && (
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <label key={status.id} className="flex items-center gap-1 text-white text-sm">
                                    <input
                                        type="checkbox"
                                        value={status.name}
                                        checked={selectedStatuses.includes(status.name)}
                                        onChange={(e) => {
                                            const { value, checked } = e.target;
                                            setSelectedStatuses(prev =>
                                                checked ? [...prev, value] : prev.filter(s => s !== value)
                                            );
                                        }}
                                        className="h-4 w-4 rounded"
                                    />
                                    {status.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showTodaysView ? <TodaysView db={db} staffList={filteredStaff} shifts={todaysViewShifts} statusSymbols={statusSymbols} unitsMap={unitsMap} selectedDate={selectedDate} handleDateChange={handleDateChange} /> : (
                <StaffList
                    staffData={staffData}
                    setStaffData={setStaffData}
                    filteredStaff={filteredStaff}
                    onViewProfile={onViewProfile}
                    handleOpenApplyTemplateModal={handleOpenApplyTemplateModal}
                    dates={dates}
                    filteredShifts={filteredShifts}
                    handleOpenShiftModal={handleOpenShiftModal}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMouseLeave}
                    unitsMap={unitsMap}
                    statusSymbols={statusSymbols}
                    workloadColor={workloadColor}
                    formatShiftTime={formatShiftTime}
                    staffLoading={staffLoading}
                />
            )}
            <ShiftModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} db={db} shiftInfo={selectedShiftInfo} units={units} statuses={statuses} collectionPath={shiftsPath} />
            <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} db={db} collectionPath={shiftsPath} startDate={dates[0].toISOString().split('T')[0]} endDate={dates[27].toISOString().split('T')[0]}/>
            <ApplyTemplateModal isOpen={isApplyTemplateModalOpen} onClose={() => setIsApplyTemplateModalOpen(false)} db={db} staffMember={selectedStaffForTemplate} shiftsPath={shiftsPath} />
            {tooltip.visible && (
                <div
                    style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
                    className="absolute z-20 bg-gray-800 text-white p-2 rounded-lg shadow-lg"
                >
                    {tooltip.content}
                </div>
            )}
        </main>
    );
};

export default NewManagerSchedulingPage;