import React, { useState, useMemo } from 'react';
import {
    doc,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import {
   ChevronRight, CheckCircle2, Activity, Ticket, X, Flame, Smile, Wind, Footprints, CalendarDays, Edit, ChevronLeft
} from 'lucide-react';

const HomeView = ({ db, appId, user, attendanceDays, passes, gearInfo, quests, attendanceHistory, questHistory, uniqueGyms, passUsageHistory }) => {
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();

    const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const isToday = (d) => {
        return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    };

    const hasAttended = (d) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return !!attendanceHistory[dateStr];
    };

    const monthlyAttendanceCount = useMemo(() => {
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return Object.keys(attendanceHistory).filter(dateKey => dateKey.startsWith(monthPrefix)).length;
    }, [attendanceHistory, year, month]);

    const totalVisits = Object.keys(attendanceHistory).length;

    const currentUses = gearInfo.uses !== undefined ? gearInfo.uses : (gearInfo.shoeUses || 0);
    const maxUses = gearInfo.max || 100;
    const shoeName = gearInfo.name || '기본 암벽화';
    const lifespanPercent = Math.max(0, 100 - Math.round((currentUses / maxUses) * 100));

    const [showCheckInOptions, setShowCheckInOptions] = useState(false);
    const [customAttGym, setCustomAttGym] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    const [showShoeForm, setShowShoeForm] = useState(false);
    const [shoeNameInput, setShoeNameInput] = useState('');
    const [shoeMaxInput, setShoeMaxInput] = useState(100);

    const urgentPasses = useMemo(() => {
        return [...passes].sort((a, b) => a.dDay - b.dDay);
    }, [passes]);

    const handleAttendance = async (passId, gymName = null) => {
        if (!user || !attendanceDate) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const selectedDay = new Date(attendanceDate).getDate();
        const newDays = Array.from(new Set([...attendanceDays, selectedDay]));

        await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });
        await setDoc(doc(db, ...userPath, 'data', 'gear'), { ...gearInfo, uses: currentUses + 1 }, { merge: true });

        const finalGymName = (gymName && gymName.trim() !== '') ? gymName.trim() : '기본 출석';
        const dateKey = attendanceDate;

        const existingHistory = attendanceHistory[dateKey];
        const newHistoryEntry = existingHistory ? `${existingHistory}, ${finalGymName}` : finalGymName;
        await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), { [dateKey]: newHistoryEntry }, { merge: true });

        if (passId) {
            const pass = passes.find(p => p.id === passId);
            if (pass && pass.type === 'punch' && pass.remaining > 0) {
                await updateDoc(doc(db, ...userPath, 'passes', passId), { remaining: pass.remaining - 1 });

                const existingUsage = passUsageHistory[dateKey] || [];
                await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), {
                    [dateKey]: [...existingUsage, passId]
                }, { merge: true });
            }
        }
        setShowCheckInOptions(false);
        setCustomAttGym('');
        setAttendanceDate(new Date().toISOString().split('T')[0]);
    };

    const handleQuestClick = async (qId) => {
        if (!user) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const quest = quests.find(q => q.id === qId);
        if (!quest) return;

        const newCurrent = Math.min(quest.goal, quest.current + 1);
        const newQuests = quests.map(q => q.id === qId ? { ...q, current: newCurrent } : q);
        await setDoc(doc(db, ...userPath, 'data', 'quests'), { list: newQuests }, { merge: true });

        if (quest.current < quest.goal && newCurrent === quest.goal) {
            const now = new Date();
            const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const existingHistory = questHistory[dateKey];
            const newHistoryEntry = existingHistory ? `${existingHistory}, ${quest.title}` : quest.title;

            await setDoc(doc(db, ...userPath, 'data', 'questHistory'), { [dateKey]: newHistoryEntry }, { merge: true });
        }
    };

    const handleRegisterShoe = async (e) => {
        e.preventDefault();
        if (!user || !shoeNameInput) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        await setDoc(doc(db, ...userPath, 'data', 'gear'), {
            name: shoeNameInput,
            uses: 0,
            max: Number(shoeMaxInput)
        }, { merge: true });

        setShowShoeForm(false);
        setShoeNameInput('');
        setShoeMaxInput(100);
    };

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isAttendedTodayForButton = !!attendanceHistory[todayDateStr];

    return (
        <div className="space-y-5 animate-in fade-in duration-700">
            <section className="p-5 rounded-lg  border border-border bg-white">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1 text-text hover:text-primary transition-colors"><ChevronLeft className="w-4.5 h-4.5" /></button>
                        <h3 className="text-text text-sm font-semibold w-6 text-center">{month + 1}월</h3>
                        <button onClick={nextMonth} className="p-1 text-text hover:text-primary transition-colors"><ChevronRight className="w-4.5 h-4.5" /></button>
                    </div>

                    <div className="flex gap-2.5 items-center">
                        <span className="px-2.5 py-2 text-xs rounded-sm border border-border">{month + 1}월 {monthlyAttendanceCount}회</span>
                        <span className="px-2.5 py-2 text-xs rounded-sm bg-primary text-white">총 {totalVisits}회</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-6 font-bold text-text-800">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="mb-2">{d}</div>)}

                    {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`blank-${i}`} />)}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const attended = hasAttended(day);
                        const isTodayFlag = isToday(day);
                        return (
                            <div key={day} className={`aspect-square flex items-center justify-center rounded-full text-xs transition-all hover:scale-110 ${attended ? 'bg-primary text-white font-semibold' : isTodayFlag ? 'border-2 border-primary text-primary font-semibold' : 'text-text-800 font-medium hover:bg-gray-100'}`}>
                                {day}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4">
                    {!showCheckInOptions ? (
                        <button onClick={() => setShowCheckInOptions(true)} className="w-full h-[38px] py-2.5 bg-secondary rounded-sm  text-xs text-white flex items-center justify-center gap-2">
                            {isAttendedTodayForButton ? '한 번 더 출석하기' : '출석 체크하기'}
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 bg-gray-50 rounded-sm p-2.5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-text">출석 날짜 및 방법 선택</span>
                                <button onClick={() => { setShowCheckInOptions(false); setAttendanceDate(new Date().toISOString().split('T')[0]); }} className="text-text"><X className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex items-center justify-center min-w-0 px-3.5 h-[38px] rounded-sm border border-border bg-white">
                                {/*<label className="text-xs text-text shrink-0 mr-4">출석 날짜</label>*/}
                                <input
                                    type="date"
                                    className="flex-1 w-full min-w-0 appearance-none bg-transparent outline-none text-xs text-text text-left "
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                />
                            </div>

                            {passes.filter(p => p.remaining > 0 || p.type === 'period').length > 0 && (
                                <div className="space-y-2">
                                    {passes.filter(p => p.remaining > 0 || p.type === 'period').map(p => (
                                        <button key={p.id} onClick={() => handleAttendance(p.id, p.gym)} className="w-full px-2.5 h-[38px] bg-white border border-text-secondary text-secondary text-xs rounded-sm hover:bg-amber-50 transition-all flex justify-between items-center">
                                            <span className="text-xs font-medium">{p.gym} <span className="text-xs">({p.name})</span></span>
                                            <span className="text-xs bg-secondary text-white px-2 py-1 rounded-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 사용</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white p-2.5 rounded-sm border border-border mt-3">
                                <p className="text-xs  text-text mb-2">직접 입력</p>
                                <div className="space-y-2">
                                    <input
                                        placeholder="지점명"
                                        className="w-full min-w-0 bg-gray-50 px-2.5 h-[38px] rounded-sm border border-border outline-none focus:ring-1 focus:ring-secondary text-xs font-semibold text-text"
                                        value={customAttGym}
                                        onChange={e => setCustomAttGym(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleAttendance(null, customAttGym)}
                                        className="w-full px-2.5 h-[38px] bg-secondary text-white rounded-sm text-xs hover:bg-primary-800 transition-colors"
                                    >
                                        출석하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white p-5 rounded-lg border border-border">
                <h3 className="font-bold text-text text-xs flex items-center gap-2 uppercase tracking-widest mb-4">
                    <Flame className="w-5 h-5 text-secondary" /> Daily Micro-Quests
                </h3>

                <div className="grid grid-cols-3 gap-3">
                    {quests && quests.length > 0 ? quests.map(q => (
                        <button
                            key={q.id}
                            onClick={() => handleQuestClick(q.id)}
                            className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${q.current === q.goal ? `${q.color} text-white shadow-lg border-transparent` : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
                        >
                            {q.current === q.goal ? <CheckCircle2 className="w-6 h-6 mb-1" /> : getQuestIcon(q.icon)}
                            <p className="text-[10px] font-bold mt-2 text-center px-1 leading-tight">{q.title}</p>
                            <div className="mt-1.5 flex gap-1">
                                {Array.from({ length: q.goal }).map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < q.current ? (q.current === q.goal ? 'bg-white' : 'bg-blue-500') : 'bg-gray-200'}`} />
                                ))}
                            </div>
                        </button>
                    )) : (
                        <p className="col-span-3 text-center text-xs text-gray-400 py-4">퀘스트 데이터를 불러오는 중입니다.</p>
                    )}
                </div>
            </section>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                {urgentPasses.map(p => (
                    <div key={p.id} className={`min-w-[270px] p-5 rounded-3xl border transition-all relative overflow-hidden ${p.type === 'period' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <Ticket className={`absolute -right-4 -bottom-4 w-24 h-24 ${p.type === 'period' ? 'opacity-10 text-white' : 'opacity-5 text-gray-900'}`} />
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${p.type === 'period' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{p.name}</span>
                            <div className={`text-xs font-black ${p.dDay < 7 ? 'text-rose-500 animate-pulse' : (p.type === 'period' ? 'text-blue-100' : 'text-blue-600')}`}>D-{p.dDay}</div>
                        </div>
                        <h4 className="font-bold text-lg uppercase mb-2 tracking-tight">{p.gym}</h4>
                        <p className={`text-[10px] font-semibold tracking-wide flex items-center gap-1 ${p.type === 'period' ? 'text-blue-200' : 'text-gray-400'}`}>
                            <CalendarDays className="w-3 h-3" /> {p.end} 까지
                        </p>

                        {p.type === 'punch' && (
                            <div className="mt-5 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className={`${p.type === 'period' ? 'text-white' : 'text-gray-400'} uppercase tracking-widest`}>Remaining</span>
                                    <span className={`${p.type === 'period' ? 'text-white' : 'text-orange-600'}`}>{p.remaining} / {p.total}</span>
                                </div>
                                <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="bg-orange-400 h-full transition-all duration-500 ease-out" style={{ width: `${(p.remaining/p.total)*100}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {passes.length === 0 && (
                    <div className="min-w-full p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center shadow-inner">
                        <Ticket className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-xs text-text uppercase tracking-widest">등록된 이용권이 없습니다</p>
                    </div>
                )}
            </div>

            <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                {!showShoeForm ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${lifespanPercent < 30 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                {lifespanPercent}%
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1">
                                    {shoeName}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                                    수명: {currentUses} / {maxUses} Climbs
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowShoeForm(true)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-gray-100">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegisterShoe} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2"><Footprints className="w-4 h-4 text-blue-600"/> 새 암벽화 등록</h4>
                            <button type="button" onClick={() => setShowShoeForm(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                        </div>
                        <input
                            placeholder="암벽화 이름 (예: VSR, 드론)"
                            className="w-full min-w-0 bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                            value={shoeNameInput}
                            onChange={e => setShoeNameInput(e.target.value)}
                            required
                        />
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-0">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0">예상 수명(출석 횟수)</label>
                            <input
                                type="number"
                                className="bg-white min-w-0 p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold w-20 text-center shadow-sm"
                                value={shoeMaxInput}
                                onChange={e => setShoeMaxInput(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-md hover:bg-gray-800 transition-colors">
                            등록하고 사용 횟수 0으로 초기화
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
};

export default HomeView;