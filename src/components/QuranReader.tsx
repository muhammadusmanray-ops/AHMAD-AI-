import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Play, Pause, SkipBack, SkipForward, X, RefreshCw } from "lucide-react";
import { SURAH_LIST, PARA_LIST } from "../data/quran";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface QuranReaderProps {
  onPlaySurah?: (surahNum: number) => void;
  activeSurahNum?: number | null;
  isQuranPlaying?: boolean;
  onToggleQuranPlay?: () => void;
  selectedReciterName?: string;
  externalPageNumber?: number;
}

export const QuranReader: React.FC<QuranReaderProps> = ({
  onPlaySurah,
  activeSurahNum = 1,
  isQuranPlaying = false,
  onToggleQuranPlay,
  selectedReciterName = "Abdur-Rahman As-Sudais",
  externalPageNumber,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(externalPageNumber || 7);

  useEffect(() => {
    if (externalPageNumber && externalPageNumber >= 1 && externalPageNumber <= 611) {
      setCurrentPage(externalPageNumber);
    }
  }, [externalPageNumber]);

  const [totalPages, setTotalPages] = useState<number>(611);
  const [selectedJuz, setSelectedJuz] = useState<(typeof PARA_LIST)[0] | null>(null);
  const [juzModalOpen, setJuzModalOpen] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<"start" | "quarter" | "half" | "third">("start");
  const [showJuzIndexList, setShowJuzIndexList] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeSurahObj = SURAH_LIST.find((s) => s.number === activeSurahNum) || SURAH_LIST[0];
  const activeJuzObj = [...PARA_LIST].reverse().find((p) => currentPage >= p.startPage) || PARA_LIST[0];

  // Load PDF document once
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const doc = await pdfjsLib.getDocument("/quran-taj-company.pdf?v=611").promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        console.log("Taj Company PDF loaded:", doc.numPages, "pages");
      } catch (err) {
        console.error("Error loading Taj Company PDF:", err);
      }
    };
    loadPdf();
  }, []);

  // Render current page to canvas automatically straight and upright
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    setIsLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Auto-orient landscape PDF scans to portrait upright format
      const unscaled = page.getViewport({ scale: 1.0 });
      const autoAngle = unscaled.width > unscaled.height ? 270 : 0;

      const viewport = page.getViewport({ scale: 2.5, rotation: autoAngle });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      await page.render({ canvasContext: ctx, viewport }).promise;
      setIsLoading(false);
    } catch (err) {
      console.error("Error rendering page:", err);
      setIsLoading(false);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfDoc, renderPage]);

  // Open Juz Selection Modal
  const openJuzModal = (juz: (typeof PARA_LIST)[0]) => {
    setSelectedJuz(juz);
    setSelectedSection("start");
    setJuzModalOpen(true);
  };

  // Confirm Juz Selection
  const confirmJuzRead = () => {
    if (!selectedJuz) return;
    let targetPage = selectedJuz.startPage;
    if (selectedSection === "quarter") targetPage += 5;
    else if (selectedSection === "half") targetPage += 10;
    else if (selectedSection === "third") targetPage += 15;

    setCurrentPage(Math.min(totalPages, targetPage));
    setJuzModalOpen(false);
    setShowJuzIndexList(false);
  };

  return (
    <div className="w-full flex flex-col items-center select-none font-mono text-zinc-900 min-h-screen pb-24">
      
      {/* Top Action Bar */}
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between mb-3 shadow-lg text-white">
        <button
          onClick={() => setShowJuzIndexList(!showJuzIndexList)}
          className="px-4 py-2 rounded-xl bg-lime-600 hover:bg-lime-500 text-black font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(101,163,13,0.4)] uppercase tracking-wider"
        >
          <BookOpen className="w-4 h-4" />
          <span>{showJuzIndexList ? "View Mushaf Page" : "Juzz Index"}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 disabled:opacity-30 cursor-pointer text-cyan-400 font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-bold text-amber-400 px-2">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 disabled:opacity-30 cursor-pointer text-cyan-400 font-bold"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Juzz Index View */}
      {showJuzIndexList ? (
        <div className="w-full max-w-xl bg-black border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl text-white">
          <div className="text-sm font-bold text-amber-400 border-b border-zinc-800 pb-2 flex items-center justify-between">
            <span>Juzz Index (1 - 30)</span>
            <span className="text-xs text-zinc-500">Tap Juz to read</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {PARA_LIST.map((juz) => (
              <div
                key={juz.number}
                onClick={() => openJuzModal(juz)}
                className="bg-zinc-950 border border-zinc-800 hover:border-lime-500/50 p-3 rounded-xl flex items-center justify-between cursor-pointer transition"
              >
                <div>
                  <div className="font-bold text-sm text-lime-400">{juz.number}. {juz.englishName}</div>
                  <div className="text-[10px] text-zinc-500">Page #{juz.startPage}</div>
                </div>
                <div className="text-xl font-serif font-bold text-amber-300">{juz.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (

        /* Taj Company 16-Line Mushaf Page (PDF Canvas Render - Straight & Height Fitted) */
        <div className="w-full max-w-xl sm:max-w-2xl bg-white border-4 border-black rounded-2xl p-2 sm:p-3 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-between overflow-hidden">
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-lime-600" />
              <span className="text-sm font-bold text-zinc-700">Loading Taj Company Page {currentPage}...</span>
            </div>
          )}

          {/* PDF Page Canvas */}
          <div className="w-full bg-white flex items-center justify-center rounded-xl overflow-hidden p-0.5">
            <canvas
              ref={canvasRef}
              className="max-h-[calc(100vh-170px)] w-auto max-w-full object-contain rounded shadow-inner"
            />
          </div>

          {/* Bottom Page Footer */}
          <div className="w-full text-center text-xs font-mono font-bold text-zinc-800 pt-2 border-t border-zinc-300 flex items-center justify-between px-2">
            <span>PAGE {currentPage} OF {totalPages}</span>
            <span className="font-serif text-black font-bold">القرآن الکریم - تاج کمپنی</span>
            <span>JUZ {activeJuzObj.number} ({activeJuzObj.name})</span>
          </div>
        </div>
      )}

      {/* Islam 360 Juzz Modal Popup */}
      {juzModalOpen && selectedJuz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-3xl p-6 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white tracking-wide">Read Juzz from:</h3>
              <button onClick={() => setJuzModalOpen(false)} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(["start", "quarter", "half", "third"] as const).map((section) => {
                const labels = { start: "START", quarter: "QUARTER", half: "HALF", third: "THIRD QUARTER" };
                const arabicLabels = { start: selectedJuz.name, quarter: "الربع", half: "النصف", third: "الثلثة" };
                return (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between font-bold text-sm transition cursor-pointer ${
                      selectedSection === section
                        ? "bg-lime-600 border-lime-400 text-black shadow-[0_0_20px_rgba(101,163,13,0.4)]"
                        : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSection === section ? "border-black bg-black" : "border-zinc-600"}`}>
                        {selectedSection === section && <div className="w-2 h-2 rounded-full bg-lime-400" />}
                      </div>
                      <span>{labels[section]}</span>
                    </div>
                    <span className={`font-serif text-lg ${selectedSection === section ? "" : "text-lime-400"}`}>{arabicLabels[section]}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-4 pt-2 border-t border-zinc-800 font-mono text-xs font-bold">
              <button onClick={() => setJuzModalOpen(false)} className="text-zinc-400 hover:text-white uppercase tracking-wider px-3 py-2 cursor-pointer">CANCEL</button>
              <button onClick={confirmJuzRead} className="bg-lime-500 hover:bg-lime-400 text-black px-6 py-2 rounded-xl font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(101,163,13,0.4)]">READ</button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Audio Recitation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md z-40 px-4 py-2.5 flex items-center justify-between max-w-4xl mx-auto rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] text-white">
        <div className="flex items-center gap-3">
          <button onClick={onToggleQuranPlay} className="w-10 h-10 rounded-full bg-lime-600 hover:bg-lime-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(101,163,13,0.5)] transition cursor-pointer">
            {isQuranPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-xs font-bold text-amber-300 font-serif" dir="rtl">سُورَةُ {activeSurahObj.arabicName || activeSurahObj.name} ({activeSurahObj.englishName})</div>
            <div className="text-[10px] text-zinc-400 font-mono">{selectedReciterName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onPlaySurah?.(Math.max(1, activeSurahObj.number - 1))} className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer" title="Previous Surah"><SkipBack className="w-4 h-4" /></button>
          <button onClick={() => onPlaySurah?.(Math.min(114, activeSurahObj.number + 1))} className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition cursor-pointer" title="Next Surah"><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};
