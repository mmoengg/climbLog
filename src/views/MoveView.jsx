import {Footprints} from "lucide-react";
import React from "react";

const MoveView = ({ db, appId, moves }) => (
    <div className="space-y-4 pb-10 animate-in fade-in">
        <div className="bg-white p-6 rounded-lg border border-border">
            <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">Technique Progress</h3>
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-2 overflow-hidden shadow-inner">
                <div className="bg-blue-600 h-full w-[45%] rounded-full" />
            </div>
        </div>
        {moves.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-lg border border-border space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Footprints className="w-4 h-4" /></div>
                    <div><h5 className="text-sm font-bold text-gray-800">{m.title}</h5><p className="text-xs text-gray-500 font-medium mt-0.5">{m.desc}</p></div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(lv => (
                        <button key={lv} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${m.level >= lv ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Lv.{lv}</button>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default MoveView;