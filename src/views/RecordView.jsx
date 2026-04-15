import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ChevronDown, Edit, PenSquare, Plus, Target, Trash2, TrendingUp, Trophy } from "lucide-react";

const RecordView = ({ db, appId, user, sessions, uniqueGyms }) => {
    console.log('sessions:', sessions);

    // 새 기록 추가 폼 상태
    const [showAddForm, setShowAddForm] = useState(false);
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedGym, setSelectedGym] = useState(uniqueGyms[0] || '');
    const [customGym, setCustomGym] = useState('');
    const [newLevel, setNewLevel] = useState('');
    const [newSummary, setNewSummary] = useState('');
    const [newNextGoal, setNewNextGoal] = useState('');
    const [saving, setSaving] = useState(false);

    // 수정 폼 상태
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editRecordDate, setEditRecordDate] = useState('');
    const [editGymName, setEditGymName] = useState('');
    const [editTopLevel, setEditTopLevel] = useState('');
    const [editSummary, setEditSummary] = useState('');
    const [editNextGoal, setEditNextGoal] = useState('');

    // --- [암장별 레벨 데이터 & 색상 맵핑 (업데이트 됨!)] ---
    const GYM_LEVELS = {
        "더클라임": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        "서울숲": ["빨강", "주황", "노랑", "초록", "파랑", "남색", "보라", "갈색", "검정", "핑크"],
        "피커스": ["빨강", "주황", "노랑", "초록", "파랑", "남색", "보라", "회색", "검정"],
        "클라이밍파크": ["노랑", "핑크", "파랑", "빨강", "보라", "갈색", "회색", "검정", "흰색"],
        "손상원": ["흰색", "노랑", "초록", "파랑", "빨강", "검정", "회색", "갈색", "핑크", "보라"],
        "기타": ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7"]
    };

    const getLevelsForGym = (gymName) => {
        if (!gymName) return GYM_LEVELS["기타"];
        if (gymName.includes("더클라임")) return GYM_LEVELS["더클라임"];
        if (gymName.includes("서울숲")) return GYM_LEVELS["서울숲"];
        if (gymName.includes("피커스")) return GYM_LEVELS["피커스"];
        if (gymName.includes("클라이밍파크") || gymName.includes("클파")) return GYM_LEVELS["클라이밍파크"];
        if (gymName.includes("손상원")) return GYM_LEVELS["손상원"];
        return GYM_LEVELS["기타"];
    };

    const LEVEL_COLORS = {
        // 기본 색상들
        "하양": "bg-gray-100 text-gray-800 border-gray-200",
        "흰색": "bg-gray-100 text-gray-800 border-gray-200",
        "빨강": "bg-red-500 text-white border-red-600",
        "주황": "bg-orange-400 text-white border-orange-500",
        "노랑": "bg-yellow-300 text-yellow-900 border-yellow-400",
        "초록": "bg-green-500 text-white border-green-600",
        "파랑": "bg-blue-500 text-white border-blue-600",
        "남색": "bg-indigo-700 text-white border-indigo-800", // 새로 추가됨
        "보라": "bg-purple-600 text-white border-purple-700",
        "핑크": "bg-pink-400 text-white border-pink-500", // 새로 추가됨
        "회색": "bg-gray-500 text-white border-gray-600",
        "갈색": "bg-amber-800 text-white border-amber-900",
        "검정": "bg-gray-900 text-white border-gray-900",

        // 더클라임 전용 숫자 색상 (점점 진해지는 회색/검정 그라데이션)
        "1": "bg-slate-100 text-slate-800 border-slate-200",
        "2": "bg-slate-200 text-slate-800 border-slate-300",
        "3": "bg-slate-300 text-slate-800 border-slate-400",
        "4": "bg-slate-400 text-white border-slate-500",
        "5": "bg-slate-500 text-white border-slate-600",
        "6": "bg-slate-600 text-white border-slate-700",
        "7": "bg-slate-700 text-white border-slate-800",
        "8": "bg-slate-800 text-white border-slate-900",
        "9": "bg-gray-800 text-white border-gray-900",
        "10": "bg-gray-900 text-white border-black",
        "11": "bg-black text-white border-gray-800"
    };

    const sessionBrands = useMemo(() => {
        const brands = sessions.map(s => s.gymName.split(' ')[0]);
        return Array.from(new Set(brands));
    }, [sessions]);

    const [chartBrandFilter, setChartBrandFilter] = useState('더클라임');

    useEffect(() => {
        if (sessionBrands.length > 0 && !sessionBrands.includes(chartBrandFilter)) {
            setChartBrandFilter(sessionBrands[0]);
        }
    }, [sessionBrands]);

    // 기록 시 사용할 암장 레벨 옵션 계산
    const finalGymName = selectedGym === 'manual' ? customGym.trim() : selectedGym;
    const currentGymLevels = getLevelsForGym(finalGymName);
    const editGymLevels = getLevelsForGym(editGymName);

    const highestRecords = useMemo(() => {
        const records = {};
        sessions.forEach(s => {
            const brand = s.gymName.split(' ')[0];
            const levels = getLevelsForGym(s.gymName);
            const idx = levels.indexOf(s.topLevel);

            if (!records[brand] || records[brand].idx < idx) {
                records[brand] = { level: s.topLevel, idx, date: s.date, fullGymName: s.gymName };
            }
        });
        return Object.entries(records).sort((a, b) => b[1].idx - a[1].idx);
    }, [sessions]);

    const chartData = useMemo(() => {
        const filteredSessions = [...sessions]
            .filter(s => s.gymName.startsWith(chartBrandFilter))
            .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
            .slice(-7);

        if (filteredSessions.length === 0) return null;

        const levels = getLevelsForGym(chartBrandFilter);
        const height = 150;
        const yStep = height / Math.max(1, levels.length - 1);
        const xStep = filteredSessions.length > 1 ? 260 / (filteredSessions.length - 1) : 0;

        return {
            levels,
            yStep,
            points: filteredSessions.map((s, i) => {
                const idx = levels.indexOf(s.topLevel);
                const safeIdx = idx !== -1 ? idx : 0;
                return {
                    x: filteredSessions.length === 1 ? 170 : 50 + (i * xStep),
                    y: height - (safeIdx * yStep),
                    val: s.topLevel,
                    date: s.date.replace(/[^0-9]/g, '').slice(-4).replace(/(\d{2})(\d{2})/, '$1/$2')
                };
            })
        };
    }, [sessions, chartBrandFilter]);

    // 기록 추가하기
    const handleSave = async (e) => {
        e.preventDefault();
        if (!user || !newLevel || !finalGymName || !recordDate) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions'), {
                gymName: finalGymName,
                topLevel: newLevel,
                summary: newSummary,
                nextGoal: newNextGoal,
                date: recordDate,
                createdAt: serverTimestamp()
            });
            setShowAddForm(false);
            setNewSummary('');
            setNewNextGoal('');
            setCustomGym('');
            setNewLevel('');
            setRecordDate(new Date().toISOString().split('T')[0]); // 등록 후 오늘 날짜로 초기화
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    // 수정 버튼 클릭
    const handleEditClick = (session) => {
        setEditingSessionId(session.id);
        setEditRecordDate(session.date);
        setEditGymName(session.gymName);
        setEditTopLevel(session.topLevel);
        setEditSummary(session.summary || '');
        setEditNextGoal(session.nextGoal || '');
    };

    // 수정 저장하기
    const handleEditSave = async (id) => {
        if (!user || !editRecordDate || !editGymName || !editTopLevel) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', id), {
                gymName: editGymName,
                topLevel: editTopLevel,
                summary: editSummary,
                nextGoal: editNextGoal,
                date: editRecordDate
            });
            setEditingSessionId(null);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    // 기록 삭제하기
    const handleDelete = async (id) => {
        if (!window.confirm('이 하이라이트 기록을 완전히 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sessions', id));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">

            <section className="bg-white p-5 rounded-lg border border-border">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase mb-4">
                    <Trophy className="w-5 h-5 text-amber-500" /> Best Records per Gym
                </h3>
                {highestRecords.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {highestRecords.map(([brand, data]) => (
                            <div key={brand} className={`p-3 rounded-2xl border flex flex-col justify-center items-center ${LEVEL_COLORS[data.level] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                <span className="text-xs opacity-80 font-bold mb-1">{brand}</span>
                                <span className="text-lg font-black">{data.level}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-6 text-gray-400 text-xs font-medium bg-gray-50 rounded-2xl">기록된 데이터가 없습니다.</p>
                )}
            </section>

            <section className="bg-white p-5 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Growth Chart
                    </h3>
                    {sessionBrands.length > 0 && (
                        <select
                            value={chartBrandFilter}
                            onChange={(e) => setChartBrandFilter(e.target.value)}
                            className="text-xs font-bold text-blue-700 bg-blue-50 border-none outline-none rounded-lg px-2 py-1 cursor-pointer min-w-0"
                        >
                            {sessionBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    )}
                </div>

                <div className="w-full bg-gray-50 rounded-2xl p-4 overflow-x-auto scrollbar-hide border border-border/50">
                    {chartData ? (
                        <svg width="320" height="190" className="mx-auto overflow-visible">
                            {chartData.levels.map((lv, i) => {
                                const yPos = 150 - i * chartData.yStep;
                                return (
                                    <g key={lv}>
                                        <text x="40" y={yPos + 3} textAnchor="end" className="text-[8px] fill-gray-500 font-bold">{lv}</text>
                                        <line x1="45" y1={yPos} x2="310" y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                                    </g>
                                );
                            })}

                            {chartData.points.length > 1 && (
                                <path d={`M ${chartData.points[0].x} ${chartData.points[0].y} ${chartData.points.map(p => `L ${p.x} ${p.y}`).join(' ')}`} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {chartData.points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="4" fill="#2563EB" stroke="white" strokeWidth="1.5" />
                                    <text x={p.x} y={165} textAnchor="middle" className="text-[8px] fill-gray-400 font-bold">{p.date}</text>
                                </g>
                            ))}
                        </svg>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-xs font-medium">[{chartBrandFilter}]의 기록이 없거나 부족합니다.</p>
                            <p className="text-gray-300 text-xs mt-1">성장 흐름을 보려면 최소 1회 이상의 기록이 필요해요.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 새 하이라이트 추가 폼 */}
            <section className="bg-white p-5 rounded-lg border-2 border-dashed border-blue-200 transition-all hover:bg-blue-50/50">
                <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between font-bold text-blue-600 uppercase text-sm">
                    <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> 새 하이라이트 추가하기</span>
                    <ChevronDown className={`transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`} />
                </button>
                {showAddForm && (
                    <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in slide-in-from-top-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 min-w-0">
                                <label className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-2">운동 날짜</label>
                                <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
                            </div>

                            <select value={selectedGym} onChange={e => setSelectedGym(e.target.value)} className="w-full min-w-0 bg-white h-[38px] px-2.5 rounded-sm border border-border outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-gray-700">
                                {uniqueGyms.map(g => <option key={g} value={g}>{g}</option>)}
                                <option value="manual">직접 입력 (+)</option>
                            </select>
                            {selectedGym === 'manual' && (
                                <input placeholder="새로운 방문 지점명 입력 (예: 손상원 강남)" className="w-full min-w-0 bg-white h-[38px] px-2.5 rounded-sm border border-border outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-gray-700" value={customGym} onChange={e => setCustomGym(e.target.value)} required />
                            )}
                            <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-full min-w-0 bg-white h-[38px] px-2.5 rounded-sm border border-border outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-gray-700" required>
                                <option value="">성공한 문제의 레벨을 선택하세요</option>
                                {currentGymLevels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                            </select>
                        </div>
                        <textarea placeholder="오늘의 하이라이트 무브나 피드백을 자유롭게 기록하세요! (하루에 여러 개 작성 가능)" className="w-full min-w-0 bg-white p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium h-24 placeholder:text-gray-400 leading-relaxed" value={newSummary} onChange={e => setNewSummary(e.target.value)} />
                        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-orange-100 min-w-0">
                            <Target className="w-5 h-5 text-orange-500 shrink-0" />
                            <input type="text" placeholder="다음 숙제 (예: 오버행 파랑색 코디 문제)" className="appearance-none bg-transparent outline-none text-sm font-semibold text-gray-800 w-full flex-1 min-w-0 placeholder:text-gray-300" value={newNextGoal} onChange={e => setNewNextGoal(e.target.value)} />
                        </div>
                        <button disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {saving ? '저장 중...' : '기록 저장하기 🧗'}
                        </button>
                    </form>
                )}
            </section>

            {/* 4. 기록 히스토리 리스트 (최신순) */}
            <div className="space-y-4">
                <h3 className="text-xs text-gray-400 uppercase font-bold px-2 pt-2">My Highlights</h3>
                {sessions.map(s => {
                    const isEditing = editingSessionId === s.id;

                    return isEditing ? (
                        // 수정 모드 UI
                        <div key={s.id} className="bg-blue-50/30 p-5 rounded-lg border border-blue-200 space-y-3 animate-in fade-in">
                            <div className="flex justify-between items-center border-b border-blue-100 pb-2 mb-2">
                                <span className="text-xs font-bold text-blue-600 uppercase">기록 수정하기</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 min-w-0">
                                    <label className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-2">날짜</label>
                                    <input type="date" value={editRecordDate} onChange={e => setEditRecordDate(e.target.value)} className="appearance-none bg-transparent outline-none text-xs font-bold text-gray-700 text-right w-full flex-1 min-w-0" />
                                </div>
                                <input type="text" value={editGymName} onChange={e => setEditGymName(e.target.value)} placeholder="암장명 입력" className="w-full min-w-0 bg-white p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700" />
                                <select value={editTopLevel} onChange={e => setEditTopLevel(e.target.value)} className="w-full min-w-0 bg-white p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700">
                                    {editGymLevels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                                </select>
                                <textarea placeholder="피드백 입력" className="w-full min-w-0 bg-white p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium h-20 leading-relaxed" value={editSummary} onChange={e => setEditSummary(e.target.value)} />
                                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-orange-100 min-w-0">
                                    <Target className="w-4 h-4 text-orange-500 shrink-0" />
                                    <input type="text" placeholder="다음 숙제" className="appearance-none bg-transparent outline-none text-xs font-semibold text-gray-800 w-full flex-1 min-w-0" value={editNextGoal} onChange={e => setEditNextGoal(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-3">
                                <button onClick={() => setEditingSessionId(null)} className="px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold transition-colors w-1/3">취소</button>
                                <button onClick={() => handleEditSave(s.id)} disabled={saving} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors w-2/3">{saving ? '저장중...' : '수정 완료'}</button>
                            </div>
                        </div>
                    ) : (
                        // 일반 보기 모드 UI
                        <div key={s.id} className="bg-white p-5 rounded-lg border border-border space-y-3 relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{s.date}</span>
                                    <h4 className="font-bold text-gray-800 text-sm uppercase mt-0.5">{s.gymName}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${LEVEL_COLORS[s.topLevel] || 'bg-gray-100 text-gray-800'}`}>
                              {s.topLevel}
                            </span>
                                    {/* 우측 상단 수정/삭제 버튼 */}
                                    <div className="flex flex-col gap-1 ml-1 opacity-50 hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(s)} className="p-1.5 bg-gray-50 rounded-lg border border-border text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-3 h-3" /></button>
                                        <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-gray-50 rounded-lg border border-border text-gray-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>

                            {s.summary && (
                                <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl">"{s.summary}"</p>
                            )}

                            {/* 넥스트 숙제 영역 표시 */}
                            {s.nextGoal && (
                                <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-xl border border-orange-100/50 mt-2">
                                    <Target className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[9px] font-bold text-orange-600 uppercase block mb-0.5">Next Target</span>
                                        <p className="text-xs font-bold text-gray-800">{s.nextGoal}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="w-full p-8 bg-gray-50 rounded-lg border border-border text-center shadow-inner">
                        <PenSquare className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase">기록된 하이라이트가 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecordView;