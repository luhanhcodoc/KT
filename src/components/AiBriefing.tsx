/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParsedWeather } from '../types';
import { Sparkles, Loader2, Send, Bot, ShieldAlert, CheckCircle, Navigation, Play, AlertTriangle } from 'lucide-react';

interface AiBriefingProps {
  weatherData: ParsedWeather[];
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export default function AiBriefing({ weatherData }: AiBriefingProps) {
  const [briefResponse, setBriefResponse] = useState<string>('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadedBriefTime, setLoadedBriefTime] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive copilot Q&A
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Xin chào phi công! Tôi là Trợ Lý Khí Tượng Hàng Không AI. Bạn cần tra cứu thời tiết đặc thù, phân tích rủi ro hạ cánh hay giải nghĩa các thuật ngữ nào?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Generate automated AMC weather summary briefing
  const handleGenerateBriefing = async () => {
    setLoadingBrief(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherData })
      });

      const result = await response.json();
      if (result.success) {
        setBriefResponse(result.summaryText);
        setLoadedBriefTime(result.lastUpdated || new Date().toLocaleTimeString('vi-VN'));
      } else {
        throw new Error(result.message || 'Lỗi không xác định khi tạo bản tin.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng khi tải bản tin AI.');
    } finally {
      setLoadingBrief(false);
    }
  };

  // Submit question to AI Assistant
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLoadingChat(true);

    try {
      // Craft a temporary prompt utilizing current meteorological tables
      const simplifiedWeather = weatherData.map(w => `${w.icao}: ${w.temp}°C, Gió: ${w.windDir} - ${w.windSpeed}m/s, Tầm nhìn: ${w.visibility}, Mây: ${w.clouds}, HTTT: ${w.phenomena}`).join("\n");
      
      const prompt = `
Bạn là Trợ lý Khí tượng Hàng không Việt Nam (AMC Co-Pilot AI).
Dưới đây là bảng thời tiết sân bay hiện tại thời gian thực:
${simplifiedWeather}

Hãy trả lời câu hỏi sau của phi công hoặc điều hành viên một cách chính xác, chu đáo, súc tích bằng Tiếng Việt. Tập trung tối đa vào thông số khí tượng hàng không, độ cao mây, gió giật, độ cao trần mây cất cánh, hạ cánh an toàn.

Câu hỏi của phi công: "${userText}"
`;

      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weatherData: weatherData,
          // We can append this prompt. In the backend we handle it if specified or fall back.
          // Wait! Our backend summary route takes weatherData and prompts a summary. Let's make sure the backend endpoint
          // can also accept a custom prompt if provided, or we can use the same server endpoint for chat as well.
          // In server.ts, the endpoint takes weatherData and generates prompt based on it.
          // Let's check how the server endpoint parses custom prompts or how we can implement a chat controller in server.ts!
          // Wait! In server.ts, the endpoint was defined as receiving weatherData. We can modify server.ts or let the server
          // handle a sub-prompt field `promptOverride`! Let's make sure our server can handle `promptOverride` in a updated server.ts,
          // or we can make the call robust. Let's update server.ts to handle custom prompts if we send them, so that chat interacts with Gemini perfectly!
          // Yes! We can modify server.ts later. Let's make sure we send promptOverride to the backend API.
        })
      });

      // Oh wait, let's look at server.ts around the gemini summary route. Yes, it takes weatherData and builds a hardcoded prompt.
      // Let's make it more flexible so it handles chat messages or custom requests!
      // Let's specify the custom message or promptOverride under `promptOverride` in the POST body.
      // Then we can update the backend server.ts to accept `promptOverride`.
      const chatResponse = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weatherData,
          promptOverride: prompt 
        })
      });

      const chatResult = await chatResponse.json();
      if (chatResult.success) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: chatResult.summaryText }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `Rất tiếc, trợ lý gặp lỗi khi kết nối: ${chatResult.message}` }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Không thể phản hồi. Vui lòng kiểm tra cổng API.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
      
      {/* Flight Safety Summary Panel */}
      <div className="xl:col-span-7 flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Bản Phân Tích Tổng Hợp Khí Tượng (AI Briefing)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tự động tổng hợp dữ liệu thời tiết thực tại các sân bay VN bằng AI</p>
                </div>
              </div>

              {loadedBriefTime && (
                <span className="text-[10px] font-mono text-slate-400">
                  Cập nhật: {loadedBriefTime}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 p-3 rounded-xl text-xs text-red-800 flex items-start gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Empty summary state or results */}
            {!briefResponse ? (
              <div className="text-center py-10 px-4 space-y-3 max-w-sm mx-auto">
                <Bot className="w-12 h-12 text-slate-350 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Báo cáo Khí tượng Hàng không</h4>
                <p className="text-xs text-slate-400">Trích xuất nhanh các rủi ro vận hành bay mặt đất, dông sét (TS), gió giật mạnh dựa trên điều kiện thời tiết thực.</p>
                <button
                  id="btn-trigger-ai-briefing"
                  onClick={handleGenerateBriefing}
                  disabled={loadingBrief}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 w-full cursor-pointer disabled:bg-indigo-400"
                >
                  <Play className="w-3.5 h-3.5" />
                  Bắt đầu Phân tích (Sử dụng AI)
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shadow-inner max-h-[360px] overflow-y-auto text-xs text-slate-705 leading-relaxed font-medium font-sans">
                {/* Parse Markdown summaries */}
                <div className="prose prose-xs text-slate-800 whitespace-pre-line space-y-3">
                  {briefResponse}
                </div>
              </div>
            )}
          </div>

          {briefResponse && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                id="btn-re-generate-briefing"
                onClick={handleGenerateBriefing}
                disabled={loadingBrief}
                className="bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {loadingBrief ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                Tạo lại bản tin thời tiết
              </button>
            </div>
          )}

          {/* Loading Screen Overlay with Aviation messages */}
          {loadingBrief && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Trí tuệ nhân tạo đang phân tích...</h4>
                  <p className="text-xs text-slate-500">Đang dịch chỉ số METAR, giải nghĩa hướng gió đứt, rà soát ngưỡng dông sét & dán thẻ cảnh báo bay.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-800 rounded-xl p-3 text-[11px] italic font-medium leading-normal">
                  "Trong thời gian chờ, phi hành đoàn lưu ý rà soát lại trọng lượng cất hạ cánh nếu nhiệt độ cao tại miền Trung vượt quy định 36°C."
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* AI Assistant Chat Section */}
      <div className="xl:col-span-5 flex flex-col space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col h-[480px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 shrink-0">
            <Bot className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Trợ lý Hỏi Đáp Khí Tượng AI</h3>
              <p className="text-[10px] text-slate-405">Chatbot tư vấn tiêu chuẩn METAR & rủi ro an toàn</p>
            </div>
          </div>

          {/* Chat history content loop */}
          <div className="flex-1 overflow-y-auto space-y-3.5 my-3 pr-1">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`p-2.5 rounded-2xl text-xs leading-relaxed font-semibold transition-all ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-2 mr-auto items-center text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Trợ lý AMC đang tra cứu khí tượng...</span>
              </div>
            )}
          </div>

          {/* Prompt typing input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-100 pt-3">
            <input
              id="ai-chat-input-field"
              type="text"
              placeholder="Hỏi AI: ý nghĩa CAVOK, bão Cam Ranh, sương mù..."
              className="flex-grow bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-800"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loadingChat}
            />
            <button
              id="chat-send-btn"
              type="submit"
              disabled={loadingChat || !chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
