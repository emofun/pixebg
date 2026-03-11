import React, { useState, useEffect } from 'react';
import ImageTracer from 'imagetracerjs';
import { Upload, Download, Settings, Image as ImageIcon, FileDigit, RefreshCw } from 'lucide-react';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [svgString, setSvgString] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState({
    ltres: 1,
    qtres: 1,
    pathomit: 8,
    colorsampling: 2, // 0: disabled, 1: random, 2: deterministic
    numberofcolors: 16,
    mincolorratio: 0,
    colorquantcycles: 3,
    scale: 1,
    simplifytolerance: 0,
    roundcoords: 1,
    lcpr: 0,
    qcpr: 0,
    desc: false,
    viewbox: true, // Use viewBox for better scaling
    blurradius: 0,
    blurdelta: 20
  });

  // Revoke object URL when originalImage changes or component unmounts
  useEffect(() => {
    return () => {
      if (originalImage) {
        URL.revokeObjectURL(originalImage);
      }
    };
  }, [originalImage]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalImage(url);
      setSvgString(null);
      // Automatically convert on upload
      convertImage(url, options);
    }
  };

  const convertImage = (url, opts) => {
    setIsProcessing(true);
    // ImageTracer.imageToSVG is async in nature but uses callback
    // We wrap it in a small timeout to allow UI to update (show loading state)
    setTimeout(() => {
        ImageTracer.imageToSVG(
        url,
        (svg) => {
            setSvgString(svg);
            setIsProcessing(false);
        },
        opts
        );
    }, 100);
  };

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    if (originalImage) {
        // Debounce conversion could be good, but for now direct
        convertImage(originalImage, newOptions);
    }
  };

  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vectorized.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the object URL after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileDigit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              AI Vectorizer
            </h1>
          </div>
          <a 
            href="https://github.com/jankovicsandras/imagetracerjs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Powered by ImageTracerJS
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!originalImage ? (
          <div className="max-w-xl mx-auto mt-20">
            <label 
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-gray-50 transition-all hover:border-blue-400 group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <p className="mb-2 text-lg font-semibold text-gray-700">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 10MB)</p>
              </div>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">Instant</div>
                Client-side processing
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">Private</div>
                Images never leave your device
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-900 mb-1">Free</div>
                Unlimited conversions
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
            {/* Left Column: Original & Preview */}
            <div className="lg:col-span-2 flex flex-col gap-6 h-full">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200 shadow-sm flex items-center gap-2">
                   {isProcessing ? (
                     <>
                       <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                       Processing...
                     </>
                   ) : (
                     <>
                       <ImageIcon className="w-3 h-3" />
                       Preview
                     </>
                   )}
                </div>
                
                <div className="flex-1 flex items-center justify-center bg-checkered rounded-xl overflow-hidden relative">
                   {/* Split view or Toggle could be added here, for now just SVG over bg */}
                   {svgString ? (
                     <div 
                        className="w-full h-full flex items-center justify-center p-4"
                        dangerouslySetInnerHTML={{ __html: svgString }} 
                        style={{
                           // Ensure SVG scales properly within container
                        }}
                     />
                   ) : (
                     <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain opacity-50 grayscale" />
                   )}
                </div>
              </div>

              <div className="flex gap-4">
                 <label className="btn-secondary flex-1 text-center cursor-pointer">
                    Change Image
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                 </label>
                 <button 
                    onClick={downloadSVG}
                    disabled={!svgString}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                 >
                    <Download className="w-4 h-4" />
                    Download SVG
                 </button>
              </div>
            </div>

            {/* Right Column: Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Configuration</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Colors</label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Number of Colors</span>
                          <span className="text-sm text-gray-500">{options.numberofcolors}</span>
                        </div>
                        <input 
                          type="range" 
                          min="2" 
                          max="64" 
                          step="1"
                          value={options.numberofcolors} 
                          onChange={(e) => handleOptionChange('numberofcolors', parseInt(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Min Color Ratio</span>
                          <span className="text-sm text-gray-500">{options.mincolorratio}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="10" 
                          step="1"
                          value={options.mincolorratio} 
                          onChange={(e) => handleOptionChange('mincolorratio', parseInt(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Details</label>
                    <div className="space-y-4">
                       <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Path Omit (Simplification)</span>
                          <span className="text-sm text-gray-500">{options.pathomit}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="1"
                          value={options.pathomit} 
                          onChange={(e) => handleOptionChange('pathomit', parseInt(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                        <p className="text-xs text-gray-400 mt-1">Higher values remove small details</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Blur Radius</span>
                          <span className="text-sm text-gray-500">{options.blurradius}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="5" 
                          step="1"
                          value={options.blurradius} 
                          onChange={(e) => handleOptionChange('blurradius', parseInt(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                        <p className="text-xs text-gray-400 mt-1">Smoothes the image before tracing</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Presets</label>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Default', opts: { numberofcolors: 16, pathomit: 8, blurradius: 0 } },
                          { name: 'Posterized', opts: { numberofcolors: 4, pathomit: 0, blurradius: 0 } },
                          { name: 'Detailed', opts: { numberofcolors: 64, pathomit: 0, blurradius: 0 } },
                          { name: 'Smoothed', opts: { numberofcolors: 16, pathomit: 8, blurradius: 2 } },
                        ].map((preset) => (
                           <button 
                             key={preset.name}
                             onClick={() => {
                                const newOpts = { ...options, ...preset.opts };
                                setOptions(newOpts);
                                if(originalImage) convertImage(originalImage, newOpts);
                             }}
                             className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-left"
                           >
                              {preset.name}
                           </button>
                        ))}
                     </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .btn-primary {
          @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95;
        }
        .btn-secondary {
          @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl border border-gray-300 shadow-sm transition-all active:scale-95;
        }
        /* Ensure generated SVG fills the container */
        .bg-checkered svg {
            width: 100%;
            height: 100%;
        }
      `}</style>
    </div>
  );
}

export default App;
