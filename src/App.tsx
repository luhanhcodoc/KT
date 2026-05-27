/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import AviationClock from './components/AviationClock';
import StatsGrid from './components/StatsGrid';
import WeatherTable from './components/WeatherTable';
import CmsPanel from './components/CmsPanel';
import AiBriefing from './components/AiBriefing';
import { ParsedWeather, ContentConfig } from './types';
import { Plane, Radio, Terminal, Sliders, Sparkles, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'ai' | 'cms'>('monitor');
  const [weatherList, setWeatherList] = useState<ParsedWeather[]>([]);
  const [cmsConfig, setCmsConfig] = useState<ContentConfig | null>(null);
  
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const [syncing, setSyncing] = useState(false);

  // 1. Fetch CMS configurations
  const fetchCMSConfig = async () => {
    try {
      const res = await fetch('/api/cms/config');
      if (res.ok) {
        const data = await res.json();
        setCmsConfig(data);
        return data;
      } else {
        throw new Error('Lỗi liên kết cơ sở dữ liệu CMS.');
      }
    } catch (err: any) {
      console.error(err);
      setWeatherError('Không thể nạp cấu hình hệ thống từ máy chủ. Vui lòng thử lại.');
      return null;
    }
  };

  // 2. Fetch parsed real-time meteorological details
  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError('');
    try {
      const res = await fetch('/api/weather');
      if (res.ok) {
        const data = await res.json();
        setWeatherList(data);
      } else {
        throw new Error('Không thể phản hồi số liệu thời tiết.');
      }
    } catch (err: any) {
      console.error(err);
      setWeatherError('Có lỗi xảy ra khi nạp trích xuất METAR. Hệ thống đang hiển thị thông số dự phòng tự động.');
    } finally {
      setLoadingWeather(false);
    }
  };

  // Manual Trigger Refresh
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetchCMSConfig();
      await fetchWeather();
    } finally {
      setSyncing(false);
    }
  };

  // 3. Save modified parameters back to server database
  const handleSaveCMSConfig = async (newConfig: ContentConfig) => {
    const res = await fetch('/api/cms/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });

    if (res.ok) {
      const data = await res.json();
      setCmsConfig(data.config);
      // Trigger instant weather remap based on new rules
      await fetchWeather();
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Lỗi lưu cấu hình.');
    }
  };

  // 4. Trigger reset database defaults
  const handleResetCMSConfig = async () => {
    const res = await fetch('/api/cms/reset', {
      method: 'POST'
    });

    if (res.ok) {
      const data = await res.json();
      setCmsConfig(data.config);
      await fetchWeather();
    } else {
      throw new Error('Lỗi khôi phục cơ sở dữ liệu.');
    }
  };

  // Initialize
  useEffect(() => {
    const initLoad = async () => {
      await fetchCMSConfig();
      await fetchWeather();
    };
    initLoad();

    // Auto-update real-time flight weather every 5 minutes to stay accurate
    const timer = setInterval(() => {
      fetchWeather();
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Logo Brand metadata */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Plane className="w-5 h-5 text-white rotate-45" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-wider text-slate-900 uppercase">
                KHÍ TƯỢNG HÀNG KHÔNG
              </h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                BKT - KQ72 - Thiết kế bởi: Đ.T. Hảo
              </p>
            </div>
          </div>

          {/* Aviation digital clock widget */}
          <div className="w-full md:w-auto">
            <AviationClock />
          </div>

        </div>
      </header>

      {/* Primary Dashboard Content container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* Sync panel & Warning indicator alerts */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200/95 p-3.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Trạng thái máy chủ: </span>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ĐỒNG BỘ TRỰC TIẾP (OK)
            </span>
            {cmsConfig && (
              <span className="hidden md:inline-block text-slate-400">
                • Phiên bản CMS cuối: {new Date(cmsConfig.lastUpdated).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>

          <button
            id="manual-refresh-feed-btn"
            onClick={handleManualSync}
            disabled={syncing || loadingWeather}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${syncing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Làm mới số liệu tức thì</span>
          </button>
        </div>

        {/* Dynamic Warning Messaging alerts if any fails */}
        {weatherError && (
          <div id="weather-init-error-alert" className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2 max-w-2xl mx-auto shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-bold">Cảnh báo liên kết thời tiết:</p>
              <p className="text-red-700 font-medium mt-0.5">{weatherError}</p>
            </div>
          </div>
        )}

        {/* Bento Overview grid statistics gauges */}
        <StatsGrid weatherList={weatherList} />

        {/* Primary Interactive Tab controllers */}
        <div className="flex border-b border-slate-200 shrink-0 select-none pb-0.5">
          <button
            id="tab-weather-monitor-btn"
            onClick={() => setActiveTab('monitor')}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'monitor'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20 rounded-t-xl font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Giám Sát Khí Tượng Sân Bay
          </button>

          <button
            id="tab-ai-briefing-btn"
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20 rounded-t-xl font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Bản Tin & Trợ Lý AI
          </button>

          <button
            id="tab-cms-config-btn"
            onClick={() => setActiveTab('cms')}
            className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'cms'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20 rounded-t-xl font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Hệ Thống CMS Quản Lý
          </button>
        </div>

        {/* Render Active View Panels */}
        <div className="transition-all duration-300">
          
          {activeTab === 'monitor' && (
            <div id="view-monitor-pane">
              {loadingWeather && weatherList.length === 0 ? (
                <div id="table-loading-screen" className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="font-bold text-slate-700 text-sm">Đang tải và thông dịch mã METAR hàng không...</h4>
                  <p className="text-xs text-slate-400 mt-1">Hệ thống đang dịch trực tiếp thời gian thực các sân bay Việt Nam.</p>
                </div>
              ) : (
                <WeatherTable 
                  weatherList={weatherList} 
                  airports={cmsConfig ? cmsConfig.airports : []} 
                  thresholds={cmsConfig ? cmsConfig.thresholds : { tempAlertThreshold: 36, visibilityAlertThreshold: 5, extremePhenomenaCodes: [] }}
                />
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div id="view-ai-briefing-pane">
              <AiBriefing weatherData={weatherList} />
            </div>
          )}

          {activeTab === 'cms' && cmsConfig && (
            <div id="view-cms-pane">
              <CmsPanel 
                config={cmsConfig} 
                onSave={handleSaveCMSConfig} 
                onReset={handleResetCMSConfig}
              />
            </div>
          )}

        </div>

      </main>

      {/* Visual Footnotes branding */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-6 text-xs text-center shrink-0 mt-6">
        <div className="max-w-7xl mx-auto px-4 space-y-3.5">
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-wide uppercase text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-550" />
            <span className="font-bold text-slate-400">Tiêu chuẩn vận hành VATM & Tổ chức Hàng không Dân dụng Quốc tế ICAO</span>
          </div>
          <p className="font-sans text-slate-500 font-medium">
            Bản quyền © {new Date().getFullYear()} Trung tâm Khí tượng Hàng không Việt Nam (AMC). Bảo lưu mọi quyền hành.
          </p>
          <div className="flex justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-slate-400">
            <span>Chú thích cảnh báo:</span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Nhiệt độ &gt;= 36°C
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Tầm nhìn &lt; 5km
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Thời tiết cực đoan
            </span>
          </div>
          <p className="text-slate-400 font-mono text-[9px] tracking-normal mb-1">
            Dữ liệu nguồn: met.vatm.vn | Tự động đồng bộ mỗi 5 phút
          </p>
        </div>
      </footer>

    </div>
  );
}
