import os
import io
import json
import base64
import requests
import streamlit as st
import google.generativeai as genai
from gtts import gTTS

# Set Streamlit Page Configuration
st.set_page_config(
    page_title="Ahmed AI - Islamic Voice Assistant",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Islamic & Futuristic Glassmorphism CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Amiri:wght@400;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }
    
    .stApp {
        background: radial-gradient(circle at 10% 20%, rgba(6, 44, 37, 0.95) 0%, rgba(2, 17, 14, 0.98) 90%);
        color: #e2e8f0;
    }
    
    .header-box {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.25);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(12px);
        text-align: center;
    }
    
    .arabic-title {
        font-family: 'Amiri', serif;
        font-size: 2.2rem;
        color: #34d399;
        margin-bottom: 8px;
    }
    
    .glow-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #10b981 0%, #38bdf8 50%, #fbbf24 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.5px;
    }
    
    .card-box {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(51, 65, 85, 0.5);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        backdrop-filter: blur(10px);
    }
    
    .hadith-card {
        background: rgba(30, 41, 59, 0.7);
        border-left: 4px solid #10b981;
        border-radius: 12px;
        padding: 18px;
        margin-top: 14px;
    }
    
    .verse-box {
        font-family: 'Amiri', serif;
        font-size: 1.6rem;
        direction: rtl;
        text-align: right;
        color: #fcd34d;
        line-height: 2.2;
        padding: 16px;
        background: rgba(6, 78, 59, 0.2);
        border-radius: 12px;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
</style>
""", unsafe_allow_html=True)

# Retrieve API Key from Streamlit Secrets or Environment
api_key = st.secrets.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

SYSTEM_PROMPT = """
You are Ahmed AI, an authentic, wise, polite, and deeply knowledgeable Islamic AI Assistant built by Muhammad Usman (AI/ML Engineer).
You converse fluently in natural Urdu, Roman Urdu, and English.

CRITICAL MANDATES:
1. STRICT ISLAMIC GUARDRAILS: You only answer queries regarding Islam, Quran, Hadith, Sunnah, Islamic jurisprudence (Fiqh), Prayer Times, Duas, and Prophets' stories. If asked about unrelated topics (like pop-culture, general coding, politics, math), politely decline, stating you are an Islamic Voice Assistant.
2. SUNNAH & QURAN REFERENCES: Whenever quoting a Hadith or Ayah, cite the authentic book name (e.g. Sahih Bukhari, Sahih Muslim, Jami at-Tirmidhi) with reference numbers.
3. CONVERSATIONAL TONE: Keep your spoken answers clear, inspiring, respectful, and natural.
"""

def generate_voice_audio(text: str) -> bytes:
    """Generates natural spoken audio for the AI response."""
    try:
        # Detect whether response has Urdu or English characters
        tts = gTTS(text=text, lang='ur' if any(ord(c) > 128 for c in text) else 'en', slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        st.warning(f"Voice synthesis note: {e}")
        return None

# Top Banner
st.markdown("""
<div class="header-box">
    <div class="arabic-title">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
    <div class="glow-title">🌙 AHMED AI - ISLAMIC VOICE & KNOWLEDGE ASSISTANT</div>
    <p style="color: #94a3b8; font-size: 1rem; margin-top: 6px;">Powered by Google Gemini 2.0 Flash • 24/7 Authentic Quran & Hadith Intelligence</p>
</div>
""", unsafe_allow_html=True)

# Layout Columns
col_main, col_quran = st.columns([1.2, 0.8])

with col_main:
    st.markdown('<div class="card-box">', unsafe_allow_html=True)
    st.subheader("🎙️ Ask Ahmed AI (Voice / Text)")
    
    # Pre-set Islamic Quick Prompts
    st.write("**Quick Islamic Questions:**")
    qc1, qc2, qc3 = st.columns(3)
    preset_prompt = None
    if qc1.button("✨ Salam Alaikum"):
        preset_prompt = "Salam Alaikum! Tell me about yourself and your capabilities."
    if qc2.button("📖 Virtues of Surah Mulk"):
        preset_prompt = "What are the virtues and Hadith benefits of reciting Surah Al-Mulk daily?"
    if qc3.button("🤲 Dua for Protection"):
        preset_prompt = "What is the authentic Dua taught by Prophet Muhammad (PBUH) for morning and evening protection?"

    user_query = st.text_input(
        "Type your question or question in Roman Urdu / Urdu / English:",
        value=preset_prompt if preset_prompt else "",
        placeholder="e.g. Bukhari Hadith 1 ki wazahat karein, ya Tahajjud ki fazeelat batayein..."
    )

    if st.button("🚀 Ask Ahmed AI", type="primary", use_container_width=True) or preset_prompt:
        query_to_send = user_query.strip() if user_query.strip() else preset_prompt
        if not query_to_send:
            st.warning("Please type a question or select a prompt!")
        elif not api_key:
            st.error("⚠️ Please configure GEMINI_API_KEY in Streamlit Secrets (Settings > Secrets)!")
        else:
            with st.spinner("Ahmed AI is generating authentic response..."):
                try:
                    model = genai.GenerativeModel(
                        model_name="gemini-2.0-flash",
                        system_instruction=SYSTEM_PROMPT
                    )
                    response = model.generate_content(query_to_send)
                    ans_text = response.text
                    
                    st.markdown("### 💬 Ahmed AI's Response:")
                    st.markdown(ans_text)
                    
                    # Generate and play natural spoken voice
                    with st.spinner("Generating spoken voice..."):
                        audio_bytes = generate_voice_audio(ans_text[:400])
                        if audio_bytes:
                            st.audio(audio_bytes, format="audio/mp3", autoplay=True)
                            
                except Exception as ex:
                    st.error(f"Error querying Gemini: {ex}")
                    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Authentic Hadith Verification Lookup
    st.markdown('<div class="card-box">', unsafe_allow_html=True)
    st.subheader("📚 Authentic Hadith Lookup (Sunnah.com Verified)")
    h_col1, h_col2 = st.columns([1, 1])
    with h_col1:
        book_select = st.selectbox("Select Hadith Book:", ["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah"])
    with h_col2:
        hadith_no = st.number_input("Hadith Number:", min_value=1, max_value=7500, value=1)
        
    if st.button("🔍 Fetch Authentic Hadith", use_container_width=True):
        with st.spinner(f"Fetching Hadith #{hadith_no} from {book_select.capitalize()}..."):
            try:
                editions_map = {
                    "bukhari": "urd-bukhari",
                    "muslim": "urd-muslim",
                    "tirmidhi": "urd-tirmidhi",
                    "abudawud": "urd-abudawud",
                    "nasai": "urd-nasai",
                    "ibnmajah": "urd-ibnmajah"
                }
                ed = editions_map.get(book_select, "urd-bukhari")
                res = requests.get(f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{ed}/{hadith_no}.json", timeout=8)
                if res.status_code == 200:
                    h_data = res.json()
                    h_text = h_data.get("hadiths", [{}])[0].get("text", "Text not found.")
                    st.markdown(f"""
                    <div class="hadith-card">
                        <h4 style="color: #38bdf8; margin: 0 0 8px 0;">📖 Sahih {book_select.capitalize()} — Hadith #{hadith_no}</h4>
                        <p style="font-size: 1.05rem; line-height: 1.8; color: #f1f5f9;">{h_text}</p>
                        <a href="https://sunnah.com/{book_select}:{hadith_no}" target="_blank" style="color: #34d399; font-weight: 600; text-decoration: none;">🔗 Verify on Sunnah.com ↗</a>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.warning(f"Hadith #{hadith_no} not found in this edition.")
            except Exception as e:
                st.error(f"Hadith lookup error: {e}")
    st.markdown('</div>', unsafe_allow_html=True)

with col_quran:
    st.markdown('<div class="card-box">', unsafe_allow_html=True)
    st.subheader("🎧 Full Quran Audio Player")
    
    reciters = {
        "Mishary Rashid Alafasy": "https://server8.mp3quran.net/afs/",
        "Abdul Basit (Murattal)": "https://server7.mp3quran.net/basit/",
        "Abdur-Rahman As-Sudais": "https://server11.mp3quran.net/sds/",
        "Saad Al-Ghamdi": "https://server7.mp3quran.net/s_gmd/",
        "Maher Al-Muaiqly": "https://server12.mp3quran.net/maher/",
        "Islam Sobhi": "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/"
    }
    
    selected_reciter_name = st.selectbox("Select Qari / Reciter:", list(reciters.keys()))
    
    surahs = [
        (1, "Al-Fatihah (الفاتحة)"), (2, "Al-Baqarah (البقرة)"), (3, "Ali 'Imran (آل عمران)"),
        (18, "Al-Kahf (الكهف)"), (36, "Ya-Sin (يس)"), (55, "Ar-Rahman (الرحمن)"),
        (56, "Al-Waqi'ah (الواقعة)"), (67, "Al-Mulk (الملك)"), (112, "Al-Ikhlas (الإخلاص)"),
        (113, "Al-Falaq (الفلق)"), (114, "An-Nas (الناس)")
    ]
    
    surah_choice = st.selectbox("Select Surah:", surahs, format_func=lambda x: f"{x[0]}. {x[1]}")
    surah_num = surah_choice[0]
    
    # Format 3-digit surah code (e.g., 001, 067)
    surah_code = f"{surah_num:03d}.mp3"
    audio_url = f"{reciters[selected_reciter_name]}{surah_code}"
    
    st.write(f"**Now Playing:** Surah {surah_choice[1]} by *{selected_reciter_name}*")
    st.audio(audio_url)
    
    # Display Arabic Verse Sample
    st.markdown('<div class="verse-box">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ<br>تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ</div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
