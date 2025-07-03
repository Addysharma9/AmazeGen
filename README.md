# ✨ AmazeGen — Transforming Text into Visual Magic with AI

**AmazeGen** is a powerful AI-powered image generation system that turns natural language prompts into stunning, high-quality visuals — from cinematic realism to dreamy fantasy and beyond.

Powered by the **Juggernaut XL v11** model, it combines the precision of diffusion-based rendering with prompt-driven creativity. Whether you're building art for a game, website, story, or product — AmazeGen helps you bring imagination to life in just seconds.

---

## ⚙️ Features

- 🎨 **Prompt-to-Image Generation**  
  Turn your ideas into vivid visuals using natural language.

- 🧠 **Juggernaut XL v11 at Its Core**  
  Enhanced with one of the most powerful SDXL-based models.

- 📐 **Custom Styles, Aspect Ratios, and Quality Levels**  
  Fine-tune your output for social, cinematic, or fantasy content.

- 🚀 **FastAPI + React Frontend Integration**  
  Plug-and-play API access for websites, tools, or creative workflows.

- 🖼️ **Instant Preview + Download**  
  Generate, preview, and save your images with ease.

---

## 🛠️ Tech Stack

- 🧠 [Diffusers](https://huggingface.co/docs/diffusers) (Stable Diffusion XL)
- 🔥 PyTorch with CUDA support
- ⚙️ FastAPI for image generation APIs
- ⚡ React + TailwindCSS for responsive frontend
- 📦 Blob/Image Streaming with Base64 download support

---

## 💼 Use Cases

- Creative tools for designers & developers  
- AI-generated content for marketing & branding  
- Fast prototyping for games, comics, and storytelling  
- Just-for-fun visual exploration!  

---

## 🖥 How to Run Locally

### ✅ Prerequisites

- Python 3.9+
- Node.js 16+
- CUDA-enabled GPU (recommended for performance)

---

### 🔧 Backend Setup (FastAPI)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/amaze-gen
cd amaze-gen

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate  # On Windows
# For Mac/Linux use: source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Run the FastAPI server
uvicorn gen2:app --host 0.0.0.0 --port 8000
```
### 🔧 Backend Setup (FastAPI)
```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Run the development server
npm run dev
```
### ✍️ Prompt Examples
```txt
A futuristic cityscape under a neon-lit sky, cyberpunk style, volumetric lighting, ultra-detailed
```
