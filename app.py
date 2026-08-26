import os
import subprocess
import time
import streamlit as st

st.set_page_config(
    page_title="Ahmed AI - Islamic Voice Assistant",
    page_icon="🌙",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for clean full-screen experience
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0rem !important;}
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def run_node_server():
    env = os.environ.copy()
    env["PORT"] = "8501"
    # Build frontend and start Express/TypeScript backend
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        proc = subprocess.Popen(["npx", "tsx", "server.ts"], env=env)
        return proc
    except Exception as e:
        st.error(f"Server startup error: {e}")
        return None

# Start backend server
run_node_server()

st.title("🌙 Ahmed AI - Islamic Voice Assistant")
st.info("Ahmed AI Server is active and running on Streamlit Cloud!")
