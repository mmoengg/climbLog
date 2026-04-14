import React, {useMemo, useState} from "react";
import {addDoc, collection, deleteDoc, doc, serverTimestamp} from "firebase/firestore";
import {PieChart, Plus, ChevronDown, Trash2 } from "lucide-react";

const ExpenseView = ({  db, appId, user, expenses }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('입장권');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [saving, setSaving] = useState(false);

    const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);
    const startOfWeekStr = getStartOfWeek(new Date());

    const stats = useMemo(() => {
        let daily = 0, weekly = 0, monthly = 0, total = 0;

        expenses.forEach(e => {
            const val = Number(e.amount);
            total += val;
            if (e.date === todayStr) daily += val;
            if (e.date >= startOfWeekStr && e.date <= todayStr) weekly += val;
            if (e.date.startsWith(currentMonthStr)) monthly += val;
        });

        return { daily, weekly, monthly, total };
    }, [expenses, todayStr, currentMonthStr, startOfWeekStr]);

    const CATEGORY_STYLE = {
        "입장권": "bg-blue-100 text-blue-700",
        "주차비": "bg-gray-200 text-gray-700",
        "장비/의류": "bg-orange-100 text-orange-700",
        "간식/음료": "bg-green-100 text-green-700",
        "기타": "bg-purple-100 text-purple-700"
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user || !amount || !memo) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), {
                date,
                category,
                amount: Number(amount),
                memo,
                createdAt: serverTimestamp()
            });
            setShowAddForm(false);
            setAmount('');
            setMemo('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('기록을 삭제할까요? 통계에서 제외됩니다.')) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" /> Expense Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">일간 (오늘)</span>
                        <span className="text-lg font-black text-blue-700">{stats.daily.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">주간 (이번 주)</span>
                        <span className="text-lg font-black text-indigo-700">{stats.weekly.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">월간 (이번 달)</span>
                        <span className="text-lg font-black text-purple-700">{stats.monthly.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-center shadow-md shadow-gray-300">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">총 누적 소비</span>
                        <span className="text-lg font-black text-white">{stats.total.toLocaleString()}원</span>
                    </div>
                </div>
            </section>

            <section className="bg-white p-5 rounded-3xl border-2 border-dashed border-gray-200 transition-all hover:bg-gray-50/50">
                <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between font-bold text-gray-700 uppercase tracking-widest text-sm">
                    <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> 새 지출 기록하기</span>
                    <ChevronDown className={`transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`} />
                </button>
                {showAddForm && (
                    <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in slide-in-from-top-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0 mr-2">결제 날짜</label>
                                <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm">
                                <option value="입장권">입장권 (일일권/정기권)</option>
                                <option value="주차비">주차비/교통비</option>
                                <option value="장비/의류">장비/의류 (암벽화/초크 등)</option>
                                <option value="간식/음료">간식/음료/식비</option>
                                <option value="기타">기타 잡화</option>
                            </select>
                        </div>
                        <input type="number" placeholder="금액 입력 (원)" className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800 shadow-sm" value={amount} onChange={e => setAmount(e.target.value)} required />
                        <input placeholder="내역 메모 (예: 테이프 2개, 초크 리필)" className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 shadow-sm" value={memo} onChange={e => setMemo(e.target.value)} required />
                        <button disabled={saving} className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50">
                            {saving ? '저장 중...' : '지출 저장하기 💸'}
                        </button>
                    </form>
                )}
            </section>

            <div className="space-y-3">
                <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest pt-2">Recent Expenses</h3>
                {expenses.map(e => (
                    <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${CATEGORY_STYLE[e.category] || CATEGORY_STYLE["기타"]}`}>{e.category}</span>
                                <span className="text-[10px] font-bold text-gray-400">{e.date}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 break-keep">{e.memo}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-gray-900">{Number(e.amount).toLocaleString()}원</span>
                            <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {expenses.length === 0 && (
                    <div className="w-full p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center shadow-inner">
                        <Receipt className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">기록된 지출이 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseView;