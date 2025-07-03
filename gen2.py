from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from diffusers import StableDiffusionXLPipeline, DiffusionPipeline
import torch
from io import BytesIO
import gc
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store the pipeline
pipe = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global pipe
    logger.info("🚀 Starting up - Loading Juggernaut model...")
    
    # Check available VRAM
    if torch.cuda.is_available():
        logger.info(f"💾 CUDA Available - VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")
    
    try:
        # Use Juggernaut XI v11 model - latest version
        model_id = "RunDiffusion/Juggernaut-XI-v11"
        
        pipe = StableDiffusionXLPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16  # Use float16 to save memory
            # Removed use_safetensors=True to allow loading .bin files if safetensors not available
        )
        
        # Memory optimization techniques for Juggernaut
        pipe.enable_attention_slicing(1)  # Reduce memory usage
        pipe.enable_model_cpu_offload()   # Offload to CPU when not in use
        pipe.enable_vae_slicing()         # VAE slicing for memory efficiency
        
        # For very limited VRAM, you can also try sequential CPU offload
        # pipe.enable_sequential_cpu_offload()
        
        logger.info("✅ Juggernaut XI v11 model loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to load Juggernaut model: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down...")
    if pipe:
        del pipe
    torch.cuda.empty_cache()
    gc.collect()

app = FastAPI(lifespan=lifespan)

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Style modifiers optimized for Juggernaut model
STYLE_MODIFIERS = {
    "realistic": ", photorealistic, high quality, detailed, professional photography",
    "artistic": ", digital art, painting, artistic, masterpiece",
    "anime": ", anime style, manga, vibrant colors, detailed illustration",
    "cyberpunk": ", cyberpunk style, neon lights, futuristic, sci-fi",
    "vintage": ", vintage style, retro, classic, film photography",
    "abstract": ", abstract art, surreal, modern art, creative",
    "cinematic": ", cinematic lighting, dramatic, movie scene, professional",
    "fantasy": ", fantasy art, magical, epic, detailed fantasy illustration"
}

@app.post("/generate")
async def generate_image(
    prompt: str = Form(...), 
    style: str = Form(default="realistic"),
    ratio: str = Form(default="1:1"),
    quality: str = Form(default="standard")
):
    global pipe
    
    if pipe is None:
        raise HTTPException(status_code=503, detail="Juggernaut model not loaded")
    
    try:
        # Clear CUDA cache before generation
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Get style modifier
        style_modifier = STYLE_MODIFIERS.get(style, STYLE_MODIFIERS["realistic"])
        
        # Combine user prompt with style modifier
        enhanced_prompt = f"{prompt}{style_modifier}"
        
        # Add negative prompt for better quality with Juggernaut
        negative_prompt = "blurry, low quality, distorted, deformed, ugly, bad anatomy, bad proportions, watermark, signature"
        
        # Get dimensions optimized for Juggernaut
        dimensions = get_dimensions_juggernaut(ratio)
        
        # Get steps optimized for quality
        steps = get_steps_juggernaut(quality)
        
        logger.info(f"🎨 Generating image with Juggernaut XI v11")
        logger.info(f"🎭 Style: {style}")
        logger.info(f"📝 Enhanced prompt: {enhanced_prompt}")
        logger.info(f"📏 Dimensions: {dimensions}")
        logger.info(f"⚡ Steps: {steps}")
        
        # Generate with Juggernaut-optimized settings
        with torch.inference_mode():  # Disable gradient computation
            result = pipe(
                prompt=enhanced_prompt,
                negative_prompt=negative_prompt,
                height=dimensions["height"], 
                width=dimensions["width"],
                num_inference_steps=steps,
                guidance_scale=8.0,  # Juggernaut works well with slightly higher guidance
                generator=torch.Generator(device="cuda").manual_seed(42) if torch.cuda.is_available() else None
            )
        
        image = result.images[0]
        
        # Clear memory after generation
        del result
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

        # Convert image to bytes
        buffered = BytesIO()
        image.save(buffered, format="PNG", optimize=True)
        buffered.seek(0)

        logger.info("✅ Image generated successfully with Juggernaut!")
        
        return StreamingResponse(
            BytesIO(buffered.getvalue()), 
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=juggernaut_{style}.png"
            }
        )
        
    except torch.cuda.OutOfMemoryError as e:
        logger.error("❌ CUDA Out of Memory Error")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        raise HTTPException(status_code=507, detail="GPU memory exhausted. Try smaller dimensions or draft quality.")
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        raise HTTPException(status_code=500, detail=f"Juggernaut image generation failed: {str(e)}")

def get_dimensions_juggernaut(ratio: str):
    """Dimensions optimized for Juggernaut model"""
    ratio_map = {
        "1:1": {"width": 768, "height": 768},    # Standard SDXL resolution
        "16:9": {"width": 1344, "height": 768},    # Landscape
        "9:16": {"width": 768, "height": 1344},    # Portrait
        "4:3": {"width": 1152, "height": 896},     # Standard photo
        "3:4": {"width": 896, "height": 1152},     # Portrait photo
        "21:9": {"width": 1536, "height": 640},    # Ultra-wide
        "3:2": {"width": 1216, "height": 832}      # Camera ratio
    }
    return ratio_map.get(ratio, {"width": 1024, "height": 1024})

def get_steps_juggernaut(quality: str):
    """Steps optimized for Juggernaut model quality"""
    quality_map = {
        "draft": 20,      # Quick generation
        "standard": 30,   # Good quality
        "high": 40,       # High quality
        "ultra": 50       # Best quality
    }
    return quality_map.get(quality, 30)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "Juggernaut XI v11",
        "model_loaded": pipe is not None,
        "cuda_available": torch.cuda.is_available(),
        "vram_allocated": f"{torch.cuda.memory_allocated() / 1024**3:.2f}GB" if torch.cuda.is_available() else "N/A",
        "vram_reserved": f"{torch.cuda.memory_reserved() / 1024**3:.2f}GB" if torch.cuda.is_available() else "N/A"
    }

@app.post("/clear-cache")
async def clear_cache():
    """Manually clear GPU cache"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()
    return {"message": "GPU cache cleared successfully"}

@app.get("/styles")
async def get_available_styles():
    """Get list of available styles"""
    return {
        "styles": list(STYLE_MODIFIERS.keys()),
        "default": "realistic"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)