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
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4">This Month's Birthdays</h3>
            <ul className="space-y-2">
                {birthdays.map(member => (
                    <li key={member.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                        <span>{member.fullName}</span>
                        <span>{new Date(member.birthdate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StaffBirthdays;
