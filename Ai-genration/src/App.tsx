import { useState, useRef, useEffect } from 'react';
import { Download, Wand2, Sparkles, Zap, Copy, Heart, Share2, Settings, Palette, Camera } from 'lucide-react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [quality, setQuality] = useState('standard');
  const [showSettings, setShowSettings] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [activeTab, setActiveTab] = useState('generate');
  const canvasRef = useRef(null);

  const styles = [
    { id: 'realistic', name: 'Realistic', icon: '📸' },
    { id: 'artistic', name: 'Artistic', icon: '🎨' },
    { id: 'anime', name: 'Anime', icon: '✨' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃' },
    { id: 'vintage', name: 'Vintage', icon: '📷' },
    { id: 'abstract', name: 'Abstract', icon: '🌀' }
  ];

  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const qualities = ['draft', 'standard', 'high', 'ultra'];

  const samplePrompts = [
    "A mystical forest with glowing mushrooms and ethereal light",
    "Futuristic cityscape with flying cars at sunset",
    "A cozy coffee shop on a rainy day with warm lighting",
    "Majestic dragon soaring through cloudy mountains",
    "Underwater palace with colorful coral and sea creatures"
  ];

  const generateImages = async () => {
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("style", selectedStyle);
      formData.append("ratio", selectedRatio);
      formData.append("quality", quality);

      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const newImage = {
        id: Date.now(),
        url: imageUrl,
        prompt: prompt,
        blob: blob, // Store the actual blob for downloading
        style: selectedStyle,
        ratio: selectedRatio,
        quality: quality,
        timestamp: new Date().toISOString(),
      };

      setGeneratedImages((prev) => [newImage]);
    } catch (error) {
      console.error("❌ Error generating image:", error);
      alert("Failed to generate image: " + error.message);
    }

    setIsGenerating(false);
  };

  const handlePromptSubmit = (e) => {
    if (e) e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      generateImages();
    }
  };

  const toggleFavorite = (imageId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId);
      } else {
        newFavorites.add(imageId);
      }
      return newFavorites;
    });
  };

  const downloadImage = (imageData, filename = 'generated-image.png') => {
    try {
      // Create a temporary URL for the blob
      const downloadUrl = URL.createObjectURL(imageData.blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `ai-image-${imageData.id}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Prompt copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const shareImage = async (imageData) => {
    try {
      if (navigator.share && navigator.canShare) {
        const filesArray = [new File([imageData.blob], `ai-image-${imageData.id}.png`, { type: 'image/png' })];
        
        if (navigator.canShare({ files: filesArray })) {
          await navigator.share({
            title: 'AI Generated Image',
            text: `Check out this AI-generated image: ${imageData.prompt}`,
            files: filesArray
          });
        } else {
          // Fallback to copying the prompt
          copyPrompt(imageData.prompt);
          alert('Image sharing not supported. Prompt copied to clipboard instead.');
        }
      } else {
        // Fallback for browsers without Web Share API
        copyPrompt(imageData.prompt);
        alert('Sharing not supported. Prompt copied to clipboard.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      copyPrompt(imageData.prompt);
      alert('Share failed. Prompt copied to clipboard instead.');
    }
  };

  useEffect(() => {
    // Floating particles animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2
    }));
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Cleanup blob URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      generatedImages.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [generatedImages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ zIndex: 1 }}
      />
      
      {/* Header */}
      <header className="relative z-10 p-6 backdrop-blur-sm bg-black/20 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Studio
            </h1>
          </div>
          
          <nav className="flex space-x-1">
            {['generate', 'gallery', 'favorites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg capitalize transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6">
        {activeTab === 'generate' && (
          <div className="space-y-8">
            {/* Prompt Input Section */}
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-semibold">Create Your Vision</h2>
              </div>
              
              <div className="space-y-6">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your dream image... (e.g., 'A magical castle floating in the clouds with rainbow waterfalls')"
                    className="w-full p-4 bg-black/30 border border-purple-500/50 rounded-xl text-white placeholder-purple-300/70 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 resize-none transition-all duration-300"
                    rows="4"
                    disabled={isGenerating}
                    maxLength={500}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-purple-300">
                    {prompt.length}/500
                  </div>
                </div>
                
                {/* Sample Prompts */}
                <div className="space-y-2">
                  <p className="text-sm text-purple-300">Try these prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((sample, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPrompt(sample)}
                        disabled={isGenerating}
                        className="text-xs px-3 py-1 bg-purple-800/50 hover:bg-purple-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors duration-200 border border-purple-500/30"
                      >
                        {sample.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-purple-300">Style</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        disabled={isGenerating}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedStyle === style.id
                            ? 'border-purple-400 bg-purple-600/30 shadow-lg shadow-purple-600/30'
                            : 'border-purple-500/30 bg-black/20 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{style.icon}</div>
                        <div className="text-xs">{style.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center space-x-2 text-purple-300 hover:text-white transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Advanced Settings</span>
                  </button>
                </div>

                {showSettings && (
                  <div className="grid md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-xl border border-purple-500/20">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-purple-300">Aspect Ratio</label>
                      <select
                        value={selectedRatio}
                        onChange={(e) => setSelectedRatio(e.target.value)}
                        disabled={isGenerating}
                        className="w-full p-2 bg-black/30 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                      >
                        {ratios.map(ratio => (
                          <option key={ratio} value={ratio}>{ratio}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-purple-300">Quality</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        disabled={isGenerating}
                        className="w-full p-2 bg-black/30 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                      >
                        {qualities.map(q => (
                          <option key={q} value={q} className="capitalize">{q}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePromptSubmit}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg shadow-purple-600/30 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Magic...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Wand2 className="w-5 h-5" />
                      <span>Generate Images</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Loading Animation */}
            {isGenerating && (
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-purple-500/30">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-purple-300">AI is painting your imagination...</p>
                  <div className="w-full bg-purple-900/30 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{width: '60%'}} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated Images Grid */}
        {(activeTab === 'generate' || activeTab === 'gallery') && generatedImages.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>{activeTab === 'generate' ? 'Generated Images' : 'Gallery'}</span>
              </h3>
              <div className="text-sm text-purple-300">
                {generatedImages.length} images
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generatedImages.map((image) => (
                <div
                  key={image.id}
                  className="group backdrop-blur-sm bg-white/10 rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl hover:shadow-2xl hover:shadow-purple-600/20 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => toggleFavorite(image.id)}
                        className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 ${
                          favorites.has(image.id) 
                            ? 'bg-pink-600/80 text-white' 
                            : 'bg-black/50 text-white hover:bg-pink-600/80'
                        }`}
                        title={favorites.has(image.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(image.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => downloadImage(image, `ai-image-${image.id}.png`)}
                        className="p-2 rounded-full bg-black/50 text-white hover:bg-purple-600/80 backdrop-blur-sm transition-colors duration-200"
                        title="Download image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-purple-200 line-clamp-2">{image.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-purple-300">
                      <span className="px-2 py-1 bg-purple-800/50 rounded-full capitalize">
                        {image.style}
                      </span>
                      <span>{image.ratio}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyPrompt(image.prompt)}
                        className="flex-1 py-2 px-3 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center space-x-1"
                        title="Copy prompt"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </button>
                      <button 
                        onClick={() => shareImage(image)}
                        className="py-2 px-3 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg text-xs transition-colors duration-200"
                        title="Share image"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <span>Favorites</span>
            </h3>
            
            {favorites.size === 0 ? (
              <div className="text-center py-16 backdrop-blur-sm bg-white/10 rounded-2xl border border-purple-500/30">
                <Heart className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <p className="text-purple-300">No favorites yet. Start generating and save your favorite images!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {generatedImages
                  .filter(image => favorites.has(image.id))
                  .map((image) => (
                    <div key={image.id} className="group backdrop-blur-sm bg-white/10 rounded-2xl overflow-hidden border border-purple-500/30 shadow-xl hover:shadow-2xl hover:shadow-purple-600/20 transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Action Buttons for Favorites */}
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => toggleFavorite(image.id)}
                            className="p-2 rounded-full bg-pink-600/80 text-white backdrop-blur-sm transition-colors duration-200"
                            title="Remove from favorites"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => downloadImage(image, `ai-image-${image.id}.png`)}
                            className="p-2 rounded-full bg-black/50 text-white hover:bg-purple-600/80 backdrop-blur-sm transition-colors duration-200"
                            title="Download image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-purple-200 line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between text-xs text-purple-300">
                          <span className="px-2 py-1 bg-purple-800/50 rounded-full capitalize">
                            {image.style}
                          </span>
                          <span>{image.ratio}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyPrompt(image.prompt)}
                            className="flex-1 py-2 px-3 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center space-x-1"
                            title="Copy prompt"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt</span>
                          </button>
                          <button 
                            onClick={() => shareImage(image)}
                            className="py-2 px-3 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg text-xs transition-colors duration-200"
                            title="Share image"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {generatedImages.length === 0 && !isGenerating && activeTab === 'generate' && (
          <div className="text-center py-16 backdrop-blur-sm bg-white/10 rounded-2xl border border-purple-500/30">
            <Camera className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-2">Ready to create amazing images?</p>
            <p className="text-purple-400/70 text-sm">Enter a prompt above and let AI bring your ideas to life!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;