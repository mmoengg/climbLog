import { Flame, Wind, Activity, Smile, History as HistoryIcon } from 'lucide-react';

const QuestHistoryView = ({ db, appId, quests, questHistory }) => {
    const completedCount = quests.filter(q => q.current === q.goal).length;
    const sortedDates = Object.keys(questHistory).sort((a, b) => b.localeCompare(a));

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    return (
        <div className="space-y-5 animate-in fade-in pb-10">
            <section className="bg-white p-6 rounded-3xl border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase">
                        <Flame className="w-5 h-5 text-orange-500" /> Current Quests
                    </h3>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
            {completedCount} / {quests.length} 완료
          </span>
                </div>

                <div className="space-y-3">
                    {quests.length > 0 ? (
                        quests.map(q => (
                            <div key={q.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${q.current === q.goal ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl text-white ${q.current === q.goal ? q.color : 'bg-gray-300'}`}>
                                        {q.current === q.goal ? <CheckCircle2 className="w-5 h-5" /> : getQuestIcon(q.icon)}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${q.current === q.goal ? 'text-gray-900' : 'text-gray-600'}`}>{q.title}</h4>
                                        <p className="text-xs text-gray-400 font-bold mt-0.5">진행도: {q.current} / {q.goal}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    {Array.from({ length: q.goal }).map((_, i) => (
                                        <div key={i} className={`w-2.5 h-6 rounded-sm ${i < q.current ? (q.current === q.goal ? 'bg-orange-400' : 'bg-blue-400') : 'bg-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase">진행 중인 퀘스트가 없습니다</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white p-6 rounded-3xl border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase mb-6">
                    <HistoryIcon className="w-5 h-5 text-orange-500" /> Completed History
                </h3>

                <div className="space-y-3">
                    {sortedDates.length > 0 ? (
                        sortedDates.map(dateKey => {
                            const [year, month, day] = dateKey.split('-');
                            const displayDate = `${parseInt(month)}월 ${parseInt(day)}일`;

                            return (
                                <div key={dateKey} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-0">
                <span className="text-xs font-bold text-orange-600 bg-white px-3 py-1.5 rounded-lg border border-orange-100 whitespace-nowrap shrink-0">
                  {displayDate}
                </span>
                                    <span className="text-sm font-bold text-gray-800 text-left ml-4 leading-snug">{questHistory[dateKey]}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase">달성한 퀘스트가 없습니다</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default QuestHistoryView;