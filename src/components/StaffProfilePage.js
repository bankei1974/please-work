
import React from 'react';
import StaffProfile from './StaffProfile';

const StaffProfilePage = ({ db, staffId }) => {
    return (
        <div className="p-6">
            <StaffProfile db={db} staffId={staffId} />
        </div>
    );
};

export default StaffProfilePage;
