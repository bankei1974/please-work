import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { User, FilePlus } from 'lucide-react';

const StaffList = ({
    staffData,
    setStaffData,
    filteredStaff,
    onViewProfile,
    handleOpenApplyTemplateModal,
    dates,
    filteredShifts,
    handleOpenShiftModal,
    handleMouseEnter,
    handleMouseLeave,
    unitsMap,
    statusSymbols,
    workloadColor,
    formatShiftTime,
    staffLoading,
    refetchStaff,
}) => {
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const reorderedStaff = Array.from(staffData);
        const [removed] = reorderedStaff.splice(result.source.index, 1);
        reorderedStaff.splice(result.destination.index, 0, removed);

        setStaffData(reorderedStaff);

        const batch = writeBatch(db);
        reorderedStaff.forEach((staff, index) => {
            const staffRef = doc(db, 'users', staff.id);
            batch.update(staffRef, { displayOrder: index });
        });

        try {
            await batch.commit();
            setTimeout(() => {
                refetchStaff();
            }, 500);
        } catch (error) {
            console.error("Error updating display order:", error);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="staff-members">
                {(provided) => (
                    <div className="flex-1 h-0 overflow-x-auto" {...provided.droppableProps} ref={provided.innerRef}>
                        <table className="w-full text-left border-separate" style={{ borderSpacing: '0 0.5rem' }}>
                            <thead>
                                <tr>
                                    <th className="p-2 sticky left-0 bg-.gray-900 z-30">Staff Member</th>
                                    {dates.map(date => (
                                        <th key={date.toISOString()} className={`p-2 text-center min-w-[100px] rounded-t-lg sticky top-0 z-30`}>
                                            <div className="text-xs text-gray-300">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            <div>{date.getDate()}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800">
                                {staffLoading ? (
                                    <tr><td colSpan={29}>Loading staff...</td></tr>
                                ) : filteredStaff.map((staff, index) => (
                                    <Draggable key={staff.id} draggableId={staff.id} index={index}>
                                        {(provided) => (
                                            <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-gray-800">
                                                <td className="p-10 sticky left-0 bg-gray-800 z-10 border-y border-l border-gray-700 rounded-l-lg font-medium whitespace-nowrap min-w-max">
                                                    <div className="flex items-center gap-1">
                                                        {staff.profilePictureUrl && (
                                                            <img src={staff.profilePictureUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                                                        )}
                                                        <span>{staff.fullName}</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        <button onClick={() => onViewProfile(staff.id)} className="text-gray-400 hover:text-white p-1 rounded-full bg-gray-700/50">
                                                            <User size={14} />
                                                        </button>
                                                        <button onClick={() => handleOpenApplyTemplateModal(staff)} className="text-gray-400 hover:text-white p-1 rounded-full bg-gray-700/50">
                                                            <FilePlus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                {dates.map(date => {
                                                    const dateString = date.toISOString().split('T')[0];
                                                    const shiftsForCell = filteredShifts.filter(s => s.staffId === staff.id && s.date === dateString);
                                                    return (
                                                        <td key={dateString} className="p-1 border-t border-b border-gray-700 hover:bg-blue-600/20 cursor-pointer h-20 align-top" onClick={() => handleOpenShiftModal(staff, date)}>
                                                            <div className="space-y-1">
                                                                {shiftsForCell.map(shift => (
                                                                    <div
                                                                        key={shift.id}
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenShiftModal(staff, date, shift); }}
                                                                        onMouseEnter={(e) => handleMouseEnter(e, shift)}
                                                                        onMouseLeave={handleMouseLeave}
                                                                        className={`relative p-1 rounded text-xs text-white ${unitsMap[shift.unitId]?.color || 'bg-gray-600'} ${!shift.published ? 'opacity-50 border-2 border-dashed border-gray-400' : ''} `}
                                                                        title={Array.isArray(shift.status) ? shift.status.join(', ') : shift.status}
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <div>{formatShiftTime(shift)}</div>
                                                                            <div className="flex gap-1">
                                                                                {Array.isArray(shift.status) && shift.status.map(s => <span key={s} className="text-xl text-white text-shadow-default">{statusSymbols[s] || '❓'}</span>)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-bold">{unitsMap[shift.unitId]?.name || shift.unitId}</div>
                                                                        {shift.workloadRating && <div className={`absolute top-1 right-1 h-2 w-2 rounded-full ${workloadColor(shift.workloadRating)}`}></div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </tbody>
                        </table>
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default StaffList;
