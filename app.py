import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Ahmed AI - Islamic Voice Assistant",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for 100% full-screen immersive view
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0rem !important; margin: 0rem !important;}
    iframe {width: 100% !important; height: 100vh !important; border: none !important;}
</style>
""", unsafe_allow_html=True)

# Render complete Ahmed AI custom UI cleanly
components.iframe("https://ahmad-ai-ivory.vercel.app", height=900, scrolling=True)
