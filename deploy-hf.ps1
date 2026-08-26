# Ahmed AI - Hugging Face Deploy Script
Write-Host "Preparing static build for Hugging Face Space..." -ForegroundColor Cyan

# Create a temporary directory for clean deployment
$tempDir = Join-Path $PSScriptRoot "scratch\hf-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy compiled files from dist/ directly to the root of temp directory
Write-Host "Copying files from dist/..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $PSScriptRoot "dist\*") -Destination $tempDir -Recurse -Force

# Create Hugging Face Static Space README.md metadata
Write-Host "Creating Hugging Face metadata README.md..." -ForegroundColor Yellow
$readmeContent = @"
---
title: ahmadai
emoji: 🌙
colorFrom: green
colorTo: green
sdk: static
pinned: false
---
# Ahmed AI - Islamic Voice Assistant Space
Deployed statically on Hugging Face.
"@
$readmeContent | Out-File -FilePath (Join-Path $tempDir "README.md") -Encoding utf8

# Navigate to temp directory
Push-Location $tempDir

# Initialize clean git repository
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
git init
git checkout -b main
git config user.name "Ahmed AI Deployer"
git config user.email "deployer@ahmadai.internal"

# Configure Git LFS for PDF tracking
Write-Host "Configuring Git LFS for Quran PDF..." -ForegroundColor Yellow
git lfs install
git lfs track "*.pdf"
git add .gitattributes

# Add and commit all files
git add .
git commit -m "deploy: static build with pre-injected Gemini API Key and README"

# Add Hugging Face remote and push
Write-Host "Pushing static build to Hugging Face..." -ForegroundColor Yellow
git push -f https://huggingface.co/spaces/HEWJDEWJDBQWJDWEJ/ahmadai main

Pop-Location
Write-Host "Deployment command completed! If prompted, enter your Hugging Face username and Write Access Token." -ForegroundColor Green
