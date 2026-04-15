import React, { useState } from 'react';
import {doc, setDoc, updateDoc} from 'firebase/firestore';
import { History as HistoryIcon, Edit, Trash2 } from "lucide-react";

const HistoryView = ({ db, appId, user, attendanceHistory, attendanceDays, gearInfo, passes, passUsageHistory }) => {
    const [editingDateKey, setEditingDateKey] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editGymName, setEditGymName] = useState('');
    const [saving, setSaving] = useState(false);

    const sortedDates = Object.keys(attendanceHistory).sort((a, b) => {
        if (a.includes('-') && b.includes('-')) return b.localeCompare(a);
        return String(b).localeCompare(String(a));
    });

    const handleEditClick = (dateKey, gymName) => {
        setEditingDateKey(dateKey);
        if (dateKey.includes('-')) {
            setEditDate(dateKey);
        } else {
            const now = new Date();
            setEditDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${dateKey.padStart(2, '0')}`);
        }
        setEditGymName(gymName);
    };

    const handleEditSave = async (oldDateKey) => {
        if (!user || !editDate || !editGymName) return;
        setSaving(true);
        try {
            const newHistory = { ...attendanceHistory };
            delete newHistory[oldDateKey];

            if (newHistory[editDate]) {
                newHistory[editDate] += `, ${editGymName}`;
            } else {
                newHistory[editDate] = editGymName;
            }

            const userPath = ['artifacts', appId, 'users', user.uid];
            await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), newHistory);

            if (oldDateKey !== editDate) {
                const oldD = new Date(oldDateKey.includes('-') ? oldDateKey : new Date().setDate(oldDateKey));
                const newD = new Date(editDate);
                const today = new Date();
                let newDays = [...attendanceDays];

                if (oldD.getMonth() === today.getMonth() && oldD.getFullYear() === today.getFullYear()) {
                    newDays = newDays.filter(d => d !== oldD.getDate());
                }
                if (newD.getMonth() === today.getMonth() && newD.getFullYear() === today.getFullYear()) {
                    if (!newDays.includes(newD.getDate())) newDays.push(newD.getDate());
                }
                await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });

                if (passUsageHistory[oldDateKey]) {
                    const newPassUsage = { ...passUsageHistory };
                    const movedPasses = newPassUsage[oldDateKey];
                    delete newPassUsage[oldDateKey];

                    newPassUsage[editDate] = [...(newPassUsage[editDate] || []), ...movedPasses];
                    await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), newPassUsage);
                }
            }
            setEditingDateKey(null);
        } catch(e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (dateKey) => {
        if (!window.confirm(`${dateKey} 출석 기록을 완전히 삭제하시겠습니까? (사용했던 티켓 횟수와 신발 수명이 복구됩니다)`)) return;
        try {
            const userPath = ['artifacts', appId, 'users', user.uid];

            const usedPasses = passUsageHistory[dateKey];
            if (usedPasses && usedPasses.length > 0) {
                for (const pId of usedPasses) {
                    const passToRestore = passes.find(p => p.id === pId);
                    if (passToRestore && passToRestore.type === 'punch') {
                        const restoredRemaining = Math.min(passToRestore.total, passToRestore.remaining + 1);
                        await updateDoc(doc(db, ...userPath, 'passes', pId), { remaining: restoredRemaining });
                    }
                }
                const newPassUsage = { ...passUsageHistory };
                delete newPassUsage[dateKey];
                await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), newPassUsage);
            }

            const newHistory = { ...attendanceHistory };
            const gymsCount = newHistory[dateKey].split(',').length;
            delete newHistory[dateKey];
            await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), newHistory);

            const currentUses = gearInfo.uses !== undefined ? gearInfo.uses : (gearInfo.shoeUses || 0);
            await setDoc(doc(db, ...userPath, 'data', 'gear'), { ...gearInfo, uses: Math.max(0, currentUses - gymsCount) }, { merge: true });

            const deletedD = new Date(dateKey.includes('-') ? dateKey : new Date().setDate(Number(dateKey)));
            const today = new Date();
            if (deletedD.getMonth() === today.getMonth() && deletedD.getFullYear() === today.getFullYear()) {
                const newDays = attendanceDays.filter(d => d !== deletedD.getDate());
                await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });
            }
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-5 animate-in fade-in pb-10">
            <section className="bg-white p-6 rounded-3xl border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase mb-6">
                    <HistoryIcon className="w-5 h-5 text-blue-600" /> Attendance History
                </h3>

                <div className="space-y-3">
                    {sortedDates.length > 0 ? (
                        sortedDates.map(dateKey => {
                            let displayDate = "";
                            if (dateKey.includes('-')) {
                                const [year, month, day] = dateKey.split('-');
                                displayDate = `${parseInt(month)}월 ${parseInt(day)}일`;
                            } else {
                                displayDate = `이번 달 ${dateKey}일`;
                            }

                            const gymName = attendanceHistory[dateKey];
                            const isEditing = editingDateKey === dateKey;

                            return (
                                <div key={dateKey} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all min-w-0">
                                    {isEditing ? (
                                        <div className="space-y-3 animate-in fade-in min-w-0">
                                            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase">기록 수정하기</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 min-w-0">
                                                    <label className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-2">날짜</label>
                                                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" />
                                                </div>
                                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 min-w-0">
                                                    <label className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-2">암장명</label>
                                                    <input type="text" value={editGymName} onChange={e => setEditGymName(e.target.value)} placeholder="암장명 입력" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end mt-3">
                                                <button onClick={() => setEditingDateKey(null)} className="px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold transition-colors w-1/3">취소</button>
                                                <button onClick={() => handleEditSave(dateKey)} disabled={saving} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors w-2/3">{saving ? '저장중...' : '수정 완료'}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center min-w-0">
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 whitespace-nowrap shrink-0">
                            {displayDate}
                          </span>
                                                <span className="text-sm font-bold text-gray-800 truncate">{gymName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => handleEditClick(dateKey, gymName)} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(dateKey)} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase">출석 기록이 없습니다</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HistoryView;