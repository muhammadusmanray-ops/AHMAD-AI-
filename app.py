import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Ahmed AI - Islamic Voice Assistant",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Seamless full-screen CSS
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding: 0rem !important;
        margin: 0rem !important;
        max-width: 100% !important;
    }
</style>
""", unsafe_allow_html=True)

# Embed with explicit Microphone and Autoplay permissions
components.html("""
<iframe 
    src="https://ahmad-ai-ivory.vercel.app" 
    style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"
    allow="microphone; camera; autoplay; clipboard-write; encrypted-media; speaker; display-capture"
    allowfullscreen>
</iframe>
""", height=950, scrolling=False)
