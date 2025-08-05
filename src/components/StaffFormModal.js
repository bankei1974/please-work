import React, { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import Modal from './Modal';
import RotationTemplatesModal from './RotationTemplatesModal';
import { RefreshCw } from 'lucide-react';

const StaffFormModal = ({ isOpen, onClose, db, collectionPath, staffMember, units, jobTitles, statuses }) => {
    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    useEffect(() => {
        setFormData(staffMember || { fullName: '', email: '', jobTitle: '', predominantUnit: '', standardStartTime: '', standardEndTime: '', contactInfo: '', hireDate: '', role: 'Staff', profilePictureUrl: '' });
        setImageFile(null);
        setImagePreview(staffMember?.profilePictureUrl || null);
    }, [staffMember, isOpen]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleChangeImage = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!collectionPath) return;

        const unitId = units.find(u => u.name === formData.predominantUnit)?.id || null;
        let dataToSave = { ...formData, predominantUnitId: unitId };

        try {
            if (staffMember) { // Editing existing staff
                let profilePictureUrl = formData.profilePictureUrl;
                if (imageFile) {
                    const storage = getStorage();
                    const storageRef = ref(storage, `profilePictures/${staffMember.id}/${imageFile.name}`);
                    const snapshot = await uploadBytes(storageRef, imageFile);
                    profilePictureUrl = await getDownloadURL(snapshot.ref);
                }
                dataToSave = { ...dataToSave, profilePictureUrl };
                await updateDoc(doc(db, collectionPath, staffMember.id), dataToSave);

            } else { // Adding new staff
                const auth = getAuth();
                let userCredential;
                try {
                    // Create user in Firebase Authentication
                    userCredential = await createUserWithEmailAndPassword(auth, formData.email, "TempPassword123!"); // Consider a more robust password generation/reset flow
                } catch (authError) {
                    console.error("Error creating user in Firebase Auth:", authError);
                    alert(`Failed to create user: ${authError.message}`);
                    return;
                }

                const uid = userCredential.user.uid;

                // Use the UID as the document ID for the Firestore user profile
                await setDoc(doc(db, collectionPath, uid), {
                    ...dataToSave,
                    authUid: uid,
                    createdAt: serverTimestamp(),
                    profilePictureUrl: '' // Initially empty
                });

                let profilePictureUrl = '';
                if (imageFile) {
                    const storage = getStorage();
                    const storageRef = ref(storage, `profilePictures/${uid}/${imageFile.name}`);
                    const snapshot = await uploadBytes(storageRef, imageFile);
                    profilePictureUrl = await getDownloadURL(snapshot.ref);
                    await updateDoc(doc(db, collectionPath, uid), { profilePictureUrl });
                }
            }
            onClose();
        } catch (error) {
            console.error("Error saving staff data:", error);
            alert("Failed to save staff data. Please try again.");
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={staffMember ? 'Edit Staff Profile' : 'Add New Staff'}>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <div className="mb-2">
                            <label className="label-style">Profile Picture</label>
                            <input type="file" accept="image/*" onChange={handleChangeImage} className="input-style" />
                            {imagePreview && (
                                <div className="mt-1">
                                    <img src={imagePreview} alt="Profile Preview" className="w-16 h-16 object-cover rounded-full" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2"><label className="label-style">Full Name</label><input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} required className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Email Address</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Job Title</label><select name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} required className="input-style"><option value="" disabled>Select...</option>{jobTitles.map(jt => <option key={jt.id} value={jt.name}>{jt.name}</option>)}</select></div>
                        <div className="mb-2"><label className="label-style">Predominant Unit</label><select name="predominantUnit" value={formData.predominantUnit || ''} onChange={handleChange} required className="input-style"><option value="" disabled>Select...</option>{units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
                        <div className="mb-2"><label className="label-style">Standard Start Time</label><input type="time" name="standardStartTime" value={formData.standardStartTime || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Standard End Time</label><input type="time" name="standardEndTime" value={formData.standardEndTime || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Hire Date</label><input type="date" name="hireDate" value={formData.hireDate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Birthdate</label><input type="date" name="birthdate" value={formData.birthdate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Employee ID</label><input type="text" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">COA Hire Date</label><input type="date" name="coaHireDate" value={formData.coaHireDate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">BLS Expiration Date</label><input type="date" name="blsExpirationDate" value={formData.blsExpirationDate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">PALS Expiration Date</label><input type="date" name="palsExpirationDate" value={formData.palsExpirationDate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">License Type</label><input type="text" name="licenseType" value={formData.licenseType || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">License Expiration Date</label><input type="date" name="licenseExpirationDate" value={formData.licenseExpirationDate || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="md:col-span-2 mb-2"><label className="label-style">Contact Info (Optional)</label><input type="text" name="contactInfo" value={formData.contactInfo || ''} onChange={handleChange} className="input-style" /></div>
                        <div className="mb-2"><label className="label-style">Role</label><select name="role" value={formData.role || 'Staff'} onChange={handleChange} required className="input-style"><option value="Staff">Staff</option><option value="Manager">Manager</option></select></div>
                        <div className="mb-2"><label className="label-style">Staff Karma</label><input type="number" name="staffKarma" value={formData.staffKarma || 0} onChange={handleChange} className="input-style" /></div>
                    </div>
                    {staffMember && <div className="mt-2 pt-2 border-t border-gray-700"><h4 className="text-lg font-semibold mb-1">Rotation Templates</h4><button type="button" onClick={() => setIsTemplateModalOpen(true)} className="btn-secondary flex items-center gap-2"><RefreshCw size={18}/> Manage Templates</button></div>}
                    <div className="flex justify-end gap-4 pt-1"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{staffMember ? 'Save Changes' : 'Add Staff'}</button></div>
                </form>
            </Modal>
            {staffMember && <RotationTemplatesModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} db={db} staffMember={staffMember} units={units} statuses={statuses} />}
        </>
    );
};

export default StaffFormModal;