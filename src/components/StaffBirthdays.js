import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase';
import { where } from 'firebase/firestore';

const StaffBirthdays = ({ selectedUnits }) => {
    const query = selectedUnits.length > 0 ? [where('predominantUnitId', 'in', selectedUnits)] : [];
    const { data: staff } = useCollection(db, 'users', query);

    const currentMonth = new Date().getMonth();
    const birthdays = staff.filter(member => {
        if (!member.birthdate) return false;
        const birthdate = new Date(member.birthdate);
        return birthdate.getMonth() === currentMonth;
    });

    return (
        <ul className="space-y-1 text-sm mt-2">
            {birthdays.map(member => (
                <li key={member.id} className="flex justify-between items-center bg-gray-700/50 p-1 rounded-md">
                    <span>{member.fullName}</span>
                    <span>{new Date(member.birthdate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                </li>
            ))}
        </ul>
    );
};

export default StaffBirthdays;
